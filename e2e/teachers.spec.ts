import { expect, test } from "@playwright/test";

// Teachers and Resources (2026-10-08): the header's two new stations, the three Teachers lists (built by
// scripts/build-teachers.ts) and Topics, which left the header but stays reachable from Home and Study.

test("the header shows Teachers and Resources, not Topics, and lights the right tab", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Teachers" })).toHaveAttribute("href", "/teachers");
  await expect(nav.getByRole("link", { name: "Resources" })).toHaveAttribute("href", "/resources");
  await expect(nav.getByRole("link", { name: "Topics" })).toHaveCount(0);
  await page.goto("/teachers/scholars");
  await expect(nav.getByRole("link", { name: "Teachers" })).toHaveClass(/bg-ink/);
  await expect(nav.getByRole("link", { name: "Resources" })).not.toHaveClass(/bg-ink/);
});

test("Topics still loads, and the Study page still leads to it", async ({ page }) => {
  await page.goto("/topics");
  await expect(page.getByText(/5,603 topics in 55 families/)).toBeVisible();
  await page.goto("/study");
  await expect(page.locator('a[href="/topics"]').first()).toBeVisible();
});

test("the Teachers station has three doorways that lead to their lists", async ({ page }) => {
  await page.goto("/teachers");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Learn from those");
  const doors = page.getByRole("navigation", { name: "Teachers" }).getByRole("link");
  await expect(doors).toHaveCount(3);
  await expect(page.locator(".st-door .sa-art")).toHaveCount(3);
  await doors.filter({ hasText: "Preachers" }).click();
  await expect(page).toHaveURL(/\/teachers\/preachers$/);
  await expect(page.getByRole("heading", { level: 1, name: "Preachers" })).toBeVisible();
});

test("a teacher opens in place with the record behind the listing", async ({ page }) => {
  await page.goto("/teachers/preachers");
  const row = page.getByRole("button", { name: /Charles Haddon Spurgeon/ });
  await expect(row).toHaveAttribute("aria-expanded", "false");
  await row.click();
  await expect(row).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator(`#${await row.getAttribute("aria-controls")}`);
  await expect(panel.getByText(/The library catalogues [\d,]+ sermons by them/)).toBeVisible();
  await expect(panel.getByRole("link", { name: /spurgeon|Sermon 41/i }).first()).toBeVisible();
  await expect(panel.getByRole("link", { name: "Their shelf in the reading library" })).toHaveAttribute("href", "/apologetics/texts?author=author-charles-spurgeon");
});

test("the scholars list filters and its cited scholars link to the pages that cite them", async ({ page }) => {
  await page.goto("/teachers/scholars?from=cited&q=keil");
  await expect(page.getByRole("status")).toHaveText("1 scholar");
  await page.getByRole("button", { name: /C\. F\. Keil/ }).click();
  await expect(page.locator(".tl-panel a.tl-sub").first()).toHaveAttribute("href", /^\/study\//);
  await page.goto("/teachers/authors");
  await page.getByRole("group", { name: "Tradition" }).getByRole("button", { name: "Baptist" }).click();
  await expect(page).toHaveURL(/tradition=baptist/);
  await expect(page.getByRole("button", { name: /John Bunyan/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /John Owen/ })).toHaveCount(0);
});

test("the Resources station shows its three sections without empty pages", async ({ page }) => {
  await page.goto("/resources");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Help for the road");
  const doors = page.getByRole("navigation", { name: "Resources" });
  for (const title of ["Learning materials", "Fellowships", "Help for life"]) await expect(doors.getByRole("heading", { name: title })).toBeVisible();
  // A section without its data file says so quietly and is not a link; one with data links to its page.
  const waiting = await doors.locator('[aria-disabled="true"]').count();
  await expect(doors.getByRole("link")).toHaveCount(3 - waiting);
  await expect(doors.locator('[aria-disabled="true"]').getByText("In preparation")).toHaveCount(waiting);
});

test("no sideways scroll on the stations and lists", async ({ page }) => {
  for (const address of ["/teachers", "/teachers/preachers", "/teachers/authors", "/teachers/scholars", "/resources"]) {
    await page.goto(address);
    await page.locator("h1").first().waitFor();
    if (address === "/teachers/scholars") await page.locator(".tl-head").first().click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), address).toBeLessThanOrEqual(1);
  }
});
