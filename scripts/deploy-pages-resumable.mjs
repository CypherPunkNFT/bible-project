// Keep the installed Wrangler intact; use a verified copy for large Pages uploads.
// Run from the prepared release directory, with its production wrangler.jsonc:
// node <Website>/scripts/deploy-pages-resumable.mjs pages deploy site --project-name bible-project --branch main
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const original = new URL('../node_modules/wrangler/wrangler-dist/cli.js', import.meta.url);
const copy = new URL('cli-resumable.cjs', original);
let source = readFileSync(original, 'utf8');
function replaceOnce(before, after) {
  if (source.split(before).length !== 2) throw new Error('Installed Wrangler uploader changed; review the adapter before deploying.');
  source = source.replace(before, after);
}
replaceOnce('MAX_BUCKET_SIZE = 40 * 1024 * 1024;', 'MAX_BUCKET_SIZE = 4 * 1024 * 1024;');
replaceOnce(`() => {
                counter += bucket.files.length;`, `async () => {
                // Cache only asset hashes whose upload request has already succeeded.
                await fetchResult2(COMPLIANCE_REGION_CONFIG_PUBLIC, \`/pages/assets/upsert-hashes\`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: \`Bearer \${jwt2}\` },
                  body: JSON.stringify({ hashes: bucket.files.map(file => file.hash) })
                });
                counter += bucket.files.length;`);
writeFileSync(copy, source);
const result = spawnSync(process.execPath, [fileURLToPath(copy), ...process.argv.slice(2)], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
