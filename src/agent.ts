/* AZU Science AI Agent — provider layer.
   The chat UI talks only to the AgentProvider interface, so the backend and
   the model provider can be swapped later without touching the UI. */

export type AgentSource = { title: string; url?: string };
export type AgentMessage = { id: string; role: 'user' | 'assistant'; text: string; sources?: AgentSource[] };
export type AgentReply = { text: string; sources?: AgentSource[] };

export interface AgentProvider {
    name: string;
    send(history: AgentMessage[], signal?: AbortSignal, opts?: SendOpts): Promise<AgentReply>;
    feedback?(f: { rating: 'up' | 'down'; question: string; answer: string }): void;
}
export type SendOpts = { profile?: Record<string, unknown>; onDelta?: (t: string) => void };

/* No backend is connected yet: every question gets one honest, minimal answer. */
class SoonProvider implements AgentProvider {
    name = 'soon';
    async send(): Promise<AgentReply> {
        return { text: 'مساعد AZU Science الذكي — قريبًا.' };
    }
}

/* HTTP provider for the future backend. The endpoint owns the model key, RAG
   and tools; the frontend sends the conversation and renders what comes back.
   Expected response shape: { text: string, sources?: { title, url? }[] }. */
class HttpProvider implements AgentProvider {
    name = 'http';
    constructor(private endpoint: string) {}
    feedback(f: { rating: 'up' | 'down'; question: string; answer: string }) {
        fetch(this.endpoint.replace(/\/?$/, '/feedback'), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(f) }).catch(() => {});
    }
    async send(history: AgentMessage[], signal?: AbortSignal, opts?: SendOpts): Promise<AgentReply> {
        // text/plain keeps this a CORS simple request (no preflight), which some
        // mobile browsers/proxies mishandle; the Worker parses the body as JSON
        // regardless of content type. One automatic retry rides out transient
        // mobile network drops.
        const body = JSON.stringify({ messages: history.map(({ role, text }) => ({ role, text })), profile: opts?.profile, stream: !!opts?.onDelta });
        let lastError: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const res = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body,
                    signal,
                });
                if (!res.ok) throw new Error(`agent endpoint returned ${res.status}`);
                if ((res.headers.get('content-type') || '').includes('text/event-stream') && res.body) {
                    const reader = res.body.getReader(); const dec = new TextDecoder();
                    let buf = '', acc = '', final: AgentReply | null = null;
                    for (;;) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buf += dec.decode(value, { stream: true });
                        let i;
                        while ((i = buf.indexOf('\n\n')) >= 0) {
                            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
                            if (!line.startsWith('data:')) continue;
                            try {
                                const j = JSON.parse(line.slice(5));
                                if (j.done) final = { text: j.text, sources: j.sources };
                                else if (typeof j.d === 'string') { acc += j.d; opts?.onDelta?.(acc); }
                            } catch { /* skip */ }
                        }
                    }
                    return final ?? { text: acc.trim() || 'تعذر الحصول على إجابة الآن. حاول مرة أخرى.' };
                }
                return await res.json();
            } catch (err) {
                lastError = err;
                if (attempt === 0) await new Promise(r => setTimeout(r, 1200));
            }
        }
        throw lastError ?? new Error('agent unreachable');
    }
}

const AGENT_ENDPOINT = 'https://azu-science-agent.darshayoya.workers.dev';

export const agentProvider: AgentProvider = AGENT_ENDPOINT ? new HttpProvider(AGENT_ENDPOINT) : new SoonProvider();
