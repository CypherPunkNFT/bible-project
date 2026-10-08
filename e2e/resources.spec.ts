import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The three Resources section pages (2026-10-08): the learning division, the fellowships, and help for life (the owner's
// approved direction E: crisis strip, the national lines as a directory, Jacksonville with its two zoomable maps).
// Each is built from src/data/resources/<name>.json; a section without its file returns to /resources.

const DATA = fileURLToPath(new URL("../src/data/resources", import.meta.url));
const has = (name: string) => fs.existsSync(path.join(DATA, `${name}.json`));

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("the station's doorways link to the sections that have data", async ({ page }) => {
  await page.goto("/resources");
  const doors = page.getByRole("navigation", { name: "Resources" }).getByRole("link");
  await expect(doors).toHaveCount(["learning", "fellowships", "life"].filter(has).length);
});

// Learning materials has its own checks: e2e/learning.spec.ts.

test("fellowships: the list loads, filters by who it is for, and a row opens its links", async ({ page }) => {
  test.skip(!has("fellowships"), "fellowships.json not written yet");
  await page.goto("/resources/fellowships");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fellowships");
  const rows = page.locator(".tl-row");
  const total = await rows.count();
  expect(total).toBeGreaterThan(0);
  const chips = page.getByRole("group", { name: "For" }).getByRole("button");
  if (await chips.count() > 2) {
    await chips.nth(1).click();
    await expect(page.getByRole("status")).toContainText(` of ${total}`);
    await page.getByRole("group", { name: "For" }).getByRole("button", { name: "Everyone" }).click();
  }
  await rows.first().locator(".tl-head").click();
  await expect(page.locator(".tl-panel .rs-checked a")).toHaveAttribute("href", /^https?:\/\//);
  await noSidewaysScroll(page);
});

test("fellowships and learning keep their section links", async ({ page }) => {
  for (const slug of ["learning", "fellowships"].filter(has)) {
    await page.goto(`/resources/${slug}`);
    await expect(page.getByRole("navigation", { name: "Resources sections" })).toBeVisible();
  }
});

const life = () => JSON.parse(fs.readFileSync(path.join(DATA, "life.json"), "utf8")) as {
  groups: { id: string; entries: { id: string; name: string }[] }[];
  cities: { id: string; name: string; verified?: boolean; entries: { id: string; name: string; category: string }[] }[];
};
const verifiedCities = () => (has("life") ? life().cities.filter((c) => c.verified === true) : []);

test("life: the crisis strip leads, with no section links, and 911 and 988 are not repeated in the Crisis list", async ({ page }) => {
  test.skip(!has("life"), "life.json not written yet");
  await page.goto("/resources/life");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Help for life");
  const strip = page.getByRole("complementary", { name: "Help right now" });
  await expect(strip.locator('a[href="tel:988"]')).toBeVisible();
  await expect(strip.locator('a[href^="sms:988"]')).toBeVisible();
  await expect(strip.locator('a[href="tel:911"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Resources sections" })).toHaveCount(0);
  const crisis = page.locator('.lf-pane[data-g="crisis"]');
  await expect(crisis.locator(".lf-row")).toHaveCount(life().groups.find((g) => g.id === "crisis")!.entries.length - 2);
  for (const id of ["emergency-911", "988-lifeline"]) await expect(crisis.locator(`.lf-row[data-id="${id}"]`)).toHaveCount(0);
  await noSidewaysScroll(page);
});

test("life: every national line keeps its call or text button on the closed row, and opens in place", async ({ page }) => {
  test.skip(!has("life"), "life.json not written yet");
  await page.goto("/resources/life");
  const calls = page.locator('.lf-nat .lf-pane:not([hidden]) .lf-quick[href^="tel:"]');
  await expect(calls.first()).toBeVisible();
  for (const href of await calls.evaluateAll((els) => els.map((el) => el.getAttribute("href")))) expect(href).toMatch(/^tel:\+?\d{3,}$/);
  const box = await calls.first().boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(40);
  const row = page.locator(".lf-nat .lf-pane:not([hidden]) .lf-row").first();
  await row.locator(".lf-row-head").click();
  await expect(row.locator(".lf-row-head")).toHaveAttribute("aria-expanded", "true");
  await expect(row.locator(".lf-checked a")).toHaveAttribute("href", /^https?:\/\//);
  const kinds = page.getByRole("group", { name: "Kind of help" }).getByRole("button");
  await kinds.nth(1).click();
  await expect(kinds.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".lf-nat .lf-pane:not([hidden])")).toHaveCount(1);
});

test("life: only verified cities appear", async ({ page }) => {
  test.skip(!has("life"), "life.json not written yet");
  await page.goto("/resources/life");
  const names = verifiedCities().map((c) => c.name.split(",")[0]);
  await expect(page.locator(".lf-city h2")).toHaveCount(names.length);
  const shown = await page.locator(".lf-city h2").allTextContents();
  expect(shown.map((t) => t.split(",")[0]).sort()).toEqual([...names].sort());
  for (const c of life().cities.filter((x) => x.verified !== true)) await expect(page.locator(".lf-city h2", { hasText: c.name.split(",")[0] })).toHaveCount(0);
});

test("life: the city map's pins and the list light each other", async ({ page }) => {
  test.skip(verifiedCities().length === 0, "no verified city in life.json yet");
  await page.goto("/resources/life");
  const pins = page.locator(".lf-jax .lf-pin:not([data-off])");
  await expect(pins).toHaveCount(verifiedCities()[0].entries.length);
  const id = await pins.first().getAttribute("data-id");
  const row = page.locator(`.lf-city-list .lf-row[data-id="${id}"]`);
  await page.locator(`.lf-jax .lf-pin[data-id="${id}"]`).dispatchEvent("click");
  await expect(row.locator(".lf-row-head")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(`.lf-jax .lf-pin[data-id="${id}"]`)).toHaveAttribute("data-sel");
  await expect(row.locator(".lf-addr")).toBeVisible();
  const other = page.locator(".lf-city-list ol").first().locator(".lf-row").nth(1), otherId = await other.getAttribute("data-id");
  await other.locator(".lf-row-head").click();
  await expect(page.locator(`.lf-jax .lf-pin[data-id="${otherId}"]`)).toHaveAttribute("data-sel");
  await page.locator(`.lf-jax .lf-pin[data-id="${otherId}"]`).dispatchEvent("pointerenter");
  await expect(other).toHaveAttribute("data-lit");
  expect(await page.locator('.lf-city-list .lf-quick[href^="tel:"]').count()).toBeGreaterThan(0);
  await noSidewaysScroll(page);
});

test("life: the kind filters show only that kind on the map and in the list", async ({ page }) => {
  test.skip(verifiedCities().length === 0, "no verified city in life.json yet");
  await page.goto("/resources/life");
  const city = verifiedCities()[0], kind = city.entries[0].category, count = city.entries.filter((e) => e.category === kind).length;
  await page.locator(".lf-map-filter button").nth(await page.locator(".lf-map-filter button").evaluateAll((els, n) => els.findIndex((el) => el.querySelector("b")?.textContent === String(n)), count)).click();
  await expect(page.locator(".lf-jax .lf-pin:not([data-off])")).toHaveCount(count);
  await expect(page.locator(".lf-city-list ol").first().locator(".lf-row:not([hidden])")).toHaveCount(count);
});

test("life: both maps zoom by the wheel and by the buttons", async ({ page }) => {
  test.skip(verifiedCities().length === 0, "no verified city in life.json yet");
  await page.goto("/resources/life");
  for (const frame of [".lf-usa", ".lf-jax"]) {
    const svg = page.locator(`${frame} .lf-stage > svg`);
    await svg.scrollIntoViewIfNeeded();
    await page.locator(`${frame} .lf-zoom button[aria-label="Show all"]`).click();
    const whole = await svg.getAttribute("viewBox");
    await page.locator(`${frame} .lf-zoom button[aria-label="Zoom in"]`).click();
    await expect(svg).not.toHaveAttribute("viewBox", whole!);
    await page.locator(`${frame} .lf-zoom button[aria-label="Show all"]`).click();
    await expect(svg).toHaveAttribute("viewBox", whole!);
    await svg.dispatchEvent("wheel", { deltaY: -300, clientX: 200, clientY: 200 });
    await expect(svg).not.toHaveAttribute("viewBox", whole!);
  }
  await page.locator(".lf-map-views button", { hasText: "Downtown" }).click();
  await expect(page.locator(".lf-map-views button", { hasText: "Downtown" })).toHaveAttribute("aria-pressed", "true");
});

test("life: works at 400 px without sideways scroll", async ({ page }) => {
  test.skip(!has("life"), "life.json not written yet");
  await page.setViewportSize({ width: 400, height: 900 });
  await page.goto("/resources/life");
  await page.locator(".lf-how").scrollIntoViewIfNeeded();
  await expect(page.locator(".lf-jax .lf-stage > svg")).toBeVisible();
  await noSidewaysScroll(page);
});
