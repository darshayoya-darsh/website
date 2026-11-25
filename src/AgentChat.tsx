import React from 'react';
import { CopyButton } from '@instinct/files';
import { agentProvider, AgentMessage, AgentSource } from './agent';

/* The Instinct File viewer renders the page in a full-height frame where
   position:fixed follows the page, not the screen (web build sets no flag and
   keeps the floating button). In the File build src/main.tsx sets this flag,
   so the entry point is the topbar button instead, and the chat itself is a
   native <dialog> opened with showModal(), which stays on screen. */
const isFileEnv = () => typeof window !== 'undefined' && (window as any).__AZU_FILE_ENV__ === true;

export const AGENT_OPEN_EVENT = 'azu-agent-open';

const SUGGESTIONS = [
    'اشرح لي مقررًا علميًا',
    'ابحث عن محاضرة',
    'أنشئ خطة مذاكرة',
    'وضح لي المسارات المهنية لتخصصي',
];

function AgentIcon({ name, size = 20 }: { name: string; size?: number }) {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
    switch (name) {
        case 'spark': return <svg {...p}><path d="M12 2l2.2 6.2L21 10l-6.8 1.8L12 18l-2.2-6.2L3 10l6.8-1.8L12 2z" /></svg>;
        case 'close': return <svg {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>;
        case 'send': return <svg {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
        case 'up': return <svg {...p}><path d="M7 10v12" /><path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>;
        case 'down': return <svg {...p}><path d="M17 14V2" /><path d="M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" /></svg>;
        case 'flag': return <svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></svg>;
        case 'clip': return <svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>;
        case 'link': return <svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
        default: return null;
    }
}

let msgSeq = 0;
const nextId = (p: string) => `${p}${Date.now()}-${msgSeq++}`;

export function AgentChat() {
    const [open, setOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<AgentMessage[]>([]);
    const [draft, setDraft] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [rated, setRated] = React.useState<Record<string, 'up' | 'down'>>({});
    const [reported, setReported] = React.useState<Record<string, boolean>>({});
    const bodyRef = React.useRef<HTMLDivElement>(null);
    const dialogRef = React.useRef<HTMLDialogElement>(null);

    React.useEffect(() => {
        const onOpen = () => setOpen(true);
        window.addEventListener(AGENT_OPEN_EVENT, onOpen);
        return () => window.removeEventListener(AGENT_OPEN_EVENT, onOpen);
    }, []);

    React.useEffect(() => {
        const dlg = dialogRef.current;
        if (!dlg) return;
        if (open && !dlg.open) dlg.showModal();
        if (!open && dlg.open) dlg.close();
    }, [open]);

    React.useEffect(() => {
        const el = bodyRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight });
    }, [messages, busy, open]);

    const send = async (text: string) => {
        const q = text.trim();
        if (!q || busy) return;
        const userMsg: AgentMessage = { id: nextId('u'), role: 'user', text: q };
        setMessages((m: AgentMessage[]) => [...m, userMsg]);
        setDraft('');
        setBusy(true);
        try {
            const reply = await agentProvider.send([...messages, userMsg]);
            setMessages((m: AgentMessage[]) => [...m, { id: nextId('a'), role: 'assistant', text: reply.text, sources: reply.sources }]);
        } catch {
            setMessages((m: AgentMessage[]) => [...m, { id: nextId('a'), role: 'assistant', text: 'تعذر الاتصال بالمساعد الآن. تأكد من اتصالك بالإنترنت، ثم حاول مرة أخرى.' }]);
        } finally {
            setBusy(false);
        }
    };

    return <>
        {!isFileEnv() && <button type="button" className="azu-agent-fab" aria-label="مساعد AZU Science الذكي" aria-expanded={open} onClick={() => setOpen((o: boolean) => !o)}>
            <AgentIcon name={open ? 'close' : 'spark'} size={open ? 22 : 26} />
        </button>}
        <dialog ref={dialogRef} className="azu-agent" aria-label="مساعد AZU Science الذكي"
            onClose={() => setOpen(false)}
            onClick={e => { if (e.target === dialogRef.current) setOpen(false); }}>
            <div className="azu-agent-shell">
                <div className="azu-agent-head">
                    <span className="azu-agent-badge"><AgentIcon name="spark" size={16} /></span>
                    <div className="azu-agent-titles">
                        <div className="azu-agent-title" dir="rtl">مساعد AZU Science</div>
                        <div className="azu-agent-sub">AI ASSISTANT</div>
                    </div>
                    <button type="button" className="azu-agent-x" aria-label="إغلاق" onClick={() => setOpen(false)}><AgentIcon name="close" size={16} /></button>
                </div>
                <div className="azu-agent-body" ref={bodyRef}>
                    {messages.length === 0 && <div className="azu-agent-chips" dir="rtl">
                        {SUGGESTIONS.map(s => <button key={s} type="button" className="azu-agent-chip" onClick={() => send(s)}>{s}</button>)}
                    </div>}
                    {messages.map((m: AgentMessage) => <div key={m.id} className={`azu-agent-msg ${m.role}`}>
                        <div className="azu-agent-bubble" dir="auto">{m.text}</div>
                        {m.role === 'assistant' && <>
                            {m.sources && m.sources.length > 0 && <div className="azu-agent-sources" dir="rtl">
                                {m.sources.map((s: AgentSource) => s.url
                                    ? <a key={s.title} className="azu-agent-src" href={s.url} target="_blank" rel="noreferrer"><AgentIcon name="link" size={12} /> {s.title}</a>
                                    : <span key={s.title} className="azu-agent-src"><AgentIcon name="link" size={12} /> {s.title}</span>)}
                            </div>}
                            <div className="azu-agent-actions" dir="ltr">
                                <CopyButton text={m.text} label="نسخ" compact />
                                <button type="button" title="إجابة مفيدة" aria-label="إجابة مفيدة" className={rated[m.id] === 'up' ? 'on' : ''}
                                    onClick={() => setRated((r: Record<string, 'up' | 'down'>) => { const n = { ...r }; if (n[m.id] === 'up') delete n[m.id]; else n[m.id] = 'up'; return n; })}>
                                    <AgentIcon name="up" size={14} />
                                </button>
                                <button type="button" title="إجابة غير مفيدة" aria-label="إجابة غير مفيدة" className={rated[m.id] === 'down' ? 'on' : ''}
                                    onClick={() => setRated((r: Record<string, 'up' | 'down'>) => { const n = { ...r }; if (n[m.id] === 'down') delete n[m.id]; else n[m.id] = 'down'; return n; })}>
                                    <AgentIcon name="down" size={14} />
                                </button>
                                <button type="button" title="الإبلاغ عن معلومة غير دقيقة" aria-label="الإبلاغ عن معلومة غير دقيقة" className={reported[m.id] ? 'on' : ''}
                                    onClick={() => setReported((r: Record<string, boolean>) => ({ ...r, [m.id]: !r[m.id] }))}>
                                    <AgentIcon name="flag" size={14} />
                                </button>
                            </div>
                        </>}
                    </div>)}
                    {busy && <div className="azu-agent-msg assistant"><div className="azu-agent-bubble azu-agent-typing"><span /><span /><span /></div></div>}
                </div>
                <div className="azu-agent-input">
                    <button type="button" className="azu-agent-clip" title="إرفاق ملف — قريبًا" aria-label="إرفاق ملف — قريبًا" disabled>
                        <AgentIcon name="clip" size={17} />
                    </button>
                    <input dir="auto" placeholder="اسأل المساعد..." value={draft} aria-label="رسالتك"
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') send(draft); }} />
                    <button type="button" className="azu-agent-send" aria-label="إرسال" disabled={!draft.trim() || busy} onClick={() => send(draft)}>
                        <AgentIcon name="send" size={16} />
                    </button>
                </div>
            </div>
        </dialog>
    </>;
}
