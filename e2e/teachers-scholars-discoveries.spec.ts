import { expect, test, type Page } from "@playwright/test";

// Scholars · 03 The discoveries (approved mock-up: design/scholars-directions/scholars/discoveries.js): the seven finds
// in date order beside a map of the Holy Land and Sinai that flies to the chosen one. Each card carries its "from the dig
// to your screen" thread (who found or studied it → what came of it → where it reaches this site, or "Not used on this
// site yet"). Ramsay's find lies beyond that map: an edge marker points to it and choosing it switches to the wider map.
// A chain of names closes the section, lighting the names the chosen find passes through. From 901px the map is on the
// LEFT and the finds on the right (the owner's fix); below, the map sits on top and the finds are swipe cards.

const ADDRESS = "/teachers/scholars";

async function openDiscoveries(page: Page) {
  await page.goto(ADDRESS);
  const section = page.locator("section#discoveries");
  await expect(section.getByRole("heading", { level: 2 })).toContainText("Seven discoveries", { timeout: 20_000 });
  await section.locator(".dsc-mapcard").scrollIntoViewIfNeeded();
  return section;
}
const viewBox = (page: Page, view: string) => page.locator(`section#discoveries .dsc-stage[data-view="${view}"] svg.dsc-land`).getAttribute("viewBox");

test("the seven finds are listed in date order after the All 7 card, which is chosen first", async ({ page }) => {
  const section = await openDiscoveries(page);
  const cards = section.locator(".dsc-find");
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toHaveClass(/dsc-on/);
  await expect(cards.first()).toContainText("1838–1963");
  await expect(cards.first()).toContainText("All 7");
  await expect(cards.first()).toContainText("Six lie in the Holy Land and Sinai; Ramsay's lies beyond this map, at Pisidian Antioch.");
  await expect(cards.first()).toContainText("Two reach this site's Letters study: Codex Sinaiticus, through Westcott; Paul's roads in Asia Minor, through Ramsay.");
  const years = (await section.locator(".dsc-find:not(.dsc-find-all) .dsc-year").allTextContents()).map(Number);
  expect(years).toEqual([...years].sort((a, b) => a - b));
  expect(years[0]).toBe(1838);
  expect(years.at(-1)).toBe(1963);
  // The year line has a point per find and its two ends.
  await expect(section.locator(".dsc-rail-pt")).toHaveCount(7);
  await expect(section.locator(".dsc-rail-end")).toHaveText(["1838", "1963"]);
});

test("each card follows its find from the dig to this site, or says plainly it is not used yet", async ({ page }) => {
  const section = await openDiscoveries(page);
  const sinaiticus = section.locator(".dsc-find").filter({ hasText: "Codex Sinaiticus" }).filter({ hasText: "1859" });
  await expect(sinaiticus.locator(".dsc-step-k")).toHaveText(["Found or studied by", "What came of it", "Next in the chain of the text", "Where it reaches this site"]);
  await expect(sinaiticus.locator(".dsc-chip")).toHaveCount(2);
  await expect(sinaiticus.getByRole("link", { name: "Letters study" })).toHaveAttribute("href", "/study/letters");
  const ramsay = section.locator(".dsc-find:not(.dsc-find-all)").filter({ hasText: "Paul's roads in Asia Minor" });
  await expect(ramsay.locator(".dsc-where")).toContainText("beyond this map");
  await expect(ramsay.getByRole("link", { name: "Letters study" })).toBeVisible();
  // The other five are not used on this site yet.
  await expect(section.locator(".dsc-step-none")).toHaveCount(5);
  await expect(section.locator(".dsc-step-none").first()).toContainText("Not used on this site yet.");
});

