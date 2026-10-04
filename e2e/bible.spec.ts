import { expect, test } from "@playwright/test";

test("Bible: one header destination covers the hub, library and reader", async ({ page }) => {
  for (const path of ["/bible", "/library", "/read/kjv/GEN/1"]) {
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main", exact: true });
    await expect(nav.getByRole("link", { name: "Bible", exact: true })).toHaveClass(/bg-ink/);
    await expect(nav.getByRole("link", { name: "Library", exact: true })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Read", exact: true })).toHaveCount(0);
    await nav.getByRole("link", { name: "Bible", exact: true }).click();
    await expect(page).toHaveURL(/\/bible$/);
    await expect(page.locator(".bible-path")).toHaveCount(2);
  }
});

test("Bible: Library opens the collection and Read opens a chapter", async ({ page }) => {
  await page.goto("/bible");
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("heading", { name: "The library.", exact: true })).toBeVisible();
  await page.goto("/bible");
  await page.getByRole("link", { name: "Read", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/kjv\/GEN\/1$/);
});

test("Bible: the reading card resumes a valid chapter and rejects a missing edition", async ({ page }) => {
  await page.goto("/bible");
  await page.evaluate(() => localStorage.setItem("bp-last-read", "/read/web/PSA/23"));
  await page.reload();
  await expect(page.locator(".bible-reading")).toContainText("Psalms 23 · WEB");
  await page.getByRole("link", { name: "Read", exact: true }).click();
  await expect(page).toHaveURL(/\/read\/web\/PSA\/23$/);
  await page.goto("/bible");
  await page.evaluate(() => localStorage.setItem("bp-last-read", "/read/missing/PSA/23"));
  await page.reload();
  await expect(page.getByRole("link", { name: "Read", exact: true })).toHaveAttribute("href", "/read");
});
