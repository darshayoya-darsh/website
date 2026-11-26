/* AZU Science Worker.
   - / (POST, GET ?m=): AI agent proxy, owns the Groq key server-side.
   - /upload (POST multipart): scoped-admin course-file upload to Backblaze B2,
     metadata row in Supabase under the caller's own JWT so RLS enforces scope.
   - /delete (POST): removes the B2 object and the files row (RLS enforced).
   - /file-url (GET): short-lived download URL for a live file, any signed-in
     student; admins can fetch URLs for anything in their scope.
   Secrets (wrangler secret put): GEMINI_API_KEY, GROQ_API_KEY, B2_KEY_ID, B2_APPLICATION_KEY.
   Everything else lives in wrangler.toml [vars]. */

const SYSTEM_PROMPT = `أنت "مساعد AZU Science"، المساعد الذكي لمنصة AZU Science الطلابية لكليات العلوم بجامعة الأزهر.

هويتك ومن صنعك:
- عندما تُسأل من أنت: أجب أنك المساعد الذكي لمنصة AZU Science، طوّرني وجهّزني مصطفى محمود، طالب بقسم الفيزياء والرياضيات بكلية العلوم جامعة الأزهر.
- مؤسس المنصة وبانيها هو مصطفى محمود، طالب بقسم الفيزياء والرياضيات. لا تذكر أي اسم عائلة له إطلاقًا.
- لا تذكر أي وسيلة تواصل في أي إجابة إلا إذا سأل الطالب صراحة عن مؤسس المنصة أو عن كيفية التواصل معه أو مع إدارة المنصة. عندها فقط أجب: مؤسس المنصة مصطفى محمود، ويمكن التواصل معه عبر البريد الإلكتروني darshayoya@gmail.com أو واتساب https://wa.me/201225728551 أو فيسبوك https://www.facebook.com/share/19qWhxdbVs/. لا تخترع بريدًا أو رقمًا أو رابطًا آخر، ولا تُنهِ أي إجابة أخرى بسطر عن التواصل أو عن المؤسس.

معرفتك عن المنصة (التزم بها ولا تضف إليها):
- منصة طلابية من الطلاب وإليهم، تخدم أربع كليات علوم بجامعة الأزهر (أربع فقط): علوم بنين القاهرة، علوم بنات القاهرة، علوم بنين أسيوط، علوم بنات أسيوط.
- البيانات الأكاديمية المعروضة حاليًا في كل المنصة مأخوذة من لائحة كلية العلوم بنين القاهرة، مؤقتًا، لحين وصول لوائح الكليات الثلاث الأخرى؛ إن سألك طالب من كلية أخرى عن تفاصيل تخص كليته، وضّح أن المعروض حاليًا بيانات علوم بنين القاهرة وأن بيانات كليته ستُضاف عند توفر لوائحها.
- القسم الأكاديمي يُفتح من تبويب «أكاديمي» في القائمة العلوية: يختار الطالب أولًا بين «أقسام أساسية» و«برامج متميزة». الأقسام الأساسية: فيزياء ورياضيات، كيمياء، بيولوجي، جيولوجيا، والمقررات مرتبة حسب السنة (من الأولى إلى الرابعة) ثم الشعبة ثم الترم (الأول والثاني). والبرامج المتميزة ثمانية بنظام الساعات المعتمدة والدراسة بالإنجليزية: الكيمياء والكيمياء الحيوية، الكيمياء التطبيقية الصناعية، الفيزياء النووية والمفاعلات، الفيزياء الإشعاعية والطبية، التكنولوجيا الحيوية والكيمياء الحيوية الجزيئية، الميكروبيولوجي والكيمياء الحيوية، بكالوريوس العلوم في الحوسبة الذكية، التحاليل البيولوجية والكيمياء.
- ملفات المقررات: امتحانات سابقة، محاضرات، سلايدات الدكتور، كتاب الكلية، وملفات أخرى؛ يرفعها مشرفو الأقسام وتظهر للطلاب فور رفعها. حالة الملفات الحالية (من قاعدة البيانات مباشرة): {CATALOG}
- معلومات موثقة من مصادر الكلية الرسمية (بروشورات وإعلانات معتمدة)؛ التزم بها حرفيًا عند السؤال عنها ولا تضف إليها: {KNOWLEDGE}
- هذه المعلومات الموثقة قد لا تكون معروضة على صفحات المنصة نفسها؛ عند الإجابة منها قل إنها من البروشور الرسمي للكلية عبر المنصة، ولا تطلب من الطالب البحث عنها في صفحة البرنامج.
- الأدوات (من تبويب «أدوات»): حاسبة التقدير، وهي محوّل استرشادي بين النسبة المئوية والتقدير ونقاط الـ GPA وفق هذا المقياس: ممتاز A (4.0) من 90٪، A- (3.7) من 85، جيد جدًا B+ (3.3) من 80، B (3.0) من 75، B- (2.7) من 70، جيد C+ (2.3) من 65، C (2.0) من 60، مقبول C- (1.7) من 57، D+ (1.3) من 55، D (1.0) من 50، وأقل من 50 راسب F. نتائجها استرشادية مبنية على نموذج لوائح الساعات المعتمدة وليست بديلًا عن النتائج الرسمية. وهناك أيضًا مكتبة برامج علمية مقترحة لكل تخصص، وبحث شامل في محتوى المنصة.
- الصفحات: فرص (تدريبات ومنح ومسابقات)، أخبار، مجتمع، عن المنصة، أسئلة شائعة، تواصل معنا، الإبلاغ عن مشكلة.
- الحسابات: التسجيل بالبريد الإلكتروني مع تأكيد البريد. لوحة المشرفين مخصصة للمشرفين فقط.
- أي ميزة خارج هذا الوصف (نتائج رسمية، جداول امتحانات، أخبار لحظية) غير متاحة حاليًا؛ إن سُئلت عنها قل إنها غير متاحة حاليًا ولا تَعِد بها.

حدودك:
- أنت متخصص في منصة AZU Science ومحتواها فقط. أجب عن أسئلة المنصة وأقسامها ومقرراتها وملفاتها وأدواتها وحساباتها، وعن كيفية الاستفادة منها في الدراسة.
- إن سُئلت عن شيء خارج المنصة (شرح درس، حل واجب، معلومة عامة، أخبار، أي موضوع آخر) اعتذر بلطف وبجملة واحدة، وقل إنك متخصص في منصة AZU Science فقط، ووجّه الطالب إلى ما يفيده داخلها (مثلًا: ملفات المقرر أو حاسبة التقدير).

أسلوب الإجابة:
- تحدث بالعربية المصرية البسيطة الودودة، كطالب بيشرح لزميله، مع الحفاظ على وضوح المصطلحات العلمية.
- أجب إجابة كاملة وافية: ابدأ بجملة مباشرة تجيب عن السؤال، ثم فصّل في نقاط منظمة عند الحاجة، واختم بخطوة عملية واحدة عندما تفيد (مثلًا: أين يجد الطالب الشيء في المنصة).
- لا تختصر إجابة تحتاج تفصيلًا، ولا تحشو إجابة بسيطة.
- لا تخترع أي معلومة أكاديمية: لا مواعيد امتحانات، لا درجات، لا نسب نجاح، لا محتوى مقررات بالتفصيل، لا أرقام من اللائحة، لا أسماء أساتذة. إن لم تكن متأكدًا قل ذلك صراحة واقترح مراجعة إدارة الكلية.
- عندما تستند إلى معلومة من بيانات المنصة المرسلة إليك، اذكر أنها من المنصة.
- لا تستخدم الرموز التعبيرية إطلاقًا.
- لا تستخدم تنسيق ماركداون إطلاقًا: لا نجوم للتغميق ولا شبابيك للعناوين ولا علامات اقتباس كود؛ اكتب نصًا عاديًا، وابدأ النقاط بشرطة بسيطة.`;

