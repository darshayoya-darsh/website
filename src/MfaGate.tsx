import React from 'react';
import { useAuth, needsMfa, mfaStatus, mfaEnroll, mfaVerify, signOut } from './auth';

/* Full-screen step shown to the super admin on every entry: enroll an
   authenticator app the first time, then a 6-digit code every time. */
export function MfaGate() {
    const session = useAuth();
    const [, tick] = React.useReducer((n: number) => n + 1, 0);
    const [factor, setFactor] = React.useState<string | null | undefined>(undefined);
    const [enroll, setEnroll] = React.useState<{ id: string; qr: string; secret: string } | null>(null);
    const [code, setCode] = React.useState('');
    const [err, setErr] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    React.useEffect(() => { const i = setInterval(tick, 30000); return () => clearInterval(i); }, []);
    const gated = needsMfa(session);
    React.useEffect(() => {
        if (!gated) { setFactor(undefined); setEnroll(null); setCode(''); return; }
        let live = true;
        mfaStatus().then(async (m) => {
            if (!live) return;
            if (m.factorId) setFactor(m.factorId);
            else { setFactor(null); setEnroll(await mfaEnroll()); }
        }).catch((e) => live && setErr(e.message));
        return () => { live = false; };
    }, [gated]);
    if (!gated) return null;
    const fid = enroll?.id || factor;
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fid || !/^\d{6}$/.test(code.trim())) { setErr('اكتب الكود المكوّن من ٦ أرقام.'); return; }
        setBusy(true); setErr('');
        try { await mfaVerify(fid, code); setCode(''); } catch (x: any) { setErr(x.message); }
        setBusy(false);
    };
    return <div className="azu-modal-back" dir="rtl" style={{ zIndex: 200, background: 'rgba(8,28,24,.92)' }}>
        <form className="azu-modal" onSubmit={submit}>
            <h3 className="azu-account-h">خطوة تحقق إضافية للمشرف الأعلى</h3>
            {enroll
                ? <>
                    <p>أول مرة: افتح تطبيق المصادقة (Google Authenticator أو Microsoft Authenticator أو Aegis) وامسح الرمز، أو اكتب المفتاح يدويًا. ثم اكتب الكود الظاهر في التطبيق.</p>
                    {enroll.qr && <img src={enroll.qr} alt="رمز QR لتطبيق المصادقة" width={180} height={180} style={{ display: 'block', margin: '0 auto', background: '#fff' }} />}
                    <p dir="ltr" style={{ wordBreak: 'break-all', fontFamily: 'monospace', textAlign: 'center' }}>{enroll.secret}</p>
                </>
                : <p>اكتب الكود الحالي من تطبيق المصادقة للدخول.</p>}
            {fid
                ? <input className="azu-input" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" autoFocus />
                : !err && <p>جارٍ التحضير...</p>}
            {err && <p role="alert" style={{ color: '#a12c2c' }}>{err}</p>}
            <div className="azu-modal-actions">
                <button type="submit" className="azu-btn" disabled={busy || !fid}>تحقق</button>
                <button type="button" className="azu-btn azu-btn-outline" onClick={() => signOut()}>تسجيل الخروج</button>
            </div>
        </form>
    </div>;
}
