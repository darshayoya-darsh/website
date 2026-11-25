import React from 'react';
import { FileCard, Link, NavLink, Route, Routes } from '@instinct/files';
import heroPhoto from './photos/hero-building.jpg';
import logoImg from './photos/azu-logo.jpg';
import aboutPhoto from './photos/founder-mustafa.jpg';

/* ---------- Data ---------- */

import { DEPARTMENTS, PROGRAMS, COMPARE_PROGRAMS, GRADES, gradeFromPercent, gradeFromGPA, CALC_NOTE, SOFTWARE, SOFTWARE_DISCIPLINES } from './data';
import { AgentChat, AGENT_OPEN_EVENT } from './AgentChat';
import type { Dept, Program, SpecDetail, Track, Term, ListSection, Software } from './data';

type Faculty = { id: string; ar: string; en: string; city: string };

const FACULTIES: Faculty[] = [
    { id: 'boys-cairo', ar: 'علوم بنين', en: 'Science — Boys', city: 'القاهرة' },
    { id: 'girls-cairo', ar: 'علوم بنات', en: 'Science — Girls', city: 'القاهرة' },
    { id: 'boys-assiut', ar: 'علوم بنين', en: 'Science — Boys', city: 'أسيوط' },
    { id: 'girls-assiut', ar: 'علوم بنات', en: 'Science — Girls', city: 'أسيوط' },
];

const ASTRO_TRACKS = ['فلك وأرصاد', 'فلك خاص', 'أرصاد خاص'];
const deptsFor = (facultyId: string) => DEPARTMENTS.filter(d => !d.onlyFaculties || d.onlyFaculties.includes(facultyId));

const YEAR_NAMES: Record<number, string> = { 1: 'السنة الأولى', 2: 'السنة الثانية', 3: 'السنة الثالثة', 4: 'السنة الرابعة' };

const NEWS = [
    { chip: 'News', date: 'Sep 5, 2026', title: 'Start of the New Academic Year', text: 'Important information for all students regarding registration and schedules.' },
    { chip: 'Opportunity', date: 'Aug 28, 2026', title: 'NASA Space Apps Challenge', text: "Join the world's largest hackathon and be part of global innovation." },
    { chip: 'Event', date: 'Aug 20, 2026', title: 'Scientific Research Workshop', text: 'A workshop on how to start your research journey.' },
];

const STATS = [
    { icon: 'users', value: '5,000+', label: 'Students' },
    { icon: 'user', value: '150+', label: 'Academic Staff' },
    { icon: 'flask', value: '20+', label: 'Research Projects' },
    { icon: 'landmark', value: '10+', label: 'Departments' },
];

/* ---------- Icons (inline SVG, no emoji) ---------- */

function Icon({ name, size = 24 }: { name: string; size?: number }) {
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
        default: return null;
    }
}

/* ---------- Viewport sync (works inside the File viewer iframe) ----------
   The viewer embeds the app full-height and scrolls the parent page, so
   window.scrollY inside the app never changes. The shell posts the real
   viewport rect as a message; we also listen to window scroll for the
   directly-opened case. Both feed `vp` and fire 'azu-vp'. */
const vp = { top: 0, height: 900 };
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
function onVp(cb: () => void) {
    const h = () => cb();
    window.addEventListener('azu-vp', h);
    cb();
    return () => window.removeEventListener('azu-vp', h);
}
function inView(el: HTMLElement, lead = 0.92) {
    const r = el.getBoundingClientRect();
    return r.top < vp.top + vp.height * lead && r.bottom > vp.top - 60;
}

/* ---------- Scroll reveal ---------- */