/* Live course-file catalog for the agent, cached per isolate for 5 minutes.
   Reads through the publishable key: RLS (files_read_live) does the enforcing. */
const FACULTY_AR = {
    'boys-cairo': 'علوم بنين — القاهرة',
    'girls-cairo': 'علوم بنات — القاهرة',
    'boys-assiut': 'علوم بنين — أسيوط',
    'girls-assiut': 'علوم بنات — أسيوط',
};
const DEPT_AR = {
    'physics-math': 'فيزياء ورياضيات',
    chemistry: 'كيمياء',
    biology: 'بيولوجي',
    geology: 'جيولوجيا',
    'chem-biochem': 'برنامج الكيمياء والكيمياء الحيوية',
    'chem-industrial': 'برنامج الكيمياء التطبيقية الصناعية',
    'nuclear-physics': 'برنامج الفيزياء النووية والمفاعلات',
    'rad-physics': 'برنامج الفيزياء الإشعاعية والطبية',
    biotech: 'برنامج التكنولوجيا الحيوية والكيمياء الحيوية الجزيئية',
    'micro-biochem': 'برنامج الميكروبيولوجي والكيمياء الحيوية',
    'smart-computing': 'برنامج الحوسبة الذكية',
    'bio-analysis': 'برنامج التحاليل البيولوجية والكيمياء',
};
const KIND_AR = { exam: 'امتحان سابق', lecture: 'محاضرة', slides: 'سلايدات الدكتور', book: 'كتاب الكلية', other: 'أخرى' };
const YEAR_AR = { 1: 'السنة الأولى', 2: 'السنة الثانية', 3: 'السنة الثالثة', 4: 'السنة الرابعة' };

