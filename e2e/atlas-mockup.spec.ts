import { expect, test } from "@playwright/test";

test("reveal: compact city and history selectors share the downward expansion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [route, name] of [["cities", "The Pagan World"], ["early-church", "After the Apostles"], ["catholic-orthodox", "Shared Roots"], ["reformation", "Luther & Germany"], ["missions", "Africa"]]) {
    await page.goto(`/study/places/mockup/${route}`);
    const stage = page.locator(".places-reveal");
    const card = page.getByRole("button", { name, exact: true });
    await expect(card).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const before = (await stage.boundingBox())!.height;
    const layout = await card.evaluate((element) => {
      const icon = element.querySelector("svg")!.getBoundingClientRect();
      const title = element.querySelector("strong")!.getBoundingClientRect();
      return { iconRight: icon.right, titleLeft: title.left, height: element.getBoundingClientRect().height };
    });
    expect(layout.titleLeft).toBeGreaterThan(layout.iconRight);
    expect(layout.height).toBeLessThan(150);
    await card.click();
    await page.waitForFunction(() => {
      const stage = document.querySelector(".places-reveal")!;
      if (!stage.querySelector(".places-reveal-detail")!.getAnimations().length) return false;
      stage.getAnimations({ subtree: true }).forEach((animation) => { animation.pause(); animation.currentTime = 240; });
      return true;
    });
    const frame = await stage.evaluate((element) => {
      const panel = element.querySelector<HTMLElement>(".places-reveal-detail")!;
      return { height: element.getBoundingClientRect().height, target: panel.offsetHeight, clip: getComputedStyle(panel).clipPath, x: new DOMMatrix(getComputedStyle(panel).transform).m41 };
    });
    expect(frame.clip).toContain("50%");
    expect(frame.x).toBe(0);
    expect(Math.abs(frame.height - (before + frame.target) / 2)).toBeLessThan(1);
    await stage.evaluate((element) => element.getAnimations({ subtree: true }).forEach((animation) => animation.play()));
    await expect(stage).toHaveAttribute("data-phase", "expanded");
    const back = stage.locator(".places-collections-back");
    await expect(back).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(stage).toHaveAttribute("data-phase", "collapsed");
    await expect(card).toBeFocused();
    expect(Math.abs((await stage.boundingBox())!.height - before)).toBeLessThan(1);
  }
  await page.goto("/study/places/mockup/cities/motion?design=slide");
  await expect(page).toHaveURL(/\/mockup\/cities$/);
  await expect(page.locator(".motion-designs,.motion-demo-stage,.places-city-count,.history-topic-card")).toHaveCount(0);
});