function Reveal({ className = '', stagger = false, children }: { className?: string; stagger?: boolean; children: React.ReactNode }) {
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

/* ---------- Count-up stat ---------- */

function CountUp({ value }: { value: string }) {
    const ref = React.useRef<HTMLSpanElement>(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const m = value.match(/^([\d,]+)(.*)$/);
        if (!m) { el.textContent = value; return; }
        const target = parseInt(m[1].replace(/,/g, ''), 10);
        const suffix = m[2] || '';
        const fmt = (n: number) => n.toLocaleString('en-US') + suffix;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(target); return; }
        let started = false;
        const start = () => {
            if (started) return;
            started = true;
            const t0 = performance.now();
            const dur = 1600;
            const tick = (t: number) => {
                const pr = Math.min((t - t0) / dur, 1);
                const eased = 1 - Math.pow(1 - pr, 3);
                el.textContent = fmt(Math.round(target * eased));
                if (pr < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        el.textContent = fmt(0);
        const off = onVp(() => { if (inView(el, 0.85)) start(); });
        const fallback = window.setTimeout(() => { if (!started) { started = true; el.textContent = fmt(target); } }, 8000);
        return () => { off(); window.clearTimeout(fallback); };
    }, [value]);
    return <span ref={ref}>{value}</span>;
}

/* ---------- Building blocks ---------- */

function TopBar() {
    const [scrolled, setScrolled] = React.useState(false);
    React.useEffect(() => {
        return onVp(() => setScrolled(vp.top > 40));
    }, []);
    return <header className={`azu-topbar${scrolled ? ' is-scrolled' : ''}`}>
        <Link to="/" className="azu-brand">
            <img src={logoImg} alt="AZU Science logo" className="azu-brand-logo" />
            <span className="azu-brand-text">
                <span className="azu-brand-name">AZU Science</span>
                <span className="azu-brand-sub">The Student Platform for the Faculty of Science</span>
            </span>
        </Link>
        <nav className="azu-nav" aria-label="Main">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/academic">Academic</NavLink>
            <NavLink to="/tools">Tools</NavLink>
            <NavLink to="/research">Research</NavLink>
            <NavLink to="/opportunities">Opportunities</NavLink>
            <NavLink to="/news">News</NavLink>
            <NavLink to="/community">Community</NavLink>
            <NavLink to="/about">About</NavLink>
        </nav>
        <button type="button" className="azu-agent-entry" aria-label="مساعد AZU Science الذكي" title="مساعد AZU Science الذكي"
            onClick={() => window.dispatchEvent(new CustomEvent(AGENT_OPEN_EVENT))}>
            <Icon name="spark" size={16} />
        </button>
        <Link to="/signin" className="azu-signin"><Icon name="user" size={16} /> Sign In</Link>
    </header>;
}

function Footer() {
    return <footer className="azu-footer">
        <div className="azu-footer-grid">
            <div className="azu-footer-brand">
                <img src={logoImg} alt="AZU Science logo" className="azu-footer-logo" />
                <div>
                    <div className="azu-footer-name">AZU Science</div>
                    <div className="azu-footer-tag">The Student Platform for the Faculty of Science<br />Al-Azhar University</div>
                </div>
            </div>
            <div className="azu-footer-col">
                <div className="azu-footer-head">Quick Links</div>
                <Link to="/">Home</Link>
                <Link to="/academic">Academic</Link>
                <Link to="/research">Research</Link>
                <Link to="/opportunities">Opportunities</Link>
                <Link to="/news">News</Link>
                <Link to="/community">Community</Link>
            </div>
            <div className="azu-footer-col">
                <div className="azu-footer-head">Support</div>
                <span className="azu-footer-note">FAQ — قريبًا</span>
                <span className="azu-footer-note">Contact Us — قريبًا</span>
                <span className="azu-footer-note">Report an Issue — قريبًا</span>
            </div>
            <div className="azu-footer-col">
                <div className="azu-footer-head">Follow Us</div>
                <span className="azu-footer-note">Social Links — قريبًا</span>
                <span className="azu-footer-line">Together for a brighter scientific future.</span>
            </div>
        </div>
        <div className="azu-footer-bar">
            <span>© 2026 AZU Science Team. All rights reserved.</span>
            <span>Science Creates Possibilities — AZU Science</span>
        </div>
    </footer>;
}

function Crumb({ items }: { items: { label: string; to?: string }[] }) {
    return <nav className="azu-crumb" aria-label="Breadcrumb">
        {items.map((item, i) => <span key={i} className="azu-crumb-item">
            {i > 0 && <span className="azu-crumb-sep">/</span>}
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span className="azu-crumb-here">{item.label}</span>}
        </span>)}
    </nav>;
}

function PhotoSlot({ label, ratio }: { label: string; ratio?: string }) {
    return <div className="azu-photoslot" style={ratio ? { aspectRatio: ratio } : undefined}>
        <Icon name="camera" size={22} />
        <span>{label}</span>
    </div>;
}

/* ---------- Home ---------- */

const CATEGORIES = [
    { to: '/academic', icon: 'books', title: 'Academic', text: 'Lectures, sections, study materials, schedules and more.' },
    { to: '/research', icon: 'microscope', title: 'Research', text: 'Discover research opportunities, projects and scientific resources.' },
    { to: '/opportunities', icon: 'briefcase', title: 'Opportunities', text: 'Internships, scholarships, competitions and scientific events.' },
    { to: '/news', icon: 'megaphone', title: 'News', text: 'Latest announcements, faculty news and upcoming events.' },
    { to: '/tools', icon: 'calc', title: 'Tools', text: 'Academic calculator, scientific software hub and smart student services.' },
];

function Home() {
    const bgRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const el = bgRef.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let raf = 0;
        return onVp(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const y = vp.top;
                if (y > 820) return;
                if (y > 8) {
                    el.style.animation = 'none';
                    el.style.transform = `scale(1.07) translate3d(0, ${Math.min(y * 0.22, 170)}px, 0)`;
                }
            });
        });
    }, []);
    return <>
        <section className="azu-hero">
            <div className="azu-hero-bg" ref={bgRef} style={{ backgroundImage: `url(${heroPhoto})` }} aria-hidden="true" />
            <div className="azu-hero-inner">
                <div className="azu-eyebrow">AL-AZHAR UNIVERSITY</div>
                <h1 className="azu-hero-title">AZU <span>Science</span></h1>
                <div className="azu-hero-sub">The Student Platform for the Faculty of Science</div>
                <p className="azu-hero-text">Everything you need for your academic journey, research, opportunities and student life — in one place.</p>
                <div className="azu-hero-actions">
                    <Link to="/academic" className="azu-btn azu-btn-primary">Explore Platform <Icon name="arrow" size={16} /></Link>
                    <Link to="/signin" className="azu-btn azu-btn-ghost">Student Login</Link>
                </div>
                <div className="azu-scroll"><Icon name="down" size={16} /> Scroll Down</div>
            </div>
            <div className="azu-hero-quote">“Science today<br />A brighter tomorrow.”</div>
        </section>

        <section className="azu-section">
            <div className="azu-section-head">
                <div>
                    <div className="azu-kicker">EXPLORE</div>
                    <h2 className="azu-title">What are you looking for?</h2>
                    <p className="azu-lead">Access everything you need with just one click.</p>
                </div>
                <div className="azu-words">STUDY · RESEARCH · GROW · BELONG</div>
            </div>
            <Reveal stagger className="azu-cards">
                {CATEGORIES.map(c => <Link key={c.to} to={c.to} className="azu-card">
                    <div className="azu-card-icon"><Icon name={c.icon} size={26} /></div>
                    <div className="azu-card-title">{c.title}</div>
                    <p className="azu-card-text">{c.text}</p>
                    <span className="azu-card-water" aria-hidden="true"><Icon name={c.icon} size={110} /></span>
                    <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
                </Link>)}
            </Reveal>
        </section>

        <Reveal stagger className="azu-stats">
            {STATS.map(s => <div key={s.label} className="azu-stat">
                <Icon name={s.icon} size={26} />
                <div className="azu-stat-value"><CountUp value={s.value} /></div>
                <div className="azu-stat-label">{s.label}</div>
            </div>)}
        </Reveal>

        <section className="azu-section">
            <div className="azu-section-head">
                <div>
                    <div className="azu-kicker">LATEST UPDATES</div>
                    <h2 className="azu-title">News &amp; Announcements</h2>
                    <p className="azu-lead">Stay informed with the latest news from the faculty and our team.</p>
                </div>
                <Link to="/news" className="azu-btn azu-btn-outline">View All News <Icon name="arrow" size={15} /></Link>
            </div>
            <Reveal stagger className="azu-news-grid">
                {NEWS.map(n => <article key={n.title} className="azu-news-card">
                    <PhotoSlot label="صورة الخبر — قريبًا" ratio="16 / 9" />
                    <div className="azu-news-body">
                        <div className="azu-news-meta"><span className="azu-chip">{n.chip}</span><span className="azu-news-date">{n.date}</span></div>
                        <div className="azu-news-title">{n.title}</div>
                        <p className="azu-news-text">{n.text}</p>
                        <span className="azu-news-more">Read More <Icon name="arrow" size={14} /></span>
                    </div>
                </article>)}
            </Reveal>
        </section>

        <Reveal className="azu-about">
            <div className="azu-about-left">
                <div className="azu-kicker azu-kicker-light">ABOUT US</div>
                <h2 className="azu-about-title">Built by Students.<br />For Students.</h2>
            </div>
            <div className="azu-about-right">
                <p>AZU Science is a student-driven platform created to make academic life at the Faculty of Science easier, more connected, and more accessible.</p>
                <Link to="/about" className="azu-btn azu-btn-ghost">Meet the Team <Icon name="arrow" size={15} /></Link>
            </div>
            <div className="azu-about-quote">“Knowledge —<br />builds nations.”</div>
        </Reveal>
    </>;
}

