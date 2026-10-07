import { expect, test } from "@playwright/test";

test("atlas routes: header, Study and legacy bookmarks reach the promoted collection", async ({ page }) => {
  await page.goto("/study");
  await page.getByRole("navigation", { name: "Main", exact: true }).getByRole("link", { name: "Atlas", exact: true }).click();
  await expect(page).toHaveURL(/\/study\/atlas$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Real places.");
  await expect(page.locator(".places-destination-card")).toHaveCount(8);
  const nav = page.getByRole("navigation", { name: "Main", exact: true });
  await expect(nav.getByRole("link", { name: "Atlas", exact: true })).toHaveClass(/bg-ink/);
  await expect(nav.getByRole("link", { name: "Study", exact: true })).not.toHaveClass(/bg-ink/);
  await expect(page.locator('a[href*="/study/places"]')).toHaveCount(0);
  await page.getByRole("link", { name: "Back to Study", exact: true }).click();
  await expect(page.locator('.study-map-feature a')).toHaveAttribute("href", "/study/atlas");
  await page.locator('.study-map-feature a').click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Real places.");

  for (const [old, target] of [
    ["/study/places", "/study/atlas"],
    ["/atlas", "/study/atlas"],
    ["/study/places/mockup", "/study/atlas"],
    ["/study/places/mockup/cities?collection=pagan-world&focus=ephesus", "/study/atlas/cities?collection=pagan-world&focus=ephesus"],
    ["/study/places/mockup/missions?topic=africa", "/study/atlas/missions?topic=africa"],
    ["/study/places/mockup/atlas?find=Jerusalem", "/study/atlas/map?find=Jerusalem"],
    ["/study/places/mockup2?place=a15257a", "/study/atlas/map?place=a15257a"],
    ["/study/places/mockup3", "/study/atlas/map"],
    ["/study/places?place=a15257a", "/study/atlas/map?place=a15257a"],
    ["/atlas?place=a15257a#places-map", "/study/atlas/map?place=a15257a#places-map"],
    ["/study/places#top-places", "/study/atlas/map#top-places"],
  ]) {
    await page.goto(old);
    await expect(page).toHaveURL(new URL(target, "http://127.0.0.1:8958").href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (target.includes("place=a15257a")) await expect(page.getByRole("complementary", { name: "Jerusalem", exact: true })).toBeVisible();
    if (target.endsWith("#top-places")) await expect(page.locator("#top-places")).toBeInViewport();
  }
});

test("atlas map: detailed map, persistent filters and Scripture links work inside the collection", async ({ page }) => {
  await page.goto("/study/atlas/map");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  const region = page.getByRole("group", { name: "Map region" });
  await region.getByRole("button", { name: "Jerusalem", exact: true }).click();
  await expect(region.getByRole("button", { name: "Jerusalem", exact: true })).toHaveAttribute("aria-pressed", "true");
  const search = page.getByRole("textbox", { name: "Find a place" });
  await search.fill("Jerusalem");
  await page.reload();
  await expect(search).toHaveValue("Jerusalem");
  await page.locator('section[aria-labelledby="top-places"]').getByRole("button", { name: /^Jerusalem/ }).click();
  await expect(page).toHaveURL(/place=a15257a/);
  const detail = page.getByRole("complementary", { name: "Jerusalem", exact: true });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("link").first()).toHaveAttribute("href", /\/read\/kjv\//);
  await page.reload();
  await expect(detail).toBeVisible();
  await search.fill("no-matching-place");
  await expect(page.getByText("No places match these filters.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Most-named places" })).toHaveCount(0);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/find=/);
  await expect(page.getByRole("heading", { name: "Most-named places" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Atlas", exact: true }).click();
  await expect(page).toHaveURL(/\/study\/atlas$/);
});

test("reveal: compact city and history selectors share the downward expansion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [route, name] of [["cities", "The Pagan World"], ["early-church", "After the Apostles"], ["reformation", "Luther & Germany"], ["missions", "Africa"]]) {
    await page.goto(`/study/atlas/${route}`);
    // The outer selection; a city collection nests a second one (its cities) inside the open card.
    const stage = page.locator(".places-reveal").first();
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
      // The height the stage animates to (the card's map can still be settling, so not the panel's live height).
      const frames = (element.getAnimations()[0]?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? [];
      const target = parseFloat(String(frames.at(-1)?.height ?? panel.offsetHeight));
      return { height: element.getBoundingClientRect().height, target, clip: getComputedStyle(panel).clipPath, x: new DOMMatrix(getComputedStyle(panel).transform).m41 };
    });
    expect(frame.clip).toContain("50%");
    expect(frame.x).toBe(0);
    expect(Math.abs(frame.height - (before + frame.target) / 2)).toBeLessThan(1);
    await stage.evaluate((element) => element.getAnimations({ subtree: true }).forEach((animation) => animation.play()));
    await expect(stage).toHaveAttribute("data-phase", "expanded");
    const back = stage.locator(".places-collections-back").first();
    await expect(back).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(stage).toHaveAttribute("data-phase", "collapsed");
    await expect(card).toBeFocused();
    expect(Math.abs((await stage.boundingBox())!.height - before)).toBeLessThan(1);
  }
  await page.goto("/study/atlas/cities/motion?design=slide");
  await expect(page).toHaveURL(/\/atlas\/cities$/);
  await expect(page.locator(".motion-designs,.motion-demo-stage,.places-city-count,.history-topic-card")).toHaveCount(0);
});

