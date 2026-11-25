import React from 'react';

/* Inline SVG icons only — no emoji. */
export function Icon({ name, size = 24 }: { name: string; size?: number }) {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
    switch (name) {
        case 'books': return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /><path d="M9 8h7" /></svg>;
        case 'microscope': return <svg {...p}><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>;
        case 'briefcase': return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
        case 'megaphone': return <svg {...p}><path d="M3 11l18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
        case 'users': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
        case 'user': return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
        case 'flask': return <svg {...p}><path d="M9 3h6" /><path d="M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3" /><path d="M7.5 15h9" /></svg>;
        case 'landmark': return <svg {...p}><path d="M3 22h18" /><path d="M6 18v-7" /><path d="M10 18v-7" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M12 2L3 7h18l-9-5z" /><path d="M4 11h16" /></svg>;
        case 'atom': return <svg {...p}><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /></svg>;
        case 'sigma': return <svg {...p}><path d="M18 5H7l6 7-6 7h11" /></svg>;
        case 'rock': return <svg {...p}><path d="M3 20l4-12 5 3 3-7 6 16H3z" /><path d="M7 8l2 6" /></svg>;
        case 'leaf': return <svg {...p}><path d="M11 20A7 7 0 0 1 4 13c0-4 3-8 9-10 4-1.3 7-1 7-1s.3 3-1 7c-2 6-6 9-8 11z" /><path d="M4 21c4-6 8-9 12-11" /></svg>;
        case 'arrow': return <svg {...p}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>;
        case 'down': return <svg {...p}><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></svg>;
        case 'back': return <svg {...p}><path d="M19 12H5" /><path d="M11 18l-6-6 6-6" /></svg>;
        case 'camera': return <svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
        case 'cap': return <svg {...p}><path d="M22 9L12 4 2 9l10 5 10-5z" /><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" /><path d="M22 9v5" /></svg>;
        case 'spark': return <svg {...p}><path d="M12 2l2.2 6.2L21 10l-6.8 1.8L12 18l-2.2-6.2L3 10l6.8-1.8L12 2z" /></svg>;
        case 'globe': return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" /></svg>;
        case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
        case 'clock': return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
        case 'calc': return <svg {...p}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8" /><path d="M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2" /></svg>;
        case 'target': return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>;
        case 'code': return <svg {...p}><path d="M8 6l-6 6 6 6" /><path d="M16 6l6 6-6 6" /><path d="M13 4l-2 16" /></svg>;
        case 'extlink': return <svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></svg>;
        case 'download': return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>;
        case 'check': return <svg {...p}><path d="M20 6L9 17l-5-5" /></svg>;
        case 'menu': return <svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
        case 'close': return <svg {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>;
        case 'mail': return <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg>;
        default: return null;
    }
}
