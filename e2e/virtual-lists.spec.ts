import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// The long lists drawn a window of rows at a time (owner, 2026-10-29): the Scholars catalogue's card view and the
// library's collection list on /teachers/works keep the rows on screen plus 50 above and 50 below, counted in rows
// whatever the cards per row; rows further out are released and drawn again on the way back; focus is never dropped.
// Run: node node_modules/@playwright/test/cli.js test -c e2e/virtual-lists.config.ts

const BUFFER = 50;
interface Collection { id: string; source: string; readable: number }
const COLLECTIONS = JSON.parse(readFileSync("public/content/teacher-library/collections/index.json", "utf8")) as Collection[];
// The Text Creation Partnership's readable texts: the longest collection whose rows all carry a single language.
const TCP = COLLECTIONS.find(c => c.source === "Text Creation Partnership official public distribution")!;
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 760;

/** Which catalogue rows are drawn and which are on screen, read from the page. */
function cardWindow(page: Page) {
  return page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>(".tp-scholars .cat-scroll")!, grid = scroller.querySelector(".cat-grid")!;
    const top = scroller.getBoundingClientRect().top + scroller.clientTop, bottom = top + scroller.clientHeight;
    const items = Array.from(grid.querySelectorAll<HTMLElement>(":scope > [data-row]:not([data-pinned])"));
    const rows = items.map(e => Number(e.dataset.row));
    const seen = items.filter(e => { const r = e.getBoundingClientRect(); return r.bottom > top + 1 && r.top < bottom - 1; }).map(e => Number(e.dataset.row));
    return { columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length, cards: items.length, start: Math.min(...rows), end: Math.max(...rows), first: Math.min(...seen), last: Math.max(...seen) };
  });
}
/** The same for the collection list, which scrolls with the page. */
function listWindow(page: Page) {
  return page.evaluate(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".acq-collection-rows > li[data-row]:not([data-pinned])"));
    const rows = items.map(e => Number(e.dataset.row));
    const seen = items.filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 1 && r.top < innerHeight - 1; }).map(e => Number(e.dataset.row));
    return { items: items.length, start: Math.min(...rows), end: Math.max(...rows), first: Math.min(...seen), last: Math.max(...seen) };
  });
}
const frames = (page: Page) => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
/** Buffer of 50 rows above and below the visible rows, give or take the one row on the edge of the view. */
function expectBuffer(w: { start: number; end: number; first: number; last: number }, rows: number) {
  expect(w.first - w.start).toBeGreaterThanOrEqual(Math.min(w.first, BUFFER - 1));
  expect(w.first - w.start).toBeLessThanOrEqual(BUFFER + 1);
  expect(w.end - w.last).toBeGreaterThanOrEqual(Math.min(rows - 1 - w.last, BUFFER - 1));
  expect(w.end - w.last).toBeLessThanOrEqual(BUFFER + 1);
}

