// Build dist/404.html from dist/index.html so GitHub Pages deep links boot the
// SPA in place; paths outside /website/ (e.g. the domain root) redirect in.
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const guard = `<script>if(!location.pathname.startsWith('/website/'))location.replace('/website/'+location.pathname.replace(/^\\//,'')+location.search+location.hash);</script>`;
writeFileSync('dist/404.html', html.replace('<head>', '<head>' + guard));
// GitHub Pages serves files under underscore paths only when .nojekyll exists.
writeFileSync('dist/.nojekyll', '');
console.log('404.html + .nojekyll written');
