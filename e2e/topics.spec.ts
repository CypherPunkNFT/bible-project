import { expect, test } from "@playwright/test";

// Topics (scripts/build-topics.py): needs data/topics, built from Torrey's New Topical Textbook.

test("the way in: the menu leads to the topic families, a family to its groups, a group to its topics", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Topics", exact: true }).first().click();
  await expect(page).toHaveURL(/\/topics$/);
  await expect(page.getByText(/623 topics in 12 families and \d+ groups/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Sin, salvation and the life to come/ })).toBeVisible();
  await page.getByRole("link", { name: "God", exact: true }).click();
  await expect(page).toHaveURL(/\/topics\/c\/god$/);
  await expect(page.getByRole("navigation", { name: "Topic families" }).getByRole("link")).toHaveCount(12);
  await page.getByRole("button", { name: "Attributes of God" }).click();
  await expect(page).toHaveURL(/group=attributes-of-god/);
  await page.getByRole("link", { name: /^The Love of God/ }).click();
  await expect(page).toHaveURL(/\/topics\/love-of-god$/);
  await expect(page.getByRole("heading", { level: 1, name: "The Love of God" })).toBeVisible();
});

test("an old group link (#group) still opens that group", async ({ page }) => {
  await page.goto("/topics/c/god#works-of-god");
  await expect(page.getByRole("heading", { level: 3, name: "Works & ways of God" })).toBeVisible();
});

test("finding a topic by name shows result cards", async ({ page }) => {
  await page.goto("/topics");
  await page.getByPlaceholder(/Find a topic/).fill("sabbath");
  await expect(page.getByRole("link", { name: /^The Sabbath/ })).toBeVisible();
});

test("a topic page: breadcrumb, key verses in full, points that open", async ({ page }) => {
  await page.goto("/topics/love-of-god");
  await expect(page.getByRole("heading", { level: 1, name: "The Love of God" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Attributes of God");
  await expect(page.getByText(/God is love/).first()).toBeVisible();
  await page.goto("/topics/afflictions");
  await expect(page.getByRole("link", { name: "Lamentations 3:33" })).toHaveCount(0); // point 5 starts folded
  await page.getByRole("button", { name: "Open all" }).click();
  await expect(page.getByRole("link", { name: "Lamentations 3:33" })).toHaveAttribute("href", /LAM/);
});

test("the reader shows the topics of the chapter", async ({ page }) => {
  await page.goto("/read/kjv/PSA/23");
  const topics = page.getByRole("region", { name: "Topics in this chapter" });
  await expect(topics.getByRole("link", { name: /Christ the Shepherd/ })).toBeVisible({ timeout: 20_000 });
});

test("study and search lead to topics too", async ({ page }) => {
  await page.goto("/study");
  await expect(page.getByRole("link", { name: /Topics/ }).filter({ hasText: "623 subjects" })).toBeVisible();
  await page.goto("/search");
  await expect(page.getByRole("link", { name: /All 623 topics/ })).toBeVisible();
  await page.goto("/search?q=grace&in=kjv");
  await expect(page.locator("section[aria-labelledby=search-topics]").getByRole("link", { name: /^Grace/ })).toBeVisible();
});
