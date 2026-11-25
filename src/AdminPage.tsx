import React from 'react';
import { Link } from '@instinct/files';
import { Icon } from './Icon';
import { useAuth } from './auth';
import { DEPARTMENTS, PROGRAMS, FACULTIES, YEAR_NAMES } from './data';
import {
    Grant, FileRow, Scope, FILE_KINDS, AccountRow,
    myGrants, addGrant, removeGrant, listFiles, listAccounts, canManage,
    uploadCourseFile, deleteFile, fileUrl, validateUpload, fmtSize,
} from './admin';

/* لوحة المشرفين: رفع ملفات المقررات ضمن نطاق صلاحية المشرف، وإدارة المشرفين
   للسوبر أدمن. التحقق الحقيقي في قاعدة البيانات (RLS)؛ هذه الصفحة تعرض فقط. */

const SCOPES: { id: Scope; ar: string }[] = [
    { id: 'cohort', ar: 'دفعة (قسم + سنة)' },
    { id: 'track', ar: 'قسم كامل (كل السنوات)' },
    { id: 'faculty', ar: 'كلية كاملة' },
];

const facultyName = (id: string) => {
    const f = FACULTIES.find((x) => x.id === id);
    return f ? `${f.ar} — ${f.city}` : id;
};
const deptName = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.ar || id;
const progName = (id: string) => PROGRAMS.find((p) => p.id === id)?.ar || id;
const trackName = (category: string, id: string) => category === 'special' ? progName(id) : deptName(id);
const trackKind = (category: string) => category === 'special' ? 'برنامج' : 'قسم';
const kindName = (id: string) => FILE_KINDS.find((k) => k.id === id)?.ar || id;
const scopeLabel = (g: Grant) => {
    const cat = g.category || 'basic';
    if (g.scope === 'faculty') return `كلية ${facultyName(g.faculty)}`;
    if (g.scope === 'track') return `${trackKind(cat)} ${trackName(cat, g.track || '')} — ${facultyName(g.faculty)}`;
    return `${trackKind(cat)} ${trackName(cat, g.track || '')}، ${YEAR_NAMES[g.year || 1]} — ${facultyName(g.faculty)}`;
};

function Select({ value, onChange, children, label }: {
    value: string; onChange: (v: string) => void; children: React.ReactNode; label: string;
}) {
    return <label className="azu-field">{label}
        <select className="azu-input" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </label>;
}

