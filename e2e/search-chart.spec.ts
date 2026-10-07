import { expect, test } from "@playwright/test";

// The exact-words chart on the Search page (src/components/search/WordDistribution.tsx).
test("clicking a bar picks its book: the verse list narrows and its chapters open", async ({ page }) => {
  await page.goto("/search?q=viper&in=asv&whole=1");
  const chart = page.getByRole("group", { name: /Matches per book/ });
  await expect(chart.getByRole("button")).toHaveCount(3, { timeout: 30_000 });
  await expect(page.locator("section[aria-live=polite] ol > li")).toHaveCount(4);
  await chart.getByRole("button", { name: /^Isaiah/ }).click();
  await expect(chart.getByRole("button", { name: /^Isaiah/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("section[aria-live=polite] ol > li")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Isaiah 30", exact: true })).toHaveAttribute("href", /\/read\/asv\/ISA\/30\?v=/);
  await page.getByRole("button", { name: "Show every book" }).click();
  await expect(page.locator("section[aria-live=polite] ol > li")).toHaveCount(4);
});
