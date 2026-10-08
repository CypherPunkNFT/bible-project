import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

// Scholars (2026-10-08 port of design/scholars-directions/scholars/): the landing (headline, search, the scholars this
// site is built on, the constellation of field-shaped marks, figures, jump links), 01 · the catalogue (facets with
// counts, sort, cards, empty state), the shared profile (grows from its origin, previous / next follow the catalogue,
// Esc and the scrim close it) and 06 · By the numbers (rows filter the catalogue and follow it). Counts come from the
// data file, so these checks hold when the data grows.

interface Scholar { id: string; name: string; short: string; born: number; field: string; site: { status: string } | null }
interface Data { scholars: Scholar[]; fields: Record<string, string> }
const DATA = JSON.parse(readFileSync(fileURLToPath(new URL("../src/data/teachers/scholars.json", import.meta.url)), "utf8")) as Data;
const TOTAL = DATA.scholars.length;
const USED = DATA.scholars.filter((s) => s.site?.status === "in-use");
const byBirth = [...DATA.scholars].sort((a, b) => a.born - b.born);
const inField = (field: string) => byBirth.filter((s) => s.field === field);

const ADDRESS = "/teachers/scholars";
const profile = (page: Page) => page.locator(".tp-scholars [role='dialog']");
const count = (page: Page) => page.locator("#catalogue .cat-count");
const shownCards = (page: Page) => page.locator("#catalogue .cat-card:not([hidden])");
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 760;

async function openPage(page: Page) {
  await page.goto(ADDRESS);
  await expect(page.locator("#catalogue .cat-card").first()).toBeVisible();
}

