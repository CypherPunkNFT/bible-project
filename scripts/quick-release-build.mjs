// Builds only the code of the tree in the current directory into the given folder. Run by quick-release.mjs with the
// release worktree as its working directory, so the build can never pick up the shared folder's unreleased work.
//   node scripts/quick-release-build.mjs <outDir> [--since <the live release's commit>]
// First the translation checks (stage 4, SiteTranslation/system/HANDOFF.md), run from this script's own Website folder
// because an older release tree may not have them: the language file must be sound, and the commits after --since
// must add no on-screen English that is not registered for translation.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { portableViteConfig } from './portable-vite-config.mjs';

const root = process.cwd(), outDir = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !outDir.startsWith(root + path.sep)) throw new Error(`quick build: expected an output folder inside ${root}; got ${process.argv[2]}`);
const sinceAt = process.argv.indexOf('--since'), since = sinceAt > 0 ? process.argv[sinceAt + 1] : undefined;
if (sinceAt > 0 && !/^[0-9a-f]{7,40}$/.test(since ?? '')) throw new Error(`quick build: --since needs a commit id; got ${since}`);

const website = fileURLToPath(new URL('../', import.meta.url));
function runCheck(name, command, args) {
  const result = spawnSync(command, args, { cwd: website, stdio: 'inherit', shell: false });
  if (result.error) throw new Error(`quick build: the ${name} could not start (${command}): ${result.error.message}`);
  if (result.status !== 0) throw new Error(`quick build: the ${name} failed (exit ${result.status}) for ${root}; its message is above.`);
}
runCheck('language file check', process.execPath, ['--experimental-strip-types', path.join(website, 'scripts/check-site-languages.ts'), root]);
runCheck('English check', 'py', ['-3.12', path.join(website, 'content/translation/english_build_check.py'), '--root', root, ...(since ? ['--since', since] : [])]);
const config = path.join(root, `.vite-quick-${process.pid}.config.ts`);
fs.writeFileSync(config, portableViteConfig(fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8')));
try {
  const { build } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')).href);
  await build({ root, configFile: config, logLevel: 'warn', build: { outDir, emptyOutDir: true, copyPublicDir: false } });
} finally {
  fs.unlinkSync(config);
}
if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error(`quick build: ${outDir} has no index.html`);
