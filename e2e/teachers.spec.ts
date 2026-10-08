import { expect, test } from "@playwright/test";

// Teachers and Resources (2026-10-08): the header's two new stations, the Teachers station's two doorways (Preachers &
// authors, Scholars; their sections have their own specs, e2e/teachers-*.spec.ts) and Topics, which left the header but
// stays reachable from Home and Study.

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

test("the Teachers station has two doorways: Preachers & authors, and Scholars", async ({ page }) => {
  await page.goto("/teachers");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Learn from those");
  const doors = page.getByRole("navigation", { name: "Teachers" }).getByRole("link");
  await expect(doors).toHaveCount(2);
  await expect(page.locator(".st-door .sa-art")).toHaveCount(2);
  await doors.filter({ hasText: "Preachers & authors" }).click();
  await expect(page).toHaveURL(/\/teachers\/preachers-and-authors$/);
  await page.getByRole("navigation", { name: "Teachers" }).getByRole("link", { name: "Scholars" }).click();
  await expect(page).toHaveURL(/\/teachers\/scholars$/);
});

test("the earlier list addresses lead to the merged Preachers & authors page", async ({ page }) => {
  for (const old of ["/teachers/preachers", "/teachers/authors"]) {
    await page.goto(old);
    await expect(page).toHaveURL(/\/teachers\/preachers-and-authors$/);
  }
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
  for (const address of ["/teachers", "/teachers/preachers-and-authors", "/teachers/scholars", "/resources"]) {
    await page.goto(address);
    await page.locator("h1").first().waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), address).toBeLessThanOrEqual(1);
  }
});
