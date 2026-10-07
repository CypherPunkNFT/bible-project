import { expect, test } from "@playwright/test";

// The Letters study (src/components/letters/browse/): a home of four collections and four ways in, each a page of
// cards, each card opening its section page at its part. Runs at desktop, tablet and phone.

test("letters: the home shows the four collections and the four ways in", async ({ page }) => {
  await page.goto("/study/letters");
  await expect(page.getByRole("heading", { name: /The four collections/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Across all twenty-one/ })).toBeVisible();
  await expect(page.locator(".lb-card")).toHaveCount(8);
  await page.locator(".lb-card", { hasText: "Christ in the letters" }).click();
  await expect(page).toHaveURL(/\/study\/letters\/christ-in-the-letters$/);
  await expect(page.locator(".lb-card")).toHaveCount(12);
});

test("letters: a card opens its section page at its own part", async ({ page }) => {
  await page.goto("/study/letters/paul");
  await expect(page.getByRole("heading", { name: /Paul's letters/ })).toBeVisible();
  await page.locator(".lb-card", { hasText: "His companions over time" }).click();
  await expect(page).toHaveURL(/\/study\/letters\/paul\/story\/companions$/);
  await expect(page.locator(".lb-part")).toHaveCount(4);
  await expect(page.locator("#part-companions")).toBeInViewport();
});

test("letters: choosing a letter makes the Inside cards follow it", async ({ page }) => {
  await page.goto("/study/letters/james-peter-and-jude");
  await page.getByRole("button", { name: "Inside Jude" }).click();
  await expect(page).toHaveURL(/letter=JUD/);
  await expect(page.getByRole("heading", { name: /Inside Jude/ })).toBeVisible();
  await page.locator(".lb-card", { hasText: "Jude at a glance" }).click();
  await expect(page).toHaveURL(/\/inside\/glance\?letter=JUD$/);
  await expect(page.locator("#part-glance").getByRole("heading", { name: "Jude at a glance" })).toBeVisible();
});

test("letters: the old group addresses open their collection", async ({ page }) => {
  await page.goto("/study/letters#hebrews");
  await expect(page).toHaveURL(/\/study\/letters\/hebrews$/);
  await expect(page.getByRole("heading", { name: /Hebrews\./ })).toBeVisible();
});

test("letters: every page has its sources and no page scrolls sideways", async ({ page }) => {
  for (const path of ["/study/letters", "/study/letters/paul/inside", "/study/letters/hebrews/argument", "/study/letters/look-closer/side", "/study/letters/what-runs-through-them/words"]) {
    await page.goto(path);
    await expect(page.locator(".lb")).toBeVisible();
    if (path !== "/study/letters") await expect(page.locator(".lb-sources li").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
