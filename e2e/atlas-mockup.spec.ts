import { expect, test } from "@playwright/test";

test("motion lab: four distinct transitions, city selection, replay, return and cancellation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
  await page.goto("/study/places/mockup/cities/motion");
  const designs = page.getByRole("group", { name: "Animation designs" });
  const stage = page.locator(".motion-demo-stage");
  for (const name of ["Clear & expand", "Soft dissolve", "Next chapter", "Unfold the collection"]) {
    await designs.getByRole("button", { name: new RegExp(name) }).click();
    const grid = page.getByRole("group", { name: "Preview collections" });
    await expect(grid.getByRole("button")).toHaveCount(8);
    await grid.getByRole("button", { name: "The Seven Churches", exact: true }).click();
    await expect(stage).toHaveAttribute("data-phase", "cities");
    const back = page.getByRole("button", { name: "All collections", exact: true });
    await expect(back).toBeFocused();
    const cities = page.getByRole("group", { name: "Preview cities" });
    await expect(cities.getByRole("button")).toHaveCount(7);
    await cities.getByRole("button", { name: /Laodicea/ }).click();
    await expect(page.getByRole("link", { name: "Open the city preview" })).toHaveAttribute("href", /focus=laodicea/);
    await page.getByRole("button", { name: "Replay opening" }).click();
    await expect(stage).toHaveAttribute("data-phase", "cities");
    await expect(cities.getByRole("button", { name: /Laodicea/ })).toHaveAttribute("aria-pressed", "true");
    await back.click();
    await expect(stage).toHaveAttribute("data-phase", "collections");
    await expect(grid.getByRole("button", { name: "The Seven Churches", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.getByLabel("Slow motion").check();
  await page.getByRole("button", { name: "The Seven Churches", exact: true }).click();
  await designs.getByRole("button", { name: /Soft dissolve/ }).click();
  await expect(stage).toHaveAttribute("data-phase", "collections");
  await page.getByLabel("Slow motion").uncheck();
  await page.getByRole("button", { name: "Cities of Refuge", exact: true }).click();
  await expect(stage).toHaveAttribute("data-phase", "cities");
  await expect(page.getByRole("group", { name: "Preview cities" }).getByRole("button")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `front-end capture/2026-10-06/city-motion-lab-dark-${test.info().project.name}.png`, fullPage: true });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("button", { name: "The Seven Churches", exact: true }).click();
  await expect(stage).toHaveAttribute("data-phase", "cities");
  await expect(page.getByRole("status")).toContainText("Reduced motion is on");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `front-end capture/2026-10-06/city-motion-lab-light-${test.info().project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("motion lab: neighbors finish fading before expansion begins", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/study/places/mockup/cities/motion?design=expand");
  await page.getByLabel("Slow motion").check();
  await page.locator(".motion-demo-stage").evaluate((stage) => {
    const samples: { ghost: boolean; opacity: number }[] = [];
    (window as unknown as { motionSamples: typeof samples }).motionSamples = samples;
    const start = performance.now();
    const capture = () => {
      const shell = stage.querySelector<HTMLElement>(".motion-demo-ghost")!;
      const neighbor = stage.querySelector<HTMLElement>('[data-motion-collection="israel-judah"]')!;
      samples.push({ ghost: !shell.hidden, opacity: Number(getComputedStyle(neighbor).opacity) });
      if (performance.now() - start < 2300) requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  });
  await page.getByRole("button", { name: "Cities of Refuge", exact: true }).click();
  await expect(page.locator(".motion-demo-stage")).toHaveAttribute("data-phase", "cities");
  const samples = await page.evaluate(() => (window as unknown as { motionSamples: { ghost: boolean; opacity: number }[] }).motionSamples);
  expect(samples.some((sample) => !sample.ghost && sample.opacity > .05 && sample.opacity < .95)).toBe(true);
  expect(samples.some((sample) => sample.ghost)).toBe(true);
  expect(samples.filter((sample) => sample.ghost).every((sample) => sample.opacity < .01)).toBe(true);
});

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
  await page.getByRole("button", { name: "Cities of the Apostles", exact: true }).click();
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

test("cities: collections drill into one selection area with keyboard and history support", async ({ page }) => {
  await page.goto("/study/places/mockup/cities");
  const collections = page.getByRole("group", { name: "City collections", exact: true });
  const cities = page.getByRole("group", { name: "Which city will you explore?", exact: true });
  const back = page.getByRole("button", { name: "All collections", exact: true });
  await expect(collections.getByRole("button")).toHaveCount(8);
  await expect(cities).toHaveCount(0);
  const names = await collections.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")!));
  const seven = collections.getByRole("button", { name: "The Seven Churches", exact: true });
  await seven.focus();
  await page.keyboard.press("Enter");
  await expect(collections).toHaveCount(0);
  await expect(back).toBeFocused();
  await expect(cities.locator("strong")).toHaveText(["Ephesus", "Smyrna", "Pergamum", "Thyatira", "Sardis", "Philadelphia", "Laodicea"]);
  await expect(page.locator(".places-tier-number")).toHaveText(["01"]);
  await expect(page.locator(".places-city-selector + .places-workspace")).toHaveCount(1);
  await page.getByRole("button", { name: "Then & now", exact: true }).click();
  await back.click();
  await expect(seven).toBeFocused();
  await expect(cities).toHaveCount(0);
  await collections.getByRole("button", { name: "Cities of the Apostles", exact: true }).click();
  await expect(cities.getByRole("button", { name: /^Ephesus/ })).toHaveAttribute("aria-pressed", "true");
  await cities.getByRole("button", { name: /^Corinth/ }).click();
  await page.reload();
  await expect(cities.getByRole("button", { name: /^Corinth/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Then & now", exact: true })).toHaveAttribute("aria-pressed", "true");
  await back.click();
  await page.reload();
  await expect(collections).toBeVisible();
  await page.goBack();
  await expect(cities.getByRole("button", { name: /^Corinth/ })).toHaveAttribute("aria-pressed", "true");
  await back.click();
  await collections.getByRole("button", { name: "Ancient Israel & Judah", exact: true }).click();
  await expect(cities.getByRole("button", { name: /^Jerusalem/ })).toHaveAttribute("aria-pressed", "true");
  for (const name of names) {
    await back.click();
    await collections.getByRole("button", { name, exact: true }).click();
    await expect(collections).toHaveCount(0);
    await expect(cities.locator('[aria-pressed="true"]')).toHaveCount(1);
    expect(await cities.getByRole("button").count()).toBeGreaterThanOrEqual(6);
  }
  await expect(cities.locator("strong")).toHaveText(["Kedesh", "Shechem", "Hebron", "Bezer", "Ramoth-gilead", "Golan"]);
  await expect(page.getByRole("link", { name: /Joshua 20/ })).toHaveAttribute("href", "/read/kjv/JOS/20?hl=1-9");
  await page.goto("/study/places/mockup/cities?focus=corinth");
  await expect(collections).toHaveCount(0);
  await expect(cities.getByRole("button", { name: /^Corinth/ })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/study/places/mockup/cities?collection=seven-churches&focus=corinth");
  await expect(cities.getByRole("button", { name: /^Ephesus/ })).toHaveAttribute("aria-pressed", "true");
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `front-end capture/2026-10-06/cities-expanding-card-${theme}-${test.info().project.name}.png`, fullPage: true });
  }
});

test("cities: the selected card visibly grows around its cities and collapses back", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/study/places/mockup/cities");
  const card = page.locator('[data-collection="seven-churches"]');
  await expect(card).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const startWidth = (await card.boundingBox())!.width;
  await card.evaluate((element) => {
    const samples: number[] = [];
    (window as unknown as { cardWidths: number[] }).cardWidths = samples;
    const start = performance.now();
    const sample = () => { samples.push(element.getBoundingClientRect().width); if (performance.now() - start < 1400) requestAnimationFrame(sample); };
    requestAnimationFrame(sample);
  });
  await card.getByRole("button", { name: "The Seven Churches", exact: true }).click();
  await expect(card.getByRole("group", { name: "Which city will you explore?" })).toBeVisible();
  await expect.poll(async () => (await card.boundingBox())!.width).toBeGreaterThan(startWidth * 1.5);
  await expect.poll(() => page.evaluate(() => {
    const widths = (window as unknown as { cardWidths: number[] }).cardWidths;
    return widths.filter((width) => width > widths[0] * 1.1 && width < Math.max(...widths) * .9).length;
  })).toBeGreaterThan(1);
  const back = card.getByRole("button", { name: "All collections", exact: true });
  const panelBounds = (await card.boundingBox())!;
  const backBounds = (await back.boundingBox())!;
  expect(backBounds.x - panelBounds.x).toBeLessThan(40);
  await back.focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "City collections" }).getByRole("button")).toHaveCount(8);
  await expect.poll(async () => Math.abs((await card.boundingBox())!.width - startWidth)).toBeLessThan(2);
  await expect(card.getByRole("button", { name: "The Seven Churches", exact: true })).toBeFocused();
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
