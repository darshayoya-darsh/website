/* AZU Science AI Agent — provider layer.
   The chat UI talks only to the AgentProvider interface, so the backend and
   the model provider can be swapped later without touching the UI. */

export type AgentSource = { title: string; url?: string };
export type AgentMessage = { id: string; role: 'user' | 'assistant'; text: string; sources?: AgentSource[] };
export type AgentReply = { text: string; sources?: AgentSource[] };

export interface AgentProvider {
    name: string;
    send(history: AgentMessage[], signal?: AbortSignal): Promise<AgentReply>;
}

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
    async send(history: AgentMessage[], signal?: AbortSignal): Promise<AgentReply> {
        // text/plain keeps this a CORS simple request (no preflight), which some
        // mobile browsers/proxies mishandle; the Worker parses the body as JSON
        // regardless of content type. One automatic retry rides out transient
        // mobile network drops.
        const body = JSON.stringify({ messages: history.map(({ role, text }) => ({ role, text })) });
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
                return await res.json();
            } catch (err) {
                lastError = err;
                if (attempt === 0) await new Promise(r => setTimeout(r, 1200));
            }
        }
        throw lastError;
    }
}

const AGENT_ENDPOINT = 'https://azu-science-agent.darshayoya.workers.dev';

export const agentProvider: AgentProvider = AGENT_ENDPOINT ? new HttpProvider(AGENT_ENDPOINT) : new SoonProvider();
