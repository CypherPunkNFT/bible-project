// Bundles chapters 05 and 06 from the live page's components into live-sections.js (+ .css) for this mock-up.
// The preview on :8931 serves built files only, so the mock-up needs its own bundle. Re-run after changing those chapters:
//   node design/print-page-anatomy/build-live.mjs
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [path.join(here, 'live-sections.tsx')],
  outfile: path.join(here, 'live-sections.js'),
  bundle: true, format: 'esm', minify: true, jsx: 'automatic', target: 'es2020', logLevel: 'warning',
  alias: { '@': path.resolve(here, '../../src') },
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('built live-sections.js');
