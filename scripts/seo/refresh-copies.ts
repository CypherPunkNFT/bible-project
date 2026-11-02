// Brings the ready-made copies of a few pages up to date with what the live site now shows, in a release's site folder and
// in content/seo/pages for the next full release. Run by quick-release.mjs after a publish:
//   bun scripts/seo/refresh-copies.ts <site folder> <page> [<page>...]
// A page with no ready-made copy (a page type that has none) is skipped.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { readyMade, readyMadeFile } from "./build.ts";
import { capture, captureFile } from "./capture.ts";

const [site, ...wanted] = process.argv.slice(2);
if (!site || !wanted.length) throw new Error(`refresh copies: give a site folder and at least one page; got ${process.argv.slice(2).join(" ") || "nothing"}`);
const shell = readFileSync(path.join(site, "index.html"), "utf8");
const listed = new Set(readFileSync(path.join(site, "..", "seo-files.txt"), "utf8").split(/\r?\n/));
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" })).newPage();
  for (const pagePath of wanted) {
    const file = readyMadeFile(site, pagePath);
    if (!listed.has(path.relative(site, file).split(path.sep).join("/"))) { console.log(`${pagePath}: has no ready-made copy`); continue; }
    const result = await capture(page, pagePath);
    if (typeof result === "string") throw new Error(`${pagePath} could not be captured: ${result}`);
    writeFileSync(captureFile(pagePath), JSON.stringify(result, null, 1) + "\n", "utf8");
    writeFileSync(file, readyMade(shell, result), "utf8");
    console.log(`${pagePath}: ready-made copy refreshed`);
  }
} finally {
  await browser.close();
}
