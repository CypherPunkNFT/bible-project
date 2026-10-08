import { expect, test, type Page } from "@playwright/test";

// The apostle pages of the Twelve, Matthias and Paul (their one page, at /people/:id; src/components/apostle-page/), as approved
// in design/apostle-merged/. Runs at desktop, tablet and phone.

const APOSTLES = ["peter-mat-4-18", "andrew-mat-4-18", "james-mat-4-21", "john-mat-4-21", "philip-mat-10-3", "bartholomew-mat-10-3", "thomas-mat-10-3",
  "matthew-mat-9-9", "james-mat-10-3", "judas-mat-10-3", "simon-mat-10-4", "judas-mat-10-4", "matthias-act-1-23", "paul-act-7-58"];
const ready = (page: Page) => page.locator(".ap-page[data-people-ready]");
const counter = (page: Page) => page.locator(".ap-count-btn");
const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

test("apostle pages: the counter reads 1 / 12 on Peter and floats below the header the whole way down", async ({ page }) => {
  await page.goto("/people/peter-mat-4-18");
  await expect(ready(page)).toBeAttached();
  await expect(counter(page)).toContainText("1 / 12"); await expect(counter(page)).toContainText("Peter");
  const header = await page.locator("header").first().boundingBox();
  for (const sec of ["chapters", "places", "questions"]) {
    await page.locator(`[data-sec="${sec}"]`).scrollIntoViewIfNeeded();
    await page.evaluate((s) => { const el = document.querySelector(`[data-sec="${s}"]`)!; scrollTo(0, el.getBoundingClientRect().top + scrollY + 200); }, sec);
    const box = await counter(page).boundingBox();
    expect(box, `the counter is on screen in ${sec}`).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
    expect(box!.y).toBeLessThan(header!.y + header!.height + 60);
  }
});

test("apostle pages: next goes to Andrew (2 / 12); the list reaches Matthias and Paul after the Twelve", async ({ page }) => {
  await page.goto("/people/peter-mat-4-18");
  await expect(ready(page)).toBeAttached();
  await page.getByRole("link", { name: "Next: Andrew" }).click();
  await expect(page).toHaveURL(/\/people\/andrew-mat-4-18$/);
  await expect(counter(page)).toContainText("2 / 12"); await expect(counter(page)).toContainText("Andrew");
  await expect(page.getByRole("heading", { name: "Andrew", level: 1 })).toBeVisible();
  await counter(page).click();
  await page.locator(".ap-count-menu.open").getByRole("link", { name: "Matthias" }).click();
  await expect(page).toHaveURL(/\/people\/matthias-act-1-23$/);
  await expect(counter(page)).toContainText("Chosen by lot");
  await expect(counter(page)).toContainText("Matthias");
  await page.getByRole("link", { name: "Next: Paul" }).click();
  await expect(page).toHaveURL(/\/people\/paul-act-7-58$/);
  await expect(counter(page)).toContainText("Apostle to the Gentiles"); await expect(counter(page)).toContainText("Paul");
});

test("apostle pages: the counter's list opens and moves by keyboard", async ({ page }) => {
  await page.goto("/people/thomas-mat-10-3");
  await expect(ready(page)).toBeAttached();
  await counter(page).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".ap-count-menu.open")).toBeVisible();
  await expect(page.locator(".ap-count-menu a:focus")).toHaveText("Thomas");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".ap-count-menu a:focus")).toHaveText("Matthew");
  await page.keyboard.press("Escape");
  await expect(page.locator(".ap-count-menu.open")).toHaveCount(0);
  await expect(counter(page)).toBeFocused();
});

test("apostle pages: choosing a place card flies the map there", async ({ page }) => {
  await page.goto("/people/peter-mat-4-18");
  await expect(ready(page)).toBeAttached();
  const map = page.locator(".pl-svg");
  await map.scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute("viewBox", /\d/);
  const before = (await map.getAttribute("viewBox"))!.split(" ").map(Number);
  await page.locator(".pcard", { hasText: "Antioch" }).click();
  await expect(page.locator(".pcard.on")).toContainText("Antioch");
  await expect.poll(async () => Number((await map.getAttribute("viewBox"))!.split(" ")[2]), { timeout: 4000 }).toBeLessThan(before[2] * 0.5);
  await expect(page.locator(".pin-g.on text")).toHaveText("Antioch");
});

test("apostle pages: dragging the map selects no text anywhere", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "a mouse drag; touch drags never select");
  await page.goto("/people/peter-mat-4-18");
  await expect(ready(page)).toBeAttached();
  const map = page.locator(".pl-svg");
  await map.scrollIntoViewIfNeeded();
  // The map at its full frame cannot move further; choose a place first so there is room to drag.
  await page.locator(".pcard", { hasText: "Capernaum" }).click();
  await expect(page.locator(".pin-g.on")).toHaveCount(1);
  await page.waitForTimeout(300);
  const box = (await map.boundingBox())!;
  const viewBox = await map.getAttribute("viewBox");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Across the cards and the section's words, and back.
  for (const [x, y] of [[box.x + 40, box.y + 60], [box.x - 300, box.y - 120], [20, box.y - 200], [box.x + 60, box.y + 90]]) await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => getSelection()?.toString() ?? "")).toBe("");
  expect(await map.getAttribute("viewBox")).not.toBe(viewBox);
});

test("apostle pages: no sideways scroll at 400 px", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 });
  for (const id of ["peter-mat-4-18", "thomas-mat-10-3", "judas-mat-10-4", "matthias-act-1-23", "paul-act-7-58"]) {
    await page.goto(`/people/${id}`);
    await expect(ready(page)).toBeAttached();
    await noSideScroll(page);
  }
});

test("apostle pages: all fourteen load with no console errors", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(`${page.url()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
  for (const id of APOSTLES) {
    await page.goto(`/people/${id}`);
    await expect(ready(page)).toBeAttached();
    await expect(page.locator("h1")).toBeVisible();
    for (const sec of ["ring", "grid", "chapters", "with", "accounts", "places", "questions"]) await expect(page.locator(`[data-sec="${sec}"]`)).toBeAttached();
  }
  expect(errors).toEqual([]);
});

test("apostle pages: the person's address is the apostle page itself, with no person | mission switch", async ({ page }) => {
  await page.goto("/people/thomas-mat-10-3");
  await expect(page.getByRole("heading", { name: "Thomas", level: 1 })).toBeVisible();
  await expect(page.locator('[data-sec="ring"]')).toBeAttached();
  await expect(page.getByRole("navigation", { name: "Pages about Thomas" })).toHaveCount(0);
  await expect(page.locator(".pp-entry")).toHaveCount(0);
  // the old address forwards to the one page
  await page.goto("/people/thomas-mat-10-3/mission");
  await expect(page).toHaveURL(/\/people\/thomas-mat-10-3$/);
  await expect(page.getByRole("heading", { name: "Thomas", level: 1 })).toBeVisible();
});
