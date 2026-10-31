// Uploads a prepared release to its Cloudflare Worker. Run from the release directory (it holds wrangler.jsonc):
// node <Website>/scripts/deploy-worker.mjs
// A rerun after a dropped connection uploads only the files Cloudflare does not already hold.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assertFrontEndReadsPersonPacks, sitePacksPeople } from './person-packs-guard.mjs';

if (!existsSync('wrangler.jsonc') || !existsSync('site/index.html')) throw new Error(`Run this from a prepared release directory (wrangler.jsonc and site/index.html); got ${process.cwd()}`);
if (sitePacksPeople('site')) assertFrontEndReadsPersonPacks('site');
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const result = spawnSync(process.execPath, [wrangler, 'deploy', ...process.argv.slice(2)], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
// Deployment must never replace dist/: it serves the current working preview on port 8931.
