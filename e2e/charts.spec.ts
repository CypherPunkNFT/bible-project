import { expect, test } from "@playwright/test";

const views = ["arcs", "matrix", "sections", "sizes", "chapters", "jesus", "timeline", "coverage"];

test("charts: four related areas support keyboard selection and every direct view fits", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/charts");
  await page.getByRole("tab").first().focus();
  await expect(page.getByRole("tab")).toHaveCount(4);
  for (const [index, id] of ["arcs", "sections", "jesus", "timeline"].entries()) {
    if (index) await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tabpanel")).toHaveAttribute("id", id);
    await expect(page.getByRole("tab").nth(index)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").getByRole("status")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  for (const id of views) {
    await page.goto("/charts#" + id);
    await expect(page.getByRole("tabpanel")).toHaveAttribute("id", id);
    await expect(page.getByRole("tabpanel").getByRole("status")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test("charts: direct links and browser history restore the selected view without downloading unused connections", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/charts#coverage");
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "coverage");
  await page.getByRole("tab", { name: /Bible structure/ }).click();
  await page.getByRole("button", { name: "Compare books", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "sizes");
  await page.goBack();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "sections");
  await page.goBack();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "coverage");
  expect(requests.some((url) => /xref-(arcs|books)\.json/.test(url))).toBe(false);
});

test("charts: arc focus can be pinned and reset", async ({ page }) => {
  await page.goto("/charts#arcs");
  await page.getByLabel("Light up one book:").selectOption("DAN");
  await expect(page.locator(".chart-live-detail strong")).toHaveText("Daniel");
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(page.locator(".chart-live-detail strong")).toHaveText("The whole Bible");
  await expect(page.getByLabel("Light up one book:")).toHaveValue("");
});

test("charts: book matrix selectors report the actual dataset count and ranked pairs are selectable", async ({ page, request }) => {
  const pairs = await (await request.get("/data/xref-books.json")).json() as [string, string, number][];
  const expected = pairs.find(([a, b]) => a === "DAN" && b === "REV")![2];
  await page.goto("/charts#matrix");
  await page.getByLabel("From book", { exact: true }).selectOption({ label: "Daniel" });
  await page.getByLabel("To book", { exact: true }).selectOption({ label: "Revelation" });
  await expect(page.locator(".matrix-detail h3")).toHaveText("Daniel → Revelation");
  await expect(page.locator(".matrix-detail strong")).toHaveText(new Intl.NumberFormat("en-US").format(expected));
  await page.locator(".matrix-pairs button").first().click();
  await expect(page.locator(".matrix-pairs button").first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(page.locator(".matrix-detail h3")).toHaveText("Discover a connection");
});

test("charts: book lengths sort by the chosen measurement", async ({ page }) => {
  await page.goto("/charts#sizes");
  await page.getByRole("button", { name: "chapters", exact: true }).click();
  await page.getByLabel("Order", { exact: true }).selectOption("longest");
  await expect(page.locator(".size-bars a").first()).toHaveAttribute("href", "/read/kjv/PSA/1");
  await expect(page.locator(".size-bars a").first()).toContainText("150");
});

test("charts: section buttons explain and filter the numbered chapter map", async ({ page }) => {
  await page.goto("/charts#chapters");
  await page.getByRole("group", { name: "Bible sections" }).getByRole("button", { name: "Poetry & Wisdom" }).click();
  await expect(page.locator(".chapter-atlas-row")).toHaveCount(5);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Poetry & Wisdom literary guide" })).toContainText("paired lines");
  await expect(page.getByRole("button", { name: /^Psalms 119:/ })).toHaveText("119");
  await page.getByRole("button", { name: /^Psalms 1:/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: /^Psalms 2:/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/read\/kjv\/PSA\/2$/);
});

test("charts: section selection and coverage filters work without hover", async ({ page }) => {
  await page.goto("/charts#sections");
  const poetry = page.getByRole("group", { name: "Bible sections" }).getByRole("button", { name: "Poetry & Wisdom" });
  await poetry.click();
  await expect(poetry).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /Versions/ }).click();
  await page.getByRole("button", { name: "Books included" }).click();
  await page.getByLabel("Inspect a book").selectOption("GEN");
  await expect(page.locator(".chart-live-detail")).toContainText("Genesis is included in");
});

test("charts: section choice carries across overview, books and chapters", async ({ page }) => {
  await page.goto("/charts#sections");
  await page.getByRole("group", { name: "Bible sections" }).getByRole("button", { name: "Poetry & Wisdom" }).click();
  await page.getByRole("group", { name: "Measure the sections" }).getByRole("button", { name: "Books", exact: true }).click();
  await expect(page.locator(".measure-insight strong")).toHaveText("5");
  await page.getByRole("button", { name: "Compare books" }).click();
  await expect(page.locator(".size-bars a")).toHaveCount(5);
  await page.getByRole("button", { name: "Chapter atlas" }).click();
  await expect(page.locator(".chapter-atlas-row")).toHaveCount(5);
  await page.getByRole("tab", { name: /References/ }).click();
  await page.getByRole("tab", { name: /Bible structure/ }).click();
  await expect(page.getByRole("tabpanel")).toHaveAttribute("id", "chapters");
  await expect(page.locator(".chapter-atlas-row")).toHaveCount(5);
});

test("charts: all nine section measures show counts and traceable study evidence", async ({ page }) => {
  await page.goto("/charts#sections");
  const measures = page.getByRole("group", { name: "Measure the sections" });
  await expect(measures.getByRole("button")).toHaveCount(9);
  for (const [label, expected] of [["Books", "66"], ["Chapters", "1,189"], ["Verses", "31,102"]]) {
    await measures.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".measure-insight strong")).toHaveText(expected);
  }
  for (const label of ["Miracles", "Selected prophecies", "Gospel episodes", "Names of God"]) {
    await measures.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".measure-evidence")).toBeVisible();
    await page.locator(".measure-evidence summary").click();
    await expect(page.locator(".measure-evidence a").first()).toHaveAttribute("href", /\/read\/kjv\/.*\?hl=/);
    expect(Number((await page.locator(".measure-insight strong").innerText()).replaceAll(",", ""))).toBeGreaterThan(0);
  }
  await measures.getByRole("button", { name: "Selected prophecies" }).click();
  await expect(page.locator(".measure-insight strong")).toHaveText("21");
  await expect(page.locator(".chart-measure-note")).toContainText("not a total");
  await measures.getByRole("button", { name: "Gospel episodes" }).click();
  await page.getByRole("group", { name: "Bible sections" }).getByRole("button", { name: "Poetry & Wisdom" }).click();
  await expect(page.locator(".measure-insight strong")).toHaveText("0");
  await expect(page.locator(".measure-evidence")).toContainText("No entries");
});