test("the map is on the left from 901px, and above the finds below that", async ({ page }) => {
  const section = await openDiscoveries(page);
  const map = await section.locator(".dsc-mapcard").boundingBox();
  const list = await section.locator(".dsc-list-wrap").boundingBox();
  expect(map && list).toBeTruthy();
  if (!map || !list) return;
  if ((page.viewportSize()?.width ?? 0) >= 901) expect(map.x + map.width).toBeLessThanOrEqual(list.x + 1);
  else expect(map.y + map.height).toBeLessThanOrEqual(list.y + 1);
  // The land is one outline whose holes (the Dead Sea, the Sea of Galilee) read as water.
  await expect(section.locator("#tp-dsc-land-holyland")).toHaveAttribute("fill-rule", "evenodd");
  await expect(section.locator('.dsc-stage[data-view="holyland"] .dsc-mk-sea')).toHaveText(["Mediterranean Sea", "Sinai", "Dead Sea", "Sea of Galilee"]);
});

test("choosing a find flies the map to it and lights the names its thread passes through", async ({ page }) => {
  const section = await openDiscoveries(page);
  const before = await viewBox(page, "holyland");
  await section.getByRole("button", { name: "Show Codex Sinaiticus on the map" }).click({ position: { x: 24, y: 24 } }); // the card's corner: its middle holds the name buttons
  await expect(section.locator(".dsc-find").filter({ hasText: "St Catherine's Monastery" })).toHaveClass(/dsc-on/);
  await expect.poll(() => viewBox(page, "holyland")).not.toBe(before);
  await expect(section.locator(`.dsc-stage[data-view="holyland"] .dsc-mk-find.dsc-on`)).toHaveAttribute("aria-label", "Codex Sinaiticus, 1859");
  await expect(section.locator(".dsc-rail-now")).toHaveText("1859");
  await expect(section.locator(".dsc-chain button.dsc-hl")).toHaveText(["Tischendorf", "Westcott"]);
  // A point on the year line chooses its find too.
  await section.getByRole("button", { name: "1963, Masada" }).click();
  await expect(section.locator(".dsc-rail-now")).toHaveText("1963");
  await expect(section.locator(".dsc-chain button.dsc-hl")).toHaveCount(0);
});

test("the edge marker leads to Ramsay's find on the wider map, and the switch leads back", async ({ page }) => {
  const section = await openDiscoveries(page);
  const edge = section.locator(".dsc-edge");
  await expect(edge).toContainText("Pisidian Antioch");
  await edge.click();
  await expect(section.getByRole("button", { name: "Wider map" })).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator('.dsc-stage[data-view="med"]')).toHaveClass(/dsc-on-stage/);
  await expect(edge).toBeHidden();
  await expect(section.locator(".dsc-find:not(.dsc-find-all)").filter({ hasText: "Paul's roads in Asia Minor" })).toHaveClass(/dsc-on/);
  await section.getByRole("button", { name: "Holy Land & Sinai" }).click();
  await expect(section.getByRole("button", { name: "Holy Land & Sinai" })).toHaveAttribute("aria-pressed", "true");
  await expect(edge).toBeVisible();
});

test("scrolling the finds chooses the card under the reading line", async ({ page }) => {
  const section = await openDiscoveries(page);
  await section.locator(".dsc-list").evaluate((list) => {
    const card = list.querySelectorAll<HTMLElement>(".dsc-find")[7];
    if (getComputedStyle(list).flexDirection === "row") list.scrollTo({ left: card.offsetLeft - list.clientWidth / 2 + card.offsetWidth / 2 });
    else list.scrollTo({ top: card.offsetTop - 20 });
  });
  await expect(section.locator(".dsc-find").last()).toHaveClass(/dsc-on/);
  await expect(section.locator(`.dsc-stage[data-view="holyland"] .dsc-mk-find.dsc-on`)).toHaveAttribute("aria-label", "Masada, 1963");
});

test("a name opens the scholar's profile", async ({ page }) => {
  const section = await openDiscoveries(page);
  await section.locator(".dsc-chain").getByRole("button", { name: "Tischendorf" }).click();
  await expect(page.getByRole("dialog")).toContainText("Tischendorf");
});

test("no sideways scroll", async ({ page }) => {
  await openDiscoveries(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
