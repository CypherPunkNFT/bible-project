import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The three Resources section pages (2026-10-08): the workbook shelf, the fellowships and help for life with its USA map.
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

test("learning: the shelf shows each workbook with downloads that point at PDFs that exist", async ({ page, request }) => {
  await page.goto("/resources/learning");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learning materials");
  await expect(page.getByRole("heading", { name: "Moses: three forties" })).toBeVisible();
  const downloads = page.locator(".rs-downloads a");
  await expect(downloads).toHaveCount(2);
  for (const link of await downloads.all()) {
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^\/learning\/.+\.pdf$/);
    await expect(link).toHaveAttribute("download", /\.pdf$/);
    await expect(link).toHaveAttribute("target", "_blank");
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("pdf");
  }
  await expect(page.locator(".rs-built a")).toHaveCount(3);
  await noSidewaysScroll(page);
});

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

test("life: the crisis strip and every phone line are tap-to-call links", async ({ page }) => {
  test.skip(!has("life"), "life.json not written yet");
  await page.goto("/resources/life");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Help for life");
  const strip = page.getByRole("complementary", { name: "Help right now" });
  await expect(strip.locator('a[href="tel:988"]')).toBeVisible();
  await expect(strip.locator('a[href^="sms:988"]')).toBeVisible();
  await expect(strip.locator('a[href="tel:911"]')).toBeVisible();
  const calls = page.locator('.rs-help a[href^="tel:"]');
  expect(await calls.count()).toBeGreaterThan(0);
  const box = await calls.first().boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(40);
  await noSidewaysScroll(page);
});

const verifiedCities = () => (has("life") ? (JSON.parse(fs.readFileSync(path.join(DATA, "life.json"), "utf8")) as { cities: { name: string; verified?: boolean }[] }).cities.filter((c) => c.verified === true) : []);

test("life: only verified cities are on the map", async ({ page }) => {
  test.skip(!has("life"), "life.json not written yet");
  await page.goto("/resources/life");
  const names = verifiedCities().map((c) => c.name);
  await expect(page.locator(".rs-city")).toHaveCount(names.length);
  const labels = await page.locator(".rs-city").evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")?.split(":")[0]));
  expect(labels.sort()).toEqual([...names].sort());
});

test("life: choosing a city on the map shows its places with addresses", async ({ page }) => {
  test.skip(verifiedCities().length === 0, "no verified city in life.json yet");
  await page.goto("/resources/life");
  const city = page.locator(".rs-city").first();
  await city.scrollIntoViewIfNeeded();
  const label = await city.getAttribute("aria-label");
  if ((await city.getAttribute("aria-pressed")) !== "true") await city.click();
  const panel = page.locator(".rs-local");
  await expect(panel).toBeVisible();
  await expect(panel.locator("h3")).toHaveText(label!.split(":")[0]);
  expect(await panel.locator(".rs-local-entry address").count()).toBeGreaterThan(0);
  expect(await page.locator(".rs-mini .rs-pin").count()).toBeGreaterThan(0);
  await expect(panel.getByRole("heading", { name: /Phone lines/ })).toBeVisible();
  expect(await panel.locator('.rs-line a[href^="tel:"]').count()).toBeGreaterThan(0);
  await noSidewaysScroll(page);
});
