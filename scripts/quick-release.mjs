// Publishes a small code change without preparing a new 6 GB package: picks the commits onto the live release's tree,
// builds only the code, puts it into the live package, repoints the ready-made pages and uploads what changed.
//   node scripts/quick-release.mjs --pick <commit> [--pick <commit>] [--check /path] [--dry-run]
//   node scripts/quick-release.mjs --resume    upload a package whose earlier upload failed
// Going back is Cloudflare's version history, not a stored copy: wrangler rollback, or the Worker's Deployments tab.
// Anything a code change alone cannot carry is refused, and needs a full prepare (scripts/prepare-testimonies-release.ts).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pruneReleaseAssets } from './prune-release-assets.mjs';

const WEBSITE = fileURLToPath(new URL('../', import.meta.url));
const WORKTREE = path.join(WEBSITE, '.local/release-languages');
const LIVE_SITE = 'https://bibleguide.io';
const PENDING = 'quick-release-pending.json', LIVE_VERSION = 'live-version.txt';
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const IGNORED = [/\.md$/i, /^design\//, /^tests?\//, /^e2e\//, /^docs\//, /^\.github\//];
// The prepare step reshapes or reads these, so a plain copy would break the live site.
const PUBLIC_REFUSED = [/^public\/_routes\.json$/, /^public\/_redirects$/, /^public\/content\/scholar-population\//, /^public\/content\/sources\//, /^public\/data_acquisition\//];
// Feeds the 1,681 ready-made pages, which this tool does not regenerate.
const CODE_REFUSED = [/^src\/lib\/page-head\.ts$/];

/** What a changed file means for a quick release: 'ignore', 'build', 'public' or 'refuse'. */
export function classifyChange(file) {
  if (IGNORED.some((rule) => rule.test(file))) return 'ignore';
  if (PUBLIC_REFUSED.some((rule) => rule.test(file)) || CODE_REFUSED.some((rule) => rule.test(file))) return 'refuse';
  if (file.startsWith('public/')) return 'public';
  if (file.startsWith('src/') || file === 'index.html') return 'build';
  return 'refuse';
}

const ASSET_TAG = /<(?:script|link)\b[^>]*?\/assets\/([^"'\s>]+)["'][^>]*>/g;
const assetTags = (html) => [...html.matchAll(ASSET_TAG)].map((match) => match[1]);
const stem = (name) => name.replace(/-[\w-]{8}(\.\w+)$/, '$1');
const blankAssets = (html) => html.replace(ASSET_TAG, (tag, name) => tag.replace(name, 'ASSET'));
const entryName = (html) => /<script[^>]*\/assets\/([^"'\s>]+\.js)/.exec(html)?.[1];

/** Old file name to new, from the two page shells. Throws unless the shells differ only in those names. */
export function assetRenames(oldShell, newShell) {
  const before = assetTags(oldShell), after = assetTags(newShell);
  if (blankAssets(oldShell).replace(/\r\n/g, '\n') !== blankAssets(newShell).replace(/\r\n/g, '\n')) throw new Error('The page shell changed beyond its file names, so the ready-made pages would be wrong. Use a full prepare.');
  if (before.length !== after.length) throw new Error(`The page shell names ${after.length} files, the live one ${before.length}. Use a full prepare.`);
  const renames = new Map();
  before.forEach((name, index) => {
    if (stem(name) !== stem(after[index])) throw new Error(`The page shell's files changed order: ${name} against ${after[index]}. Use a full prepare.`);
    if (name !== after[index]) renames.set(name, after[index]);
  });
  return renames;
}

export function renameAssets(html, renames) {
  if (!renames.size) return html;
  const pattern = new RegExp(`/assets/(${[...renames.keys()].map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return html.replace(pattern, (_, name) => `/assets/${renames.get(name)}`);
}

function htmlFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) htmlFiles(path.join(dir, entry.name), found);
    else if (entry.name.endsWith('.html')) found.push(path.join(dir, entry.name));
  }
  return found;
}

/** Repoints every page, the shell last. A rerun after a crash finishes the job, because the shell still holds the old names. */
export function repointPages(site, renames) {
  const shell = path.join(site, 'index.html'), pages = htmlFiles(site).filter((file) => file !== shell).concat(shell);
  let changed = 0;
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8'), next = renameAssets(html, renames);
    if (next === html) continue;
    fs.writeFileSync(`${file}.tmp`, next);
    fs.renameSync(`${file}.tmp`, file);
    changed++;
  }
  return { pages: pages.length, changed };
}

/** Every /assets/ file a page names must exist, or that page would break on the live site. */
export function missingAssets(site) {
  const missing = new Set();
  for (const file of htmlFiles(site)) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/\/assets\/([\w.-]+)/g)) {
      if (!fs.existsSync(path.join(site, 'assets', match[1]))) missing.add(`${match[1]} (in ${path.relative(site, file)})`);
    }
  }
  return [...missing];
}

function run(command, args, cwd = WORKTREE) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}: ${result.stderr}`);
  return result.stdout.trim();
}
const wrangler = (args, cwd) => run(process.execPath, [path.join(WEBSITE, 'node_modules/wrangler/bin/wrangler.js'), ...args], cwd);
const deployedVersion = (pkg) => JSON.parse(wrangler(['deployments', 'status', '--json'], pkg)).versions.map((version) => version.version_id).join(',');

async function fetchLive(pathname) {
  const response = await fetch(`${LIVE_SITE}${pathname}${pathname.includes('?') ? '&' : '?'}quick=${Date.now()}`);
  if (!response.ok) throw new Error(`${LIVE_SITE}${pathname} answered ${response.status}, expected 200`);
  return response.text();
}

/** The package that is live now: its code and data match the site, and its record of the deployed version still holds. */
async function findLivePackage() {
  const liveEntry = entryName(await fetchLive('/'));
  const liveStamp = JSON.parse(await fetchLive('/data/catalog.json')).stamp;
  const root = path.join(WORKTREE, '.release');
  const candidates = fs.readdirSync(root).map((name) => path.join(root, name)).filter((pkg) => {
    if (!fs.existsSync(path.join(pkg, 'release.json'))) return false; // a package the prepare step never finished
    const pending = fs.existsSync(path.join(pkg, PENDING)) && JSON.parse(fs.readFileSync(path.join(pkg, PENDING), 'utf8')).liveEntry;
    return (pending || entryName(fs.readFileSync(path.join(pkg, 'site/index.html'), 'utf8'))) === liveEntry;
  }).sort((a, b) => fs.statSync(b).birthtimeMs - fs.statSync(a).birthtimeMs);
  if (!candidates.length) throw new Error(`No package in ${root} matches the live bundle ${liveEntry}. Another chat released from elsewhere; use a full prepare.`);
  const pkg = candidates[0], packageStamp = JSON.parse(fs.readFileSync(path.join(pkg, 'site/data/catalog.json'), 'utf8')).stamp;
  if (packageStamp !== liveStamp) throw new Error(`Live data stamp ${liveStamp} differs from ${path.basename(pkg)}'s ${packageStamp}. Another chat released new data; uploading would undo it.`);
  const recorded = path.join(pkg, LIVE_VERSION);
  if (fs.existsSync(recorded) && fs.readFileSync(recorded, 'utf8').trim() !== deployedVersion(pkg)) throw new Error(`The deployed Worker version changed since ${path.basename(pkg)} went live. Another chat released; uploading would undo it.`);
  return { pkg, liveEntry };
}

/** Checks every commit before any is applied, so a refused commit never moves the release tree. */
export function planChanges(listChanges, commits) {
  const refused = [], publicFiles = new Set();
  for (const commit of commits) {
    for (const line of listChanges(commit).split(/\r?\n/).filter(Boolean)) {
      const file = line.split('\t').at(-1).replace(/^"|"$/g, ''), kind = classifyChange(file);
      if (kind === 'refuse') refused.push(`${commit.slice(0, 9)} ${file}`);
      if (kind === 'public') publicFiles.add(file);
    }
  }
  return { refused, publicFiles: [...publicFiles] };
}

function pickCommits(commits) {
  const start = run('git', ['rev-parse', 'HEAD']);
  const undo = () => run('git', ['reset', '--keep', start]);
  for (const commit of commits) {
    const result = spawnSync('git', ['cherry-pick', commit], { cwd: WORKTREE, encoding: 'utf8' });
    if (result.status === 0) continue;
    spawnSync('git', ['cherry-pick', '--abort'], { cwd: WORKTREE });
    undo();
    throw new Error(`Commit ${commit} does not apply on the live release tree: ${result.stdout}${result.stderr}`);
  }
  return undo;
}

function buildCode() {
  const outDir = path.join(WORKTREE, `.quick-build-${process.pid}`);
  const result = spawnSync(process.execPath, [path.join(WEBSITE, 'scripts/quick-release-build.mjs'), outDir], { cwd: WORKTREE, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`The code build failed (exit ${result.status}) in ${WORKTREE}`);
  const extras = fs.readdirSync(outDir).filter((name) => !['index.html', 'assets'].includes(name));
  if (extras.length) throw new Error(`The build made files outside assets/: ${extras.join(', ')}. Use a full prepare.`);
  return outDir;
}

function applyPublicFiles(files, site) {
  for (const file of files) {
    const source = path.join(WORKTREE, file), target = path.join(site, file.slice('public/'.length));
    if (!fs.existsSync(source)) { fs.rmSync(target, { force: true }); continue; }
    if (fs.statSync(source).size > MAX_FILE_BYTES) throw new Error(`Cloudflare Workers refuses files over 25 MiB: ${file}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function applyToPackage(pkg, built, renames, publicFiles, liveEntry) {
  const site = path.join(pkg, 'site');
  if (!fs.existsSync(path.join(pkg, PENDING))) fs.writeFileSync(path.join(pkg, PENDING), JSON.stringify({ liveEntry }));
  applyPublicFiles(publicFiles, site);
  fs.cpSync(path.join(built, 'assets'), path.join(site, 'assets'), { recursive: true });
  console.log('Pages repointed:', repointPages(site, renames));
}

async function verifyLive(entry, checks) {
  for (let attempt = 1; ; attempt++) {
    const seen = await Promise.all(['/', '/study/academic'].map(async (page) => entryName(await fetchLive(page))));
    if (seen.every((name) => name === entry)) break;
    if (attempt >= 12) throw new Error(`Live pages show ${seen.join(' and ')} after a minute, expected ${entry}. Go back with wrangler rollback.`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  for (const check of checks) await fetchLive(check);
  console.log(`Live: ${entry}; home, a ready-made page and ${checks.length} checked address(es) answer 200.`);
}

async function upload(pkg, entry, checks) {
  const result = spawnSync(process.execPath, [path.join(WEBSITE, 'scripts/deploy-worker.mjs')], { cwd: pkg, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`The upload failed (exit ${result.status}); the package is ready, so run this again with --resume.`);
  fs.writeFileSync(path.join(pkg, LIVE_VERSION), deployedVersion(pkg));
  fs.rmSync(path.join(pkg, PENDING), { force: true });
  await verifyLive(entry, checks);
}

function parseArgs(argv) {
  const values = (flag) => argv.flatMap((arg, index) => (arg === flag ? [argv[index + 1]] : []));
  return { commits: values('--pick'), checks: values('--check'), dryRun: argv.includes('--dry-run'), resume: argv.includes('--resume') };
}

async function main() {
  const { commits, checks, dryRun, resume } = parseArgs(process.argv.slice(2));
  if (!resume && !commits.length && !dryRun) throw new Error('Give the commits to publish with --pick <commit>.');
  // Git Bash turns a bare /path into C:/Program Files/Git/path; caught here, because after the upload it would skip the tag.
  const badCheck = checks.find((check) => !check?.startsWith('/'));
  if (badCheck !== undefined || checks.includes(undefined)) throw new Error(`--check needs an address starting with /, got "${badCheck}". From Git Bash, run with MSYS_NO_PATHCONV=1.`);
  const { pkg, liveEntry } = await findLivePackage();
  console.log(`Live ${liveEntry}, package ${path.basename(pkg)}`);
  const site = path.join(pkg, 'site');
  if (resume) return upload(pkg, entryName(fs.readFileSync(path.join(site, 'index.html'), 'utf8')), checks);

  const { refused, publicFiles } = planChanges((commit) => run('git', ['show', '--no-renames', '--name-status', '--format=', commit]), commits);
  if (refused.length) throw new Error(`These changes need a full prepare:\n${refused.join('\n')}`);
  const undo = pickCommits(commits);
  let built;
  try {
    built = buildCode();
    const renames = assetRenames(fs.readFileSync(path.join(site, 'index.html'), 'utf8'), fs.readFileSync(path.join(built, 'index.html'), 'utf8'));
    console.log(`Changes: ${renames.size} file(s) the pages name, ${publicFiles.length} public file(s).`, Object.fromEntries(renames));
    if (dryRun) { undo(); return; }
    applyToPackage(pkg, built, renames, publicFiles, liveEntry);
  } catch (error) {
    undo();
    throw error;
  } finally {
    if (built) fs.rmSync(built, { recursive: true, force: true });
  }
  console.log('Code files:', await pruneReleaseAssets(site));
  const missing = missingAssets(site);
  if (missing.length) throw new Error(`Pages name files that are not in the package:\n${missing.slice(0, 20).join('\n')}`);
  const entry = entryName(fs.readFileSync(path.join(site, 'index.html'), 'utf8'));
  await upload(pkg, entry, checks);
  const tag = `release-${new Date().toISOString().slice(0, 10)}-quick-${entry.replace(/^index-|\.js$/g, '')}`;
  run('git', ['tag', tag]);
  run('git', ['push', 'origin', tag]);
  console.log(`Tagged ${tag}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