let catalogCache = { at: 0, text: '' };
async function fileCatalog(env) {
    if (catalogCache.text && Date.now() - catalogCache.at < 300_000) return catalogCache.text;
    try {
        const r = await fetch(`${env.SUPA_URL}/rest/v1/files?status=eq.live&select=faculty,department,year,course_code,title,kind&order=created_at.desc&limit=120`, {
            headers: { apikey: env.SUPA_KEY, Authorization: `Bearer ${env.SUPA_KEY}` },
        });
        if (!r.ok) return catalogCache.text;
        const rows = await r.json();
        let text;
        if (!Array.isArray(rows) || !rows.length) {
            text = 'لا توجد ملفات مرفوعة حتى الآن؛ تُضاف تباعًا.';
        } else {
            const lines = rows.map((f) => `- ${f.course_code}: ${f.title} (${KIND_AR[f.kind] || f.kind}، ${DEPT_AR[f.department] || f.department}، ${YEAR_AR[f.year] || f.year}، ${FACULTY_AR[f.faculty] || f.faculty})`);
            text = `عدد الملفات المتاحة الآن ${rows.length}:\n${lines.join('\n')}`;
        }
        catalogCache = { at: Date.now(), text };
    } catch { /* keep the cached/empty catalog */ }
    return catalogCache.text;
}

/* Verified knowledge from official faculty sources (brochures, announcements),
   stored in the knowledge_docs table; cached per isolate for 5 minutes.
   Readable through the publishable key (public program info, RLS read-only). */
let knowledgeCache = { at: 0, text: '' };
async function knowledgeDocs(env) {
    if (knowledgeCache.text && Date.now() - knowledgeCache.at < 300_000) return knowledgeCache.text;
    try {
        const r = await fetch(`${env.SUPA_URL}/rest/v1/knowledge_docs?select=title,body&order=updated_at.desc&limit=40`, {
            headers: { apikey: env.SUPA_KEY, Authorization: `Bearer ${env.SUPA_KEY}` },
        });
        if (!r.ok) return knowledgeCache.text;
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length) {
            knowledgeCache = { at: Date.now(), text: rows.map((d) => `${d.title}:\n${d.body}`).join('\n\n') };
        }
    } catch { /* keep the cached/empty knowledge */ }
    return knowledgeCache.text;
}

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

