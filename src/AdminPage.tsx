import React from 'react';
import { Link } from '@instinct/files';
import { Icon } from './Icon';
import { useAuth } from './auth';
import { DEPARTMENTS, PROGRAMS, FACULTIES, YEAR_NAMES, TERM_NAMES } from './data';
import { BYLAW } from './bylaw';
import {
    Grant, FileRow, Scope, AdminRequest, FILE_KINDS, COURSE_BUTTONS, courseLabel, AccountRow,
    myGrants, addGrant, removeGrant, listFiles, listAccounts, canManage, canDelete,
    listRequests, requestAdd, requestRemove, approveRequest, rejectRequest, isRoot, setSuper,
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

function ConfirmDialog({ title, text, confirmLabel, busy, onConfirm, onCancel }: {
    title: string; text: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
    return <div className="azu-modal-back" role="presentation" onClick={onCancel}>
        <div className="azu-modal" role="alertdialog" aria-modal="true" aria-label={title} dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="azu-admin-h">{title}</h3>
            <p className="azu-admin-note">{text}</p>
            <div className="azu-modal-actions">
                <button type="button" className="azu-btn azu-btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'لحظات…' : confirmLabel}</button>
                <button type="button" className="azu-btn azu-btn-outline" onClick={onCancel} disabled={busy}>إلغاء</button>
            </div>
        </div>
    </div>;
}

const PERMS: { id: 'full' | 'upload_only'; ar: string }[] = [
    { id: 'upload_only', ar: 'رفع الملفات فقط' },
    { id: 'full', ar: 'رفع وحذف ملفات نطاقه' },
];
const permLabel = (p: string) => (p === 'upload_only' ? 'رفع الملفات فقط' : 'رفع وحذف');

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
    const [kind, setKind] = React.useState('');
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

    /* Courses come from the bylaw for the chosen department and year, so the
       admin picks a course instead of typing it. Programs have no bylaw list. */
    const courseOpts = React.useMemo(() => {
        if (category !== 'basic' || !department || !year) return [] as { label: string; sub: string }[];
        const seen = new Set<string>(); const out: { label: string; sub: string }[] = [];
        const tr = (BYLAW[department]?.[Number(year)] ?? []).filter((t) => faculty === 'boys-cairo' || !t.cairoOnly);
        for (const t of tr) for (const term of [1, 2]) for (const c of (term === 1 ? t.t1 : t.t2)) {
            const label = courseLabel(c);
            if (seen.has(label)) continue;
            seen.add(label);
            out.push({ label, sub: `${TERM_NAMES[term]}${tr.length > 1 ? ` — ${t.track}` : ''}` });
        }
        return out;
    }, [category, department, year, faculty]);
    const pickList = category === 'basic' && courseOpts.length > 0;
    const ready = faculty && department && year && course.trim() && kind && file && !busy;

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
            setFile(null); setTitle(''); setCourse(''); setKind('');
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
            <Select value={department} label={category === 'special' ? 'البرنامج' : 'القسم'} onChange={(v) => { setDepartment(v); setCourse(''); }}>
                <option value="">{category === 'special' ? 'اختار البرنامج…' : 'اختار القسم…'}</option>
                {tracks.map((d) => <option key={d.id} value={d.id}>{d.ar}</option>)}
            </Select>
            <Select value={year} label="السنة" onChange={(v) => { setYear(v); setCourse(''); }}>
                <option value="">اختار السنة…</option>
                {years.map((y) => <option key={y} value={y}>{YEAR_NAMES[y]}</option>)}
            </Select>
        </div>
        {faculty && department && year && !allowed(faculty, department, Number(year)) &&
            <p className="azu-admin-err" role="alert">هذا الاختيار خارج نطاق صلاحيتك.</p>}
        {pickList
            ? <Select value={course} label="المقرر" onChange={setCourse}>
                <option value="">اختار المقرر…</option>
                {courseOpts.map((o) => <option key={o.label} value={o.label}>{o.label} ({o.sub})</option>)}
            </Select>
            : <label className="azu-field">{category === 'special' ? 'اسم المقرر (البرنامج المتميز)' : 'المقرر'}
                <input className="azu-input" value={course} onChange={(e) => setCourse(e.target.value)} onKeyDown={enter} placeholder={department && year ? 'اكتب اسم المقرر' : 'اختار القسم والسنة الأول'} />
            </label>}
        <div className="azu-field">يتحط في أنهي زرار جوه المقرر؟
            <div className="azu-filters">
                {COURSE_BUTTONS.map((b) => <button key={b.kind} type="button" className={`azu-filter${kind === b.kind ? ' is-on' : ''}`} onClick={() => setKind(b.kind)}>{b.ar}</button>)}
            </div>
        </div>
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
                {canDelete(grants, isSuper, f.faculty, f.department, f.year) &&
                    <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" onClick={() => setConfirmId(f.id)}>حذف</button>}
            </div>
        </div>)}
        {confirmId !== 0 && <ConfirmDialog title="حذف الملف" text={`سيُحذف «${files.find((x) => x.id === confirmId)?.title || ''}» نهائيًا ولن يظهر للطلاب. لا يمكن التراجع.`}
            confirmLabel="تأكيد الحذف" busy={busyId === confirmId} onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(0)} />}
    </div>;
}

