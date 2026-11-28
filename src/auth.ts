import React from 'react';

/* Supabase auth via plain REST (no SDK): the publishable key is public by
   design; all reads/writes are gated by Row Level Security server-side. */

export const SUPA_URL = 'https://nhufspxzwbtvmamukpoa.supabase.co';
export const SUPA_KEY = 'sb_publishable_Q0OuPQHYGAb271d0jkxIBw_6yMueXMk';

/* Confirmation emails must return to a live site. The File viewer renders the
   app in a cross-origin iframe that can never receive the token hash, so the
   GitHub Pages site is the only valid landing page. */
const SITE_URL = 'https://darshayoya-darsh.github.io/website/';
const REDIRECT_Q = `?redirect_to=${encodeURIComponent(SITE_URL)}`;
const LS_KEY = 'azu_auth_v1';
const HAS_ACCOUNT_KEY = 'azu_has_account';

export interface AuthUser { id: string; email: string; fullName: string; role: string; avatarPath?: string | null; faculty?: string | null; department?: string | null; year?: number | null; }
export interface AuthSession { access_token: string; refresh_token: string; user: AuthUser; justConfirmed?: boolean; }

let session: AuthSession | null = null;
try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (raw) session = JSON.parse(raw);
} catch { session = null; }

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function setSession(s: AuthSession | null) {
    session = s;
    try {
        if (s) {
            const { justConfirmed, ...persist } = s; // one-shot flag, never persisted
            localStorage.setItem(LS_KEY, JSON.stringify(persist));
            localStorage.setItem(HAS_ACCOUNT_KEY, '1');
        } else localStorage.removeItem(LS_KEY);
    } catch { /* private mode */ }
    emit();
}

export function clearJustConfirmed() {
    if (session?.justConfirmed) setSession({ ...session, justConfirmed: false });
}

/* The URL-hash token login was removed on purpose: it let a crafted link sign a
   visitor into someone else's session. Confirmation uses the numeric code. */

/* A stored session can go stale when the profile changes server-side (e.g. an
   account is made admin). Re-validate on startup and refresh the profile so
   role changes apply on the next app load, without a sign-out. If the access
   token expired, renew it with the refresh token first. */
function refreshStoredSession() {
    const s = session;
    if (!s) return;
    const applyUser = (at: string, rt: string) =>
        fetch(`${SUPA_URL}/auth/v1/user`, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${at}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((u) => loadProfile(at, u))
            .then((u) => { if (session && session.refresh_token === rt) setSession({ access_token: at, refresh_token: rt, user: u }); });
    applyUser(s.access_token, s.refresh_token).catch(() => {
        api('/auth/v1/token?grant_type=refresh_token', { refresh_token: s.refresh_token })
            .then((data) => applyUser(data.access_token, data.refresh_token))
            .catch(() => { /* keep the stale session; the next sign-in refreshes it */ });
    });
}
refreshStoredSession();

export function hasAccountFlag(): boolean {
    try { return !!localStorage.getItem(HAS_ACCOUNT_KEY); } catch { return false; }
}

export function useAuth(): AuthSession | null {
    return React.useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
        () => session,
    );
}
export function getAuth(): AuthSession | null { return session; }

