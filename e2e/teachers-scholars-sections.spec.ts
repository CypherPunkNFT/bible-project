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
    const first = card.locator(".blt-st-group button").first();
    const name = (await first.locator("b").textContent()) ?? "";
    await first.click();
    await expectProfileFor(page, name);
    return;
  }
  const planned = await card.locator(".blt-work.blt-planned").count();
  expect(planned).toBeGreaterThan(0);
  await expect(card.locator(".blt-rib.blt-planned")).toHaveCount(planned);
  expect(await card.locator(".blt-rib:not(.blt-planned)").count()).toBeGreaterThanOrEqual(await card.locator(".blt-work:not(.blt-planned)").count());
  const caption = card.locator(".blt-cap-text");
  await expect(caption).toContainText("Hover a ribbon");
  const capBox = await card.locator(".blt-cap").boundingBox();

  const topics = card.locator(".blt-feat", { hasText: "Topics" });
  await topics.hover();
  await expect(caption).toContainText("Topics draws on");
  await expect(card.locator(".blt-stage")).toHaveClass(/blt-dim/);
  expect((await card.locator(".blt-cap").boundingBox())?.height).toBe(capBox?.height);
  await card.locator(".blt-sch").first().hover();
  await expect(card.locator(".blt-sch").first()).toHaveClass(/blt-on/);

  await topics.click();
  await expect(topics).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(5, 5);
  await expect(caption).toContainText("Topics draws on");
  await topics.click();
  await expect(topics).toHaveAttribute("aria-pressed", "false");
  await page.mouse.move(5, 5);
  await expect(caption).toContainText("Hover a ribbon");

  const scholar = card.locator(".blt-sch").first();
  const name = (await scholar.locator("b").textContent()) ?? "";
  await scholar.click();
  await expectProfileFor(page, name);
});

test("Five ways to study the Bible widens one field at a time and leads into the catalogue", async ({ page }) => {
  await openPage(page);
  const cards = page.locator("#fields .fld-card");
  await expect(cards).toHaveCount(5);
  const texts = cards.filter({ hasText: "Languages & texts" });
  await expect(texts.locator(".fld-head")).toHaveAttribute("aria-expanded", "true");
  const height = (await page.locator("#fields .fld-grid").boundingBox())?.height;

  const history = cards.filter({ hasText: "History" });
  await history.locator(".fld-head").click();
  await expect(history.locator(".fld-head")).toHaveAttribute("aria-expanded", "true");
  await expect(texts.locator(".fld-head")).toHaveAttribute("aria-expanded", "false");
  const count = Number((await history.locator(".fld-count").textContent())?.match(/\d+/)?.[0]);
  await expect(history.locator(".fld-people li")).toHaveCount(count);
  if (!isPhone(page) && (page.viewportSize()?.width ?? 0) > 900) {
    expect((await page.locator("#fields .fld-grid").boundingBox())?.height).toBe(height);
  }

  const person = history.locator(".fld-people button").first();
  const name = (await person.locator("b").textContent()) ?? "";
  await person.click();
  await expectProfileFor(page, name);

  await history.getByRole("button", { name: "See them in the catalogue" }).click();
  await expect(page.locator("#catalogue")).toBeInViewport();

  if ((page.viewportSize()?.width ?? 1440) <= 900) {
    // Narrow screens: choosing the open card again closes it in place.
    await history.locator(".fld-head").click();
    await expect(history.locator(".fld-head")).toHaveAttribute("aria-expanded", "false");
  }
});

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
  expect([...byWidth].sort()).toEqual([...byEra].sort());
  await page.locator("#named").getByRole("button", { name: "By era", exact: true }).click();
  expect(await order()).toEqual(byEra);

  const cell = rows.first().locator(".nmd-cell:not(.nmd-none)").first();
  await cell.hover();
  const tip = page.locator("#named .nmd-tip");
  await expect(tip).toHaveClass(/nmd-tip-on/);
  await expect(tip).toContainText(/Named in the /);
  await expect(rows.first()).toHaveClass(/nmd-hot/);
  await rows.first().locator(".nmd-none").first().hover();
  await expect(tip).toContainText(/Not named in the /);

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
  await expect(page.locator("#directory h2")).toContainText(`All ${total} scholars`);
  await expect(list.locator(".dir-group-era")).toHaveCount(4);
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
  expect(letters).toEqual([...letters].sort());
  await page.locator("#directory").getByRole("button", { name: "By era", exact: true }).click();
  await expect(list.locator(".dir-group-era")).toHaveCount(4);

  const row = list.locator("li button").first();
  const name = (await row.locator(".dir-nm").textContent()) ?? "";
  await row.click();
  await expectProfileFor(page, name);
});

test("no sideways scroll on the Scholars page", async ({ page }) => {
  await openPage(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
