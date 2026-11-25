import React from 'react';
import { Link, NavLink } from '@instinct/files';
import { Icon } from './Icon';
import { searchAll, SEARCH_GROUP_ORDER } from './search';
import { useAuth } from './auth';

/* Native <dialog> modals: they live in the browser top layer, so they stay
   pinned to the screen even inside the full-height File viewer iframe. */

function useModal(onClose: () => void) {
    const ref = React.useRef<HTMLDialogElement>(null);
    React.useEffect(() => {
        const d = ref.current;
        if (d && !d.open) d.showModal();
    }, []);
    React.useEffect(() => {
        const d = ref.current;
        if (!d) return;
        const h = () => onClose();
        d.addEventListener('close', h);
        d.addEventListener('cancel', h);
        return () => { d.removeEventListener('close', h); d.removeEventListener('cancel', h); };
    }, [onClose]);
    return ref;
}

const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [
    { to: '/', label: 'Home', end: true },
    { to: '/academic', label: 'Academic' },
    { to: '/tools', label: 'Tools' },
    { to: '/research', label: 'Research' },
    { to: '/opportunities', label: 'Opportunities' },
    { to: '/news', label: 'News' },
    { to: '/community', label: 'Community' },
    { to: '/about', label: 'About' },
];

export function SignInLink({ className = 'azu-signin', onNavigate }: { className?: string; onNavigate?: () => void }) {
    const session = useAuth();
    return <Link to="/signin" className={className} onClick={onNavigate}>
        <Icon name="user" size={16} /> <span className="azu-signin-label">{session ? (session.user.fullName || 'حسابي') : 'Sign In'}</span>
    </Link>;
}

export function TopNavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return <>{NAV_ITEMS.map(n => <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}>{n.label}</NavLink>)}</>;
}

export function MobileNav({ onClose }: { onClose: () => void }) {
    const ref = useModal(onClose);
    return <dialog ref={ref} className="azu-drawer" aria-label="القائمة">
        <div className="azu-drawer-head">
            <span className="azu-drawer-title">AZU Science</span>
            <button type="button" className="azu-iconbtn" aria-label="إغلاق القائمة" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <nav className="azu-drawer-nav" aria-label="Main">
            <TopNavLinks onNavigate={onClose} />
        </nav>
        <div className="azu-drawer-support">
            <Link to="/faq" onClick={onClose}>FAQ</Link>
            <Link to="/contact" onClick={onClose}>Contact Us</Link>
            <Link to="/report" onClick={onClose}>Report an Issue</Link>
        </div>
        <SignInLink className="azu-signin azu-drawer-signin" onNavigate={onClose} />
    </dialog>;
}

export function SearchOverlay({ initial = '', onClose }: { initial?: string; onClose: () => void }) {
    const ref = useModal(onClose);
    const [q, setQ] = React.useState(initial);
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => { window.setTimeout(() => inputRef.current?.focus(), 60); }, []);
    const results = searchAll(q);
    const byGroup: Record<string, typeof results> = {};
    for (const r of results) (byGroup[r.g] ??= []).push(r);
    return <dialog ref={ref} className="azu-searchdlg" aria-label="بحث شامل" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
        <div className="azu-search-panel">
            <div className="azu-search-bar">
                <Icon name="search" size={18} />
                <input ref={inputRef} className="azu-search-input" dir="auto"
                    placeholder="ابحث عن مادة أو قسم أو برنامج…"
                    value={q} onChange={(e) => setQ(e.target.value)} />
                <button type="button" className="azu-iconbtn" aria-label="إغلاق البحث" onClick={onClose}><Icon name="close" size={17} /></button>
            </div>
            <div className="azu-search-results">
                {q.trim() !== '' && results.length === 0 && <div className="azu-search-empty" dir="rtl">لا توجد نتائج مطابقة.</div>}
                {SEARCH_GROUP_ORDER.filter(g => byGroup[g]?.length).map(g => <div key={g} className="azu-search-group">
                    <div className="azu-search-group-name" dir="rtl">{g}</div>
                    {byGroup[g].slice(0, 8).map((r, i) => <Link key={`${r.to}-${i}`} to={r.to} className="azu-search-item" onClick={onClose} dir="rtl">
                        <span className="azu-search-item-t">{r.t}</span>
                        {r.s && <span className="azu-search-item-s">{r.s}</span>}
                    </Link>)}
                </div>)}
            </div>
        </div>
    </dialog>;
}