test.describe("Scholars catalogue card view", () => {
  let TOTAL = 0;
  test.beforeEach(async ({ page }) => {
    await page.goto("/teachers/scholars#catalogue");
    // The catalogue section mounts as it nears the screen; the whole catalogue is listed with no filter.
    await expect(async () => {
      await page.locator("#catalogue").scrollIntoViewIfNeeded();
      await expect(page.locator(".cat-count")).toHaveText(/^([\d,]+) of \1 contributors$/, { timeout: 2_000 });
    }).toPass({ timeout: 90_000 });
    TOTAL = Number((await page.locator(".cat-count b").textContent())!.replace(/,/g, ""));
    expect(TOTAL).toBeGreaterThan(1000);
    await page.locator(".cat-scroll").scrollIntoViewIfNeeded();
    await expect(page.locator(".cat-grid > .cat-card").first()).toBeVisible();
  });

  test("draws the visible rows plus 50 above and 50 below, whatever the cards per row", async ({ page }) => {
    const scroller = page.locator(".cat-scroll");
    await frames(page);
    let w = await cardWindow(page);
    const rows = Math.ceil(TOTAL / w.columns);
    if (isPhone(page)) expect(w.columns).toBe(1); else expect(w.columns).toBeGreaterThanOrEqual(3);
    expect(w.start).toBe(0);
    expectBuffer(w, rows);
    expect(w.cards).toBe((w.end + 1) * w.columns);
    expect(w.cards).toBeLessThan(TOTAL);
    const firstId = await page.locator('.cat-grid > [data-row="0"]').first().getAttribute("data-id");

    await scroller.evaluate(e => { e.scrollTop = e.scrollHeight * .5; });
    await expect.poll(async () => (await cardWindow(page)).first, { timeout: 20_000 }).toBeGreaterThan(BUFFER * 2);
    await frames(page);
    w = await cardWindow(page);
    expectBuffer(w, rows);
    expect(w.cards).toBe((w.end - w.start + 1) * w.columns);
    await expect(page.locator('.cat-grid > [data-row="0"]')).toHaveCount(0); // released

    await scroller.evaluate(e => { e.scrollTop = 0; });
    await expect(page.locator('.cat-grid > [data-row="0"]').first()).toHaveAttribute("data-id", firstId!); // drawn again
    await frames(page);
    w = await cardWindow(page);
    expect(w.start).toBe(0);
    expectBuffer(w, rows);
  });

  test("the scroll bar still spans the whole catalogue and the end is reachable", async ({ page }) => {
    const scroller = page.locator(".cat-scroll");
    for (let i = 0; i < 4; i++) { await scroller.evaluate(e => { e.scrollTop = e.scrollHeight; }); await frames(page); }
    const w = await cardWindow(page);
    expect(w.end).toBe(Math.ceil(TOTAL / w.columns) - 1);
    expect(w.last).toBe(w.end);
  });

  test("a focused card keeps focus when its row is released, and Tab carries on in the catalogue", async ({ page }) => {
    const scroller = page.locator(".cat-scroll");
    const hit = page.locator('.cat-grid > [data-row="0"] .cat-card-hit').first();
    await hit.focus();
    const card = await page.locator('.cat-grid > [data-row="0"]').first().elementHandle();
    await scroller.evaluate(e => { e.scrollTop = e.scrollHeight * .5; });
    await expect.poll(async () => (await cardWindow(page)).start, { timeout: 20_000 }).toBeGreaterThan(BUFFER);
    expect(await card!.evaluate(e => e.isConnected && e.hasAttribute("data-pinned") && e.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Tab");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".cat-grid") && document.activeElement!.classList.contains("cat-card-hit"))).toBe(true);
    // On a row of several cards Tab moves along the held row (and the browser scrolls to the card it reaches).
    // Once focus moves to cards far from it, the held row is released like any other.
    await scroller.evaluate(e => { e.scrollTop = e.scrollHeight * .5; });
    await expect.poll(async () => (await cardWindow(page)).start, { timeout: 20_000 }).toBeGreaterThan(BUFFER);
    await page.locator('.cat-grid > [data-row]:not([data-pinned]) .cat-card-hit').nth(BUFFER).focus();
    await expect.poll(() => card!.evaluate(e => e.isConnected)).toBe(false);
  });

  test("changing the width keeps the reader's place and the 50-row buffer", async ({ page }) => {
    test.skip(isPhone(page), "the phone width has one column; this checks a change of column count");
    const scroller = page.locator(".cat-scroll");
    await scroller.evaluate(e => { e.scrollTop = e.scrollHeight * .3; });
    await expect.poll(async () => (await cardWindow(page)).first, { timeout: 20_000 }).toBeGreaterThan(BUFFER);
    await frames(page);
    const before = await cardWindow(page);
    const topId = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>(".cat-scroll")!, top = scroller.getBoundingClientRect().top;
      return Array.from(scroller.querySelectorAll<HTMLElement>(".cat-grid > [data-row]")).find(e => e.getBoundingClientRect().bottom > top + 40)!.dataset.id!;
    });
    await page.setViewportSize({ width: 1100, height: 900 });
    await expect.poll(async () => (await cardWindow(page)).columns).not.toBe(before.columns);
    await frames(page); await frames(page);
    const after = await cardWindow(page);
    expectBuffer(after, Math.ceil(TOTAL / after.columns));
    const stillSeen = await page.evaluate((id) => {
      const scroller = document.querySelector<HTMLElement>(".cat-scroll")!, frame = scroller.getBoundingClientRect();
      const card = scroller.querySelector<HTMLElement>(`.cat-grid > [data-id="${id}"]`);
      if (!card) return false;
      const r = card.getBoundingClientRect();
      return r.bottom > frame.top && r.top < frame.top + scroller.clientHeight;
    }, topId);
    expect(stillSeen).toBe(true);
  });
});

