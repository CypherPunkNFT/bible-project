// Browser check for /study/passage-through-manuscripts (approved mock-up D). Run against the local preview of dist/:
//   node scripts/check-passage-manuscripts.mjs [base-url]
// At 1440 and 400 px, light and dark: no console or page errors, no sideways scroll, the standard study heading, every
// section drawn, and every interaction clicked through (scenes, desk toggles and witnesses, apparatus, lenses, endings,
// the four kinds, the switch with its hover preview, "Reading the marks", GA 304, the quiz, the editions, the CBGM
// diagram, the cabinet's record sheet and the side dots). Screenshots go to .local/passage-qa/.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:8931";
const url = `${base}/study/passage-through-manuscripts`;
const out = ".local/passage-qa";
fs.mkdirSync(out, { recursive: true });
const SECTIONS = ["a-landing", "b-prologue", "b-gal", "b-rom", "b-mark", "d-gaps", "a-editions", "a-cabinet", "a-close"];
const browser = await chromium.launch({ channel: "msedge" });
let failures = 0;

async function run(width, theme) {
  const tag = `${width}-${theme}`, errors = [];
  const page = await browser.newPage({ viewport: { width, height: width > 600 ? 1000 : 860 }, colorScheme: theme });
  await page.addInitScript((t) => { try { localStorage.setItem("bp-theme", t); } catch { /* the check falls back to the emulated scheme */ } }, theme);
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  const step = async (name, fn) => {
    try { await fn(); console.log(`PASS ${tag} ${name}`); } catch (error) { failures++; console.log(`FAIL ${tag} ${name}: ${error.message}`); }
  };
  const noSideways = async (where) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `sideways scroll ${where}`);

  await page.goto(url);
  await page.locator(".pm-root h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  await step("heading: trail, page words, title", async () => {
    const heading = await page.evaluate(() => {
      const trail = document.querySelector(".pm-intro .study-trail"), words = trail?.nextElementSibling, h1 = words?.nextElementSibling;
      return { trail: trail?.textContent, words: words?.textContent, h1: h1?.tagName, wordsColor: words && getComputedStyle(words).textTransform };
    });
    assert.match(heading.trail ?? "", /Academic studies.*formation & transmission.*02/);
    assert.match(heading.words ?? "", /Variant readings/);
    assert.equal(heading.h1, "H1");
    assert.equal(heading.wordsColor, "uppercase");
  });
  await step("every section drawn, none failed", async () => {
    for (const id of SECTIONS) assert.equal(await page.locator(`#${id}`).count(), 1, `#${id}`);
    assert.equal(await page.locator(".t-failed").count(), 0, "a section says it could not be drawn");
  });
  await step("no sideways scroll at load", () => noSideways("at load"));
  await page.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true });

  await step("chapter I: desk toggle, witness evidence, threads clear of text", async () => {
    const gal = page.locator("#b-gal");
    await gal.scrollIntoViewIfNeeded();
    assert.ok(await gal.locator(".dk-thread").count() >= 3, "threads drawn");
    await gal.getByRole("button", { name: "Word order", exact: true }).click();
    assert.match(await gal.locator(".dk-wits").innerText(), /ἡμῶν καὶ κυρίου/);
    await gal.locator('[data-row="p46"]').click();
    assert.match(await gal.locator(".dk-below").innerText(), /Codex page 168/);
    assert.ok(await gal.locator(".dk-thread.is-on").count() === 1, "chosen thread lit");
    // Sample every thread and test each point against the rectangles of every line of lettering in the witness column.
    const overlap = await gal.evaluate((sec) => {
      const svg = sec.querySelector(".dk-threads"), box = svg.getBoundingClientRect();
      const rects = [...sec.querySelectorAll(".dk-wits .dk-line, .dk-wits .dk-who, .dk-wits .dk-gloss, .dk-wits .dk-sig")].flatMap((n) => {
        const range = document.createRange(); range.selectNodeContents(n); return [...range.getClientRects()].filter((r) => r.width > 0);
      });
      for (const path of sec.querySelectorAll(".dk-thread")) {
        const length = path.getTotalLength();
        for (let s = 0; s <= length; s += 3) {
          const p = path.getPointAtLength(s), x = box.left + p.x, y = box.top + p.y;
          const hit = rects.find((r) => x > r.left && x < r.right && y > r.top && y < r.bottom);
          if (hit) return `thread ${path.dataset.rowThread} crosses text at ${Math.round(x)},${Math.round(y)}`;
        }
      }
      return null;
    });
    assert.equal(overlap, null);
  });
  await step("chapter I: scenes slide, stage height constant, apparatus decodes", async () => {
    const gal = page.locator("#b-gal");
    await page.waitForTimeout(800); // the stage eases to a new height when the chosen witness adds its evidence
    const h0 = await gal.locator(".bc-stage").evaluate((s) => s.offsetHeight);
    await gal.locator('[data-scene="1"]').click();
    await page.waitForTimeout(800);
    await gal.locator('[data-part="2"]').click();
    assert.match(await gal.locator(".cr-app-note").innerText(), /separator/i);
    assert.equal(await gal.locator(".bc-stage").evaluate((s) => s.offsetHeight), h0, "stage height changed between scenes");
    await gal.getByRole("button", { name: "Next scene" }).click();
    await page.waitForTimeout(800);
    assert.equal(await gal.locator('[data-scene="2"]').getAttribute("aria-pressed"), "true");
    assert.equal(await gal.locator(".bc-scene[data-i='2'] .pm-reason-step").count(), 3);
  });
  await step("chapter II: hands toggle and three lenses", async () => {
    const rom = page.locator("#b-rom");
    await rom.scrollIntoViewIfNeeded();
    await rom.getByRole("button", { name: "Corrected", exact: true }).click();
    assert.match(await rom.locator(".dk-wits").innerText(), /א¹/);
    await rom.locator('[data-scene="1"]').click();
    await page.waitForTimeout(800);
    await rom.getByRole("button", { name: "Paul’s argument" }).click();
    assert.match(await rom.locator(".cr-take").innerText(), /Intrinsic probability/);
  });
  await step("chapter III: lost leaf, endings, strip witness opens record", async () => {
    const mark = page.locator("#b-mark");
    await mark.scrollIntoViewIfNeeded();
    assert.equal(await mark.locator(".dk-cut").count(), 1, "P45's thread stops short");
    await mark.locator('[data-scene="1"]').click();
    await page.waitForTimeout(800);
    await mark.getByRole("button", { name: "Longer Ending" }).click();
    assert.match(await mark.locator(".cr-comment").innerText(), /narrative restarts/);
    await mark.locator(".st-bar em").first().click();
    await page.locator(".ms-sheet.open").waitFor();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });
  await step("05: switch preview, restoration, reading the marks", async () => {
    const gaps = page.locator("#d-gaps");
    await gaps.scrollIntoViewIfNeeded();
    if (width > 600) {
      await gaps.locator(".d-edge-switch").hover();
      assert.ok(await gaps.locator(".d-edge.is-preview").count() === 1, "hover previews");
      await page.mouse.move(0, 0);
    }
    await gaps.locator(".d-edge-switch").click();
    assert.match(await gaps.locator(".ed-say").innerText(), /supplied, not surviving ink/);
    await gaps.locator('[data-mark="ed"]').click();
    assert.equal(await gaps.locator(".d-edge").getAttribute("data-mark"), "ed");
    await page.screenshot({ path: `${out}/${tag}-edge.png` });
  });
  await step("05: the other three kinds", async () => {
    const gaps = page.locator("#d-gaps");
    await gaps.locator('[data-kind="unfinished"]').click();
    await gaps.getByRole("button", { name: /Reveal the surrounding evidence/ }).click();
    assert.match(await gaps.locator(".g3-find").innerText(), /Houghton/);
    await gaps.locator('[data-kind="lost"]').click();
    await gaps.getByRole("button", { name: /cannot witness/ }).click();
    assert.match(await gaps.locator(".qz-say").innerText(), /Missing material/);
    await gaps.locator('[data-kind="related"]').click();
    assert.equal(await gaps.locator(".cp.is-traced").count(), 1);
  });
  await step("06: editions lane and CBGM diagram", async () => {
    const eds = page.locator("#a-editions");
    await eds.scrollIntoViewIfNeeded();
    await eds.locator('.eds-step[data-step="3"] i').click();
    assert.match(await eds.locator(".eds-say").innerText(), /ECM Mark/);
    await eds.locator('[data-node="1891"]').click();
    assert.match(await eds.locator(".cb-say").innerText(), /Mixed ancestry/);
    assert.ok(await eds.locator(".cb-edge.is-on").count() >= 3);
  });
  await step("07: cabinet opens a record sheet with its picture", async () => {
    const cab = page.locator("#a-cabinet");
    await cab.scrollIntoViewIfNeeded();
    assert.equal(await cab.locator(".a-cab-item").count(), 6);
    await cab.locator('[data-open="Q152962"]').click();
    await page.locator(".ms-sheet.open").waitFor();
    assert.match(await page.locator(".ms-sheet.open h2").innerText(), /Sinaiticus/);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${tag}-sheet.png` });
    await page.locator(".ms-sheet-close").click();
    await page.waitForTimeout(500);
  });
  await step("side dots follow the page", async () => {
    await page.locator("#a-close").scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    assert.match(await page.locator(".mg-rail a[aria-current]").getAttribute("href"), /#a-(close|cabinet)/);
  });
  await step("no sideways scroll after interactions", () => noSideways("after interactions"));
  await step("no focus outlines on a clicked control", async () => {
    await page.locator("#d-gaps [data-kind='restore']").click();
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert.ok(outline === "none" || outline === "", `outline ${outline}`);
  });
  await step("no console or page errors", () => assert.deepEqual(errors, []));
  await page.close();
}

try {
  for (const width of [1440, 400]) for (const theme of ["light", "dark"]) await run(width, theme);
} finally {
  await browser.close();
}
console.log(failures ? `${failures} check(s) failed` : "all checks passed");
process.exit(failures ? 1 : 0);