test("cities: choosing a city opens it inside the card and moves the card's map there", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
  await page.goto("/study/atlas/cities");
  await page.getByRole("button", { name: "The Pagan World", exact: true }).click();
  await expect(page.locator(".places-reveal").first()).toHaveAttribute("data-phase", "expanded");
  await expect(page.getByText("Choose a city", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Choose a city to explore the map below.")).toHaveCount(0);
  const map = page.locator(".places-city-card #city-map-experience");
  await expect(map.locator(".maplibregl-canvas")).toBeVisible();
  const cities = page.getByRole("group", { name: "Which city will you explore?" });
  for (const name of ["Ephesus", "Athens"]) {
    await cities.getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await expect(page).toHaveURL(/view=city/);
    await expect(page.locator(".city-detail-heading h3")).toHaveText(name);
    await expect(page.getByRole("button", { name: "All cities", exact: true })).toBeFocused();
    await expect(page.locator("#city-map-title")).toHaveText(name);
    await expect(map).toHaveAttribute("data-map-city", name);
    await expect(page.locator(".city-detail-verses li").first()).toBeVisible();
    // Escape closes only the city; the collection stays open.
    await page.keyboard.press("Escape");
    await expect(cities.getByRole("button", { name: new RegExp(`^${name}`) })).toBeFocused();
    await expect(page.getByRole("button", { name: "All collections", exact: true })).toBeVisible();
  }
  await cities.getByRole("button", { name: /^Ephesus/ }).click();
  await expect(map.locator("header")).toContainText("On the atlas · 37.94° N, 27.34° E");
  await expect(page.getByRole("link", { name: /Read Revelation 2:1–7/ })).toHaveAttribute("href", "/read/kjv/REV/2?hl=1-7");
  await page.screenshot({ path: `front-end capture/2026-10-06/city-detail-map-${test.info().project.name}.png` });
  await page.getByRole("group", { name: "Map region" }).getByRole("button", { name: "Jerusalem", exact: true }).click();
  await expect(page.getByRole("group", { name: "Map region" }).getByRole("button", { name: "Jerusalem", exact: true })).toHaveAttribute("aria-pressed", "true");
});

// The owner chose the "wipe" for every Atlas page change (2026-10-06, usePlacesPageSlide.ts and places-collection.css).
// Going forward (to a page later in the row) the leaving page fades out in 150 ms and the new page is uncovered from
// left to right over 620 ms. Going back (to an earlier page, or the Atlas home) is one quick sequence instead: the
// leaving page fades out in 150 ms and the arriving page fades in over 260 ms from 140 ms. Each run is paused part way.
test("page wipe: going forward wipes the new page in, going back fades, with stable navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
  await page.goto("/study/atlas/journeys");
  const nav = page.getByRole("navigation", { name: "Explore the collection", exact: true });
  const navTop = (await nav.boundingBox())!.y;
  const RUNS = { forward: { names: ["places-fade-out", "places-wipe-in"], at: 310 }, backward: { names: ["places-fade-out", "places-fade-in"], at: 200 } };
  const ALL = ["places-fade-out", "places-wipe-in", "places-fade-in"];
  for (const [name, direction] of [["Ancient Cities", "forward"], ["Global Missions", "forward"], ["Atlas", "backward"], ["Journeys", "forward"]] as const) {
    await nav.getByRole("link", { name, exact: true }).click();
    await page.waitForFunction(({ names, at }) => {
      const runs = document.getAnimations().filter((animation) => animation instanceof CSSAnimation && names.includes(animation.animationName));
      if (!names.every((wanted) => runs.some((animation) => (animation as CSSAnimation).animationName === wanted))) return false;
      runs.forEach((animation) => { animation.pause(); animation.currentTime = at; });
      return true;
    }, RUNS[direction]);
    await expect(page.locator("html")).toHaveAttribute("data-places-slide", "wipe");
    await expect(page.locator("html")).toHaveAttribute("data-places-direction", direction);
    const [leaving, arriving] = await page.evaluate(() => ["old", "new"].map((kind) => {
      const style = getComputedStyle(document.documentElement, `::view-transition-${kind}(places-page)`);
      // How much of the page the clip hides from the right, as a share of its width ("inset(0px 50% 0px 0px)").
      const sides = /inset\((.*)\)/.exec(style.clipPath)?.[1].split(/ (?![^(]*\))/) ?? [];
      const right = sides[1] ?? sides[0] ?? "0px";
      const percent = Number(/([\d.]+)%/.exec(right)?.[1] ?? 0), pixels = Number(/([\d.]+)px/.exec(right)?.[1] ?? 0);
      return { hiddenRight: percent / 100 + pixels / parseFloat(style.width), clipped: style.clipPath !== "none", opacity: Number(style.opacity) };
    }));
    expect(leaving.opacity).toBe(0);
    expect(leaving.clipped).toBe(false);
    if (direction === "forward") {
      expect(arriving.hiddenRight).toBeCloseTo(.5, 1);
      expect(arriving.opacity).toBe(1);
    } else {
      expect(arriving.clipped).toBe(false);
      expect(arriving.opacity).toBeGreaterThan(0);
      expect(arriving.opacity).toBeLessThan(1);
    }
    expect(Math.abs((await nav.boundingBox())!.y - navTop)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `front-end capture/2026-10-07/page-wipe-${name.replace(/[^a-z]/gi, "-")}-${test.info().project.name}.png` });
    await page.evaluate((names) => document.getAnimations().filter((animation) => animation instanceof CSSAnimation && names.includes(animation.animationName)).forEach((animation) => animation.play()), ALL);
    await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  }
  await page.getByRole("link", { name: "Back to Atlas", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  await page.getByRole("navigation", { name: "Places and journeys collection", exact: true }).getByRole("link", { name: "Ancient Cities", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-places-slide", "wipe");
  await expect(page.locator("html")).toHaveAttribute("data-places-direction", "forward");
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  await page.getByRole("button", { name: "The Seven Churches", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-places-slide");
  expect(errors).toEqual([]);
});

test("page slide: rapid navigation, reduced motion and unsupported browsers keep working", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/study/atlas/journeys");
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
  await page.goto("/study/atlas");
  await expect(page.getByRole("navigation", { name: "Places and journeys collection", exact: true }).getByRole("link")).toHaveCount(4);
  const history = page.getByRole("navigation", { name: "Christian history collection", exact: true });
  await expect(history.getByRole("link")).toHaveText([
    /The Early Church/, /Apostolic Church/, /The Reformation/, /Global Missions/,
  ]);
  await page.getByRole("link", { name: "The Reformation", exact: true }).click();
  await expect(page).toHaveURL(/\/atlas\/reformation$/);
  // Apostolic Church maps two traditions (owner, 2026-10-06): Catholic first, one shared workspace below.
  await page.goto("/study/atlas/catholic-orthodox");
  const traditions = page.getByRole("group", { name: "Which tradition will you follow?" }).getByRole("button");
  await expect(traditions).toHaveCount(2);
  await expect(traditions.first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#tradition-workspace-title")).toContainText("Catholic Christianity");
  await expect(page.getByRole("link", { name: "Find Rome in the atlas", exact: true })).toBeVisible();
  await traditions.nth(1).click();
  await expect(page.locator("#tradition-workspace-title")).toContainText("Eastern Orthodoxy");
  // Constantinople is not a Bible place, so the map would find nothing: no link is offered (2026-10-07).
  await expect(page.getByRole("link", { name: /in the atlas$/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Councils", exact: true }).click();
  await expect(page).toHaveURL(/tradition=eastern&lens=councils/);
  for (const id of ["early-church", "reformation", "missions"]) {
    await page.goto(`/study/atlas/${id}`);
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
  await page.goto("/study/atlas/reformation?topic=not-a-topic");
  await expect(page.locator(".history-topic-grid")).toBeVisible();
  expect(errors).toEqual([]);
});

test("cities: new collections and full directory open real places", async ({ page }) => {
  await page.goto("/study/atlas/cities");
  const grid = page.getByRole("group", { name: "City collections", exact: true });
  await expect(grid.getByRole("button")).toHaveCount(11);
  await expect(grid.getByRole("link", { name: "Find Your City", exact: true })).toHaveCount(1);
  for (const [title, city] of [
    ["Patriarchs & Promises", "Haran"],
    ["Egypt & the Exodus", "Pithom"],
    ["Cities Warned & Spared", "Zoar"],
  ]) {
    await grid.getByRole("button", { name: title, exact: true }).click();
    await page.getByRole("group", { name: "Which city will you explore?", exact: true }).getByRole("button", { name: new RegExp(city) }).click();
    await expect(page.locator("#city-map-title")).toContainText(city);
    await expect(page.locator(".city-detail-heading h3")).toHaveText(city);
    await expect(page.locator("#city-map-experience")).toHaveAttribute("data-map-city", city);
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
  await expect(page).toHaveURL(/\/atlas\/map\?place=/);
  await expect(page.getByRole("complementary", { name: "Jerusalem", exact: true })).toBeVisible();
  await page.goto("/study/atlas/cities/motion?design=unfold");
  await expect(page.getByRole("group", { name: "City collections", exact: true }).getByRole("link", { name: "Find Your City", exact: true })).toBeVisible();
});

test("history: expanded navigation fits both themes at each viewport", async ({ page }) => {
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const route of ["", "/cities", "/cities/motion?design=unfold", "/early-church", "/catholic-orthodox?topic=oriental", "/reformation?topic=luther", "/missions"]) {
      await page.goto(`/study/atlas${route}`);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `front-end capture/2026-10-06/expanded-collections-${route.replace(/[^a-z]/g, "-") || "home"}-${theme}-${test.info().project.name}.png`, fullPage: true });
    }
  }
});

test("collection: illustrated destinations lead to separate pages and useful preview controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/study/atlas");
  const collection = page.getByRole("navigation", { name: "Places and journeys collection" });
  await expect(collection.getByRole("link")).toHaveCount(4);
  await expect(page.locator(".vector-atlas-svg")).toHaveCount(0);
  await collection.getByRole("link", { name: "Journeys", exact: true }).click();
  await expect(page).toHaveURL(/\/atlas\/journeys$/);
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
  await expect(page.locator("#city-map-experience")).toHaveAttribute("data-map-city", "Corinth");
  await navigation.getByRole("link", { name: "Gospel Events" }).click();
  await page.getByRole("button", { name: /Passion week/ }).click();
  await page.getByRole("button", { name: "Luke", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Follow Luke’s account." })).toBeVisible();
  await page.getByRole("link", { name: "Back to Atlas", exact: true }).click();
  await expect(collection).toBeVisible();
  expect(errors).toEqual([]);
});

test("cities: collections drill into one selection area with keyboard and history support", async ({ page }) => {
  await page.goto("/study/atlas/cities");
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
  await expect(page.locator(".places-city-card .city-map-experience")).toHaveCount(1);
  await back.click();
  await expect(seven).toBeFocused();
  await expect(cities).toHaveCount(0);
  await collections.getByRole("button", { name: "Cities of the Apostles", exact: true }).click();
  await expect(cities.getByRole("button", { name: /^Ephesus/ })).toHaveAttribute("aria-pressed", "true");
  await cities.getByRole("button", { name: /^Corinth/ }).click();
  await expect(page.locator(".city-detail-heading h3")).toHaveText("Corinth");
  await page.reload();
  await expect(page.locator(".city-detail-heading h3")).toHaveText("Corinth");
  await page.getByRole("button", { name: "All cities", exact: true }).click();
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
  await page.goto("/study/atlas/cities?focus=corinth");
  await expect(collections).toHaveCount(0);
  await expect(cities.getByRole("button", { name: /^Corinth/ })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/study/atlas/cities?collection=seven-churches&focus=corinth");
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
      await page.goto(`/study/atlas${destination}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      if (!destination || destination === "/journeys") await page.screenshot({ path: `front-end capture/2026-10-05/places-collection-${destination ? "journeys" : "home"}-${theme}-${test.info().project.name}.png`, fullPage: true });
    }
  }
  await page.goto("/study/atlas?place=a15257a");
  await expect(page).toHaveURL(/\/atlas\/map\?place=a15257a/);
  await expect(page.getByRole("complementary", { name: "Jerusalem" })).toBeVisible();
});
