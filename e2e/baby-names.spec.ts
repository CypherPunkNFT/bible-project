// Biblical baby names in a real browser (docs/features/baby-names/design.md 7.2, "Playwright"): the long list keeps
// drawing rows as the visitor scrolls, with no button; a name page links on to the person's own page.
// Not part of `npm test`; run by hand: npx playwright test e2e/baby-names.spec.ts --project=desktop
import { expect, test } from "@playwright/test";

test.describe("baby names", () => {
  test("search, empty results and filters retain a usable narrow layout", async ({ page }) => {
    await page.goto("/baby-names");
    const search = page.getByRole("searchbox", { name: "Search names" });
    await search.fill("Hannah");
    await expect(page.locator(".bn-row-name")).toHaveText(["Hannah"]);
    await search.fill("zzzznotaname");
    await expect(page.getByText("No names match all of these. Remove a filter:")).toBeVisible();
    await search.fill("");
    await page.getByRole("group", { name: "Gender in the Bible" }).getByRole("button", { name: "Both", exact: true }).click();
    await expect(page.locator(".bn-row-name").filter({ hasText: /^Noah$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Both", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("aliases, uncertain meanings, both Noahs and short-page indexing are preserved", async ({ page }) => {
    await page.goto("/baby-names/Elias");
    await expect(page).toHaveURL(/\/baby-names\/elijah$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Elijah");
    await page.goto("/baby-names/mary");
    await expect(page.locator(".bn-headline")).toContainText("Meaning uncertain");
    await page.goto("/baby-names/noah");
    await expect(page.locator(".bn-meaning")).toHaveCount(2);
    await expect(page.locator(".bn-facts")).toContainText("Boy's and girl's name");
    await page.screenshot({ path: test.info().outputPath("noah.png"), fullPage: true });
    await page.goto("/baby-names/abagtha");
    await expect(page.locator('meta[name="robots"][content="noindex,follow"]')).toHaveCount(1);
    await page.goto("/baby-names/hannah");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hannah");
    await expect(page.locator('meta[name="robots"][content="noindex,follow"]')).toHaveCount(0);
  });

  test("boy and girl pages, dark mode and 320px keep readable rows", async ({ page }) => {
    await page.goto("/baby-names/boys");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Biblical Boy Names");
    await expect(page.locator(".bn-row").first()).toBeVisible();
    await page.goto("/baby-names/girls");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Biblical Girl Names");
    await page.setViewportSize({ width: 320, height: 760 });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(page.locator(".bn-row").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("the full list keeps appearing as the visitor scrolls, with no load-more button", async ({ page }) => {
    await page.goto("/baby-names?show=all");
    const rows = page.locator(".bn-row");
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    const lastIndex = async () => Number(await rows.last().getAttribute("data-row"));
    const before = await lastIndex();
    for (let step = 0; step < 6; step++) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(150);
    }
    await expect.poll(lastIndex).toBeGreaterThan(before + 40);
    await expect(page.getByRole("button", { name: /load more|show more/i })).toHaveCount(0);
  });

  test("hand-checked meanings show their sources, and foreign names and site-added people are right", async ({ page }) => {
    await page.goto("/baby-names/esther");
    await expect(page.locator(".bn-headline")).toContainText("“star”");
    await expect(page.locator(".bn-headline")).toContainText("Probable");
    await expect(page.locator(".bn-meaning")).toContainText("Easton's Bible Dictionary (1897)");
    await expect(page.locator(".bn-sources")).toContainText("Also cited: Easton's Illustrated Bible Dictionary (1897), public domain.");
    await page.screenshot({ path: test.info().outputPath("esther.png"), fullPage: true });
    await page.goto("/baby-names/sargon");
    await expect(page.locator(".bn-facts")).toContainText("Hebrew, a foreign name");
    await expect(page.locator(".bn-bearer").first()).toContainText("King of Assyria whose commander took Ashdod");
    await expect(page.getByText(/Sennacherib/)).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath("sargon.png"), fullPage: true });
    await page.goto("/baby-names");
    await page.getByRole("group", { name: "Meaning" }).getByRole("button", { name: "Nature", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search names" }).fill("Deborah");
    await expect(page.locator(".bn-row-name")).toHaveText(["Deborah"]);
    await page.screenshot({ path: test.info().outputPath("nature-filter.png") });
  });

  test("meanings Strong's gives are shown, and inflected theme words reach their filter", async ({ page }) => {
    await page.goto("/baby-names/othniel");
    await expect(page.locator(".bn-headline")).toContainText("“force of God”");
    await expect(page.locator(".bn-headline")).not.toContainText("Meaning uncertain");
    await page.screenshot({ path: test.info().outputPath("othniel.png"), fullPage: true });
    await page.goto("/baby-names/zion");
    await expect(page.locator(".bn-headline")).toContainText("“monumental or guiding pillar”");
    await page.screenshot({ path: test.info().outputPath("zion.png"), fullPage: true });
    await page.goto("/baby-names");
    await page.getByRole("group", { name: "Meaning" }).getByRole("button", { name: "Light", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search names" }).fill("Samson");
    await expect(page.locator(".bn-row-name")).toHaveText(["Samson"]);
    await page.screenshot({ path: test.info().outputPath("light-filter-samson.png") });
  });

  test("a name page shows its meaning and verses and links to the person's page", async ({ page }) => {
    await page.goto("/baby-names/hannah");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hannah: Meaning in the Bible");
    await expect(page.locator(".scripture").first()).toContainText("Hannah", { timeout: 20_000 });
    await page.screenshot({ path: test.info().outputPath("hannah.png"), fullPage: true });
    await page.getByRole("link", { name: "Read Hannah's full story" }).click();
    await expect(page).toHaveURL(/\/people\/hannah-1sa-1-2$/);
    await expect(page.getByRole("link", { name: /The name Hannah: meaning and everyone who bore it/ })).toBeVisible({ timeout: 20_000 });
  });
});
