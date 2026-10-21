// Load scan: opens every page of the site in a real browser and records what each one downloads, then flags pages and
// files over the limits in thresholds.json. It also scans the build for large data files and lists the code that fetches
// them, and every background preload. Usage (from Website/):
//   node scripts/load-scan/load-scan.mjs [--base https://bibleproject.io] [--max-pages 150] [--label before]
// Writes .load-scan/<date>-<label>.json and .md, and prints the worst offenders.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const limits = JSON.parse(fs.readFileSync(path.join(root, 'scripts/load-scan/thresholds.json'), 'utf8'));
// Files reviewed and kept as they are, each with its reason; they are reported as accepted instead of as warnings.
const accepted = JSON.parse(fs.readFileSync(path.join(root, 'scripts/load-scan/accepted.json'), 'utf8'));
const MB = 1024 * 1024;

function readArgs(argv) {
  const value = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; };
  const base = value('--base', 'http://127.0.0.1:8931').replace(/\/$/, '');
  const maxPages = Number(value('--max-pages', '150'));
  const label = value('--label', 'scan').replace(/[^\w-]/g, '');
  if (!/^https?:\/\//.test(base) || !Number.isInteger(maxPages) || maxPages < 1) throw Error(`Bad arguments: base=${base} max-pages=${maxPages}`);
  return { base, maxPages, label };
}

/** Every absolute route written in the code that a visitor can open without an id: the scan's starting list. */
function seedRoutes() {
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const paths = [...app.matchAll(/<Route path="(\/[^"]*)"/g)].map((m) => m[1]);
  return [...new Set(paths.filter((p) => !p.includes(':') && !p.includes('*')))];
}

/** Pages whose address differs only by an id are one kind of page; two of each kind is enough. */
function pageKind(route) {
  return route.split('/').map((part) => (/\d/.test(part) || part.length > 24 ? ':id' : part)).join('/');
}

function sameSiteLink(base, href) {
  try {
    const url = new URL(href, base);
    if (url.origin !== new URL(base).origin || url.pathname.startsWith('/api/') || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return null;
    return url.pathname.replace(/\/$/, '') || '/';
  } catch { return null; }
}

/** Waits until nothing has been requested for quietMs, or maxMs passes: the page has done its own loading by then. */
async function settle(page, inflight, { quietMs = 2500, maxMs = 25000 } = {}) {
  const start = Date.now();
  let quietSince = Date.now();
  while (Date.now() - start < maxMs) {
    if (inflight.size) quietSince = Date.now();
    else if (Date.now() - quietSince >= quietMs) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

async function measurePage(browser, base, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    window.__longTasks = 0;
    try { new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__longTasks += e.duration; }).observe({ type: 'longtask', buffered: true }); } catch { /* not supported */ }
  });
  const page = await context.newPage();
  const inflight = new Set(), pending = [], files = [];
  page.on('request', (request) => inflight.add(request));
  page.on('requestfailed', (request) => inflight.delete(request));
  page.on('requestfinished', (request) => {
    inflight.delete(request);
    pending.push((async () => {
      const response = await request.response();
      const sizes = await request.sizes().catch(() => null);
      const body = await response?.body().catch(() => null);
      files.push({ url: request.url().replace(base, ''), type: request.resourceType(), status: response?.status() ?? 0,
        transferred: sizes?.responseBodySize ?? 0, decoded: body?.length ?? sizes?.responseBodySize ?? 0 });
    })());
  });
  const started = Date.now();
  let error = null;
  await page.goto(base + route, { waitUntil: 'load', timeout: 60000 }).catch((e) => { error = e.message.split('\n')[0]; });
  const settled = await settle(page, inflight);
  await Promise.all(pending);
  const longTasksMs = Math.round(await page.evaluate(() => window.__longTasks).catch(() => 0));
  const links = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href'))).catch(() => []);
  await context.close();
  return { route, error, settled, seconds: (Date.now() - started) / 1000, longTasksMs, files, links };
}

async function crawl(base, maxPages) {
  const browser = await chromium.launch({ channel: 'msedge' });
  const queue = seedRoutes(), seen = new Set(queue), kinds = new Map(), pages = [];
  while (queue.length && pages.length < maxPages) {
    const route = queue.shift(), kind = pageKind(route);
    if ((kinds.get(kind) ?? 0) >= 2) continue;
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    const result = await measurePage(browser, base, route);
    pages.push(result);
    console.log(`${String(pages.length).padStart(3)} ${route}  ${(sum(result.files, 'transferred') / MB).toFixed(1)} MB`);
    for (const href of result.links) { const next = sameSiteLink(base, href); if (next && !seen.has(next)) { seen.add(next); queue.push(next); } }
    delete result.links;
  }
  await browser.close();
  return pages;
}

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
const isData = (file) => ['fetch', 'xhr'].includes(file.type) || /\.(json|bin|txt)(\?|$)/.test(file.url);

