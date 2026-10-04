import { expect, test } from "@playwright/test";

const views = ["arcs", "matrix", "sections", "sizes", "chapters", "jesus", "timeline", "coverage"];

test("charts: all eight views fit the viewport and support keyboard selection", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/charts");
  await page.getByRole("tab").first().focus();
  for (const [index, id] of views.entries()) {
    if (index) await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tabpanel")).toHaveAttribute("id", id);
    await expect(page.getByRole("tab").nth(index)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").getByRole("status")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test("charts: direct links and browser history restore the selected view without downloading unused connections", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/charts#coverage");
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "coverage");
  await page.getByRole("tab", { name: /Book lengths/ }).click();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "sizes");
  await page.goBack();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "coverage");
  expect(requests.some((url) => /xref-(arcs|books)\.json/.test(url))).toBe(false);
});

test("charts: arc focus can be pinned and reset", async ({ page }) => {
  await page.goto("/charts#arcs");
  await page.getByLabel("Light up one book:").selectOption("DAN");
  await expect(page.locator(".chart-live-detail strong")).toHaveText("Daniel");
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(page.locator(".chart-live-detail strong")).toHaveText("The whole Bible");
  await expect(page.getByLabel("Light up one book:")).toHaveValue("");
});

test("charts: book matrix selectors report the actual dataset count and ranked pairs are selectable", async ({ page, request }) => {
  const pairs = await (await request.get("/data/xref-books.json")).json() as [string, string, number][];
  const expected = pairs.find(([a, b]) => a === "DAN" && b === "REV")![2];
  await page.goto("/charts#matrix");
  await page.getByLabel("From book", { exact: true }).selectOption({ label: "Daniel" });
  await page.getByLabel("To book", { exact: true }).selectOption({ label: "Revelation" });
  await expect(page.locator(".matrix-detail h3")).toHaveText("Daniel → Revelation");
  await expect(page.locator(".matrix-detail strong")).toHaveText(new Intl.NumberFormat("en-US").format(expected));
  await page.locator(".matrix-pairs button").first().click();
  await expect(page.locator(".matrix-pairs button").first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.locator(".matrix-detail h3")).toHaveText("Discover a connection");
});

test("charts: book lengths sort by the chosen measurement", async ({ page }) => {
  await page.goto("/charts#sizes");
  await page.getByRole("button", { name: "chapters", exact: true }).click();
  await page.getByLabel("Order", { exact: true }).selectOption("longest");
  await expect(page.locator(".size-bars a").first()).toHaveAttribute("href", "/read/kjv/PSA/1");
  await expect(page.locator(".size-bars a").first()).toContainText("150");
});

test("charts: chapter search and arrow keys open the right chapter", async ({ page }) => {
  await page.goto("/charts#chapters");
  await page.getByRole("searchbox", { name: "Find a book" }).fill("Psalms");
  await expect(page.locator(".chapter-atlas-row")).toHaveCount(1);
  await page.getByRole("button", { name: /^Psalms 1:/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: /^Psalms 2:/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/read\/kjv\/PSA\/2$/);
});

test("charts: section selection and coverage filters work without hover", async ({ page }) => {
  await page.goto("/charts#sections");
  const poetry = page.getByRole("button", { name: /Poetry & Wisdom/ });
  await poetry.click();
  await expect(poetry).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /Version coverage/ }).click();
  await page.getByLabel("Inspect a book").selectOption("GEN");
  await expect(page.locator(".chart-live-detail")).toContainText("Genesis is included in");
});
