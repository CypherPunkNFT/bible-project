import { expect, test, type Locator, type Page } from "@playwright/test";

async function checkScroll(page: Page, viewport: Locator, enclosingFrame?: Locator) {
  await viewport.scrollIntoViewIfNeeded();
  const area = viewport.locator("xpath=../..");
  const bar = area.locator(":scope > .outside-scrollbar");
  const frame = enclosingFrame ?? area.locator(":scope > .outside-scroll-frame");
  await expect.poll(() => viewport.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(100);
  const initial = (await frame.boundingBox())!;
  const barBounds = (await bar.boundingBox())!;
  // The six-pixel native thumb has a real gap beyond the rounded frame, not a gutter inside it.
  expect(barBounds.x + barBounds.width - 6 - initial.x - initial.width).toBeGreaterThanOrEqual(5);
  expect(await viewport.evaluate((el) => el.getBoundingClientRect().width - el.clientWidth)).toBeLessThanOrEqual(1);
  await expect.poll(async () => Math.abs(await viewport.evaluate((el) => el.scrollHeight - el.clientHeight) - await bar.evaluate((el) => el.scrollHeight - el.clientHeight))).toBeLessThanOrEqual(1);

  await viewport.hover();
  await page.mouse.wheel(0, 180);
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  await expect.poll(async () => Math.abs(await viewport.evaluate((el) => el.scrollTop) - await bar.evaluate((el) => el.scrollTop))).toBeLessThanOrEqual(1);
  await bar.evaluate((el) => { el.scrollTop = 350; });
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(350);
  expect((await frame.boundingBox())!.height).toBeCloseTo(initial.height, 0);
  await viewport.focus();
  await page.keyboard.press("End");
  await expect.poll(() => viewport.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  return { area, bar, frame };
}

test("outside scroll: both miracle tables retain their frames through scrolling, expansion and filters", async ({ page }) => {
  await page.goto("/study/miracles");
  for (const label of ["Jesus miracles", "Moses and Aaron miracles"]) {
    const viewport = page.getByRole("region", { name: label, exact: true });
    const { frame } = await checkScroll(page, viewport);
    const height = (await frame.boundingBox())!.height;
    const first = viewport.getByRole("button").first();
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(viewport.locator('[id^="miracle-"] sup').first()).toBeVisible();
    await expect.poll(async () => (await frame.boundingBox())!.height).toBeCloseTo(height, 0);
    await first.click();
  }
  const jesus = page.locator("section[aria-labelledby='who-jesus']");
  await jesus.getByRole("button", { name: /^Raising the dead/ }).click();
  const viewport = jesus.getByRole("region", { name: "Jesus miracles" });
  await expect(viewport.locator("li")).toHaveCount(3);
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
  await expect.poll(() => jesus.locator(".outside-scrollbar").evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
  await jesus.getByRole("button", { name: /^All / }).click();
  await expect(viewport.locator("li")).toHaveCount(35);
  await expect.poll(() => jesus.locator(".outside-scrollbar").evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(100);
});

for (const table of [
  { name: "Jesus miracles", path: "/study/miracles", viewport: '[aria-label="Jesus miracles"]', bar: '[aria-labelledby="who-jesus"] .outside-scrollbar' },
  { name: "Moses miracles", path: "/study/miracles", viewport: '[aria-label="Moses and Aaron miracles"]', bar: '[aria-labelledby="who-moses-and-aaron"] .outside-scrollbar' },
  { name: "Gospel Harmony", path: "/study/harmony", viewport: ".harmony-rows", bar: ".harmony-outside-scroll" },
  { name: "Library versions", path: "/library", viewport: ".versions-list-scroll", bar: ".versions-outside-scroll" },
]) {
  test(`outside scroll: ${table.name} hands scrolling to the page at both ends`, async ({ page }) => {
    await page.goto(table.path);
    const viewport = page.locator(table.viewport);
    const bar = page.locator(table.bar);
    await expect.poll(() => viewport.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(300);
    await page.evaluate(() => document.fonts.ready);
    await viewport.evaluate((el) => { el.scrollTop = 150; el.scrollIntoView({ block: "center" }); });
    await viewport.hover();
    const initialPageY = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 100);
    await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(200);
    expect(await page.evaluate(() => scrollY)).toBe(initialPageY);

    // Test real wheel input over both the rows and the external native scrollbar.
    for (const target of [viewport, bar]) {
      for (const direction of [-1, 1]) {
        await viewport.evaluate((el, down) => {
          el.scrollTop = down ? el.scrollHeight : 0;
          el.scrollIntoView({ block: "center" });
          // Leave some page below even when the table is next to the footer.
          window.scrollBy(0, -120);
        }, direction > 0);
        await expect.poll(async () => Math.abs(await viewport.evaluate((el) => el.scrollTop) - await bar.evaluate((el) => el.scrollTop))).toBeLessThanOrEqual(1);
        // Put this surface at its exact native edge; a mirrored, rounded scrollTop can leave a fraction to scroll.
        await target.evaluate((el, down) => { el.scrollTop = down ? el.scrollHeight : 0; }, direction > 0);
        const bounds = (await target.boundingBox())!;
        const screenHeight = page.viewportSize()!.height;
        const point = { x: bounds.x + bounds.width - (target === bar ? 3 : bounds.width / 2), y: Math.max(140, Math.min(screenHeight - 32, bounds.y + bounds.height / 2)) };
        expect(point.y).toBeGreaterThan(bounds.y);
        expect(point.y).toBeLessThan(bounds.y + bounds.height);
        await page.mouse.move(point.x, point.y);
        const before = await page.evaluate(() => scrollY);
        // Continue the wheel gesture through the boundary, including any subpixel remainder at its end.
        await expect.poll(async () => {
          await page.mouse.wheel(0, direction * 100);
          return (await page.evaluate(() => scrollY) - before) * direction;
        }, { message: `${table.name}: ${target === bar ? "bar" : "rows"}, ${direction > 0 ? "bottom" : "top"}` }).toBeGreaterThan(20);
        await expect.poll(() => viewport.evaluate((el, down) => down ? el.scrollHeight - el.clientHeight - el.scrollTop : el.scrollTop, direction > 0)).toBeLessThanOrEqual(1);
      }
    }
  });
}

test("outside scroll: book-pair rankings keep their scrollbar outside and selections working", async ({ page }) => {
  await page.goto("/study/references#matrix");
  const viewport = page.getByRole("region", { name: "Most cross-referenced book pairs" });
  await checkScroll(page, viewport);
  const pair = viewport.getByRole("button").last();
  await pair.click();
  await expect(pair).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".matrix-detail")).toContainText((await pair.locator("span").first().textContent())!);
});

test("outside scroll: structure evidence stays outside its enclosing source box", async ({ page }) => {
  await page.goto("/study/structure#sections");
  await page.getByRole("group", { name: "Measure the sections" }).getByRole("button", { name: "Miracles", exact: true }).click();
  await page.locator(".measure-evidence summary").click();
  const viewport = page.getByRole("region", { name: "Source passages for the selected measure" });
  await checkScroll(page, viewport, page.locator(".measure-evidence"));
});

test("outside scroll: place references retain the fixed heading and rounded panel", async ({ page }) => {
  await page.goto("/study/places?place=a15257a");
  const viewport = page.getByRole("region", { name: "Passages naming Jerusalem" });
  await checkScroll(page, viewport, page.getByRole("complementary", { name: /Jerusalem/ }));
  await expect(page.getByRole("heading", { name: "Jerusalem", exact: true })).toBeInViewport();
  await viewport.getByRole("button", { name: /^Show more/ }).click();
  await expect(viewport.locator("ol > li")).toHaveCount(45);
});

test("outside scroll: testimony list scrollbar clears the outer card and rows remain selectable", async ({ page }) => {
  // Browser-only fixture: no database writes or invented stories in the real collection.
  const nodes = Array.from({ length: 30 }, (_, i) => ({ id: `scroll-test-${i}`, parentId: i ? "scroll-test-0" : null,
    name: `Test reader ${i}`, title: `Test story ${i}`, blurb: "Fictional browser fixture for scrolling.", body: "", theme: "", happenedWhen: "", publishedAt: "", available: true }));
  await page.route("**/api/testimonies/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith("/me") ? null : path.endsWith("/settings") ? { siteUrl: "http://127.0.0.1:8940" } : { nodes, rootId: nodes[0].id, ancestors: [], total: nodes.length, hasMore: false };
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
  });
  await page.goto("/testimonies");
  await page.getByRole("button", { name: "List view", exact: true }).click();
  const viewport = page.getByRole("region", { name: "Testimonies in this branch" });
  await checkScroll(page, viewport, page.locator(".testimony-map"));
  const last = viewport.getByRole("button").last();
  await last.click();
  await expect(last).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("complementary", { name: "Selected testimony" })).toContainText("Test reader 29");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
