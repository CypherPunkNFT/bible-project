import { expect, test, type Page } from "@playwright/test";

// Preachers & authors (2026-10-08 port of design/authors-directions/teachers/): the landing's arc and search, the shared
// profile drawer, "Same year, different worlds" and the directory. Counts come from the page's own data (people.json),
// so these checks hold when the data grows.

const ADDRESS = "/teachers/preachers-and-authors";

async function openPage(page: Page) {
  await page.goto(ADDRESS);
  await expect(page.locator(".tp-sec-landing .lnd-mark").first()).toBeVisible();
}

const drawer = (page: Page) => page.getByRole("dialog", { name: "Teacher profile" });

test("the landing shows every teacher on the arc, the figures, jump links and works to start reading", async ({ page }) => {
  await openPage(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Five Centuries ofbiblical teachers");
  const marks = page.locator(".tp-sec-landing .lnd-mark");
  const total = await marks.count();
  expect(total).toBeGreaterThan(40);
  await expect(page.locator(".lnd-figs dd").first()).toHaveText(String(total));
  await expect(page.locator(".lnd-axis span", { hasText: "1500" })).toHaveCount(1);
  // Every mark sits inside the band.
  const band = await page.locator(".lnd-band").boundingBox();
  for (const box of await marks.evaluateAll((all) => all.map((m) => m.getBoundingClientRect().toJSON() as DOMRect))) {
    expect(box.left).toBeGreaterThanOrEqual((band?.x ?? 0) - 1);
    expect(box.right).toBeLessThanOrEqual((band?.x ?? 0) + (band?.width ?? 0) + 1);
  }
  const jumps = page.getByRole("navigation", { name: "On this page" }).getByRole("link");
  await expect(jumps).toHaveCount(4);
  await jumps.filter({ hasText: "Everyone" }).click();
  await expect(page).toHaveURL(/#directory$/);
  await expect(page.locator(".lnd-read h3 a").first()).toHaveAttribute("target", "_blank");
  await expect(page.locator(".lnd-read h3 a").first()).toHaveAttribute("href", /^\/teachers\/works\//);
});

test("the landing search finds teachers by name and by town, and opens one", async ({ page }) => {
  await openPage(page);
  const box = page.getByRole("searchbox", { name: "Find a teacher or a city" });
  await box.fill("Geneva");
  const list = page.getByRole("listbox", { name: "Matching teachers" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("option").first()).toContainText("lived in Geneva");
  expect(await page.locator(".lnd-mark.lnd-match").count()).toBeGreaterThan(0);
  await box.fill("zzzz");
  await expect(list).toContainText("No teacher or town matches");
  await box.fill("Spurgeon");
  await box.press("Enter");
  await expect(drawer(page)).toBeVisible();
  await expect(drawer(page).getByRole("heading", { level: 2 })).toHaveText("Charles Haddon Spurgeon");
  await page.keyboard.press("Escape");
  await expect(drawer(page)).toBeHidden();
  await expect(box).toBeFocused();
});

test("the profile drawer opens above the site header, walks the teachers and returns focus", async ({ page }) => {
  await openPage(page);
  const mark = page.getByRole("button", { name: /^Charles Haddon Spurgeon,/ });
  await mark.click();
  const panel = drawer(page);
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Close profile" })).toBeFocused();
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText("Charles Haddon Spurgeon");
  // Nothing on the page (the sticky site header included) sits over the panel's top corner.
  await page.waitForTimeout(600);
  const onTop = await page.evaluate(() => {
    const hit = document.elementFromPoint(innerWidth - 12, 12);
    return Boolean(hit?.closest(".drw-panel"));
  });
  expect(onTop).toBe(true);
  await expect(panel.getByRole("img", { name: /Map of the places Spurgeon lived/ })).toBeVisible();
  await expect(panel.locator(".drw-read").first()).toHaveAttribute("target", "_blank");
  const count = panel.locator(".drw-count");
  const before = await count.textContent();
  await panel.getByRole("button", { name: "Next teacher" }).click();
  await expect(count).not.toHaveText(before ?? "");
  await page.keyboard.press("ArrowLeft");
  await expect(count).toHaveText(before ?? "");
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText("Charles Haddon Spurgeon");
  // "Who they knew" opens the other person in place.
  const knew = panel.locator(".drw-links button").first();
  const other = (await knew.locator("b").textContent()) ?? "";
  await knew.click();
  await expect(panel.getByRole("heading", { level: 2 })).toHaveText(other);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(mark).toBeFocused();
});

test("the scrim closes the drawer where it shows beside the panel", async ({ page }) => {
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width < 640, "on a phone the panel fills the screen");
  await openPage(page);
  await page.locator(".lnd-mark").first().click();
  await expect(drawer(page)).toBeVisible();
  await page.mouse.click(20, 400);
  await expect(drawer(page)).toBeHidden();
});

test("same year, different worlds follows the presets, the steps and the slider", async ({ page }) => {
  await openPage(page);
  const section = page.locator("#sameyear");
  await section.scrollIntoViewIfNeeded();
  const year = section.locator("output.yr-big");
  await expect(year).toHaveText("1650");
  await section.getByRole("button", { name: /^1740/ }).click();
  await expect(year).toHaveText("1740");
  await expect(section.getByRole("button", { name: /^1740/ })).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator(".yr-sum")).toContainText(/were alive, in \d+ place/);
  await section.getByRole("button", { name: "Ten years later" }).click();
  await expect(year).toHaveText("1750");
  await section.getByRole("slider", { name: "Year" }).fill("1900");
  await expect(year).toHaveText("1900");
  expect(await section.locator(".yr-card").count()).toBeGreaterThan(0);
  await section.locator(".yr-card li button").first().click();
  await expect(drawer(page)).toBeVisible();
});

test("the directory groups everyone by where they served, with search and family chips", async ({ page }) => {
  await openPage(page);
  const section = page.locator("#directory");
  await section.scrollIntoViewIfNeeded();
  const total = await page.locator(".tp-sec-landing .lnd-mark").count();
  const status = section.getByRole("status");
  await expect(status).toHaveText(`${total} of ${total} teachers`);
  await expect(section.locator(".dir-group li")).toHaveCount(total);
  await expect(section.getByRole("heading", { level: 3, name: /England/ })).toBeVisible();
  await expect(section.locator(".dir-wk").first()).toContainText(/works?|no works yet/);
  await section.getByRole("group", { name: "Family" }).getByRole("button", { name: "Baptists" }).click();
  await expect(section.getByRole("button", { name: /Charles Haddon Spurgeon/ })).toBeVisible();
  await expect(section.getByRole("button", { name: /John Calvin/ })).toHaveCount(0);
  await section.getByRole("group", { name: "Family" }).getByRole("button", { name: "Baptists" }).click();
  await section.getByRole("searchbox", { name: "Find a name or a town" }).fill("Geneva");
  await expect(section.getByRole("button", { name: /John Calvin/ })).toBeVisible();
  await section.getByRole("searchbox", { name: "Find a name or a town" }).fill("zzzz");
  await expect(section.locator(".dir-empty")).toContainText("No one matches");
  await expect(status).toHaveText(`0 of ${total} teachers`);
});

test("no sideways scroll, with the drawer shut or open", async ({ page }) => {
  await openPage(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.locator(".lnd-mark").first().click();
  await expect(drawer(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
