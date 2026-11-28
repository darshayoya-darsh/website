import React from 'react';
import { Link } from '@instinct/files';
import { Icon } from './Icon';
import { Reveal, Crumb } from './ui';
import {
    RESEARCH_DISCIPLINES, RESOURCES, ACADEMY_STAGES, ACADEMY_FORMATS, TOOL_FUNCTIONS,
    JOURNAL_CHECKS, JOURNAL_TYPES, JOURNEY, FEATURED_IDS, ACCESS_LABEL, LEVEL_LABEL, KIND_LABEL,
    discAr, resourceById, searchResearch, COURSES, COURSE_TOPIC, COURSE_LANG,
} from './research';
import type { Resource, ResKind, ResAccess, Discipline, CourseLang } from './research';

/* ---------- Small pieces ---------- */

function KindBadge({ k }: { k: ResKind }) {
    const l = KIND_LABEL[k];
    return <span className={`azu-rh-badge azu-rh-kind ${l.cls}`}>{l.ar}</span>;
}

function AccessBadge({ a }: { a: ResAccess }) {
    const l = ACCESS_LABEL[a];
    return <span className={`azu-rh-badge ${l.cls}`}>{l.ar}</span>;
}

function LevelBadge({ l }: { l: 'beginner' | 'intermediate' | 'advanced' }) {
    const x = LEVEL_LABEL[l];
    return <span className={`azu-rh-badge azu-rh-level ${x.cls}`}>{x.ar}</span>;
}

function ResCard({ r, withUses = false }: { r: Resource; withUses?: boolean }) {
    return <div className="azu-rh-res">
        <div className="azu-rh-res-top">
            <span className="azu-rh-res-icon"><Icon name={KIND_LABEL[r.kind].icon} size={20} /></span>
            <div className="azu-rh-res-names">
                <span className="azu-rh-res-name">{r.name}</span>
                <span className="azu-rh-res-ar" dir="rtl">{r.ar}</span>
            </div>
        </div>
        <div className="azu-rh-badges">
            <KindBadge k={r.kind} />
            <AccessBadge a={r.access} />
            <LevelBadge l={r.level} />
        </div>
        <p className="azu-rh-res-about" dir="rtl">{r.about}</p>
        <div className="azu-rh-res-disc" dir="rtl">
            <Icon name="target" size={13} />
            {r.disc.length ? r.disc.map(discAr).join(' · ') : 'كل التخصصات'}
        </div>
        {withUses && r.uses.length > 0 && <ul className="azu-ticks azu-rh-uses" dir="rtl">{r.uses.map(u => <li key={u}>{u}</li>)}</ul>}
        {r.note && <p className="azu-rh-res-note" dir="rtl">{r.note}</p>}
        <a className="azu-rh-visit" href={r.url} target="_blank" rel="noreferrer">
            Visit Platform <Icon name="extlink" size={13} />
        </a>
    </div>;
}

/* ---------- Hero search ---------- */

function HubSearch() {
    const [q, setQ] = React.useState('');
    const hits = React.useMemo(() => searchResearch(q, 7), [q]);
    return <div className="azu-rh-search">
        <div className="azu-rh-searchbar">
            <Icon name="search" size={18} />
            <input className="azu-rh-searchinput" dir="auto" value={q} onChange={e => setQ(e.target.value)}
                placeholder="ابحث عن منصة، تخصص، أداة، مجلة أو موضوع…" aria-label="بحث داخل Research Hub" />
            {q !== '' && <button type="button" className="azu-rh-searchclear" aria-label="مسح البحث" onClick={() => setQ('')}>
                <Icon name="close" size={14} />
            </button>}
        </div>
        {q.trim() !== '' && <div className="azu-rh-hits">
            {hits.length === 0
                ? <div className="azu-rh-hit-empty" dir="rtl">مفيش نتايج مطابقة. جرّب كلمة تانية زي «PubMed» أو «تحليل البيانات».</div>
                : hits.map(h => <Link key={h.id} to={h.to} className="azu-rh-hit">
                    <span className="azu-rh-hit-k">{h.kind}</span>
                    <span className="azu-rh-hit-t">{h.title}</span>
                    <span className="azu-rh-hit-s" dir="rtl">{h.sub}</span>
                </Link>)}
        </div>}
    </div>;
}