function GrantsManager({ grants, reload }: { grants: Grant[]; reload: () => Promise<void> }) {
    const [email, setEmail] = React.useState('');
    const [scope, setScope] = React.useState<Scope>('cohort');
    const [faculty, setFaculty] = React.useState('boys-cairo');
    const [category, setCategory] = React.useState<'basic' | 'special'>('basic');
    const [department, setDepartment] = React.useState('');
    const [year, setYear] = React.useState('');
    const [perms, setPerms] = React.useState<'full' | 'upload_only'>('full');
    const [rmId, setRmId] = React.useState(0);
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
                email: email.trim().toLowerCase(), scope, faculty, category, perms,
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
        finally { setRmId(0); }
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
            <Select value={perms} label="مستوى الصلاحية" onChange={(v) => setPerms(v as 'full' | 'upload_only')}>
                {PERMS.map((x) => <option key={x.id} value={x.id}>{x.ar}</option>)}
            </Select>
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
                    <span className="azu-admin-row-meta">{scopeLabel(g)} · {permLabel(g.perms)}</span>
                </div>
                <div className="azu-admin-row-actions">
                    <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" onClick={() => setRmId(g.id)}>إزالة</button>
                </div>
            </div>)}
            {grants.length === 0 && <p className="azu-admin-note">لا يوجد مشرفون معيّنون بعد.</p>}
        </div>
        {rmId !== 0 && <ConfirmDialog title="إزالة مشرف" text={`ستُسحب كل صلاحيات ${grants.find((x) => x.id === rmId)?.email || ''} فورًا.`}
            confirmLabel="تأكيد الإزالة" onConfirm={() => remove(rmId)} onCancel={() => setRmId(0)} />}
    </div>;
}

/* مشرف الكلية: لا يعدّل الصلاحيات مباشرة. يرسل طلب إضافة أو إزالة داخل كليته
   فقط، ولا يُطبَّق إلا بعد موافقة السوبر أدمن. */
