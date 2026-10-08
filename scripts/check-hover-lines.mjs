// Hover lines never jump (owner, 2026-10-08). Opens every people page (rulers, apostles, prophets) and the Letters
// pages at desktop and phone width, points at every pointable thing (bars, dots, lines, pins, links in figures) and
// reports any hover line whose height changes, plus any hover line not built on StableTip (src/components/StableTip.tsx).
//   node scripts/check-hover-lines.mjs                 # against the local preview (http://127.0.0.1:8931)
//   BASE=https://bibleproject.io node scripts/check-hover-lines.mjs
//   ONLY=nebuchadnezzar node scripts/check-hover-lines.mjs   # pages whose address contains this text
// Exit code 1 when any page jumps. About 15 minutes for all ~400 page views.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const base = process.env.BASE ?? "http://127.0.0.1:8931";
const index = JSON.parse(readFileSync(new URL("../src/data/people-pages/index.json", import.meta.url), "utf8"));
const pages = [
  ...index.rulers.map((r) => `/people/${r.id}/rule`),
  ...index.apostles.map((a) => `/people/${a.id}/mission`),
  ...(index.prophets ?? []).map((p) => `/people/${p.id}/word`),
  "/study/letters", "/study/letters/paul", "/study/letters/hebrews", "/study/letters/james-peter-and-jude", "/study/letters/the-letters-of-john",
];
const only = process.env.ONLY ? pages.filter((p) => p.includes(process.env.ONLY)) : pages;

const probe = async () => {
  const tips = [...document.querySelectorAll(".stable-tip, .lg-tip, .pp-lane-tip, .pp-outline-tip")];
  const heights = () => tips.map((t) => t.getBoundingClientRect().height);
  const start = heights();
  const targets = [...document.querySelectorAll(
    ".pp-lane-track a, .pp-strip a, .pp-strip [role=button], .pp-seq a, .pp-gstrip a, figure a, figure button, figure [role=button], figure [tabindex='0'], .lg-figure [role=button], .lg-story button, .lg-outline a, .lg-bar a, .pp-sync-hit")];
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const problems = [];
  const legacy = tips.filter((t) => !t.classList.contains("stable-tip")).length;
  for (const el of targets) {
    if (el.matches(".pp-sync-hit")) el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body }));
    else el.focus();
    await frame();
    const now = heights();
    now.forEach((h, i) => { if (Math.abs(h - start[i]) > 0.5) problems.push(`${tips[i].className} ${start[i].toFixed(1)}→${h.toFixed(1)} on "${(el.getAttribute("aria-label") || el.textContent || "").slice(0, 50)}"`); });
    if (el.matches(".pp-sync-hit")) el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    else el.blur();
  }
  return { tips: tips.length, legacy, targets: targets.length, problems: [...new Set(problems)].slice(0, 6) };
};

const browser = await chromium.launch({ channel: "msedge" });
let bad = 0, checked = 0, hovers = 0;
for (const width of [1440, 400]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  for (const path of only) {
    let loaded = false;
    for (let attempt = 0; attempt < 4 && !loaded; attempt++) {
      try { await page.goto(base + path, { waitUntil: "networkidle" }); loaded = true; }
      catch { await page.waitForTimeout(3000); }
    }
    if (!loaded) { bad++; console.log(`${width} ${path}: could not load`); continue; }
    await page.waitForSelector(".lg-tip, .stable-tip", { timeout: 8000 }).catch(() => null);
    await page.waitForTimeout(300);
    const r = await page.evaluate(probe);
    checked++; hovers += r.targets;
    if (r.problems.length || r.legacy) { bad++; console.log(`${width} ${path}: ${r.legacy} legacy tip(s); ${r.problems.join(" | ")}`); }
  }
  await page.close();
}
await browser.close();
console.log(`pages checked: ${checked} (${only.length} × 2 widths), things pointed at: ${hovers}, pages with a jump: ${bad}`);
process.exit(bad ? 1 : 0);
