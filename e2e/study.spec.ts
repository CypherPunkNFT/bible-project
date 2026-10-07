import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// The Study pages (TODO section G). Runs at desktop, tablet and phone like site.spec.ts.
test.skip(!existsSync("data/study/index.json"), "study data not built — run scripts/build-study.py first");

const TRANSLATION_LANGUAGES = ["Spanish", "Arabic", "Chinese", "French", "German", "Hindi", "Portuguese", "Russian", "Japanese", "Vietnamese", "Persian", "Italian"];

const PAGES = ["/study", "/study/gospels", "/study/references", "/study/structure", "/study/versions", "/study/atlas", "/study/harmony", "/study/miracles", "/study/letters", "/study/people", "/study/people/elijah-1ki-17-1", "/study/prophets", "/study/names"];

test("study: teaching, speech and harmony each keep their state while the cards switch between them", async ({ page }) => {
  await page.goto("/study/gospels");
  await page.getByRole("navigation", { name: "Collection contents" }).getByRole("link", { name: "Teaching journeys", exact: true }).click();
  await page.getByRole("button", { name: "Prayer Teach us to pray." }).click();
  await expect(page.locator(".teaching-scripture").first()).toContainText("Our Father");
  // One chart at a time: each is opened from its contents card.
  const contents = page.getByRole("navigation", { name: "Collection contents" });
  await contents.getByRole("link", { name: "Gospel harmony", exact: true }).click();
  const harmony = page.locator("#harmony");
  await harmony.getByRole("button", { name: "John", exact: true }).click();
  await harmony.getByLabel("and no other Gospel").check();
  await expect(harmony.getByRole("button", { name: /Jesus works his first miracle/ }).first()).toBeVisible();
  await expect(harmony.getByRole("button", { name: /Feeding of the five thousand/ })).toHaveCount(0);
  await contents.getByRole("link", { name: "Where he speaks", exact: true }).click();
  await page.locator("#speech").getByRole("group", { name: "Choose a Gospel" }).getByRole("button", { name: "John", exact: true }).click();
  await expect(page.locator(".speech-bars a")).toHaveCount(21);
  // Each chart keeps its selections when its card is chosen again.
  await contents.getByRole("link", { name: "Teaching journeys", exact: true }).click();
  await expect(page.locator(".teaching-paths").getByRole("button", { name: "Prayer Teach us to pray." })).toHaveAttribute("aria-pressed", "true");
  await contents.getByRole("link", { name: "Gospel harmony", exact: true }).click();
  await expect(harmony.getByLabel("and no other Gospel")).toBeChecked();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("study: prophets remain discoverable within People and Atlas bookmarks retain their place", async ({ page }) => {
  await page.goto("/study/people");
  await page.getByRole("navigation", { name: "Collection contents" }).getByRole("link", { name: "Prophets through time" }).click();
  // Inside People the card opens the prophets in place; the stand-alone page also exists.
  await expect(page).toHaveURL(/\/study\/(prophets|people\?view=prophets)$/);
  await expect(page.locator("#prophet-amos-amo-1-1")).toBeVisible();
  await page.getByRole("navigation", { name: "Collection contents" }).getByRole("link", { name: "People & families" }).click();
  await expect(page).toHaveURL(/\/study\/people(\?view=families|#people-directory)$/);
  await page.goto("/atlas?place=a15257a");
  await expect(page).toHaveURL(/\/study\/atlas\/map\?place=a15257a$/);
  await expect(page.getByRole("heading", { name: "Jerusalem", level: 2 })).toBeVisible();
});

// The cards show one section at a time below them (components/study/study-view.ts) rather than scrolling to it.
test("study: guide contents reach their own sections instead of unrelated collections", async ({ page }) => {
  for (const [path, label, id] of [
    ["/study/miracles", "The miracles of Jesus", "who-jesus"],
    ["/study/miracles", "Moses & Aaron", "who-moses-and-aaron"],
    ["/study/miracles", "Prophets & apostles", "other-miracles"],
    ["/study/letters", "Paul's letters", "paul-letters"],
    ["/study/letters", "Hebrews", "hebrews"],
    ["/study/letters", "James, Peter & Jude", "general-letters"],
    ["/study/letters", "The letters of John", "john-letters"],
    ["/study/names", "Explore the names", "names-explorer"],
    ["/study/names", "Find a name", "names-list"],
  ]) {
    await page.goto(path);
    await page.getByRole("navigation", { name: "Collection contents" }).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path + "#" + id + "$"));
    await expect(page.locator("#" + id)).toBeVisible();
  }
  await page.goto("/study/places#top-places");
  await page.locator("section[aria-labelledby='top-places']").getByRole("button", { name: /^Jerusalem/ }).click();
  await expect(page.locator("#places-map")).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Jerusalem", level: 2 })).toBeVisible();
  await page.goto("/study/prophets");
  await page.getByRole("navigation", { name: "Collection contents" }).getByRole("link", { name: "Prophets through time" }).click();
  await expect(page.locator("#prophets-directory")).toBeInViewport();
});

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

for (const path of PAGES) {
  test(`study: no sideways scroll and no console errors: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(path);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `page is ${overflow}px wider than the screen`).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test("harmony: a row opens with the keyboard and shows all four Gospels", async ({ page }) => {
  await page.goto("/study/harmony");
  const row = page.getByRole("button", { name: /Feeding of the five thousand/ });
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(row).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("region", { name: /Feeding of the five thousand/ });
  for (const gospel of ["Matthew", "Mark", "Luke", "John"]) await expect(panel.getByRole("heading", { name: gospel })).toBeVisible();
  await expect(panel).toContainText("five loaves");
});

test("harmony: 'only John' shows the events no other Gospel tells", async ({ page }) => {
  await page.goto("/study/harmony");
  await page.locator("#harmony").getByRole("button", { name: "John", exact: true }).click();
  await page.getByLabel("and no other Gospel").check();
  await expect(page.getByRole("button", { name: /Jesus works his first miracle/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Feeding of the five thousand/ })).toHaveCount(0);
});

test("harmony: rows and the outside scrollbar scroll together while the chart stays visible", async ({ page }) => {
  await page.goto("/study/harmony");
  const rows = page.getByRole("region", { name: "Gospel harmony events", exact: true });
  const chart = page.locator(".harmony-coverage");
  await expect(chart).toBeInViewport({ ratio: 1 });
  await expect(rows).toBeInViewport({ ratio: 1 });
  // Check the actual page end, not only the anchor landing: the old layout clipped the search strip here.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(chart).toBeInViewport({ ratio: 1 });
  // Document scrolling rounds to whole pixels; the footer edge can land a fraction of a pixel below it.
  await expect(page.locator("#main + footer")).toBeInViewport({ ratio: .99 });
  const before = await page.evaluate(() => {
    const card = document.getElementById("harmony")!.getBoundingClientRect();
    const band = document.querySelector(".harmony-filters")!.getBoundingClientRect();
    const outside = document.querySelector(".harmony-outside-scroll")!.getBoundingClientRect();
    const footer = document.querySelector("#main + footer")!.getBoundingClientRect();
    const header = document.querySelector("#main")!.previousElementSibling!.getBoundingClientRect();
    const rows = document.querySelector(".harmony-rows")!;
    return { pageY: scrollY, chartY: document.querySelector(".harmony-coverage")!.getBoundingClientRect().top,
      leftInset: band.left - card.left, rightInset: card.right - band.right,
      scrollbarGap: outside.right - 6 - card.right, gutter: rows.getBoundingClientRect().width - rows.clientWidth,
      footerVisible: innerHeight - footer.top, footerHeight: footer.height, bandClearance: band.top - header.bottom };
  });
  expect(before.leftInset).toBeCloseTo(1);
  expect(before.rightInset).toBeCloseTo(1);
  expect(before.scrollbarGap).toBeGreaterThan(0);
  expect(before.gutter).toBeLessThanOrEqual(1);
  expect(before.footerVisible).toBeGreaterThanOrEqual(before.footerHeight - 1);
  expect(before.bandClearance).toBeGreaterThanOrEqual(0);

  await rows.hover();
  await page.mouse.wheel(0, 550);
  await expect.poll(() => rows.evaluate((el) => el.scrollTop)).toBeGreaterThan(400);
  await expect.poll(() => page.evaluate(() => Math.abs(document.querySelector(".harmony-rows")!.scrollTop - document.querySelector(".harmony-outside-scroll")!.scrollTop))).toBeLessThanOrEqual(1);
  await page.locator(".harmony-outside-scroll").evaluate((el) => { el.scrollTop = 1400; });
  await expect.poll(() => rows.evaluate((el) => el.scrollTop)).toBe(1400);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before.pageY, 0);
  expect((await chart.boundingBox())!.y).toBeCloseTo(before.chartY, 0);
  await expect(chart).toBeInViewport({ ratio: 1 });

  await rows.focus();
  await page.keyboard.press("End");
  await expect(page.locator(".harmony-rows > ol > li").last()).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before.pageY, 0);

  if (page.viewportSize()!.width > 1000) {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator(".harmony-filters")).toBeInViewport({ ratio: 1 });
    await expect(page.locator("#main + footer")).toBeInViewport({ ratio: .99 });
    const clearance = await page.evaluate(() => document.querySelector(".harmony-filters")!.getBoundingClientRect().top - document.querySelector("#main")!.previousElementSibling!.getBoundingClientRect().bottom);
    expect(clearance).toBeGreaterThanOrEqual(0);
  }
});

test("harmony: map selections and filters preserve the chart and keep the scroll range accurate", async ({ page }) => {
  await page.goto("/study/harmony");
  const rows = page.getByRole("region", { name: "Gospel harmony events", exact: true });
  const chart = page.locator(".harmony-coverage");
  await expect(chart).toBeInViewport({ ratio: 1 });
  const chartY = (await chart.boundingBox())!.y;
  await page.locator('.harmony-coverage [data-event="54"]').first().click();
  await expect(page.locator("#event-54 button").first()).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => Math.abs((await page.locator("#event-54").boundingBox())!.y - (await rows.boundingBox())!.y)).toBeLessThan(2);
  expect((await chart.boundingBox())!.y).toBeCloseTo(chartY, 0);
  await expect(page.locator("#event-54-panel")).toContainText("Blessed");

  const search = page.getByPlaceholder("Find an event, e.g. lepers");
  await search.fill("no matching event here");
  await expect(rows).toContainText("No event matches.");
  await expect.poll(() => rows.evaluate((el) => el.scrollTop)).toBe(0);
  await expect.poll(() => page.locator(".harmony-outside-scroll").evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  // A dimmed map event still opens its accounts by clearing filters that would hide it.
  await page.locator('.harmony-coverage [data-event="54"]').first().click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".harmony-rows > ol > li")).toHaveCount(185);
  await expect.poll(() => rows.evaluate((el) => el.scrollTop)).toBeGreaterThan(500);
  await expect(chart).toBeInViewport({ ratio: 1 });
  await expect.poll(() => page.evaluate(() => Math.abs(document.querySelector(".harmony-rows")!.scrollHeight - document.querySelector(".harmony-outside-scroll")!.scrollHeight))).toBeLessThanOrEqual(1);
});

test("harmony references open the reader on the whole passage", async ({ page }) => {
  await page.goto("/study/harmony");
  await page.getByRole("link", { name: "6:30–44" }).first().click();
  await expect(page).toHaveURL(/\/read\/[a-z]+\/MRK\/6\?hl=30-44/);
  await expect(page.locator('[data-verse="30"]').first()).toHaveCSS("background-color", "rgb(235, 197, 94)");
});

test("people: Zechariah is one of 29, and family links land on the right person", async ({ page }) => {
  await page.goto("/study/people");
  await page.getByPlaceholder("Name, another name, or what they did").fill("Zechariah");
  await page.locator(".people-card", { has: page.locator("strong", { hasText: /^Zechariah$/ }) }).first().click();
  await expect(page).toHaveURL(/\/people\/zechariah-/);
  await expect(page.getByText(/one of 29 people named Zechariah/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to People & genealogies" })).toBeVisible();
  // Old person addresses open the person's own page.
  await page.goto("/study/people/david-rut-4-17");
  await expect(page).toHaveURL(/\/people\/david-rut-4-17$/);
  await page.getByRole("region", { name: "Family" }).getByRole("link", { name: "Absalom" }).click();
  await expect(page).toHaveURL(/\/people\/absalom-2sa-3-3$/);
  await expect(page.getByRole("heading", { name: "Absalom", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to David" })).toBeVisible();
});

test("prophets: Amos, Moses and Deborah the judge are there; Rebekah's nurse is not", async ({ page }) => {
  await page.goto("/study/prophets");
  for (const id of ["amos-amo-1-1", "moses-exo-2-10", "deborah-jdg-4-4"]) await expect(page.locator(`#prophet-${id}`)).toBeVisible();
  await expect(page.locator("#prophet-deborah-gen-35-8")).toHaveCount(0);
});

test("names: the Faith page's three words unfold and a name opens its Scripture", async ({ page }) => {
  await page.goto("/study/names");
  for (const words of ["ABBA FATHER", "JESUS CHRIST", "HOLY SPIRIT"]) await expect(page.getByRole("button", { name: `Expand ${words} names` })).toBeVisible();
  await page.getByRole("button", { name: "Expand ABBA FATHER names" }).click();
  const field = page.getByRole("group", { name: "Explore ABBA FATHER names" });
  await expect(field).toHaveAttribute("data-edge-state", "expanded", { timeout: 5000 });
  await field.getByRole("button", { name: "Abba, Father" }).first().click();
  const reading = page.getByRole("article", { name: "Abba, Father Scripture" });
  await expect(reading).toContainText("Abba, Father, all things are possible");
  await expect(reading.getByRole("link", { name: /Read in context/ })).toHaveAttribute("href", "/read/kjv/MRK/14?hl=36-36");
});

test("home page shows the Names of God", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /^His names.?$/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Expand JESUS CHRIST names" })).toBeVisible();
});

test("harmony: a long passage across chapters ends with 'read on' (the Sermon on the Mount)", async ({ page }) => {
  await page.goto("/study/harmony#event-54");
  const panel = page.locator("#event-54-panel");
  await expect(panel).toBeVisible();
  await expect(page.locator(".harmony-coverage")).toBeInViewport({ ratio: 1 });
  await expect(page.locator("#event-54 button").first()).toBeInViewport();
  await expect(panel.getByRole("link", { name: /read on/ }).first()).toBeVisible();
});

test("home: the landing opens with John 1:1", async ({ page }) => {
  // The "One story" section was replaced by "About this site" (78bdbfd); the landing itself is unchanged.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("In the beginning");
  await expect(page.locator("#home-title").locator("..")).toContainText("and the Word was with God");
});

test("home: the glow stops for readers who reduce motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8933/");
  const animation = await page.locator(".home-glow").evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
  await context.close();
});

