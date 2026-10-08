import { expect, test, type Locator, type Page } from "@playwright/test";

// Preachers & authors · 01 The whole Bible and 02 Teachers through the Bible (approved mock-ups:
// design/authors-directions/teachers/bible.js and through.js).
// 01: all 1,189 chapters as squares on one canvas, lit by how many teachers' works take each as a main text; chips
// repaint it; a chapter (pointed at, clicked, tapped or reached with the arrow keys) shows who took it, the titles that
// link to the works, and a Read link to the chapter; on phones the chapter opens in a bottom sheet.
// 02: a teacher list, a ring of 66 book spokes, and a book panel whose works link out ("Read the sermon ↗"), with a
// small link to the chapter; only Spurgeon's dated sermons get the year slider, everyone else an honest reason.

const ADDRESS = "/teachers/preachers-and-authors";

async function openSection(page: Page, id: "bible" | "through", heading: string) {
  await page.goto(ADDRESS);
  const section = page.locator(`section#${id}`);
  // The page's data (about 1.4 MB) loads after the shell; give a cold first load time before scrolling to the section.
  await expect(section.getByRole("heading", { level: 2 })).toContainText(heading, { timeout: 20_000 });
  await section.scrollIntoViewIfNeeded();
  return section;
}

/** The colour of the canvas pixel at CSS point (x, y), as "r,g,b". */
const pixel = (canvas: Locator, x: number, y: number) => canvas.evaluate((el: HTMLCanvasElement, [px, py]) => {
  const ratio = el.width / el.getBoundingClientRect().width;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("no 2D context on the chapter canvas");
  return Array.from(ctx.getImageData(Math.round(px * ratio), Math.round(py * ratio), 1, 1).data.slice(0, 3)).join(",");
}, [x, y]);
// Genesis 1 is the first square: just under the first book label, at the canvas's left edge.
const GENESIS_1 = { x: 5, y: 20 };

test("the whole Bible: every chapter on one canvas, a chip per teacher, and the summary agrees with the chip", async ({ page }) => {
  const section = await openSection(page, "bible", "Every chapter");
  await expect(section.locator(".tp-line")).toContainText("All 1,189 chapters");
  const chips = section.locator(".bib-chip");
  expect(await chips.count()).toBeGreaterThanOrEqual(5);
  await expect(chips.first()).toHaveAttribute("aria-pressed", "true");
  await expect(chips.nth(1)).toContainText("Without Spurgeon");
  const lit = (await chips.first().locator("b").textContent()) ?? "";
  await expect(section.locator(".bib-big b").first()).toHaveText(lit);
  await expect(section.locator(".bib-top li")).toHaveCount(6);
  // The canvas is painted, and Genesis 1 (which many teachers took) is lit.
  const canvas = section.locator("canvas");
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(200);
  const lit1 = await pixel(canvas, GENESIS_1.x, GENESIS_1.y);
  expect(lit1).not.toBe("0,0,0");
  // Gill took no work from Genesis 1, so his chip darkens that square: the chips really repaint the canvas.
  await section.locator(".bib-chip", { hasText: "Gill" }).click();
  await expect.poll(() => pixel(canvas, GENESIS_1.x, GENESIS_1.y)).not.toBe(lit1);
  // Choosing a teacher presses that chip alone and the summary follows.
  await section.locator(".bib-chip", { hasText: "Calvin" }).click();
  await expect(section.locator(".bib-chip", { hasText: "Calvin" })).toHaveAttribute("aria-pressed", "true");
  await expect(chips.first()).toHaveAttribute("aria-pressed", "false");
  await expect(section.locator(".bib-detail h3")).toContainText("Calvin");
});

test("the whole Bible: choosing a chapter shows who took it, links to the works, and a Read link", async ({ page }, info) => {
  const section = await openSection(page, "bible", "Every chapter");
  const canvas = section.locator("canvas");
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(200);
  await canvas.click({ position: GENESIS_1 });
  const narrow = info.project.name !== "desktop";
  const panel = narrow ? section.locator(".bib-sheet") : section.locator(".bib-detail");
  if (narrow) await expect(panel).toHaveClass(/bib-open/);
  await expect(panel.locator("h3")).toContainText("Genesis 1");
  await expect(panel.locator(".bib-bars li").first()).toBeVisible();
  const work = panel.locator("a.bib-work").first();
  await expect(work).toHaveAttribute("target", "_blank");
  await expect(work).toHaveAttribute("href", /^https?:\/\//);
  await expect(panel.getByRole("link", { name: /Read Genesis 1/ })).toHaveAttribute("href", "/read/kjv/GEN/1");
  // A name opens that teacher's profile.
  await panel.locator(".bib-bars .bib-name").first().click();
  await expect(page.getByRole("dialog", { name: "Teacher profile" })).toBeVisible();
  await page.getByRole("button", { name: "Close profile" }).click();
  // Closing the chapter returns to the summary (on phones, the sheet slides away).
  await panel.getByRole("button", { name: "Close" }).click();
  if (narrow) await expect(panel).not.toHaveClass(/bib-open/);
  else await expect(section.locator(".bib-detail .kicker")).toContainText("Every teacher in the library");
});

test("the whole Bible: arrow keys walk the chapters and Enter opens the reader", async ({ page }) => {
  const section = await openSection(page, "bible", "Every chapter");
  const canvas = section.locator("canvas");
  await canvas.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(section.locator(".bib-inner h3").filter({ hasText: "Genesis 2" }).first()).toBeAttached();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/read\/kjv\/GEN\/2$/);
});

