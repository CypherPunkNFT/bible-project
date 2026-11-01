// Builds only the code of the tree in the current directory into the given folder. Run by quick-release.mjs with the
// release worktree as its working directory, so the build can never pick up the shared folder's unreleased work.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { portableViteConfig } from './portable-vite-config.mjs';

const root = process.cwd(), outDir = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !outDir.startsWith(root + path.sep)) throw new Error(`quick build: expected an output folder inside ${root}; got ${process.argv[2]}`);
const config = path.join(root, `.vite-quick-${process.pid}.config.ts`);
fs.writeFileSync(config, portableViteConfig(fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8')));
try {
  const { build } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')).href);
  await build({ root, configFile: config, logLevel: 'warn', build: { outDir, emptyOutDir: true, copyPublicDir: false } });
} finally {
  fs.unlinkSync(config);
}
if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error(`quick build: ${outDir} has no index.html`);
