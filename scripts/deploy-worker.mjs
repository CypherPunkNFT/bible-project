// Uploads a prepared release to its Cloudflare Worker. Run from the release directory (it holds wrangler.jsonc):
// node <Website>/scripts/deploy-worker.mjs
// A rerun after a dropped connection uploads only the files Cloudflare does not already hold.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { archiveOlderPackages } from './archive-older-packages.mjs';
import { assertFrontEndReadsPersonPacks, sitePacksPeople } from './person-packs-guard.mjs';
import { prefillAssetHashes } from './prefill-asset-hashes.mjs';

if (!existsSync('wrangler.jsonc') || !existsSync('site/index.html')) throw new Error(`Run this from a prepared release directory (wrangler.jsonc and site/index.html); got ${process.cwd()}`);
if (sitePacksPeople('site')) assertFrontEndReadsPersonPacks('site');
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
// Only a head start: if it fails, wrangler reads the files itself, as it always could.
try {
  console.log('Asset fingerprints worked out in advance:', await prefillAssetHashes(process.cwd(), wrangler));
} catch (error) {
  console.warn(`Could not work out the asset fingerprints in advance (${error.message}); wrangler will read every file itself.`);
}
// Forward slashes: NODE_OPTIONS treats a backslash as an escape, even inside quotes.
const fastAssets = fileURLToPath(new URL('./wrangler-fast-assets.cjs', import.meta.url)).replaceAll('\\', '/');
const result = spawnSync(process.execPath, [wrangler, 'deploy', ...process.argv.slice(2)], { stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: `--require "${fastAssets}"` } });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (result.status === 0 && !process.argv.includes('--dry-run')) archiveOlderPackages(process.cwd(), fileURLToPath(new URL('../../../../../ARCHIVE/release-copies/', import.meta.url)));
// Deployment must never replace dist/: it serves the current working preview on port 8931.