function FacultyAdminsPanel({ grants, facultyIds, requests, reloadAll, dept }: {
    grants: Grant[]; facultyIds: string[]; requests: AdminRequest[]; reloadAll: () => Promise<void>; dept?: Grant;
}) {
    const [email, setEmail] = React.useState('');
    const [faculty, setFaculty] = React.useState(dept ? dept.faculty : facultyIds[0] || '');
    const [scope, setScope] = React.useState<Scope>('cohort');
    const [category, setCategory] = React.useState<'basic' | 'special'>(dept ? dept.category : 'basic');
    const [department, setDepartment] = React.useState(dept ? dept.track || '' : '');
    const [year, setYear] = React.useState('');
    const [perms, setPerms] = React.useState<'full' | 'upload_only'>('upload_only');
    const [rmId, setRmId] = React.useState(0);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    const [ok, setOk] = React.useState('');

    const depts = DEPARTMENTS.filter((d) => !d.onlyFaculties || d.onlyFaculties.includes(faculty));
    const tracks = category === 'special' ? PROGRAMS : depts;
    const ready = email.includes('@') && faculty && department && (scope === 'track' || year);
    const mine = dept
        ? grants.filter((g) => g.scope === 'cohort' && g.faculty === dept.faculty && g.category === dept.category && g.track === dept.track)
        : grants.filter((g) => facultyIds.includes(g.faculty) && g.scope !== 'faculty');
    const pendingRemove = new Set(requests.filter((r) => r.status === 'pending' && r.action === 'remove').map((r) => r.target_email + r.track + r.year));

    const send = async () => {
        if (!ready || busy) return;
        setBusy(true); setErr(''); setOk('');
        try {
            await requestAdd({ email: email.trim().toLowerCase(), scope, faculty, category, perms, track: department, year: scope === 'cohort' ? Number(year) : null });
            setOk('أُرسل الطلب للسوبر أدمن. لن يُطبَّق إلا بعد موافقته.');
            setEmail(''); await reloadAll();
        } catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذر إرسال الطلب.'); }
        finally { setBusy(false); }
    };
    const askRemove = async (id: number) => {
        setErr(''); setOk('');
        try { await requestRemove(id); setOk('أُرسل طلب الإزالة للسوبر أدمن.'); await reloadAll(); }
        catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذر إرسال الطلب.'); }
        finally { setRmId(0); }
    };

    return <div className="azu-admin-card" dir="rtl">
        <h3 className="azu-admin-h">{dept ? `مشرفو دفعات ${trackName(dept.category, dept.track || '')}` : 'مشرفو كليتك'}</h3>
        <p className="azu-admin-note">أي إضافة أو إزالة تُرسل للسوبر أدمن وتُطبَّق بعد موافقته فقط.</p>
        <label className="azu-field">البريد الإلكتروني للمشرف الجديد
            <input className="azu-input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" />
        </label>
        <div className="azu-admin-grid">
            {!dept && facultyIds.length > 1 && <Select value={faculty} label="الكلية" onChange={(v) => { setFaculty(v); setDepartment(''); }}>
                {facultyIds.map((f) => <option key={f} value={f}>{facultyName(f)}</option>)}
            </Select>}
            {!dept && <Select value={scope} label="النطاق" onChange={(v) => setScope(v as Scope)}>
                {SCOPES.filter((x) => x.id !== 'faculty').map((x) => <option key={x.id} value={x.id}>{x.ar}</option>)}
            </Select>}
            {!dept && <Select value={category} label="النوع" onChange={(v) => { setCategory(v as 'basic' | 'special'); setDepartment(''); }}>
                <option value="basic">قسم أساسي</option>
                <option value="special">برنامج متميز</option>
            </Select>}
            {!dept && <Select value={department} label={category === 'special' ? 'البرنامج' : 'القسم'} onChange={setDepartment}>
                <option value="">اختار…</option>
                {tracks.map((d) => <option key={d.id} value={d.id}>{d.ar}</option>)}
            </Select>}
            {scope === 'cohort' && <Select value={year} label="السنة" onChange={setYear}>
                <option value="">اختار السنة…</option>
                {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{YEAR_NAMES[y]}</option>)}
            </Select>}
            <Select value={perms} label="مستوى الصلاحية" onChange={(v) => setPerms(v as 'full' | 'upload_only')}>
                {PERMS.map((x) => <option key={x.id} value={x.id}>{x.ar}</option>)}
            </Select>
        </div>
        {err && <p className="azu-admin-err" role="alert">{err}</p>}
        {ok && <p className="azu-admin-ok" role="status">{ok}</p>}
        <button type="button" className="azu-btn azu-btn-primary" disabled={!ready || busy} onClick={send}>
            <Icon name="user" size={15} /> {busy ? 'جارٍ الإرسال…' : 'إرسال طلب إضافة'}
        </button>
        <div className="azu-admin-grants">
            {mine.map((g) => <div key={g.id} className="azu-admin-row">
                <div className="azu-admin-row-main">
                    <span className="azu-admin-row-title" dir="ltr">{g.email}</span>
                    <span className="azu-admin-row-meta">{scopeLabel(g)} · {permLabel(g.perms)}</span>
                </div>
                <div className="azu-admin-row-actions">
                    {pendingRemove.has(g.email + g.track + g.year)
                        ? <span className="azu-tag">بانتظار الموافقة</span>
                        : <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" onClick={() => setRmId(g.id)}>طلب إزالة</button>}
                </div>
            </div>)}
            {mine.length === 0 && <p className="azu-admin-note">لا يوجد مشرفون آخرون في كليتك.</p>}
        </div>
        {rmId !== 0 && <ConfirmDialog title="طلب إزالة مشرف" text={`سيُرسل طلب إزالة ${grants.find((x) => x.id === rmId)?.email || ''} للسوبر أدمن، ولا يُنفَّذ إلا بموافقته.`}
            confirmLabel="إرسال الطلب" onConfirm={() => askRemove(rmId)} onCancel={() => setRmId(0)} />}
    </div>;
}