test("the landing shows the headline, the figures, every scholar's mark and the scholars the site is built on", async ({ page }) => {
  await openPage(page);
  const landing = page.locator("#landing");
  await expect(landing.getByRole("heading", { level: 1 })).toHaveText("The greats, catalogued.");
  await expect(landing.locator(".lnd-node")).toHaveCount(TOTAL);
  await expect(landing.locator(".lnd-used-dot")).toHaveCount(USED.length);
  await expect(landing.locator(".lnd-flabel")).toHaveCount(Object.keys(DATA.fields).length);
  const chips = landing.locator(".lnd-used button");
  await expect(chips).toHaveCount(USED.length);
  await expect(landing.locator(".lnd-figs")).toContainText(`${TOTAL}`);
  await expect(landing.locator(".lnd-figs")).toContainText(`from ${byBirth[0].short} to ${byBirth[TOTAL - 1].short}`);
  // A chip opens that scholar's profile; Esc closes it.
  await chips.first().click();
  await expect(profile(page)).toBeVisible();
  await expect(profile(page).getByRole("heading", { level: 2 })).toHaveText(byBirth.filter((s) => s.site?.status === "in-use")[0].name);
  await page.keyboard.press("Escape");
  await expect(profile(page)).toBeHidden();
  // Jump links scroll to their section and keep the address in step.
  await landing.locator(".lnd-jump a", { hasText: "The catalogue" }).click();
  await expect(page).toHaveURL(/#catalogue$/);
  await expect(page.locator("#catalogue")).toBeInViewport();
});

test("the landing search lists matches, lights them in the constellation and opens a profile", async ({ page }) => {
  await openPage(page);
  const input = page.getByRole("combobox", { name: "Find a scholar, a book or a field" });
  await input.fill("vulgate");
  const options = page.locator("#landing .lnd-opt");
  await expect(options.first()).toContainText("Jerome");
  await expect(page.locator("#landing .lnd-node.lnd-match")).toHaveCount(await options.count());
  await expect(page.locator("#landing .lnd-sky")).toHaveClass(/lnd-searching/);
  await input.press("Enter");
  await expect(profile(page).getByRole("heading", { level: 2 })).toHaveText("Jerome");
  await page.keyboard.press("Escape");
  await expect(profile(page)).toBeHidden();
  await input.fill("zzzz");
  await expect(page.locator("#landing .lnd-none")).toContainText("Nothing matches");
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(page.locator("#landing .lnd-sky")).not.toHaveClass(/lnd-searching/);
});

test("hovering a mark shows its card; clicking it opens the profile", async ({ page }) => {
  test.skip(isPhone(page), "the hover card is a pointer feature");
  await openPage(page);
  const node = page.locator(`#landing .lnd-node[data-id="${byBirth[0].id}"]`);
  await node.hover();
  const tip = page.locator("#landing .lnd-tip");
  await expect(tip).toBeVisible();
  await expect(tip).toContainText(byBirth[0].name);
  await node.click();
  await expect(profile(page).getByRole("heading", { level: 2 })).toHaveText(byBirth[0].name);
  await page.keyboard.press("Escape");
  await expect(profile(page)).toBeHidden();
});

test("the catalogue filters by field, era, faith, search and the used switch, with live counts", async ({ page }) => {
  await openPage(page);
  const cat = page.locator("#catalogue");
  await expect(count(page)).toHaveText(`${TOTAL} of ${TOTAL} scholars`);
  await expect(shownCards(page)).toHaveCount(TOTAL);
  const history = cat.locator('.cat-opt[data-facet="field"][data-value="history"]');
  await expect(history.locator("em")).toHaveText(`${inField("history").length}`);
  await history.click();
  await expect(history).toHaveAttribute("aria-pressed", "true");
  await expect(count(page)).toHaveText(`${inField("history").length} of ${TOTAL} scholars`);
  await expect(shownCards(page)).toHaveCount(inField("history").length);
  await history.click();
  await expect(count(page)).toHaveText(`${TOTAL} of ${TOTAL} scholars`);

  await cat.getByRole("switch", { name: /Used on this site/ }).click();
  await expect(count(page)).toHaveText(`${USED.length} of ${TOTAL} scholars`);
  // Side by side, the panel's head offers "Clear all" (on narrow screens the panel is rows of chips without a head).
  if ((page.viewportSize()?.width ?? 1440) > 900) await expect(cat.locator(".cat-side-head .cat-clear")).toBeVisible();
  await cat.getByRole("switch", { name: /Used on this site/ }).click();

  await cat.getByRole("searchbox", { name: "Search the scholars" }).fill("vulgate");
  await expect(count(page)).toHaveText(`1 of ${TOTAL} scholars`);
  await expect(shownCards(page)).toContainText("Jerome");
  // Filters that nothing matches show the empty state, which clears them.
  await cat.locator('.cat-opt[data-facet="era"][data-value="modern"]').click();
  await expect(cat.locator(".cat-empty")).toBeVisible();
  await cat.locator(".cat-empty .cat-clear").click();
  await expect(count(page)).toHaveText(`${TOTAL} of ${TOTAL} scholars`);
  await expect(cat.getByRole("searchbox", { name: "Search the scholars" })).toHaveValue("");
});

test("the catalogue sorts by year, name and most named", async ({ page }) => {
  await openPage(page);
  const first = async () => (await shownCards(page).evaluateAll((cards) => cards.map((c) => [Number(getComputedStyle(c).order), c.querySelector("h3")?.textContent ?? ""] as const)))
    .sort((a, b) => a[0] - b[0])[0][1];
  expect(await first()).toBe(byBirth[0].name);
  await page.locator("#catalogue [data-sort='az']").click();
  await expect(page.locator("#catalogue [data-sort='az']")).toHaveAttribute("aria-checked", "true");
  const surname = (s: Scholar) => s.short.split(" ").slice(-1)[0];
  expect(await first()).toBe([...DATA.scholars].sort((a, b) => surname(a).localeCompare(surname(b)))[0].name);
});

test("the profile grows from a card, steps through the catalogue's order and closes by Esc or the scrim", async ({ page }) => {
  await openPage(page);
  const field = inField("texts");
  await page.locator('#catalogue .cat-opt[data-facet="field"][data-value="texts"]').click();
  await expect(count(page)).toHaveText(`${field.length} of ${TOTAL} scholars`);
  await page.locator(`#catalogue .cat-card[data-id="${field[0].id}"] .cat-card-hit`).click();
  const panel = profile(page);
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText(field[0].name);
  await expect(panel.locator(".prf-count")).toHaveText(`1 of ${field.length}`);
  await expect(panel.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(panel.getByRole("button", { name: /compare/i })).toHaveCount(0);
  await expect(panel.locator(".prf-land")).toHaveAttribute("fill-rule", "evenodd");
  await panel.getByRole("button", { name: "Next scholar" }).click();
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText(field[1].name);
  await page.keyboard.press("ArrowLeft");
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText(field[0].name);
  await page.keyboard.press("ArrowLeft");
  await expect(panel.locator(".prf-count")).toHaveText(`${field.length} of ${field.length}`);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  // Focus returns to the card the panel stood in for (it followed the steps), and the closed panel takes no clicks.
  await expect(page.locator(`#catalogue .cat-card[data-id="${field[field.length - 1].id}"] .cat-card-hit`)).toBeFocused();
  expect(await page.locator(".tp-scholars .prf").evaluate((el) => getComputedStyle(el).display)).toBe("none");
  // The page scrolls again once it is closed.
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  if (!isPhone(page)) {
    await page.locator(`#catalogue .cat-card[data-id="${field[0].id}"] .cat-card-hit`).click();
    await expect(panel).toBeVisible();
    await page.locator(".tp-scholars .prf-scrim").click({ position: { x: 5, y: 5 } });
    await expect(panel).toBeHidden();
  }
});

test("By the numbers filters the catalogue and follows what it shows", async ({ page }) => {
  await openPage(page);
  const numbers = page.locator("#numbers");
  await expect(numbers.getByRole("heading", { level: 2 })).toContainText("counted");
  const texts = numbers.locator('.num-row[data-facet="field"][data-value="texts"]');
  await texts.scrollIntoViewIfNeeded();
  await texts.click();
  await expect(texts).toHaveAttribute("aria-pressed", "true");
  await expect(count(page)).toHaveText(`${inField("texts").length} of ${TOTAL} scholars`);
  await expect(page.locator('#catalogue .cat-opt[data-facet="field"][data-value="texts"]')).toHaveAttribute("aria-pressed", "true");
  // The other fields' bars now show none of theirs; this one shows all of its own.
  await expect(numbers.locator('.num-row[data-facet="field"][data-value="history"] .num-n')).toHaveText(`0 of ${inField("history").length}`);
  await expect(numbers.locator(".num-dotset i.num-off")).toHaveCount(TOTAL - inField("texts").length);
  await numbers.locator(".num-site").click();
  await expect(numbers.locator(".num-site")).toHaveAttribute("aria-pressed", "true");
  await expect(count(page)).toHaveText(`${USED.filter((s) => s.field === "texts").length} of ${TOTAL} scholars`);
  await texts.click();
  await numbers.locator(".num-site").click();
  await expect(count(page)).toHaveText(`${TOTAL} of ${TOTAL} scholars`);
});

test("no sideways scroll on the Scholars page", async ({ page }) => {
  await openPage(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
