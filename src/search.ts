import { DEPARTMENTS, PROGRAMS, SOFTWARE, SOFTWARE_DISCIPLINES, FACULTIES, YEAR_NAMES, TERM_NAMES } from './data';
import { BYLAW } from './bylaw';

export type SearchItem = { g: string; t: string; s?: string; to: string; k: string };

export const normAr = (s: string) => s.toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ').trim();

const GROUPS = ['المواد الدراسية', 'الأقسام', 'البرامج المتميزة', 'البرامج العلمية', 'الكليات', 'الصفحات'] as const;
export const SEARCH_GROUP_ORDER: string[] = [...GROUPS];

export const SEARCH_ITEMS: SearchItem[] = (() => {
    const items: SearchItem[] = [];
    const push = (g: string, t: string, s: string | undefined, to: string, extra = '') =>
        items.push({ g, t, s, to, k: normAr(`${t} ${s ?? ''} ${extra}`) });

    for (const f of FACULTIES) push('الكليات', `علوم ${f.ar.split(' ')[1]} — ${f.city}`, f.en, `/academic/${f.id}`, 'كلية علوم');

    for (const d of DEPARTMENTS) {
        push('الأقسام', d.ar, d.en, `/academic/boys-cairo/basic/${d.id}`, `قسم ${d.ar}`);
        for (const y of [1, 2, 3, 4]) {
            const tracks = BYLAW[d.id]?.[y] ?? [];
            tracks.forEach((tr, ti) => {
                for (const term of [1, 2]) {
                    const courses = term === 1 ? tr.t1 : tr.t2;
                    courses.forEach((c, ci) => {
                        const sub = `${d.ar} — ${YEAR_NAMES[y]} — ${TERM_NAMES[term]}${tracks.length > 1 ? ` — شعبة ${tr.track}` : ''}`;
                        const cbase = tracks.length > 1
                            ? `/academic/boys-cairo/basic/${d.id}/year/${y}/track/${ti}/term/${term}`
                            : `/academic/boys-cairo/basic/${d.id}/year/${y}/term/${term}`;
                        push('المواد الدراسية', c[1], [c[0], sub].filter(Boolean).join(' · '),
                            `${cbase}/course/${ci}`,
                            `مادة ${c[0] ?? ''}`);
                    });
                }
            });
        }
    }

    for (const p of PROGRAMS) push('البرامج المتميزة', p.ar, p.en, `/academic/boys-cairo/special/${p.id}`, 'برنامج');
    for (const s of SOFTWARE) push('البرامج العلمية', s.name, SOFTWARE_DISCIPLINES.find(d => d.id === s.disc)?.ar, `/tools/software/${s.id}`, 'برنامج علمي software');

    push('الصفحات', 'الحاسبة الأكاديمية', 'حساب المعدل الفصلي والتراكمي وحاسبة الهدف', '/tools/calculator', 'GPA معدل حسابة');
    push('الصفحات', 'مكتبة البرامج العلمية', 'دليل البرامج لكل تخصص', '/tools/software', 'software hub');
    push('الصفحات', 'أدوات الطالب', undefined, '/tools', 'tools');
    push('الصفحات', 'الدليل الأكاديمي', 'الكليات والأقسام والمواد', '/academic', 'academic');
    push('الصفحات', 'البحث العلمي', undefined, '/research', 'research');
    push('الصفحات', 'الفرص والمنح', undefined, '/opportunities', 'opportunities تدريب منح');
    push('الصفحات', 'الأخبار والإعلانات', undefined, '/news', 'news اخبار');
    push('الصفحات', 'المجتمع الطلابي', undefined, '/community', 'community');
    push('الصفحات', 'عن المنصة', 'من نحن', '/about', 'about');
    push('الصفحات', 'الأسئلة الشائعة', undefined, '/faq', 'faq اسئلة');
    push('الصفحات', 'تواصل معنا', undefined, '/contact', 'contact');
    push('الصفحات', 'الإبلاغ عن مشكلة', undefined, '/report', 'report مشكلة بلاغ');
    push('الصفحات', 'تسجيل الدخول', undefined, '/signin', 'sign in login دخول');

    return items;
})();

export function searchAll(query: string): SearchItem[] {
    const tokens = normAr(query).split(' ').filter(Boolean);
    if (!tokens.length) return [];
    return SEARCH_ITEMS.filter(i => tokens.every(t => i.k.includes(t)));
}
