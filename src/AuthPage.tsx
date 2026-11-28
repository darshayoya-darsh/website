import React from 'react';
import { Link } from '@instinct/files';
import { Icon } from './Icon';
import { useAuth, signIn, signUp, signOut, resendConfirmation, verifyCode, hasAccountFlag, uploadAvatar, removeAvatar, updateProfile, changePassword } from './auth';
import { DEPARTMENTS, PROGRAMS, FACULTIES, YEAR_NAMES } from './data';
import { myGrants } from './admin';
import { Avatar, downscaleAvatar } from './Avatar';

/* Student sign-in / sign-up page (replaces the قريبًا placeholder at /signin). */

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function AvatarEditor() {
    const session = useAuth();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    if (!session) return null;

    const pick = () => inputRef.current?.click();
    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        setErr('');
        if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(f.type)) { setErr('اختار صورة (JPG أو PNG أو WebP).'); return; }
        if (f.size > MAX_PHOTO_BYTES) { setErr('الصورة أكبر من ٨ ميجابايت.'); return; }
        setBusy(true);
        try {
            const blob = await downscaleAvatar(f);
            await uploadAvatar(blob);
        } catch (ex) {
            setErr(ex instanceof Error ? ex.message : 'تعذر رفع الصورة. أعد المحاولة.');
        } finally { setBusy(false); }
    };
    const [askRemove, setAskRemove] = React.useState(false);
    const remove = async () => {
        setAskRemove(false);
        setBusy(true);
        setErr('');
        try { await removeAvatar(); } catch { setErr('تعذر حذف الصورة. أعد المحاولة.'); }
        finally { setBusy(false); }
    };

    return <div className="azu-avatar-wrap">
        <span className="azu-avatar-lg"><Avatar size={64} /></span>
        <button type="button" className="azu-avatar-edit" aria-label="تغيير الصورة" disabled={busy} onClick={pick}>
            <Icon name="camera" size={13} />
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden onChange={onFile} />
        {session.user.avatarPath && <button type="button" className="azu-avatar-del" disabled={busy} onClick={() => setAskRemove(true)}>إزالة</button>}
        {askRemove && <div className="azu-modal-back" role="presentation" onClick={() => setAskRemove(false)}>
            <div className="azu-modal" role="alertdialog" aria-modal="true" dir="rtl" onClick={(e) => e.stopPropagation()}>
                <h3 className="azu-admin-h">إزالة الصورة؟</h3>
                <p className="azu-admin-note">ستُحذف صورتك الشخصية. يمكنك رفع صورة جديدة في أي وقت.</p>
                <div className="azu-modal-actions">
                    <button type="button" className="azu-btn azu-btn-danger" onClick={remove}>نعم، إزالة</button>
                    <button type="button" className="azu-btn azu-btn-outline" onClick={() => setAskRemove(false)}>إلغاء</button>
                </div>
            </div>
        </div>}
        {busy && <span className="azu-avatar-busy">لحظات…</span>}
        {err && <span className="azu-avatar-err" role="alert">{err}</span>}
    </div>;
}

/* Scoped admins carry role 'student' plus a grant row; check lazily so the
   portal link appears for both scoped and super admins. */
function AdminLink() {
    const session = useAuth();
    const [isAdmin, setIsAdmin] = React.useState(session?.user.role === 'admin');
    React.useEffect(() => {
        if (session?.user.role === 'admin') { setIsAdmin(true); return; }
        let live = true;
        myGrants().then((g) => { if (live && g.length > 0) setIsAdmin(true); }).catch(() => {});
        return () => { live = false; };
    }, [session]);
    if (!isAdmin) return null;
    return <p><Link to="/admin" className="azu-btn azu-btn-primary"><Icon name="shield" size={15} /> لوحة المشرفين</Link></p>;
}


const facName = (id: string) => { const f = FACULTIES.find((x) => x.id === id); return f ? `${f.ar} - ${f.city}` : id; };
const trackLabel = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.ar || PROGRAMS.find((d) => d.id === id)?.ar || id;