/* ---------- Academic flow ---------- */

function Academic() {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic' }]} />
        <div className="azu-kicker">ACADEMIC</div>
        <h2 className="azu-title">اختر الكلية</h2>
        <p className="azu-lead">المنصة بتغطي كليات العلوم الأربعة بجامعة الأزهر — اختار كليتك وابدأ.</p>
        <Reveal stagger className="azu-faculty-grid">
            {FACULTIES.map(f => <Link key={f.id} to={`/academic/${f.id}`} className="azu-faculty-card">
                <span className="azu-faculty-icon"><Icon name="cap" size={26} /></span>
                <span className="azu-faculty-ar" dir="rtl">كلية العلوم — {f.ar.split(' ')[1]}</span>
                <span className="azu-faculty-en">{f.en}</span>
                <span className="azu-faculty-city" dir="rtl">{f.city}</span>
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>)}
        </Reveal>
    </section>;
}

function FacultyPage({ faculty }: { faculty: Faculty }) {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic', to: '/academic' }, { label: `${faculty.ar} — ${faculty.city}` }]} />
        <div className="azu-kicker">{faculty.en.toUpperCase()} — {faculty.city === 'القاهرة' ? 'CAIRO' : 'ASSIUT'}</div>
        <h2 className="azu-title" dir="rtl">علوم {faculty.ar.split(' ')[1]} — {faculty.city}</h2>
        <p className="azu-lead">اختار نوع الدراسة اللي بتدور عليها.</p>
        <Reveal stagger className="azu-choice-grid">
            <Link to={`/academic/${faculty.id}/basic`} className="azu-choice">
                <span className="azu-choice-icon"><Icon name="books" size={28} /></span>
                <span className="azu-choice-title" dir="rtl">أقسام أساسية</span>
                <span className="azu-choice-text">الأقسام العلمية الرئيسية بالكلية: {deptsFor(faculty.id).map(d => d.ar).join('، ')}.</span>
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>
            <Link to={`/academic/${faculty.id}/special`} className="azu-choice">
                <span className="azu-choice-icon"><Icon name="spark" size={28} /></span>
                <span className="azu-choice-title" dir="rtl">برامج متميزة</span>
                <span className="azu-choice-text">8 برامج بنظام الساعات المعتمدة والدراسة بالإنجليزية — من الكيمياء الحيوية للحوسبة الذكية.</span>
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>
        </Reveal>
    </section>;
}

function BasicDepartments({ faculty }: { faculty: Faculty }) {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic', to: '/academic' }, { label: `${faculty.ar} — ${faculty.city}`, to: `/academic/${faculty.id}` }, { label: 'أقسام أساسية' }]} />
        <div className="azu-kicker">BASIC DEPARTMENTS</div>
        <h2 className="azu-title" dir="rtl">الأقسام الأساسية</h2>
        <p className="azu-lead">اختار قسمك عشان توصل للفرق والتخصصات.</p>
        <Reveal stagger className="azu-dept-list">
            {deptsFor(faculty.id).map(d => <Link key={d.id} to={`/academic/${faculty.id}/basic/${d.id}`} className="azu-dept">
                <span className="azu-dept-icon"><Icon name={d.icon} size={24} /></span>
                <span className="azu-dept-names">
                    <span className="azu-dept-ar" dir="rtl">{d.ar}</span>
                    <span className="azu-dept-en">{d.en}</span>
                </span>
                {d.provisional && <span className="azu-tag">هيكل مبدئي</span>}
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>)}
        </Reveal>
    </section>;
}

function SpecialPrograms({ faculty }: { faculty: Faculty }) {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic', to: '/academic' }, { label: `${faculty.ar} — ${faculty.city}`, to: `/academic/${faculty.id}` }, { label: 'برامج متميزة' }]} />
        <div className="azu-kicker">SPECIAL PROGRAMS</div>
        <h2 className="azu-title" dir="rtl">البرامج المتميزة</h2>
        <p className="azu-lead">برامج بنظام الساعات المعتمدة والدراسة بالإنجليزية — اختار البرنامج عشان تشوف التفاصيل الكاملة.</p>
        <Reveal stagger className="azu-prog-grid">
            {PROGRAMS.map(p => <Link key={p.id} to={`/academic/${faculty.id}/special/${p.id}`} className="azu-prog">
                <span className="azu-prog-icon"><Icon name="spark" size={22} /></span>
                <span className="azu-prog-names">
                    <span className="azu-prog-ar" dir="rtl">{p.ar}</span>
                    <span className="azu-prog-en">{p.en}</span>
                </span>
                <span className="azu-prog-facts">{[p.hours, p.lang ? `الدراسة: ${p.lang}` : ''].filter(Boolean).join(' · ')}</span>
                {p.pending && <span className="azu-tag">التفاصيل بتتجهز</span>}
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>)}
        </Reveal>

        <div className="azu-compare">
            <div className="azu-kicker">COMPARE</div>
            <h3 className="azu-subtitle" dir="rtl">محتار تختار إيه؟ مقارنة تخصصات البرمجة والسوفتوير</h3>
            <Reveal stagger className="azu-compare-grid">
                {COMPARE_PROGRAMS.map(c => <div key={c.name} className="azu-compare-card">
                    <div className="azu-compare-name" dir="rtl">{c.name}</div>
                    <div className="azu-compare-tag" dir="rtl">{c.tag}</div>
                    <p className="azu-compare-study" dir="rtl">{c.study}</p>
                    <div className="azu-minihead" dir="rtl">مجالات العمل</div>
                    <ul className="azu-ticks" dir="rtl">{c.careers.map(x => <li key={x}>{x}</li>)}</ul>
                    <div className="azu-compare-verdict" dir="rtl">{c.verdict}</div>
                </div>)}
            </Reveal>
        </div>
    </section>;
}