const reqText = (r: AdminRequest) => `${r.action === 'add' ? 'إضافة' : 'إزالة'} ${r.target_email} — ${scopeLabel({ id: 0, email: r.target_email, scope: r.scope || 'cohort', faculty: r.faculty, category: r.category, track: r.track, year: r.year, perms: r.perms })} · ${permLabel(r.perms)}`;
const STATUS_AR = { pending: 'بانتظار الموافقة', approved: 'تمت الموافقة', rejected: 'مرفوض' };

/* الموافقات: السوبر أدمن يوافق أو يرفض بعد تأكيد. مشرف الكلية يرى حالة طلباته. */
function RequestsPanel({ requests, isSuper, reloadAll }: { requests: AdminRequest[]; isSuper: boolean; reloadAll: () => Promise<void> }) {
    const [dlg, setDlg] = React.useState<{ id: number; act: 'approve' | 'reject' } | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    const decide = async () => {
        if (!dlg) return;
        setBusy(true); setErr('');
        try { await (dlg.act === 'approve' ? approveRequest(dlg.id) : rejectRequest(dlg.id)); await reloadAll(); setDlg(null); }
        catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذر تنفيذ القرار.'); setDlg(null); }
        finally { setBusy(false); }
    };
    const target = dlg ? requests.find((r) => r.id === dlg.id) : undefined;
    return <div className="azu-admin-card" dir="rtl">
        <h3 className="azu-admin-h">{isSuper ? 'طلبات بانتظار موافقتك' : 'حالة طلباتك'}</h3>
        {err && <p className="azu-admin-err" role="alert">{err}</p>}
        {requests.length === 0 && <p className="azu-admin-note">لا توجد طلبات.</p>}
        {requests.map((r) => <div key={r.id} className="azu-admin-row">
            <div className="azu-admin-row-main">
                <span className="azu-admin-row-title">{reqText(r)}</span>
                <span className="azu-admin-row-meta">{STATUS_AR[r.status]}</span>
            </div>
            {isSuper && r.status === 'pending' && <div className="azu-admin-row-actions">
                <button type="button" className="azu-btn azu-btn-primary azu-btn-sm" onClick={() => setDlg({ id: r.id, act: 'approve' })}>موافقة</button>
                <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" onClick={() => setDlg({ id: r.id, act: 'reject' })}>رفض</button>
            </div>}
        </div>)}
        {dlg && target && <ConfirmDialog
            title={dlg.act === 'approve' ? 'الموافقة على الطلب' : 'رفض الطلب'}
            text={dlg.act === 'approve' ? `سيُطبَّق فورًا: ${reqText(target)}` : `لن يتغير شيء. الطلب: ${reqText(target)}`}
            confirmLabel={dlg.act === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'} busy={busy} onConfirm={decide} onCancel={() => setDlg(null)} />}
    </div>;
}

/* الحسابات المسجلة: للسوبر أدمن فقط. القراءة محمية بسياسة RLS
   (profiles_select_super)؛ غير السوبر لا تصله البيانات أصلًا. */
function AccountsSection({ grants }: { grants: Grant[] }) {
    const [accounts, setAccounts] = React.useState<AccountRow[] | null>(null);
    const [err, setErr] = React.useState('');
    const [q, setQ] = React.useState('');

    const me = useAuth()?.user.email;
    const [root, setRoot] = React.useState(false);
    const [busyId, setBusyId] = React.useState('');
    React.useEffect(() => { isRoot().then(setRoot); }, []);
    const toggleSuper = async (a: AccountRow) => {
        const on = a.role !== 'admin';
        if (!window.confirm(on ? `ترقية ${a.email} إلى سوبر أدمن بكل الصلاحيات؟` : `إزالة صلاحية السوبر أدمن من ${a.email}؟`)) return;
        setBusyId(a.id); setErr('');
        try { await setSuper(a.email, on); setAccounts(await listAccounts()); }
        catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذر التنفيذ.'); }
        finally { setBusyId(''); }
    };
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
                    {root && a.email !== me && <div className="azu-admin-row-actions">
                        <button type="button" className="azu-btn azu-btn-outline azu-btn-sm" disabled={busyId === a.id} onClick={() => toggleSuper(a)}>
                            {a.role === 'admin' ? 'إزالة سوبر أدمن' : 'ترقية لسوبر أدمن'}
                        </button>
                    </div>}
                </div>;
            })}
            {accounts && shown.length === 0 && <p className="azu-admin-note">لا نتائج مطابقة.</p>}
        </div>
    </div>;
}