test.describe("Library collection list", () => {
  test("draws a window of rows and fetches the next 1,000 by itself near the end, with a loading line", async ({ page }) => {
    let release: () => void = () => {};
    const held = new Promise<void>(r => { release = r; });
    await page.route(`**/content/teacher-library/collections/${TCP.id}/readable/1.json`, async route => { await held; await route.continue(); });
    await page.goto(`/teachers/works?collection=${TCP.id}&page=3`);
    await expect(page).not.toHaveURL(/[?&]page=/); // addresses from the paged list start at the top
    const rowsList = page.locator(".acq-collection-rows");
    await expect(rowsList.locator("li").first()).toBeVisible();
    await expect(rowsList).toHaveAttribute("role", "list");
    await expect(rowsList.locator("li").first()).toHaveAttribute("aria-setsize", String(TCP.readable));
    await expect(rowsList.locator("li").first()).toHaveAttribute("aria-posinset", "1");
    await expect(page.getByRole("navigation", { name: "Collection pages" })).toHaveCount(0);
    await expect(page.locator(".acq-collections").getByRole("button", { name: /load more|show more|next/i })).toHaveCount(0);
    await frames(page);
    let w = await listWindow(page);
    expect(w.start).toBe(0);
    expectBuffer(w, 1000);
    expect(w.items).toBeLessThan(200);

    // To the end of the first 1,000: the next file is asked for by itself and the loading line shows meanwhile.
    for (let i = 0; i < 3; i++) { await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await frames(page); }
    const loading = page.getByRole("status").filter({ hasText: "Loading more works…" });
    await expect(loading).toBeVisible();
    await expect(loading.locator(".acq-spinner")).toHaveCount(1);
    release();
    await expect(loading).toBeHidden();
    await expect(rowsList.locator('li[data-row="1000"]')).toBeAttached();
    await expect(rowsList.locator('li[aria-posinset="1001"]')).toBeAttached();
    await frames(page);
    w = await listWindow(page);
    expectBuffer(w, 2000);
    await expect(rowsList.locator('li[data-row="0"]')).toHaveCount(0); // released

    await page.evaluate(() => scrollTo(0, 0));
    await expect(rowsList.locator('li[data-row="0"]')).toBeAttached(); // drawn again
    await frames(page);
    w = await listWindow(page);
    expect(w.items).toBeLessThan(200);
  });

  test("a focused row keeps focus when it scrolls far away", async ({ page }) => {
    await page.goto(`/teachers/works?collection=${TCP.id}`);
    const link = page.locator('.acq-collection-rows > li[data-row="3"] a');
    await link.focus();
    const row = await page.locator('.acq-collection-rows > li[data-row="3"]').elementHandle();
    await page.evaluate(() => { const ul = document.querySelector<HTMLElement>(".acq-collection-rows")!; scrollTo(0, ul.getBoundingClientRect().top + scrollY + ul.scrollHeight * .7); });
    await expect.poll(async () => (await listWindow(page)).start, { timeout: 20_000 }).toBeGreaterThan(3);
    expect(await row!.evaluate(e => e.isConnected && e.hasAttribute("data-pinned") && e.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Tab");
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".acq-collection-rows"))).toBe(true);
  });
});