function ProgramPage({ faculty, program }: { faculty: Faculty; program: Program }) {
    const stats: { label: string; value: string; icon: string }[] = [
        program.degree && { label: 'الدرجة العلمية', value: program.degree, icon: 'cap' },
        program.hours && { label: 'عدد الساعات المعتمدة', value: program.hours, icon: 'books' },
        program.lang && { label: 'لغة الدراسة', value: program.lang, icon: 'globe' },
        program.duration && { label: 'مدة الدراسة', value: program.duration, icon: 'clock' },
    ].filter(Boolean) as { label: string; value: string; icon: string }[];
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic', to: '/academic' }, { label: `${faculty.ar} — ${faculty.city}`, to: `/academic/${faculty.id}` }, { label: 'برامج متميزة', to: `/academic/${faculty.id}/special` }, { label: program.ar }]} />
        <div className="azu-kicker">SPECIAL PROGRAM</div>
        <h2 className="azu-title" dir="rtl">برنامج {program.ar}</h2>
        <p className="azu-prog-hero-en">{program.en}</p>
        {stats.length > 0 && <Reveal stagger className="azu-progstats">
            {stats.map(s => <div key={s.label} className="azu-progstat">
                <Icon name={s.icon} size={22} />
                <div className="azu-progstat-label" dir="rtl">{s.label}</div>
                <div className="azu-progstat-value" dir="rtl">{s.value}</div>
            </div>)}
        </Reveal>}
        {program.about && <p className="azu-intro" dir="rtl">{program.about}</p>}
        {program.highlight && <div className="azu-callout" dir="rtl">
            <div className="azu-callout-title">{program.highlight.title}</div>
            <p>{program.highlight.text}</p>
        </div>}
        {program.why && <div className="azu-block">
            <div className="azu-minihead" dir="rtl">لماذا تختار هذا البرنامج؟</div>
            <ul className="azu-ticks" dir="rtl">{program.why.map(x => <li key={x}>{x}</li>)}</ul>
        </div>}
        {program.gains && <div className="azu-block">
            <div className="azu-minihead" dir="rtl">ماذا تكتسب؟</div>
            <ul className="azu-ticks" dir="rtl">{program.gains.map(x => <li key={x}>{x}</li>)}</ul>
        </div>}
        {program.careers && <div className="azu-block">
            <div className="azu-minihead" dir="rtl">مجالات العمل بعد التخرج</div>
            <Reveal stagger className="azu-chip-grid">
                {program.careers.map(c => <span key={c} className="azu-chip2" dir="rtl">{c}</span>)}
            </Reveal>
        </div>}
        {program.pending && <div className="azu-empty"><Icon name="spark" size={26} /><p>التفاصيل الكاملة للبرنامج — قريبًا.</p></div>}
        <div className="azu-backrow"><Link to={`/academic/${faculty.id}/special`} className="azu-btn azu-btn-outline"><Icon name="back" size={15} /> كل البرامج المتميزة</Link></div>
    </section>;
}

function DepartmentPage({ faculty, dept }: { faculty: Faculty; dept: Dept }) {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic', to: '/academic' }, { label: `${faculty.ar} — ${faculty.city}`, to: `/academic/${faculty.id}` }, { label: 'أقسام أساسية', to: `/academic/${faculty.id}/basic` }, { label: dept.ar }]} />
        <div className="azu-kicker">{dept.en.toUpperCase()}</div>
        <h2 className="azu-title" dir="rtl">قسم {dept.ar}</h2>
        {dept.intro && <p className="azu-intro" dir="rtl">{dept.intro}</p>}
        <p className="azu-lead azu-lead-space">اختار السنة الدراسية.</p>
        <Reveal stagger className="azu-year-grid">
            {[1, 2, 3, 4].map(y => <Link key={y} to={`/academic/${faculty.id}/basic/${dept.id}/year/${y}`} className="azu-year">
                <span className="azu-year-num">{y}</span>
                <span className="azu-year-name" dir="rtl">{YEAR_NAMES[y]}</span>
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>)}
        </Reveal>
        {dept.compare && <div className="azu-block">
            <div className="azu-minihead" dir="rtl">الفرق بين الشعب</div>
            <div className="azu-vs" dir="rtl">
                <div className="azu-vs-col">
                    <div className="azu-vs-title">{dept.compare.aTitle}</div>
                    <ul className="azu-ticks">{dept.compare.aPoints.map(x => <li key={x}>{x}</li>)}</ul>
                </div>
                <div className="azu-vs-badge">VS</div>
                <div className="azu-vs-col">
                    <div className="azu-vs-title">{dept.compare.bTitle}</div>
                    <ul className="azu-ticks">{dept.compare.bPoints.map(x => <li key={x}>{x}</li>)}</ul>
                </div>
            </div>
        </div>}
        {dept.diplomas && <div className="azu-block">
            <div className="azu-minihead" dir="rtl">الدبلومات المتاحة في الجيولوجيا</div>
            <Reveal stagger className="azu-chip-grid">
                {dept.diplomas.map(d => <span key={d} className="azu-chip2" dir="rtl">{d}</span>)}
            </Reveal>
        </div>}
        {dept.lists && dept.lists.map(l => <div key={l.title} className="azu-block">
            <div className="azu-minihead" dir="rtl">{l.title}</div>
            <ul className="azu-ticks" dir="rtl">{l.items.map(x => <li key={x}>{x}</li>)}</ul>
        </div>)}
        {dept.careers && <div className="azu-block">
            <div className="azu-minihead" dir="rtl">مجالات العمل</div>
            <Reveal stagger className="azu-career-grid">
                {dept.careers.map(c => <div key={c.title} className="azu-career">
                    <div className="azu-career-title" dir="rtl">{c.title}</div>
                    <ul className="azu-ticks" dir="rtl">{c.items.map(x => <li key={x}>{x}</li>)}</ul>
                </div>)}
            </Reveal>
        </div>}
    </section>;
}

