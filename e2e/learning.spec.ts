import { expect, test, type Page } from "@playwright/test";

// The Learning materials division (approved mock-up E, "Doors and stacks", built 2026-10-08): seven doors; a door opens
// that reader's stack beneath it (?for=<reader>); another door slides to its stack and clears the kind lit; the line
// under the doors and the panel beside the stack never change height; the one built workbook has a title page whose
// viewer turns through its real pages and whose two PDFs download. Planned titles never offer a download.

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
const height = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => el.getBoundingClientRect().height);

test("the doors: seven readers, nothing open, the division's figures", async ({ page }) => {
  await page.goto("/resources/learning");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choose a door.");
  await expect(page.locator(".lm-door")).toHaveCount(7);
  await expect(page.locator(".lm-door[data-aud=leaders] .cnt")).toContainText("15");
  await expect(page.locator(".lm-drawer")).toBeHidden();
  await expect(page.locator(".lm-bar")).toContainText("40");
  await expect(page.getByRole("navigation", { name: "Resources sections" })).toBeVisible();
  await noSidewaysScroll(page);
});

test("?for=children opens the children's stack, and the address follows the open door", async ({ page }) => {
  await page.goto("/resources/learning?for=children");
  const view = page.locator('.lm-view[data-aud="children"]');
  await expect(view.getByRole("heading", { name: "Children: the stack behind the door" })).toBeVisible();
  await expect(view.locator(".lm-bk")).toHaveCount(10);
  await expect(page.locator('.lm-door[data-aud="children"]')).toHaveAttribute("aria-expanded", "true");
  await page.locator('.lm-door[data-aud="families"]').click();
  await expect(page).toHaveURL(/\?for=families$/);
  await page.locator('.lm-door[data-aud="families"]').click();
  await expect(page.locator(".lm-drawer")).toBeHidden();
  await expect(page).toHaveURL(/\/resources\/learning$/);
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });
  test("another door slides its stack in and clears the kind filter", async ({ page }) => {
    await page.goto("/resources/learning?for=children");
    const chip = page.locator('.lm-view[data-aud="children"] .lm-kind', { hasText: "Activity pages" });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".lm-bk.dim").first()).toBeVisible();
    await page.locator('.lm-door[data-aud="teens"]').click();
    // Mid-slide: both stacks on stage, the next one moving sideways (a transform, never an opacity fade).
    const motion = await page.evaluate(() => ({
      views: document.querySelectorAll(".lm-view").length,
      // The slide is scripted (Web Animations); the line art loops on its own CSS animations, which are left out here.
      moves: document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).map((a) => JSON.stringify((a.effect as KeyframeEffect).getKeyframes())),
    }));
    expect(motion.views).toBe(2);
    expect(motion.moves.some((k) => k.includes("translateX"))).toBe(true);
    expect(motion.moves.some((k) => k.includes("opacity"))).toBe(false);
    await expect(page.locator(".lm-view")).toHaveCount(1);
    await expect(page.locator(".lm-view")).toHaveAttribute("data-aud", "teens");
    await expect(page.locator('.lm-kind[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.locator(".lm-bk.dim")).toHaveCount(0);
    await expect(page).toHaveURL(/\?for=teens$/);
  });
});

