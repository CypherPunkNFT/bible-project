// Shared browser helpers for the design review scripts (shots.mjs, checks.mjs): the installed Edge through the site's
// own Playwright, real scrollbars, a theme per context, and one "is the page ready" wait for every page type.
import { chromium } from "playwright";

export const BASE = process.env.BASE ?? "http://127.0.0.1:8931";

export function launch() {
  // Real users see scrollbars; Playwright hides them by default, which hides sideways-scroll problems.
  return chromium.launch({ channel: "msedge", ignoreDefaultArgs: ["--hide-scrollbars"] });
}

/** A browser context at one width and theme. The theme is set the way the site's own switch saves it. */
export async function newContext(browser, { width, theme }) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 860 : 1000 },
    deviceScaleFactor: 1,
    colorScheme: theme,
    reducedMotion: "reduce",
    hasTouch: width < 600,
  });
  await context.addInitScript((value) => { try { localStorage.setItem("bp-theme", value); } catch { /* storage blocked */ } }, theme);
  return context;
}

/** Open a page, retrying while the always-on preview restarts (other chats rebuild dist/). */
export async function open(page, url, { attempts = 4, quick = false } = {}) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await page.goto(BASE + url, { waitUntil: "load", timeout: 45_000 });
      if (response && response.status() >= 500) throw new Error(`status ${response.status()}`);
      await waitReady(page, quick);
      return;
    } catch (error) {
      last = error;
      await page.waitForTimeout(3000 * (attempt + 1));
    }
  }
  throw new Error(`could not load ${url} after ${attempts} tries: ${last?.message ?? last}`);
}

/** Ready = no loading placeholders left, fonts loaded, the network quiet (or 4 s passed), then one more beat.
 *  `quick` (the machine checks): wait at most 1.5 s for the network and skip the beat; screenshots wait the full time. */
export async function waitReady(page, quick = false) {
  await page.waitForFunction(() => {
    const main = document.querySelector("main") ?? document.body;
    if (!main || main.innerText.trim().length < 20) return false;
    const busy = [...document.querySelectorAll('[role="status"], .animate-pulse')].some((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && (/loading/i.test(el.textContent ?? "") || el.classList.contains("animate-pulse") || el.getAttribute("aria-label") === "Loading");
    });
    return !busy;
  }, null, { timeout: 15_000 }).catch(() => null);
  await page.evaluate(() => document.fonts.ready).catch(() => null);
  await page.waitForLoadState("networkidle", { timeout: quick ? 1500 : 4000 }).catch(() => null);
  if (!quick) await page.waitForTimeout(350);
}

/** Scroll to the bottom and back so anything drawn on first sight (lazy images, charts) is drawn. */
export async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.max(400, window.innerHeight * 0.9);
    for (let y = 0; y < document.documentElement.scrollHeight && y < 40_000; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

/** Run `work` over `items` with at most `limit` running at once. */
export async function pool(items, limit, work) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await work(items[index], index);
    }
  });
  await Promise.all(runners);
}