function YearPage({ faculty, dept, year }: { faculty: Faculty; dept: Dept; year: number }) {
    const specs = (dept.years[year] ?? []).filter(s => faculty.id === 'boys-cairo' || !ASTRO_TRACKS.includes(s));
    const tracks = dept.tracks?.[year] ?? [];
    const groups = dept.yearGroups?.[year] ?? [];
    const showTerms = year === 1 && dept.terms;
    const hasDetails = (s: string) => dept.specDetails?.[s];
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic', to: '/academic' }, { label: `${faculty.ar} — ${faculty.city}`, to: `/academic/${faculty.id}` }, { label: 'أقسام أساسية', to: `/academic/${faculty.id}/basic` }, { label: dept.ar, to: `/academic/${faculty.id}/basic/${dept.id}` }, { label: YEAR_NAMES[year] }]} />
        <div className="azu-kicker">{dept.en.toUpperCase()} — YEAR {year}</div>
        <h2 className="azu-title" dir="rtl">{dept.ar} — {YEAR_NAMES[year]}</h2>
        {dept.provisional
            ? <div className="azu-empty"><Icon name={dept.icon} size={30} /><p>ده هيكل مبدئي للتجربة. تقسيمات قسم {dept.ar} — {YEAR_NAMES[year]} هتتأكد وتتضاف هنا.</p></div>
            : <>
                {showTerms && <div className="azu-terms">
                    {dept.terms!.map((t: Term) => <div key={t.title} className="azu-term">
                        <div className="azu-term-title" dir="rtl">{t.title}</div>
                        <ol className="azu-courses" dir="rtl">
                            {t.courses.map((c, i) => <li key={c.name}>
                                <span className="azu-course-name">{c.name}</span>
                                {c.note && <span className="azu-course-note">{c.note}</span>}
                            </li>)}
                        </ol>
                    </div>)}
                </div>}
                {tracks.length > 0 && <Reveal stagger className="azu-track-grid">
                    {tracks.map((t: Track) => <div key={t.name} className="azu-track">
                        <div className="azu-track-name" dir="rtl">{t.name}</div>
                        {t.req && <div className="azu-track-req" dir="rtl">{t.req}</div>}
                        {t.desc && <p className="azu-track-desc" dir="rtl">{t.desc}</p>}
                        {t.careers && <>
                            <div className="azu-minihead" dir="rtl">تقدر تشتغل في</div>
                            <ul className="azu-ticks" dir="rtl">{t.careers.map(x => <li key={x}>{x}</li>)}</ul>
                        </>}
                    </div>)}
                </Reveal>}
                {groups.map((g: ListSection) => <div key={g.title} className="azu-block">
                    <div className="azu-minihead" dir="rtl">{g.title}</div>
                    <Reveal stagger className="azu-spec-grid">
                        {g.items.map(s => <div key={s} className="azu-spec" dir="rtl"><Icon name="spark" size={16} /> {s}</div>)}
                    </Reveal>
                </div>)}
                {specs.length > 0 && tracks.length === 0 && <>
                    {!groups.length && <p className="azu-lead azu-lead-space">التخصصات المتاحة في {YEAR_NAMES[year]}:</p>}
                    {specs.some(hasDetails)
                        ? <Reveal stagger className="azu-speccard-grid">
                            {specs.map(s => {
                                const d = dept.specDetails?.[s];
                                return d
                                    ? <div key={s} className="azu-speccard">
                                        <div className="azu-speccard-name" dir="rtl"><Icon name="spark" size={17} /> {s}</div>
                                        {d.desc && <p className="azu-speccard-desc" dir="rtl">{d.desc}</p>}
                                        {d.req && <div className="azu-track-req" dir="rtl">{d.req}</div>}
                                        {d.study && <>
                                            <div className="azu-minihead" dir="rtl">الدراسة</div>
                                            <ul className="azu-ticks" dir="rtl">{d.study.map(x => <li key={x}>{x}</li>)}</ul>
                                        </>}
                                        {d.careers && <>
                                            <div className="azu-minihead" dir="rtl">مجالات العمل</div>
                                            <ul className="azu-ticks" dir="rtl">{d.careers.map(x => <li key={x}>{x}</li>)}</ul>
                                        </>}
                                    </div>
                                    : <div key={s} className="azu-spec" dir="rtl"><Icon name="spark" size={16} /> {s}</div>;
                            })}
                        </Reveal>
                        : <Reveal stagger className="azu-spec-grid">
                            {specs.map(s => <div key={s} className="azu-spec" dir="rtl"><Icon name="spark" size={16} /> {s}</div>)}
                        </Reveal>}
                    <p className="azu-note">محتوى كل تخصص — قريبًا.</p>
                </>}
                {specs.length === 0 && !showTerms && tracks.length === 0 && groups.length === 0 &&
                    <div className="azu-empty"><Icon name="books" size={30} /><p>مواد {YEAR_NAMES[year]} — قريبًا.</p></div>}
            </>}
    </section>;
}

/* ---------- Simple pages ---------- */

/* ---------- Student Tools ---------- */

function ToolsHub() {
    const ready = [
        { to: '/tools/calculator', icon: 'calc', title: 'الحاسبة الأكاديمية', en: 'Academic Calculator', text: 'احسب معدلك الفصلي والتراكمي وتقديرك المتوقع، واعرف الدرجات المطلوبة للوصول للتقدير اللي بتستهدفه.' },
        { to: '/tools/software', icon: 'code', title: 'مكتبة البرامج العلمية', en: 'Scientific Software Hub', text: 'دليل البرامج المستخدمة في كل تخصص: تعريفها واستخداماتها ومتطلبات تشغيلها وروابطها الرسمية ومصادر تعلمها.' },
    ];
    const soon = ['التقويم الجامعي الموحد', 'المنظم الدراسي', 'بنك المسائل العلمية'];
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Tools' }]} />
        <div className="azu-kicker">STUDENT TOOLS</div>
        <h2 className="azu-title">أدوات الطالب</h2>
        <p className="azu-lead">خدمات ذكية تساعدك في رحلتك الدراسية.</p>
        <Reveal stagger className="azu-prog-grid">
            {ready.map(t => <Link key={t.to} to={t.to} className="azu-prog">
                <span className="azu-prog-icon"><Icon name={t.icon} size={22} /></span>
                <span className="azu-prog-names">
                    <span className="azu-prog-ar" dir="rtl">{t.title}</span>
                    <span className="azu-prog-en">{t.en}</span>
                </span>
                <span className="azu-prog-facts">{t.text}</span>
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>)}
        </Reveal>
        <div className="azu-notice">
            <span className="azu-tag">قريبًا</span>
            <p>{soon.join(' · ')}</p>
        </div>
    </section>;
}

