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
        const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history.map(({ role, text }) => ({ role, text })) }),
            signal,
        });
        if (!res.ok) throw new Error(`agent endpoint returned ${res.status}`);
        return res.json();
    }
}

const AGENT_ENDPOINT = ''; // set this when the backend is live

export const agentProvider: AgentProvider = AGENT_ENDPOINT ? new HttpProvider(AGENT_ENDPOINT) : new SoonProvider();