/* Name, academic data and password, each saved on its own. */
function AccountDetails() {
    const session = useAuth();
    const u = session?.user;
    const [name, setName] = React.useState(u?.fullName || '');
    const [faculty, setFaculty] = React.useState(u?.faculty || '');
    const isProg = !!u?.department && PROGRAMS.some((x) => x.id === u.department);
    const [category, setCategory] = React.useState<'basic' | 'special'>(isProg ? 'special' : 'basic');
    const [dept, setDept] = React.useState(u?.department || '');
    const [year, setYear] = React.useState(u?.year ? String(u.year) : '');
    const [pw, setPw] = React.useState('');
    const [pw2, setPw2] = React.useState('');
    const [busy, setBusy] = React.useState('');
    const [msg, setMsg] = React.useState<{ k: string; ok: boolean; t: string } | null>(null);
    if (!u) return null;

    const depts = DEPARTMENTS.filter((d) => !d.onlyFaculties || d.onlyFaculties.includes(faculty));
    const tracks = category === 'special' ? PROGRAMS : depts;
    const run = async (k: string, fn: () => Promise<void>, done: string) => {
        setBusy(k); setMsg(null);
        try { await fn(); setMsg({ k, ok: true, t: done }); }
        catch (ex) { setMsg({ k, ok: false, t: ex instanceof Error ? ex.message : 'تعذر الحفظ. أعد المحاولة.' }); }
        finally { setBusy(''); }
    };
    const saveName = () => {
        if (name.trim().length < 3) { setMsg({ k: 'name', ok: false, t: 'اكتب اسمك الكامل (٣ أحرف على الأقل).' }); return; }
        run('name', () => updateProfile({ fullName: name.trim() }), 'تم حفظ الاسم.');
    };
    const saveAcademic = () => {
        if (!faculty || !dept || !year) { setMsg({ k: 'acad', ok: false, t: 'اختر الكلية والقسم أو البرنامج والسنة.' }); return; }
        run('acad', () => updateProfile({ faculty, department: dept, year: Number(year) }), 'تم حفظ بياناتك الدراسية.');
    };
    const clearAcademic = () => run('acad', async () => {
        await updateProfile({ faculty: null, department: null, year: null });
        setFaculty(''); setDept(''); setYear('');
    }, 'تم مسح بياناتك الدراسية.');
    const savePw = () => {
        if (pw.length < 6) { setMsg({ k: 'pw', ok: false, t: 'كلمة المرور ٦ أحرف على الأقل.' }); return; }
        if (pw !== pw2) { setMsg({ k: 'pw', ok: false, t: 'كلمتا المرور غير متطابقتين.' }); return; }
        run('pw', async () => { await changePassword(pw); setPw(''); setPw2(''); }, 'تم تغيير كلمة المرور.');
    };
    const note = (k: string) => msg && msg.k === k && <div className={msg.ok ? 'azu-admin-ok' : 'azu-auth-err'} role={msg.ok ? 'status' : 'alert'}>{msg.t}</div>;
    const sel = 'azu-input';

    return <>
        <div className="azu-account-block">
            <h3 className="azu-account-h">بياناتي الدراسية</h3>
            {u.faculty && u.department && u.year
                ? <p className="azu-auth-note">{facName(u.faculty)} · {trackLabel(u.department)} · {YEAR_NAMES[u.year]}</p>
                : <p className="azu-auth-note">لم تُضف بياناتك الدراسية بعد. أضفها لتظهر هنا.</p>}
            <label className="azu-field">الكلية
                <select className={sel} value={faculty} onChange={(e) => { setFaculty(e.target.value); setDept(''); }}>
                    <option value="">اختر…</option>
                    {FACULTIES.map((f) => <option key={f.id} value={f.id}>{f.ar} - {f.city}</option>)}
                </select>
            </label>
            <label className="azu-field">النوع
                <select className={sel} value={category} onChange={(e) => { setCategory(e.target.value as 'basic' | 'special'); setDept(''); }}>
                    <option value="basic">قسم أساسي</option>
                    <option value="special">برنامج متميز</option>
                </select>
            </label>
            <label className="azu-field">{category === 'special' ? 'البرنامج' : 'القسم'}
                <select className={sel} value={dept} onChange={(e) => setDept(e.target.value)} disabled={!faculty}>
                    <option value="">{faculty ? 'اختر…' : 'اختر الكلية أولًا'}</option>
                    {tracks.map((d) => <option key={d.id} value={d.id}>{d.ar}</option>)}
                </select>
            </label>
            <label className="azu-field">السنة الدراسية
                <select className={sel} value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">اختر…</option>
                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{YEAR_NAMES[y]}</option>)}
                </select>
            </label>
            {note('acad')}
            <div className="azu-account-actions">
                <button type="button" className="azu-btn azu-btn-primary" disabled={!!busy} onClick={saveAcademic}>{busy === 'acad' ? 'لحظات…' : 'حفظ البيانات الدراسية'}</button>
                {(u.faculty || u.department || u.year) && <button type="button" className="azu-btn azu-btn-outline" disabled={!!busy} onClick={clearAcademic}>مسح</button>}
            </div>
        </div>
        <div className="azu-account-block">
            <h3 className="azu-account-h">الاسم</h3>
            <label className="azu-field">الاسم الكامل
                <input className="azu-input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            {note('name')}
            <button type="button" className="azu-btn azu-btn-primary" disabled={!!busy || name.trim() === (u.fullName || '')} onClick={saveName}>{busy === 'name' ? 'لحظات…' : 'حفظ الاسم'}</button>
        </div>
        <div className="azu-account-block">
            <h3 className="azu-account-h">كلمة المرور</h3>
            <label className="azu-field">كلمة المرور الجديدة
                <input className="azu-input" type="password" autoComplete="new-password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} />
            </label>
            <label className="azu-field">تأكيد كلمة المرور الجديدة
                <input className="azu-input" type="password" autoComplete="new-password" dir="ltr" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={6} />
            </label>
            {note('pw')}
            <button type="button" className="azu-btn azu-btn-outline" disabled={!!busy || !pw} onClick={savePw}>{busy === 'pw' ? 'لحظات…' : 'تغيير كلمة المرور'}</button>
        </div>
    </>;
}

