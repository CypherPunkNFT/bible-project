import { expect, test } from "@playwright/test";

// Topics (scripts/build-topics.py): needs data/topics, built from Torrey's New Topical Textbook, Nave's Topical Bible and
// Easton's Bible Dictionary.

test("the way in: the menu leads to the topic families, a family to its groups, a group to its topics", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Topics", exact: true }).first().click();
  await expect(page).toHaveURL(/\/topics$/);
  await expect(page.getByText(/5,603 topics in 55 families and \d+ groups/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Sin, salvation and the life to come/ })).toBeVisible();
  await page.getByRole("link", { name: "Who God is", exact: true }).click();
  await expect(page).toHaveURL(/\/topics\/c\/god$/);
  await expect(page.getByRole("navigation", { name: "Topic sections" }).getByRole("link")).toHaveCount(7);
  await expect(page.getByRole("navigation", { name: "Families in God and his word" }).getByRole("link")).toHaveCount(7);
  await page.getByRole("button", { name: "Attributes of God" }).click();
  await expect(page).toHaveURL(/group=attributes-of-god/);
  await page.locator(`a[href="/topics/love-of-god"]`).click();
  await expect(page).toHaveURL(/\/topics\/love-of-god$/);
  await expect(page.getByRole("heading", { level: 1, name: "The Love of God" })).toBeVisible();
});

test("an old group link (#group) still opens that group", async ({ page }) => {
  await page.goto("/topics/c/god-works#works-of-god");
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
  // Torrey's list comes first; its point 5 starts folded. Nave's list beside it has its own "Open all".
  const torrey = page.locator(".topics-point-book").first();
  await expect(torrey.getByRole("link", { name: "Lamentations 3:33" })).toHaveCount(0);
  await torrey.getByRole("button", { name: "Open all" }).click();
  await expect(torrey.getByRole("link", { name: "Lamentations 3:33" })).toHaveAttribute("href", /LAM/);
});

test("the reader shows the topics of the chapter", async ({ page }) => {
  await page.goto("/read/kjv/PSA/23");
  const topics = page.getByRole("region", { name: "Topics in this chapter" });
  await expect(topics.getByRole("link", { name: /Christ the Shepherd/ })).toBeVisible({ timeout: 20_000 });
});

test("study and search lead to topics too", async ({ page }) => {
  await page.goto("/study");
  await expect(page.getByRole("link", { name: /Topics/ }).filter({ hasText: "5,603 subjects" })).toBeVisible();
  await page.goto("/search");
  const browse = page.locator("section[aria-labelledby=browse-topics]");
  await expect(browse.getByRole("heading", { name: /God and his word/ })).toBeVisible(); // the whole Topics page, on Search
  await browse.getByRole("link", { name: "Who God is", exact: true }).click();
  await expect(page).toHaveURL(/\/topics\/c\/god$/);
  await page.goto("/search?q=grace&in=kjv");
  await expect(page.locator("section[aria-labelledby=search-topics]").getByRole("link", { name: /^Grace/ }).first()).toBeVisible();
});

test("Nave's topics: a person with Easton's article, both books side by side, and a See heading that redirects", async ({ page }) => {
  await page.goto("/topics/aaron");
  await expect(page.getByRole("heading", { level: 1, name: "Aaron" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In brief" })).toBeVisible();
  await expect(page.getByText(/eldest son of Amram and Jochebed/)).toBeVisible();
  await expect(page.locator("section:has(#topic-elsewhere)").getByRole("link", { name: /^Aaron/ }).first()).toHaveAttribute("href", /\/study\/people\//);
  await page.goto("/topics/faith");
  await expect(page.getByText("Torrey’s New Topical Textbook", { exact: true })).toBeVisible();
  await expect(page.getByText("Nave’s Topical Bible", { exact: true })).toBeVisible();
  await page.goto("/topics/josias");
  await expect(page).toHaveURL(/\/topics\/josiah$/);
});

test("a large group lists its topics A to Z with a filter and letters", async ({ page }) => {
  await page.goto("/topics/c/era-kings?group=kings-families");
  const grid = page.getByRole("list", { name: "Topics in Families & names" });
  await expect(grid.getByRole("listitem").first()).toBeVisible();
  expect(await grid.getByRole("listitem").count()).toBeGreaterThan(100);
  await page.getByRole("button", { name: "A", exact: true }).click();
  await expect(grid.getByRole("listitem").first()).toHaveText(/^A/);
  await page.getByPlaceholder(/Filter \d+ topics/).fill("no-such-name");
  await expect(page.getByText(/No topic in Families & names matches/)).toBeVisible();
});

test("the new cards: books with Easton's introduction, Jesus' miracles one by one, people by era, great passages", async ({ page }) => {
  await page.goto("/topics/book-genesis");
  await expect(page.getByRole("heading", { level: 1, name: "The Book of Genesis" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Read Genesis/ })).toHaveAttribute("href", "/read/kjv/GEN/1");
  await page.goto("/topics/c/christ-miracles?group=miracles-raising");
  await page.getByRole("link", { name: /^Raising of Lazarus/ }).click();
  await expect(page.getByRole("link", { name: /Part of The Miracles of Christ/ })).toBeVisible();
  await page.goto("/topics/jesus-the-christ");
  await expect(page.locator("section:has(#topic-parts) li").first()).toBeVisible();
  expect(await page.locator("section:has(#topic-parts) li").count()).toBeGreaterThan(60);
  await page.goto("/topics/c/era-kingdom");
  await expect(page.getByRole("button", { name: "Samuel, Saul, David & Solomon" })).toBeVisible();
  await page.goto("/topics");
  await expect(page.locator(".topics-readings li")).toHaveCount(53);
  await expect(page.locator(".topics-readings").getByRole("link", { name: "Psalms 23:1–6" })).toBeVisible();
});

test("placement fixes (2026-10-07): contents pages say so, retired addresses forward, people on their era's card", async ({ page }) => {
  await page.goto("/topics/c/family?group=marriage-and-family");
  await expect(page.getByRole("link", { name: /^Family\s*Contents: 7 topics/ })).toBeVisible();
  await page.goto("/topics/prodigal-son");
  await expect(page).toHaveURL(/\/topics\/parable-the-prodigal-son-and-his-older-brother$/);
  await page.goto("/topics/of-god-love-of-love");
  await expect(page.getByRole("heading", { level: 1, name: "The Love of God" })).toBeVisible();
  await page.goto("/topics/c/era-patriarchs?group=patriarchs-leaders");
  await expect(page.locator(`a[href="/topics/jacob"]`)).toBeVisible();
  await page.goto("/topics/c/christ-teaching?group=parables-and-allegories");
  await expect(page.getByRole("heading", { level: 3, name: "Other parables & allegories" })).toBeVisible();
  await expect(page.locator(`a[href="/topics/sower"], a[href="/topics/tares"], a[href="/topics/prodigal-son"]`)).toHaveCount(0);
});
