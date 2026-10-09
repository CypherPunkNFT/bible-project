import { expect, test, type Page } from "@playwright/test";

// Ruler and apostle pages (/people/:id/rule, /people/:id/mission) and their two guides on Study → People
// (Research/People/PRESENTATION.md). Runs at desktop, tablet and phone.

const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

test("people pages: the person page's entry card opens the reign, and the switch goes back", async ({ page }) => {
  await page.goto("/people/david-rut-4-17");
  await expect(page.getByRole("heading", { name: "David", level: 1 })).toBeVisible();
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
  await expect(page).toHaveURL(/\/people\/peter$/);
  await expect(page.getByRole("heading", { name: "Peter", level: 1 })).toBeVisible();
  await noSideScroll(page);
});

test("people pages: an address with no such page goes back to the person", async ({ page }) => {
  await page.goto("/people/abel-gen-4-2/rule");
  await expect(page).toHaveURL(/\/people\/abel-gen-4-2$/);
});

test("people pages: no page scrolls sideways", async ({ page }) => {
  for (const path of ["/people/david-rut-4-17", "/people/asa-1ki-15-8/rule", "/people/deborah-jdg-4-4/rule", "/people/athaliah-2ki-8-26/rule", "/people/paul-act-7-58", "/people/judas-mat-10-3/mission"]) {
    await page.goto(path);
    await expect(page.locator(".pp-page, .ap-page, .pp-entry, #person-name").first()).toBeVisible();
    await noSideScroll(page);
  }
});

// Second release: foreign rulers, governors, the Herods, Rome, queens and the wider circle of the first church.

test("people pages: a foreign king opens with the world stage and Scripture's words, not a regnal verdict", async ({ page }) => {
  await page.goto("/people/nebuchadnezzar-2ki-24-1/rule");
  await expect(page.locator("#pp-hero-title")).toContainText("Nebuchadnezzar.");
  await expect(page.getByRole("navigation", { name: "Pages about Nebuchadnezzar" }).getByRole("link", { name: "The reign" })).toHaveAttribute("aria-current", "page");
  const sections = await page.locator(".pp-jump a").allTextContents();
  expect(sections[0]).toBe("World stage");
  await expect(page.locator("#pp-verdict")).toContainText("What Scripture says of him");
  await expect(page.locator("#pp-nation")).toContainText("Dealings with God's people");
  await expect(page.locator("#pp-accounts")).toContainText("Where the accounts differ");
  await expect(page.locator(".pp-strip-lane-label", { hasText: "Babylon" })).toBeVisible();
  await noSideScroll(page);
});

