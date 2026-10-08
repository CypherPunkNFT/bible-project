// Refreshes the design gallery at /mockups/ (design/index.html, design/catalog.json):
//   1. checks every mock-up folder in design/ has a card in catalog.json (fails with the missing names);
//   2. takes a light and a dark picture of each card's mock-up for the gallery (design/_gallery/thumbs/).
// Needs the local preview running (http://127.0.0.1:8931, or BASE=...).   node scripts/mockup-gallery.mjs [--check]
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const design = path.join(root, "design");
const base = process.env.BASE ?? "http://127.0.0.1:8931";
const SHARED = new Set(["_gallery", "letters-shared"]); // helpers used by mock-ups, not mock-ups themselves

const catalog = JSON.parse(await readFile(path.join(design, "catalog.json"), "utf8"));
const cards = catalog.sections.flatMap((section) => section.cards);
const listed = new Set(cards.map((card) => card.url.match(/^\/mockups\/([^/#?]+)/)?.[1]).filter(Boolean));
const folders = (await readdir(design, { withFileTypes: true })).filter((e) => e.isDirectory() && !SHARED.has(e.name)).map((e) => e.name);
const missing = folders.filter((name) => !listed.has(name));
const ids = cards.map((card) => card.id);
const duplicate = ids.filter((id, i) => ids.indexOf(id) !== i);
if (missing.length || duplicate.length) {
  if (missing.length) console.error(`Mock-up folders with no card in design/catalog.json: ${missing.join(", ")}`);
  if (duplicate.length) console.error(`Card ids used twice in design/catalog.json: ${duplicate.join(", ")}`);
  process.exit(1);
}
console.log(`catalog: ${cards.length} cards in ${catalog.sections.length} sections; all ${folders.length} mock-up folders listed`);
if (process.argv.includes("--check")) process.exit(0);

const { chromium } = await import("@playwright/test");
const browser = await chromium.launch({ channel: "msedge" });
const out = path.join(design, "_gallery", "thumbs");
await mkdir(out, { recursive: true });
const failures = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 0.5, reducedMotion: "reduce", colorScheme: theme });
    await context.addInitScript((value) => { try { localStorage.setItem("bp-theme", value); } catch { /* the page falls back to the colour scheme */ } }, theme);
    const page = await context.newPage();
    for (const card of cards) {
      try {
        await page.goto(base + (card.shot ?? card.url), { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1200); // fonts and drawings settle
        await page.evaluate(() => window.scrollTo(0, 0)); // some mock-ups scroll to their working area on load
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(out, `${card.id}-${theme}.png`) });
      } catch (error) {
        failures.push(`${card.id} (${theme}): ${error.message.split("\n")[0]}`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(`pictures: ${cards.length * 2 - failures.length} of ${cards.length * 2} written to design/_gallery/thumbs/`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