async function api(path: string, body?: Record<string, unknown>, token?: string) {
    let r: Response;
    try {
        r = await fetch(`${SUPA_URL}${path}`, {
            method: body ? 'POST' : 'GET',
            headers: {
                apikey: SUPA_KEY,
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.');
    }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
        const code = (data.error_code || data.error || '') as string;
        const msg = (data.error_description || data.msg || data.message || '') as string;
        const err = new Error(arError(code, msg, r.status)) as Error & { code?: string };
        err.code = code || msg;
        throw err;
    }
    return data;
}

/* Every failure gets a specific, polite Arabic message. The site never shows
   a raw server message, and "unexpected error" is the last resort only. */
function arError(code: string, msg: string, status = 0): string {
    const m = `${code} ${msg}`.toLowerCase();
    const has = (...k: string[]) => k.some((x) => m.includes(x));
    if (has('invalid login', 'invalid_credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد منهما وحاول مرة أخرى.';
    if (has('user_already', 'already registered', 'already been registered', 'email_exists')) return 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول، أو استخدم بريدًا آخر.';
    if (has('email_address_invalid', 'invalid email', 'unable to validate email', 'validate email')) return 'البريد الإلكتروني غير صالح. تأكد من كتابته بشكل صحيح.';
    if (has('weak_password', 'at least 6', 'password should', 'password is too')) return 'كلمة المرور ضعيفة. استخدم ٦ أحرف على الأقل.';
    if (has('same_password')) return 'كلمة المرور الجديدة لازم تكون مختلفة عن القديمة.';
    if (has('email_not_confirmed', 'not confirmed')) return 'حسابك لم يُؤكَّد بعد. اكتب كود التأكيد المرسل إلى بريدك.';
    if (has('otp_expired', 'token has expired', 'expired')) return 'انتهت صلاحية الكود. اطلب كودًا جديدًا وأدخله بسرعة.';
    if (has('otp', 'token', 'verification') && has('invalid', 'not found')) return 'الكود غير صحيح. راجع الأرقام وحاول مرة أخرى.';
    if (has('over_email_send_rate_limit', 'email rate limit', 'rate_limit', 'over_request_rate', 'too many', 'for security purposes')) return 'محاولات كثيرة في وقت قصير. انتظر دقيقة ثم أعد المحاولة.';
    if (has('signup_disabled', 'signups not allowed')) return 'التسجيل مغلق مؤقتًا. حاول لاحقًا.';
    if (has('user_banned', 'banned')) return 'هذا الحساب موقوف. تواصل مع إدارة المنصة.';
    if (has('user_not_found', 'user not found')) return 'لا يوجد حساب بهذا البريد. تأكد منه أو أنشئ حسابًا جديدًا.';
    if (has('sending confirmation', 'sending email', 'smtp', 'error sending')) return 'تعذر إرسال رسالة التأكيد إلى بريدك الآن. حاول بعد قليل، أو تواصل معنا من صفحة اتصل بنا.';
    if (status === 429) return 'محاولات كثيرة في وقت قصير. انتظر دقيقة ثم أعد المحاولة.';
    if (status >= 500) return 'الخدمة مشغولة لحظيًا. أعد المحاولة بعد قليل، ولن تفقد بياناتك.';
    if (status === 401 || status === 403) return 'انتهت جلستك. سجّل دخولك من جديد.';
    return 'تعذر إتمام العملية. راجع البيانات وأعد المحاولة، وإن تكرر ذلك تواصل معنا من صفحة اتصل بنا.';
}

async function loadProfile(access_token: string, user: { id: string; email?: string; user_metadata?: { full_name?: string } }): Promise<AuthUser> {
    let role = 'student';
    let fullName = user?.user_metadata?.full_name || '';
    let avatarPath: string | null = null;
    let faculty: string | null = null, department: string | null = null, year: number | null = null;
    try {
        const rows = await api(`/rest/v1/profiles?id=eq.${user.id}&select=full_name,role,avatar_path,faculty,department,year`, undefined, access_token);
        if (Array.isArray(rows) && rows[0]) {
            role = rows[0].role || 'student';
            fullName = rows[0].full_name || fullName;
            avatarPath = rows[0].avatar_path || null;
            faculty = rows[0].faculty || null; department = rows[0].department || null; year = rows[0].year || null;
        }
    } catch { /* profile row may lag the signup trigger by a beat */ }
    return { id: user.id, email: user.email || '', fullName, role, avatarPath, faculty, department, year };
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
    const data = await api('/auth/v1/token?grant_type=password', { email, password });
    const u = await loadProfile(data.access_token, data.user);
    setSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: u });
    return u;
}

/* Returns 'in' when email confirmation is off (session issued right away),
   'confirm' when the project requires confirming the email first. */
export async function signUp(fullName: string, email: string, password: string): Promise<'in' | 'confirm'> {
    const data = await api(`/auth/v1/signup${REDIRECT_Q}`, { email, password, data: { full_name: fullName } });
    if (data.access_token) {
        const u = await loadProfile(data.access_token, data.user);
        setSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: u });
        return 'in';
    }
    return 'confirm';
}

export async function refreshSession(): Promise<void> {
    if (!session) return;
    try {
        const data = await api('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh_token });
        const u = await loadProfile(data.access_token, data.user);
        setSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: u });
    } catch { setSession(null); }
}

export function signOut() { setSession(null); }

/* Access tokens live about an hour. Every API call goes through
   ensureFreshToken: it reads the JWT exp, renews with the refresh token when
   expired or within a minute of expiring, dedupes concurrent renewals, and
   drops the session cleanly (back to sign-in) when renewal fails. */
