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

async function expectProfileFor(page: Page, name: string) {
  await expect(profile(page)).toBeVisible();
  await expect(profile(page)).toContainText(name);
  await page.keyboard.press("Escape");
  await expect(profile(page)).toBeHidden();
}

test("Built on their work shows actual inputs and progressively loads citations", async ({ page }) => {
  await openPage(page);
  const card = page.locator("#built .usage-card");
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".usage-features button")).toHaveCount(8);
  await expect(card.locator(".usage-source")).toHaveCount(3);
  await expect(card.locator(".usage-source").first()).toContainText("Builds the feature");
  await expect(card.locator(".usage-uses a").first()).toHaveAttribute("href", "/topics");
  await card.getByRole("button", { name: /^Letters/ }).click();
  await expect(card.locator(".usage-source")).toHaveCount(20);
  const scroll = card.locator(".usage-scroll");
  const before = await page.evaluate(() => window.scrollY);
  await scroll.evaluate(el => { el.scrollTop = (el.scrollHeight - el.clientHeight) * .45; });
  await expect(card.locator(".usage-source")).toHaveCount(40);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await card.getByRole("searchbox").fill("Westcott");
  await expect(card.locator(".usage-source").first()).toBeVisible();
  await expect(card.locator(".usage-scroll")).toContainText("Hebrews");
  await expect(card.locator(".usage-scroll")).not.toContainText("The New Testament in the Original Greek");
  await card.getByRole("searchbox").fill("zzzz-no-source");
  await expect(card.locator(".usage-empty")).toBeVisible();
  await card.getByRole("button", { name: /^Apologetics studies/ }).click();
  await expect(card.getByRole("searchbox")).toHaveValue("");
  await expect(card.locator(".usage-source")).toHaveCount(20);
  await expect(card.locator(".usage-uses a").first()).toHaveAttribute("href", /^\/apologetics\/study\//);
  await expect(card.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
});

// Full catalogue and archived Fields interactions: teachers-full-catalogue.spec.ts.

test("author credits expose counted evidence beyond the profiles with progressive scrolling", async ({ page }) => {
  await openPage(page);
  const section = page.locator("#named");
  await section.scrollIntoViewIfNeeded();
  const names = section.locator(".credit-person");
  await expect(names).toHaveCount(40);
  await expect(section.locator(".credit-detail h3")).toHaveText(await names.first().locator("b").innerText());
  const list = section.locator(".credit-list");
  const y = await page.evaluate(() => window.scrollY);
  await list.evaluate(el => { el.scrollTop = (el.scrollHeight - el.clientHeight) * .45; });
  await expect(names).toHaveCount(80);
  expect(await page.evaluate(() => window.scrollY)).toBe(y);
  await section.getByLabel("Find a credited name or work").fill("Westcott");
  await expect(names.first()).toBeVisible();
  await expect(section.locator(".credit-detail h3")).toContainText("Westcott");
  await section.getByLabel("Site area", { exact: true }).selectOption("letters");
  await expect(section.locator(".credit-meta").first()).toContainText("Letters study");
  await expect(section.locator(".credit-detail")).toContainText("Hebrews");
  await expect(section.locator(".credit-work a").first()).toHaveAttribute("href", /^https:/);
  await expect(section.locator(".credit-work li a").first()).toHaveAttribute("href", /^\/study\/letters/);
  await section.getByLabel("Find a credited name or work").fill("zzzz-no-credit");
  await expect(section.locator(".credit-empty")).toContainText("does not mean the author is absent");
  await section.getByLabel("Find a credited name or work").fill("");
  await section.getByLabel("Site area", { exact: true }).selectOption("");
  await section.getByLabel("Sort", { exact: true }).selectOption("name");
  await expect(names).toHaveCount(40);
  const order = await names.locator("b").allTextContents();
  expect(order).toEqual([...order].sort((a,b) => a.localeCompare(b)));
  const second = await names.nth(1).locator("b").innerText();
  await names.nth(1).click();
  await expect(section.locator(".credit-detail h3")).toHaveText(second);
  await section.getByLabel("Find a credited name or work").fill("John Gill");
  await expect(section.locator(".credit-work")).toHaveCount(20);
  await section.locator(".credit-evidence").evaluate(el => { el.scrollTop = (el.scrollHeight - el.clientHeight) * .45; });
  await expect(section.locator(".credit-work")).toHaveCount(40);
  await section.getByLabel("Site area", { exact: true }).selectOption("letters");
  expect(await section.locator(".credit-evidence").evaluate(el => el.scrollTop)).toBe(0);
  await expect(section.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
});

test("the directory lists every scholar by era or from A to Z without moving the page", async ({ page }) => {
  await openPage(page);
  const list = page.locator("#directory .dir-list");
  const total = await list.locator("li").count();
  await expect(page.locator("#directory h2")).toContainText(`${total} documented scholar profiles`);
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