test("cities: selecting any city scrolls to the shared Jerusalem map", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
  await page.goto("/study/places/mockup/cities");
  await page.getByRole("button", { name: "The Pagan World", exact: true }).click();
  await expect(page.locator(".places-reveal")).toHaveAttribute("data-phase", "expanded");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  const map = page.locator("#city-map-experience");
  for (const name of ["Ephesus", "Athens", "Ephesus"]) {
    await page.getByRole("group", { name: "Which city will you explore?" }).getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await expect(page.locator("#city-map-title")).toHaveText(name);
    await expect(map).toBeFocused();
    await expect(map).toHaveAttribute("data-map-city", "Jerusalem");
    await expect.poll(async () => Math.round((await map.boundingBox())!.y)).toBeGreaterThanOrEqual(70);
    await expect.poll(async () => Math.round((await map.boundingBox())!.y)).toBeLessThanOrEqual(90);
  }
  await page.waitForFunction(() => {
    const top = document.getElementById("city-map-experience")!.getBoundingClientRect().top;
    const state = window as unknown as { settledMapFrames?: number };
    state.settledMapFrames = top >= 70 && top <= 90 ? (state.settledMapFrames ?? 0) + 1 : 0;
    return state.settledMapFrames > 15;
  });
  await expect(page.getByText("Jerusalem map · shared demonstration view", { exact: true })).toBeVisible();
  await page.screenshot({ path: `front-end capture/2026-10-06/city-selection-map-${test.info().project.name}.png` });
  await page.getByRole("group", { name: "Map region" }).getByRole("button", { name: "Jerusalem", exact: true }).click();
  await expect(page.getByRole("group", { name: "Map region" }).getByRole("button", { name: "Jerusalem", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("page slide: collection destinations move sideways in both directions with stable navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
  await page.goto("/study/places/mockup/journeys");
  const nav = page.getByRole("navigation", { name: "Explore the collection", exact: true });
  const navTop = (await nav.boundingBox())!.y;
  for (const [name, direction] of [["Ancient Cities", "forward"], ["Global Missions", "forward"], ["Atlas", "backward"], ["Journeys", "forward"]]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await page.waitForFunction(() => {
      const slides = document.getAnimations().filter((animation) => animation instanceof CSSAnimation && animation.animationName.startsWith("places-page-"));
      if (slides.length !== 2) return false;
      slides.forEach((animation) => { animation.pause(); animation.currentTime = 230; });
      return true;
    });
    await expect(page.locator("html")).toHaveAttribute("data-places-slide", direction);
    const snapshots = await page.evaluate(() => ["old", "new"].map((kind) => {
      const style = getComputedStyle(document.documentElement, `::view-transition-${kind}(places-page)`);
      const matrix = new DOMMatrix(style.transform);
      return { x: matrix.m41, y: matrix.m42, opacity: Number(style.opacity), width: parseFloat(style.width) };
    }));
    expect(snapshots[0].x / snapshots[0].width).toBeCloseTo(direction === "forward" ? -.5 : .5, 1);
    expect(snapshots[1].x / snapshots[1].width).toBeCloseTo(direction === "forward" ? .5 : -.5, 1);
    expect(snapshots.map((frame) => frame.y)).toEqual([0, 0]);
    expect(snapshots.map((frame) => frame.opacity)).toEqual([1, 1]);
    expect(Math.abs((await nav.boundingBox())!.y - navTop)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `front-end capture/2026-10-06/page-slide-${name.replace(/[^a-z]/gi, "-")}-${test.info().project.name}.png` });
    await page.evaluate(() => document.getAnimations().filter((animation) => animation instanceof CSSAnimation && animation.animationName.startsWith("places-page-")).forEach((animation) => animation.play()));
    await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  }
  await page.getByRole("link", { name: "Places & journeys", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  await page.getByRole("navigation", { name: "Places and journeys collection", exact: true }).getByRole("link", { name: "Ancient Cities", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-places-slide", "forward");
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  await page.getByRole("button", { name: "The Seven Churches", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  expect(errors).toEqual([]);
});

test("page slide: rapid navigation, reduced motion and unsupported browsers keep working", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/study/places/mockup/journeys");
  await expect(page.locator(".places-collection-nav a")).toHaveCount(8);
  await page.evaluate(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>('.places-collection-nav a');
    links[2].click(); links[7].click();
  });
  await expect(page).toHaveURL(/\/missions$/);
  await expect(page.getByRole("heading", { name: "A worldwide church. Many local stories." })).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  await page.goBack();
  await expect(page).toHaveURL(/\/journeys$/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("navigation", { name: "Explore the collection", exact: true }).getByRole("link", { name: "Ancient Cities", exact: true }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => Object.defineProperty(document, "startViewTransition", { value: undefined, configurable: true }));
  await page.getByRole("navigation", { name: "Explore the collection", exact: true }).getByRole("link", { name: "The Reformation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Words that changed the church." })).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  expect(errors).toEqual([]);
});

test("history: both collection rows and every new topic support navigation, focus and saved links", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/study/places/mockup");
  await expect(page.getByRole("navigation", { name: "Places and journeys collection", exact: true }).getByRole("link")).toHaveCount(4);
  const history = page.getByRole("navigation", { name: "Christian history collection", exact: true });
  await expect(history.getByRole("link")).toHaveText([
    /The Early Church/, /Apostolic Church/, /The Reformation/, /Global Missions/,
  ]);
  await page.getByRole("link", { name: "The Reformation", exact: true }).click();
  await expect(page).toHaveURL(/\/mockup\/reformation$/);
  for (const id of ["early-church", "catholic-orthodox", "reformation", "missions"]) {
    await page.goto(`/study/places/mockup/${id}`);
    await expect(page.getByRole("navigation", { name: "Explore the collection", exact: true }).getByRole("link")).toHaveCount(8);
    const cards = page.locator(".history-topic-grid");
    await expect(cards.getByRole("button")).toHaveCount(6);
    const titles = await cards.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")!));
    const back = page.getByRole("button", { name: id === "missions" ? "All regions" : "All topics", exact: true });
    for (const title of titles) {
      await cards.getByRole("button", { name: title, exact: true }).click();
      await expect(cards).toBeHidden();
      await expect(back).toBeFocused();
      await expect(page.locator(".history-threads li")).toHaveCount(3);
      expect(await page.locator(".history-place-list li").count()).toBeGreaterThanOrEqual(3);
      expect(await page.locator(".history-sources a").count()).toBeGreaterThanOrEqual(2);
      await page.keyboard.press("Escape");
      await expect(cards.getByRole("button", { name: title, exact: true })).toBeFocused();
    }
    await cards.getByRole("button").first().click();
    const saved = page.url();
    await page.reload();
    await expect(page.locator(".history-detail")).toBeVisible();
    await back.click();
    await page.goBack();
    await expect(page).toHaveURL(saved);
    await expect(page.locator(".history-detail")).toBeVisible();
    await page.getByRole("navigation", { name: "Continue exploring" }).getByRole("button").first().click();
    await expect(page).not.toHaveURL(saved);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.goto("/study/places/mockup/reformation?topic=not-a-topic");
  await expect(page.locator(".history-topic-grid")).toBeVisible();
  expect(errors).toEqual([]);
});

test("cities: new collections and full directory open real places", async ({ page }) => {
  await page.goto("/study/places/mockup/cities");
  const grid = page.getByRole("group", { name: "City collections", exact: true });
  await expect(grid.getByRole("button")).toHaveCount(11);
  await expect(grid.getByRole("link", { name: "Find Your City", exact: true })).toHaveCount(1);
  for (const [title, city, ref] of [
    ["Patriarchs & Promises", "Haran", "Genesis 12"],
    ["Egypt & the Exodus", "Pithom", "Exodus 1"],
    ["Cities Warned & Spared", "Zoar", "Matthew 11"],
  ]) {
    await grid.getByRole("button", { name: title, exact: true }).click();
    await page.getByRole("group", { name: "Which city will you explore?", exact: true }).getByRole("button", { name: new RegExp(city) }).click();
    await expect(page.locator("#city-map-title")).toContainText(city);
    await expect(page.getByRole("link", { name: new RegExp(ref) })).toBeVisible();
    await expect(page.locator("#city-map-experience")).toHaveAttribute("data-map-city", "Jerusalem");
    await page.getByRole("button", { name: "All collections", exact: true }).click();
  }
  await grid.getByRole("link", { name: "Find Your City", exact: true }).click();
  await expect(page).toHaveURL(/\/cities\/find$/);
  const directory = page.locator(".places-directory-results");
  await expect(directory.getByRole("link")).toHaveCount(24);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=1/);
  const search = page.getByRole("searchbox", { name: "Search cities", exact: true });
  await search.fill("no-such-city-123");
  await expect(page.getByText(/No cities match/)).toBeVisible();
  await search.fill("Jerusalem");
  await expect(directory.getByRole("link")).toHaveCount(1);
  await page.reload();
  await expect(search).toHaveValue("Jerusalem");
  await directory.getByRole("link").click();
  await expect(page).toHaveURL(/\/atlas\?place=/);
  await expect(page.getByRole("complementary", { name: "Jerusalem", exact: true })).toBeVisible();
  await page.goto("/study/places/mockup/cities/motion?design=unfold");
  await expect(page.getByRole("group", { name: "City collections", exact: true }).getByRole("link", { name: "Find Your City", exact: true })).toBeVisible();
});

test("history: expanded navigation fits both themes at each viewport", async ({ page }) => {
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const route of ["", "/cities", "/cities/motion?design=unfold", "/early-church", "/catholic-orthodox?topic=oriental", "/reformation?topic=luther", "/missions"]) {
      await page.goto(`/study/places/mockup${route}`);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `front-end capture/2026-10-06/expanded-collections-${route.replace(/[^a-z]/g, "-") || "home"}-${theme}-${test.info().project.name}.png`, fullPage: true });
    }
  }
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
  await expect(page.locator("#city-map-title")).toHaveText("Corinth");
  await expect(page.locator("#city-map-experience")).toHaveAttribute("data-map-city", "Jerusalem");
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
  await expect(collections.getByRole("button")).toHaveCount(11);
  await expect(cities).toHaveCount(0);
  const names = await collections.getByRole("button").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")!));
  const seven = collections.getByRole("button", { name: "The Seven Churches", exact: true });
  await seven.focus();
  await page.keyboard.press("Enter");
  await expect(collections).toHaveCount(0);
  await expect(back).toBeFocused();
  await expect(cities.locator("strong")).toHaveText(["Ephesus", "Smyrna", "Pergamum", "Thyatira", "Sardis", "Philadelphia", "Laodicea"]);
  await expect(page.locator(".places-city-count,.places-tier-number")).toHaveCount(0);
  await expect(page.locator(".places-city-selector + .city-map-experience")).toHaveCount(1);
  await back.click();
  await expect(seven).toBeFocused();
  await expect(cities).toHaveCount(0);
  await collections.getByRole("button", { name: "Cities of the Apostles", exact: true }).click();
  await expect(cities.getByRole("button", { name: /^Ephesus/ })).toHaveAttribute("aria-pressed", "true");
  await cities.getByRole("button", { name: /^Corinth/ }).click();
  await page.reload();
  await expect(cities.getByRole("button", { name: /^Corinth/ })).toHaveAttribute("aria-pressed", "true");
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
    expect(await cities.getByRole("button").count()).toBeGreaterThanOrEqual(3);
  }
  await back.click();
  await collections.getByRole("button", { name: "Cities of Refuge", exact: true }).click();
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
