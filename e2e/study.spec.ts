import { existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// The Study pages (TODO section G). Runs at desktop, tablet and phone like site.spec.ts.
test.skip(!existsSync("data/study/index.json"), "study data not built — run scripts/build-study.py first");

const PAGES = ["/study", "/study/harmony", "/study/miracles", "/study/letters", "/study/people", "/study/people/elijah-1ki-17-1", "/study/prophets", "/study/names"];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

for (const path of PAGES) {
  test(`study: no sideways scroll and no console errors: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(path);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `page is ${overflow}px wider than the screen`).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test("harmony: a row opens with the keyboard and shows all four Gospels", async ({ page }) => {
  await page.goto("/study/harmony");
  const row = page.getByRole("button", { name: /Feeding of the five thousand/ });
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(row).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("region", { name: /Feeding of the five thousand/ });
  for (const gospel of ["Matthew", "Mark", "Luke", "John"]) await expect(panel.getByRole("heading", { name: gospel })).toBeVisible();
  await expect(panel).toContainText("five loaves");
});

test("harmony: 'only John' shows the events no other Gospel tells", async ({ page }) => {
  await page.goto("/study/harmony");
  await page.getByRole("button", { name: "John", exact: true }).click();
  await page.getByLabel("and no other Gospel").check();
  await expect(page.getByRole("button", { name: /Jesus works his first miracle/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Feeding of the five thousand/ })).toHaveCount(0);
});

test("harmony references open the reader on the whole passage", async ({ page }) => {
  await page.goto("/study/harmony");
  await page.getByRole("link", { name: "6:30–44" }).first().click();
  await expect(page).toHaveURL(/\/read\/[a-z]+\/MRK\/6\?hl=30-44/);
  await expect(page.locator('[data-verse="30"]').first()).toHaveClass(/bg-accent/);
});

test("people: Zechariah is one of 29, and family links land on the right person", async ({ page }) => {
  await page.goto("/study/people");
  await page.getByPlaceholder("Name, e.g. Zechariah").fill("Zechariah");
  await expect(page.getByText("one of 29").first()).toBeVisible();
  await page.goto("/study/people/david-rut-4-17");
  await page.getByRole("region", { name: "Family" }).getByRole("link", { name: "Absalom" }).click();
  await expect(page).toHaveURL(/\/study\/people\/absalom-2sa-3-3$/);
  await expect(page.getByRole("heading", { name: "Absalom", level: 2 })).toBeVisible();
});

test("prophets: Amos, Moses and Deborah the judge are there; Rebekah's nurse is not", async ({ page }) => {
  await page.goto("/study/prophets");
  for (const id of ["amos-amo-1-1", "moses-exo-2-10", "deborah-jdg-4-4"]) await expect(page.locator(`#prophet-${id}`)).toBeVisible();
  await expect(page.locator("#prophet-deborah-gen-35-8")).toHaveCount(0);
});

test("names: the Faith page's three words unfold and a name opens its Scripture", async ({ page }) => {
  await page.goto("/study/names");
  for (const words of ["ABBA FATHER", "JESUS CHRIST", "HOLY SPIRIT"]) await expect(page.getByRole("button", { name: `Expand ${words} names` })).toBeVisible();
  await page.getByRole("button", { name: "Expand ABBA FATHER names" }).click();
  const field = page.getByRole("group", { name: "Explore ABBA FATHER names" });
  await expect(field).toHaveAttribute("data-edge-state", "expanded", { timeout: 5000 });
  await field.getByRole("button", { name: "Abba, Father" }).first().click();
  const reading = page.getByRole("article", { name: "Abba, Father Scripture" });
  await expect(reading).toContainText("Abba, Father, all things are possible");
  await expect(reading.getByRole("link", { name: /Read in context/ })).toHaveAttribute("href", "/read/kjv/MRK/14?hl=36-36");
});

test("home page shows the Names of God", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "His names." })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Expand JESUS CHRIST names" })).toBeVisible();
});

test("harmony: a long passage across chapters ends with 'read on' (the Sermon on the Mount)", async ({ page }) => {
  await page.goto("/study/harmony#event-54");
  const panel = page.locator("#event-54-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: /read on/ }).first()).toBeVisible();
});
