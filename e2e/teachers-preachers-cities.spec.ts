import { expect, test, type Page } from "@playwright/test";

// Preachers & authors · 03 Cities that gathered them (approved mock-up: design/authors-directions/teachers/cities.js):
// a card for every town where two or more teachers lived, each with its landmark drawing; choosing one moves the map
// (Europe or America) onto it with a line from where each teacher came; the panel lists who arrived when, and each row
// opens the profile drawer. The list is held to the map's height on desktop and capped at 24rem below 1100px.

const ADDRESS = "/teachers/preachers-and-authors";

async function openCities(page: Page) {
  await page.goto(ADDRESS);
  const section = page.locator("section#cities");
  // The page's data (about 1.4 MB) loads after the shell; give a cold first load time before scrolling to the section.
  await expect(section.getByRole("heading", { level: 2 })).toContainText("Cities that gathered them", { timeout: 20_000 });
  await section.scrollIntoViewIfNeeded();
  return section;
}

test("every shared town has a card with its landmark, and London (the most teachers) is chosen first", async ({ page }) => {
  const section = await openCities(page);
  const cards = section.getByRole("group", { name: "Choose a city" }).getByRole("button");
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(10);
  await expect(section.locator(".tp-line")).toContainText(`${count} towns where two or more`);
  await expect(section.locator(".cty-card .cty-ico")).toHaveCount(count);
  await expect(cards.first()).toHaveAttribute("aria-pressed", "true");
  await expect(cards.first()).toContainText("London");
  await expect(section.locator(".cty-title")).toHaveText("London");
  await expect(section.locator(".cty-landmark")).toContainText("Big Ben");
  await expect(section.locator(".cty-caption")).toHaveText("Britain and western Europe");
  // Each card's dots are its teachers, and the panel lists the same number of rows.
  const dots = await cards.first().locator(".cty-card-dots i").count();
  await expect(section.locator(".cty-stays li")).toHaveCount(dots);
});

test("choosing an American city moves the map across and draws where each teacher came from", async ({ page }) => {
  const section = await openCities(page);
  const before = await section.locator(".cty-svg").getAttribute("viewBox");
  await section.getByRole("button", { name: /^Princeton,/ }).click();
  await expect(section.getByRole("button", { name: /^Princeton,/ })).toHaveAttribute("aria-pressed", "true");
  await expect(section.getByRole("button", { name: /^London,/ })).toHaveAttribute("aria-pressed", "false");
  await expect(section.locator(".cty-title")).toHaveText("Princeton");
  await expect(section.locator(".cty-landmark")).toContainText("Nassau Hall");
  await expect(section.locator(".cty-caption")).toHaveText("Eastern United States");
  await expect(section.locator(".cty-came").first()).toBeAttached();
  await expect.poll(() => section.locator(".cty-svg").getAttribute("viewBox")).not.toBe(before);
  // Pointing at a row lights that teacher's line and dims the rest.
  const row = section.locator(".cty-stays button").filter({ hasText: "from" }).first();
  await row.hover();
  await expect(section.locator(".cty-svg")).toHaveClass(/has-lit/);
  await expect(section.locator(".cty-came.is-lit")).toHaveCount(1);
});

test("a row opens that teacher's profile", async ({ page }) => {
  const section = await openCities(page);
  const row = section.locator(".cty-stays button").first();
  const name = (await row.locator("b").textContent()) ?? "";
  await row.click();
  const drawer = page.getByRole("dialog", { name: "Teacher profile" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText(name);
});

test("the list keeps to the map's height on desktop and to 24rem below 1100px, scrolling inside", async ({ page }) => {
  const section = await openCities(page);
  const width = page.viewportSize()?.width ?? 0;
  const map = await section.locator(".cty-map").boundingBox();
  const panel = await section.locator(".cty-panel").boundingBox();
  const list = section.locator(".cty-stays");
  if (!map || !panel) throw new Error("the cities map or panel was not drawn");
  if (width > 1100) expect(Math.abs(panel.height - map.height)).toBeLessThanOrEqual(2);
  else expect((await list.boundingBox())?.height ?? 0).toBeLessThanOrEqual(24 * 16 + 1);
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