/* ---------- 1. Hub ---------- */

const HUB_SECTIONS = [
    { to: '/research/academy', icon: 'cap', en: 'Research Academy', ar: 'أكاديمية البحث العلمي', text: 'مسار متدرج من 7 مراحل ياخدك من «إيه هو البحث العلمي» لحد النشر وأخلاقيات البحث.' },
    { to: '/research/resources', icon: 'database', en: 'Scientific Resources', ar: 'المصادر والمنصات العلمية', text: 'مكتبة مقسمة على 9 تخصصات: قواعد بيانات، مستودعات أبحاث، مصادر بيانات، ودوريات.' },
    { to: '/research/tools', icon: 'code', en: 'Research Tools', ar: 'أدوات الباحث العلمي', text: 'أدوات لاكتشاف الأبحاث، إدارة المراجع، الكتابة الأكاديمية، تحليل البيانات والتمثيل البياني.' },
    { to: '/research/journals', icon: 'journal', en: 'Scientific Journals', ar: 'الدوريات والمجلات العلمية', text: 'تعرف تفرق بين المجلة المحكمة والمسودة، وتتحقق من موثوقية أي مجلة قبل النشر.' },
];

export function ResearchHub() {
    return <section className="azu-section azu-flow">
        <div className="azu-rh-hero">
            <div className="azu-rh-hero-inner">
                <div className="azu-kicker azu-kicker-light">RESEARCH HUB</div>
                <h1 className="azu-rh-title">Research Hub</h1>
                <div className="azu-rh-sub">From Learning to Discovery</div>
                <p className="azu-rh-text" dir="rtl">
                    بوابتك للمعرفة العلمية وأدوات البحث والاكتشاف. اتعلم مهارات البحث، استكشف المصادر العلمية، وخد أول خطوة في طريق البحث العلمي.
                </p>
                <HubSearch />
                <div className="azu-rh-quick">
                    <Link to="/research/academy" className="azu-btn azu-btn-primary">ابدأ من الأكاديمية <Icon name="arrow" size={15} /></Link>
                    <Link to="/research/resources" className="azu-btn azu-btn-ghost">استكشف المكتبة</Link>
                </div>
            </div>
        </div>

        <Reveal stagger className="azu-rh-secgrid">
            {HUB_SECTIONS.map(s => <Link key={s.to} to={s.to} className="azu-rh-sec">
                <span className="azu-rh-sec-icon"><Icon name={s.icon} size={24} /></span>
                <span className="azu-rh-sec-en">{s.en}</span>
                <span className="azu-rh-sec-ar" dir="rtl">{s.ar}</span>
                <span className="azu-rh-sec-text" dir="rtl">{s.text}</span>
                <span className="azu-rh-sec-go">Enter <Icon name="arrow" size={14} /></span>
            </Link>)}
        </Reveal>

        <div className="azu-rh-head">
            <div className="azu-kicker">EXPLORE BY DISCIPLINE</div>
            <h2 className="azu-title">استكشف حسب تخصصك</h2>
            <p className="azu-lead" dir="rtl">كل تخصص له صفحته اللي فيها أهم المصادر العلمية المرتبطة بيه وطبيعة الوصول لكل مصدر.</p>
        </div>
        <Reveal stagger className="azu-rh-discgrid">
            {RESEARCH_DISCIPLINES.map(d => <Link key={d.id} to={`/research/discipline/${d.id}`} className="azu-rh-disc">
                <span className="azu-rh-disc-icon"><Icon name={d.icon} size={22} /></span>
                <span className="azu-rh-disc-ar" dir="rtl">{d.ar}</span>
                <span className="azu-rh-disc-en">{d.en}</span>
                <span className="azu-rh-disc-text" dir="rtl">{d.blurb}</span>
                <span className="azu-rh-disc-count">{RESOURCES.filter(r => inDisc(r, d.id)).length} مصادر</span>
            </Link>)}
        </Reveal>

        <div className="azu-rh-head">
            <div className="azu-kicker">FEATURED RESOURCES</div>
            <h2 className="azu-title">مصادر مميزة</h2>
            <p className="azu-lead" dir="rtl">أكتر المصادر اللي هتحتاجها في أول بحث ليك.</p>
        </div>
        <Reveal stagger className="azu-rh-resgrid">
            {FEATURED_IDS.map(id => resourceById(id)).filter((r): r is Resource => !!r).map(r => <ResCard key={r.id} r={r} />)}
        </Reveal>

        <div className="azu-rh-head">
            <div className="azu-kicker">START YOUR RESEARCH JOURNEY</div>
            <h2 className="azu-title">ابدأ رحلتك البحثية</h2>
            <p className="azu-lead" dir="rtl">خمس خطوات بالترتيب: من أول فكرة لحد النشر.</p>
        </div>
        <Reveal stagger className="azu-rh-journey">
            {JOURNEY.map(j => <div key={j.n} className="azu-rh-step">
                <span className="azu-rh-step-n">{j.n}</span>
                <span className="azu-rh-step-title" dir="rtl">{j.title}</span>
                <p className="azu-rh-step-text" dir="rtl">{j.text}</p>
                <Link to={j.to} className="azu-rh-step-go">{j.cta} <Icon name="arrow" size={13} /></Link>
            </div>)}
        </Reveal>

        <div className="azu-notice">
            <span className="azu-tag">Learn · Explore · Research</span>
            <p dir="rtl">فلسفة القسم: اتعلم أساسيات البحث، استكشف المصادر المتخصصة، بعدين استخدم الأدوات في تنفيذ بحثك.</p>
        </div>
    </section>;
}