test("the whole Bible: pointing at a square shows that chapter (desktop)", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "pointing needs a mouse; touch taps are covered above");
  const section = await openSection(page, "bible", "Every chapter");
  const canvas = section.locator("canvas");
  await canvas.hover({ position: GENESIS_1 });
  await expect(section.locator(".bib-detail h3")).toContainText("Genesis 1");
  await page.mouse.move(0, 0);
  await expect(section.locator(".bib-detail .kicker")).toContainText("Every teacher in the library");
});

test("the whole Bible: the canvas repaints in the other theme", async ({ page }) => {
  const section = await openSection(page, "bible", "Every chapter");
  const canvas = section.locator("canvas");
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(200);
  const before = await pixel(canvas, GENESIS_1.x, GENESIS_1.y);
  await page.getByRole("switch", { name: "Dark mode" }).click();
  await expect.poll(() => pixel(canvas, GENESIS_1.x, GENESIS_1.y)).not.toBe(before);
});

test("through the Bible: the teacher list, the ring and the book panel agree", async ({ page }) => {
  const section = await openSection(page, "through", "through");
  const teachers = section.locator(".thr-rail .thr-t");
  expect(await teachers.count()).toBeGreaterThanOrEqual(5);
  await expect(teachers.first()).toHaveAttribute("aria-pressed", "true");
  await expect(teachers.first()).toContainText("Everyone");
  await expect(section.locator(".thr-ring .thr-spokes path")).toHaveCount(66);
  // The middle of the ring and the book panel name the same book and count.
  const book = (await section.locator(".thr-small").textContent()) ?? "";
  const count = (await section.locator(".thr-big").textContent()) ?? "";
  await expect(section.locator(".thr-book h3")).toHaveText(book);
  await expect(section.locator(".thr-book-sub")).toContainText(`${count} works`);
  // Each work links to the work itself, with a small link to the chapter on this site.
  const item = section.locator(".thr-item").filter({ has: page.locator("a.thr-go") }).first();
  await expect(item.locator("a.thr-go")).toHaveAttribute("target", "_blank");
  await expect(item.locator("a.thr-go")).toHaveText(/Read the sermon|Read in the volume|Read the /);
  await expect(item.locator("a.thr-ref")).toHaveAttribute("href", /^\/read\/kjv\/[1-3A-Z]{3}\/\d+/);
  // Everyone has no year slider, only the honest one-line reason.
  await expect(section.locator(".thr-years")).toBeHidden();
  await expect(section.locator(".thr-years-note")).toContainText("Spurgeon");
});

test("through the Bible: choosing a spoke, the arrow keys, and another teacher", async ({ page }) => {
  const section = await openSection(page, "through", "through");
  await section.locator('.thr-spokes path:has(title:text-matches("^Romans:"))').dispatchEvent("click");
  await expect(section.locator(".thr-book h3")).toHaveText("Romans");
  await section.locator(".thr-ring").focus();
  await page.keyboard.press("ArrowRight");
  await expect(section.locator(".thr-book h3")).toHaveText("1 Corinthians");
  await section.locator(".thr-t", { hasText: "Calvin" }).click();
  await expect(section.locator(".thr-t", { hasText: "Calvin" })).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".thr-who h3")).toContainText("Calvin");
  await expect(section.locator(".thr-years")).toBeHidden();
  await expect(section.locator(".thr-years-note")).toContainText("Calvin");
  // His name opens his profile.
  await section.locator(".thr-who .thr-name").click();
  await expect(page.getByRole("dialog", { name: "Teacher profile" })).toBeVisible();
});

test("through the Bible: Spurgeon's year slider and play", async ({ page }) => {
  const section = await openSection(page, "through", "through");
  await section.locator(".thr-t", { hasText: "Spurgeon" }).click();
  const years = section.locator(".thr-years");
  await expect(years).toBeVisible();
  await expect(section.locator(".thr-years-note")).toBeHidden();
  await expect(section.locator(".thr-readout")).toContainText("All");
  const slider = section.locator(".thr-range");
  const first = Number(await slider.getAttribute("min"));
  await slider.fill(String(first + 5));
  await expect(section.locator(".thr-readout")).toContainText(`${first + 5}`);
  await expect(section.locator(".thr-readout")).toContainText("dated so far");
  await expect(section.locator(".thr-book-sub")).toContainText(`by ${first + 5}`);
  await section.getByRole("button", { name: "Play through the years" }).click();
  await expect(section.getByRole("button", { name: "Pause" })).toBeVisible();
  // With reduced motion a year passes every 40 ms, so the play reaches "All" within a few seconds and stops.
  await expect(section.locator(".thr-readout")).toContainText("All", { timeout: 10_000 });
  await expect(section.getByRole("button", { name: "Play through the years" })).toBeVisible();
});

test("through the Bible: teachers with no Bible texts fold out and open their profiles", async ({ page }) => {
  const section = await openSection(page, "through", "through");
  const quiet = section.locator(".thr-quiet");
  await expect(quiet.locator("summary")).toContainText("more teachers have no Bible texts recorded yet");
  await quiet.locator("summary").click();
  const names = quiet.locator("button");
  expect(await names.count()).toBeGreaterThanOrEqual(1);
  await names.first().click();
  await expect(page.getByRole("dialog", { name: "Teacher profile" })).toBeVisible();
});

test("neither section scrolls sideways", async ({ page }) => {
  await openSection(page, "through", "through");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
