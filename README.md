# AZU Science

**العربية** | [English](#english)

منصة طلابية لكليات العلوم الأربع بجامعة الأزهر (علوم بنين القاهرة، علوم بنات القاهرة، علوم بنين أسيوط، علوم بنات أسيوط). تجمع كل ما يحتاجه الطالب في رحلته الأكاديمية في مكان واحد: الأقسام والتخصصات، البرامج المتميزة بنظام الساعات المعتمدة، وأدوات الطالب مثل الحاسبة الأكاديمية ومكتبة البرامج العلمية.

بادرة طلابية — من الطلاب، للطلاب.

## محتويات المستودع

- `src/App.tsx` — هيكل التطبيق والصفحات (React).
- `src/data.ts` — نموذج المحتوى: الأقسام، التخصصات، البرامج المتميزة الثمانية، مقارنة تخصصات الحاسبات.
- `src/style.css` — نظام التصميم الكامل (هوية AZU Science).
- `src/photos/` — الصور المستخدمة في الموقع.
- `docs/ROADMAP.md` — وثيقة خارطة الطريق الرسمية لتطوير المنصة على أربع مراحل.

## ملاحظات تقنية

- التطبيق مبني بـ React ويعمل على منصة Instinct Files (الاستيراد من `@instinct/files`)، والنسخة المنشورة متاحة على رابط المنصة.
- الموقع متاح أيضًا كنسخة مستقلة على GitHub Pages: يبنيها مجلد `web/` (Vite) من نفس ملفات `src/`، وتُنشر من فرع `gh-pages`.
- التصميم عربي أولًا (RTL) مع دعم كامل للإنجليزية، ومتجاوب مع الشاشات الصغيرة.
- بدون إيموجي في واجهة الموقع — أيقونات SVG فقط.

## النشر على GitHub Pages

- النسخة المستقلة تعيش على: `https://darshayoya-darsh.github.io/website/`
- للبناء محليًا: `cd web && npm install && npm run build`
- النشر: محتويات `web/dist` تُدفع إلى فرع `gh-pages`. النشر التلقائي عبر GitHub Actions سيُفعّل لاحقًا (ملف الworkflow جاهز ويحتاج صلاحية `workflow` في التوكن أو إضافته من واجهة GitHub).

---

## English

The student platform for the four Faculties of Science at Al-Azhar University (Boys/Girls, Cairo/Assiut). It brings together everything a student needs: departments and specializations, the eight credit-hour special programs, and student tools such as the academic calculator and the scientific software hub.

A student initiative — built by students, for students.

### Repository contents

- `src/App.tsx` — app structure and pages (React).
- `src/data.ts` — content model: departments, specializations, the 8 special programs, computing-track comparison.
- `src/style.css` — full design system (AZU Science identity).
- `src/photos/` — site imagery.
- `docs/ROADMAP.md` — the official 4-phase development roadmap.

### Technical notes

- React app running on the Instinct Files platform (`@instinct/files` imports); the published version lives on the platform link.
- The site also ships as a standalone build on GitHub Pages: `web/` (Vite) builds from the same `src/` files and deploys from the `gh-pages` branch.
- Arabic-first RTL design with English support, fully responsive.
- No emojis in the UI — SVG icons only.

### GitHub Pages

- Standalone build lives at: `https://darshayoya-darsh.github.io/website/`
- Build locally: `cd web && npm install && npm run build`
- Deploy: push the contents of `web/dist` to the `gh-pages` branch. Auto-deploy via GitHub Actions will be enabled later (the workflow file is ready and needs a token with the `workflow` scope, or adding it through the GitHub web UI).

---

AZU Science — More Than a Student Platform. A Gateway to Science, Research & Opportunities.
