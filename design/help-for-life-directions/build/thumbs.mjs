// Gallery pictures for the Help for life cards only (design/_gallery/thumbs/<id>-light.png / -dark.png), taken the
// same way as scripts/mockup-gallery.mjs, which can stop on other mock-up folders that have no card yet.
// Needs the local preview (http://127.0.0.1:8931, or BASE=...).   node design/help-for-life-directions/build/thumbs.mjs
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const design = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = process.env.BASE ?? "http://127.0.0.1:8931";
const catalog = JSON.parse(await readFile(path.join(design, "catalog.json"), "utf8"));
const section = catalog.sections.find((s) => s.id === "resources-life");
if (!section) throw new Error("thumbs: no resources-life section in design/catalog.json");
const { chromium } = createRequire(path.join(design, "..", "package.json"))("playwright");
const browser = await chromium.launch({ channel: "msedge" });
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 0.5, reducedMotion: "reduce", colorScheme: theme });
    await context.addInitScript((value) => { try { localStorage.setItem("bp-theme", value); } catch { /* falls back to the colour scheme */ } }, theme);
    const page = await context.newPage();
    for (const card of section.cards) {
      await page.goto("about:blank");
      await page.goto(base + (card.shot ?? card.url), { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1200);
      // The picture shows the national lines, where the four directions differ.
      await page.evaluate(() => document.querySelector(".nat")?.scrollIntoView({ block: "start" }));
      await page.evaluate(() => scrollBy(0, -90));
      await page.waitForTimeout(300);
      const file = path.join(design, "_gallery", "thumbs", `${card.id}-${theme}.png`);
      await page.screenshot({ path: file });
      console.log(`thumbs: ${path.relative(design, file)}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