function Uploader({ grants, isSuper, onUploaded }: { grants: Grant[]; isSuper: boolean; onUploaded: (f: FileRow) => void }) {
    const [faculty, setFaculty] = React.useState('');
    const [category, setCategory] = React.useState<'basic' | 'special'>('basic');
    const [department, setDepartment] = React.useState('');
    const [year, setYear] = React.useState('');
    const [course, setCourse] = React.useState('');
    const [kind, setKind] = React.useState('lecture');
    const [title, setTitle] = React.useState('');
    const [file, setFile] = React.useState<File | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    const [ok, setOk] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const depts = DEPARTMENTS.filter((d) => !d.onlyFaculties || d.onlyFaculties.includes(faculty));
    const tracks = category === 'special' ? PROGRAMS : depts;
    const allowed = (f: string, d: string, y: number) => canManage(grants, isSuper, f, d, y);
    const years = [1, 2, 3, 4].filter((y) => !faculty || !department || allowed(faculty, department, y));

    const ready = faculty && department && year && course.trim() && file && !busy;

    const upload = async () => {
        if (!ready || !file) return;
        setErr(''); setOk('');
        const bad = validateUpload(file);
        if (bad) { setErr(bad); return; }
        setBusy(true);
        try {
            const row = await uploadCourseFile({
                faculty, category, department, year: Number(year),
                course_code: course.trim(), title: title.trim() || file.name, kind,
            }, file);
            setOk(`تم رفع «${row.title}» وأصبح متاحًا للطلاب.`);
            setFile(null); setTitle(''); setCourse('');
            onUploaded(row);
        } catch (ex) {
            setErr(ex instanceof Error ? ex.message : 'تعذر رفع الملف. أعد المحاولة.');
        } finally { setBusy(false); }
    };
    const enter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') upload(); };

    return <div className="azu-admin-card" dir="rtl">
        <h3 className="azu-admin-h">رفع ملف مقرر</h3>
        <div className="azu-admin-grid">
            <Select value={faculty} label="الكلية" onChange={(v) => { setFaculty(v); setDepartment(''); }}>
                <option value="">اختار الكلية…</option>
                {FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.ar} — {f.city}</option>)}
            </Select>
            <Select value={category} label="النوع" onChange={(v) => { setCategory(v as 'basic' | 'special'); setDepartment(''); }}>
                <option value="basic">قسم أساسي</option>
                <option value="special">برنامج متميز</option>
            </Select>
            <Select value={department} label={category === 'special' ? 'البرنامج' : 'القسم'} onChange={(v) => setDepartment(v)}>
                <option value="">{category === 'special' ? 'اختار البرنامج…' : 'اختار القسم…'}</option>
                {tracks.map((d) => <option key={d.id} value={d.id}>{d.ar}</option>)}
            </Select>
            <Select value={year} label="السنة" onChange={(v) => setYear(v)}>
                <option value="">اختار السنة…</option>
                {years.map((y) => <option key={y} value={y}>{YEAR_NAMES[y]}</option>)}
            </Select>
            <Select value={kind} label="نوع الملف" onChange={setKind}>
                {FILE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.ar}</option>)}
            </Select>
        </div>
        {faculty && department && year && !allowed(faculty, department, Number(year)) &&
            <p className="azu-admin-err" role="alert">هذا الاختيار خارج نطاق صلاحيتك.</p>}
        <label className="azu-field">اسم المقرر
            <input className="azu-input" value={course} onChange={(e) => setCourse(e.target.value)} onKeyDown={enter} placeholder="مثال: كيميا عضوية" />
        </label>
        <label className="azu-field">عنوان الملف (اختياري؛ يُستخدم اسم الملف تلقائيًا)
            <input className="azu-input" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={enter} placeholder="مثال: امتحان منتصف العام ٢٠٢٥" />
        </label>
        <input ref={inputRef} type="file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            onChange={(e) => { const f = e.target.files?.[0] || null; e.target.value = ''; setFile(f); setErr(f ? validateUpload(f) : ''); }} />
        <div className="azu-admin-filepick">
            <button type="button" className="azu-btn azu-btn-outline" onClick={() => inputRef.current?.click()}>
                <Icon name="upload" size={15} /> {file ? 'تغيير الملف' : 'اختيار الملف'}
            </button>
            {file && <span className="azu-admin-filename">{file.name} ({fmtSize(file.size)})</span>}
        </div>
        <p className="azu-admin-note">PDF أو ملفات Office أو صور، بحد أقصى ٧٠ ميجابايت. يظهر الملف للطلاب فور رفعه.</p>
        {err && <p className="azu-admin-err" role="alert">{err}</p>}
        {ok && <p className="azu-admin-ok" role="status">{ok}</p>}
        <button type="button" className="azu-btn azu-btn-primary" disabled={!ready} onClick={upload}>
            <Icon name="upload" size={15} /> {busy ? 'جارٍ الرفع…' : 'رفع الملف'}
        </button>
    </div>;
}

