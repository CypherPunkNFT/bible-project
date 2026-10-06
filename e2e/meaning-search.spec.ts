import { expect, test } from "@playwright/test";

// Meaning search (MEANING_SEARCH.md): needs the pack at ../MeaningPack/site (scripts/build-meaning-pack.py), served by the preview.

test("the meaning-search page explains it and shows the demo without any download", async ({ page }) => {
  await page.goto("/search/meaning");
  await expect(page.getByRole("heading", { name: "Search by what you mean." })).toBeVisible();
  await expect(page.getByRole("button", { name: /Turn on meaning search · \d+ MB/ })).toBeVisible();
  await expect(page.getByText("“who picked what went into scripture”")).toBeVisible();
  await expect(page.getByRole("link", { name: "Who decided which books belong in the Bible?" })).toBeVisible();
});

test("search without meaning search: studies by words, the invitation, places and exact words still work", async ({ page }) => {
  await page.goto("/search?q=jerusalem&in=kjv");
  await expect(page.getByText(/verses contain/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Find verses by what they mean")).toBeVisible();
  await expect(page.getByRole("link", { name: /Jerusalem\s*\d[\d,]* verses/ })).toHaveAttribute("href", /\/study\/atlas\/map\?place=/);
});

test("turn meaning search on, ask a question, then remove it", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "one full download is enough; layout is covered by the other tests");
  test.setTimeout(180_000);
  await page.goto("/search/meaning");
  await page.getByRole("button", { name: /Turn on meaning search/ }).click();
  await expect(page.getByText("Meaning search is on for this device.")).toBeVisible({ timeout: 120_000 });

  await page.goto("/search?q=" + encodeURIComponent("who picked what went into scripture") + "&in=kjv");
  const studies = page.locator("section[aria-labelledby=search-studies]");
  await expect(studies.getByText("by meaning")).toBeVisible({ timeout: 60_000 });
  await expect(studies.locator("li").first()).toContainText("Who decided which books belong in the Bible?");
  await expect(page.locator("section[aria-labelledby=search-verses] li")).toHaveCount(12, { timeout: 60_000 });
  await expect(page.getByText("Meaning search is on · manage")).toBeVisible();

  await page.goto("/search/meaning");
  await page.getByRole("button", { name: "Remove from this device" }).click();
  await expect(page.getByRole("button", { name: /Turn on meaning search/ })).toBeVisible();
});
