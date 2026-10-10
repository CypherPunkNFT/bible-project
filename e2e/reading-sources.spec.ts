import { expect, test } from "@playwright/test";

test("confession citations read locally and preserve edition provenance at the bottom", async ({ page }) => {
  await page.goto("/sources/reading/ap-wcf?at=11.1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Westminster Confession of Faith");
  await expect(page.getByLabel("Reading chapter")).toHaveValue("11");
  await expect(page.locator(".acq-reading")).toContainText("justify");
  await page.getByLabel("Reading chapter").selectOption("8");
  await expect(page.locator(".acq-reading section").first()).toContainText("8.1");
  expect(await page.locator('.acq-reader a[href^="http"]:not(.acq-sources a)').count()).toBe(0);
  await expect(page.locator('.acq-sources a[href*="NonlinearFruit"]')).toHaveCount(1);
});

test("comparison text names the actual local translation and a pending source never redirects", async ({ page }) => {
  await page.goto("/sources/reading/ap-q112");
  await expect(page.locator(".acq-reading")).toContainText("Allah");
  await expect(page.locator("header")).toContainText("Pickthall");
  await page.goto("/sources/reading/ap-aquinas");
  await expect(page.locator(".acq-warning")).toContainText("Catholic source");
  await expect(page.locator(".acq-pending")).toContainText("verified edition");
  await expect(page.locator(".acq-reading")).toHaveCount(0);
  expect(await page.locator('.acq-reader a[href^="http"]:not(.acq-sources a)').count()).toBe(0);
});

test("anonymous dataset texts are discoverable by collection with bounded pages", async ({ page, request }) => {
  const response = await request.get("/content/teacher-library/collections/index.json");
  const collections = await response.json() as { id: string; source: string; readable: number; anonymous: number }[];
  const collection = collections.find(c => c.source === "private-biblical-history")!;
  expect(collection.anonymous).toBeGreaterThan(0);
  await page.goto(`/teachers/works?collection=${collection.id}`);
  await expect(page.locator(".acq-collections .acq-works li")).toHaveCount(200);
  const first = await page.locator(".acq-collections .acq-works li").first().innerText();
  await page.getByLabel("Collection page", { exact: true }).selectOption("1");
  await expect(page.locator(".acq-collections .acq-works li").first()).not.toHaveText(first);
  await page.locator(".acq-collections .acq-works li a").first().click();
  await expect(page.locator(".acq-reading p").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("Apologetics source cards and citation chips lead to internal source pages", async ({ page }) => {
  await page.goto("/apologetics/sources");
  const links = page.locator("a.ap-source-link");
  await expect(links.first()).toBeVisible();
  for (const href of await links.evaluateAll(nodes => nodes.map(n => n.getAttribute("href")))) expect(href).toMatch(/^\/sources\/reading\/ap-/);
  await links.first().click();
  await expect(page.locator(".acq-reader h1")).toBeVisible();
});
