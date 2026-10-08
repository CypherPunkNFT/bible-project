import { expect, test, type Page } from "@playwright/test";

// Prophet pages ("the word", /people/:id/word; Research/People/PROPHETS.md) and their links from the person pages, the
// ruler pages and Prophets through time. Runs at desktop, tablet and phone.

const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
const switchOf = (page: Page, name: string) => page.getByRole("navigation", { name: `Pages about ${name}` });

test("prophet pages: the person page opens the word, and the switch goes back", async ({ page }) => {
  await page.goto("/people/elijah-1ki-17-1");
  await expect(page.getByRole("heading", { name: "Elijah", level: 1 })).toBeVisible();
  await page.locator(".pp-entry", { hasText: "Explore the word" }).click();
  await expect(page).toHaveURL(/\/people\/elijah-1ki-17-1\/word$/);
  await expect(page.locator("#pp-hero-title")).toContainText("Elijah.");
  await expect(switchOf(page, "Elijah").getByRole("link", { name: "The word" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#pp-kings")).toBeVisible();
  await switchOf(page, "Elijah").getByRole("link", { name: "The person" }).click();
  await expect(page).toHaveURL(/\/people\/elijah-1ki-17-1$/);
});

test("prophet pages: Moses has three pages, and the switch shows them all", async ({ page }) => {
  await page.goto("/people/moses-exo-2-10/word");
  const nav = switchOf(page, "Moses");
  await expect(nav.getByRole("link")).toHaveText(["The person", "As leader", "The word"]);
  await expect(nav.getByRole("link", { name: "The word" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "As leader" }).click();
  await expect(page).toHaveURL(/\/people\/moses-exo-2-10\/rule$/);
  await expect(switchOf(page, "Moses").getByRole("link", { name: "As leader" })).toHaveAttribute("aria-current", "page");
  await page.goto("/people/moses-exo-2-10");
  await expect(page.locator(".pp-entry")).toHaveCount(2);
});

test("prophet pages: a prophet the LORD had not sent is titled in the text's words", async ({ page }) => {
  await page.goto("/people/hananiah-jer-28-1/word");
  await expect(page.locator("#pp-hero-title")).toContainText("Hananiah.");
  await expect(page.locator(".pp-stat[data-not-sent]")).toContainText(/not sent/i);
  await noSideScroll(page);
});

test("prophet pages: John the Baptist, a New Testament prophet, with how his story ends", async ({ page }) => {
  await page.goto("/people/john-mat-3-1/word");
  await expect(page.locator("#pp-hero-title")).toContainText("John");
  await expect(page.locator("#pp-ending")).toBeVisible();
  await expect(page.locator(".pp-jump a").first()).toBeVisible();
  await noSideScroll(page);
});

test("prophet pages: Prophets through time opens a prophet's word page", async ({ page }) => {
  await page.goto("/study/people?view=prophets");
  await page.locator("#prophet-elijah-1ki-17-1 h3 a").click();
  await expect(page).toHaveURL(/\/people\/elijah-1ki-17-1\/word$/);
  await expect(page.getByRole("link", { name: "Back to Prophets through time" })).toBeVisible();
});

test("prophet pages: a ruler's prophets open their word pages", async ({ page }) => {
  await page.goto("/people/ahab-1ki-16-28/rule");
  await expect(page.locator("#pp-prophets")).toBeVisible();
  await expect(page.locator(".pp-stat a[href='/people/elijah-1ki-17-1/word']")).toHaveCount(1);
});

test("prophet pages: no word page scrolls sideways", async ({ page }) => {
  for (const path of ["/people/elijah-1ki-17-1/word", "/people/isaiah-2ki-19-2/word", "/people/jeremiah-2ch-35-25/word", "/people/moses-exo-2-10/word", "/people/moses-exo-2-10"]) {
    await page.goto(path);
    await expect(page.locator(".pp-page, .pp-entry").first()).toBeVisible();
    await noSideScroll(page);
  }
});
