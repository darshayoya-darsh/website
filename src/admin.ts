import { getAuth, SUPA_URL, SUPA_KEY } from './auth';

/* Admin portal API: scoped admins manage course files; the super admin also
   manages the grants themselves. Metadata calls go to PostgREST under the
   caller's own JWT so Row Level Security enforces scope server-side; the
   binary itself moves through the Cloudflare Worker, which owns the B2 key. */

const WORKER = 'https://azu-science-agent.darshayoya.workers.dev';

export type Scope = 'cohort' | 'track' | 'faculty';

export interface Grant {
    id: number;
    email: string;
    scope: Scope;
    faculty: string;
    track: string | null;
    year: number | null;
}

export interface FileRow {
    id: number;
    faculty: string;
    department: string;
    year: number;
    course_code: string;
    title: string;
    kind: string;
    size_bytes: number;
    status: string;
    created_at: string;
}

export const FILE_KINDS: { id: string; ar: string }[] = [
    { id: 'exam', ar: 'امتحان سابق' },
    { id: 'lecture', ar: 'محاضرة' },
    { id: 'slides', ar: 'سلايدات الدكتور' },
    { id: 'book', ar: 'كتاب الكلية' },
    { id: 'other', ar: 'أخرى' },
];

export const MAX_FILE_BYTES = 100 * 1024 * 1024;

const ACCEPT_EXT = /\.(pdf|docx?|pptx?|xlsx?|jpe?g|png|webp)$/i;

function token(): string {
    const s = getAuth();
    if (!s) throw new Error('سجّل دخولك أولًا.');
    return s.access_token;
}

async function rest(path: string, init?: RequestInit) {
    const r = await fetch(`${SUPA_URL}/rest/v1${path}`, {
        ...init,
        headers: {
            apikey: SUPA_KEY,
            Authorization: `Bearer ${token()}`,
            'Content-Type': 'application/json',
            ...((init && init.headers) || {}),
        },
    });
    if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message || 'حدث خطأ غير متوقع. أعد المحاولة.');
    }
    return r;
}

/* RLS returns the caller's own grants; the super admin sees all of them. */
export async function myGrants(): Promise<Grant[]> {
    const r = await rest('/admin_grants?select=id,email,scope,faculty,track,year&order=created_at.desc');
    return r.json();
}

export async function addGrant(g: Omit<Grant, 'id'>): Promise<void> {
    await rest('/admin_grants', { method: 'POST', body: JSON.stringify(g) });
}

export async function removeGrant(id: number): Promise<void> {
    await rest(`/admin_grants?id=eq.${id}`, { method: 'DELETE' });
}

export async function listFiles(): Promise<FileRow[]> {
    const r = await rest('/files?select=id,faculty,department,year,course_code,title,kind,size_bytes,status,created_at&order=created_at.desc&limit=300');
    return r.json();
}

/* Client-side mirror of the database's can_manage; the database still
   enforces it. Used only to decide which rows show actions. */
export function canManage(grants: Grant[], isSuper: boolean, faculty: string, department: string, year: number): boolean {
    if (isSuper) return true;
    return grants.some((g) => g.faculty === faculty && (
        g.scope === 'faculty'
        || (g.scope === 'track' && g.track === department)
        || (g.scope === 'cohort' && g.track === department && g.year === year)
    ));
}

export interface UploadMeta {
    faculty: string;
    department: string;
    year: number;
    course_code: string;
    title: string;
    kind: string;
}

export function validateUpload(file: File): string {
    if (file.size > MAX_FILE_BYTES) return 'الملف أكبر من ١٠٠ ميجابايت.';
    if (file.type && !/^(application\/(pdf|msword|vnd\.|)|image\/(jpeg|png|webp))/.test(file.type) && !ACCEPT_EXT.test(file.name)) {
        return 'نوع الملف غير مدعوم. PDF أو ملفات Office أو صور فقط.';
    }
    return '';
}

export async function uploadCourseFile(meta: UploadMeta, file: File): Promise<FileRow> {
    const form = new FormData();
    form.set('faculty', meta.faculty);
    form.set('department', meta.department);
    form.set('year', String(meta.year));
    form.set('course_code', meta.course_code);
    form.set('title', meta.title);
    form.set('kind', meta.kind);
    form.set('file', file);
    const r = await fetch(`${WORKER}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: form,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'تعذر رفع الملف. أعد المحاولة.');
    return data.file;
}

export async function deleteFile(id: number): Promise<void> {
    const r = await fetch(`${WORKER}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'تعذر حذف الملف. أعد المحاولة.');
}

export async function fileUrl(id: number): Promise<string> {
    const r = await fetch(`${WORKER}/file-url?id=${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'تعذر فتح الملف. أعد المحاولة.');
    return data.url;
}

export function fmtSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ميجا`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} كيلو`;
    return `${bytes} بايت`;
}
