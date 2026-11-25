import React from 'react';
import { FileCard, Link, NavLink, Route, Routes } from '@instinct/files';
import heroPhoto from './photos/hero-building.jpg';
import logoImg from './photos/azu-logo.jpg';
import aboutPhoto from './photos/founder-mustafa.jpg';

/* ---------- Data ---------- */

import { DEPARTMENTS, PROGRAMS, COMPARE_PROGRAMS, GRADES, gradeFromPercent, gradeFromGPA, CALC_NOTE, SOFTWARE, SOFTWARE_DISCIPLINES, FACULTIES, YEAR_NAMES, TERM_NAMES, CONTACT_EMAIL } from './data';
import { BYLAW, COURSE_FILES, RESOURCE_TYPES } from './bylaw';
import type { BylawTrack } from './bylaw';
import { AgentChat, AGENT_OPEN_EVENT } from './AgentChat';
import { AuthPage } from './AuthPage';
import { AdminPage } from './AdminPage';
import { Icon } from './Icon';
import { MobileNav, SearchOverlay, TopNavLinks, SignInLink } from './nav';
import { clearJustConfirmed, useAuth } from './auth';
import type { Dept, Program, SpecDetail, Track, Term, ListSection, Software, Faculty } from './data';

const ASTRO_TRACKS = ['فلك وأرصاد', 'فلك خاص', 'أرصاد خاص'];
const deptsFor = (facultyId: string) => DEPARTMENTS.filter(d => !d.onlyFaculties || d.onlyFaculties.includes(facultyId));

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
    const qs = React.useMemo(() => new URLSearchParams(window.location.search), []);
    const [menuOpen, setMenuOpen] = React.useState(() => qs.has('menu'));
    const [searchOpen, setSearchOpen] = React.useState(() => qs.has('search'));
    React.useEffect(() => {
        return onVp(() => setScrolled(vp.top > 40));
    }, []);
    return <>
        <header className={`azu-topbar${scrolled ? ' is-scrolled' : ''}`}>
            <button type="button" className="azu-iconbtn azu-menu-btn" aria-label="القائمة" title="القائمة"
                onClick={() => setMenuOpen(true)}>
                <Icon name="menu" size={19} />
            </button>
            <Link to="/" className="azu-brand">
                <img src={logoImg} alt="AZU Science logo" className="azu-brand-logo" />
                <span className="azu-brand-text">
                    <span className="azu-brand-name">AZU Science</span>
                    <span className="azu-brand-sub">The Student Platform for the Faculty of Science</span>
                </span>
            </Link>
            <nav className="azu-nav" aria-label="Main">
                <TopNavLinks />
            </nav>
            <button type="button" className="azu-agent-entry" aria-label="بحث شامل" title="بحث شامل"
                onClick={() => setSearchOpen(true)}>
                <Icon name="search" size={16} />
            </button>
            <button type="button" className="azu-agent-entry" aria-label="مساعد AZU Science الذكي" title="مساعد AZU Science الذكي"
                onClick={() => window.dispatchEvent(new CustomEvent(AGENT_OPEN_EVENT))}>
                <Icon name="spark" size={16} />
            </button>
            <SignInLink />
        </header>
        {menuOpen && <MobileNav onClose={() => setMenuOpen(false)} />}
        {searchOpen && <SearchOverlay initial={qs.get('search') ?? ''} onClose={() => setSearchOpen(false)} />}
    </>;
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
                <Link to="/faq">FAQ</Link>
                <Link to="/contact">Contact Us</Link>
                <Link to="/report">Report an Issue</Link>
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

function bylawTracks(facultyId: string, deptId: string, year: number) {
    return (BYLAW[deptId]?.[year] ?? []).filter(t => facultyId === 'boys-cairo' || !t.cairoOnly);
}

function yearBase(faculty: Faculty, dept: Dept, year: number) {
    return `/academic/${faculty.id}/basic/${dept.id}/year/${year}`;
}