function CoursesSection() {
    const [lang, setLang] = React.useState<'all' | CourseLang>('all');
    const [lvl, setLvl] = React.useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const list = COURSES.filter(c => (lang === 'all' || c.lang === lang || c.lang === 'both') && (lvl === 'all' || c.level === lvl));
    const langs: { id: 'all' | CourseLang; t: string }[] = [{ id: 'all', t: 'الكل' }, { id: 'ar', t: 'عربي' }, { id: 'en', t: 'English' }];
    const lvls: { id: 'all' | 'beginner' | 'intermediate' | 'advanced'; t: string }[] = [
        { id: 'all', t: 'كل المستويات' }, { id: 'beginner', t: 'مبتدئ' }, { id: 'intermediate', t: 'متوسط' }, { id: 'advanced', t: 'متقدم' },
    ];
    return <div id="courses" className="azu-rh-courses">
        <div className="azu-kicker">COURSES</div>
        <h3 className="azu-title azu-rh-subtitle">الكورسات</h3>
        <p className="azu-intro" dir="rtl">
            كورسات مختارة في مهارات البحث العلمي، كل واحد فتحت صفحته الرسمية وتأكدت من شروط الوصول المجاني بنفسي.
            لو في شهادة مدفوعة أو مدة وصول محدودة، مكتوب ده على الكارت.
        </p>
        <div className="azu-rh-filterrow" dir="rtl">
            {langs.map(x => <button key={x.id} type="button" className={`azu-rh-fchip${lang === x.id ? ' is-on' : ''}`} onClick={() => setLang(x.id)}>{x.t}</button>)}
            <span className="azu-rh-fsep" />
            {lvls.map(x => <button key={x.id} type="button" className={`azu-rh-fchip${lvl === x.id ? ' is-on' : ''}`} onClick={() => setLvl(x.id)}>{x.t}</button>)}
        </div>
        {list.length === 0 && <p className="azu-note" dir="rtl">مفيش كورسات بالفلاتر دي لسه.</p>}
        <div className="azu-rh-courselist">
            {list.map(c => <div key={c.id} className="azu-rh-res azu-rh-course">
                <div className="azu-rh-res-top">
                    <span className="azu-rh-res-icon"><Icon name="cap" size={20} /></span>
                    <div className="azu-rh-res-names">
                        <span className="azu-rh-res-name" dir="auto">{c.title}</span>
                        <span className="azu-rh-res-ar" dir="rtl">{c.providerAr} · {c.provider}</span>
                    </div>
                </div>
                <div className="azu-rh-badges">
                    <span className="azu-rh-badge azu-rh-kind is-k-index">{COURSE_LANG[c.lang]}</span>
                    <AccessBadge a={c.access} />
                    <LevelBadge l={c.level} />
                </div>
                <p className="azu-rh-res-about" dir="rtl">{c.about}</p>
                <div className="azu-rh-res-disc" dir="rtl"><Icon name="target" size={13} />{COURSE_TOPIC[c.topic]}</div>
                <p className="azu-rh-res-note" dir="rtl">{c.note}</p>
                <a className="azu-rh-visit" href={c.url} target="_blank" rel="noreferrer">Open Course <Icon name="extlink" size={13} /></a>
            </div>)}
        </div>
    </div>;
}

