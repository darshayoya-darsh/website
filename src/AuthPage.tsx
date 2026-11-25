import React from 'react';
import { Link } from '@instinct/files';
import { Icon } from './Icon';
import { useAuth, signIn, signUp, signOut, resendConfirmation } from './auth';

/* Student sign-in / sign-up page (replaces the قريبًا placeholder at /signin). */

export function AuthPage() {
    const session = useAuth();
    const [mode, setMode] = React.useState<'in' | 'up'>('in');
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
                    <span className="azu-auth-avatar"><Icon name="user" size={22} /></span>
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

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return <section className="azu-section azu-flow">
        <div className="azu-kicker">STUDENT ACCOUNT</div>
        <h2 className="azu-title">{mode === 'in' ? 'تسجيل الدخول' : 'حساب جديد'}</h2>
        <div className="azu-auth-card" dir="rtl">
            <div className="azu-auth-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mode === 'in'} className={`azu-auth-tab${mode === 'in' ? ' is-on' : ''}`} onClick={() => { setMode('in'); setErr(''); }}>دخول</button>
                <button type="button" role="tab" aria-selected={mode === 'up'} className={`azu-auth-tab${mode === 'up' ? ' is-on' : ''}`} onClick={() => { setMode('up'); setErr(''); }}>حساب جديد</button>
            </div>
            <form className="azu-form" onSubmit={submit}>
                {mode === 'up' && <label className="azu-field">الاسم الكامل
                    <input className="azu-input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد محمد علي" required />
                </label>}
                <label className="azu-field">البريد الإلكتروني
                    <input className="azu-input" type="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
                </label>
                <label className="azu-field">كلمة المرور
                    <input className="azu-input" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
                </label>
                {mode === 'up' && <label className="azu-field">تأكيد كلمة المرور
                    <input className="azu-input" type="password" autoComplete="new-password" dir="ltr" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} />
                </label>}
                {err && <div className="azu-auth-err" role="alert">{err}</div>}
                {unconfirmed && !resent && <button type="button" className="azu-btn azu-btn-outline" disabled={busy}
                    onClick={async () => { setBusy(true); try { await resendConfirmation(email.trim()); setResent(true); } catch { setErr('تعذر الإرسال الآن؛ أعد المحاولة بعد قليل.'); } finally { setBusy(false); } }}>
                    إعادة إرسال بريد التأكيد
                </button>}
                {unconfirmed && resent && <p className="azu-auth-note">تم إرسال بريد التأكيد مرة أخرى إلى <bdi>{email}</bdi>. افتحه واضغط الرابط ثم سجّل دخولك.</p>}
                <button type="submit" className="azu-btn azu-btn-primary" disabled={busy}>
                    {busy ? 'لحظات…' : mode === 'in' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                </button>
            </form>
            <p className="azu-auth-fine">بالتسجيل أنت توافق على استخدام بريدك لإنشاء حسابك على المنصة فقط.</p>
        </div>
        <p dir="rtl" className="azu-auth-back"><Link to="/">العودة إلى الرئيسية</Link></p>
    </section>;
}
