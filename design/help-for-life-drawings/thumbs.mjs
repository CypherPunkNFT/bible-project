// Gallery pictures for this mock-up's card only (design/_gallery/thumbs/life-drawings-light.png / -dark.png), taken the
// same way as scripts/mockup-gallery.mjs, which can stop on other mock-up folders that have no card yet.
// Needs the local preview (http://127.0.0.1:8931, or BASE=...).   node design/help-for-life-drawings/thumbs.mjs
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const design = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.BASE ?? "http://127.0.0.1:8931";
const id = "life-drawings";
const { chromium } = createRequire(path.join(design, "..", "package.json"))("playwright");
const browser = await chromium.launch({ channel: "msedge" });
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 0.5, reducedMotion: "reduce", colorScheme: theme });
    await context.addInitScript((value) => { try { localStorage.setItem("bp-theme", value); } catch { /* falls back to the colour scheme */ } }, theme);
    const page = await context.newPage();
    await page.goto(`${base}/mockups/help-for-life-drawings/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(800);
    // The picture shows the grid of drawings, not the page title.
    await page.evaluate(() => { document.querySelector(".grid")?.scrollIntoView({ block: "start" }); scrollBy(0, -70); });
    await page.waitForTimeout(300);
    const file = path.join(design, "_gallery", "thumbs", `${id}-${theme}.png`);
    await page.screenshot({ path: file });
    console.log(`thumbs: ${path.relative(design, file)}`);
    await context.close();
  }
} finally {
  await browser.close();
}
