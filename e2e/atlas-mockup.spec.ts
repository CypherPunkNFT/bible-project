import { expect, test } from "@playwright/test";

test("history: both collection rows and every new topic support navigation, focus and saved links", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/study/places/mockup");
  await expect(page.getByRole("navigation", { name: "Places and journeys collection", exact: true }).getByRole("link")).toHaveCount(4);
  const history = page.getByRole("navigation", { name: "Christian history collection", exact: true });
  await expect(history.getByRole("link")).toHaveText([
    /The Early Church/, /Catholic & Orthodox Christianity/, /The Reformation/, /Missions & the Global Church/,
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
      await expect(cards).toHaveCount(0);
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
    await expect(page.locator("#places-workspace-title")).toContainText(city);
    await expect(page.getByRole("link", { name: new RegExp(ref) })).toBeVisible();
    await expect(page.getByRole("link", { name: `Find ${city} in the atlas`, exact: true })).toHaveAttribute("href", new RegExp(`find=${city}`));
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

test("motion lab: four distinct transitions, full-page city selection, return and cancellation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
  await page.goto("/study/places/mockup/cities/motion");
  const designs = page.getByRole("group", { name: "Animation designs" });
  const stage = page.locator(".motion-demo-stage");
  await expect(page.getByRole("heading", { name: "Enter a city. Understand its story." })).toBeVisible();
  await expect(page.locator(".motion-demo,.motion-demo-toolbar,.motion-demo-status,.motion-design-explanation")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Replay opening" })).toHaveCount(0);
  await expect(page.getByText("Experience preview", { exact: true })).toHaveCount(0);
  await expect(designs.getByRole("button")).toHaveCount(4);
  for (const name of ["Clear & expand", "Soft dissolve", "Slide across", "Reveal downward"]) {
    await designs.getByRole("button", { name: new RegExp(name) }).click();
    const grid = page.getByRole("group", { name: "City collections" });
    await expect(grid.getByRole("button")).toHaveCount(11);
    await grid.getByRole("button", { name: "The Seven Churches", exact: true }).click();
    await expect(stage).toHaveAttribute("data-phase", "cities");
    const back = page.getByRole("button", { name: "All collections", exact: true });
    await expect(back).toBeFocused();
    const cities = page.getByRole("group", { name: "Which city will you explore?" });
    await expect(cities.getByRole("button")).toHaveCount(7);
    await cities.getByRole("button", { name: /Laodicea/ }).click();
    await expect(page.locator("#places-workspace-title")).toContainText("Laodicea");
    await expect(page.getByRole("link", { name: "Find Laodicea in the atlas" })).toHaveAttribute("href", /find=Laodicea/);
    await page.getByRole("button", { name: "Then & now", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Connect the ancient and present landscape." })).toBeVisible();
    await back.click();
    await expect(stage).toHaveAttribute("data-phase", "collections");
    await expect(grid.getByRole("button", { name: "The Seven Churches", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.getByRole("button", { name: "The Seven Churches", exact: true }).click();
  await designs.getByRole("button", { name: /Soft dissolve/ }).click();
  await expect(stage).toHaveAttribute("data-phase", "collections");
  await page.getByRole("button", { name: "Cities of Refuge", exact: true }).click();
  await expect(stage).toHaveAttribute("data-phase", "cities");
  await expect(page.getByRole("group", { name: "Which city will you explore?" }).getByRole("button")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `front-end capture/2026-10-06/city-motion-lab-dark-${test.info().project.name}.png`, fullPage: true });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("button", { name: "The Seven Churches", exact: true }).click();
  await expect(stage).toHaveAttribute("data-phase", "cities");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `front-end capture/2026-10-06/city-motion-lab-light-${test.info().project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("motion lab: neighbors finish fading before expansion begins", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/study/places/mockup/cities/motion?design=expand");
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

test("motion lab: opening and returning never expose an empty handoff frame", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const design of ["expand", "dissolve", "slide", "unfold"]) {
    await page.goto(`/study/places/mockup/cities/motion?design=${design}`);
    await expect(page.getByRole("button", { name: "Cities of Refuge", exact: true })).toBeVisible();
    for (const opening of [true, false]) {
      const samples = await page.evaluate(async (open) => {
        const stage = document.querySelector<HTMLElement>(".motion-demo-stage")!;
        const grid = stage.querySelector<HTMLElement>(".motion-demo-grid")!;
        const panel = stage.querySelector<HTMLElement>(".motion-demo-panel")!;
        const ghost = stage.querySelector<HTMLElement>(".motion-demo-ghost")!;
        const card = grid.querySelector<HTMLElement>('[data-motion-collection="cities-refuge"]')!;
        const opacity = (element: HTMLElement) => element.hidden ? 0 : Number(getComputedStyle(element).opacity);
        const frames: number[] = [];
        const offsets: number[] = [];
        const start = performance.now();
        let settled = 0;
        (open ? card : panel.querySelector<HTMLElement>(".places-collections-back")!).click();
        await new Promise<void>((resolve) => {
          const sample = () => {
            frames.push(opacity(grid) * opacity(card) + opacity(panel) + opacity(ghost));
            const top = stage.getBoundingClientRect().top;
            if (!grid.hidden) offsets.push(Math.abs(grid.getBoundingClientRect().top - top));
            if (!panel.hidden) offsets.push(Math.abs(panel.getBoundingClientRect().top - top));
            if (stage.dataset.phase === (open ? "cities" : "collections")) settled++;
            if (settled > 5 || performance.now() - start > 3000) resolve();
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        return { frames, offsets };
      }, opening);
      expect(Math.min(...samples.frames), `${design} ${opening ? "opening" : "return"}: continuous layer coverage`).toBeGreaterThan(.95);
      expect(Math.max(...samples.offsets), `${design}: both layers stay at the top of the stage throughout the transition`).toBeLessThan(1);
      await expect(page.locator(".motion-demo-stage")).toHaveAttribute("data-phase", opening ? "cities" : "collections");
    }
  }
});

test("motion lab: fade, horizontal slide and vertical reveal are visibly distinct", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "dark" });
  for (const design of ["dissolve", "slide", "unfold"]) {
    await page.goto(`/study/places/mockup/cities/motion?design=${design}`);
    const stage = page.locator(".motion-demo-stage");
    await expect(page.getByRole("button", { name: "The Seven Churches", exact: true })).toBeVisible();
    const initialHeight = (await stage.boundingBox())!.height;
    if (design === "unfold") {
      const gridHeight = await page.locator(".motion-demo-grid").evaluate((element) => element.getBoundingClientRect().height);
      expect(Math.abs(initialHeight - gridHeight)).toBeLessThan(1);
    }
    await page.getByRole("button", { name: "The Seven Churches", exact: true }).click();
    await page.waitForFunction(() => {
      const element = document.querySelector(".motion-demo-stage")!;
      // Wait for the panel transition, not an unrelated hover transition on the clicked card.
      if (!element.querySelector(".motion-demo-panel")!.getAnimations().length) return false;
      element.getAnimations({ subtree: true }).forEach((animation) => { animation.pause(); animation.currentTime = Number(animation.effect!.getComputedTiming().duration) / 2; });
      return true;
    });
    const frame = await stage.evaluate((element) => {
      element.getAnimations({ subtree: true }).forEach((animation) => { animation.pause(); animation.currentTime = Number(animation.effect!.getComputedTiming().duration) / 2; });
      const panel = element.querySelector<HTMLElement>(".motion-demo-panel")!;
      const styles = getComputedStyle(panel);
      const transform = new DOMMatrix(styles.transform);
      return { x: transform.m41, y: transform.m42, opacity: Number(styles.opacity), clip: styles.clipPath, width: element.clientWidth, height: element.getBoundingClientRect().height, panelHeight: panel.offsetHeight };
    });
    if (design === "unfold") {
      expect(Math.abs(frame.height - (initialHeight + frame.panelHeight) / 2)).toBeLessThan(1);
    } else {
      expect(Math.abs(frame.height - initialHeight)).toBeLessThan(1);
    }
    expect(frame.y).toBe(0);
    if (design === "dissolve") {
      expect(frame.x).toBe(0); expect(frame.opacity).toBeCloseTo(.5, 1); expect(frame.clip).toBe("none");
    } else if (design === "slide") {
      expect(frame.x / frame.width).toBeCloseTo(.5, 1); expect(frame.opacity).toBe(1); expect(frame.clip).toBe("none");
    } else {
      expect(frame.x).toBe(0); expect(frame.opacity).toBe(1); expect(frame.clip).toContain("50%");
    }
    await stage.screenshot({ path: `front-end capture/2026-10-06/city-motion-${design}-midpoint-${test.info().project.name}.png` });
    await stage.evaluate((element) => element.getAnimations({ subtree: true }).forEach((animation) => animation.play()));
    await expect(stage).toHaveAttribute("data-phase", "cities");
    if (design === "unfold") {
      expect(Math.abs((await stage.boundingBox())!.height - frame.panelHeight)).toBeLessThan(1);
      await page.getByRole("button", { name: "All collections", exact: true }).click();
      await expect(stage).toHaveAttribute("data-phase", "collections");
      expect(Math.abs((await stage.boundingBox())!.height - initialHeight)).toBeLessThan(1);
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
  await expect(collections.getByRole("button")).toHaveCount(11);
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
  await expect(page.getByRole("group", { name: "City collections" }).getByRole("button")).toHaveCount(11);
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
