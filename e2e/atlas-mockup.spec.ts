import { expect, test } from "@playwright/test";

test("collection: illustrated destinations lead to separate pages and useful preview controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/study/places/mockup");
  const collection = page.getByRole("navigation", { name: "Places and journeys collection" });
  await expect(collection.getByRole("link")).toHaveCount(4);
  await expect(page.locator(".vector-atlas-svg")).toHaveCount(0);
  await collection.getByRole("link", { name: "Journeys", exact: true }).click();
  await expect(page).toHaveURL(/\/mockup\/journeys$/);
  await expect(page.getByRole("navigation", { name: "Explore the collection" }).getByRole("link", { name: "Journeys" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Letters", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Connect places and correspondence." })).toBeVisible();
  await page.getByRole("button", { name: /Ruth.*Moab to Bethlehem/ }).click();
  await expect(page.getByRole("button", { name: "Letters", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "People", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: /Ruth.*Moab to Bethlehem/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "People", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Find Bethlehem in the atlas" }).click();
  await expect(page.getByRole("textbox", { name: "Find a place" })).toHaveValue("Bethlehem");
  await page.goBack();
  await expect(page.getByRole("button", { name: /Ruth.*Moab to Bethlehem/ })).toHaveAttribute("aria-pressed", "true");
  const navigation = page.getByRole("navigation", { name: "Explore the collection" });
  await navigation.getByRole("link", { name: "Ancient Cities" }).click();
  await page.getByRole("button", { name: /Corinth.*A church/ }).click();
  await page.getByRole("button", { name: "Then & now" }).click();
  await expect(page.getByRole("heading", { name: "Connect the ancient and present landscape." })).toBeVisible();
  await navigation.getByRole("link", { name: "Gospel Events" }).click();
  await page.getByRole("button", { name: /Passion week/ }).click();
  await page.getByRole("button", { name: "Luke", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Follow Luke’s account." })).toBeVisible();
  await page.getByRole("link", { name: "Places & journeys", exact: true }).click();
  await expect(collection).toBeVisible();
  expect(errors).toEqual([]);
});

test("collection: landing and destination controls fit both themes and retain old place links", async ({ page }) => {
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const destination of ["", "/journeys", "/cities", "/gospels"]) {
      await page.goto(`/study/places/mockup${destination}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      if (!destination || destination === "/journeys") await page.screenshot({ path: `front-end capture/2026-10-05/places-collection-${destination ? "journeys" : "home"}-${theme}-${test.info().project.name}.png`, fullPage: true });
    }
  }
  await page.goto("/study/places/mockup?place=a15257a");
  await expect(page).toHaveURL(/\/mockup\/atlas\?place=a15257a/);
  await expect(page.getByRole("complementary", { name: "Jerusalem" })).toBeVisible();
});

test("mockup: vector map, stable marker sizes, and deeper zoom", async ({ page }) => {
  const images: string[] = [];
  page.on("request", (request) => { if (request.url().includes("bluemarble")) images.push(request.url()); });
  await page.goto("/study/places/mockup/atlas");
  const map = page.getByRole("group", { name: "Vector map of biblical places" });
  await expect(map).toHaveAttribute("data-zoom", "12.00");
  await expect(map.locator(".vector-map-marker").first()).toBeVisible();
  await expect(map.locator("image")).toHaveCount(0);
  await expect(map.locator(".vector-map-labels")).toContainText("Jerusalem");
  await page.getByRole("button", { name: "Galilee", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "42.00");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "136.08");
  const zoomIn = page.getByRole("button", { name: "Zoom in", exact: true });
  await expect(zoomIn).toBeEnabled();

  // Center the dense Jerusalem group, then verify real wheel and button zoom past the old cap.
  await page.getByRole("button", { name: "Reset map view" }).click();
  await expect(map).toHaveAttribute("data-zoom", "12.00");
  const jerusalem = map.locator('.vector-map-marker[data-place="a15257a"]');
  const originalCount = Number(await jerusalem.getAttribute("data-count"));
  await jerusalem.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Zoom closer", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "30.00");
  const bounds = await map.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.wheel(0, -1500);
  await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(128);
  for (let i = 0; i < 8 && await zoomIn.isEnabled(); i++) {
    const previous = Number(await map.getAttribute("data-zoom"));
    await zoomIn.click();
    await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(previous);
  }
  await expect(map).toHaveAttribute("data-zoom", "8192.00");
  await expect(zoomIn).toBeDisabled();
  await expect(jerusalem).toBeVisible();
  expect(Number(await jerusalem.getAttribute("data-count"))).toBeLessThan(originalCount);
  const diameters = await map.locator(".vector-marker-dot,.vector-marker-cluster").evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().width));
  expect(diameters.length).toBeGreaterThan(0);
  expect(Math.max(...diameters)).toBeLessThanOrEqual(27);
  await page.screenshot({ path: `front-end capture/2026-10-05/atlas-deep-zoom-${test.info().project.name}.png` });
  await page.getByRole("button", { name: "Reset map view" }).click();
  await expect(map).toHaveAttribute("data-zoom", "12.00");
  expect(images).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("mockup: every member of a group can open its place and Scripture", async ({ page }) => {
  await page.goto("/study/places/mockup/atlas");
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
  await expect(page).toHaveURL(/\/study\/places\/mockup\/atlas\?place=a15257a/);
  const detail = page.getByRole("complementary", { name: "Jerusalem" });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("link").first()).toHaveAttribute("href", /\/read\/kjv\//);
  await expect(page.getByRole("region", { name: "Places in this area", exact: true })).toHaveCount(0);
});

test("mockup: filters find a place, empty results stay empty, and the current atlas is preserved", async ({ page }) => {
  await page.goto("/study/places/mockup/atlas");
  await page.getByRole("textbox", { name: "Find a place" }).fill("Jerusalem");
  await expect(page.locator('.vector-map-marker[data-place="a15257a"]')).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Find a place" })).toHaveValue("Jerusalem");
  await page.getByRole("textbox", { name: "Find a place" }).fill("no-matching-place");
  await expect(page.getByText("No places match these filters.")).toBeVisible();
  await expect(page.locator(".vector-map-marker")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Most-named places" })).toHaveCount(0);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/find=/);
  await expect(page.locator(".vector-map-marker").first()).toBeVisible();
  await page.getByRole("link", { name: "Open the current atlas" }).click();
  await expect(page).toHaveURL(/\/study\/places$/);
  await expect(page.locator('svg image[href*="bluemarble"]').first()).toBeVisible();
});
