import { expect, test } from "@playwright/test";

// Topics (scripts/build-topics.py): needs data/topics, built from Torrey's New Topical Textbook.

test("topics index: two levels of categories, a filter, and links into topics", async ({ page }) => {
  await page.goto("/topics");
  await expect(page.getByText(/623 topics in 12 categories and \d+ subcategories/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Attributes of God" })).toBeVisible();
  await page.getByPlaceholder(/Find a topic/).fill("sabbath");
  await expect(page.getByRole("link", { name: /^The Sabbath/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Attributes of God" })).toHaveCount(0);
});

test("a topic page: breadcrumb, Torrey's points with verse links, neighbours", async ({ page }) => {
  await page.goto("/topics/afflictions");
  await expect(page.getByRole("heading", { level: 1, name: "Afflictions" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Trials");
  await expect(page.getByRole("link", { name: "Lamentations 3:33" })).toHaveAttribute("href", /LAM/);
  await expect(page.getByRole("heading", { name: /More in/ })).toBeVisible();
});

test("search shows the categories before a search, and matching topics after", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("link", { name: /All 623 topics/ })).toBeVisible();
  await page.goto("/search?q=grace&in=kjv");
  await expect(page.locator("section[aria-labelledby=search-topics]").getByRole("link", { name: /^Grace/ })).toBeVisible();
});
