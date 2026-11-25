import React from 'react';
import { Link } from '@instinct/files';
import { Icon } from './Icon';
import { useAuth, signIn, signUp, signOut, resendConfirmation, hasAccountFlag, uploadAvatar, removeAvatar } from './auth';
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
    const remove = async () => {
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
        {session.user.avatarPath && <button type="button" className="azu-avatar-del" disabled={busy} onClick={remove}>إزالة</button>}
        {busy && <span className="azu-avatar-busy">لحظات…</span>}
        {err && <span className="azu-avatar-err" role="alert">{err}</span>}
    </div>;
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
                <p className="azu-auth-note">الملفات والمذكرات المشتركة وخدمات الحساب ستظهر هنا مع إضافتها.</p>
                <button type="button" className="azu-btn azu-btn-outline" onClick={() => signOut()}>تسجيل الخروج</button>
            </div>
        </section>;
    }

    if (confirmSent) {
        return <section className="azu-section azu-flow">
            <div className="azu-kicker">STUDENT ACCOUNT</div>
            <h2 className="azu-title">تفقد بريدك</h2>
            <div className="azu-auth-card" dir="rtl">
                <p className="azu-auth-note">أرسلنا رابط تأكيد إلى <bdi>{email}</bdi>. افتح البريد واضغط الرابط، ثم سجّل دخولك من هنا.</p>
                <button type="button" className="azu-btn azu-btn-outline" onClick={() => { setConfirmSent(false); setMode('in'); }}>العودة لتسجيل الدخول</button>
            </div>
        </section>;
    }

    /* NOTE: the File viewer iframe sandbox blocks form submit events
       (no allow-forms), so the button is type=button + onClick and Enter
       is handled via onKeyDown — never rely on <form> submission. */
    const submit = async () => {
        setErr('');
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
            setErr(e instanceof Error ? e.message : 'حدث خطأ غير متوقع. أعد المحاولة.');
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
                    onClick={async () => { setBusy(true); try { await resendConfirmation(email.trim()); setResent(true); } catch { setErr('تعذر الإرسال الآن؛ أعد المحاولة بعد قليل.'); } finally { setBusy(false); } }}>
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
