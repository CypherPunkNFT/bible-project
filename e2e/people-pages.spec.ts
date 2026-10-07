import { expect, test, type Page } from "@playwright/test";

// Ruler and apostle pages (/people/:id/rule, /people/:id/mission) and their two guides on Study → People
// (Research/People/PRESENTATION.md). Runs at desktop, tablet and phone.

const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

test("people pages: the person page's entry card opens the reign, and the switch goes back", async ({ page }) => {
  await page.goto("/people/david-rut-4-17");
  await expect(page.getByRole("heading", { name: "David", level: 1 })).toBeVisible();
  await expect(page.getByText("Description adapted by STEP Bible from AI output")).toBeVisible();
  await page.locator(".pp-entry").click();
  await expect(page).toHaveURL(/\/people\/david-rut-4-17\/rule$/);
  await expect(page.locator("#pp-hero-title")).toContainText("David.");
  await expect(page.getByRole("navigation", { name: "Pages about David" }).getByRole("link", { name: "The reign" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#pp-verdict")).toBeVisible();
  await page.getByRole("navigation", { name: "Pages about David" }).getByRole("link", { name: "The person" }).click();
  await expect(page).toHaveURL(/\/people\/david-rut-4-17$/);
  await expect(page.locator(".pp-entry")).toBeVisible();
});

test("people pages: the switch keeps the way back to the guide the reader came from", async ({ page }) => {
  await page.goto("/study/people?view=rulers");
  await page.locator(".rg-card a", { hasText: "Asa" }).first().click();
  await expect(page).toHaveURL(/\/people\/asa-1ki-15-8\/rule$/);
  await expect(page.getByRole("link", { name: "Back to Rulers through time" })).toBeVisible();
  await page.getByRole("navigation", { name: "Pages about Asa" }).getByRole("link", { name: "The person" }).click();
  await expect(page).toHaveURL(/\/people\/asa-1ki-15-8$/);
  await expect(page.getByRole("link", { name: "Back to Rulers through time" })).toBeVisible();
});

test("people pages: /study/rulers opens the rulers guide with its lanes", async ({ page }, info) => {
  await page.goto("/study/rulers");
  await expect(page).toHaveURL(/\/study\/people\?view=rulers$/);
  await expect(page.getByRole("heading", { name: /Thrones through/ })).toBeVisible();
  if (info.project.name === "phone") {
    await expect(page.locator(".rg-vbar").first()).toBeVisible();
    expect(await page.locator(".rg-vbar").count()).toBeGreaterThan(40);
  } else {
    expect(await page.locator(".rg-bar").count()).toBeGreaterThan(40);
    for (const lane of ["Leaders & judges", "United kingdom", "Israel", "Judah"]) await expect(page.locator(".rg-lane-names span", { hasText: lane })).toHaveCount(1);
    await page.getByRole("button", { name: "Show the prophets" }).click();
    await expect(page.locator(".rg-medal").first()).toBeAttached();
  }
  await expect(page.locator(".rg-preview")).toBeVisible();
  await noSideScroll(page);
});

test("people pages: /study/apostles shows the Twelve and opens a preview in place", async ({ page }) => {
  await page.goto("/study/apostles");
  await expect(page).toHaveURL(/\/study\/people\?view=apostles$/);
  await expect(page.getByRole("heading", { name: /The Twelve, and one/ })).toBeVisible();
  expect(await page.locator(".ag-medal").count()).toBeGreaterThanOrEqual(13);
  await page.getByRole("button", { name: /^Peter:/ }).click();
  await expect(page.getByRole("link", { name: /Open his mission/ })).toBeVisible();
  await page.getByRole("link", { name: /Open his mission/ }).click();
  await expect(page).toHaveURL(/\/people\/peter-mat-4-18\/mission$/);
  await expect(page.locator("#pp-ending")).toBeVisible();
  await noSideScroll(page);
});

test("people pages: an address with no such page goes back to the person", async ({ page }) => {
  await page.goto("/people/abel-gen-4-2/rule");
  await expect(page).toHaveURL(/\/people\/abel-gen-4-2$/);
});

test("people pages: no page scrolls sideways", async ({ page }) => {
  for (const path of ["/people/david-rut-4-17", "/people/asa-1ki-15-8/rule", "/people/deborah-jdg-4-4/rule", "/people/athaliah-2ki-8-26/rule", "/people/paul-act-7-58/mission", "/people/judas-mat-10-3/mission"]) {
    await page.goto(path);
    await expect(page.locator(".pp-page, .pp-entry, #person-name").first()).toBeVisible();
    await noSideScroll(page);
  }
});