/* Sliding-window rate limits stored in the database (rate_buckets +
   rate_hit RPC), so limits hold across all worker isolates. Fails open on a
   database error: availability beats strictness at launch scale. */
async function rateHit(env, key, cap, windowMs, token) {
    try {
        const r = await fetch(`${env.SUPA_URL}/rest/v1/rpc/rate_hit`, {
            method: 'POST',
            headers: {
                apikey: env.SUPA_KEY,
                Authorization: `Bearer ${token || env.SUPA_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_key: key, p_cap: cap, p_window_ms: windowMs }),
        });
        if (!r.ok) return false;
        return (await r.json()) === true;
    } catch { return false; }
}

async function rateLimited(env, ip) {
    const [min, day] = await Promise.all([
        rateHit(env, `ip:${ip}:m`, RATE_PER_MIN, 60_000),
        rateHit(env, `ip:${ip}:d`, RATE_PER_DAY, 86_400_000),
    ]);
    return min || day;
}

/* key: per-user bucket name, cap: max hits per windowMs. Returns true when limited. */
async function userRateLimited(env, key, cap, windowMs, token) {
    return rateHit(env, `u:${key}`, cap, windowMs, token);
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
    for (let attempt = 0; attempt < 2; attempt++) {
        const a = await b2Authorize(env);
        const r = await fetch(`${a.apiUrl}/b2api/v2/${action}`, {
            method: 'POST',
            headers: { Authorization: a.token, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (r.status === 401) { b2auth = null; continue; } // token expired; re-authorize once
        if (!r.ok) throw new Error(`${action} failed: ${r.status}`);
        return r.json();
    }
    throw new Error(`${action} failed: 401`);
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
    if (await userRateLimited(env, `${user.id}:up`, 30, 3_600_000, token)) {
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
    // Some mobile browsers send no MIME type; then the extension must check out.
    if (!file.type && !/\.(pdf|docx?|pptx?|xlsx?|jpe?g|png|webp)$/i.test(file.name || '')) {
        return json({ error: 'نوع الملف غير مدعوم. PDF أو ملفات Office أو صور فقط.' }, 400);
    }
    const faculty = cleanText(form.get('faculty'), 50);
    const category = cleanText(form.get('category'), 20) || 'basic';
    const department = cleanText(form.get('department'), 100);
    const year = Number(form.get('year'));
    const course = cleanText(form.get('course_code'), 150);
    const title = cleanText(form.get('title'), 200) || cleanText(file.name, 200);
    const kind = cleanText(form.get('kind'), 20);
    if (!faculty || !department || !['basic', 'special'].includes(category) || !(year >= 1 && year <= 4) || !course || !FILE_KINDS.has(kind)) {
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
            faculty, department, year, category,
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
    if (await userRateLimited(env, `${user.id}:del`, 60, 3_600_000, token)) {
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

    // DB row first (RLS enforces scope), then the object; a failed object
    // delete leaves an invisible orphan, not a dangling public record.
    const del = await restFiles(env, token, `?id=eq.${id}`, { method: 'DELETE' });
    if (!del.ok) return json({ error: 'تعذر حذف السجل. أعد المحاولة.' }, 500);
    await b2DeleteByName(env, row.b2_key).catch(() => {});
    return json({ ok: true });
}

async function handleFileUrl(request, env, url) {
    const token = bearer(request);
    if (!token) return json({ error: 'سجّل دخولك أولًا.' }, 401);
    const user = await verifyUser(env, token);
    if (!user) return json({ error: 'انتهت الجلسة؛ سجّل دخولك من جديد.' }, 401);
    if (await userRateLimited(env, `${user.id}:url`, 120, 3_600_000, token)) {
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

/* ---------- Contact/report forms -> email via Brevo ----------
   The browser cannot send mail and Workers cannot open SMTP sockets, so the
   form posts here and the Worker calls Brevo's HTTP API. BREVO_API_KEY is a
   wrangler secret; until it exists the endpoint answers 503 and the frontend
   falls back to the visitor's mail app. */
const CONTACT_DEST = 'darshayoya@gmail.com';

async function handleMessage(request, env) {
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
    if (!env.BREVO_API_KEY) return json({ error: 'خدمة الرسائل غير مفعّلة بعد.' }, 503);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await rateHit(env, `msg:${ip}`, 10, 3_600_000)) {
        return json({ error: 'عدد الرسائل كبير الآن. جرّب بعد قليل.' }, 429);
    }
    let body;
    try { body = await request.json(); } catch { return json({ error: 'طلب غير صالح.' }, 400); }
    const kind = body?.kind === 'report' ? 'report' : 'contact';
    const name = cleanText(body?.name, 100);
    const from = cleanText(body?.from, 150);
    const message = cleanText(body?.message, 4000);
    const page = cleanText(body?.page, 300);
    if (!name || !message) return json({ error: 'اكتب اسمك ورسالتك.' }, 400);
    if (from && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) return json({ error: 'البريد الإلكتروني غير صالح.' }, 400);

    const subject = kind === 'report' ? 'بلاغ عن مشكلة — AZU Science' : 'رسالة من منصة AZU Science';
    const lines = [`الاسم: ${name}`, `البريد: ${from || 'غير مذكور'}`, '', message];
    if (kind === 'report' && page) lines.push('', `الصفحة: ${page}`);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
            sender: { name: 'AZU Science', email: CONTACT_DEST },
            to: [{ email: CONTACT_DEST }],
            replyTo: from ? { email: from, name } : undefined,
            subject,
            textContent: lines.join('\n'),
        }),
    });
    if (!res.ok) return json({ error: 'تعذر إرسال الرسالة. أعد المحاولة.' }, 502);
    return json({ ok: true });
}

/* ---------- AI agent (existing) ---------- */

async function handleAgent(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await rateLimited(env, ip)) {
        return json({ text: 'عدد الطلبات كبير الآن. جرّب مرة أخرى بعد قليل.', sources: [] }, 200);
    }

    // POST carries { messages: [{role, text}] } in the body. No GET variant:
    // conversation text must never appear in a URL (logs, history).
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
    let raw = [];
    let body;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'invalid json' }, 400);
    }
    raw = Array.isArray(body?.messages) ? body.messages : [];

    const history = raw
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
        .slice(-MAX_MESSAGES)
        .map((m) => ({ role: m.role, content: m.text.slice(0, MAX_CHARS) }));
    if (!history.length || history[history.length - 1].role !== 'user') {
        return json({ error: 'no user message' }, 400);
    }

    const [catalog, knowledge] = await Promise.all([fileCatalog(env), knowledgeDocs(env)]);
    const systemPrompt = SYSTEM_PROMPT
        .replace('{CATALOG}', catalog || 'تعذر تحميل قائمة الملفات الآن.')
        .replace('{KNOWLEDGE}', knowledge || 'لا توجد معلومات إضافية موثقة حتى الآن.');

    /* Primary brain: Gemini (free tier). Falls back to the Groq chain when the
       key is missing or the quota/errors kick in. */
    if (env.GEMINI_API_KEY) {
        try {
            const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
                    generationConfig: { maxOutputTokens: 1200, temperature: 0.4 },
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
                if (text) return json({ text, sources: [] });
            }
        } catch { /* fall through to Groq */ }
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
                    messages: [{ role: 'system', content: systemPrompt }, ...history],
                    max_tokens: 1200,
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
            if (url.pathname === '/message') return await handleMessage(request, env);
            if (url.pathname === '/' || url.pathname === '') return await handleAgent(request, env);
        } catch {
            return json({ error: 'خطأ غير متوقع. أعد المحاولة.' }, 500);
        }
        return json({ error: 'not found' }, 404);
    },
};
