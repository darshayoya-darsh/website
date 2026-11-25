/* AZU Science Worker.
   - / (POST, GET ?m=): AI agent proxy, owns the Groq key server-side.
   - /upload (POST multipart): scoped-admin course-file upload to Backblaze B2,
     metadata row in Supabase under the caller's own JWT so RLS enforces scope.
   - /delete (POST): removes the B2 object and the files row (RLS enforced).
   - /file-url (GET): short-lived download URL for a live file, any signed-in
     student; admins can fetch URLs for anything in their scope.
   Secrets (wrangler secret put): GROQ_API_KEY, B2_KEY_ID, B2_APPLICATION_KEY.
   Everything else lives in wrangler.toml [vars]. */

const SYSTEM_PROMPT = `أنت "مساعد AZU Science"، مساعد أكاديمي لطلاب كليات العلوم الأربع بجامعة الأزهر (بنين القاهرة، بنات القاهرة، بنين أسيوط، بنات أسيوط).

قواعد لا تتجاوزها:
- أجب بنفس لغة السؤال، والعربية أولًا، بأسلوب واضح ومهذب وموجز.
- لا تخترع أي معلومة أكاديمية: لا مواعيد، لا درجات، لا نسب نجاح، لا محتوى مقررات، لا أرقام لائحة، لا أسماء أساتذة. إن لم تكن متأكدًا أو لا يوجد لديك مصدر، قل ذلك صراحة واقترح على الطالب مراجعة إدارة الكلية أو المنصة.
- عندما تكون المعلومة متاحة لديك من محتوى المنصة المرسل إليك، استند إليه فقط واذكر أنه من المنصة.
- عند السؤال عن المنصة نفسها، التزم بهذا الوصف فقط ولا تضف إليه شيئًا ولا تحوّره بعبارات مثل "عادةً" أو "إن وجدت": «منصة طلابية لكليات العلوم الأربع بجامعة الأزهر، فيها قسم أكاديمي يعرض المقررات حسب القسم والسنة والشعبة والترم، وملفات المقررات (امتحانات سابقة، محاضرات، سلايدات الدكتور، كتاب الكلية) تُضاف تباعًا، وحاسبة تقدير تراكمي استرشادية، وصفحات للأسئلة الشائعة والتواصل والإبلاغ عن مشكلة». أي ميزة خارج هذا الوصف (نتائج، إعلانات، تسجيل، حسابات، تواصل مع إدارة) غير موجودة حاليًا؛ إن سُئلت عنها قل إنها غير متاحة حاليًا ولا تَعِد بها.
- لا تستخدم الرموز التعبيرية إطلاقًا.
- الإجابات قصيرة ومنظمة، وبنقاط عند الحاجة.`;

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;
const RATE_PER_MIN = 10;
const RATE_PER_DAY = 120;

/* 70MB per file (cap set by the platform owner; big references run ~1700 pages). */
const MAX_FILE_BYTES = 70 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
]);
const FILE_KINDS = new Set(['exam', 'lecture', 'slides', 'book', 'other']);

// Per-isolate sliding windows. Good enough for the free tier; each colo
// isolate keeps its own counter.
const buckets = new Map();

function rateLimited(ip) {
    const now = Date.now();
    let b = buckets.get(ip);
    if (!b) { b = { min: [], day: [] }; buckets.set(ip, b); }
    b.min = b.min.filter((t) => now - t < 60_000);
    b.day = b.day.filter((t) => now - t < 86_400_000);
    if (b.min.length >= RATE_PER_MIN || b.day.length >= RATE_PER_DAY) return true;
    b.min.push(now); b.day.push(now);
    if (buckets.size > 5000) buckets.clear();
    return false;
}

/* key: per-user bucket name, cap: max hits per windowMs. Returns true when limited. */
function userRateLimited(key, cap, windowMs) {
    const now = Date.now();
    const k = `u:${key}`;
    let b = buckets.get(k);
    if (!b) { b = { hits: [] }; buckets.set(k, b); }
    if (!b.hits) b.hits = [];
    b.hits = b.hits.filter((t) => now - t < windowMs);
    if (b.hits.length >= cap) return true;
    b.hits.push(now);
    return false;
}

