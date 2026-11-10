// Birthday verses at release (docs/features/birthday-verses/design.md 8.2, 8.3): the ready-made copies of the 379 pages
// and each date's link-preview card, drawn by the same code that draws the cards visitors make:
//   bun scripts/birthday-verses/previews.mjs <release site folder>                       all 366 dates
//   bun scripts/birthday-verses/previews.mjs <release site folder> --dates 03-16,02-29   those dates only (to try it)
// Writes, inside that folder (never into git or public/): birthday-verses.html, birthday-verses/<month>.html,
// birthday-verses/<month>-<day>.html and cards/birthday/v1/<month>-<day>.png (1200 × 630, under 300 KB). Run it before
// the site's copy step, which then skips these addresses because a real file is there. Bundles the verse cards'
// preview page (scripts/verse-cards/preview-entry.ts) into a private temporary folder, serves it on a private port and
// draws each card in headless Edge. A date that cannot be drawn is named, and its page keeps the site's picture.
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allBirthdayDates, datePath, MONTH_SLUGS } from "../../src/data/birthday-verses/index.ts";
import { bookCode } from "../../src/lib/verse-card/links.ts";
import { fileBudget, pictureProblem } from "../verse-cards/preview-pages.ts";
import { BIRTHDAY_PREVIEW_FOLDER, datePage, dateWords, hubPage, monthPage, pageFile, passageOf, pictureFile, previewSpec, refOf } from "./pages.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const datesAt = args.indexOf("--dates");
const chosen = datesAt >= 0 ? (args[datesAt + 1] ?? "").split(",").filter(Boolean) : null;
const folders = args.filter((arg, index) => !arg.startsWith("--") && index !== datesAt + 1);
if (folders.length !== 1 || (chosen && !chosen.length)) {
  console.error("usage: bun scripts/birthday-verses/previews.mjs <release site folder> [--dates MM-DD,MM-DD]");
  process.exit(1);
}
const unknown = (chosen ?? []).filter((date) => !allBirthdayDates().includes(date));
if (unknown.length) {
  console.error(`birthday previews: not dates of the year: ${unknown.join(", ")} (write them as MM-DD, e.g. 03-16)`);
  process.exit(1);
}
const site = path.resolve(folders[0]);
const shellFile = path.join(site, "index.html");
if (!existsSync(shellFile)) {
  console.error(`birthday previews: ${shellFile} is missing; give the prepared release's site folder (it holds index.html)`);
  process.exit(1);
}

const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const catalog = readJson("data/catalog.json");
const shell = readFileSync(shellFile, "utf8");
const dates = chosen ?? allBirthdayDates();
const books = new Map();
const plainBook = (book) => {
  const code = bookCode(book);
  if (!books.has(code)) books.set(code, readJson(`data/plain/bsb/${code}.json`));
  return books.get(code);
};
const problems = [];
const days = [];
for (const date of dates) {
  const words = dateWords(plainBook(refOf(passageOf(date)).book), date);
  if (typeof words === "string") problems.push(words); else days.push({ date, words });
}

// Every page is built before anything is written, so a shell that lost a tag stops the run with nothing half-done.
const pages = [hubPage(shell, catalog), ...MONTH_SLUGS.map((_, index) => monthPage(shell, catalog, index + 1))];
const countFiles = (folder) => readdirSync(folder, { withFileTypes: true }).reduce((sum, entry) => sum + (entry.isDirectory() ? countFiles(path.join(folder, entry.name)) : 1), 0);
const planned = [...pages.map((page) => page.file), ...days.flatMap(({ date }) => [pictureFile(date), pageFile(datePath(date))])];
const budget = fileBudget(countFiles(site), planned.filter((file) => !existsSync(path.join(site, file))).length);
if (budget.problem) {
  console.error(`birthday previews: ${budget.problem}`);
  process.exit(1);
}

