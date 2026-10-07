import { expect, test } from "@playwright/test";

// "Your words" on the Search page (src/components/search/WordTabs.tsx, src/lib/search-words.ts).
test("a sentence breaks into its words; each word is a tab with its own results, marked in its colour", async ({ page }) => {
  await page.goto("/search?q=grief+and+sorrow+over+the+cross&in=asv&whole=1");
  const tabs = page.getByRole("navigation", { name: "Your words" });
  await expect(tabs.getByRole("button", { name: /^cross\s*28 verses/ })).toBeVisible({ timeout: 30_000 });
  await expect(tabs).toContainText("and");
  await expect(page.getByText(/No verse has the exact words .*2 verses hold 2 of your 3 words/)).toBeVisible();
  await expect(page.locator("mark.search-word-underline", { hasText: "cross" }).first()).toBeVisible(); // the study snippet says why
  await tabs.getByRole("button", { name: /^cross/ }).click();
  await expect(page).toHaveURL(/w=cross/);
  await expect(page.getByText(/28 verses contain “cross”/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/28 verses contain “cross”/)).toBeVisible({ timeout: 30_000 }); // the picked word survives a shared link
});
