/* AZU Science AI Agent proxy.
   Owns the Gemini key server-side: the public frontend talks only to this
   Worker. Adds the system prompt, input limits and simple per-IP rate
   limiting. Response shape matches the frontend HttpProvider:
   { text: string, sources?: { title, url? }[] } */

const SYSTEM_PROMPT = `أنت "مساعد AZU Science"، مساعد أكاديمي لطلاب كليات العلوم الأربع بجامعة الأزهر (بنين القاهرة، بنات القاهرة، بنين أسيوط، بنات أسيوط).

قواعد لا تتجاوزها:
- أجب بنفس لغة السؤال، والعربية أولًا، بأسلوب واضح ومهذب وموجز.
- لا تخترع أي معلومة أكاديمية: لا مواعيد، لا درجات، لا نسب نجاح، لا محتوى مقررات، لا أرقام لائحة، لا أسماء أساتذة. إن لم تكن متأكدًا أو لا يوجد لديك مصدر، قل ذلك صراحة واقترح على الطالب مراجعة إدارة الكلية أو المنصة.
- عندما تكون المعلومة متاحة لديك من محتوى المنصة المرسل إليك، استند إليه فقط واذكر أنه من المنصة.
- لا تستخدم الرموز التعبيرية إطلاقًا.
- الإجابات قصيرة ومنظمة، وبنقاط عند الحاجة.`;

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;
const RATE_PER_MIN = 10;
const RATE_PER_DAY = 120;

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

function cors(extra = {}) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...extra,
    };
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: cors({ 'Content-Type': 'application/json; charset=utf-8' }),
    });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
        if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (rateLimited(ip)) {
            return json({ text: 'عدد الطلبات كبير الآن. جرّب مرة أخرى بعد قليل.', sources: [] }, 200);
        }

        let body;
        const models = (env.MODELS || 'gemini-3.1-flash-lite,gemini-flash-latest,gemini-2.5-flash').split(',');
        for (const model of models) {
            try {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
                        body: JSON.stringify(payload),
                    }
                );
                if (!res.ok) continue;
                const data = await res.json();
                const text = (data.candidates?.[0]?.content?.parts || [])
                    .map((p) => p.text || '').join('').trim();
                if (!text || /high demand|try again later/i.test(text)) continue;
                return json({ text, sources: [] });
            } catch { /* try next model */ }
        }
        return json({
            text: 'المساعد غير متاح الآن بسبب الضغط على الخدمة. جرّب مرة أخرى بعد قليل.',
            sources: [],
        }, 200);
    },
};
