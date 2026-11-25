import React from 'react';

/* Supabase auth via plain REST (no SDK): the publishable key is public by
   design; all reads/writes are gated by Row Level Security server-side. */

const SUPA_URL = 'https://nhufspxzwbtvmamukpoa.supabase.co';
const SUPA_KEY = 'sb_publishable_Q0OuPQHYGAb271d0jkxIBw_6yMueXMk';
const LS_KEY = 'azu_auth_v1';
const HAS_ACCOUNT_KEY = 'azu_has_account';

export interface AuthUser { id: string; email: string; fullName: string; role: string; }
export interface AuthSession { access_token: string; refresh_token: string; user: AuthUser; }

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
            localStorage.setItem(LS_KEY, JSON.stringify(s));
            localStorage.setItem(HAS_ACCOUNT_KEY, '1');
        } else localStorage.removeItem(LS_KEY);
    } catch { /* private mode */ }
    emit();
}

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
    const r = await fetch(`${SUPA_URL}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
            apikey: SUPA_KEY,
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
        const code = (data.error_code || data.error || '') as string;
        const msg = (data.error_description || data.msg || data.message || '') as string;
        const err = new Error(arError(code, msg)) as Error & { code?: string };
        err.code = code || msg;
        throw err;
    }
    return data;
}

function arError(code: string, msg: string): string {
    const m = `${code} ${msg}`.toLowerCase();
    if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'البريد أو كلمة المرور غير صحيحة.';
    if (m.includes('user_already') || m.includes('already registered') || m.includes('already been registered')) return 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.';
    if (m.includes('weak_password') || m.includes('at least 6')) return 'كلمة المرور ضعيفة؛ ٦ أحرف على الأقل.';
    if (m.includes('email_not_confirmed')) return 'الحساب غير مؤكد بعد؛ راجع بريدك الإلكتروني.';
    if (m.includes('rate_limit') || m.includes('over_rate')) return 'محاولات كثيرة؛ انتظر قليلًا ثم أعد المحاولة.';
    return 'حدث خطأ غير متوقع. أعد المحاولة.';
}

async function loadProfile(access_token: string, user: { id: string; email?: string; user_metadata?: { full_name?: string } }): Promise<AuthUser> {
    let role = 'student';
    let fullName = user?.user_metadata?.full_name || '';
    try {
        const rows = await api(`/rest/v1/profiles?id=eq.${user.id}&select=full_name,role`, undefined, access_token);
        if (Array.isArray(rows) && rows[0]) {
            role = rows[0].role || 'student';
            fullName = rows[0].full_name || fullName;
        }
    } catch { /* profile row may lag the signup trigger by a beat */ }
    return { id: user.id, email: user.email || '', fullName, role };
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
    const data = await api('/auth/v1/signup', { email, password, data: { full_name: fullName } });
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

/* Resend the signup confirmation email (current account model keeps email
   confirmation until the reference-list model is decided). */
export async function resendConfirmation(email: string): Promise<void> {
    await api('/auth/v1/resend', { type: 'signup', email });
}
