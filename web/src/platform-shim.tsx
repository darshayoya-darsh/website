// Shim that maps the Instinct Files platform primitives onto react-router-dom,
// so the same src/App.tsx runs both on files.instinct.com and as a standalone app.
import React from 'react';

export { Link, NavLink, Route, Routes } from 'react-router-dom';

export function FileCard({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function CopyButton({ text, label, compact }: { text: string; label?: string; variant?: string; compact?: boolean }) {
    const [copied, setCopied] = React.useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };
    return <button type="button" className={`azu-agent-copy${compact ? ' compact' : ''}`} onClick={copy} title={label || 'نسخ'} aria-label={label || 'نسخ'}>
        {copied
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>}
    </button>;
}
