/* AZU Science AI Agent proxy.
   Owns the Groq key server-side: the public frontend talks only to this
   Worker. Adds the system prompt, input limits and simple per-IP rate
   limiting. Response shape matches the frontend HttpProvider:
   { text: string, sources?: { title, url? }[] } */

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
        try {
            body = await request.json();
        } catch {
            return json({ error: 'invalid json' }, 400);
        }

        const raw = Array.isArray(body?.messages) ? body.messages : [];
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
    },
};