const temporary = mkdtempSync(path.join(os.tmpdir(), "birthday-previews-"));
const DRAW_LIMIT_MS = 30_000;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const server = http.createServer((request, response) => {
  try {
    const file = path.join(temporary, decodeURIComponent(new URL(request.url, "http://x").pathname));
    if (!file.startsWith(temporary + path.sep) || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  } catch (error) {
    console.warn(`birthday previews: refused a request for ${request.url}: ${error.message}`);
    response.writeHead(400).end();
  }
});
/** The card as a PNG from the page, or an error after DRAW_LIMIT_MS so one stuck drawing cannot hang a release. */
const draw = (page, spec) => {
  let timer;
  const late = new Promise((resolve) => { timer = setTimeout(() => resolve({ error: `not drawn within ${DRAW_LIMIT_MS / 1000} seconds` }), DRAW_LIMIT_MS); });
  return Promise.race([page.evaluate((card) => window.makePreview(card), spec), late]).finally(() => clearTimeout(timer));
};
const started = Date.now();
let browser;
const made = [];
try {
  const built = await Bun.build({ entrypoints: [path.join(root, "scripts/verse-cards/preview-entry.ts")], outdir: temporary, target: "browser", naming: { entry: "[name].[ext]", asset: "[name]-[hash].[ext]" } });
  if (!built.success) throw new Error(`birthday previews: the page did not compile:\n${built.logs.join("\n")}`);
  const outputs = built.outputs.map((output) => path.basename(output.path));
  const script = outputs.find((name) => name.endsWith(".js"));
  const styles = outputs.filter((name) => name.endsWith(".css"));
  if (!script || !styles.length) throw new Error(`birthday previews: expected a script and the lettering's styles from the build, got ${outputs.join(", ")}`);
  writeFileSync(path.join(temporary, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8">${styles.map((name) => `<link rel="stylesheet" href="/${name}">`).join("")}</head><body><script type="module" src="/${script}"></script></body></html>`, "utf8");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const { chromium } = await import("@playwright/test");
  browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1300, height: 700 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.makePreview === "function", null, { timeout: 15_000 });
  mkdirSync(path.join(site, BIRTHDAY_PREVIEW_FOLDER), { recursive: true });
  mkdirSync(path.join(site, "birthday-verses"), { recursive: true });
  for (const ready of pages) writeFileSync(path.join(site, ready.file), ready.html, "utf8");
  for (const { date, words } of days) {
    const result = await draw(page, previewSpec(catalog, date, words));
    if ("error" in result) { problems.push(`${date}: ${result.error}`); continue; }
    const bytes = Buffer.from(result.png, "base64");
    const problem = pictureProblem(bytes);
    if (problem) { problems.push(`${date}: ${problem}`); continue; }
    const ready = datePage(shell, catalog, date, words); // first, so a shell that lost a picture tag leaves no picture behind
    writeFileSync(path.join(site, pictureFile(date)), bytes);
    writeFileSync(path.join(site, ready.file), ready.html, "utf8");
    made.push({ date, bytes: bytes.length });
  }
} finally {
  await browser?.close();
  server.close();
  rmSync(temporary, { recursive: true, force: true });
}

const sizes = made.map((entry) => entry.bytes);
const largest = made.reduce((top, entry) => (entry.bytes > top.bytes ? entry : top), { date: "none", bytes: 0 });
console.log(`birthday previews: ${pages.length} hub and month pages and ${made.length} of ${dates.length} dates (page and picture) written into ${path.relative(root, site) || site} in ${((Date.now() - started) / 1000).toFixed(1)} s`);
if (made.length) console.log(`  pictures ${Math.round(Math.min(...sizes) / 1000)} to ${Math.round(Math.max(...sizes) / 1000)} KB; largest ${largest.date}; the release now holds about ${budget.total} files`);
for (const problem of problems) console.log(`  no preview: ${problem}`);
if (!made.length) process.exit(1);
