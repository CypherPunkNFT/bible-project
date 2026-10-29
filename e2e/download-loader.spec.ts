import { expect, test, type Page } from "@playwright/test";

// Slow downloads show the book loader with a percentage, then "Done" (owner, 2026-10-29). The complete catalogue
// link keeps its own address (served as the joined zip in production) and only a plain click is run in the page.
// Run: node node_modules/@playwright/test/cli.js test -c e2e/virtual-lists.config.ts download-loader.spec.ts

const PARTS = "**/content/scholar-population/scholars-library-export.part-*.bin";
const link = (page: Page) => page.getByRole("link", { name: "Download complete catalogue" });

test.beforeEach(async ({ page }) => {
  await page.goto("/teachers/scholars#catalogue");
  await expect(async () => {
    await page.locator("#catalogue").scrollIntoViewIfNeeded();
    await expect(link(page)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 90_000 });
});

test("the catalogue link keeps its address, and a plain click shows the loader, a percentage and Done", async ({ page }) => {
  await expect(link(page)).toHaveAttribute("href", "/content/scholar-population/scholars-library-export.zip");
  await expect(link(page)).toHaveAttribute("download", "");
  // Each part held back a moment, so the download is slow enough to show the panel.
  await page.route(PARTS, async route => { await new Promise(r => setTimeout(r, 700)); await route.continue(); });
  const download = page.waitForEvent("download", { timeout: 60_000 });
  await link(page).click();
  const panel = page.locator(".dl-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".bl")).toBeVisible();
  await expect(panel.getByRole("progressbar")).toHaveText(/^(\d{1,2}%|Downloading…)$/);
  await expect(panel.getByRole("progressbar")).toHaveText(/^[1-9]\d?%$/, { timeout: 30_000 });
  expect((await download).suggestedFilename()).toBe("scholars-library-export.zip");
  await expect(panel.getByRole("progressbar")).toHaveText("Done");
  await expect(panel).toBeHidden({ timeout: 5_000 });
  // Nothing in the panel took focus.
  expect(await page.evaluate(() => !!document.activeElement?.closest(".dl-panel"))).toBe(false);
});

test("a second click while it runs starts nothing more", async ({ page }) => {
  await page.route(PARTS, async route => { await new Promise(r => setTimeout(r, 700)); await route.continue(); });
  let downloads = 0;
  page.on("download", () => { downloads++; });
  const first = page.waitForEvent("download", { timeout: 60_000 });
  await link(page).click();
  await link(page).click();
  await first;
  await page.waitForTimeout(1_500);
  expect(downloads).toBe(1);
});

test("a part that fails its check is reported and not downloaded another way", async ({ page }) => {
  await page.route(PARTS, async route => {
    const response = await route.fetch();
    const body = Buffer.from(await response.body());
    body[0] ^= 0xff;
    await route.fulfill({ response, body });
  });
  let downloads = 0;
  page.on("download", () => { downloads++; });
  await link(page).click();
  await expect(page.locator(".cat-coverage [role=alert]")).toContainText("Export integrity check failed");
  await page.waitForTimeout(1_000);
  expect(downloads).toBe(0);
  await expect(page.locator(".dl-panel")).toHaveCount(0);
});

test("when a part cannot be fetched, the link's own address is downloaded instead", async ({ page }) => {
  await page.route(PARTS, route => route.fulfill({ status: 503, body: "unavailable" }));
  const download = page.waitForEvent("download", { timeout: 60_000 });
  await link(page).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("scholars-library-export.zip");
  expect(file.url()).toMatch(/\/content\/scholar-population\/scholars-library-export\.zip$/);
});

test("a click with a modifier key is left to the browser", async ({ page }) => {
  const prevented = await link(page).evaluate((a: HTMLAnchorElement) => {
    let seen: boolean | null = null;
    // Listen after React's handler; stop the browser acting on the test click.
    const after = (e: Event) => { seen = e.defaultPrevented; e.preventDefault(); };
    document.addEventListener("click", after, { once: true });
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    return seen;
  });
  expect(prevented).toBe(false);
  await expect(page.locator(".dl-panel")).toHaveCount(0);
});
