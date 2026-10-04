import { expect, test, type Page } from "@playwright/test";

// Runs at desktop (1440), tablet (768) and phone (390) — see playwright.config.ts.

const PAGES = ["/", "/library", "/read/kjv/GEN/1", "/read/kjv/PSA/23?with=wlc,web", "/read/kjv/DAN/2?v=34", "/charts", "/atlas", "/search?q=jerusalem", "/versions", "/no-such-page"];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

for (const path of PAGES) {
  test(`no sideways scroll and no console errors: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(path);
    await settle(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `page is ${overflow}px wider than the screen`).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test("library opens a book in the reader", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("link", { name: /^Genesis/ }).first().click();
  await expect(page).toHaveURL(/\/read\/kjv\/GEN\/1/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Genesis");
  await expect(page.locator(".scripture")).toContainText("In the beginning God created the heaven and the earth.");
});

test("Daniel 2:34 shows the KJV text, red-letter free, and its cross-references", async ({ page }) => {
  await page.goto("/read/kjv/DAN/2?v=34");
  await expect(page.locator(".scripture")).toContainText("a stone was cut out without hands");
  const panel = page.getByRole("complementary", { name: "Daniel 2:34" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link").first()).toBeVisible();
  await expect(panel).toContainText("Daniel 2:44");
});

test("words of Jesus are red in the KJV", async ({ page }) => {
  await page.goto("/read/kjv/JHN/3");
  const red = page.locator(".scripture .text-red").first();
  await expect(red).toBeVisible();
  const color = await red.evaluate((el) => getComputedStyle(el).color);
  expect(color).not.toBe(await page.locator(".scripture").evaluate((el) => getComputedStyle(el).color));
});

test("switching to a version without the book offers the versions that have it", async ({ page }) => {
  await page.goto("/read/tnt/GEN/1");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Genesis is not in the Tyndale New Testament");
  await expect(page.getByRole("link", { name: "KJV" })).toBeVisible();
});

test("a missing data file is a real 404, never the app page", async ({ request }) => {
  const response = await request.get("/data/text/kjv/PSA/151.json");
  expect(response.status()).toBe(404);
  const traversal = await request.get("/data/..%2F..%2Fpackage.json");
  expect(traversal.status()).toBe(404);
});

test("a chapter downloads only small, compressed pieces: its own text, cross-references and places", async ({ page }) => {
  const data: { url: string; bytes: number; encoding: string }[] = [];
  page.on("requestfinished", async (request) => {
    if (!request.url().includes("/data/")) return;
    const sizes = await request.sizes();
    data.push({ url: request.url(), bytes: sizes.responseBodySize, encoding: (await request.response())?.headers()["content-encoding"] ?? "" });
  });
  await page.goto("/read/kjv/PSA/119");
  await settle(page);
  await expect(page.locator(".scripture")).toContainText("Blessed are the undefiled");
  const paths = data.map((d) => new URL(d.url).pathname);
  expect(paths).toContain("/data/text/kjv/PSA/119.json");
  expect(paths.some((p) => /\/data\/(text\/kjv\/PSA|xref\/PSA)\.json$/.test(p))).toBe(false); // never a whole book
  expect(paths).not.toContain("/data/places.json"); // the reader uses its book's list, not every place
  const big = data.filter((d) => d.bytes > 2048);
  expect(big.length).toBeGreaterThan(0);
  expect(big.every((d) => d.encoding === "gzip")).toBe(true);
  expect(data.reduce((sum, d) => sum + d.bytes, 0)).toBeLessThan(100_000); // was 1.6 MB before chapter files
});

test("arrow keys move between chapters", async ({ page }) => {
  await page.goto("/read/kjv/RUT/1");
  await settle(page);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/read\/kjv\/RUT\/2/);
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/read\/kjv\/RUT\/1/);
});

test("Hebrew side by side is right-to-left", async ({ page }) => {
  await page.goto("/read/kjv/GEN/1?with=wlc");
  await expect(page.locator('[lang="he"][dir="rtl"]').first()).toContainText("בְּרֵאשִׁ");
});

test("search finds the stone the builders rejected", async ({ page }) => {
  await page.goto("/search?q=the%20stone%20which%20the%20builders&in=kjv");
  await expect(page.getByText(/5 verses contain/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: /Matthew 21:42/ })).toBeVisible();
});

test("atlas opens a place from a link and lists its verses", async ({ page }) => {
  await page.goto("/atlas?place=a15257a");
  await expect(page.getByRole("heading", { name: "Jerusalem" })).toBeVisible();
  await expect(page.getByText(/Named in \d+ verses/)).toBeVisible();
});

test("charts draw the arc canvas", async ({ page }) => {
  await page.goto("/charts");
  await settle(page);
  const painted = await page.locator("#arcs canvas").evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context) return 0;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let i = 3; i < data.length; i += 4 * 97) if (data[i] > 0) count++;
    return count;
  });
  expect(painted).toBeGreaterThan(100);
});

test("no raw HTML injection paths in the built page", async ({ page }) => {
  await page.goto("/read/kjv/GEN/1");
  // Footnotes and headings render as text: an angle bracket in data could never become an element.
  const scripts = await page.locator(".scripture script, .scripture iframe").count();
  expect(scripts).toBe(0);
});

// --- regressions from the independent review (2026-10-03) ---

test("Hebrew text carries no leftover source markup (the Shema)", async ({ page }) => {
  await page.goto("/read/wlc/DEU/6");
  const text = await page.locator(".scripture").innerText();
  expect(text).toContain("שְׁמַ֖ע יִשְׂרָאֵ֑ל");
  expect(text).not.toContain('="');
});

test("the KJV epistle subscriptions are kept after the last verse", async ({ page }) => {
  await page.goto("/read/kjv/ROM/16");
  await expect(page.locator(".scripture")).toContainText("Written to the Romans from Corinthus");
});

test("versions numbered differently do not show KJV-numbered cross-references", async ({ page }) => {
  await page.goto("/read/wlc/PSA/51?v=3");
  const panel = page.getByRole("complementary");
  await expect(panel).toContainText("numbered like the KJV");
  await expect(panel.getByRole("link", { name: "Open this chapter in the KJV" })).toBeVisible();
});

test("search results keep their own version after the picker changes", async ({ page }) => {
  await page.goto("/search?q=Jesus%20wept&in=kjv");
  await expect(page.getByText(/1 verse contains/)).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Version").selectOption("wlc");
  await expect(page.getByText(/in the King James Version/)).toBeVisible();
  await expect(page.getByRole("link", { name: /John 11:35/ })).toHaveAttribute("href", /\/read\/kjv\/JHN\/11/);
});

// --- the reading chart (owner's reference: reference/reading-chart.png) ---

test("reading chart: a chapter box opens that chapter", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("group", { name: "Romans chapters" }).getByRole("button", { name: "Romans 8", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/kjv\/ROM\/8/);
});

test("reading chart: mark-as-read mode ticks a chapter and the reader agrees", async ({ page }) => {
  await page.goto("/library");
  await page.evaluate(() => localStorage.removeItem("bp-read"));
  await page.reload();
  await page.getByRole("radio", { name: "Mark as read" }).click();
  const box = page.getByRole("group", { name: "John chapters" }).getByRole("button", { name: /^John 3,/ });
  await box.click();
  await expect(box).toHaveAttribute("aria-pressed", "true");
  await expect(box).toHaveText("✓");
  await page.goto("/read/kjv/JHN/3");
  await expect(page.getByRole("button", { name: "Read", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Read", exact: true }).click();
  await page.goto("/library");
  await page.getByRole("radio", { name: "Mark as read" }).click();
  await expect(page.getByRole("group", { name: "John chapters" }).getByRole("button", { name: /^John 3,/ })).toHaveAttribute("aria-pressed", "false");
});

test("reading chart: one tab stop per book, arrows move between chapters", async ({ page }) => {
  await page.goto("/library");
  const first = page.getByRole("group", { name: "Genesis chapters" }).getByRole("button", { name: "Genesis 1", exact: true });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("group", { name: "Genesis chapters" }).getByRole("button", { name: "Genesis 2", exact: true })).toBeFocused();
  const tabStops = await page.getByRole("group", { name: "Genesis chapters" }).locator('button[tabindex="0"]').count();
  expect(tabStops).toBe(1);
});

test("the reader's picker jumps straight to a chapter", async ({ page }) => {
  await page.goto("/read/kjv/GEN/1");
  await page.getByRole("button", { name: /Genesis/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Isaiah 53", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/kjv\/ISA\/53/);
});

// --- the reader's header bar (2026-10-03 redesign: no dropdowns) ---

test("header: previous and next name where they go", async ({ page }) => {
  await page.goto("/read/kjv/HOS/2");
  await page.getByRole("button", { name: "Next chapter: Hosea 3" }).first().click();
  await expect(page).toHaveURL(/\/read\/kjv\/HOS\/3$/);
  await page.getByRole("button", { name: "Previous chapter: Hosea 2" }).first().click();
  await expect(page).toHaveURL(/\/read\/kjv\/HOS\/2$/);
});

test("header: the title opens the chapter chart", async ({ page }) => {
  await page.goto("/read/kjv/HOS/2");
  await page.getByRole("button", { name: /Hosea 2 — choose a book and chapter/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("header: the version panel switches version and adds one side by side", async ({ page }) => {
  await page.goto("/read/kjv/PSA/23");
  await page.getByRole("button", { name: /^Version:/ }).click();
  await page.getByRole("button", { name: "Read WEB side by side" }).click();
  await expect(page).toHaveURL(/with=web/);
  // The panel stays open after adding a side-by-side version, so the next choice is one tap away.
  await page.getByRole("region", { name: "Versions" }).getByRole("button", { name: /^BSB/ }).click();
  await expect(page).toHaveURL(/\/read\/bsb\/PSA\/23\?with=web/);
});

test("header: the side-by-side button adds the KJV in one click and turns it off again", async ({ page }) => {
  await page.goto("/read/wlc/HOS/2");
  await page.getByRole("button", { name: "Read side by side with the KJV" }).click();
  await expect(page).toHaveURL(/\/read\/wlc\/HOS\/2\?with=kjv$/);
  await page.getByRole("button", { name: "Turn side by side off" }).click();
  await expect(page).toHaveURL(/\/read\/wlc\/HOS\/2$/);
  await page.getByRole("button", { name: "Choose which versions to read side by side" }).click();
  await expect(page.getByRole("region", { name: "Versions" })).toBeVisible();
});

test("reading options: the text-size buttons really change the scripture size", async ({ page }) => {
  await page.goto("/read/kjv/JHN/1");
  const size = () => page.locator(".scripture").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const before = await size();
  await page.getByRole("button", { name: "Reading options" }).click();
  await page.getByRole("button", { name: "Larger text" }).click();
  await page.getByRole("button", { name: "Larger text" }).click();
  await expect.poll(size).toBeGreaterThan(before * 1.15);
  await page.getByRole("button", { name: "Smaller text" }).click();
  await page.getByRole("button", { name: "Smaller text" }).click();
  await page.getByRole("button", { name: "Smaller text" }).click();
  await expect.poll(size).toBeLessThan(before);
});

test("library: the versions list shows seven at a time and scrolls the rest", async ({ page }) => {
  await page.goto("/library");
  // Grouped by language since 2026-10-03: rows sit in one list per language under a sticky heading.
  const scroller = page.locator("section[aria-labelledby=versions-title] .slim-scroll");
  const box = await scroller.evaluate((el) => {
    const rows = el.querySelectorAll("li");
    const heading = (el.querySelector("h3") as HTMLElement).offsetHeight;
    return { rows: rows.length, visible: Math.round((el.clientHeight - heading) / (rows[0] as HTMLElement).offsetHeight), scrolls: el.scrollHeight > el.clientHeight };
  });
  expect(box.rows).toBe(37); // 24 + Spanish, Arabic, Chinese ×2, French, German + Hindi, Portuguese, Russian, Japanese, Vietnamese, Persian, Italian
  expect(box.visible).toBe(7);
  expect(box.scrolls).toBe(true);
});

test("home is the landing page; the menu has Library and no Versions", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Library" })).toHaveAttribute("href", "/library");
  await expect(nav.getByRole("link", { name: "Versions" })).toHaveCount(0);
});