function acadCrumb(faculty: Faculty, dept: Dept, year?: number, track?: { ti: number; name: string }, term?: number, courseName?: string) {
    const items = [
        { label: 'Home', to: '/' },
        { label: 'Academic', to: '/academic' },
        { label: `${faculty.ar} — ${faculty.city}`, to: `/academic/${faculty.id}` },
        { label: 'أقسام أساسية', to: `/academic/${faculty.id}/basic` },
        { label: dept.ar, to: `/academic/${faculty.id}/basic/${dept.id}` },
    ];
    if (year) items.push({ label: YEAR_NAMES[year], to: track || term || courseName ? yearBase(faculty, dept, year) : undefined } as any);
    if (year && track) items.push({ label: `شعبة ${track.name}`, to: term || courseName ? `${yearBase(faculty, dept, year)}/track/${track.ti}` : undefined } as any);
    if (year && term) items.push({ label: TERM_NAMES[term] } as any);
    if (courseName) items.push({ label: courseName } as any);
    return items;
}

function Flow404({ backTo, backLabel }: { backTo: string; backLabel: string }) {
    return <>
        <div className="azu-kicker">404</div>
        <h2 className="azu-title">الصفحة غير موجودة.</h2>
        <p><Link to={backTo} className="azu-btn azu-btn-outline">{backLabel}</Link></p>
    </>;
}

function TrackChooser({ faculty, dept, year }: { faculty: Faculty; dept: Dept; year: number }) {
    const tracks = bylawTracks(faculty.id, dept.id, year);
    const base = yearBase(faculty, dept, year);
    return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year)} />
        <div className="azu-kicker">{dept.en.toUpperCase()} — YEAR {year}</div>
        <h2 className="azu-title" dir="rtl">{dept.ar} — {YEAR_NAMES[year]}</h2>
        <p className="azu-lead">اختار شعبتك.</p>
        <div className="azu-termbtns" dir="rtl">
            {tracks.map((t, ti) => <Link key={t.track} to={`${base}/track/${ti}`} className="azu-termbtn"><Icon name="cap" size={20} /> شعبة {t.track}</Link>)}
        </div>
    </section>;
}

function YearPage({ faculty, dept, year }: { faculty: Faculty; dept: Dept; year: number }) {
    const tracks = bylawTracks(faculty.id, dept.id, year);
    if (tracks.length > 1) return <TrackChooser faculty={faculty} dept={dept} year={year} />;
    const base = yearBase(faculty, dept, year);
    return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year)} />
        <div className="azu-kicker">{dept.en.toUpperCase()} — YEAR {year}</div>
        <h2 className="azu-title" dir="rtl">{dept.ar} — {YEAR_NAMES[year]}</h2>
        <div className="azu-termbtns" dir="rtl">
            <Link to={`${base}/term/1`} className="azu-termbtn"><Icon name="books" size={20} /> {TERM_NAMES[1]}</Link>
            <Link to={`${base}/term/2`} className="azu-termbtn"><Icon name="books" size={20} /> {TERM_NAMES[2]}</Link>
        </div>
    </section>;
}

function TrackTermsPage({ faculty, dept, year, ti }: { faculty: Faculty; dept: Dept; year: number; ti: number }) {
    const tracks = bylawTracks(faculty.id, dept.id, year);
    const track = tracks[ti];
    const base = yearBase(faculty, dept, year);
    if (!track) return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year)} />
        <Flow404 backTo={base} backLabel={`العودة لشعب ${YEAR_NAMES[year]}`} />
    </section>;
    const tbase = `${base}/track/${ti}`;
    return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year, { ti, name: track.track })} />
        <div className="azu-kicker">{dept.en.toUpperCase()} — YEAR {year}</div>
        <h2 className="azu-title" dir="rtl">شعبة {track.track} — {YEAR_NAMES[year]}</h2>
        <div className="azu-termbtns" dir="rtl">
            <Link to={`${tbase}/term/1`} className="azu-termbtn"><Icon name="books" size={20} /> {TERM_NAMES[1]}</Link>
            <Link to={`${tbase}/term/2`} className="azu-termbtn"><Icon name="books" size={20} /> {TERM_NAMES[2]}</Link>
        </div>
    </section>;
}

function termBase(faculty: Faculty, dept: Dept, year: number, tracks: BylawTrack[], ti?: number) {
    const base = yearBase(faculty, dept, year);
    return tracks.length > 1 ? `${base}/track/${ti ?? 0}/term` : `${base}/term`;
}

