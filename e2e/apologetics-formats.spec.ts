import { expect, test } from "@playwright/test";
import { STUDIES } from "../src/data/apologetics-library";

// The reading page of each article format (plan APOLOGETICS-FIELDS step 6), drawn from its first real article, the
// Jesus & resurrection samples. Questions answered has no published article yet (its first is job 10.5); its page is
// proven by src/components/apologetics/StudyFormats.test.tsx.
const SAMPLES: [string, string, (page: import("@playwright/test").Page) => Promise<void>][] = [
  ["resurrection-case", "essay", async (page) => { await expect(page.getByRole("navigation", { name: "Parts of this essay" })).toBeVisible(); }],
  ["penal-substitution-objections", "objections", async (page) => { expect(await page.locator(".fx-objections > li").count()).toBeGreaterThanOrEqual(5); }],
  ["easter-alternatives", "debate-guide", async (page) => { await expect(page.locator("#common")).toBeVisible(); expect(await page.locator(".fx-view").count()).toBeGreaterThanOrEqual(2); }],
  ["atonement-timeline", "timeline", async (page) => { expect(await page.locator(".fx-events > li").count()).toBeGreaterThanOrEqual(12); }],
  ["hume-miracles", "figure", async (page) => { await expect(page.locator(".fx-figure-card h2")).toHaveText("David Hume"); await expect(page.locator("#works")).toBeVisible(); }],
  ["jesus-outside-nt", "reading", async (page) => { await expect(page.locator(".fx-extract blockquote").first()).toHaveAttribute("translate", "no"); }],
  ["titles-of-jesus", "glossary", async (page) => { expect(await page.locator(".fx-terms > div").count()).toBeGreaterThanOrEqual(25); }],
  ["reading-craig-ehrman", "case-study", async (page) => { expect(await page.locator(".fx-steps > li").count()).toBeGreaterThanOrEqual(4); await expect(page.locator(".fx-note#limit")).toBeVisible(); }],
];

for (const theme of ["light", "dark"] as const) {
  test(`apologetics formats: each sample article reads in its own format (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [id, format, check] of SAMPLES) {
      expect(STUDIES.find((study) => study.id === id)?.format, id).toBe(format);
      await page.goto(`/apologetics/study/${id}`);
      await expect(page.locator(".ap-page h1")).toHaveText(STUDIES.find((study) => study.id === id)!.title);
      await expect(page.locator(`.fx-main.fx-is-${format}`)).toBeVisible();
      await check(page);
      await expect(page.getByRole("navigation", { name: "Study contents" }).getByRole("link").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), id).toBeLessThanOrEqual(1);
    }
    expect(errors).toEqual([]);
  });
}

test("apologetics formats: an essay shows one part per address and forwards a part it does not have", async ({ page }) => {
  const essay = STUDIES.find((study) => study.id === "resurrection-case")!, count = essay.parts!.length;
  await page.goto("/apologetics/study/resurrection-case");
  await expect(page.locator("#answer")).toBeVisible();
  await page.getByRole("link", { name: new RegExp(`Next part · 2 of ${count}`) }).click();
  await expect(page).toHaveURL(/\/apologetics\/study\/resurrection-case\/part\/2$/);
  await expect(page.locator("#answer")).toHaveCount(0);
  await expect(page.locator(".fx-main h2").first()).toHaveText(essay.parts![1].title);
  await page.goto(`/apologetics/study/resurrection-case/part/${count + 5}`);
  await expect(page).toHaveURL(new RegExp(`/part/${count}$`));
  await expect(page.locator("#limit")).toBeVisible();
  await page.goto("/apologetics/study/resurrection-case/part/1");
  await expect(page).toHaveURL(/\/apologetics\/study\/resurrection-case$/);
  await page.goto("/apologetics/study/cross/part/2");
  await expect(page).toHaveURL(/\/apologetics\/study\/cross$/);
});

test("apologetics formats: today's articles keep today's page", async ({ page }) => {
  await page.goto("/apologetics/study/cross");
  await expect(page.getByText("Take the objection seriously")).toBeVisible();
  await expect(page.locator(".fx-main")).toHaveCount(0);
  await expect(page.locator(".ap-card-meta span").first()).toContainText("Study guide");
});

test("apologetics formats: the glossary finder narrows the terms", async ({ page }) => {
  await page.goto("/apologetics/study/titles-of-jesus");
  await expect(page.locator(".fx-terms > div").first()).toBeVisible();
  const all = await page.locator(".fx-terms > div").count();
  await page.getByPlaceholder("Find a term…").fill("Son of Man");
  await expect(page.locator(".fx-terms > div").first()).toContainText("Son of Man");
  expect(await page.locator(".fx-terms > div").count()).toBeLessThan(all);
});