/* --- Academic Calculator --- */

type CourseRow = { name: string; hours: string; letter: string };

function gradeOf(letter: string) { return GRADES.find(g => g.letter === letter) || GRADES[GRADES.length - 1]; }

function Calculator() {
    const [tab, setTab] = React.useState<'gpa' | 'target'>('gpa');
    const [rows, setRows] = React.useState<CourseRow[]>([
        { name: '', hours: '3', letter: 'B' },
        { name: '', hours: '3', letter: 'B' },
        { name: '', hours: '2', letter: 'C+' },
    ]);
    const [priorHours, setPriorHours] = React.useState('');
    const [priorGpa, setPriorGpa] = React.useState('');
    const [tCgpa, setTCgpa] = React.useState('');
    const [tDone, setTDone] = React.useState('');
    const [tPlanned, setTPlanned] = React.useState('18');
    const [tTarget, setTTarget] = React.useState('3.7');

    const setRow = (i: number, patch: Partial<CourseRow>) => setRows(rs => rs.map((r, j) => j === i ? { ...r, ...patch } : r));

    const valid = rows.filter(r => parseFloat(r.hours) > 0);
    const semHours = valid.reduce((s, r) => s + parseFloat(r.hours), 0);
    const semPoints = valid.reduce((s, r) => s + parseFloat(r.hours) * gradeOf(r.letter).pts, 0);
    const gpa = semHours > 0 ? semPoints / semHours : 0;
    const ph = parseFloat(priorHours) || 0;
    const pg = parseFloat(priorGpa) || 0;
    const hasPrior = ph > 0 && pg > 0;
    const cgpa = hasPrior && semHours > 0 ? (semPoints + pg * ph) / (semHours + ph) : hasPrior ? pg : gpa;

    const d = parseFloat(tDone) || 0;
    const g = parseFloat(tCgpa) || 0;
    const p = parseFloat(tPlanned) || 0;
    const t = parseFloat(tTarget) || 0;
    const needed = d >= 0 && g >= 0 && p > 0 ? (t * (d + p) - g * d) / p : NaN;

    const tabBtn = (id: 'gpa' | 'target', label: string, icon: string) =>
        <button type="button" className={`azu-tab${tab === id ? ' is-on' : ''}`} onClick={() => setTab(id)}>
            <Icon name={icon} size={16} /> {label}
        </button>;

    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Tools', to: '/tools' }, { label: 'الحاسبة الأكاديمية' }]} />
        <div className="azu-kicker">ACADEMIC CALCULATOR</div>
        <h2 className="azu-title">الحاسبة الأكاديمية</h2>
        <p className="azu-lead">حاسبة GPA والتقديرات لبرامج الساعات المعتمدة — بدون تسجيل دخول وبياناتك مبتتسجلش.</p>

        <div className="azu-tabs">{tabBtn('gpa', 'حساب المعدل', 'calc')}{tabBtn('target', 'حاسبة الهدف', 'target')}</div>

        {tab === 'gpa' && <>
            <div className="azu-calc-card">
                <h3>مقررات الفصل</h3>
                <div className="azu-calc-rows">
                    {rows.map((r, i) => <div key={i} className="azu-calc-row">
                        <input className="azu-input" placeholder={`مقرر ${i + 1}`} value={r.name} onChange={e => setRow(i, { name: e.target.value })} />
                        <input className="azu-input azu-input-num" type="number" min="1" max="12" step="1" value={r.hours} title="الساعات" onChange={e => setRow(i, { hours: e.target.value })} />
                        <select className="azu-input" value={r.letter} title="التقدير" onChange={e => setRow(i, { letter: e.target.value })}>
                            {GRADES.map(gr => <option key={gr.letter} value={gr.letter}>{gr.letter} — {gr.ar}</option>)}
                        </select>
                        <button type="button" className="azu-calc-del" aria-label="حذف" onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}>×</button>
                    </div>)}
                </div>
                <button type="button" className="azu-btn-ghost" onClick={() => setRows(rs => [...rs, { name: '', hours: '3', letter: 'B' }])}>+ أضف مقرر</button>
            </div>

            <div className="azu-calc-card">
                <h3>لو عندك معدل سابق <small>(اختياري)</small></h3>
                <div className="azu-calc-grid2">
                    <label className="azu-field">الساعات المكتملة<input className="azu-input" type="number" min="0" value={priorHours} onChange={e => setPriorHours(e.target.value)} placeholder="مثال: 60" /></label>
                    <label className="azu-field">المعدل التراكمي الحالي<input className="azu-input" type="number" min="0" max="4" step="0.01" value={priorGpa} onChange={e => setPriorGpa(e.target.value)} placeholder="مثال: 2.85" /></label>
                </div>
            </div>

            <div className="azu-calc-result">
                <div className="azu-calc-stat"><span>معدل الفصل (GPA)</span><strong>{semHours ? gpa.toFixed(2) : '—'}</strong><small>{semHours ? gradeFromGPA(gpa) : ''}</small></div>
                <div className="azu-calc-stat"><span>ساعات الفصل</span><strong>{semHours || '—'}</strong><small>ساعة معتمدة</small></div>
                <div className="azu-calc-stat"><span>المعدل التراكمي</span><strong>{(hasPrior || semHours) ? cgpa.toFixed(2) : '—'}</strong><small>{(hasPrior || semHours) ? gradeFromGPA(cgpa) : ''}</small></div>
            </div>
        </>}

        {tab === 'target' && <>
            <div className="azu-calc-card">
                <h3>عايز توصل لتقدير معين؟</h3>
                <div className="azu-calc-grid2">
                    <label className="azu-field">المعدل التراكمي الحالي<input className="azu-input" type="number" min="0" max="4" step="0.01" value={tCgpa} onChange={e => setTCgpa(e.target.value)} placeholder="مثال: 2.50" /></label>
                    <label className="azu-field">الساعات المكتملة<input className="azu-input" type="number" min="0" value={tDone} onChange={e => setTDone(e.target.value)} placeholder="مثال: 60" /></label>
                    <label className="azu-field">الساعات القادمة<input className="azu-input" type="number" min="1" value={tPlanned} onChange={e => setTPlanned(e.target.value)} placeholder="مثال: 18" /></label>
                    <label className="azu-field">التقدير المستهدف
                        <select className="azu-input" value={tTarget} onChange={e => setTTarget(e.target.value)}>
                            <option value="4">ممتاز+ (4.00)</option>
                            <option value="3.7">ممتاز (3.70)</option>
                            <option value="2.7">جيد جدًا (2.70)</option>
                            <option value="2">جيد (2.00)</option>
                        </select>
                    </label>
                </div>
            </div>
            {p > 0 && g >= 0 && t > 0 && (tCgpa !== '' || tDone !== '') && <div className="azu-calc-result">
                <div className="azu-calc-stat"><span>المعدل المطلوب في الساعات القادمة</span><strong>{isFinite(needed) ? needed.toFixed(2) : '—'}</strong><small>{isFinite(needed) && needed <= 4 && needed >= 0 ? gradeFromGPA(needed) : ''}</small></div>
                <div className="azu-calc-msg">
                    {!isFinite(needed) ? 'أدخل بياناتك عشان نحسب.' :
                        needed > 4 ? 'الهدف غير ممكن رياضيًا في الساعات دي — حتى لو جبت A في كل المواد. جرّب تزود عدد الساعات أو تخفض الهدف.' :
                        needed <= 0 ? 'مبروك — وصلت للهدف بالفعل! حافظ على معدلك.' :
                        needed > 3.3 ? 'هدف طموح — محتاج تقدير قريب من A في معظم المواد القادمة. خطط لمذاكرتك كويس.' :
                        'هدف واقعي وقابل للتحقيق — ركّز على المواد الأكبر ساعات لأنها الأكثر تأثيرًا في المعدل.'}
                </div>
            </div>}
        </>}

        <Reveal className="azu-speccard">
            <h3>سلم التقديرات المعتمد</h3>
            <div className="azu-calc-table-wrap">
                <table className="azu-calc-table">
                    <thead><tr><th>الرمز</th><th>النقاط</th><th>النسبة</th><th>التقدير</th></tr></thead>
                    <tbody>
                        {GRADES.map(gr => <tr key={gr.letter}>
                            <td><strong>{gr.letter}</strong></td>
                            <td>{gr.pts.toFixed(1)}</td>
                            <td>{gr.letter === 'F' ? 'أقل من 50%' : gr.min === 90 ? '90 – 100%' : `${gr.min}% – أقل من ${GRADES[GRADES.indexOf(gr) - 1].min}%`}</td>
                            <td>{gr.ar}</td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </Reveal>

        <div className="azu-notice">
            <span className="azu-tag">تنبيه</span>
            <p>{CALC_NOTE}</p>
        </div>
    </section>;
}

/* --- Scientific Software Hub --- */

function SoftwareHub() {
    const [disc, setDisc] = React.useState<string>('all');
    const list = SOFTWARE.filter(s => disc === 'all' || s.disc === disc);
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Tools', to: '/tools' }, { label: 'مكتبة البرامج العلمية' }]} />
        <div className="azu-kicker">SCIENTIFIC SOFTWARE HUB</div>
        <h2 className="azu-title">مكتبة البرامج العلمية</h2>
        <p className="azu-lead">البرامج اللي محتاجها في تخصصك: تعريفها واستخداماتها ومتطلباتها وروابطها الرسمية ومصادر تعلمها.</p>
        <div className="azu-filters">
            <button type="button" className={`azu-filter${disc === 'all' ? ' is-on' : ''}`} onClick={() => setDisc('all')}>كل التخصصات</button>
            {SOFTWARE_DISCIPLINES.map(d => <button key={d.id} type="button" className={`azu-filter${disc === d.id ? ' is-on' : ''}`} onClick={() => setDisc(d.id)}>
                <Icon name={d.icon} size={15} /> {d.ar}
            </button>)}
        </div>
        <Reveal stagger className="azu-prog-grid">
            {list.map(s => <Link key={s.id} to={`/tools/software/${s.id}`} className="azu-prog">
                <span className="azu-prog-icon"><Icon name={s.icon} size={22} /></span>
                <span className="azu-prog-names">
                    <span className="azu-prog-ar">{s.name}</span>
                    <span className="azu-prog-en">{SOFTWARE_DISCIPLINES.find(d => d.id === s.disc)?.ar}</span>
                </span>
                <span className="azu-prog-facts">{s.about}</span>
                <span className="azu-card-arrow"><Icon name="arrow" size={15} /></span>
            </Link>)}
        </Reveal>
    </section>;
}

function SoftwarePage({ soft }: { soft: Software }) {
    const d = SOFTWARE_DISCIPLINES.find(x => x.id === soft.disc);
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Tools', to: '/tools' }, { label: 'مكتبة البرامج', to: '/tools/software' }, { label: soft.name }]} />
        <div className="azu-kicker">SOFTWARE — {d?.ar}</div>
        <h2 className="azu-title">{soft.name}</h2>
        <Reveal stagger className="azu-progstats">
            <div className="azu-progstat"><Icon name={d?.icon || 'code'} size={22} /><div className="azu-progstat-label" dir="rtl">التخصص</div><div className="azu-progstat-value" dir="rtl">{d?.ar}</div></div>
            <div className="azu-progstat"><Icon name="extlink" size={22} /><div className="azu-progstat-label">الموقع الرسمي</div><div className="azu-progstat-value" dir="ltr">{soft.siteLabel}</div></div>
        </Reveal>
        <p className="azu-intro" dir="rtl">{soft.about}</p>
        <div className="azu-block">
            <div className="azu-minihead" dir="rtl">أهم الاستخدامات</div>
            <ul className="azu-ticks" dir="rtl">{soft.uses.map(u => <li key={u}>{u}</li>)}</ul>
        </div>
        <div className="azu-block">
            <div className="azu-minihead" dir="rtl">التخصصات اللي محتاجاه</div>
            <div className="azu-chip-grid">{soft.specs.map(sp => <span key={sp} className="azu-chip2" dir="rtl">{sp}</span>)}</div>
        </div>
        <div className="azu-block">
            <div className="azu-minihead" dir="rtl">متطلبات التشغيل</div>
            <p className="azu-note" dir="rtl">{soft.requirements}</p>
        </div>
        <div className="azu-block">
            <div className="azu-minihead" dir="rtl">مصادر التعلم</div>
            <ul className="azu-ticks azu-links-list">{soft.learn.map(l => <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer">{l.label} <Icon name="extlink" size={13} /></a>
            </li>)}</ul>
        </div>
        <div className="azu-backrow">
            <a className="azu-btn azu-btn-primary" href={soft.site} target="_blank" rel="noreferrer"><Icon name="extlink" size={15} /> الموقع الرسمي</a>
            <Link to="/tools/software" className="azu-btn azu-btn-outline"><Icon name="back" size={15} /> كل البرامج</Link>
        </div>
    </section>;
}

function SimplePage({ kicker, title, icon, children }: { kicker: string; title: string; icon: string; children: React.ReactNode }) {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: title }]} />
        <div className="azu-kicker">{kicker}</div>
        <h2 className="azu-title">{title}</h2>
        <div className="azu-empty"><Icon name={icon} size={30} />{children}</div>
    </section>;
}