function FilesList({ grants, isSuper, files, setFiles }: {
    grants: Grant[]; isSuper: boolean; files: FileRow[]; setFiles: (f: FileRow[]) => void;
}) {
    const [confirmId, setConfirmId] = React.useState(0);
    const [busyId, setBusyId] = React.useState(0);
    const [err, setErr] = React.useState('');
    const mine = files.filter((f) => canManage(grants, isSuper, f.faculty, f.department, f.year));

    const open = async (id: number) => {
        setErr('');
        try { window.open(await fileUrl(id), '_blank'); }
        catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذر فتح الملف.'); }
    };
    const remove = async (id: number) => {
        setBusyId(id); setErr('');
        try {
            await deleteFile(id);
            setFiles(files.filter((f) => f.id !== id));
        } catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذر حذف الملف.'); }
        finally { setBusyId(0); setConfirmId(0); }
    };

    return <div className="azu-admin-card" dir="rtl">
        <h3 className="azu-admin-h">الملفات ضمن نطاقك ({mine.length})</h3>
        {err && <p className="azu-admin-err" role="alert">{err}</p>}
        {mine.length === 0 && <p className="azu-admin-note">لا توجد ملفات بعد.</p>}
        {mine.map((f) => <div key={f.id} className="azu-admin-row">
            <div className="azu-admin-row-main">
                <span className="azu-admin-row-title">{f.title}</span>
                <span className="azu-admin-row-meta">
                    {kindName(f.kind)} · {f.course_code} · {trackName(f.category || 'basic', f.department)} · {YEAR_NAMES[f.year]} · {facultyName(f.faculty)} · {fmtSize(f.size_bytes)}
                </span>
            </div>
            <div className="azu-admin-row-actions">
                <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" onClick={() => open(f.id)} disabled={busyId === f.id}>فتح</button>
                {confirmId === f.id
                    ? <button type="button" className="azu-btn azu-btn-danger azu-btn-sm" onClick={() => remove(f.id)} disabled={busyId === f.id}>
                        {busyId === f.id ? 'جارٍ الحذف…' : 'تأكيد الحذف'}
                    </button>
                    : <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" onClick={() => setConfirmId(f.id)}>حذف</button>}
            </div>
        </div>)}
    </div>;
}

function GrantsManager({ grants, reload }: { grants: Grant[]; reload: () => Promise<void> }) {
    const [email, setEmail] = React.useState('');
    const [scope, setScope] = React.useState<Scope>('cohort');
    const [faculty, setFaculty] = React.useState('boys-cairo');
    const [category, setCategory] = React.useState<'basic' | 'special'>('basic');
    const [department, setDepartment] = React.useState('');
    const [year, setYear] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    const [ok, setOk] = React.useState('');

    const depts = DEPARTMENTS.filter((d) => !d.onlyFaculties || d.onlyFaculties.includes(faculty));
    const tracks = category === 'special' ? PROGRAMS : depts;
    const ready = email.includes('@') && faculty && (scope === 'faculty' || (department && (scope === 'track' || year)));

    const add = async () => {
        if (!ready || busy) return;
        setBusy(true); setErr(''); setOk('');
        try {
            await addGrant({
                email: email.trim().toLowerCase(), scope, faculty, category,
                track: scope === 'faculty' ? null : department,
                year: scope === 'cohort' ? Number(year) : null,
            });
            setOk(`أُضيف ${email.trim()} مشرفًا.`);
            setEmail('');
            await reload();
        } catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذرت الإضافة. أعد المحاولة.'); }
        finally { setBusy(false); }
    };
    const remove = async (id: number) => {
        setErr('');
        try { await removeGrant(id); await reload(); }
        catch { setErr('تعذر الحذف. أعد المحاولة.'); }
    };
    const enter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') add(); };

    return <div className="azu-admin-card" dir="rtl">
        <h3 className="azu-admin-h">إدارة المشرفين</h3>
        <p className="azu-admin-note">عيّن مشرفًا ببريده الإلكتروني، حتى لو لم يسجّل حسابه بعد؛ تُطبَّق صلاحيته عند أول تسجيل دخول.</p>
        <label className="azu-field">البريد الإلكتروني للطالب
            <input className="azu-input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={enter} placeholder="student@example.com" />
        </label>
        <div className="azu-admin-grid">
            <Select value={scope} label="نطاق الصلاحية" onChange={(v) => setScope(v as Scope)}>
                {SCOPES.map((s) => <option key={s.id} value={s.id}>{s.ar}</option>)}
            </Select>
            <Select value={faculty} label="الكلية" onChange={(v) => { setFaculty(v); setDepartment(''); }}>
                {FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.ar} — {f.city}</option>)}
            </Select>
            {scope !== 'faculty' && <Select value={category} label="النوع" onChange={(v) => { setCategory(v as 'basic' | 'special'); setDepartment(''); }}>
                <option value="basic">قسم أساسي</option>
                <option value="special">برنامج متميز</option>
            </Select>}
            {scope !== 'faculty' && <Select value={department} label={category === 'special' ? 'البرنامج' : 'القسم'} onChange={setDepartment}>
                <option value="">{category === 'special' ? 'اختار البرنامج…' : 'اختار القسم…'}</option>
                {tracks.map((d) => <option key={d.id} value={d.id}>{d.ar}</option>)}
            </Select>}
            {scope === 'cohort' && <Select value={year} label="السنة" onChange={setYear}>
                <option value="">اختار السنة…</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{YEAR_NAMES[y]}</option>)}
            </Select>}
        </div>
        {err && <p className="azu-admin-err" role="alert">{err}</p>}
        {ok && <p className="azu-admin-ok" role="status">{ok}</p>}
        <button type="button" className="azu-btn azu-btn-primary" disabled={!ready || busy} onClick={add}>
            <Icon name="user" size={15} /> {busy ? 'جارٍ الإضافة…' : 'إضافة المشرف'}
        </button>
        <div className="azu-admin-grants">
            {grants.map((g) => <div key={g.id} className="azu-admin-row">
                <div className="azu-admin-row-main">
                    <span className="azu-admin-row-title" dir="ltr">{g.email}</span>
                    <span className="azu-admin-row-meta">{scopeLabel(g)}</span>
                </div>
                <div className="azu-admin-row-actions">
                    <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" onClick={() => remove(g.id)}>إزالة</button>
                </div>
            </div>)}
            {grants.length === 0 && <p className="azu-admin-note">لا يوجد مشرفون معيّنون بعد.</p>}
        </div>
    </div>;
}

/* الحسابات المسجلة: للسوبر أدمن فقط. القراءة محمية بسياسة RLS
   (profiles_select_super)؛ غير السوبر لا تصله البيانات أصلًا. */
