import { expect, test } from "@playwright/test";

// The Letters study (src/components/letters/browse/): a home of four collections and four ways in, each a page of
// cards, each card opening its section page at its part. Runs at desktop, tablet and phone.

test("letters: the home shows the four collections and the four ways in", async ({ page }) => {
  await page.goto("/study/letters");
  await expect(page.getByRole("heading", { name: /The four collections/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Across all twenty-one/ })).toBeVisible();
  await expect(page.locator(".lb-card")).toHaveCount(8);
  await page.locator(".lb-card", { hasText: "Christ in the letters" }).click();
  await expect(page).toHaveURL(/\/study\/letters\/christ-in-the-letters$/);
  await expect(page.locator(".lb-card")).toHaveCount(12);
});

test("letters: a card opens its section page at its own part", async ({ page }) => {
  await page.goto("/study/letters/paul");
  await expect(page.getByRole("heading", { name: /Paul's letters/ })).toBeVisible();
  await page.locator(".lb-card", { hasText: "His companions over time" }).click();
  await expect(page).toHaveURL(/\/study\/letters\/paul\/story\/companions$/);
  await expect(page.locator(".lb-part")).toHaveCount(4);
  await expect(page.locator("#part-companions")).toBeInViewport();
});

test("letters: choosing a letter makes the Inside cards follow it", async ({ page }) => {
  await page.goto("/study/letters/the-letters-of-john");
  await page.getByRole("button", { name: "Inside 3 John" }).click();
  await expect(page).toHaveURL(/letter=3JN/);
  await expect(page.getByRole("heading", { name: /Inside 3 John/ })).toBeVisible();
  await page.locator(".lb-card", { hasText: "3 John at a glance" }).click();
  await expect(page).toHaveURL(/\/inside\/glance\?letter=3JN$/);
  await expect(page.locator("#part-glance").getByRole("heading", { name: "3 John at a glance" })).toBeVisible();
});

// James, Peter & Jude (owner, 2026-10-07): the writers first, then each letter at a glance, then side by side.
test("letters: James, Peter & Jude has the writers, each letter at a glance, and the Old Testament behind all four", async ({ page }) => {
  await page.goto("/study/letters/james-peter-and-jude");
  for (const title of ["James, the Lord's brother", "Peter, the apostle", "Jude, the Lord's brother", "The family of Jesus",
    "James at a glance", "Peter at a glance", "Jude at a glance", "The Old Testament behind James, Peter & Jude",
    "Any two, side by side", "The words they lean on, side by side"]) {
    await expect(page.locator(".lb-card", { hasText: title })).toHaveCount(1);
  }
  await page.getByRole("link", { name: "Jude at a glance" }).first().click();
  await expect(page).toHaveURL(/\/james-peter-and-jude\/inside\/jude$/);
  await expect(page.locator("#part-peter .lb-look-title")).toHaveText(["1 Peter", "2 Peter"]);
  await expect(page.locator("#part-peter")).toContainText("Where his readers lived");
  await expect(page.locator("#part-ot .lb-ot-summary dt")).toHaveText(["James", "1 Peter", "2 Peter", "Jude"]);
  await expect(page.locator("#part-ot")).toContainText("Every one of these letters draws on Genesis and Isaiah");
  // The bar names each letter; the merged comparison chooses two and lets one go again.
  await page.goto("/study/letters/james-peter-and-jude");
  await expect(page.getByRole("link", { name: "1 Peter at a glance" })).toBeVisible();
  await expect(page.getByRole("link", { name: "2 Peter at a glance" })).toBeVisible();
  await page.goto("/study/letters/james-peter-and-jude/side/compare");
  const picks = page.locator("#part-compare").getByRole("group", { name: "Letters to compare" });
  await expect(picks.getByRole("button")).toHaveCount(5);
  await expect(picks.getByRole("button", { name: "Jude" })).toHaveAttribute("aria-pressed", "true");
  await picks.getByRole("button", { name: "Jude" }).click();
  await expect(picks.getByRole("button", { name: "Jude" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#part-compare figure svg").first()).toContainText("Choose a letter");
  await expect(page.locator("#part-compare figure svg").first()).toContainText("2 Peter");
  await picks.getByRole("button", { name: "2 Peter" }).click();
  await picks.getByRole("button", { name: "James" }).click();
  await picks.getByRole("button", { name: /Matthew/ }).click();
  await expect(page.locator("#part-compare")).toContainText("Paired by scholars");
});

test("letters: the old group addresses open their collection", async ({ page }) => {
  await page.goto("/study/letters#hebrews");
  await expect(page).toHaveURL(/\/study\/letters\/hebrews$/);
  await expect(page.getByRole("heading", { name: /Hebrews\./ })).toBeVisible();
});

test("letters: every page has its sources and no page scrolls sideways", async ({ page }) => {
  for (const path of ["/study/letters", "/study/letters/paul/inside", "/study/letters/hebrews/argument", "/study/letters/look-closer/side", "/study/letters/what-runs-through-them/words"]) {
    await page.goto(path);
    await expect(page.locator(".lb")).toBeVisible();
    if (path !== "/study/letters") await expect(page.locator(".lb-sources li").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

// Owner trial on Paul's letters (2026-10-07): the collection's introduction, its own Old Testament chart, and the
// Bible's section headings beside the outline. The other three collections keep the short tagline for now.
test("letters: Paul's letters show the introduction, their own Old Testament chart and headings beside the outline", async ({ page }) => {
  await page.goto("/study/letters/paul");
  await expect(page.locator(".lb-about > p:not(.lb-person-links)")).toHaveCount(3);
  await expect(page.locator(".lb-about")).toContainText("Tarsus");
  await page.goto("/study/letters/paul/inside/shape?letter=ROM");
  await expect(page.locator(".lb-beside-row")).toHaveCount(10);
  await expect(page.locator(".lb-beside")).toContainText("Unashamed of the Gospel");
  await page.goto("/study/letters/paul/inside/ot?letter=ROM");
  await expect(page.locator("#part-ot")).toContainText("Isaiah");
  await expect(page.locator("#part-ot .lb-ot-list li").first()).toBeVisible();
});

// Owner 2026-10-07: every collection has its introduction and a tall line drawing; the writers link to their person pages
// (Hebrews has none: its writer is not named); James, Peter and Jude link all three.
test("letters: each collection's introduction, line drawing and writers' own pages", async ({ page }) => {
  for (const [slug, link] of [["paul", "/people/paul-act-7-58"], ["the-letters-of-john", "/people/john-mat-4-21"], ["hebrews", null]] as const) {
    await page.goto(`/study/letters/${slug}`);
    await expect(page.locator(".lb-about > p").first()).toBeVisible();
    await expect(page.locator(".lb-tall svg")).toBeAttached();
    if (link) await expect(page.locator(".lb-person-link")).toHaveAttribute("href", link);
    else await expect(page.locator(".lb-person-link")).toHaveCount(0);
  }
  // James, Peter and Jude open with one paragraph on the collection, then a link to each writer's own page.
  await page.goto("/study/letters/james-peter-and-jude");
  await expect(page.locator(".lb-about > p:not(.lb-person-links)")).toHaveCount(1);
  await expect(page.locator(".lb-about .lb-person-link")).toHaveCount(3);
  await page.locator(".lb-about .lb-person-link", { hasText: "Peter" }).click();
  await expect(page).toHaveURL(/\/people\/peter-mat-4-18$/);
  await expect(page.getByText(/Back to James, Peter & Jude/)).toBeVisible();
});
