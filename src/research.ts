/* Research Hub — content model.
   Every platform here was checked against its live page before it went in;
   access type and level are a plain reading of what the site itself offers,
   not a guess. Sources are the official home pages. */

export type ResLevel = 'beginner' | 'intermediate' | 'advanced';
export type ResAccess = 'free' | 'subscription';
export type ResKind = 'database' | 'repository' | 'publisher' | 'data' | 'tool' | 'course' | 'index' | 'opportunity';

export const ACCESS_LABEL: Record<ResAccess, { ar: string; en: string; cls: string }> = {
    free: { ar: 'مجاني', en: 'Free', cls: 'is-free' },
    subscription: { ar: 'اشتراك', en: 'Subscription', cls: 'is-sub' },
};

export const LEVEL_LABEL: Record<ResLevel, { ar: string; en: string; cls: string }> = {
    beginner: { ar: 'مبتدئ', en: 'Beginner', cls: 'is-l1' },
    intermediate: { ar: 'متوسط', en: 'Intermediate', cls: 'is-l2' },
    advanced: { ar: 'متقدم', en: 'Advanced', cls: 'is-l3' },
};

export const KIND_LABEL: Record<ResKind, { ar: string; en: string; cls: string; icon: string }> = {
    database: { ar: 'قاعدة بيانات', en: 'Database', cls: 'is-k-db', icon: 'database' },
    repository: { ar: 'مستودع أبحاث', en: 'Repository', cls: 'is-k-rep', icon: 'books' },
    publisher: { ar: 'دوريات وناشر', en: 'Journal / Publisher', cls: 'is-k-pub', icon: 'journal' },
    data: { ar: 'بيانات ومجموعات', en: 'Data', cls: 'is-k-data', icon: 'globe' },
    tool: { ar: 'أداة بحثية', en: 'Tool', cls: 'is-k-tool', icon: 'code' },
    course: { ar: 'كورس تعليمي', en: 'Course', cls: 'is-k-course', icon: 'cap' },
    index: { ar: 'دليل وفهرس', en: 'Index / Guide', cls: 'is-k-index', icon: 'shield' },
    opportunity: { ar: 'منح وفرص', en: 'Funding', cls: 'is-k-opp', icon: 'briefcase' },
};

export type Discipline = { id: string; ar: string; en: string; icon: string; blurb: string };