function TermPage({ faculty, dept, year, term, ti }: { faculty: Faculty; dept: Dept; year: number; term: number; ti?: number }) {
    const tracks = bylawTracks(faculty.id, dept.id, year);
    if (ti == null && tracks.length > 1) return <TrackChooser faculty={faculty} dept={dept} year={year} />;
    const track = tracks[ti ?? 0];
    const base = termBase(faculty, dept, year, tracks, ti);
    if (!track) return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year)} />
        <Flow404 backTo={yearBase(faculty, dept, year)} backLabel={`العودة ل${YEAR_NAMES[year]}`} />
    </section>;
    const courses = term === 1 ? track.t1 : track.t2;
    return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year, tracks.length > 1 ? { ti: ti ?? 0, name: track.track } : undefined, term)} />
        <div className="azu-kicker">{dept.en.toUpperCase()} — YEAR {year} — TERM {term}</div>
        <h2 className="azu-title" dir="rtl">{tracks.length > 1 ? `شعبة ${track.track} — ` : ''}{YEAR_NAMES[year]} — {TERM_NAMES[term]}</h2>
        {courses.length === 0
            ? <div className="azu-empty"><Icon name="books" size={30} /><p>قريبًا.</p></div>
            : <div className="azu-course-grid">
                {courses.map((c, ci) => <Link key={ci} to={`${base}/${term}/course/${ci}`} className="azu-coursebtn" dir="rtl">
                    <span className="azu-coursebtn-name">{c[1]}</span>
                    {c[0] && <span className="azu-coursebtn-code">{c[0]}</span>}
                </Link>)}
            </div>}
    </section>;
}

function CoursePage({ faculty, dept, year, term, ti }: { faculty: Faculty; dept: Dept; year: number; term: number; ti?: number }) {
    const tracks = bylawTracks(faculty.id, dept.id, year);
    const trackIdx = tracks.length > 1 ? (ti ?? -1) : 0;
    const track = tracks[trackIdx];
    const base = termBase(faculty, dept, year, tracks, ti);
    const prefix = `${base}/${term}/course/`;
    const path = window.location.pathname.replace(/^\/website/, '');
    const rest = path.startsWith(prefix) ? path.slice(prefix.length).replace(/\/$/, '') : '';
    const ci = Number(rest);
    const course = track && Number.isInteger(ci) ? (term === 1 ? track.t1 : track.t2)[ci] : undefined;
    if (!course) return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year)} />
        <Flow404 backTo={`${base}/${term}`} backLabel={`العودة لمواد ${TERM_NAMES[term]}`} />
    </section>;
    const files = COURSE_FILES[`${dept.id}/${year}/${term}/${trackIdx}/${ci}`] ?? {};
    return <section className="azu-section azu-flow">
        <Crumb items={acadCrumb(faculty, dept, year, tracks.length > 1 ? { ti: trackIdx, name: track.track } : undefined, term, course[1])} />
        <div className="azu-kicker">{dept.en.toUpperCase()} — YEAR {year} — TERM {term}</div>
        <h2 className="azu-title" dir="rtl">{course[1]}</h2>
        {course[0] && <div dir="rtl"><span className="azu-coursebtn-code">{course[0]}</span></div>}
        <div className="azu-res-grid" dir="rtl">
            {RESOURCE_TYPES.map(r => {
                const list = files[r.id] ?? [];
                return <div key={r.id} className="azu-res">
                    <Icon name={r.icon} size={24} />
                    <span className="azu-res-name">{r.ar}</span>
                    {list.length === 0
                        ? <span className="azu-tag">قريبًا</span>
                        : <div className="azu-res-links">{list.map(f => <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="azu-res-link">{f.title}</a>)}</div>}
                </div>;
            })}
        </div>
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


/* ---------- FAQ / Contact / Report ---------- */