function cors(extra = {}) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...extra,
    };
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: cors({ 'Content-Type': 'application/json; charset=utf-8' }),
    });
}

/* ---------- Supabase helpers (caller's JWT: RLS does the enforcing) ---------- */

async function verifyUser(env, token) {
    const r = await fetch(`${env.SUPA_URL}/auth/v1/user`, {
        headers: { apikey: env.SUPA_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    return r.json();
}

/* Scope check against the database's own rule (admin_grants + super admins). */
async function canManage(env, token, faculty, track, year) {
    const r = await fetch(`${env.SUPA_URL}/rest/v1/rpc/can_manage`, {
        method: 'POST',
        headers: {
            apikey: env.SUPA_KEY,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_faculty: faculty, p_track: track, p_year: year }),
    });
    if (!r.ok) return false;
    return (await r.json()) === true;
}

async function restFiles(env, token, path, init = {}) {
    return fetch(`${env.SUPA_URL}/rest/v1/files${path}`, {
        ...init,
        headers: {
            apikey: env.SUPA_KEY,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });
}

/* ---------- Backblaze B2 helpers (key lives only here) ---------- */

let b2auth = null; // per-isolate cache; B2 tokens live 24h

async function b2Authorize(env) {
    if (b2auth) return b2auth;
    const r = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: { Authorization: `Basic ${btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`)}` },
    });
    if (!r.ok) { b2auth = null; throw new Error('b2 auth failed'); }
    const d = await r.json();
    b2auth = { apiUrl: d.apiUrl, token: d.authorizationToken, downloadUrl: d.downloadUrl };
    return b2auth;
}

async function b2Call(env, action, body) {
    const a = await b2Authorize(env);
    const r = await fetch(`${a.apiUrl}/b2api/v2/${action}`, {
        method: 'POST',
        headers: { Authorization: a.token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (r.status === 401) { b2auth = null; } // token expired; caller may retry once
    if (!r.ok) throw new Error(`${action} failed: ${r.status}`);
    return r.json();
}

async function b2Upload(env, key, file) {
    const up = await b2Call(env, 'b2_get_upload_url', { bucketId: env.B2_BUCKET_ID });
    const r = await fetch(up.uploadUrl, {
        method: 'POST',
        headers: {
            Authorization: up.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(key),
            'Content-Type': file.type || 'b2/x-auto',
            'X-Bz-Content-Sha1': 'do_not_verify',
        },
        body: file,
    });
    if (!r.ok) throw new Error(`b2 upload failed: ${r.status}`);
    return r.json(); // { fileId, fileName, ... }
}

async function b2DeleteByName(env, fileName) {
    const list = await b2Call(env, 'b2_list_file_names', {
        bucketId: env.B2_BUCKET_ID, prefix: fileName, maxFileCount: 1,
    });
    const hit = (list.files || []).find((f) => f.fileName === fileName);
    if (!hit) return false;
    await b2Call(env, 'b2_delete_file_version', { fileName, fileId: hit.fileId });
    return true;
}

/* ---------- Admin routes ---------- */

function bearer(request) {
    const h = request.headers.get('Authorization') || '';
    return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function cleanText(v, max) {
    return String(v || '').trim().slice(0, max);
}

async function handleUpload(request, env) {
    const token = bearer(request);
    if (!token) return json({ error: 'سجّل دخولك أولًا.' }, 401);
    const user = await verifyUser(env, token);
    if (!user) return json({ error: 'انتهت الجلسة؛ سجّل دخولك من جديد.' }, 401);
    if (userRateLimited(`${user.id}:up`, 30, 3_600_000)) {
        return json({ error: 'عدد الرفوع كبير الآن. جرّب بعد قليل.' }, 429);
    }

    let form;
    try { form = await request.formData(); } catch { return json({ error: 'طلب غير صالح.' }, 400); }
    const file = form.get('file');
    if (!file || typeof file === 'string') return json({ error: 'لا يوجد ملف.' }, 400);
    if (file.size > MAX_FILE_BYTES) return json({ error: 'الملف أكبر من ٧٠ ميجابايت.' }, 400);
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
        return json({ error: 'نوع الملف غير مدعوم. PDF أو ملفات Office أو صور فقط.' }, 400);
    }
    const faculty = cleanText(form.get('faculty'), 50);
    const department = cleanText(form.get('department'), 100);
    const year = Number(form.get('year'));
    const course = cleanText(form.get('course_code'), 150);
    const title = cleanText(form.get('title'), 200) || cleanText(file.name, 200);
    const kind = cleanText(form.get('kind'), 20);
    if (!faculty || !department || !(year >= 1 && year <= 4) || !course || !FILE_KINDS.has(kind)) {
        return json({ error: 'أكمل كل الحقول المطلوبة.' }, 400);
    }

    if (!(await canManage(env, token, faculty, department, year))) {
        return json({ error: 'ليس لديك صلاحية على هذا النطاق.' }, 403);
    }

    const safeName = cleanText(file.name, 80).replace(/[^\w.؀-ۿ-]+/g, '_') || 'file';
    const key = `${faculty}/${department}/${year}/${Date.now()}-${safeName}`;
    let uploaded;
    try {
        uploaded = await b2Upload(env, key, file);
    } catch {
        return json({ error: 'تعذر رفع الملف إلى التخزين. أعد المحاولة.' }, 502);
    }

    const ins = await restFiles(env, token, '', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
            faculty, department, year,
            course_code: course, title, kind,
            b2_key: key, size_bytes: file.size,
            uploaded_by: user.id, status: 'live',
        }),
    });
    if (!ins.ok) {
        // RLS said no (or a race) - do not leave an orphaned object behind.
        await b2DeleteByName(env, key).catch(() => {});
        return json({ error: 'رفضت قاعدة البيانات الحفظ؛ تأكد من نطاق صلاحيتك.' }, 403);
    }
    const rows = await ins.json();
    return json({ ok: true, file: rows[0], b2FileId: uploaded.fileId });
}

async function handleDelete(request, env) {
    const token = bearer(request);
    if (!token) return json({ error: 'سجّل دخولك أولًا.' }, 401);
    const user = await verifyUser(env, token);
    if (!user) return json({ error: 'انتهت الجلسة؛ سجّل دخولك من جديد.' }, 401);
    if (userRateLimited(`${user.id}:del`, 60, 3_600_000)) {
        return json({ error: 'عدد الطلبات كبير الآن. جرّب بعد قليل.' }, 429);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: 'طلب غير صالح.' }, 400); }
    const id = Number(body?.id);
    if (!id) return json({ error: 'معرّف غير صالح.' }, 400);

    const got = await restFiles(env, token, `?id=eq.${id}&select=id,faculty,department,year,b2_key`);
    const rows = got.ok ? await got.json() : [];
    const row = rows[0];
    if (!row) return json({ error: 'الملف غير موجود.' }, 404);
    if (!(await canManage(env, token, row.faculty, row.department, row.year))) {
        return json({ error: 'ليس لديك صلاحية على هذا النطاق.' }, 403);
    }

    await b2DeleteByName(env, row.b2_key).catch(() => {});
    const del = await restFiles(env, token, `?id=eq.${id}`, { method: 'DELETE' });
    if (!del.ok) return json({ error: 'تعذر حذف السجل. أعد المحاولة.' }, 500);
    return json({ ok: true });
}

async function handleFileUrl(request, env, url) {
    const token = bearer(request);
    if (!token) return json({ error: 'سجّل دخولك أولًا.' }, 401);
    const user = await verifyUser(env, token);
    if (!user) return json({ error: 'انتهت الجلسة؛ سجّل دخولك من جديد.' }, 401);
    if (userRateLimited(`${user.id}:url`, 120, 3_600_000)) {
        return json({ error: 'عدد الطلبات كبير الآن. جرّب بعد قليل.' }, 429);
    }

    const id = Number(url.searchParams.get('id'));
    if (!id) return json({ error: 'معرّف غير صالح.' }, 400);
    const got = await restFiles(env, token, `?id=eq.${id}&select=id,faculty,department,year,b2_key,status`);
    const rows = got.ok ? await got.json() : [];
    const row = rows[0];
    if (!row) return json({ error: 'الملف غير موجود.' }, 404);
    if (row.status !== 'live' && !(await canManage(env, token, row.faculty, row.department, row.year))) {
        return json({ error: 'الملف غير متاح.' }, 403);
    }

    const auth = await b2Call(env, 'b2_get_download_authorization', {
        bucketId: env.B2_BUCKET_ID,
        fileNamePrefix: row.b2_key,
        validDurationInSeconds: 300,
    });
    const a = await b2Authorize(env);
    const name = row.b2_key.split('/').map(encodeURIComponent).join('/');
    return json({ url: `${a.downloadUrl}/file/${env.B2_BUCKET_NAME}/${name}?Authorization=${encodeURIComponent(auth.authorizationToken)}` });
}

/* ---------- AI agent (existing) ---------- */

async function handleAgent(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) {
        return json({ text: 'عدد الطلبات كبير الآن. جرّب مرة أخرى بعد قليل.', sources: [] }, 200);
    }

    // POST carries { messages: [{role, text}] } in the body. GET /?m= carries
    // a compact [[role, text], ...] in the query for networks that drop
    // cross-site POST bodies (observed on some mobile carriers).
    let raw = [];
    if (request.method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch {
            return json({ error: 'invalid json' }, 400);
        }
        raw = Array.isArray(body?.messages) ? body.messages : [];
    } else {
        const m = new URL(request.url).searchParams.get('m');
        if (!m) return json({ error: 'method not allowed' }, 405);
        try {
            const pairs = JSON.parse(m);
            if (Array.isArray(pairs)) {
                raw = pairs
                    .filter((p) => Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string')
                    .map((p) => ({ role: p[0], text: p[1] }));
            }
        } catch {
            return json({ error: 'invalid json' }, 400);
        }
    }

    const history = raw
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
        .slice(-MAX_MESSAGES)
        .map((m) => ({ role: m.role, content: m.text.slice(0, MAX_CHARS) }));
    if (!history.length || history[history.length - 1].role !== 'user') {
        return json({ error: 'no user message' }, 400);
    }

    const models = (env.MODELS || 'openai/gpt-oss-120b,qwen/qwen3.8-27b').split(',');
    for (const model of models) {
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: model.trim(),
                    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
                    max_tokens: 800,
                    temperature: 0.4,
                }),
            });
            if (!res.ok) continue;
            const data = await res.json();
            const text = (data.choices?.[0]?.message?.content || '').trim();
            if (!text) continue;
            return json({ text, sources: [] });
        } catch { /* try next model */ }
    }
    return json({
        text: 'المساعد غير متاح الآن بسبب الضغط على الخدمة. جرّب مرة أخرى بعد قليل.',
        sources: [],
    }, 200);
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
        if (request.method !== 'POST' && request.method !== 'GET') return json({ error: 'method not allowed' }, 405);

        const url = new URL(request.url);
        try {
            if (url.pathname === '/upload' && request.method === 'POST') return await handleUpload(request, env);
            if (url.pathname === '/delete' && request.method === 'POST') return await handleDelete(request, env);
            if (url.pathname === '/file-url' && request.method === 'GET') return await handleFileUrl(request, env, url);
            if (url.pathname === '/' || url.pathname === '') return await handleAgent(request, env);
        } catch {
            return json({ error: 'خطأ غير متوقع. أعد المحاولة.' }, 500);
        }
        return json({ error: 'not found' }, 404);
    },
};