test("charts: reference list is flush with the matrix and its legend is in the footer", async ({ page }, testInfo) => {
  await page.goto("/charts#matrix");
  await expect(page.locator(".matrix-pairs button").first()).toBeVisible();
  await expect(page.locator(".charts-panel-footer")).toContainText("Rows: from · Columns: to");
  await expect(page.locator(".charts-panel-footer a")).toHaveText("OpenBible.info ↗");
  if (testInfo.project.name !== "phone") {
    const chart = await page.locator(".matrix-surface").boundingBox();
    const list = await page.locator(".matrix-pairs ol").boundingBox();
    expect(Math.abs(chart!.y + chart!.height - list!.y - list!.height)).toBeLessThan(2);
  }
});

test("charts: Jesus teaching compares actual passages and the speech atlas is numbered", async ({ page }) => {
  await page.goto("/charts#jesus");
  await page.getByRole("button", { name: "Prayer Teach us to pray." }).click();
  await expect(page.locator(".teaching-scripture").first()).toContainText("Our Father");
  await expect(page.locator(".teaching-scripture").nth(1)).toContainText("teach us to pray");
  await expect(page.locator(".teaching-notice")).toContainText("disciple's request");
  await page.getByRole("button", { name: "Where he speaks" }).click();
  await expect(page.locator(".speech-books > section")).toHaveCount(4);
  await page.getByRole("group", { name: "Choose a Gospel" }).getByRole("button", { name: "John" }).click();
  await expect(page.locator(".speech-books > section")).toHaveCount(1);
  await expect(page.locator(".speech-bars a")).toHaveCount(21);
  await expect(page.locator(".speech-bars a").last()).toHaveText("21");
  await page.getByRole("button", { name: "Number of words" }).click();
  await expect(page.locator(".speech-books .chart-hint")).toContainText("same scale");
  await page.locator(".speech-bars a").nth(14).click();
  await expect(page).toHaveURL(/\/read\/kjv\/JHN\/15$/);
});
