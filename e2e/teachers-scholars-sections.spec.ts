import { expect, test, type Page } from "@playwright/test";

// Scholars (2026-10-08 port of design/scholars-directions/scholars/): "Built on their work", "Five ways to study the
// Bible", "Where the site names them" and the directory of all scholars. Counts come from the page itself, so these
// checks hold when the data grows.

const ADDRESS = "/teachers/scholars";

async function openPage(page: Page) {
  await page.goto(ADDRESS);
  await expect(page.locator("#directory .dir-list li").first()).toBeVisible();
}

const profile = (page: Page) => page.locator(".tp-scholars [role='dialog']");
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 760;

async function expectProfileFor(page: Page, name: string) {
  await expect(profile(page)).toBeVisible();
  await expect(profile(page)).toContainText(name);
  await page.keyboard.press("Escape");
  await expect(profile(page)).toBeHidden();
}

test("Built on their work joins features, books and scholars, follows the pointer and pins a feature", async ({ page }) => {
  await openPage(page);
  const card = page.locator("#built .blt-card");
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/blt-in/);
  if (isPhone(page)) {
    // The phone form: one list per feature, every book opening its scholar.
    await expect(card.locator(".blt-stage")).toBeHidden();
    await expect(card.locator(".blt-st-group")).toHaveCount(await card.locator(".blt-feat").count());
    const first = card.locator(".blt-st-group a").first();
    await expect(first).toHaveAttribute("href", /https?:/);
    return;
  }
  const planned = await card.locator(".blt-work.blt-planned").count();
  await expect(card.locator(".blt-rib.blt-planned")).toHaveCount(planned);
  expect(await card.locator(".blt-rib:not(.blt-planned)").count()).toBeGreaterThanOrEqual(await card.locator(".blt-work:not(.blt-planned)").count());
  await expect(card.locator(".blt-cap, .blt-legend")).toHaveCount(0);
  await expect(card.locator(".blt-scroll")).toHaveClass(/slim-scroll/);
  for (const subtitle of await card.locator(".blt-feat small").allTextContents()) expect(subtitle).toMatch(/^Top [1-5] sources$/);

  const topics = card.locator(".blt-feat", { hasText: "Topics" });
  await topics.hover();
  await expect(card.locator(".blt-stage")).toHaveClass(/blt-dim/);
  await card.locator(".blt-sch").first().hover();
  await expect(card.locator(".blt-sch").first()).toHaveClass(/blt-on/);

  await topics.click();
  await expect(topics).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(5, 5);
  await topics.click();
  await expect(topics).toHaveAttribute("aria-pressed", "false");
  await page.mouse.move(5, 5);

  const scholar = card.locator(".blt-sch").first();
  const name = (await scholar.locator("b").textContent()) ?? "";
  await scholar.click();
  await expectProfileFor(page, name);
});

// Full catalogue and archived Fields interactions: teachers-full-catalogue.spec.ts.

test("Where the site names them shades, explains, re-sorts and lists the never-named", async ({ page }) => {
  await openPage(page);
  const rows = page.locator("#named .nmd-rows li");
  const total = await rows.count();
  expect(total).toBeGreaterThan(10);
  const order = () => rows.evaluateAll((all) => all.map((li) => li.getAttribute("data-id")));
  const byEra = await order();
  await page.locator("#named").getByRole("button", { name: "By how widely named" }).click();
  await expect(page.getByRole("button", { name: "By how widely named" })).toHaveAttribute("aria-pressed", "true");
  const byWidth = await order();
  expect(byWidth).not.toEqual(byEra);
  expect(byWidth).toHaveLength(total);
  await page.locator("#named").getByRole("button", { name: "By era", exact: true }).click();
  expect(await order()).toEqual(byEra);

  const cell = rows.first().locator(".nmd-cell:not(.nmd-none)").first();
  await cell.hover();
  const tip = page.locator("#named .nmd-tip");
  await expect(tip).toHaveClass(/nmd-tip-on/);
  await expect(tip).toContainText(/distinct content pages in /);
  await expect(rows.first()).toHaveClass(/nmd-hot/);
  await rows.first().locator(".nmd-none").first().hover();
  await expect(tip).toContainText(/0 distinct content pages in /);

  const chip = page.locator("#named .nmd-unnamed button").first();
  await expect(chip).toBeVisible();
  const short = (await chip.textContent()) ?? "";
  await chip.click();
  await expect(profile(page)).toBeVisible();
  await expect(profile(page)).toContainText(short);
});

test("the directory lists every scholar by era or from A to Z without moving the page", async ({ page }) => {
  await openPage(page);
  const list = page.locator("#directory .dir-list");
  const total = await list.locator("li").count();
  await expect(page.locator("#directory h2")).toContainText("8,482 recorded contributors");
  await expect(list.locator(".dir-group-era")).toHaveCount(3);
  expect(await list.locator(".dir-use-in-use").count()).toBeGreaterThan(0);
  expect(await list.locator(".dir-use-held").count()).toBeGreaterThan(0);

  // The switch stays where it was on screen: re-grouping never scrolls or jumps the page.
  const toAz = page.locator("#directory").getByRole("button", { name: "A to Z" });
  await toAz.scrollIntoViewIfNeeded();
  const top = async () => (await toAz.boundingBox())?.y ?? 0;
  const before = await top();
  await toAz.click();
  await expect(page.locator("#directory .dir-mode")).toHaveAttribute("data-mode", "az");
  expect(await top()).toBe(before);
  await expect(list.locator("li")).toHaveCount(total);
  const letters = await list.locator(".dir-letter").allTextContents();
  expect(new Set(letters).size).toBe(letters.length);
  await page.locator("#directory").getByRole("button", { name: "By era", exact: true }).click();
  await expect(list.locator(".dir-group-era")).toHaveCount(3);

  const row = list.locator("li button").first();
  const name = (await row.locator(".dir-nm").textContent()) ?? "";
  await row.click();
  await expectProfileFor(page, name);
});

test("no sideways scroll on the Scholars page", async ({ page }) => {
  await openPage(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