function AccountsSection({ grants }: { grants: Grant[] }) {
    const [accounts, setAccounts] = React.useState<AccountRow[] | null>(null);
    const [err, setErr] = React.useState('');
    const [q, setQ] = React.useState('');

    React.useEffect(() => {
        listAccounts().then(setAccounts).catch((ex) => setErr(ex instanceof Error ? ex.message : 'تعذر تحميل الحسابات.'));
    }, []);

    const needle = q.trim().toLowerCase();
    const shown = (accounts || []).filter((a: AccountRow) => !needle
        || (a.full_name || '').toLowerCase().includes(needle)
        || (a.email || '').toLowerCase().includes(needle));

    const academic = (a: AccountRow) => {
        const parts: string[] = [];
        if (a.department) parts.push(deptName(a.department));
        if (a.year) parts.push(YEAR_NAMES[a.year] || `السنة ${a.year}`);
        if (a.faculty) parts.push(facultyName(a.faculty));
        return parts.length ? parts.join(' · ') : '';
    };
    const fmtDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }); }
        catch { return ''; }
    };

    return <div className="azu-admin-card" dir="rtl">
        <h3 className="azu-admin-h">الحسابات المسجلة{accounts ? ` (${accounts.length})` : ''}</h3>
        <p className="azu-admin-note">كل الحسابات المسجلة على المنصة، الأحدث أولًا.</p>
        <input className="azu-input" type="search" dir="rtl" placeholder="ابحث بالاسم أو البريد…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        {err && <p className="azu-admin-err" role="alert">{err}</p>}
        {!accounts && !err && <p className="azu-admin-note">لحظات…</p>}
        <div className="azu-admin-grants">
            {shown.map((a: AccountRow) => {
                const grant = grants.find((g) => g.email === a.email);
                return <div key={a.id} className="azu-admin-row">
                    <div className="azu-admin-row-main">
                        <span className="azu-admin-row-title">
                            {a.full_name || 'بدون اسم'}
                            {a.role === 'admin' && <span className="azu-tag">مشرف</span>}
                        </span>
                        <span className="azu-admin-row-meta" dir="ltr">{a.email}</span>
                        {academic(a) && <span className="azu-admin-row-meta">{academic(a)}</span>}
                        {grant && <span className="azu-admin-row-meta">صلاحية مشرف: {scopeLabel(grant)}</span>}
                        <span className="azu-admin-row-meta">سجّل: {fmtDate(a.created_at)}</span>
                    </div>
                </div>;
            })}
            {accounts && shown.length === 0 && <p className="azu-admin-note">لا نتائج مطابقة.</p>}
        </div>
    </div>;
}

export function AdminPage() {
    const session = useAuth();
    const [grants, setGrants] = React.useState<Grant[] | null>(null);
    const [files, setFiles] = React.useState<FileRow[]>([]);
    const [loadErr, setLoadErr] = React.useState('');

    const isSuper = session?.user.role === 'admin';

    const reload = React.useCallback(async () => {
        try {
            const [g, f] = await Promise.all([myGrants(), listFiles()]);
            setGrants(g); setFiles(f);
        } catch (ex) {
            setLoadErr(ex instanceof Error ? ex.message : 'تعذر تحميل البيانات.');
        }
    }, []);

    React.useEffect(() => { if (session) reload(); }, [session, reload]);

    if (!session) {
        return <section className="azu-section azu-flow">
            <div className="azu-kicker">ADMIN PORTAL</div>
            <h2 className="azu-title">لوحة المشرفين</h2>
            <p dir="rtl">هذه الصفحة للمشرفين فقط. سجّل دخولك أولًا.</p>
            <p><Link to="/signin" className="azu-btn azu-btn-primary">تسجيل الدخول</Link></p>
        </section>;
    }

    if (grants === null && !loadErr) {
        return <section className="azu-section azu-flow">
            <div className="azu-kicker">ADMIN PORTAL</div>
            <h2 className="azu-title">لوحة المشرفين</h2>
            <p dir="rtl">لحظات…</p>
        </section>;
    }

    if (!isSuper && (grants || []).length === 0) {
        return <section className="azu-section azu-flow">
            <div className="azu-kicker">ADMIN PORTAL</div>
            <h2 className="azu-title">لوحة المشرفين</h2>
            <p dir="rtl">ليست لديك صلاحية مشرف. إن كنت تعتقد أن هذا خطأ، تواصل مع إدارة المنصة.</p>
        </section>;
    }

    return <section className="azu-section azu-flow">
        <div className="azu-kicker">ADMIN PORTAL</div>
        <h2 className="azu-title">لوحة المشرفين</h2>
        {loadErr && <p className="azu-admin-err" dir="rtl" role="alert">{loadErr}</p>}
        <Uploader grants={grants || []} isSuper={!!isSuper} onUploaded={(row) => setFiles([row, ...files])} />
        <FilesList grants={grants || []} isSuper={!!isSuper} files={files} setFiles={setFiles} />
        {isSuper && <GrantsManager grants={grants || []} reload={reload} />}
        {isSuper && <AccountsSection grants={grants || []} />}
    </section>;
}
