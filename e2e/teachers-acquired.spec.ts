import { expect, test } from "@playwright/test";

test("late sermon contributors are discoverable without an external reading substitute", async ({ page }) => {
  await page.goto("/teachers/preachers-and-authors");
  await page.getByLabel("Find a contributor", { exact: true }).fill("Criswell");
  const card = page.locator(".acq-contributors details");
  await expect(card).toHaveCount(1);
  await card.locator("summary").click();
  await expect(card.locator(".acq-works li").first()).toBeVisible();
  await card.locator(".acq-works li a").first().click();
  await expect(page.locator(".acq-pending")).toContainText("Public display permission is not yet established");
  await expect(page.locator(".acq-reading")).toHaveCount(0);
  expect(await page.locator('.acq-reader a[href^="http"]:not(.acq-sources a)').count()).toBe(0);
});

test("the held Latin edition reads and paginates on-site with attribution at the bottom", async ({ page }) => {
  await page.goto("/teachers/works/held-39d31ca9420cf141621b35cbc66fce90");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Commonitorium");
  await expect(page.locator(".acq-reading p").first()).toBeVisible();
  const first = await page.locator(".acq-reading").innerText();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Reading page 2 / 2")).toBeVisible();
  await expect(page.locator(".acq-reading")).not.toHaveText(first);
  await expect(page.locator(".acq-sources")).toContainText("Greta Franzini");
  expect(await page.locator('.acq-reader a[href^="http"]:not(.acq-sources a)').count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