export const RESEARCH_DISCIPLINES: Discipline[] = [
    { id: 'physics', ar: 'الفيزياء', en: 'Physics', icon: 'atom', blurb: 'أبحاث الفيزياء، فيزياء الجسيمات، والقياسات والمعايير الفيزيائية.' },
    { id: 'math', ar: 'الرياضيات', en: 'Mathematics', icon: 'sigma', blurb: 'أبحاث الرياضيات وفهارس المراجعات الرياضية.' },
    { id: 'chemistry', ar: 'الكيمياء', en: 'Chemistry', icon: 'flask', blurb: 'المركبات وخواصها، قواعد البيانات الكيميائية، ودوريات الكيمياء.' },
    { id: 'biology', ar: 'الأحياء', en: 'Biology', icon: 'dna', blurb: 'الأبحاث الحيوية والطبية، الجينوم، وقواعد البيانات الحيوية.' },
    { id: 'botany', ar: 'النبات', en: 'Botany', icon: 'leaf', blurb: 'أسماء النباتات وتصنيفها، وبيانات التنوع النباتي.' },
    { id: 'zoology', ar: 'الحيوان', en: 'Zoology', icon: 'paw', blurb: 'بيانات التنوع الحيواني، التصنيف، والمجموعات العلمية.' },
    { id: 'astro', ar: 'الفلك والأرصاد', en: 'Astronomy & Meteorology', icon: 'planet', blurb: 'الأجرام والبيانات الفلكية، وبيانات الطقس والمناخ.' },
    { id: 'cs', ar: 'علوم الحاسب', en: 'Computer Science', icon: 'chip', blurb: 'أبحاث الحوسبة والبرمجيات والشبكات.' },
    { id: 'ai', ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence', icon: 'brain', blurb: 'أبحاث الذكاء الاصطناعي، النماذج المفتوحة، ومجموعات البيانات.' },
];

export const discById = (id: string) => RESEARCH_DISCIPLINES.find(d => d.id === id);
export const discAr = (id: string) => discById(id)?.ar ?? id;

export type Resource = {
    id: string;
    name: string;
    ar: string;
    url: string;
    kind: ResKind;
    access: ResAccess;
    level: ResLevel;
    disc: string[];
    about: string;
    uses: string[];
    note?: string;
};

export const RESOURCES: Resource[] = [
    /* ---------- Physics ---------- */
    {
        id: 'arxiv-physics', name: 'arXiv Physics', ar: 'أرشيف الفيزياء', url: 'https://arxiv.org/archive/physics',
        kind: 'repository', access: 'free', level: 'advanced', disc: ['physics'],
        about: 'مستودع مفتوح لمسودات الأبحاث (Preprints) في فروع الفيزياء. الأوراق اللي فيه لسه ما خدتش تحكيم علمي كامل، فخدها كمصدر أولي مش كحقيقة نهائية.',
        uses: ['الوصول لأحدث الأبحاث قبل نشرها في الدوريات', 'متابعة التطورات في فروع الفيزياء المختلفة', 'قراءة مسودة بحث ومناقشتها مع المشرف'],
    },
    {
        id: 'inspire-hep', name: 'INSPIRE-HEP', ar: 'قاعدة فيزياء الجسيمات', url: 'https://inspirehep.net/',
        kind: 'database', access: 'free', level: 'advanced', disc: ['physics'],
        about: 'قاعدة بيانات متخصصة في فيزياء الجسيمات والطاقة العالية: أبحاث، باحثون، اقتباسات، ومؤتمرات.',
        uses: ['البحث في أبحاث فيزياء الجسيمات', 'معرفة الأبحاث الأكثر اقتباسًا في موضوع معين', 'متابعة باحث أو مجموعة بحثية'],
    },
    {
        id: 'nist-pml', name: 'NIST Physical Measurement Laboratory', ar: 'معمل القياسات الفيزيائية — NIST', url: 'https://www.nist.gov/pml',
        kind: 'data', access: 'free', level: 'intermediate', disc: ['physics'],
        about: 'بيانات مرجعية للقياسات والمعايير الفيزيائية والثوابت من المعهد الوطني الأمريكي للمعايير والتقنية.',
        uses: ['الحصول على قيم مرجعية للثوابت الفيزيائية', 'بيانات الخواص والقياسات الدقيقة', 'مرجع للمعايرة في التجارب العملية'],
    },

    /* ---------- Mathematics ---------- */
    {
        id: 'zbmath', name: 'zbMATH Open', ar: 'فهرس الرياضيات zbMATH', url: 'https://zbmath.org/',
        kind: 'database', access: 'free', level: 'advanced', disc: ['math'],
        about: 'فهرس رياضي يضم مراجعات وملخصات لأبحاث الرياضيات، مع بحث بالموضوع والمؤلف والتصنيف.',
        uses: ['البحث عن الدراسات السابقة في موضوع رياضي', 'قراءة مراجعات مختصرة قبل قراءة البحث كامل', 'متابعة موضوعات رياضية متخصصة'],
    },
    {
        id: 'arxiv-math', name: 'arXiv Mathematics', ar: 'أرشيف الرياضيات', url: 'https://arxiv.org/archive/math',
        kind: 'repository', access: 'free', level: 'advanced', disc: ['math'],
        about: 'مسودات أبحاث الرياضيات على arXiv، مفتوحة للقراءة والتحميل.',
        uses: ['متابعة الأبحاث الرياضية الحديثة', 'الوصول لمسودات قبل النشر الرسمي', 'البحث في فروع الرياضيات المختلفة'],
    },
    {
        id: 'mathscinet', name: 'MathSciNet', ar: 'MathSciNet', url: 'https://mathscinet.ams.org/',
        kind: 'database', access: 'subscription', level: 'advanced', disc: ['math'],
        about: 'قاعدة المراجعات الرياضية من الجمعية الأمريكية للرياضيات. الوصول إليها عادةً بيكون من خلال اشتراك الجامعة.',
        uses: ['مراجعات تفصيلية لأبحاث الرياضيات', 'تتبع الاقتباسات في الرياضيات', 'البحث المتقدم بالمؤلف والتصنيف'],
    },

    /* ---------- Chemistry ---------- */
    {
        id: 'pubchem', name: 'PubChem', ar: 'قاعدة المركبات PubChem', url: 'https://pubchem.ncbi.nlm.nih.gov/',
        kind: 'database', access: 'free', level: 'beginner', disc: ['chemistry'],
        about: 'قاعدة بيانات للمركبات الكيميائية: البنية، الخواص، بيانات السلامة، والروابط الحيوية.',
        uses: ['البحث عن مركب كيميائي وخصائصه', 'معرفة التركيب والبنية الجزيئية', 'الاطلاع على بيانات السلامة والتعامل الآمن'],
    },
    {
        id: 'chemspider', name: 'ChemSpider', ar: 'ChemSpider', url: 'https://www.chemspider.com/',
        kind: 'database', access: 'free', level: 'intermediate', disc: ['chemistry'],
        about: 'قاعدة بيانات كيميائية من الجمعية الملكية للكيمياء (RSC) بتجمع معلومات المركبات من مصادر متعددة.',
        uses: ['ربط المركبات بمصادر بيانات مختلفة', 'البحث بالبنية الكيميائية', 'مقارنة معلومات نفس المركب من أكتر من مصدر'],
    },
    {
        id: 'rsc-pubs', name: 'RSC Publishing', ar: 'دوريات الجمعية الملكية للكيمياء', url: 'https://pubs.rsc.org/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: ['chemistry'],
        about: 'دوريات الجمعية الملكية للكيمياء. جزء من المقالات مفتوح الوصول، وجزء بيتطلب اشتراك.',
        uses: ['الوصول لأبحاث الكيمياء المنشورة', 'قراءة ملخصات الأبحاث مجانًا', 'متابعة إرشادات النشر في دوريات الكيمياء'],
    },

    /* ---------- Biology ---------- */
    {
        id: 'pubmed', name: 'PubMed', ar: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/',
        kind: 'database', access: 'free', level: 'beginner', disc: ['biology'],
        about: 'أكبر فهرس للأبحاث الطبية والحيوية، بملخصات وروابط للنص الكامل لما يكون متاح.',
        uses: ['البحث في الأبحاث الحيوية والطبية', 'قراءة ملخصات الدراسات السابقة', 'الوصول للنص الكامل من المصدر الأصلي'],
    },
    {
        id: 'ncbi', name: 'NCBI', ar: 'المركز الوطني لمعلومات التقنية الحيوية', url: 'https://www.ncbi.nlm.nih.gov/',
        kind: 'database', access: 'free', level: 'intermediate', disc: ['biology', 'zoology'],
        about: 'مجموعة قواعد بيانات حيوية: الجينوم، التسلسلات، البروتينات، والمقالات العلمية.',
        uses: ['البحث في قواعد البيانات الجينية', 'تنزيل تسلسلات وبيانات حيوية', 'دراسة الخلايا والجزيئات والأنظمة الحيوية'],
    },
    {
        id: 'europepmc', name: 'Europe PMC', ar: 'Europe PMC', url: 'https://europepmc.org/',
        kind: 'database', access: 'free', level: 'intermediate', disc: ['biology'],
        about: 'فهرس أوروبي للأبحاث الحيوية والطبية، بيدّي نصوص كاملة مفتوحة لملايين المقالات.',
        uses: ['الوصول لنصوص كاملة مفتوحة', 'البحث في الأدبيات الحيوية والطبية', 'الوصول لدراسات سابقة بسرعة'],
    },

    /* ---------- Botany ---------- */
    {
        id: 'powo', name: 'Plants of the World Online', ar: 'نباتات العالم على الإنترنت', url: 'https://powo.science.kew.org/',
        kind: 'database', access: 'free', level: 'beginner', disc: ['botany'],
        about: 'قاعدة الحدائق النباتية الملكية في كيو (Kew) لأسماء النباتات وتوزيعها وحالتها التصنيفية.',
        uses: ['التعرف على الأنواع النباتية وتصنيفها', 'معرفة الاسم العلمي المقبول للنبات', 'بيانات الانتشار الجغرافي'],
    },
    {
        id: 'gbif', name: 'GBIF', ar: 'شبكة معلومات التنوع الحيوي', url: 'https://www.gbif.org/',
        kind: 'data', access: 'free', level: 'intermediate', disc: ['botany', 'zoology'],
        about: 'شبكة عالمية لبيانات التنوع الحيوي: سجلات تواجد الأنواع حول العالم، مفتوحة للبحث والتحميل.',
        uses: ['بيانات انتشار الأنواع جغرافيًا', 'تحليل التنوع الحيوي في منطقة معينة', 'تحميل سجلات تواجد لمشروع بحثي'],
    },
    {
        id: 'ipni', name: 'IPNI', ar: 'الفهرس الدولي لأسماء النباتات', url: 'https://www.ipni.org/',
        kind: 'database', access: 'free', level: 'advanced', disc: ['botany'],
        about: 'الفهرس الدولي لأسماء النباتات: المرجع لأسماء النباتات المنشورة ومصدر كل اسم.',
        uses: ['التحقق من صحة اسم علمي', 'معرفة مصدر نشر اسم نبات', 'حل الالتباس بين الأسماء المرادفة'],
    },

    /* ---------- Zoology ---------- */
    {
        id: 'smithsonian', name: 'Smithsonian Institution', ar: 'مؤسسة سميثسونيان', url: 'https://www.si.edu/',
        kind: 'database', access: 'free', level: 'beginner', disc: ['zoology'],
        about: 'مجموعات ومتاحف ومصادر علمية من مؤسسة سميثسونيان، ومنها مجموعات التاريخ الطبيعي.',
        uses: ['الاطلاع على مجموعات علمية موثقة', 'مصادر للتصنيف والوصف الحيواني', 'مواد تعليمية ومتحفية'],
    },

    /* ---------- Astronomy & Meteorology ---------- */
    {
        id: 'nasa-ads', name: 'NASA ADS', ar: 'نظام بيانات الفيزياء الفلكية', url: 'https://ui.adsabs.harvard.edu/',
        kind: 'database', access: 'free', level: 'advanced', disc: ['astro'],
        about: 'نظام بيانات الفيزياء الفلكية من ناسا: أبحاث، اقتباسات، وبيانات فلكية. بيحتاج حساب مجاني.',
        note: 'مجاني، لكن بيتطلب إنشاء حساب مجاني.',
        uses: ['البحث في الأبحاث الفلكية', 'تتبع الاقتباسات في موضوع فلكي', 'الوصول لبيانات ومصادر فلكية'],
    },
    {
        id: 'simbad', name: 'SIMBAD', ar: 'قاعدة الأجرام الفلكية', url: 'https://simbad.cds.unistra.fr/',
        kind: 'database', access: 'free', level: 'intermediate', disc: ['astro'],
        about: 'قاعدة بيانات فلكية للأجرام السماوية: التعريف، الإحداثيات، والبيانات الرصدية.',
        uses: ['معرفة بيانات جرم سماوي', 'الحصول على إحداثيات وبيانات رصدية', 'ربط الأجرام بالأبحاث المنشورة عنها'],
    },
    {
        id: 'noaa-ncei', name: 'NOAA NCEI', ar: 'مركز معلومات البيئة NOAA', url: 'https://www.ncei.noaa.gov/',
        kind: 'data', access: 'free', level: 'intermediate', disc: ['astro'],
        about: 'المركز الوطني الأمريكي للمعلومات البيئية: بيانات الطقس والمناخ والمحيطات.',
        uses: ['بيانات طقس ومناخ تاريخية', 'تحليل اتجاهات مناخية', 'تنزيل بيانات لدراسة أو مشروع'],
    },
    {
        id: 'copernicus-cds', name: 'Copernicus Climate Data Store', ar: 'مخزن بيانات المناخ — كوبرنيكوس', url: 'https://cds.climate.copernicus.eu/',
        kind: 'data', access: 'free', level: 'advanced', disc: ['astro'],
        about: 'بيانات مناخية عالمية من برنامج كوبرنيكوس الأوروبي، مع أدوات تحليل. بيحتاج حساب مجاني.',
        note: 'مجاني، لكن بيتطلب إنشاء حساب مجاني.',
        uses: ['بيانات مناخية عالمية موثوقة', 'تحليل متغيرات مناخية على فترات زمنية', 'استخدام أدوات المعالجة والرسم'],
    },

    /* ---------- Computer Science ---------- */
    {
        id: 'acm-dl', name: 'ACM Digital Library', ar: 'مكتبة ACM الرقمية', url: 'https://dl.acm.org/',
        kind: 'database', access: 'subscription', level: 'advanced', disc: ['cs'],
        about: 'مكتبة جمعية آلات الحوسبة ACM: أبحاث علوم الحاسب وأوراق المؤتمرات.',
        uses: ['أبحاث هندسة البرمجيات والحوسبة', 'أوراق المؤتمرات المتخصصة', 'متابعة تطورات مجال معين'],
    },
    {
        id: 'ieee-xplore', name: 'IEEE Xplore', ar: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org/',
        kind: 'database', access: 'subscription', level: 'advanced', disc: ['cs'],
        about: 'أبحاث IEEE في الهندسة والحوسبة والشبكات. الملخصات متاحة للتصفح، والنص الكامل غالبًا باشتراك.',
        uses: ['أبحاث الشبكات وهندسة الحاسب', 'أوراق المؤتمرات في التخصص', 'متابعة الأبحاث التقنية الحديثة'],
    },
    {
        id: 'dblp', name: 'DBLP', ar: 'فهرس منشورات علوم الحاسب', url: 'https://dblp.org/',
        kind: 'database', access: 'free', level: 'intermediate', disc: ['cs'],
        about: 'فهرس مفتوح لمنشورات علوم الحاسب: مؤلفون، مؤتمرات، ودوريات.',
        uses: ['معرفة منشورات باحث معين', 'معرفة أهم مؤتمرات مجال ما', 'تتبع سلسلة أبحاث في موضوع'],
    },

    /* ---------- Artificial Intelligence ---------- */
    {
        id: 'arxiv-ai', name: 'arXiv cs.AI', ar: 'أحدث أبحاث الذكاء الاصطناعي', url: 'https://arxiv.org/list/cs.AI/recent',
        kind: 'repository', access: 'free', level: 'advanced', disc: ['ai'],
        about: 'أحدث مسودات أبحاث الذكاء الاصطناعي على arXiv، مرتبة بتاريخ الإضافة.',
        uses: ['متابعة أبحاث الذكاء الاصطناعي اليومية', 'اختيار موضوع بحثي حديث', 'قراءة مسودات قبل النشر'],
    },
    {
        id: 'huggingface', name: 'Hugging Face', ar: 'منصة النماذج المفتوحة', url: 'https://huggingface.co/',
        kind: 'repository', access: 'free', level: 'intermediate', disc: ['ai'],
        about: 'منصة للنماذج ومجموعات البيانات والأكواد المفتوحة في تعلم الآلة. التصفح متاح، والتحميل والاستخدام بيحتاجوا حساب مجاني.',
        note: 'مجاني، لكن بيتطلب إنشاء حساب مجاني.',
        uses: ['تنزيل نماذج جاهزة للتجربة', 'الوصول لمجموعات بيانات', 'معرفة الأكواد والتطبيقات البحثية'],
    },
    {
        id: 'hf-papers', name: 'Hugging Face Papers', ar: 'الأوراق الرائجة في الذكاء الاصطناعي', url: 'https://huggingface.co/papers',
        kind: 'database', access: 'free', level: 'advanced', disc: ['ai'],
        about: 'الأوراق البحثية الرائجة في الذكاء الاصطناعي كل يوم.',
        uses: ['معرفة أبحاث الذكاء الاصطناعي اللي بتاخد اهتمام', 'اختيار قراءات حديثة', 'ربط الورقة بنموذج أو كود متاح'],
        note: 'موقع Papers with Code اتدمج في Hugging Face Papers، والرابط القديم paperswithcode.com بيحوّل هنا.',
    },

    /* ---------- Research tools ---------- */
    {
        id: 'google-scholar', name: 'Google Scholar', ar: 'جوجل سكولار', url: 'https://scholar.google.com/',
        kind: 'tool', access: 'free', level: 'beginner', disc: [],
        about: 'محرك بحث عن الأبحاث والدراسات العلمية، وبيوريك مين اقتبس كل بحث.',
        uses: ['البحث عن أبحاث بموضوع أو مؤلف', 'معرفة الأبحاث الأكثر اقتباسًا', 'الوصول لنسخة متاحة من الورقة'],
    },
    {
        id: 'semantic-scholar', name: 'Semantic Scholar', ar: 'Semantic Scholar', url: 'https://www.semanticscholar.org/',
        kind: 'tool', access: 'free', level: 'intermediate', disc: [],
        about: 'محرك بحث بيفهم محتوى الأبحاث وبيوضح العلاقات والاقتباسات بينها.',
        uses: ['اكتشاف أبحاث مرتبطة بموضوعك', 'فهم العلاقات بين الأوراق', 'قراءة ملخصات مركزة'],
    },
    {
        id: 'zotero', name: 'Zotero', ar: 'زوتيرو لإدارة المراجع', url: 'https://www.zotero.org/',
        kind: 'tool', access: 'free', level: 'beginner', disc: [],
        about: 'برنامج مجاني مفتوح المصدر لإدارة المراجع وتنظيم الاقتباسات، وبيشتغل مع Word وGoogle Docs.',
        uses: ['تجميع مراجع البحث في مكان واحد', 'توليد الاستشهادات وقائمة المراجع تلقائيًا', 'تنظيم ملفات PDF بالملاحظات'],
    },
    {
        id: 'crossref', name: 'Crossref', ar: 'كروس ريف', url: 'https://www.crossref.org/',
        kind: 'tool', access: 'free', level: 'intermediate', disc: [],
        about: 'بيانات المنشورات العلمية ومعرّفات DOI الرسمية.',
        uses: ['التأكد من بيانات مرجع (DOI)', 'معرفة بيانات نشر ورقة بدقة', 'ربط المراجع بمصادرها الأصلية'],
    },
    {
        id: 'orcid', name: 'ORCID', ar: 'أوركيد — الهوية البحثية', url: 'https://orcid.org/',
        kind: 'tool', access: 'free', level: 'intermediate', disc: [],
        about: 'معرّف رقمي دائم للباحث، بيميزك عن أي باحث تاني بنفس الاسم.',
        note: 'مجاني، لكن بيتطلب إنشاء حساب مجاني.',
        uses: ['إنشاء هوية بحثية رقمية', 'ربط أبحاثك باسمك الصحيح', 'استخدامه في التقديم للمنح والدوريات'],
    },
    {
        id: 'overleaf', name: 'Overleaf', ar: 'أوفرليف لكتابة الأبحاث', url: 'https://www.overleaf.com/',
        kind: 'tool', access: 'free', level: 'beginner', disc: [],
        about: 'محرر LaTeX على المتصفح، من غير تنزيل برامج. الخطة المجانية كافية للبداية والمزايا المتقدمة باشتراك.',
        uses: ['كتابة بحث بصيغة علمية منظمة', 'استخدام قوالب جاهزة للدوريات', 'العمل على نفس الملف مع فريق'],
    },
    {
        id: 'colab', name: 'Google Colab', ar: 'كولاب لتحليل البيانات', url: 'https://colab.research.google.com/',
        kind: 'tool', access: 'free', level: 'intermediate', disc: ['cs', 'ai'],
        about: 'دفاتر Python على السحابة لتحليل البيانات وتشغيل نماذج تعلّم الآلة من غير تجهيز جهازك.',
        uses: ['تحليل بيانات تجربة أو استبيان', 'رسم النتائج', 'تجربة أكواد ونماذج جاهزة'],
    },
    {
        id: 'datawrapper', name: 'Datawrapper', ar: 'داتا رابر للرسوم البيانية', url: 'https://www.datawrapper.de/',
        kind: 'tool', access: 'free', level: 'beginner', disc: [],
        about: 'أداة لعمل رسوم بيانية واضحة قابلة للنشر. الاستخدام الأساسي مجاني.',
        uses: ['تحويل جدول أرقام لرسم بياني واضح', 'عرض النتائج بشكل مفهوم', 'تصدير الرسم لصورة أو صفحة'],
    },
    {
        id: 'connected-papers', name: 'Connected Papers', ar: 'خريطة الأوراق المرتبطة', url: 'https://www.connectedpapers.com/',
        kind: 'tool', access: 'free', level: 'intermediate', disc: [],
        about: 'خريطة بصرية للأوراق المرتبطة بورقة بحثية، مفيدة في مراجعة الأدبيات. الاستخدام المجاني محدود بعدد الخرائط شهريًا.',
        uses: ['معرفة الأوراق المرتبطة بموضوعك', 'تكوين صورة سريعة عن مجال بحث', 'اكتشاف دراسات مشابهة'],
    },

    {
        id: 'chemrxiv', name: 'ChemRxiv', ar: 'مستودع الكيمياء للنسخ الأولية', url: 'https://chemrxiv.org/',
        kind: 'repository', access: 'free', level: 'intermediate', disc: ['chemistry'],
        about: 'مستودع مجاني للنسخ الأولية (preprints) في الكيمياء بكل فروعها، قبل ما تتنشر في الدوريات.',
        uses: ['قراءة أحدث أبحاث الكيمياء قبل النشر', 'نشر نسختك الأولية', 'تصفح حسب الفرع'],
    },
    {
        id: 'biorxiv', name: 'bioRxiv', ar: 'مستودع الأحياء للنسخ الأولية', url: 'https://www.biorxiv.org/',
        kind: 'repository', access: 'free', level: 'intermediate', disc: ['biology', 'botany', 'zoology'],
        about: 'مستودع للنسخ الأولية في علوم الحياة، فيه أقسام للأحياء والنبات وعلم الحيوان. النسخ الأولية لم تراجَع بعد من محكمين.',
        uses: ['متابعة أحدث أبحاث الأحياء', 'تصفح حسب القسم', 'نشر نسخة أولية'],
    },
    {
        id: 'arxiv-astro', name: 'arXiv Astrophysics', ar: 'أرشيف الفيزياء الفلكية في arXiv', url: 'https://arxiv.org/archive/astro-ph',
        kind: 'repository', access: 'free', level: 'intermediate', disc: ['astro'],
        about: 'أرشيف مفتوح لأبحاث الفيزياء الفلكية من 1992، مع قوائم الجديد والشهري.',
        uses: ['متابعة الأبحاث الجديدة يوميًا', 'تصفح أبحاث شهر معين', 'قراءة النص الكامل مجانًا'],
    },
    {
        id: 'arxiv-cs', name: 'arXiv Computer Science', ar: 'أرشيف علوم الحاسب في arXiv', url: 'https://arxiv.org/archive/cs',
        kind: 'repository', access: 'free', level: 'intermediate', disc: ['cs'],
        about: 'أرشيف مفتوح لأبحاث علوم الحاسب من 1993، مع قوائم الجديد والشهري.',
        uses: ['متابعة الأبحاث الجديدة', 'تصفح أبحاث شهر معين', 'قراءة النص الكامل مجانًا'],
    },
    {
        id: 'lmfdb', name: 'LMFDB', ar: 'قاعدة بيانات الدوال L والصيغ النمطية', url: 'https://www.lmfdb.org/',
        kind: 'data', access: 'free', level: 'advanced', disc: ['math'],
        about: 'قاعدة بيانات رياضية مفتوحة فيها المنحنيات الإهليلجية والصيغ النمطية والدوال L وكائنات أخرى في نظرية الأعداد.',
        uses: ['البحث عن منحنى أو صيغة نمطية', 'جمع بيانات لاختبار فرضية', 'استكشاف أمثلة'],
    },
    {
        id: 'nist-webbook', name: 'NIST Chemistry WebBook', ar: 'كتاب NIST للكيمياء', url: 'https://webbook.nist.gov/chemistry/',
        kind: 'data', access: 'free', level: 'intermediate', disc: ['chemistry'],
        about: 'بيانات كيميائية وفيزيائية مرجعية من المعهد الوطني الأمريكي للمعايير (قاعدة SRD 69): ديناميكا حرارية وأطياف وخواص.',
        uses: ['البحث بالاسم أو الصيغة', 'بيانات الأطياف والديناميكا الحرارية', 'قيم مرجعية موثوقة'],
    },
    {
        id: 'uniprot', name: 'UniProt', ar: 'قاعدة بيانات البروتينات', url: 'https://www.uniprot.org/',
        kind: 'data', access: 'free', level: 'advanced', disc: ['biology'],
        about: 'قاعدة بيانات مرجعية لتسلسلات ووظائف البروتينات.',
        uses: ['البحث عن بروتين وتسلسله ووظيفته', 'تحميل بيانات للتحليل', 'ربط البروتين بالمراجع'],
    },
    {
        id: 'uci-ml', name: 'UCI Machine Learning Repository', ar: 'مستودع جامعة كاليفورنيا لبيانات التعلم الآلي', url: 'https://archive.ics.uci.edu/',
        kind: 'data', access: 'free', level: 'beginner', disc: ['cs', 'ai'],
        about: 'مجموعات بيانات جاهزة لتجارب التعلم الآلي، من datasets كلاسيكية صغيرة لأكبر.',
        uses: ['تجارب تعلم آلي على بيانات جاهزة', 'تعلم التصنيف والانحدار', 'مقارنة نتائجك بمراجع'],
    },
    {
        id: 'plos-one', name: 'PLOS ONE', ar: 'دورية PLOS ONE مفتوحة الوصول', url: 'https://journals.plos.org/plosone/',
        kind: 'publisher', access: 'free', level: 'intermediate', disc: [],
        about: 'دورية محكّمة مفتوحة الوصول (Gold OA) في كل التخصصات العلمية. القراءة مجانية، لكن النشر فيها بيتطلب رسوم معالجة على الباحث.',
        uses: ['قراءة مقالات كاملة بدون اشتراك', 'أمثلة لشكل الورقة العلمية', 'نشر بحثك (برسوم)'],
    },
    /* ---------- Learning paths ---------- */
    {
        id: 'inasp', name: 'INASP Learn', ar: 'منصة INASP للبحث العلمي', url: 'https://learn.inasp.info/',
        kind: 'course', access: 'free', level: 'beginner', disc: [],
        about: 'دورات مجانية في مهارات البحث العلمي والنشر الأكاديمي.',
        uses: ['أساسيات البحث العلمي من الصفر', 'مهارات القراءة والكتابة الأكاديمية', 'التحضير للنشر'],
    },
    {
        id: 'coursera', name: 'Coursera', ar: 'كورسيرا', url: 'https://www.coursera.org/',
        kind: 'course', access: 'subscription', level: 'beginner', disc: [],
        about: 'دورات جامعية في مناهج البحث والتحليل. بعض الدورات مجانية للاستماع، والشهادة أو المحتوى الكامل غالبًا مدفوع.',
        uses: ['دورات في مناهج البحث', 'دورات في تحليل البيانات', 'متابعة مسار كامل بترتيب'],
    },
    {
        id: 'edraak', name: 'Edraak', ar: 'إدراك', url: 'https://www.edraak.org/',
        kind: 'course', access: 'free', level: 'beginner', disc: [],
        about: 'منصة عربية للتعليم المفتوح، فيها مسارات في البحث العلمي ومهارات الدراسة.',
        uses: ['تعلم بالعربي من غير حاجز اللغة', 'أساسيات البحث والكتابة', 'مهارات دراسة وتنظيم وقت'],
    },
    {
        id: 'rwaq', name: 'Rwaq', ar: 'رواق', url: 'https://www.rwaq.org/',
        kind: 'course', access: 'subscription', level: 'beginner', disc: [],
        about: 'منصة عربية للمقررات المفتوحة، فيها مقررات في مناهج البحث والكتابة الأكاديمية.',
        note: 'بعض المقررات مدفوعة (مقرر المهارات الأكاديمية مثلًا بسعر 34.5 ريال سعودي)، فاتأكد من صفحة المقرر قبل التسجيل.',
        uses: ['مقررات عربية في مناهج البحث', 'تدريب على الكتابة الأكاديمية', 'مقدمة في الإحصاء والتحليل'],
    },
    {
        id: 'daad-egypt', name: 'DAAD Egypt', ar: 'الهيئة الألمانية للتبادل العلمي — مصر', url: 'https://www.daad-egypt.org/',
        kind: 'opportunity', access: 'free', level: 'advanced', disc: [],
        about: 'منح وتمويل بحثي وفرص دراسة للباحثين المصريين من الهيئة الألمانية للتبادل العلمي.',
        uses: ['منح دراسية وبحثية', 'تمويل مشاريع بحثية', 'فرص تدريب وتبادل علمي'],
    },

    /* ---------- Arabic-language sources ---------- */
    {
        id: 'e-marefa', name: 'e-Marefa', ar: 'المعرفة — قاعدة البيانات العربية', url: 'https://www.e-marefa.net/',
        kind: 'database', access: 'subscription', level: 'intermediate', disc: [],
        about: 'قاعدة بيانات عربية للدوريات والمقالات المحكمة. الوصول عادةً بيكون من خلال اشتراك مؤسسي.',
        uses: ['أبحاث ومقالات محكمة بالعربي', 'البحث في الدوريات العربية', 'الاستشهاد بمصادر عربية موثوقة'],
    },
    {
        id: 'mandumah', name: 'Dar Almandumah', ar: 'دار المنظومة', url: 'https://mandumah.com/',
        kind: 'database', access: 'subscription', level: 'intermediate', disc: [],
        about: 'قواعد بيانات عربية للرسائل الجامعية والدوريات. الاشتراك غالبًا مؤسسي.',
        uses: ['الرسائل الجامعية العربية', 'الدوريات العلمية العربية', 'البحث بالموضوع أو الباحث'],
    },
    {
        id: 'almanhal', name: 'Al Manhal', ar: 'المنهل', url: 'https://www.almanhal.com/',
        kind: 'database', access: 'subscription', level: 'intermediate', disc: [],
        about: 'مكتبة رقمية عربية للكتب والدوريات والرسائل الجامعية.',
        uses: ['كتب ومراجع عربية', 'دوريات ورسائل جامعية', 'البحث داخل النصوص العربية'],
    },
    {
        id: 'sdl', name: 'Saudi Digital Library', ar: 'المكتبة الرقمية السعودية', url: 'https://sdl.edu.sa/',
        kind: 'database', access: 'subscription', level: 'intermediate', disc: [],
        about: 'مكتبة رقمية بمصادر عربية وأجنبية، متاحة غالبًا من خلال الجامعات المشتركة فيها.',
        uses: ['مصادر عربية وأجنبية في مكان واحد', 'الوصول عبر اشتراك الجامعة', 'دوريات وقواعد بيانات متعددة'],
    },

    /* ---------- Journal guidance and indexes ---------- */
    {
        id: 'doaj', name: 'DOAJ', ar: 'دليل الدوريات مفتوحة الوصول', url: 'https://doaj.org/',
        kind: 'index', access: 'free', level: 'beginner', disc: [],
        about: 'دليل الدوريات مفتوحة الوصول: تعرف منه المجلات المحكمة اللي بتتيح محتواها مجانًا.',
        uses: ['معرفة مجلة محكمة مفتوحة الوصول', 'النشر من غير رسوم', 'التحقق من سياسة الوصول المفتوح'],
    },
    {
        id: 'thinkchecksubmit', name: 'Think.Check.Submit.', ar: 'اتأكد قبل ما تبعت', url: 'https://thinkchecksubmit.org/',
        kind: 'index', access: 'free', level: 'beginner', disc: [],
        about: 'قائمة أسئلة بسيطة تتأكد بيها إن المجلة اللي هتنشر فيها موثوقة قبل ما تبعت بحثك.',
        uses: ['التحقق من موثوقية مجلة', 'تجنب المجلات المفترسة', 'مراجعة المجلة قبل الإرسال'],
    },
    {
        id: 'cope', name: 'COPE', ar: 'لجنة أخلاقيات النشر', url: 'https://publicationethics.org/',
        kind: 'index', access: 'free', level: 'intermediate', disc: [],
        about: 'لجنة أخلاقيات النشر: إرشادات عن أخلاقيات البحث والتحكيم والنشر العلمي.',
        uses: ['معرفة قواعد أخلاقيات النشر', 'فهم عملية التحكيم', 'التعامل مع مشاكل التأليف والاقتباس'],
    },
    {
        id: 'mjl', name: 'Master Journal List', ar: 'قائمة المجلات — Clarivate', url: 'https://mjl.clarivate.com/',
        kind: 'index', access: 'free', level: 'intermediate', disc: [],
        about: 'قائمة المجلات المفهرسة في Web of Science، تفيدك تعرف إذا كانت المجلة معتمدة ومفهرسة.',
        uses: ['معرفة إذا كانت المجلة مفهرسة', 'مقارنة مجلات قبل النشر', 'التحقق من اسم المجلة الرسمي'],
    },

    /* ---------- Publishers ---------- */
    {
        id: 'nature', name: 'Nature', ar: 'نيتشر', url: 'https://www.nature.com/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: [],
        about: 'دوريات Nature العلمية في العلوم الطبيعية والحيوية. مقالات كثيرة باشتراك، وبعضها مفتوح الوصول.',
        uses: ['قراءة أبحاث عالية التأثير', 'متابعة أخبار العلم', 'معرفة أسلوب الكتابة العلمية'],
    },
    {
        id: 'science', name: 'Science (AAAS)', ar: 'مجلة ساينس', url: 'https://www.science.org/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: [],
        about: 'مجلة Science من الجمعية الأمريكية لتقدم العلوم. المحتوى الكامل باشتراك.',
        uses: ['أبحاث في كل فروع العلوم', 'أخبار وتقارير علمية', 'مراجع عالية التأثير'],
    },
    {
        id: 'acs', name: 'ACS Publications', ar: 'دوريات الجمعية الكيميائية الأمريكية', url: 'https://pubs.acs.org/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: ['chemistry'],
        about: 'دوريات الجمعية الكيميائية الأمريكية في الكيمياء وعلومها.',
        uses: ['أبحاث الكيمياء المنشورة', 'إرشادات النشر في الكيمياء', 'مراجعات متخصصة'],
    },
    {
        id: 'aps', name: 'APS Journals', ar: 'دوريات الجمعية الفيزيائية الأمريكية', url: 'https://journals.aps.org/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: ['physics'],
        about: 'دوريات الجمعية الفيزيائية الأمريكية، ومنها Physical Review.',
        uses: ['أبحاث الفيزياء الأساسية', 'مراجعات في الفيزياء', 'متابعة أبحاث فيزياء المادة المكثفة'],
    },
    {
        id: 'iop', name: 'IOPscience', ar: 'دوريات معهد الفيزياء', url: 'https://iopscience.iop.org/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: ['physics'],
        about: 'منصة دوريات معهد الفيزياء البريطاني (IOP).',
        uses: ['أبحاث في فروع الفيزياء التطبيقية', 'مصادر للفيزياء الفلكية والبيئية', 'إرشادات النشر'],
    },
    {
        id: 'sciencedirect', name: 'ScienceDirect (Elsevier)', ar: 'ساينس دايركت — إلزيفير', url: 'https://www.sciencedirect.com/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: [],
        about: 'منصة إلزيفير لأبحاث العلوم والهندسة والطب. الملخصات متاحة والنص الكامل باشتراك.',
        uses: ['البحث في ملايين المقالات', 'قراءة ملخصات مجانًا', 'الوصول الكامل عبر اشتراك الجامعة'],
    },
    {
        id: 'springer', name: 'SpringerLink', ar: 'سبرينجر لينك', url: 'https://link.springer.com/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: [],
        about: 'منصة سبرينجر للدوريات والكتب العلمية.',
        uses: ['دوريات وكتب في العلوم', 'فصول كتب مرجعية', 'ملخصات ومقدمات لموضوعات متخصصة'],
    },
    {
        id: 'wiley', name: 'Wiley Online Library', ar: 'وايلي أونلاين', url: 'https://onlinelibrary.wiley.com/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: [],
        about: 'دوريات وكتب وايلي في العلوم والهندسة والطب.',
        uses: ['أبحاث في تخصصات متعددة', 'كتب مرجعية', 'مراجعات علمية'],
    },
    {
        id: 'oup', name: 'Oxford Academic', ar: 'أكسفورد أكاديميك', url: 'https://academic.oup.com/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: [],
        about: 'دوريات وكتب جامعة أكسفورد.',
        uses: ['دوريات في العلوم الأساسية', 'كتب أكاديمية', 'مراجعات متخصصة'],
    },
    {
        id: 'tandf', name: 'Taylor & Francis Online', ar: 'تايلور وفرانسيس', url: 'https://www.tandfonline.com/',
        kind: 'publisher', access: 'subscription', level: 'advanced', disc: [],
        about: 'منصة تايلور وفرانسيس للدوريات العلمية في تخصصات متعددة.',
        uses: ['دوريات في العلوم والبيئة', 'أبحاث تطبيقية', 'إرشادات النشر'],
    },
];

/* ---------- Courses ----------
   Each course page was opened and its free status read from the provider's own
   pages. Access is stated exactly as the provider states it. */

export type CourseLang = 'ar' | 'en' | 'both';
export type CourseTopic = 'basics' | 'writing' | 'stats' | 'data';
export const COURSE_TOPIC: Record<CourseTopic, string> = {
    basics: 'أساسيات ومنهجية البحث',
    writing: 'الكتابة والنشر',
    stats: 'الإحصاء وتحليل البيانات',
    data: 'برمجة وأدوات البيانات',
};
export const COURSE_LANG: Record<CourseLang, string> = { ar: 'عربي', en: 'English', both: 'AR / EN' };

export type Course = {
    id: string; title: string; provider: string; providerAr: string; url: string;
    lang: CourseLang; level: ResLevel; access: ResAccess; topic: CourseTopic;
    about: string; note: string;
};

export const COURSES: Course[] = [
    {
        id: 'c-arps-method', title: 'برامج منهجية البحث العلمي (دبلوم قصير وإعداد أخصائي)', provider: 'ARPS', providerAr: 'المنصة العربية للدراسات المهنية',
        url: 'https://arps.cc/ar/domains/k14/', lang: 'both', level: 'beginner', access: 'free', topic: 'basics',
        about: 'برامج في منهجية البحث العلمي والبحث النوعي ومراجعة الأدبيات والتفكير النقدي، بالعربي والإنجليزي.',
        note: 'كل الدروس والتمارين مجانية والشهادة اختيارية، حسب صفحة المنصة.',
    },
    {
        id: 'c-edraak-prbs', title: 'Principles of Research in Biological Sciences', provider: 'Edraak', providerAr: 'إدراك',
        url: 'https://www.edraak.org/en/programs/course/prbs100-v2018-sp-2/', lang: 'ar', level: 'beginner', access: 'free', topic: 'basics',
        about: 'مقدمة في مبادئ البحث في العلوم البيولوجية من منصة إدراك.',
        note: 'إدراك بتوضح إن الاشتراك في أي دورة مجاني، ومعاه شهادة مجانية.',
    },
    {
        id: 'c-elsevier-ra', title: 'Elsevier Researcher Academy', provider: 'Elsevier', providerAr: 'إلسيفير',
        url: 'https://researcheracademy.elsevier.com/', lang: 'en', level: 'intermediate', access: 'free', topic: 'writing',
        about: 'مسار كامل: تحضير البحث، الكتابة، عملية النشر، مراجعة الأقران، وتوصيل البحث. أكتر من 140 وحدة.',
        note: 'الموقع نفسه بيوصفها كموارد تعلم إلكتروني مجانية.',
    },
    {
        id: 'c-ocw-1805', title: 'Introduction to Probability and Statistics (18.05)', provider: 'MIT OpenCourseWare', providerAr: 'إم آي تي',
        url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/', lang: 'en', level: 'intermediate', access: 'free', topic: 'stats',
        about: 'مقرر جامعي كامل في الاحتمالات والإحصاء: محاضرات وواجبات ومذكرات مفتوحة.',
        note: 'مواد مفتوحة بدون تسجيل، من غير شهادة.',
    },
    {
        id: 'c-khan-stats', title: 'Statistics and Probability', provider: 'Khan Academy', providerAr: 'خان أكاديمي',
        url: 'https://www.khanacademy.org/math/statistics-probability', lang: 'en', level: 'beginner', access: 'free', topic: 'stats',
        about: 'شرح مبسط للإحصاء والاحتمالات بالفيديو والتمارين، مناسب كبداية قبل تحليل بيانات البحث.',
        note: 'خان أكاديمي منظمة غير ربحية، والمحتوى مجاني.',
    },
    {
        id: 'c-delft-rm', title: 'Multidisciplinary Research Methods for Engineers', provider: 'DelftX on edX', providerAr: 'جامعة دلفت عبر edX',
        url: 'https://www.edx.org/learn/engineering/delft-university-of-technology-multidisciplinary-research-methods-for-engineers', lang: 'en', level: 'intermediate', access: 'free', topic: 'basics',
        about: 'مناهج البحث متعددة التخصصات: تصميم الدراسة وجمع البيانات.',
        note: 'مسار الاستماع المجاني (Audit) متاح لمدة محدودة، والشهادة والتقييمات مدفوعة، حسب سياسة edX.',
    },
    {
        id: 'c-carpentries', title: 'The Carpentries lessons (Data Carpentry and Software Carpentry)', provider: 'The Carpentries', providerAr: 'ذا كاربنتريز',
        url: 'https://carpentries.org/lessons/', lang: 'en', level: 'intermediate', access: 'free', topic: 'data',
        about: 'دروس عملية في Python وR وSQL والـ shell لتنظيف وتحليل بيانات البحث.',
        note: 'الدروس مرخصة بترخيص Creative Commons وتتاح للجميع.',
    },
];

RESOURCES.push(...COURSES.map((c): Resource => ({
    id: c.id, name: c.title, ar: `${c.providerAr} — ${COURSE_LANG[c.lang]}`, url: c.url,
    kind: 'course', access: c.access, level: c.level, disc: [],
    about: c.about, uses: [], note: c.note,
})));

export const resourceById = (id: string) => RESOURCES.find(r => r.id === id);

/* ---------- Research Academy ---------- */

export type Stage = { id: string; n: number; en: string; ar: string; level: ResLevel; bullets: string[]; outcome: string };

export const ACADEMY_STAGES: Stage[] = [
    {
        id: 'intro', n: 1, en: 'Introduction to Scientific Research', ar: 'مقدمة في البحث العلمي', level: 'beginner',
        bullets: ['مفهوم البحث العلمي وأهميته', 'أنواع الأبحاث العلمية', 'الفرق بين البحث الأكاديمي والمشروع العلمي', 'خطوات إعداد البحث'],
        outcome: 'تعرف إيه هو البحث العلمي وإيه الفرق بينه وبين مشروع المادة، وتعرف الخطوات من أول الفكرة لآخر تسليم.',
    },
    {
        id: 'skills', n: 2, en: 'Research Skills', ar: 'مهارات البحث', level: 'beginner',
        bullets: ['كيفية اختيار موضوع بحث مناسب', 'تحديد المشكلة البحثية', 'صياغة الأسئلة والأهداف البحثية', 'كيفية البحث عن فكرة بحثية قابلة للتنفيذ'],
        outcome: 'تطلع بموضوع بحثي واضح، بسؤال بحثي وأهداف محددة وقابلة للتنفيذ في الوقت المتاح.',
    },
    {
        id: 'literature', n: 3, en: 'Literature Review', ar: 'مراجعة الأدبيات', level: 'intermediate',
        bullets: ['البحث عن الدراسات السابقة', 'قراءة الأوراق العلمية', 'تحليل الدراسات السابقة وتقييمها', 'تحديد الفجوة البحثية Research Gap'],
        outcome: 'تقدر تقرأ ورقة علمية بسرعة وتعرف مكوناتها، وتحدد الفجوة اللي بحثك هيملاها.',
    },
    {
        id: 'methodology', n: 4, en: 'Research Methodology', ar: 'منهجية البحث', level: 'intermediate',
        bullets: ['تصميم التجارب العلمية', 'اختيار المنهجية المناسبة', 'جمع البيانات وتوثيقها', 'أساسيات التعامل مع العينات والقياسات'],
        outcome: 'تختار منهجية مناسبة لسؤالك البحثي وتصمم تجربة أو دراسة تقدر تعيدها وتوثقها.',
    },
    {
        id: 'analysis', n: 5, en: 'Data Analysis', ar: 'تحليل البيانات', level: 'intermediate',
        bullets: ['أساسيات تحليل البيانات', 'التعرف على البرامج المستخدمة في التحليل', 'تمثيل النتائج بالرسوم البيانية', 'تفسير النتائج العلمية'],
        outcome: 'تحوّل بياناتك لأرقام ورسوم مفهومة، وتفسرها من غير ما تتعدى اللي البيانات بتقوله.',
    },
    {
        id: 'writing', n: 6, en: 'Scientific Writing', ar: 'الكتابة العلمية', level: 'intermediate',
        bullets: ['كيفية كتابة البحث العلمي', 'كتابة الملخص Abstract', 'المقدمة والمنهجية والنتائج والمناقشة', 'كتابة المراجع والاستشهادات العلمية'],
        outcome: 'تكتب بحث كامل بأقسامه، بمراجع مضبوطة بصيغة واحدة من غير أخطاء اقتباس.',
    },
    {
        id: 'publishing', n: 7, en: 'Publishing & Academic Ethics', ar: 'النشر وأخلاقيات البحث', level: 'advanced',
        bullets: ['اختيار المجلة العلمية المناسبة', 'فهم عملية التحكيم Peer Review', 'متطلبات النشر العلمي', 'أخلاقيات البحث العلمي', 'تجنب الانتحال Plagiarism'],
        outcome: 'تعرف تختار مجلة موثوقة، تفهم رحلة التحكيم، وتتجنب الانتحال والمجلات المفترسة.',
    },
];

export const ACADEMY_FORMATS = [
    'كورسات تعليمية مرتبة',
    'فيديوهات ومحاضرات',
    'مقالات وأدلة مكتوبة',
    'ملفات PDF تعليمية',
    'تطبيقات عملية ومشروعات تدريبية',
];

/* ---------- Tool functions ---------- */

export const TOOL_FUNCTIONS: { id: string; en: string; ar: string; note: string; ids: string[] }[] = [
    { id: 'discovery', en: 'Research Discovery', ar: 'اكتشاف الأبحاث', note: 'تلاقي بيها الأوراق المناسبة لموضوعك.', ids: ['google-scholar', 'semantic-scholar', 'connected-papers', 'crossref'] },
    { id: 'refs', en: 'Reference Management', ar: 'إدارة المراجع', note: 'تجمّع بيها المصادر وتطلع قائمة المراجع.', ids: ['zotero'] },
    { id: 'writing', en: 'Academic Writing', ar: 'الكتابة الأكاديمية', note: 'تكتب بيها البحث بصيغة علمية منظمة.', ids: ['overleaf'] },
    { id: 'analysis', en: 'Data Analysis', ar: 'تحليل البيانات', note: 'تحلل بيها البيانات وتشغل النماذج.', ids: ['colab'] },
    { id: 'viz', en: 'Visualization', ar: 'تمثيل البيانات', note: 'تطلع بيها رسوم واضحة للنتائج.', ids: ['datawrapper'] },
    { id: 'identity', en: 'Research Identity', ar: 'الهوية البحثية', note: 'تميّز بيها اسمك كباحث وتربط أبحاثك.', ids: ['orcid'] },
];

/* ---------- Journal guidance ---------- */

export const JOURNAL_CHECKS: { q: string; a: string }[] = [
    { q: 'هل المجلة مذكورة في دليل معتمد؟', a: 'دوّر على اسم المجلة في DOAJ لو مفتوحة الوصول، وفي قائمة المجلات المفهرسة (Master Journal List) لو بتدور على فهرسة Web of Science.' },
    { q: 'مين الناشر؟', a: 'الناشر المعروف والجهة العلمية الواضحة علامة مطمّنة. الناشر المجهول اللي مالوش تاريخ ولا أعضاء تحرير معروفين علامة خطر.' },
    { q: 'هل هيئة التحرير حقيقية ومعروفة؟', a: 'شوف أسماء هيئة التحرير وانتماءاتهم وأبحاثهم. أسماء مش موجودة أو انتماءات وهمية = مجلة مفترسة.' },
    { q: 'التحكيم مذكور بوضوح؟', a: 'المجلة المحكمة بتشرح عملية المراجعة والمدة الزمنية. لو مفيش أي تفاصيل عن التحكيم، خد بالك.' },
    { q: 'الرسوم واضحة قبل الإرسال؟', a: 'الرسوم لازم تكون معلنة قبل ما تبعت. طلب رسوم كبيرة بعد القبول أو قبل التحكيم من غير توضيح علامة خطر.' },
    { q: 'الموقع شكله محترف؟', a: 'أخطاء لغوية كتير، صور مسروقة، إعلانات، وعناوين مبهمة كلها علامات إن المجلة مش جدية.' },
    { q: 'هل بيوعدوا بقبول سريع جدًا؟', a: 'وعود زي "نشر في 48 ساعة" أو قبول مضمون من غير تحكيم حقيقي علامة قوية على مجلة مفترسة.' },
];

export const JOURNAL_TYPES: { ar: string; en: string; text: string }[] = [
    { ar: 'مجلة محكمة', en: 'Peer-reviewed journal', text: 'البحث بيتحكم فيه خبراء في المجال قبل النشر. دي المصدر الأساسي اللي تعتمد عليه.' },
    { ar: 'مستودع مسودات', en: 'Preprint repository', text: 'زي arXiv: البحث بينشر قبل التحكيم. مفيد للمتابعة السريعة، لكنه مش بحث محكم.' },
    { ar: 'مجلة مفتوحة الوصول', en: 'Open access journal', text: 'المحتوى متاح مجانًا للقارئ، وغالبًا الناشر بياخد رسوم نشر من الباحث أو جهته.' },
    { ar: 'مجلة مفترسة', en: 'Predatory journal', text: 'بتاخد رسوم من غير تحكيم حقيقي. اسمها بيشبه المجلات المعروفة ووعودها كبيرة.' },
];

/* ---------- Journey ---------- */

export const JOURNEY: { n: number; title: string; text: string; to: string; cta: string }[] = [
    { n: 1, title: 'ابدأ بالأساسيات', text: 'اقرا المرحلتين الأولى والتانية من أكاديمية البحث: يعني إيه بحث علمي، وإزاي تختار موضوع وسؤال بحثي.', to: '/research/academy', cta: 'أكاديمية البحث' },
    { n: 2, title: 'اختار تخصصك', text: 'ادخل على تخصصك وشوف قواعد البيانات والمستودعات اللي بتخدم مجالك.', to: '/research/resources', cta: 'المكتبة العلمية' },
    { n: 3, title: 'اقرا وقيّم', text: 'اتعلم تقرا ورقة علمية وتحدد الفجوة البحثية، واستخدم أدوات اكتشاف الأبحاث.', to: '/research/tools', cta: 'أدوات الباحث' },
    { n: 4, title: 'اكتب ووثّق', text: 'اكتب بأقسام البحث العلمي، ونظّم مراجعك بـ Zotero واكتب بـ Overleaf.', to: '/research/tools', cta: 'أدوات الكتابة' },
    { n: 5, title: 'انشر بأمان', text: 'قبل ما تبعت لأي مجلة، اتأكد إنها موثوقة مش مفترسة، واعرف الفرق بين المحكم والمسودة.', to: '/research/journals', cta: 'دليل النشر' },
];

export const FEATURED_IDS = ['google-scholar', 'pubmed', 'arxiv-physics', 'zotero', 'doaj', 'hf-papers'];

/* ---------- Internal search ---------- */

const norm = (s: string) => s.toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ').trim();

export type ResearchHit = { id: string; title: string; sub: string; to: string; kind: string };

export const RESEARCH_INDEX: ResearchHit[] = (() => {
    const hits: ResearchHit[] = [];
    for (const r of RESOURCES) {
        hits.push({
            id: `res-${r.id}`,
            title: r.name,
            sub: [r.ar, KIND_LABEL[r.kind].ar, r.disc.length ? r.disc.map(discAr).join(' · ') : 'كل التخصصات'].join(' — '),
            to: r.disc.length ? `/research/discipline/${r.disc[0]}` : '/research/resources',
            kind: 'مصدر علمي',
        });
    }
    for (const s of ACADEMY_STAGES) {
        hits.push({ id: `stage-${s.id}`, title: `المرحلة ${s.n}: ${s.ar}`, sub: s.en, to: '/research/academy', kind: 'أكاديمية البحث' });
    }
    for (const d of RESEARCH_DISCIPLINES) {
        hits.push({ id: `disc-${d.id}`, title: d.ar, sub: `${d.en} — ${d.blurb}`, to: `/research/discipline/${d.id}`, kind: 'تخصص' });
    }
    return hits;
})();

export function searchResearch(query: string, limit = 8): ResearchHit[] {
    const tokens = norm(query).split(' ').filter(Boolean);
    if (!tokens.length) return [];
    const scored = RESEARCH_INDEX
        .map(h => {
            const k = norm(`${h.title} ${h.sub} ${h.kind}`);
            if (!tokens.every(t => k.includes(t))) return null;
            const titleHit = tokens.every(t => norm(h.title).includes(t));
            return { h, score: titleHit ? 2 : 1 };
        })
        .filter((x): x is { h: ResearchHit; score: number } => x !== null)
        .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(x => x.h);
}