/* ---------- 2. Academy ---------- */

export function ResearchAcademy() {
    const [open, setOpen] = React.useState<string>('intro');
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Research', to: '/research' }, { label: 'Research Academy' }]} />
        <div className="azu-kicker">RESEARCH ACADEMY</div>
        <h2 className="azu-title">أكاديمية البحث العلمي</h2>
        <p className="azu-intro" dir="rtl">
            مسار تعليمي متدرج من 7 مراحل: من الطالب اللي ملوش خبرة في البحث، للطالب اللي عنده أساسيات وعايز يطوّرها.
            كل مرحلة ليها هدف واضح ونتيجة المفروض تطلع بيها قبل ما تنتقل للي بعدها.
        </p>
        <p dir="rtl"><a className="azu-rh-visit" href="#courses" onClick={e => { e.preventDefault(); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }}>الكورسات <Icon name="down" size={13} /></a></p>
        <div className="azu-rh-levels">
            {(Object.keys(LEVEL_LABEL) as ('beginner' | 'intermediate' | 'advanced')[]).map(l => <span key={l} className="azu-rh-levelkey">
                <LevelBadge l={l} /> <span dir="rtl">{l === 'beginner' ? 'تبدأ من هنا' : l === 'intermediate' ? 'بعد الأساسيات' : 'للطلاب المتقدمين'}</span>
            </span>)}
        </div>
        <div className="azu-rh-stages">
            {ACADEMY_STAGES.map(s => <div key={s.id} className={`azu-rh-stage${open === s.id ? ' is-open' : ''}`}>
                <button type="button" className="azu-rh-stage-q" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? '' : s.id)}>
                    <span className="azu-rh-stage-n">{s.n}</span>
                    <span className="azu-rh-stage-names">
                        <span className="azu-rh-stage-ar" dir="rtl">{s.ar}</span>
                        <span className="azu-rh-stage-en">{s.en}</span>
                    </span>
                    <LevelBadge l={s.level} />
                    <Icon name="down" size={16} />
                </button>
                {open === s.id && <div className="azu-rh-stage-body">
                    <div className="azu-minihead" dir="rtl">المحتوى</div>
                    <ul className="azu-ticks" dir="rtl">{s.bullets.map(b => <li key={b}>{b}</li>)}</ul>
                    <div className="azu-rh-outcome" dir="rtl"><strong>النتيجة:</strong> {s.outcome}</div>
                </div>}
            </div>)}
        </div>

        <CoursesSection />

        <div className="azu-rh-twocol">
            <div className="azu-block">
                <div className="azu-minihead" dir="rtl">طريقة عرض المحتوى</div>
                <ul className="azu-ticks" dir="rtl">{ACADEMY_FORMATS.map(f => <li key={f}>{f}</li>)}</ul>
            </div>
            <div className="azu-block">
                <div className="azu-minihead" dir="rtl">مصادر تعليمية مقترحة</div>
                <ul className="azu-ticks azu-links-list" dir="rtl">
                    {['inasp', 'coursera', 'edraak', 'rwaq'].map(id => resourceById(id)).filter((r): r is Resource => !!r)
                        .map(r => <li key={r.id}><a href={r.url} target="_blank" rel="noreferrer">{r.ar} — {r.name} <Icon name="extlink" size={13} /></a></li>)}
                </ul>
                <p className="azu-note" dir="rtl">راجع أي دورة قبل ما تعتمد عليها: المستوى، واللغة، وشروط الوصول.</p>
            </div>
        </div>
    </section>;
}