test("people pages: a governor has a chain of authority from the Persian king", async ({ page }) => {
  await page.goto("/people/nehemiah-neh-1-1/rule");
  await expect(page.locator("#pp-hero-title")).toContainText("Nehemiah.");
  await expect(page.getByRole("navigation", { name: "Pages about Nehemiah" }).getByRole("link", { name: "As governor" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#pp-chain")).toContainText("Artaxerxes");
  await expect(page.locator("#pp-chain [data-here]")).toContainText("Nehemiah");
  await noSideScroll(page);
});

test("people pages: a Herod shows the family strip with himself lit", async ({ page }) => {
  await page.goto("/people/herod-mat-14-1/rule");
  await expect(page.locator("#pp-hero-title")).toContainText("Herod Antipas.");
  await expect(page.locator("#pp-herods [aria-current='page']")).toHaveText("Herod Antipas");
  await expect(page.locator("#pp-herods a")).toHaveCount(5);
  await expect(page.locator("#pp-accounts")).toContainText("Gospels, Acts and Josephus");
  await noSideScroll(page);
});

test("people pages: a Roman governor has his emperor above him, his hearings and one pin at his seat", async ({ page }) => {
  await page.goto("/people/pilate-mat-27-2/rule");
  await expect(page.locator("#pp-hero-title")).toContainText("Pontius Pilate.");
  await expect(page.locator("#pp-chain")).toContainText("Tiberius");
  await expect(page.locator("#pp-events")).toContainText("Trials and hearings");
  await expect(page.locator("#pp-kingdom")).toContainText("The seat");
  await expect(page.locator("#pp-kingdom svg [role='button']")).toHaveCount(1);
  await noSideScroll(page);
});

test("people pages: a queen consort's page and entry card speak of her time as queen", async ({ page }) => {
  await page.goto("/people/esther-est-2-7");
  await expect(page.locator(".pp-entry")).toContainText("Explore her time as queen");
  await page.locator(".pp-entry").click();
  await expect(page).toHaveURL(/\/people\/esther-est-2-7\/rule$/);
  await expect(page.locator(".pp-crumbs")).toContainText("Her time as queen");
  await expect(page.locator("#pp-verdict")).toContainText("What Scripture says of her");
  await noSideScroll(page);
});

test("people pages: an early-church page is a mission page, reached from the person page", async ({ page }) => {
  await page.goto("/people/barnabas-act-4-36");
  await expect(page.locator(".pp-entry")).toContainText("Explore his mission");
  await page.locator(".pp-entry").click();
  await expect(page).toHaveURL(/\/people\/barnabas-act-4-36\/mission$/);
  await expect(page.locator("#pp-hero-title")).toContainText("Barnabas.");
  await expect(page.locator("#pp-ending")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to The apostles" })).toBeVisible();
  await noSideScroll(page);
});

test("people pages: the rulers guide shows the world stage's lanes beside Israel and Judah", async ({ page }, info) => {
  await page.goto("/study/people?view=rulers");
  if (info.project.name === "phone") {
    await expect(page.locator(".rg-vbar[data-world]").first()).toBeVisible();
    for (const name of ["Nebuchadnezzar", "Cyrus", "Pontius Pilate"]) await expect(page.locator(".rg-vbar[data-world]", { hasText: name })).toHaveCount(1);
  } else {
    for (const lane of ["Egypt", "Aram", "Assyria", "Babylon", "Persia", "Herods & Rome", "Israel", "Judah"]) await expect(page.locator(".rg-lane-names span", { hasText: new RegExp(`^${lane}$`) })).toHaveCount(1);
  }
  expect(await page.locator(".rg-bar, .rg-vbar").count()).toBeGreaterThan(100);
  await expect(page.locator(".rg-figures")).toContainText("Governors");
  await noSideScroll(page);
});

test("people pages: the apostles guide has the wider circle, each card opening a mission page", async ({ page }) => {
  await page.goto("/study/people?view=apostles");
  const wider = page.locator("#ag-wider");
  await expect(wider.getByRole("heading", { name: "The wider circle" })).toBeVisible();
  await expect(wider.getByRole("heading", { name: /The Jerusalem church/ })).toBeVisible();
  await expect(wider.getByRole("heading", { name: /Paul's companions/ })).toBeVisible();
  await expect(wider.locator(".rg-card a")).toHaveCount(12);
  await expect(page.locator(".rg-figures")).toContainText("The wider circle");
  await wider.locator(".rg-card a", { hasText: "Barnabas" }).click();
  await expect(page).toHaveURL(/\/people\/barnabas-act-4-36\/mission$/);
  await noSideScroll(page);
});

test("people pages: the new pages never scroll sideways", async ({ page }) => {
  for (const path of ["/people/nebuchadnezzar-2ki-24-1/rule", "/people/pharaoh-gen-37-36/rule", "/people/queen-of-sheba-1ki-10-1/rule", "/people/gedaliah-2ki-25-22/rule",
    "/people/agrippa-act-25-13/rule", "/people/priscilla-act-18-2/mission", "/study/people?view=rulers", "/study/people?view=apostles"]) {
    await page.goto(path);
    await expect(page.locator(".pp-page, .rg").first()).toBeVisible();
    await noSideScroll(page);
  }
});