const FAQS = [
    { q: 'إيه هي منصة AZU Science؟', a: 'منصة طلابية مستقلة بتجمع لطالب علوم الأزهر كل اللي محتاجه في مكان واحد: المواد والملفات الدراسية، الأدوات زي الحاسبة الأكاديمية، مكتبة البرامج العلمية، والفرص والأخبار.' },
    { q: 'هل المنصة تابعة للجامعة أو الكلية؟', a: 'لأ. AZU Science مبادرة طلابية مستقلة أسسها طالب من الكلية، ومش موقع رسمي لجامعة الأزهر ولا لكلية العلوم.' },
    { q: 'هل نتايج الحاسبة الأكاديمية رسمية؟', a: 'لأ، النتايج استرشادية بس. الحاسبة مبنية على النموذج المعتمد في لوائح الساعات المعتمدة، وقد تختلف تفاصيل لائحة كليتك أو برنامجك — التقدير الرسمي بييجي من شئون الكلية بس.' },
    { q: 'ليه ملفات المواد مكتوب عليها قريبًا؟', a: 'المنصة لسه في بدايتها، وشغالين على تجميع الامتحانات السابقة والمحاضرات وسلايدات الدكاترة وكتب الكلية لكل مادة، وهتتنزل تباعًا أول بأول.' },
    { q: 'ليه ممكن ألاقي فرق بين مواد قسمي والموجود على المنصة؟', a: 'بيانات المواد الحالية مأخوذة من لائحة علوم بنين القاهرة، وهي مشتركة مع باقي الكليات في معظم الأقسام — لو لقيت فرق في قسمك ابعتلنا من صفحة الإبلاغ عن مشكلة وهنراجعه.' },
    { q: 'إزاي أساعد في تطوير المنصة؟', a: 'أي ملفات أو امتحانات أو ملاحظات عندك لأي مادة بتفرق معانا كتير — ابعتلنا من صفحة تواصل معنا.' },
    { q: 'مين اللي بيدير المنصة؟', a: 'طالب من علوم الأزهر، وتقدر تعرف أكتر في صفحة About.' },
];

function FaqPage() {
    const [open, setOpen] = React.useState<number | null>(0);
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]} />
        <div className="azu-kicker">FAQ</div>
        <h2 className="azu-title">الأسئلة الشائعة</h2>
        <div className="azu-faq-list" dir="rtl">
            {FAQS.map((f, i) => <div key={i} className={`azu-faq${open === i ? ' is-open' : ''}`}>
                <button type="button" className="azu-faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                    <span>{f.q}</span>
                    <Icon name="down" size={16} />
                </button>
                {open === i && <p className="azu-faq-a">{f.a}</p>}
            </div>)}
        </div>
    </section>;
}

function MessagePage({ kind }: { kind: 'contact' | 'report' }) {
    const isReport = kind === 'report';
    const [name, setName] = React.useState('');
    const [from, setFrom] = React.useState('');
    const [msg, setMsg] = React.useState('');
    const ready = CONTACT_EMAIL !== '';
    /* Click + Enter handlers, never <form> submit: the File viewer iframe
       sandbox blocks form submissions (no allow-forms). */
    const submit = () => {
        if (!ready || !name.trim() || !msg.trim()) return;
        const subject = isReport ? 'بلاغ عن مشكلة — AZU Science' : 'رسالة من منصة AZU Science';
        const page = isReport ? `\n\nالصفحة: ${window.location.href}` : '';
        const body = `الاسم: ${name}\nالبريد: ${from}\n\n${msg}${page}`;
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    const enter = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') submit(); };
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: isReport ? 'Report an Issue' : 'Contact Us' }]} />
        <div className="azu-kicker">{isReport ? 'REPORT AN ISSUE' : 'CONTACT US'}</div>
        <h2 className="azu-title" dir="rtl">{isReport ? 'الإبلاغ عن مشكلة' : 'تواصل معنا'}</h2>
        {ready && <div className="azu-contact-lines" dir="rtl">
            <p className="azu-contact-line"><Icon name="mail" size={16} /> <span>البريد الإلكتروني:</span> <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr">{CONTACT_EMAIL}</a></p>
            <p className="azu-contact-line"><Icon name="whatsapp" size={16} /> <span>واتساب:</span> <a href="https://wa.me/201225728551" target="_blank" rel="noreferrer" dir="ltr">+20 122 572 8551</a></p>
            <p className="azu-contact-line"><Icon name="facebook" size={16} /> <span>فيسبوك:</span> <a href="https://www.facebook.com/share/19qWhxdbVs/" target="_blank" rel="noreferrer" dir="ltr">facebook.com/share/19qWhxdbVs</a></p>
        </div>}
        <div className="azu-form" dir="rtl">
            <label className="azu-field">الاسم
                <input className="azu-input" value={name} onChange={e => setName(e.target.value)} onKeyDown={enter} disabled={!ready} />
            </label>
            <label className="azu-field">بريدك الإلكتروني (اختياري)
                <input className="azu-input" type="email" dir="ltr" value={from} onChange={e => setFrom(e.target.value)} onKeyDown={enter} disabled={!ready} />
            </label>
            <label className="azu-field">{isReport ? 'وصف المشكلة' : 'رسالتك'}
                <textarea className="azu-input azu-textarea" rows={5} value={msg} onChange={e => setMsg(e.target.value)} disabled={!ready} />
            </label>
            {ready
                ? <button type="button" className="azu-btn azu-btn-primary" onClick={submit} disabled={!name.trim() || !msg.trim()}><Icon name="mail" size={15} /> إرسال</button>
                : <span className="azu-tag">قريبًا</span>}
        </div>
    </section>;
}

