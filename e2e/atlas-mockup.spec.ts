import { expect, test } from "@playwright/test";

test("mockup: vector map, stable marker sizes, and deeper zoom", async ({ page }) => {
  const images: string[] = [];
  page.on("request", (request) => { if (request.url().includes("bluemarble")) images.push(request.url()); });
  await page.goto("/study/places/mockup");
  const map = page.getByRole("group", { name: "Vector map of biblical places" });
  await expect(map).toHaveAttribute("data-zoom", "12.00");
  await expect(map.locator(".vector-map-marker").first()).toBeVisible();
  await expect(map.locator("image")).toHaveCount(0);
  await expect(map.locator(".vector-map-labels")).toContainText("Jerusalem");
  await page.getByRole("button", { name: "Galilee", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "42.00");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "128.00");
  await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeDisabled();
  const diameters = await map.locator(".vector-marker-dot,.vector-marker-cluster").evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().width));
  expect(diameters.length).toBeGreaterThan(0);
  expect(Math.max(...diameters)).toBeLessThanOrEqual(27);
  expect(images).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("mockup: every member of a group can open its place and Scripture", async ({ page }) => {
  await page.goto("/study/places/mockup");
  await expect(page.locator(".vector-atlas-svg")).toHaveAttribute("data-zoom", "12.00");
  const cluster = page.locator('.vector-map-marker:not([data-count="1"])').first();
  await expect(cluster).toBeVisible();
  const count = Number(await cluster.getAttribute("data-count"));
  await cluster.focus();
  await page.keyboard.press("Enter");
  const group = page.getByRole("region", { name: "Grouped places", exact: true });
  await expect(group.getByRole("button")).toHaveCount(count);
  await page.getByRole("textbox", { name: "Find within this group" }).fill("Jerusalem");
  await expect(group.getByRole("button")).toHaveCount(1);
  await group.getByRole("button", { name: /^Jerusalem/ }).click();
  await expect(page).toHaveURL(/\/study\/places\/mockup\?place=a15257a/);
  const detail = page.getByRole("complementary", { name: "Jerusalem" });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("link").first()).toHaveAttribute("href", /\/read\/kjv\//);
  await expect(page.getByRole("region", { name: "Places in this area", exact: true })).toHaveCount(0);
});

test("mockup: filters find a place, empty results stay empty, and the current atlas is preserved", async ({ page }) => {
  await page.goto("/study/places/mockup");
  await page.getByRole("textbox", { name: "Find a place" }).fill("Jerusalem");
  await expect(page.locator('.vector-map-marker[data-place="a15257a"]')).toBeVisible();
  await page.getByRole("textbox", { name: "Find a place" }).fill("no-matching-place");
  await expect(page.getByText("No places match these filters.")).toBeVisible();
  await expect(page.locator(".vector-map-marker")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Most-named places" })).toHaveCount(0);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".vector-map-marker").first()).toBeVisible();
  await page.getByRole("link", { name: "Open the current atlas" }).click();
  await expect(page).toHaveURL(/\/study\/places$/);
  await expect(page.locator('svg image[href*="bluemarble"]').first()).toBeVisible();
});