for (const width of [1440, 400]) {
  test(`the line under the doors never changes height while pointing at every door (${width} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/resources/learning?for=adults");
    const hint = ".lm-door-hint";
    const rest = await height(page, hint);
    for (const door of await page.locator(".lm-door").all()) {
      await door.scrollIntoViewIfNeeded();
      await door.hover();
      expect(await height(page, hint)).toBeCloseTo(rest, 0);
    }
    await expect(page.locator(`${hint} .stable-tip-live`)).toContainText(/Leaders/);
  });
}

test("the panel's rows line up and the panel keeps one height while pointing at every book", async ({ page }) => {
  await page.goto("/resources/learning?for=adults");
  const panel = page.locator('.lm-view[data-aud="adults"] .lm-panel');
  const rest = await panel.evaluate((el) => el.getBoundingClientRect().height);
  for (const book of await page.locator('.lm-view[data-aud="adults"] .lm-bk').all()) {
    await book.hover();
    expect(await panel.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(rest, 0);
    const rows = await panel.locator(".stable-tip-live .lm-pn-facts > div").evaluateAll((divs) => divs.map((d) => {
      const [dt, dd] = [d.querySelector("dt")!.getBoundingClientRect(), d.querySelector("dd")!.getBoundingClientRect()];
      return { top: dt.top - dd.top, bottom: dt.bottom - dd.bottom };
    }));
    expect(rows.length).toBe(7);
    for (const r of rows) { expect(Math.abs(r.top)).toBeLessThan(1); expect(Math.abs(r.bottom)).toBeLessThan(1); }
  }
});

test("Moses: the title page turns real pages and both downloads return PDFs", async ({ page, request }) => {
  await page.goto("/resources/learning?for=adults");
  await page.locator(".stable-tip-live .lm-pn-open").click();
  await expect(page).toHaveURL(/\/resources\/learning\/moses-three-forties$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Moses");
  await expect(page.getByRole("link", { name: "Back to the adults door" })).toHaveAttribute("href", "/resources/learning?for=adults");
  await page.locator(".lm-pages button").nth(1).click();
  const viewer = page.getByRole("dialog");
  await expect(viewer).toContainText("Page 3 of 42");
  const first = await viewer.locator("img").getAttribute("src");
  await viewer.getByRole("button", { name: "Next page" }).click();
  await expect(viewer).toContainText("Page 4 of 42");
  expect(await viewer.locator("img").getAttribute("src")).not.toBe(first);
  await page.keyboard.press("ArrowRight");
  await expect(viewer).toContainText("Page 5 of 42");
  const loaded = await viewer.locator("img").evaluate((img: HTMLImageElement) => img.decode().then(() => img.naturalWidth));
  expect(loaded).toBeGreaterThan(900);
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(page.locator(".lm-sess")).toHaveCount(8);
  await page.locator(".lm-sess").first().click();
  await expect(page.locator(".lm-sess-open blockquote")).toContainText("Exodus 2:10");
  const downloads = page.locator(".lm-dl-row a");
  await expect(downloads).toHaveCount(2);
  for (const link of await downloads.all()) {
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^\/learning\/moses-three-forties-(a4|letter)\.pdf$/);
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("pdf");
  }
  await page.getByRole("link", { name: "Back to the adults door" }).click();
  await expect(page.locator('.lm-view[data-aud="adults"]')).toBeVisible();
});

test("a planned title shows what it will be written from, and nothing to download", async ({ page }) => {
  await page.goto("/resources/learning/noah-ark");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Noah builds the ark");
  await expect(page.locator(".lm-tag.planned").first()).toBeVisible();
  await expect(page.locator(".lm-dl-row, .lm-pages, .lm-sess")).toHaveCount(0);
  await expect(page.locator(".lm-from-list a").first()).toHaveAttribute("href", /^\/people\/noah-gen-5-29$/);
  await expect(page.getByRole("link", { name: "Back to the little ones door" })).toBeVisible();
  await page.goto("/resources/learning/no-such-title");
  await expect(page).toHaveURL(/\/resources\/learning$/);
});

test("the station's Learning doorway counts the division", async ({ page }) => {
  await page.goto("/resources");
  await expect(page.getByRole("link", { name: /Learning materials/ })).toContainText("1 ready · 40 planned · 7 readers");
});

test("400 px: no sideways scroll on the doors, an open stack, or a title page", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 });
  for (const url of ["/resources/learning", "/resources/learning?for=children", "/resources/learning?for=leaders", "/resources/learning/moses-three-forties", "/resources/learning/year-q1"]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await noSidewaysScroll(page);
  }
});
