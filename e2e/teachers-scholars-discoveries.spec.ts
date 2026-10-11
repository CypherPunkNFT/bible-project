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
  await expect(cards.first()).toContainText("Six locations appear on the Holy Land and Sinai map; Asia Minor appears on the wider map.");
  await expect(cards.first()).toContainText("Two cards include checked links to existing study passages.");
  const years = (await section.locator(".dsc-find:not(.dsc-find-all) .dsc-year").allTextContents()).map(text => Number(text.match(/\d{4}/)?.[0]));
  expect(years).toEqual([...years].sort((a, b) => a - b));
  expect(years[0]).toBe(1838);
  expect(years.at(-1)).toBe(1963);
  // The year line has a point per find and its two ends.
  await expect(section.locator(".dsc-rail-pt")).toHaveCount(7);
  await expect(section.locator(".dsc-rail-end")).toHaveText(["1838", "1963"]);
});

test("case studies distinguish historical evidence from checked site connections", async ({ page }) => {
  const section = await openDiscoveries(page);
  const cards = section.locator(".dsc-find:not(.dsc-find-all)");
  await expect(cards).toHaveCount(7);
  for (const card of await cards.all()) {
    expect(await card.locator(".dsc-evidence-links a").count()).toBeGreaterThan(0);
    await expect(card.locator(".dsc-chip")).toHaveCount(1);
  }
  const sinaiticus = cards.filter({ hasText: "Codex Sinaiticus" });
  await expect(sinaiticus).toContainText("1844 and 1859");
  await expect(sinaiticus).toContainText("ownership history remain disputed");
  await expect(sinaiticus.getByRole("link", { name: "Letters study", exact: true })).toHaveAttribute("href", "/study/letters");
  await expect(sinaiticus.locator(".dsc-evidence-source")).toContainText("History of the Canon");
  const ramsay = cards.filter({ hasText: "Paul's roads in Asia Minor" });
  await expect(ramsay).toContainText("From 1880");
  await expect(ramsay.getByRole("link", { name: "Paul's letters", exact: true })).toHaveAttribute("href", "/study/letters/paul");
  await expect(cards.filter({ hasText: "Dead Sea Scrolls" })).toContainText("not the original finder");
  await expect(section.locator(".dsc-step-none")).toHaveCount(5);
  await expect(section).not.toContainText("Not used on this site yet");
  await expect(section).not.toContainText("planned");
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
  await expect(section.locator(".dsc-chain button.dsc-hl")).toHaveText(["Tischendorf"]);
  // A point on the year line chooses its find too.
  await section.getByRole("button", { name: "1963, Masada" }).click();
  await expect(section.locator(".dsc-rail-now")).toHaveText("1963");
  await expect(section.locator(".dsc-chain button.dsc-hl")).toHaveText(["Yadin"]);
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
