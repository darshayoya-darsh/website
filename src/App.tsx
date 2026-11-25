import React from 'react';
import { FileCard, Link, NavLink, Route, Routes } from '@instinct/files';
import heroPhoto from './photos/hero-building.jpg';
import logoImg from './photos/azu-logo.jpg';

/* ---------- Data ---------- */

import { DEPARTMENTS, PROGRAMS, COMPARE_PROGRAMS, COMPARE_NOTE, COMPARE_TIPS } from './data';
import type { Dept, Program, SpecDetail, Track, Term, ListSection } from './data';

type Faculty = { id: string; ar: string; en: string; city: string };

const FACULTIES: Faculty[] = [
    { id: 'boys-cairo', ar: 'علوم بنين', en: 'Science — Boys', city: 'القاهرة' },
    { id: 'girls-cairo', ar: 'علوم بنات', en: 'Science — Girls', city: 'القاهرة' },
    { id: 'boys-assiut', ar: 'علوم بنين', en: 'Science — Boys', city: 'أسيوط' },
    { id: 'girls-assiut', ar: 'علوم بنات', en: 'Science — Girls', city: 'أسيوط' },
];

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
        case 'check': return <svg {...p}><path d="M20 6L9 17l-5-5" /></svg>;
        default: return null;
    }
}

/* ---------- Scroll reveal ---------- */

function Reveal({ className = '', stagger = false, children }: { className?: string; stagger?: boolean; children: React.ReactNode }) {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
            });
        }, { threshold: 0.1 });
        io.observe(el);
        const fallback = window.setTimeout(() => el.classList.add('is-in'), 900);
        return () => { io.disconnect(); window.clearTimeout(fallback); };
    }, []);
    return <div ref={ref} className={`azu-reveal${stagger ? ' azu-stagger' : ''}${className ? ' ' + className : ''}`}>{children}</div>;
}

/* ---------- Building blocks ---------- */

function TopBar() {
    return <header className="azu-topbar">
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
            <NavLink to="/research">Research</NavLink>
            <NavLink to="/opportunities">Opportunities</NavLink>
            <NavLink to="/news">News</NavLink>
            <NavLink to="/community">Community</NavLink>
            <NavLink to="/about">About</NavLink>
        </nav>
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
                <span className="azu-footer-note">FAQ — coming soon</span>
                <span className="azu-footer-note">Contact Us — coming soon</span>
                <span className="azu-footer-note">Report an Issue — coming soon</span>
            </div>
            <div className="azu-footer-col">
                <div className="azu-footer-head">Follow Us</div>
                <span className="azu-footer-note">Social links — coming soon</span>
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
];

function Home() {
    return <>
        <section className="azu-hero">
            <div className="azu-hero-bg" style={{ backgroundImage: `url(${heroPhoto})` }} aria-hidden="true" />
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
                <div className="azu-stat-value">{s.value}</div>
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
                    <PhotoSlot label="صورة الخبر — بتجهز" ratio="16 / 9" />
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
                <span className="azu-choice-text">الأقسام العلمية الرئيسية بالكلية: فيزياء ورياضيات، كيمياء، جيولوجيا، بيولوجي.</span>
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
            {DEPARTMENTS.map(d => <Link key={d.id} to={`/academic/${faculty.id}/basic/${d.id}`} className="azu-dept">
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
            <ul className="azu-tips" dir="rtl">{COMPARE_TIPS.map(t => <li key={t}>{t}</li>)}</ul>
            <p className="azu-note">{COMPARE_NOTE}</p>
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
        {program.pending && <div className="azu-empty"><Icon name="spark" size={26} /><p>البروشور الرسمي للبرنامج لسه بيوصل — الساعات واللغة والتفاصيل الكاملة هتتضاف هنا فور وصولها.</p></div>}
        <div className="azu-backrow"><Link to={`/academic/${faculty.id}/special`} className="azu-btn azu-btn-outline"><Icon name="back" size={15} /> كل البرامج المتميزة</Link></div>
    </section>;
}

function DepartmentPage({ faculty, dept }: { faculty: Faculty; dept: Dept }) {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Academic', to: '/academic' }, { label: `${faculty.ar} — ${faculty.city}`, to: `/academic/${faculty.id}` }, { label: 'أقسام أساسية', to: `/academic/${faculty.id}/basic` }, { label: dept.ar }]} />
        <div className="azu-kicker">{dept.en.toUpperCase()}</div>
        <h2 className="azu-title" dir="rtl">قسم {dept.ar}</h2>
        {dept.intro && <p className="azu-intro" dir="rtl">{dept.intro}</p>}
        {dept.importantNote && <div className="azu-callout" dir="rtl"><div className="azu-callout-title">ملاحظة مهمة</div><p>{dept.importantNote}</p></div>}
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
            {dept.careersNote && <p className="azu-note" dir="rtl">{dept.careersNote}</p>}
        </div>}
    </section>;
}

function YearPage({ faculty, dept, year }: { faculty: Faculty; dept: Dept; year: number }) {
    const specs = dept.years[year] ?? [];
    const notes = dept.yearNotes?.[year] ?? [];
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
                {notes.length > 0 && <ul className="azu-ticks azu-intro" dir="rtl">{notes.map(n => <li key={n}>{n}</li>)}</ul>}
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
                {showTerms && dept.quranNote && <p className="azu-note" dir="rtl">{dept.quranNote}</p>}
                {tracks.length > 0 && <Reveal stagger className="azu-track-grid">
                    {tracks.map((t: Track) => <div key={t.name} className="azu-track">
                        <div className="azu-track-name" dir="rtl">{t.name}</div>
                        {t.req && <div className="azu-track-req" dir="rtl">{t.req}</div>}
                        {t.desc && <p className="azu-track-desc" dir="rtl">{t.desc}</p>}
                        {t.careers && <>
                            <div className="azu-minihead" dir="rtl">تقدر تشتغل في</div>
                            <ul className="azu-ticks" dir="rtl">{t.careers.map(x => <li key={x}>{x}</li>)}</ul>
                        </>}
                        {t.note && <p className="azu-track-note" dir="rtl">{t.note}</p>}
                    </div>)}
                </Reveal>}
                {groups.map((g: ListSection) => <div key={g.title} className="azu-block">
                    <div className="azu-minihead" dir="rtl">{g.title}</div>
                    <Reveal stagger className="azu-spec-grid">
                        {g.items.map(s => <div key={s} className="azu-spec" dir="rtl"><Icon name="spark" size={16} /> {s}</div>)}
                    </Reveal>
                </div>)}
                {groups.length > 0 && <p className="azu-note" dir="rtl">كل قسم ليه مجاله، لكن تقدر تشتغل في أي مجال من مجالات الأحياء.</p>}
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
                    <p className="azu-note">محتوى كل تخصص — المواد، الجداول، والمصادر — بيتجهز للنسخة الجاية.</p>
                </>}
                {specs.length === 0 && !showTerms && tracks.length === 0 && groups.length === 0 && notes.length === 0 &&
                    <div className="azu-empty"><Icon name="books" size={30} /><p>مفيش تقسيمات في {YEAR_NAMES[year]} — مواد السنة وجداولها هتظهر هنا أول ما تجهز.</p></div>}
            </>}
    </section>;
}

