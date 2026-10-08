// Design review screenshots: every sample in content/design-review/templates.json at desktop 1440 and phone 400, light
// and dark: the whole page (up to MAX_HEIGHT), a crop of the page type's signature section (or the first screen), and a
// small thumbnail; each with a perceptual hash so the board can tell when a page's look has changed.
// Run: bun run review:shots   (ONLY=<template id or id/variant> to redo part; BASE=<site> to point elsewhere)
// Images go to design/review/ (not in git, never released); the manifest to content/design-review/shots.json.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, launch, newContext, open, pool, scrollThrough } from "./browser.mjs";

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(SITE, "design", "review");
const MANIFEST = path.join(SITE, "content", "design-review", "shots.json");
const MAX_HEIGHT = 9000;
const WIDTHS = { desktop: 1440, phone: 400 };
const ONLY = process.env.ONLY ?? "";

const inventory = JSON.parse(readFileSync(path.join(SITE, "content", "design-review", "templates.json"), "utf8"));
const old = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { images: {} };
// REVIEW_COMMIT: the commit the site at BASE was built from (a clean worktree), when it is not this folder's HEAD.
const commit = process.env.REVIEW_COMMIT ?? execFileSync("git", ["rev-parse", "--short=8", "HEAD"], { cwd: SITE, encoding: "utf8" }).trim();

const jobs = inventory.templates.flatMap((t) => t.variants.flatMap((v) => v.samples.map((s) => ({ t, v, s, key: `${t.id}/${v.id}/${s.id}` }))))
  .filter((j) => !ONLY || ONLY.split(",").some((o) => j.key === o || j.key.startsWith(o + "/")));

/** In the page: a 64-bit difference hash (9×8 grey grid) and a 480-px-wide JPEG thumbnail of the top of the image. */
async function hashAndThumb(page, buffer) {
  return page.evaluate(async (b64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${b64}`;
    await image.decode();
    const grid = document.createElement("canvas");
    grid.width = 9; grid.height = 8;
    const g = grid.getContext("2d");
    g.drawImage(image, 0, 0, 9, 8);
    const px = g.getImageData(0, 0, 9, 8).data;
    const grey = (x, y) => { const i = (y * 9 + x) * 4; return px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114; };
    let hex = "";
    for (let y = 0; y < 8; y++) {
      let nibbleA = 0, nibbleB = 0;
      for (let x = 0; x < 4; x++) nibbleA = (nibbleA << 1) | (grey(x, y) > grey(x + 1, y) ? 1 : 0);
      for (let x = 4; x < 8; x++) nibbleB = (nibbleB << 1) | (grey(x, y) > grey(x + 1, y) ? 1 : 0);
      hex += nibbleA.toString(16) + nibbleB.toString(16);
    }
    const width = 480, height = Math.min(Math.round(width * 1.6), Math.round(image.height * width / image.width));
    const thumb = document.createElement("canvas");
    thumb.width = width; thumb.height = height;
    thumb.getContext("2d").drawImage(image, 0, 0, image.width, height * image.width / width, 0, 0, width, height);
    return { hash: hex, thumb: thumb.toDataURL("image/jpeg", 0.82).split(",")[1] };
  }, buffer.toString("base64"));
}

const browser = await launch();
const hasher = await (await browser.newContext()).newPage();
await hasher.setContent("<!doctype html><title>hash</title>");
let hashQueue = Promise.resolve();
const hashOne = (buffer) => (hashQueue = hashQueue.then(() => hashAndThumb(hasher, buffer)));

const images = { ...old.images };
const failures = [];
let done = 0;
const views = jobs.flatMap((job) => Object.entries(WIDTHS).flatMap(([name, width]) => ["light", "dark"].map((theme) => ({ ...job, name, width, theme }))));
console.log(`${jobs.length} samples × 4 views = ${views.length} screenshots from ${BASE}`);

const contexts = {};
for (const [name, width] of Object.entries(WIDTHS)) for (const theme of ["light", "dark"]) contexts[`${name}-${theme}`] = await newContext(browser, { width, theme });

await pool(views, 4, async (view) => {
  const viewKey = `${view.name}-${view.theme}`;
  const page = await contexts[viewKey].newPage();
  const base = path.join(view.t.id, view.v.id, `${view.s.id}-${view.width}-${view.theme}`);
  try {
    await open(page, view.s.url);
    await scrollThrough(page);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    mkdirSync(path.join(OUT, view.t.id, view.v.id), { recursive: true });
    const full = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: view.width, height: Math.min(height, MAX_HEIGHT) }, animations: "disabled" });
    writeFileSync(path.join(OUT, base + ".png"), full);
    let crop = null, cropKind = "first-screen";
    const selector = view.t.signature?.selector;
    const target = selector ? page.locator(selector).first() : null;
    if (target && (await target.count()) && (await target.isVisible())) {
      const box = await target.boundingBox();
      if (box && box.height > 20) {
        writeFileSync(path.join(OUT, base + "-crop.png"), await target.screenshot({ animations: "disabled" }));
        crop = base + "-crop.png";
        cropKind = "signature";
      }
    }
    if (!crop) {
      writeFileSync(path.join(OUT, base + "-crop.png"), await page.screenshot({ animations: "disabled" }));
      crop = base + "-crop.png";
    }
    const { hash, thumb } = await hashOne(full);
    writeFileSync(path.join(OUT, base + "-thumb.jpg"), Buffer.from(thumb, "base64"));
    const slash = (p) => p.split(path.sep).join("/");
    (images[view.key] ??= {})[viewKey] = { full: slash(base + ".png"), crop: slash(crop), cropKind, thumb: slash(base + "-thumb.jpg"), hash, height: Math.min(height, MAX_HEIGHT), clipped: height > MAX_HEIGHT };
  } catch (error) {
    failures.push(`${view.key} ${viewKey}: ${error.message}`);
    console.error(`could not screenshot ${view.s.url} (${viewKey}): ${error.message}`);
  } finally {
    await page.close();
    if (++done % 40 === 0) console.log(`${done} of ${views.length}`);
  }
});
await browser.close();

// Drop entries for samples that are no longer in the inventory (a sample rule now picks another page).
const current = new Set(inventory.templates.flatMap((t) => t.variants.flatMap((v) => v.samples.map((s) => `${t.id}/${v.id}/${s.id}`))));
for (const key of Object.keys(images)) if (!current.has(key)) delete images[key];
writeFileSync(MANIFEST, JSON.stringify({ schema: 1, commit, takenAt: new Date().toISOString(), base: BASE, images }, null, 1) + "\n", "utf8");
console.log(`${views.length - failures.length} of ${views.length} screenshots taken${failures.length ? `; failed:\n  ${failures.join("\n  ")}` : ""}`);
process.exit(failures.length ? 1 : 0);