test("versions page: English, original languages and translations; no language column", async ({ page }) => {
  await page.goto("/versions");
  const headers = page.locator("thead th");
  await expect(headers.nth(0)).toHaveText(/Abbreviation/i);
  await expect(headers.nth(1)).toHaveText(/Name/i);
  await expect(page.locator("thead")).not.toContainText(/Language/i);
  await page.getByRole("button", { name: /^Translations/ }).click();
  const rows = page.locator("tbody tr:has(td)");
  await expect(rows).toHaveCount(13); // twelve languages; Chinese has two (the Union Version and the World Chinese Bible)
  for (const language of TRANSLATION_LANGUAGES) await expect(page.locator("tbody")).toContainText(language);
  await page.getByRole("button", { name: /^All/ }).click();
  await expect(page.locator("tbody > tr > th[colspan]").first()).toHaveText(/English/);
});

test("library versions list: the three groups, with the translations under their languages", async ({ page }) => {
  await page.goto("/library");
  const list = page.locator("section[aria-labelledby=versions-title]");
  await expect(list.locator("h3")).toHaveCount(3);
  await list.getByRole("button", { name: /^Translations/ }).click();
  await expect(list.locator("h3")).toHaveCount(1);
  await expect(list.locator("h4")).toHaveText(TRANSLATION_LANGUAGES);
  await expect(list.getByRole("link", { name: /LSG.*Louis Segond 1910/ })).toBeVisible();
});

