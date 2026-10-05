import { expect, test } from "@playwright/test";

test("portraits: guided comparisons update the map, notes and passages and survive reload", async ({ page }) => {
  await page.goto("/study/gospels#portraits");
  const portraits = page.locator("#portraits");
  await expect(portraits.getByRole("heading", { name: "One meal. What does each Gospel bring into view?" })).toBeVisible();
  await expect(portraits.getByRole("region", { name: "John account" })).toContainText("five barley loaves");
  const mountain = portraits.getByRole("button", { name: "04 On the mountain", exact: true });
  await mountain.focus();
  await page.keyboard.press("Enter");
  await expect(mountain).toHaveAttribute("aria-pressed", "true");
  await expect(portraits.getByRole("region", { name: "Luke account" })).toContainText("went up into a mountain to pray");
  await expect(portraits.getByRole("region", { name: "John account" })).toContainText("Robertson groups no passage");
  await expect(portraits.locator(".portrait-map .portrait-highlight")).toHaveCount(3);
  await page.reload();
  await page.locator("#portraits").scrollIntoViewIfNeeded();
  await expect(mountain).toHaveAttribute("aria-pressed", "true");
  await portraits.getByRole("button", { name: "06 The costly anointing", exact: true }).click();
  await expect(portraits.locator(".portrait-question")).toContainText("John places the anointing before");
  const john = portraits.getByRole("region", { name: "John account" });
  await john.getByRole("link", { name: "Read the chapter in context" }).click();
  await expect(page).toHaveURL(/\/read\/kjv\/JHN\/12$/);
  await page.goBack();
  await expect(portraits.getByRole("button", { name: "06 The costly anointing", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("portraits: the complete event browser filters coverage and opens real selections", async ({ page }) => {
  await page.goto("/study/gospels#portraits");
  const portraits = page.locator("#portraits");
  await portraits.getByRole("searchbox", { name: "Search Gospel portrait entries" }).fill("five thousand");
  await portraits.getByRole("button", { name: "In all four", exact: true }).click();
  await expect(portraits.locator(".portrait-results li")).toHaveCount(1);
  await portraits.getByRole("button", { name: "In one Gospel", exact: true }).click();
  await expect(portraits.getByText("No entry matches.", { exact: false })).toBeVisible();
  await portraits.getByRole("searchbox").fill("first cleansing");
  await portraits.locator(".portrait-results button").click();
  await expect(portraits.locator(".portrait-map .portrait-highlight")).toHaveCount(1);
  await expect(portraits.getByRole("region", { name: "John account" })).toContainText("2:13–22");
  await expect(portraits.locator(".portrait-question")).toContainText("The first cleansing");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
