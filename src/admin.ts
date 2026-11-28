import { ensureFreshToken, SUPA_URL, SUPA_KEY } from './auth';

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
    category: 'basic' | 'special';
    track: string | null;
    year: number | null;
    perms: 'full' | 'upload_only';
}

export interface FileRow {
    id: number;
    faculty: string;
    category: 'basic' | 'special';
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

/* The four buttons inside every course page; file kind ids map to them. */
export const COURSE_BUTTONS: { kind: string; res: string; ar: string }[] = [
    { kind: 'exam', res: 'exams', ar: 'امتحانات سابقة' },
    { kind: 'lecture', res: 'lectures', ar: 'المحاضرات' },
    { kind: 'slides', res: 'slides', ar: 'سلايدات الدكتور' },
    { kind: 'book', res: 'book', ar: 'كتاب الكلية' },
];

export const courseLabel = (c: [string, string]) => (c[0] ? `${c[0]} ${c[1]}` : c[1]);

export const MAX_FILE_BYTES = 70 * 1024 * 1024;

const ACCEPT_EXT = /\.(pdf|docx?|pptx?|xlsx?|jpe?g|png|webp)$/i;

/* Every call renews the access token first (ensureFreshToken); a 401 after a
   fresh token means the session is truly dead — the auth layer has already
   dropped it and the app returns to sign-in. */
async function rest(path: string, init?: RequestInit): Promise<Response> {
    const attempt = async () => {
        const at = await ensureFreshToken();
        return fetch(`${SUPA_URL}/rest/v1${path}`, {
            ...init,
            headers: {
                apikey: SUPA_KEY,
                Authorization: `Bearer ${at}`,
                'Content-Type': 'application/json',
                ...((init && init.headers) || {}),
            },
        });
    };
    let r = await attempt();
    if (r.status === 401) r = await attempt(); // one retry with a renewed token
    if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.message || 'حدث خطأ غير متوقع. أعد المحاولة.');
    }
    return r;
}

/* RLS returns the caller's own grants; the super admin sees all of them. */
export async function myGrants(): Promise<Grant[]> {
    const r = await rest('/admin_grants?select=id,email,scope,faculty,category,track,year,perms&order=created_at.desc');
    return r.json();
}

export async function addGrant(g: Omit<Grant, 'id'>): Promise<void> {
    await rest('/admin_grants', { method: 'POST', body: JSON.stringify(g) });
}

export async function removeGrant(id: number): Promise<void> {
    await rest(`/admin_grants?id=eq.${id}`, { method: 'DELETE' });
}

/* Faculty admins do not write grants; they send a request that the super
   admin approves. The database functions enforce this, not the page. */
export interface AdminRequest {
    id: number;
    action: 'add' | 'remove';
    target_email: string;
    scope: Scope | null;
    faculty: string;
    category: 'basic' | 'special';
    track: string | null;
    year: number | null;
    perms: 'full' | 'upload_only';
    status: 'pending' | 'approved' | 'rejected';
    requested_by: string;
    note: string | null;
    created_at: string;
}

export async function listRequests(): Promise<AdminRequest[]> {
    const r = await rest('/admin_requests?select=id,action,target_email,scope,faculty,category,track,year,perms,status,requested_by,note,created_at&order=created_at.desc&limit=200');
    return r.json();
}

export async function requestAdd(g: { email: string; scope: Scope; faculty: string; category: string; track: string | null; year: number | null; perms: string }): Promise<void> {
    await rest('/rpc/request_grant_add', {
        method: 'POST',
        body: JSON.stringify({ p_email: g.email, p_scope: g.scope, p_faculty: g.faculty, p_category: g.category, p_track: g.track, p_year: g.year, p_perms: g.perms }),
    });
}

export async function requestRemove(grantId: number): Promise<void> {
    await rest('/rpc/request_grant_remove', { method: 'POST', body: JSON.stringify({ p_grant_id: grantId }) });
}

export async function approveRequest(id: number): Promise<void> {
    await rest('/rpc/approve_request', { method: 'POST', body: JSON.stringify({ p_id: id }) });
}

export async function rejectRequest(id: number): Promise<void> {
    await rest('/rpc/reject_request', { method: 'POST', body: JSON.stringify({ p_id: id }) });
}

/* Delete needs full rights; upload-only admins never see the delete button. */
export function canDelete(grants: Grant[], isSuper: boolean, faculty: string, department: string, year: number): boolean {
    if (isSuper) return true;
    return grants.some((g) => g.perms !== 'upload_only' && g.faculty === faculty && (
        g.scope === 'faculty'
        || (g.scope === 'track' && g.track === department)
        || (g.scope === 'cohort' && g.track === department && g.year === year)
    ));
}

export interface AccountRow {
    id: string;
    full_name: string;
    email: string;
    role: string;
    faculty: string | null;
    department: string | null;
    year: number | null;
    created_at: string;
}

/* RLS limits this to the super admin (profiles_select_super policy). */
export async function listAccounts(): Promise<AccountRow[]> {
    const r = await rest('/profiles?select=id,full_name,email,role,faculty,department,year,created_at&order=created_at.desc&limit=1000');
    return r.json();
}

export async function listFiles(): Promise<FileRow[]> {
    const r = await rest('/files?select=id,faculty,category,department,year,course_code,title,kind,size_bytes,status,created_at&order=created_at.desc&limit=300');
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
    category: 'basic' | 'special';
    department: string;
    year: number;
    course_code: string;
    title: string;
    kind: string;
}

export function validateUpload(file: File): string {
    if (file.size > MAX_FILE_BYTES) return 'الملف أكبر من ٧٠ ميجابايت.';
    if (file.type && !/^(application\/(pdf|msword|vnd\.|)|image\/(jpeg|png|webp))/.test(file.type) && !ACCEPT_EXT.test(file.name)) {
        return 'نوع الملف غير مدعوم. PDF أو ملفات Office أو صور فقط.';
    }
    return '';
}

export async function uploadCourseFile(meta: UploadMeta, file: File): Promise<FileRow> {
    const form = new FormData();
    form.set('faculty', meta.faculty);
    form.set('category', meta.category);
    form.set('department', meta.department);
    form.set('year', String(meta.year));
    form.set('course_code', meta.course_code);
    form.set('title', meta.title);
    form.set('kind', meta.kind);
    form.set('file', file);
    const at = await ensureFreshToken();
    const r = await fetch(`${WORKER}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${at}` },
        body: form,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'تعذر رفع الملف. أعد المحاولة.');
    return data.file;
}

export async function deleteFile(id: number): Promise<void> {
    const at = await ensureFreshToken();
    const r = await fetch(`${WORKER}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'تعذر حذف الملف. أعد المحاولة.');
}

export async function fileUrl(id: number): Promise<string> {
    const at = await ensureFreshToken();
    const r = await fetch(`${WORKER}/file-url?id=${id}`, {
        headers: { Authorization: `Bearer ${at}` },
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

/* Root (original) super admin only. The database enforces it. */
export async function isRoot(): Promise<boolean> {
    try {
        const r = await rest('/rpc/is_root', { method: 'POST', body: '{}' });
        return (await r.json()) === true;
    } catch { return false; }
}

export async function setSuper(email: string, on: boolean): Promise<void> {
    await rest('/rpc/set_super', { method: 'POST', body: JSON.stringify({ p_email: email, p_on: on }) });
}