/* ---------- Simple pages ---------- */

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
        ...DEPARTMENTS.flatMap(d => [
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
                <Route path="/research" element={<SimplePage kicker="RESEARCH" title="Research" icon="microscope"><p>فرص البحث والمشاريع العلمية والمصادر لكل الأقسام — القسم ده بيتجهز للنسخة الجاية.</p></SimplePage>} />
                <Route path="/opportunities" element={<SimplePage kicker="OPPORTUNITIES" title="Opportunities" icon="briefcase"><p>التدريبات والمنح والمسابقات والفعاليات العلمية — أول ما الفرص تتجمّع هتظهر هنا.</p></SimplePage>} />
                <Route path="/news" element={<section className="azu-section azu-flow">
                    <Crumb items={[{ label: 'Home', to: '/' }, { label: 'News' }]} />
                    <div className="azu-kicker">LATEST UPDATES</div>
                    <h2 className="azu-title">News &amp; Announcements</h2>
                    <Reveal stagger className="azu-news-grid">
                        {NEWS.map(n => <article key={n.title} className="azu-news-card">
                            <PhotoSlot label="صورة الخبر — بتجهز" ratio="16 / 9" />
                            <div className="azu-news-body">
                                <div className="azu-news-meta"><span className="azu-chip">{n.chip}</span><span className="azu-news-date">{n.date}</span></div>
                                <div className="azu-news-title">{n.title}</div>
                                <p className="azu-news-text">{n.text}</p>
                            </div>
                        </article>)}
                    </Reveal>
                    <p className="azu-note">الأخبار دي محتوى تجريبي للنسخة الأولى — الإدارة هتنشر الأخبار الحقيقية من لوحة التحكم.</p>
                </section>} />
                <Route path="/community" element={<SimplePage kicker="COMMUNITY" title="Community" icon="users"><p>مجتمع الطلبة: مجموعات كل قسم وفرقة، مناقشات، وتبادل مصادر — بيتجهز.</p></SimplePage>} />
                <Route path="/about" element={<SimplePage kicker="ABOUT US" title="Built by Students. For Students." icon="users"><p>AZU Science منصة طلابية اتعملت عشان تسهّل الحياة الأكاديمية في كليات العلوم بجامعة الأزهر — فريق العمل وصورهم هيظهروا هنا قريب.</p></SimplePage>} />
                <Route path="/signin" element={<SimplePage kicker="STUDENT LOGIN" title="Sign In" icon="user"><p>تسجيل الدخول ولوحة التحكم لسه بيتبنيوا. الأدمن هيدخل بإيميل وكلمة سر عشان يضيف ويعدّل الأخبار والمواد والإعلانات من غير كود.</p></SimplePage>} />
            </Routes>
            <Footer />
        </div>
    </FileCard>;
}
