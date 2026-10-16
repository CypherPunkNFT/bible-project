import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../..');
// Extract the real current hero and its catalog/resume logic, without editing the home page.
const home = await fs.readFile(path.join(root, 'src/pages/HomePage.tsx'), 'utf8');
const start = home.indexOf('    <PreviewMarquee />');
if (start < 0) throw new Error('Home collection boundary changed');
const opening = `import { HeroStack } from './HeroStack';\n` + home.slice(0, start).replace('<Link to="/bible" className="home-hero-book" aria-label="Explore the Bible"><OpenBible /></Link>', '<HeroStack />') + '  </div>;\n}\n';
await fs.writeFile(path.join(dir, 'Opening.tsx'), opening);
await build({ entryPoints: [path.join(dir, 'entry.tsx')], bundle: true, outfile: path.join(dir, 'mockup.js'), format: 'esm', minify: true, jsx: 'automatic', tsconfig: path.join(root, 'tsconfig.app.json'), define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' } });
const index = await fs.readFile(path.join(root, 'dist/index.html'), 'utf8');
const style = index.match(/href="(\/assets\/index-[^"]+\.css)"/)[1];
const css = await fs.readFile(path.join(root, 'dist', style), 'utf8');
await fs.writeFile(path.join(dir, 'base.css'), css.replaceAll('url(./', 'url(/assets/'));
await fs.writeFile(path.join(dir, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Collection stacks · Bible Project</title><script>try{const t=localStorage.getItem('bp-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch{}</script><link rel="stylesheet" href="./base.css"><link rel="stylesheet" href="./mockup.css"></head><body><div id="root"></div><script type="module" src="./mockup.js"></script></body></html>`);
console.log('Ready: http://127.0.0.1:8931/mockups/home-stacks/');
