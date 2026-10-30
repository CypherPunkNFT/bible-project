// Cuts the studies the standard rates best into section pictures for the visual inventory (design/study-visual-inventory/).
// Needs the local preview running (http://127.0.0.1:8931, or BASE=...).
//   node scripts/study-inventory-capture.mjs [page-id ...]
// Writes shots/<page>-<nn>-<theme>.png and sections.json (what was found on each page, with its size and heading).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "design", "study-visual-inventory");
const base = process.env.BASE ?? "http://127.0.0.1:8931";
const MAX_HEIGHT = 1700; // a longer section is cut here; the picture is a sample of it, and sections.json records its real height

const PAGES = [
  ["creeds", "/study/creeds"],
  ["parables", "/study/gospels?guide=parables"],
  ["shape", "/study/structure"],
  ["connections", "/study/references"],
  ["letters", "/study/letters"],
  ["long-memory", "/study/long-memory"],
  ["people", "/study/people"],
  ["moses", "/people/moses"],
  ["witnesses", "/study/surviving-witnesses"],
  ["canon", "/study/how-the-canon-took-shape"],
  ["manuscripts", "/study/manuscripts"],
  ["daily-life", "/mockups/faith-in-daily-life-directions/"],
  ["pressure", "/mockups/faith-under-pressure-directions/"],
];

// The block belonging to each heading: climb from it while the parent holds no other section heading.
function findSections() {
  const main = document.querySelector("main") ?? document.body;
  const headings = [...main.querySelectorAll("h1, h2")].filter((el) => el.getBoundingClientRect().height > 0);
  const blocks = [];
  for (const heading of headings) {
    let block = heading;
    while (block.parentElement && block.parentElement !== main && block.parentElement.querySelectorAll("h1, h2").length === 1) block = block.parentElement;
    if (blocks.includes(block)) continue;
    const box = block.getBoundingClientRect();
    if (box.height < 60) continue;
    blocks.push(block);
  }
  // A page with no h1 or h2 in its main area (Moses): take the largest blocks directly under it instead.
  if (!blocks.length) {
    let holder = main;
    const tall = (el) => [...el.children].filter((child) => child.getBoundingClientRect().height >= 120);
    while (tall(holder).length === 1) holder = tall(holder)[0];
    blocks.push(...tall(holder));
  }
  return blocks.map((block, index) => {
    block.setAttribute("data-inventory", String(index));
    const box = block.getBoundingClientRect();
    return {
      index,
      heading: (block.querySelector("h1, h2, h3, h4")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      tag: block.tagName.toLowerCase(),
      className: String(block.className).slice(0, 80),
      id: block.id,
      top: Math.round(box.top + scrollY),
      width: Math.round(box.width),
      height: Math.round(box.height),
      svgs: block.querySelectorAll("svg").length,
      canvases: block.querySelectorAll("canvas").length,
      images: block.querySelectorAll("img").length,
      buttons: block.querySelectorAll("button, a[href], summary, [role=tab]").length,
    };
  });
}

// A page whose blocks cannot be told apart (Moses) is cut into even slices of the whole page.
async function sliceWholePage(page, id, theme, total) {
  const sections = [];
  for (let index = 0, y = 0; y < total; index += 1, y += MAX_HEIGHT) {
    const shot = `${id}-${String(index + 1).padStart(2, "0")}`;
    const height = Math.min(MAX_HEIGHT, total - y);
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(out, "shots", `${shot}-${theme}.png`), type: "png", fullPage: true, clip: { x: 0, y, width: 1440, height } });
    sections.push({ index, heading: `Slice ${index + 1}`, top: y, height, shot, cut: false });
  }
  return sections;
}

async function capturePage(page, id, address, theme) {
  await page.goto(base + address, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200); // fonts and drawings settle
  // Walk down the page so anything drawn on arrival is drawn, then come back.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 700) { await page.evaluate((to) => window.scrollTo(0, to), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  // The sticky site header and the floating edit button would otherwise land on top of every picture.
  await page.evaluate(() => {
    for (const el of document.body.querySelectorAll("*")) {
      const { position } = getComputedStyle(el);
      if (position === "sticky") el.style.position = "relative";
      else if (position === "fixed") el.style.visibility = "hidden";
    }
  });
  let sections = await page.evaluate(findSections);
  if (!sections.length) sections = await sliceWholePage(page, id, theme, total);
  for (const section of sections) {
    if (section.shot) continue;
    const clipHeight = Math.min(section.height, MAX_HEIGHT);
    const name = `${id}-${String(section.index + 1).padStart(2, "0")}-${theme}.png`;
    const block = page.locator(`[data-inventory="${section.index}"]`);
    await block.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const box = await block.boundingBox();
    if (!box) { console.error(`${id}: section ${section.index} "${section.heading}" has no box in ${theme}; skipped`); continue; }
    await page.screenshot({ path: path.join(out, "shots", name), type: "png", fullPage: true, clip: { x: Math.max(0, box.x), y: box.y + await page.evaluate(() => scrollY), width: Math.min(box.width, 1440), height: clipHeight } });
    section.shot = name.replace(`-${theme}.png`, "");
    section.cut = section.height > MAX_HEIGHT;
  }
  return { id, address, pageHeight: total, sections };
}

const wanted = new Set(process.argv.slice(2));
const unknown = [...wanted].filter((id) => !PAGES.some(([pageId]) => pageId === id));
if (unknown.length) { console.error(`Unknown page ids: ${unknown.join(", ")}. Known: ${PAGES.map(([id]) => id).join(", ")}`); process.exit(1); }
await mkdir(path.join(out, "shots"), { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const found = {};
const failures = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", colorScheme: theme });
    await context.addInitScript((value) => { try { localStorage.setItem("bp-theme", value); } catch { /* the page falls back to the colour scheme */ } }, theme);
    const page = await context.newPage();
    for (const [id, address] of PAGES) {
      if (wanted.size && !wanted.has(id)) continue;
      try {
        const result = await capturePage(page, id, address, theme);
        if (theme === "light") found[id] = result;
        console.log(`${theme} ${id}: ${result.sections.length} sections, page ${result.pageHeight}px`);
      } catch (error) {
        failures.push(`${id} (${theme}): ${error.message.split("\n")[0]}`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
const file = path.join(out, "sections.json");
let earlier = {};
try { earlier = JSON.parse(await readFile(file, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
await writeFile(file, JSON.stringify({ ...earlier, ...found }, null, 1), "utf8");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