/** The limits each page and file is held to; every finding names the limit it broke. */
function findings(pages) {
  const out = [];
  const add = (severity, route, what, amount, limit, reason) => out.push({ severity, route, what, amount, limit, ...(reason && { reason }) });
  const addFile = (severity, route, what, f, amount, limit) => {
    const known = accepted.find((a) => f.url.includes(a.match));
    add(known ? 'accepted' : severity, route, what, amount, limit, known?.reason);
  };
  for (const p of pages) {
    const transferred = sum(p.files, 'transferred'), decoded = sum(p.files, 'decoded');
    if (p.error) add('bad', p.route, `page failed to load: ${p.error}`, 0, 0);
    if (transferred > limits.pageTransferredBad * MB) add('bad', p.route, 'page downloads', transferred, limits.pageTransferredBad * MB);
    else if (transferred > limits.pageTransferredWarn * MB) add('warn', p.route, 'page downloads', transferred, limits.pageTransferredWarn * MB);
    if (decoded > limits.pageDecodedBad * MB) add('bad', p.route, 'page unpacks', decoded, limits.pageDecodedBad * MB);
    if (p.longTasksMs > limits.longTasksBadMs) add('bad', p.route, 'main thread blocked (ms)', p.longTasksMs, limits.longTasksBadMs);
    else if (p.longTasksMs > limits.longTasksWarnMs) add('warn', p.route, 'main thread blocked (ms)', p.longTasksMs, limits.longTasksWarnMs);
    for (const f of p.files) {
      if (isData(f) && f.decoded > limits.dataFileBad * MB) addFile('bad', p.route, `data file ${f.url}`, f, f.decoded, limits.dataFileBad * MB);
      else if (isData(f) && f.decoded > limits.dataFileWarn * MB) addFile('warn', p.route, `data file ${f.url}`, f, f.decoded, limits.dataFileWarn * MB);
      if (f.type === 'script' && f.decoded > limits.scriptFileWarn * MB) addFile('warn', p.route, `script ${f.url}`, f, f.decoded, limits.scriptFileWarn * MB);
      if (f.type === 'image' && f.transferred > limits.imageFileWarn * MB) addFile('warn', p.route, `image ${f.url}`, f, f.transferred, limits.imageFileWarn * MB);
    }
  }
  const order = { bad: 0, warn: 1, accepted: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity] || b.amount / (b.limit || 1) - a.amount / (a.limit || 1));
}

/** Large files in the build, and the source lines that mention them, so a finding leads straight to the code. */
function staticScan() {
  const dist = path.join(root, 'dist'), large = [];
  const walk = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'data_acquisition') walk(full); }
    else if (/\.(json|bin|txt)$/.test(entry.name) && fs.statSync(full).size > limits.dataFileWarn * MB) large.push({ file: path.relative(dist, full).replaceAll('\\', '/'), bytes: fs.statSync(full).size });
  } };
  if (fs.existsSync(dist)) walk(dist);
  const sources = [], preloads = [];
  const walkSource = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'generated') walkSource(full); }
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) sources.push(full);
  } };
  walkSource(path.join(root, 'src'));
  const texts = new Map(sources.map((file) => [file, fs.readFileSync(file, 'utf8')]));
  for (const item of large) item.mentionedIn = mentions(texts, item.file);
  for (const [file, text] of texts) text.split('\n').forEach((line, i) => {
    if (/\bpreload\w*\(/.test(line) && !/function preload|export (const|function) preload/.test(line)) preloads.push(`${path.relative(root, file).replaceAll('\\', '/')}:${i + 1}`);
  });
  return { large: large.sort((a, b) => b.bytes - a.bytes), preloads };
}

function mentions(texts, file) {
  const name = path.basename(file), folder = path.dirname(file).split('/').slice(-1)[0];
  const hits = [];
  for (const [source, text] of texts) if (text.includes(name) || text.includes(`/${folder}`)) hits.push(path.relative(root, source).replaceAll('\\', '/'));
  return hits.slice(0, 6);
}

function report({ base, label }, pages, found, scan) {
  const size = (n) => `${(n / MB).toFixed(1)} MB`;
  const lines = [`# Load scan · ${label}`, '', `Base: ${base} · ${new Date().toISOString()} · ${pages.length} pages`, '',
    `Limits: ${JSON.stringify(limits)}`, '', '## Findings (worst first)', '', '| | Page | What | Amount | Limit | Why accepted |', '|---|---|---|---|---|---|'];
  for (const f of found) lines.push(`| ${f.severity} | ${f.route} | ${f.what} | ${f.what.includes('(ms)') ? f.amount : size(f.amount)} | ${f.what.includes('(ms)') ? f.limit : size(f.limit)} | ${f.reason ?? ''} |`);
  lines.push('', '## Pages by download size', '', '| Page | Downloaded | Unpacked | Files | Blocked ms | Seconds |', '|---|---|---|---|---|---|');
  for (const p of [...pages].sort((a, b) => sum(b.files, 'transferred') - sum(a.files, 'transferred')))
    lines.push(`| ${p.route} | ${size(sum(p.files, 'transferred'))} | ${size(sum(p.files, 'decoded'))} | ${p.files.length} | ${p.longTasksMs} | ${p.seconds.toFixed(1)}${p.settled ? '' : ' (still loading)'} |`);
  lines.push('', '## Large data files in the build', '', '| File | Size | Mentioned in |', '|---|---|---|');
  for (const item of scan.large) lines.push(`| ${item.file} | ${size(item.bytes)} | ${item.mentionedIn.join(', ') || '—'} |`);
  lines.push('', '## Background preloads in the code', '', ...scan.preloads.map((p) => `- ${p}`));
  return lines.join('\n') + '\n';
}

const options = readArgs(process.argv.slice(2));
const pages = await crawl(options.base, options.maxPages);
const found = findings(pages), scan = staticScan();
const outDir = path.join(root, '.load-scan'), stamp = `${new Date().toISOString().slice(0, 10)}-${options.label}`;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${stamp}.json`), JSON.stringify({ options, limits, pages, found, scan }, null, 1), 'utf8');
fs.writeFileSync(path.join(outDir, `${stamp}.md`), report(options, pages, found, scan), 'utf8');
console.log(`\n${found.filter((f) => f.severity === 'bad').length} bad, ${found.filter((f) => f.severity === 'warn').length} warnings, ${found.filter((f) => f.severity === 'accepted').length} accepted · report: .load-scan/${stamp}.md`);