function tokenExp(at: string): number {
    try {
        const p = JSON.parse(atob(at.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof p.exp === 'number' ? p.exp : 0;
    } catch { return 0; }
}

let refreshing: Promise<string> | null = null;
export async function ensureFreshToken(): Promise<string> {
    const s = session;
    if (!s) throw new Error('سجّل دخولك أولًا.');
    const exp = tokenExp(s.access_token);
    if (exp && exp - Date.now() / 1000 > 60) return s.access_token;
    if (!refreshing) {
        refreshing = (async () => {
            try {
                const data = await api('/auth/v1/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
                const u = await loadProfile(data.access_token, data.user);
                setSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: u });
                return data.access_token as string;
            } catch {
                setSession(null);
                throw new Error('انتهت جلستك. سجّل الدخول من جديد.');
            } finally { refreshing = null; }
        })();
    }
    return refreshing;
}

/* ---------- Profile avatar (Supabase Storage, private bucket) ----------
   Bucket 'avatars' is private with owner-only RLS: a student can read and
   write only <their-uid>/ inside it. Reads therefore need the session token;
   photos are never reachable by link. */

const AVATAR_BUCKET = 'avatars';

export async function uploadAvatar(blob: Blob): Promise<string> {
    if (!session) throw new Error('سجّل دخولك أولًا.');
    const path = `${session.user.id}/avatar.webp`;
    const at = await ensureFreshToken();
    const r = await fetch(`${SUPA_URL}/storage/v1/object/${AVATAR_BUCKET}/${path}`, {
        method: 'POST',
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${at}`, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
        body: blob,
    });
    if (!r.ok) throw new Error('تعذر رفع الصورة. أعد المحاولة.');
    await saveAvatarPath(path);
    return path;
}

export async function removeAvatar(): Promise<void> {
    if (!session || !session.user.avatarPath) return;
    const path = session.user.avatarPath;
    const at = await ensureFreshToken();
    await fetch(`${SUPA_URL}/storage/v1/object/${AVATAR_BUCKET}/${path}`, {
        method: 'DELETE',
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${at}` },
    }).catch(() => {});
    await saveAvatarPath(null);
}

async function saveAvatarPath(path: string | null): Promise<void> {
    if (!session) return;
    const at = await ensureFreshToken();
    const r = await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${session.user.id}`, {
        method: 'PATCH',
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${at}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ avatar_path: path }),
    });
    if (!r.ok) throw new Error('تعذر حفظ الصورة في الملف الشخصي.');
    setSession({ ...session, user: { ...session.user, avatarPath: path } });
}

const avatarCache = new Map<string, string>();

export async function fetchAvatarUrl(path: string): Promise<string | null> {
    if (!session) return null;
    const key = `${path}`;
    const hit = avatarCache.get(key);
    if (hit) return hit;
    try {
        const at = await ensureFreshToken();
        const r = await fetch(`${SUPA_URL}/storage/v1/object/${AVATAR_BUCKET}/${path}`, {
            headers: { apikey: SUPA_KEY, Authorization: `Bearer ${at}` },
        });
        if (!r.ok) return null;
        const url = URL.createObjectURL(await r.blob());
        avatarCache.set(key, url);
        return url;
    } catch { return null; }
}

/* Resend the signup confirmation email (current account model keeps email
   confirmation until the reference-list model is decided). */
export async function resendConfirmation(email: string): Promise<void> {
    await api(`/auth/v1/resend${REDIRECT_Q}`, { type: 'signup', email });
}

/* Confirm a new account with the numeric code from the signup email. On
   success Supabase returns a session, so the student is signed in at once. */
export async function verifyCode(email: string, code: string): Promise<AuthUser> {
    const data = await api('/auth/v1/verify', { type: 'signup', email, token: code.replace(/\s+/g, '') });
    const u = await loadProfile(data.access_token, data.user);
    setSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: u, justConfirmed: true });
    return u;
}

/* Account page: save name and academic data on the student's own profile row. */
export async function updateProfile(fields: { fullName?: string; faculty?: string | null; department?: string | null; year?: number | null }): Promise<void> {
    if (!session) throw new Error('سجّل دخولك أولًا.');
    const patch: Record<string, unknown> = {};
    if (fields.fullName !== undefined) patch.full_name = fields.fullName;
    if (fields.faculty !== undefined) patch.faculty = fields.faculty;
    if (fields.department !== undefined) patch.department = fields.department;
    if (fields.year !== undefined) patch.year = fields.year;
    const at = await ensureFreshToken();
    let r: Response;
    try {
        r = await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${session.user.id}`, {
            method: 'PATCH',
            headers: { apikey: SUPA_KEY, Authorization: `Bearer ${at}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify(patch),
        });
    } catch { throw new Error('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.'); }
    if (!r.ok) throw new Error('تعذر حفظ البيانات. أعد المحاولة.');
    const u = { ...session.user };
    if (fields.fullName !== undefined) u.fullName = fields.fullName;
    if (fields.faculty !== undefined) u.faculty = fields.faculty;
    if (fields.department !== undefined) u.department = fields.department;
    if (fields.year !== undefined) u.year = fields.year;
    setSession({ ...session, user: u });
}

export async function changePassword(newPassword: string): Promise<void> {
    if (!session) throw new Error('سجّل دخولك أولًا.');
    const at = await ensureFreshToken();
    let r: Response;
    try {
        r = await fetch(`${SUPA_URL}/auth/v1/user`, {
            method: 'PUT',
            headers: { apikey: SUPA_KEY, Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword }),
        });
    } catch { throw new Error('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.'); }
    if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(arError(d.error_code || '', d.msg || d.message || '', r.status));
    }
}