export function AuthPage() {
    const session = useAuth();
    // First-time visitors land on "حساب جديد"; anyone who has an account lands on "دخول".
    const [mode, setMode] = React.useState<'in' | 'up'>(() => hasAccountFlag() ? 'in' : 'up');
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [pw, setPw] = React.useState('');
    const [pw2, setPw2] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState('');
    const [unconfirmed, setUnconfirmed] = React.useState(false);
    const [resent, setResent] = React.useState(false);
    const [confirmSent, setConfirmSent] = React.useState(false);
    const [code, setCode] = React.useState('');
    const [codeMsg, setCodeMsg] = React.useState('');

    if (session) {
        return <section className="azu-section azu-flow">
            <div className="azu-kicker">STUDENT ACCOUNT</div>
            <h2 className="azu-title">حسابي</h2>
            <div className="azu-auth-card" dir="rtl">
                <div className="azu-auth-user">
                    <AvatarEditor />
                    <div>
                        <div className="azu-auth-name">{session.user.fullName || 'طالب'}</div>
                        <div className="azu-auth-mail">{session.user.email}</div>
                    </div>
                    {session.user.role === 'admin' && <span className="azu-tag">مشرف</span>}
                </div>
                <AdminLink />
                <AccountDetails />
                <button type="button" className="azu-btn azu-btn-outline" onClick={() => signOut()}>تسجيل الخروج</button>
            </div>
        </section>;
    }

    if (confirmSent) {
        const doVerify = async () => {
            setErr('');
            if (code.replace(/\D/g, '').length < 6) { setErr('اكتب الكود المكوّن من الأرقام المرسل إلى بريدك.'); return; }
            setBusy(true);
            try { await verifyCode(email.trim(), code); }
            catch (ex) { setErr(ex instanceof Error ? ex.message : 'تعذر إتمام العملية. أعد المحاولة، وإن تكرر ذلك تواصل معنا من صفحة اتصل بنا.'); }
            finally { setBusy(false); }
        };
        const doResend = async () => {
            setErr(''); setCodeMsg(''); setBusy(true);
            try { await resendConfirmation(email.trim()); setCodeMsg('أرسلنا كودًا جديدًا إلى بريدك.'); }
            catch { setErr('تعذر الإرسال الآن؛ أعد المحاولة بعد قليل.'); }
            finally { setBusy(false); }
        };
        return <section className="azu-section azu-flow">
            <div className="azu-kicker">STUDENT ACCOUNT</div>
            <h2 className="azu-title">أدخل كود التأكيد</h2>
            <div className="azu-auth-card" dir="rtl">
                <p className="azu-auth-note">أرسلنا كودًا من الأرقام إلى <bdi>{email}</bdi>. اكتبه هنا لتفعيل حسابك.</p>
                <label className="azu-field">كود التأكيد
                    <input className="azu-input" inputMode="numeric" autoComplete="one-time-code" dir="ltr" maxLength={10} value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doVerify(); } }} />
                </label>
                {err && <div className="azu-auth-err" role="alert">{err}</div>}
                {codeMsg && <p className="azu-auth-note">{codeMsg}</p>}
                <button type="button" className="azu-btn azu-btn-primary" disabled={busy} onClick={doVerify}>{busy ? 'لحظات…' : 'تأكيد'}</button>
                <button type="button" className="azu-btn azu-btn-outline" disabled={busy} onClick={doResend}>إرسال كود جديد</button>
                <button type="button" className="azu-btn azu-btn-outline" onClick={() => { setConfirmSent(false); setCode(''); setErr(''); setMode('in'); }}>العودة لتسجيل الدخول</button>
            </div>
        </section>;
    }

    /* NOTE: the File viewer iframe sandbox blocks form submit events
       (no allow-forms), so the button is type=button + onClick and Enter
       is handled via onKeyDown — never rely on <form> submission. */
    const submit = async () => {
        setErr('');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setErr('اكتب بريدًا إلكترونيًا صحيحًا، مثل name@gmail.com.'); return; }
        if (!pw) { setErr('اكتب كلمة المرور.'); return; }
        if (mode === 'up') {
            if (name.trim().length < 3) { setErr('اكتب اسمك الكامل.'); return; }
            if (pw.length < 6) { setErr('كلمة المرور ٦ أحرف على الأقل.'); return; }
            if (pw !== pw2) { setErr('كلمتا المرور غير متطابقتين.'); return; }
        }
        setBusy(true);
        try {
            if (mode === 'in') await signIn(email.trim(), pw);
            else {
                const r = await signUp(name.trim(), email.trim(), pw);
                if (r === 'confirm') setConfirmSent(true);
            }
        } catch (ex) {
            const e = ex as Error & { code?: string };
            setErr(e instanceof Error ? e.message : 'تعذر إتمام العملية. أعد المحاولة، وإن تكرر ذلك تواصل معنا من صفحة اتصل بنا.');
            setUnconfirmed((e.code || '').includes('email_not_confirmed'));
            setResent(false);
        } finally { setBusy(false); }
    };
    const onEnter = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };

    return <section className="azu-section azu-flow">
        <div className="azu-kicker">STUDENT ACCOUNT</div>
        <h2 className="azu-title">{mode === 'in' ? 'تسجيل الدخول' : 'حساب جديد'}</h2>
        <div className="azu-auth-card" dir="rtl">
            <div className="azu-auth-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mode === 'in'} className={`azu-auth-tab${mode === 'in' ? ' is-on' : ''}`} onClick={() => { setMode('in'); setErr(''); }}>دخول</button>
                <button type="button" role="tab" aria-selected={mode === 'up'} className={`azu-auth-tab${mode === 'up' ? ' is-on' : ''}`} onClick={() => { setMode('up'); setErr(''); }}>حساب جديد</button>
            </div>
            <form className="azu-form" onSubmit={(e) => e.preventDefault()}>
                {mode === 'up' && <label className="azu-field">الاسم الكامل
                    <input className="azu-input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onEnter} placeholder="مثال: أحمد محمد علي" required />
                </label>}
                <label className="azu-field">البريد الإلكتروني
                    <input className="azu-input" type="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onEnter} placeholder="name@example.com" required />
                </label>
                <label className="azu-field">كلمة المرور
                    <input className="azu-input" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={onEnter} required minLength={6} />
                </label>
                {mode === 'up' && <label className="azu-field">تأكيد كلمة المرور
                    <input className="azu-input" type="password" autoComplete="new-password" dir="ltr" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={onEnter} required minLength={6} />
                </label>}
                {err && <div className="azu-auth-err" role="alert">{err}</div>}
                {unconfirmed && !resent && <button type="button" className="azu-btn azu-btn-outline" disabled={busy}
                    onClick={async () => { setBusy(true); try { await resendConfirmation(email.trim()); setErr(''); setUnconfirmed(false); setConfirmSent(true); } catch { setErr('تعذر الإرسال الآن؛ أعد المحاولة بعد قليل.'); } finally { setBusy(false); } }}>
                    إعادة إرسال بريد التأكيد
                </button>}
                {unconfirmed && resent && <p className="azu-auth-note">تم إرسال بريد التأكيد مرة أخرى إلى <bdi>{email}</bdi>. افتحه واضغط الرابط ثم سجّل دخولك.</p>}
                <button type="button" className="azu-btn azu-btn-primary" disabled={busy} onClick={submit}>
                    {busy ? 'لحظات…' : mode === 'in' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                </button>
            </form>
            <p className="azu-auth-fine">بالتسجيل أنت توافق على استخدام بريدك لإنشاء حسابك على المنصة فقط.</p>
        </div>
        <p dir="rtl" className="azu-auth-back"><Link to="/">العودة إلى الرئيسية</Link></p>
    </section>;
}