/* ---------- App ---------- */

export function App() {
    const academicRoutes = FACULTIES.flatMap(f => [
        <Route key={`${f.id}`} path={`/academic/${f.id}`} element={<FacultyPage faculty={f} />} />,
        <Route key={`${f.id}-basic`} path={`/academic/${f.id}/basic`} element={<BasicDepartments faculty={f} />} />,
        <Route key={`${f.id}-special`} path={`/academic/${f.id}/special`} element={<SpecialPrograms faculty={f} />} />,
        ...PROGRAMS.map(p => <Route key={`${f.id}-special-${p.id}`} path={`/academic/${f.id}/special/${p.id}`} element={<ProgramPage faculty={f} program={p} />} />),
        ...deptsFor(f.id).flatMap(d => [
            <Route key={`${f.id}-${d.id}`} path={`/academic/${f.id}/basic/${d.id}`} element={<DepartmentPage faculty={f} dept={d} />} />,
            ...[1, 2, 3, 4].map(y => <Route key={`${f.id}-${d.id}-${y}`} path={`/academic/${f.id}/basic/${d.id}/year/${y}`} element={<YearPage faculty={f} dept={d} year={y} />} />),
        ]),
    ]);

    return <FileCard>
        <div className="azu-page">
            <TopBar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/academic" element={<Academic />} />
                {academicRoutes}
                <Route path="/tools" element={<ToolsHub />} />
                <Route path="/tools/calculator" element={<Calculator />} />
                <Route path="/tools/software" element={<SoftwareHub />} />
                {SOFTWARE.map(s => <Route key={s.id} path={`/tools/software/${s.id}`} element={<SoftwarePage soft={s} />} />)}
                <Route path="/research" element={<SimplePage kicker="RESEARCH" title="Research" icon="microscope"><p>قريبًا.</p></SimplePage>} />
                <Route path="/opportunities" element={<SimplePage kicker="OPPORTUNITIES" title="Opportunities" icon="briefcase"><p>قريبًا.</p></SimplePage>} />
                <Route path="/news" element={<section className="azu-section azu-flow">
                    <Crumb items={[{ label: 'Home', to: '/' }, { label: 'News' }]} />
                    <div className="azu-kicker">LATEST UPDATES</div>
                    <h2 className="azu-title">News &amp; Announcements</h2>
                    <Reveal stagger className="azu-news-grid">
                        {NEWS.map(n => <article key={n.title} className="azu-news-card">
                            <PhotoSlot label="صورة الخبر — قريبًا" ratio="16 / 9" />
                            <div className="azu-news-body">
                                <div className="azu-news-meta"><span className="azu-chip">{n.chip}</span><span className="azu-news-date">{n.date}</span></div>
                                <div className="azu-news-title">{n.title}</div>
                                <p className="azu-news-text">{n.text}</p>
                            </div>
                        </article>)}
                    </Reveal>
                    <p className="azu-note">تابع آخر الأخبار والإعلانات.</p>
                </section>} />
                <Route path="/community" element={<SimplePage kicker="COMMUNITY" title="Community" icon="users"><p>قريبًا.</p></SimplePage>} />
                <Route path="/about" element={<section className="azu-section azu-flow">
                    <Crumb items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
                    <div className="azu-kicker">ABOUT US</div>
                    <h2 className="azu-title">Built by Students. For Students.</h2>
                    <p className="azu-intro" dir="rtl">AZU Science منصة طلابية اتعملت عشان تسهّل الحياة الأكاديمية في كليات العلوم بجامعة الأزهر.</p>
                    <figure className="azu-about-photo">
                        <img src={aboutPhoto} alt="مصطفى محمود، مؤسس منصة AZU Science" loading="lazy" />
                        <figcaption dir="rtl">
                            <div className="azu-about-founders">مؤسس المنصة</div>
                            <div className="azu-about-names">مصطفى محمود<br />الفرقة الثانية فيزياء ورياضيات</div>
                        </figcaption>
                    </figure>
                    <p className="azu-intro azu-about-blurb" dir="rtl">من قلب كليات العلوم بجامعة الأزهر خرجت فكرة هذه المنصة على يد طالب من طلابها آمن بأن زملاءه يستحقون محتوى أقرب إليهم وأسهل وصولًا، فحمل على عاتقه بناءها وجمع ما يحتاجه الطالب في مكان واحد، لتبقى مبادرة طلابية خالصة: من الطلاب، وإليهم.</p>
                </section>} />
                <Route path="/signin" element={<SimplePage kicker="STUDENT LOGIN" title="Sign In" icon="user"><p>قريبًا.</p></SimplePage>} />
            </Routes>
            <Footer />
            <AgentChat />
        </div>
    </FileCard>;
}
