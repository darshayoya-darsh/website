import React from 'react';
import { Link } from '@instinct/files';

/* ---------- Viewport sync (works inside the File viewer iframe) ----------
   The viewer embeds the app full-height and scrolls the parent page, so
   window.scrollY inside the app never changes. The shell posts the real
   viewport rect as a message; we also listen to window scroll for the
   directly-opened case. Both feed `vp` and fire 'azu-vp'. */
export const vp = { top: 0, height: 900 };
if (typeof window !== 'undefined') {
    window.addEventListener('message', (e) => {
        const d = e.data as { source?: string; type?: string; value?: { top?: number; height?: number } };
        if (d && d.source === 'instinct-shell' && d.type === 'modal-viewport' && d.value) {
            vp.top = (d.value.top || 0) + 24;
            vp.height = d.value.height || 900;
            window.dispatchEvent(new CustomEvent('azu-vp'));
        }
    });
    window.addEventListener('scroll', () => {
        vp.top = window.scrollY;
        vp.height = window.innerHeight;
        window.dispatchEvent(new CustomEvent('azu-vp'));
    }, { passive: true });
}

export function onVp(cb: () => void) {
    const h = () => cb();
    window.addEventListener('azu-vp', h);
    cb();
    return () => window.removeEventListener('azu-vp', h);
}

export function inView(el: HTMLElement, lead = 0.92) {
    const r = el.getBoundingClientRect();
    return r.top < vp.top + vp.height * lead && r.bottom > vp.top - 60;
}

/* ---------- Scroll reveal ---------- */

export function Reveal({ className = '', stagger = false, children }: { className?: string; stagger?: boolean; children: React.ReactNode }) {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const show = () => el.classList.add('is-in');
        const off = onVp(() => { if (inView(el)) show(); });
        const fallback = window.setTimeout(show, 8000);
        return () => { off(); window.clearTimeout(fallback); };
    }, []);
    return <div ref={ref} className={`azu-reveal${stagger ? ' azu-stagger' : ''}${className ? ' ' + className : ''}`}>{children}</div>;
}

/* ---------- Breadcrumb ---------- */

export function Crumb({ items }: { items: { label: string; to?: string }[] }) {
    return <nav className="azu-crumb" aria-label="Breadcrumb">
        {items.map((item, i) => <span key={i} className="azu-crumb-item">
            {i > 0 && <span className="azu-crumb-sep">/</span>}
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span className="azu-crumb-here">{item.label}</span>}
        </span>)}
    </nav>;
}
