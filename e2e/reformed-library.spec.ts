import { expect, test } from "@playwright/test";
import { REFORMED_LIBRARY as library } from "../src/generated/reading-library";

test("Reformed branch connects doctrine, historic authors and the reading path", async ({ page }, testInfo) => {
  await page.goto("/apologetics/topics/reformed");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reformed theology");
  await expect(page.locator(".ap-study-card")).toHaveCount(4);
  await page.getByRole("link", { name: "Follow the Reformed learning path" }).click();
  await expect(page.locator(".ap-path-timeline > li")).toHaveCount(6);
  await page.goto("/apologetics/study/election");
  await expect(page.locator(".ap-citations").first()).toContainText("Westminster");
  await expect(page.getByRole("region", { name: "Historic reading for this question" })).toContainText("A Golden Chain");
  await page.goto("/apologetics/texts");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(library.title);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: testInfo.outputPath("historic-library.png"), fullPage: true });
});

test("historic library filters combine, survive refresh, paginate and recover from no results", async ({ page }) => {
  await page.goto("/apologetics/texts");
  await expect(page.locator(".rf-work")).toHaveCount(12);
  await expect(page.locator(".rf-result-status")).toContainText("46 works");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".rf-pagination")).toContainText("Page 2 of 4");
  await page.getByRole("combobox", { name: "Author", exact: true }).selectOption("author-john-owen");
  await expect(page.locator(".rf-work")).toHaveCount(5);
  await expect(page).not.toHaveURL(/page=/);
  await page.getByRole("combobox", { name: "Subject", exact: true }).selectOption("justification");
  await expect(page.locator(".rf-work")).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Author", exact: true })).toHaveValue("author-john-owen");
  await expect(page.locator(".rf-work h2")).toHaveText("The Doctrine of Justification by Faith");
  await page.getByRole("searchbox", { name: "Search historic texts and authors" }).fill("zzzz-no-result");
  await expect(page.getByRole("heading", { name: "No texts match those filters." })).toBeVisible();
  await page.getByRole("button", { name: "Reset the library" }).click();
  await expect(page.locator(".rf-result-status")).toContainText("46 works");
  await page.getByRole("button", { name: "Authors", exact: true }).click();
  await expect(page.locator(".rf-result-status")).toContainText("30 authors");
  await page.getByRole("searchbox", { name: "Search historic texts and authors" }).fill("Turretin");
  await expect(page.locator(".rf-author-grid article")).toHaveCount(1);
  await page.getByRole("link", { name: "Explore 1 work", exact: true }).click();
  await expect(page.locator(".rf-work")).toContainText("Latin");
  await expect(page.locator(".rf-work")).toContainText("Partial holding");
});

test("historic editions retain their rights limits and downloadable metadata", async ({ page, request }) => {
  await page.goto("/apologetics/texts?author=author-john-calvin");
  await page.getByText("Edition, tradition & reading notes", { exact: true }).click();
  await expect(page.locator(".rf-details")).toContainText("John Murray introduction is excluded");
  await expect(page.locator(".rf-details")).toContainText("United States");
  await expect(page.getByRole("link", { name: /^Read the text\s*:/ })).toHaveAttribute("href", "https://ccel.org/ccel/calvin/institutes/");
  const response = await request.get("/content/apologetics/reformed-reading.json"); expect(response.ok()).toBe(true);
  const corpus = await response.json();
  expect(corpus.records.filter((r: { kind: string }) => r.kind === "work")).toHaveLength(library.works.length);
  expect(corpus.authors).toHaveLength(library.authors.length);
  expect(corpus.records.filter((r: { kind: string }) => r.kind === "asset").every((r: { acquisitionStatus: string; fullTextIndexed: boolean }) => r.acquisitionStatus === "link-only" && !r.fullTextIndexed)).toBe(true);
  expect(corpus.hash).toBe(library.hash);
  const downloading = page.waitForEvent("download");
  await page.getByRole("link", { name: "Reading list · Markdown" }).click();
  const download = await downloading; expect(await download.failure()).toBeNull(); expect(download.suggestedFilename()).toBe("reformed-reading.md");
});

test("reading library remains usable at 320px in both themes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "Small-screen layout check.");
  await page.setViewportSize({ width: 320, height: 844 });
  for (const colorScheme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme });
    for (const route of ["/texts", "/texts?view=authors", "/texts?language=la", "/topics/reformed", "/study/covenant"]) {
      await page.goto("/apologetics" + route);
      await expect(page.locator(".ap-page h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
    }
    await page.goto("/apologetics/texts?language=la");
    await expect(page.locator(".rf-work")).toHaveCount(1);
    await expect(page.locator(".rf-work")).toContainText("Latin");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: testInfo.outputPath("latin-edition-" + colorScheme + ".png"), fullPage: true });
  }
});
