// Link-preview pictures for verse card pages (docs/features/verse-cards/design.md 8), drawn at release by the very code
// that draws the cards visitors make, so a preview always matches its card:
//   bun scripts/verse-cards/previews.mjs <release site folder>          every curated passage: the verse-of-the-day
//                                                                       schedule and the start page's six
//   bun scripts/verse-cards/previews.mjs <release site folder> --quick  the six only (to try it locally)
// Writes, inside that folder (never into git or public/): cards/preview/v1/<key>.png (1200 × 630, under 300 KB),
// cards/preview/v1/index.json (the keys made) and verse-cards/<key>.html (the folder's own index.html with the card's
// title, description, address and picture). Bundles preview-entry.ts with Bun.build into a private temporary folder,
// serves it on a private port and draws each card in headless Edge, as scripts/og-image.mjs does. A passage that cannot
// be drawn is named and skipped, and its page keeps the site's picture.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bookCode } from "../../src/lib/verse-card/links.ts";
import { cardPageHtml, fileBudget, pageFile, pictureFile, pictureProblem, PREVIEW_FOLDER, PREVIEW_VERSION, previewPassage, previewRefs, previewSpec } from "./preview-pages.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const quick = args.includes("--quick");
const folders = args.filter((arg) => arg !== "--quick");
if (folders.length !== 1 || folders[0].startsWith("--")) {
  console.error("usage: bun scripts/verse-cards/previews.mjs <release site folder> [--quick]");
  process.exit(1);
}
const site = path.resolve(folders[0]);
const shellFile = path.join(site, "index.html");
if (!existsSync(shellFile)) {
  console.error(`verse card previews: ${shellFile} is missing; give the prepared release's site folder (it holds index.html)`);
  process.exit(1);
}

const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const catalog = readJson("data/catalog.json");
const schedule = quick ? null : readJson("src/data/verse-of-the-day/schedule.json");
const { refs, problems } = previewRefs(schedule);
const books = new Map();
const plainBook = (book) => {
  const code = bookCode(book);
  if (!books.has(code)) books.set(code, readJson(`data/plain/bsb/${code}.json`));
  return books.get(code);
};
const passages = [];
for (const { key, ref } of refs) {
  const passage = previewPassage(catalog, plainBook(ref.book), key, ref);
  if (typeof passage === "string") problems.push(passage); else passages.push(passage);
}

const countFiles = (folder) => readdirSync(folder, { withFileTypes: true }).reduce((sum, entry) => sum + (entry.isDirectory() ? countFiles(path.join(folder, entry.name)) : 1), 0);
const adding = passages.flatMap((passage) => [pictureFile(passage.key), pageFile(passage.key)]).filter((file) => !existsSync(path.join(site, file))).length + 1;
const budget = fileBudget(countFiles(site), adding);
if (budget.problem) {
  console.error(`verse card previews: ${budget.problem}`);
  process.exit(1);
}

const temporary = mkdtempSync(path.join(os.tmpdir(), "verse-card-previews-"));
const DRAW_LIMIT_MS = 30_000;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const server = http.createServer((request, response) => {
  try {
    const file = path.join(temporary, decodeURIComponent(new URL(request.url, "http://x").pathname));
    if (!file.startsWith(temporary + path.sep) || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  } catch (error) {
    console.warn(`verse card previews: refused a request for ${request.url}: ${error.message}`);
    response.writeHead(400).end();
  }
});
/** The card as a PNG from the page, or an error after DRAW_LIMIT_MS so one stuck drawing cannot hang a release. */
const draw = (page, spec) => {
  let timer;
  const late = new Promise((resolve) => { timer = setTimeout(() => resolve({ error: `not drawn within ${DRAW_LIMIT_MS / 1000} seconds` }), DRAW_LIMIT_MS); });
  return Promise.race([page.evaluate((card) => window.makePreview(card), spec), late]).finally(() => clearTimeout(timer));
};
let browser;
const made = [];
try {
  const built = await Bun.build({ entrypoints: [path.join(root, "scripts/verse-cards/preview-entry.ts")], outdir: temporary, target: "browser", naming: { entry: "[name].[ext]", asset: "[name]-[hash].[ext]" } });
  if (!built.success) throw new Error(`verse card previews: the page did not compile:\n${built.logs.join("\n")}`);
  const outputs = built.outputs.map((output) => path.basename(output.path));
  const script = outputs.find((name) => name.endsWith(".js"));
  const styles = outputs.filter((name) => name.endsWith(".css"));
  if (!script || !styles.length) throw new Error(`verse card previews: expected a script and the lettering's styles from the build, got ${outputs.join(", ")}`);
  writeFileSync(path.join(temporary, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8">${styles.map((name) => `<link rel="stylesheet" href="/${name}">`).join("")}</head><body><script type="module" src="/${script}"></script></body></html>`, "utf8");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const { chromium } = await import("@playwright/test");
  browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1300, height: 700 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.makePreview === "function", null, { timeout: 15_000 });
  const shell = readFileSync(shellFile, "utf8");
  mkdirSync(path.join(site, PREVIEW_FOLDER), { recursive: true });
  mkdirSync(path.dirname(path.join(site, pageFile("x"))), { recursive: true });
  for (const passage of passages) {
    const result = await draw(page, previewSpec(passage));
    if ("error" in result) { problems.push(`${passage.key}: ${result.error}`); continue; }
    const bytes = Buffer.from(result.png, "base64");
    const problem = pictureProblem(bytes);
    if (problem) { problems.push(`${passage.key}: ${problem}`); continue; }
    const html = cardPageHtml(shell, passage); // first, so a shell that lost a picture tag leaves no picture behind
    writeFileSync(path.join(site, pictureFile(passage.key)), bytes);
    writeFileSync(path.join(site, pageFile(passage.key)), html, "utf8");
    made.push({ key: passage.key, bytes: bytes.length });
  }
  writeFileSync(path.join(site, PREVIEW_FOLDER, "index.json"), `${JSON.stringify({ version: PREVIEW_VERSION, keys: made.map((entry) => entry.key) }, null, 1)}\n`, "utf8");
} finally {
  await browser?.close();
  server.close();
  rmSync(temporary, { recursive: true, force: true });
}

const largest = made.reduce((top, entry) => (entry.bytes > top.bytes ? entry : top), { key: "none", bytes: 0 });
console.log(`verse card previews: ${made.length} of ${refs.length} passages made into ${path.relative(root, site) || site}; largest ${largest.key} at ${Math.round(largest.bytes / 1000)} KB; the release now holds about ${budget.total} files`);
for (const problem of problems) console.log(`  no preview: ${problem}`);
if (!made.length) process.exit(1);