/* ---------- 3. Library ---------- */

const KINDS: ResKind[] = ['database', 'repository', 'data', 'publisher', 'tool', 'index', 'course', 'opportunity'];
const ACCESSES: ResAccess[] = ['free', 'subscription'];
const inDisc = (r: Resource, d: string) => d === 'all' || r.disc.length === 0 || r.disc.includes(d);

export function ResearchLibrary() {
    const [disc, setDisc] = React.useState('all');
    const [kind, setKind] = React.useState<'all' | ResKind>('all');
    const [access, setAccess] = React.useState<'all' | ResAccess>('all');
    const [q, setQ] = React.useState('');

    const list = RESOURCES.filter(r =>
        inDisc(r, disc) &&
        (kind === 'all' || r.kind === kind) &&
        (access === 'all' || r.access === access) &&
        (q.trim() === '' || `${r.name} ${r.ar} ${r.about} ${r.disc.map(discAr).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase()))
    );

    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Research', to: '/research' }, { label: 'Scientific Resources' }]} />
        <div className="azu-kicker">SCIENTIFIC RESOURCES</div>
        <h2 className="azu-title">المكتبة العلمية</h2>
        <p className="azu-intro" dir="rtl">
            كل مصدر هنا متسجل بنوعه (قاعدة بيانات، مستودع، دوريات، بيانات، أداة) وطبيعة الوصول ليه ومستوى المستخدم المناسب،
            عشان تعرف بالظبط إيه اللي بيديهولك وإيه اللي محتاج اشتراك أو حساب.
        </p>

        <div className="azu-rh-filterbar">
            <div className="azu-rh-searchbar azu-rh-searchbar-inline">
                <Icon name="search" size={17} />
                <input className="azu-rh-searchinput" dir="auto" value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو الموضوع…" aria-label="بحث في المكتبة" />
                {q !== '' && <button type="button" className="azu-rh-searchclear" aria-label="مسح" onClick={() => setQ('')}><Icon name="close" size={14} /></button>}
            </div>
            <div className="azu-rh-count">{list.length} مصدر</div>
        </div>

        <div className="azu-rh-filtergroup">
            <span className="azu-rh-filterlabel">التخصص</span>
            <div className="azu-filters">
                <button type="button" className={`azu-filter${disc === 'all' ? ' is-on' : ''}`} onClick={() => setDisc('all')}>كل التخصصات</button>
                {RESEARCH_DISCIPLINES.map(d => <button key={d.id} type="button" className={`azu-filter${disc === d.id ? ' is-on' : ''}`} onClick={() => setDisc(d.id)}>
                    <Icon name={d.icon} size={14} /> {d.ar}
                </button>)}
            </div>
        </div>

        <div className="azu-rh-filtergroup">
            <span className="azu-rh-filterlabel">نوع المصدر</span>
            <div className="azu-filters">
                <button type="button" className={`azu-filter${kind === 'all' ? ' is-on' : ''}`} onClick={() => setKind('all')}>كل الأنواع</button>
                {KINDS.map(k => <button key={k} type="button" className={`azu-filter${kind === k ? ' is-on' : ''}`} onClick={() => setKind(k)}>{KIND_LABEL[k].ar}</button>)}
            </div>
        </div>

        <div className="azu-rh-filtergroup">
            <span className="azu-rh-filterlabel">طبيعة الوصول</span>
            <div className="azu-filters">
                <button type="button" className={`azu-filter${access === 'all' ? ' is-on' : ''}`} onClick={() => setAccess('all')}>الكل</button>
                {ACCESSES.map(a => <button key={a} type="button" className={`azu-filter${access === a ? ' is-on' : ''}`} onClick={() => setAccess(a)}>{ACCESS_LABEL[a].ar}</button>)}
            </div>
        </div>

        {list.length === 0
            ? <div className="azu-rh-empty" dir="rtl">
                <Icon name="search" size={26} />
                <p>مفيش مصادر مطابقة للفلاتر دي. جرّب تشيل فلتر أو تغيّر التخصص.</p>
            </div>
            : <Reveal stagger className="azu-rh-resgrid">{list.map(r => <ResCard key={r.id} r={r} />)}</Reveal>}

        <div className="azu-notice">
            <span className="azu-tag">معايير الإضافة</span>
            <p dir="rtl">
                كل مصدر لازم يكون تابع لجهة علمية موثوقة، والرابط يودي على الموقع الرسمي، ويوضّح طبيعة الوصول (مجاني/مفتوح/اشتراك/حساب)،
                ومن غير ما نقدّم منصة على إنها مجانية بالكامل لو جزء من خدماتها مدفوع. الروابط بتتراجع دوريًا.
            </p>
        </div>
    </section>;
}

/* ---------- 4. Tools ---------- */

export function ResearchTools() {
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Research', to: '/research' }, { label: 'Research Tools' }]} />
        <div className="azu-kicker">RESEARCH TOOLS</div>
        <h2 className="azu-title">أدوات الباحث العلمي</h2>
        <p className="azu-intro" dir="rtl">
            الأدوات مرتبة حسب وظيفتها في رحلة البحث: من اكتشاف الأبحاث لحد كتابة البحث وتنظيم مراجعه.
        </p>
        {TOOL_FUNCTIONS.map(f => {
            const items = f.ids.map(id => resourceById(id)).filter((r): r is Resource => !!r);
            if (!items.length) return null;
            return <div key={f.id} className="azu-block">
                <div className="azu-rh-fnhead">
                    <span className="azu-rh-fn-en">{f.en}</span>
                    <span className="azu-rh-fn-ar" dir="rtl">{f.ar}</span>
                    <span className="azu-rh-fn-note" dir="rtl">{f.note}</span>
                </div>
                <Reveal stagger className="azu-rh-resgrid">{items.map(r => <ResCard key={r.id} r={r} />)}</Reveal>
            </div>;
        })}
        <div className="azu-notice">
            <span className="azu-tag">نصيحة</span>
            <p dir="rtl">ابدأ بـ Google Scholar للاكتشاف وZotero لتجميع المراجع. الاتنين مجانيين وتأثيرهم على ترتيب بحثك كبير.</p>
        </div>
    </section>;
}

/* ---------- 5. Journals ---------- */

export function ResearchJournals() {
    const indexes = RESOURCES.filter(r => r.kind === 'index');
    const publishers = RESOURCES.filter(r => r.kind === 'publisher');
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Research', to: '/research' }, { label: 'Scientific Journals' }]} />
        <div className="azu-kicker">SCIENTIFIC JOURNALS</div>
        <h2 className="azu-title">الدوريات والمجلات العلمية</h2>
        <p className="azu-intro" dir="rtl">
            مش كل ورقة على الإنترنت بحث محكم. الفرق بين المجلة المحكمة والمستودع البحثي هو أول حاجة لازم تعرفها قبل ما تعتمد على أي مصدر أو تفكر تنشر.
        </p>

        <Reveal stagger className="azu-rh-typegrid">
            {JOURNAL_TYPES.map(t => <div key={t.en} className="azu-rh-type">
                <span className="azu-rh-type-ar" dir="rtl">{t.ar}</span>
                <span className="azu-rh-type-en">{t.en}</span>
                <p className="azu-rh-type-text" dir="rtl">{t.text}</p>
            </div>)}
        </Reveal>

        <div className="azu-rh-head">
            <div className="azu-kicker">BEFORE YOU SUBMIT</div>
            <h2 className="azu-title">قبل ما تبعت بحثك لمجلة</h2>
            <p className="azu-lead" dir="rtl">سبع أسئلة بتفرق بين مجلة محكمة ومجلة مفترسة.</p>
        </div>
        <div className="azu-rh-checks">
            {JOURNAL_CHECKS.map((c, i) => <div key={c.q} className="azu-rh-check">
                <span className="azu-rh-check-n"><Icon name="check" size={13} /></span>
                <div>
                    <div className="azu-rh-check-q" dir="rtl">{i + 1}. {c.q}</div>
                    <p className="azu-rh-check-a" dir="rtl">{c.a}</p>
                </div>
            </div>)}
        </div>

        <div className="azu-rh-head">
            <div className="azu-kicker">VERIFY</div>
            <h2 className="azu-title">أدوات التحقق</h2>
            <p className="azu-lead" dir="rtl">أدلة وفهارس تتأكد بيها من المجلة قبل النشر.</p>
        </div>
        <Reveal stagger className="azu-rh-resgrid">{indexes.map(r => <ResCard key={r.id} r={r} withUses />)}</Reveal>

        <div className="azu-rh-head">
            <div className="azu-kicker">PUBLISHERS</div>
            <h2 className="azu-title">دوريات وناشرون</h2>
            <p className="azu-lead" dir="rtl">منصات الناشرين العلميين. الملخصات غالبًا متاحة والنص الكامل بيتطلب اشتراك أو وصول من الجامعة.</p>
        </div>
        <Reveal stagger className="azu-rh-resgrid">{publishers.map(r => <ResCard key={r.id} r={r} />)}</Reveal>
    </section>;
}

/* ---------- 6. Discipline ---------- */

const KIND_ORDER: ResKind[] = ['database', 'repository', 'data', 'publisher', 'tool', 'index', 'course', 'opportunity'];

export function ResearchDiscipline({ disc }: { disc: Discipline }) {
    const mine = RESOURCES.filter(r => r.disc.includes(disc.id));
    return <section className="azu-section azu-flow">
        <Crumb items={[{ label: 'Home', to: '/' }, { label: 'Research', to: '/research' }, { label: 'Scientific Resources', to: '/research/resources' }, { label: disc.ar }]} />
        <div className="azu-rh-dishero">
            <span className="azu-rh-dishero-icon"><Icon name={disc.icon} size={30} /></span>
            <div>
                <div className="azu-rh-dishero-ar" dir="rtl">{disc.ar}</div>
                <div className="azu-rh-dishero-en">{disc.en}</div>
                <p className="azu-rh-dishero-text" dir="rtl">{disc.blurb}</p>
            </div>
        </div>

        {KIND_ORDER.map(k => {
            const items = mine.filter(r => r.kind === k);
            if (!items.length) return null;
            return <div key={k} className="azu-block">
                <div className="azu-minihead" dir="rtl">{KIND_LABEL[k].ar}</div>
                <Reveal stagger className="azu-rh-resgrid">{items.map(r => <ResCard key={r.id} r={r} withUses />)}</Reveal>
            </div>;
        })}

        <div className="azu-block">
            <div className="azu-minihead" dir="rtl">أدوات ومسارات تفيدك في أي تخصص</div>
            <Reveal stagger className="azu-rh-resgrid">
                {['google-scholar', 'zotero', 'overleaf', 'inasp'].map(id => resourceById(id)).filter((r): r is Resource => !!r).map(r => <ResCard key={r.id} r={r} />)}
            </Reveal>
        </div>

        <div className="azu-backrow">
            <Link to="/research/resources" className="azu-btn azu-btn-outline"><Icon name="back" size={15} /> كل المصادر</Link>
            <Link to="/research" className="azu-btn azu-btn-outline"><Icon name="back" size={15} /> Research Hub</Link>
        </div>
    </section>;
}