test("translations: Arabic reads right to left, Chinese search finds 神 across the respectful space", async ({ page }) => {
  await page.goto("/read/svd/JHN/3");
  await expect(page.locator('.scripture[dir="rtl"]')).toBeVisible();
  await page.goto("/search?q=%E7%9A%84%E7%A5%9E&in=cuv");
  await expect(page.getByText(/verses? contains?/)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("mark").first()).toBeVisible();
});

test("side by side: the Chinese joined verse Genesis 24:29-30 lines up with the KJV's 29 and 30", async ({ page }) => {
  await page.goto("/read/kjv/GEN/24?with=cuv");
  await expect(page.getByText("joined with verse 29-30 above")).toBeVisible();
});

test("more languages: Persian reads right to left; Hindi carries its licence credit and no typed-in references", async ({ page }) => {
  await page.goto("/read/opv/JHN/3");
  await expect(page.locator(".scripture")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".scripture")).toContainText("زیرا خدا جهان را اینقدر محبت نمود");
  await expect(page.getByTestId("text-credit")).toHaveCount(0); // public domain: no credit line
  await page.goto("/read/irv/GEN/1");
  await expect(page.locator(".scripture")).toContainText("आदि में परमेश्वर ने आकाश और पृथ्वी की सृष्टि की");
  await expect(page.locator(".scripture")).not.toContainText("इब्रा. 1:10"); // the study edition's reference is a footnote now
  const credit = page.getByTestId("text-credit");
  await expect(credit).toContainText("Bridge Connectivity Solutions");
  await expect(credit.getByRole("link", { name: "CC BY-SA 4.0" })).toHaveAttribute("href", "https://creativecommons.org/licenses/by-sa/4.0/");
});

test("more languages: the Russian Synodal numbers verses its own way, so cross-references point to the KJV", async ({ page }) => {
  await page.goto("/read/syn/PSA/23");
  await expect(page.locator(".scripture")).toContainText("Господь");
  await page.locator(".scripture [data-verse]").first().click();
  await expect(page.getByText(/numbers verses differently \(Russian Synodal\)/)).toBeVisible();
});