/* One-shot banner after a confirmation-email link signs the student in. */
function ConfirmedBanner() {
    const session = useAuth();
    if (!session?.justConfirmed) return null;
    return <div className="azu-confirmed" dir="rtl" role="status">
        <Icon name="check" size={16} />
        <span>تم تأكيد بريدك الإلكتروني بنجاح. أهلًا بك في المنصة.</span>
        <button type="button" className="azu-iconbtn" aria-label="إغلاق" onClick={() => clearJustConfirmed()}><Icon name="close" size={15} /></button>
    </div>;
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
            ...[1, 2, 3, 4].flatMap(y => {
                const tracks = bylawTracks(f.id, d.id, y);
                if (tracks.length > 1) {
                    return [
                        <Route key={`${f.id}-${d.id}-${y}`} path={`/academic/${f.id}/basic/${d.id}/year/${y}`} element={<YearPage faculty={f} dept={d} year={y} />} />,
                        ...tracks.flatMap((_, ti) => [
                            <Route key={`${f.id}-${d.id}-${y}-tr${ti}`} path={`/academic/${f.id}/basic/${d.id}/year/${y}/track/${ti}`} element={<TrackTermsPage faculty={f} dept={d} year={y} ti={ti} />} />,
                            ...[1, 2].flatMap(t => [
                                <Route key={`${f.id}-${d.id}-${y}-tr${ti}-t${t}`} path={`/academic/${f.id}/basic/${d.id}/year/${y}/track/${ti}/term/${t}`} element={<TermPage faculty={f} dept={d} year={y} term={t} ti={ti} />} />,
                                <Route key={`${f.id}-${d.id}-${y}-tr${ti}-t${t}-c`} path={`/academic/${f.id}/basic/${d.id}/year/${y}/track/${ti}/term/${t}/course/*`} element={<CoursePage faculty={f} dept={d} year={y} term={t} ti={ti} />} />,
                            ]),
                        ]),
                    ];
                }
                return [
                    <Route key={`${f.id}-${d.id}-${y}`} path={`/academic/${f.id}/basic/${d.id}/year/${y}`} element={<YearPage faculty={f} dept={d} year={y} />} />,
                    ...[1, 2].flatMap(t => [
                        <Route key={`${f.id}-${d.id}-${y}-t${t}`} path={`/academic/${f.id}/basic/${d.id}/year/${y}/term/${t}`} element={<TermPage faculty={f} dept={d} year={y} term={t} />} />,
                        <Route key={`${f.id}-${d.id}-${y}-t${t}-c`} path={`/academic/${f.id}/basic/${d.id}/year/${y}/term/${t}/course/*`} element={<CoursePage faculty={f} dept={d} year={y} term={t} />} />,
                    ]),
                ];
            }),
        ]),
    ]);

    return <FileCard>
        <div className="azu-page">
            <TopBar />
            <ConfirmedBanner />
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
                <Route path="/signin" element={<AuthPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/contact" element={<MessagePage kind="contact" />} />
                <Route path="/report" element={<MessagePage kind="report" />} />
                <Route path="*" element={<SimplePage kicker="404" title="Page Not Found" icon="search"><p>الصفحة غير موجودة.</p><p><Link to="/" className="azu-btn azu-btn-outline">العودة للرئيسية</Link></p></SimplePage>} />
            </Routes>
            <Footer />
            <AgentChat />
        </div>
    </FileCard>;
}
