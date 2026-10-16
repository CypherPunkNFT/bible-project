import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("every scripture has a download beside Read, and KJV saves a complete text file", async ({ page }) => {
  await page.goto("/sources#scriptures");
  const downloads = page.getByRole("button", { name: /^Download .* as text$/ });
  await expect(downloads).toHaveCount(37);
  const button = page.getByRole("button", { name: "Download King James Version as text", exact: true });
  await expect(button.locator("xpath=ancestor::td").getByRole("link", { name: "Read", exact: true })).toBeVisible();
  const pending = page.waitForEvent("download");
  await button.click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("kjv-bible.txt");
  const text = await readFile((await download.path())!, "utf8");
  expect(text).toContain("GEN 1:1 In the beginning");
  expect(text).toContain("REV 22:21");
  await expect(page).toHaveURL(/\/sources#scriptures$/);
});

test("failed downloads offer a retry without saving a partial file", async ({ page }) => {
  await page.route("**/data/plain/kjv/GEN.json*", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto("/sources#scriptures");
  let downloaded = false;
  page.on("download", () => { downloaded = true; });
  const button = page.getByRole("button", { name: "Download King James Version as text", exact: true });
  await button.click();
  await expect(button).toHaveText("Retry download");
  expect(downloaded).toBe(false);
  await page.unroute("**/data/plain/kjv/GEN.json*");
  const pending = page.waitForEvent("download");
  await button.click();
  await pending;
});