type Tab = 'overview' | 'upload' | 'files' | 'admins' | 'approvals' | 'accounts';

export function AdminPage() {
    const session = useAuth();
    const [grants, setGrants] = React.useState<Grant[] | null>(null);
    const [files, setFiles] = React.useState<FileRow[]>([]);
    const [requests, setRequests] = React.useState<AdminRequest[]>([]);
    const [loadErr, setLoadErr] = React.useState('');
    const [tab, setTab] = React.useState<Tab>('overview');

    const isSuper = session?.user.role === 'admin';

    const reload = React.useCallback(async () => {
        try {
            const [g, f] = await Promise.all([myGrants(), listFiles()]);
            setGrants(g); setFiles(f);
            /* Requests exist only after the approval migration; before it, hide the feature. */
            listRequests().then(setRequests).catch(() => setRequests([]));
        } catch (ex) {
            setLoadErr(ex instanceof Error ? ex.message : 'تعذر تحميل البيانات.');
        }
    }, []);

    React.useEffect(() => { if (session) reload(); }, [session, reload]);

    const head = <>
        <div className="azu-kicker">ADMIN PORTAL</div>
        <h2 className="azu-title">لوحة المشرفين</h2>
    </>;

    if (!session) {
        return <section className="azu-section azu-flow">{head}
            <p dir="rtl">هذه الصفحة للمشرفين فقط. سجّل دخولك أولًا.</p>
            <p><Link to="/signin" className="azu-btn azu-btn-primary">تسجيل الدخول</Link></p>
        </section>;
    }
    if (grants === null && !loadErr) return <section className="azu-section azu-flow">{head}<p dir="rtl">لحظات…</p></section>;
    if (!isSuper && (grants || []).length === 0) {
        return <section className="azu-section azu-flow">{head}
            <p dir="rtl">ليست لديك صلاحية مشرف. إن كنت تعتقد أن هذا خطأ، تواصل مع إدارة المنصة.</p>
        </section>;
    }

    const g = grants || [];
    const facultyIds = [...new Set(g.filter((x) => x.scope === 'faculty' && x.perms !== 'upload_only').map((x) => x.faculty))];
    const isFacultyAdmin = !isSuper && facultyIds.length > 0;
    const deptGrant = !isSuper && !isFacultyAdmin ? g.find((x) => x.scope === 'track' && x.perms !== 'upload_only') : undefined;
    const isDeptAdmin = !!deptGrant;
    const role = isSuper ? 'سوبر أدمن' : isDeptAdmin ? 'مشرف قسم' : isFacultyAdmin ? 'مشرف كلية' : g.some((x) => x.scope === 'cohort') ? 'مشرف دفعة' : g.some((x) => x.scope === 'track') ? 'مشرف قسم' : 'مشرف';
    const pending = requests.filter((r) => r.status === 'pending').length;
    const mineFiles = files.filter((f) => canManage(g, !!isSuper, f.faculty, f.department, f.year));
    const tabs: { id: Tab; ar: string; icon: string; badge?: number }[] = [
        { id: 'overview', ar: 'نظرة عامة', icon: 'target' },
        { id: 'upload', ar: 'رفع ملف', icon: 'upload' },
        { id: 'files', ar: 'الملفات', icon: 'books' },
        ...(isSuper || isFacultyAdmin || isDeptAdmin ? [{ id: 'admins' as Tab, ar: 'المشرفون', icon: 'user' }] : []),
        ...(isSuper || isFacultyAdmin || isDeptAdmin ? [{ id: 'approvals' as Tab, ar: isSuper ? 'الموافقات' : 'طلباتي', icon: 'shield', badge: isSuper ? pending : 0 }] : []),
        ...(isSuper ? [{ id: 'accounts' as Tab, ar: 'الحسابات', icon: 'users' }] : []),
    ];

    return <section className="azu-section azu-flow">
        {head}
        {loadErr && <p className="azu-admin-err" dir="rtl" role="alert">{loadErr}</p>}
        <div className="azu-admin-shell">
            <nav className="azu-admin-nav" dir="rtl" aria-label="أقسام اللوحة">
                {tabs.map((t) => <button key={t.id} type="button" className={`azu-admin-tab${tab === t.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)}>
                    <Icon name={t.icon} size={16} /> <span>{t.ar}</span>
                    {!!t.badge && <span className="azu-admin-badge" aria-label={`${t.badge} طلب جديد`}>{t.badge}</span>}
                </button>)}
            </nav>
            <div className="azu-admin-main">
                {tab === 'overview' && <div className="azu-admin-card" dir="rtl">
                    <h3 className="azu-admin-h">مرحبًا، {role}</h3>
                    <div className="azu-admin-stats">
                        <div className="azu-admin-stat"><strong>{mineFiles.length}</strong><span>ملف ضمن نطاقك</span></div>
                        {(isSuper || isFacultyAdmin) && <div className="azu-admin-stat"><strong>{isSuper ? g.length : g.filter((x) => facultyIds.includes(x.faculty) && x.scope !== 'faculty').length}</strong><span>مشرف</span></div>}
                        {isSuper && <div className="azu-admin-stat"><strong>{pending}</strong><span>طلب بانتظار موافقتك</span></div>}
                    </div>
                    {!isSuper && <><div className="azu-minihead">نطاق صلاحيتك</div>
                        <ul className="azu-ticks">{g.map((x) => <li key={x.id}>{scopeLabel(x)} · {permLabel(x.perms)}</li>)}</ul></>}
                    {isSuper && pending > 0 && <button type="button" className="azu-btn azu-btn-primary" onClick={() => setTab('approvals')}>راجع الطلبات</button>}
                </div>}
                {tab === 'upload' && <Uploader grants={g} isSuper={!!isSuper} onUploaded={(row) => setFiles([row, ...files])} />}
                {tab === 'files' && <FilesList grants={g} isSuper={!!isSuper} files={files} setFiles={setFiles} />}
                {tab === 'admins' && isSuper && <GrantsManager grants={g} reload={reload} />}
                {tab === 'admins' && isDeptAdmin && <FacultyAdminsPanel dept={deptGrant} grants={g} facultyIds={[deptGrant!.faculty]} requests={requests} reloadAll={reload} />}
                {tab === 'admins' && isFacultyAdmin && <FacultyAdminsPanel grants={g} facultyIds={facultyIds} requests={requests} reloadAll={reload} />}
                {tab === 'approvals' && (isSuper || isFacultyAdmin || isDeptAdmin) && <RequestsPanel requests={requests} isSuper={!!isSuper} reloadAll={reload} />}
                {tab === 'accounts' && isSuper && <AccountsSection grants={g} />}
            </div>
        </div>
    </section>;
}
