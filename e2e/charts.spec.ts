import { expect, test } from "@playwright/test";

test("charts: overview selects one complete collection with References as the default", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/charts");
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator(".chart-map-card")).toHaveCount(4);
  await expect(page.getByText("The map keeps going.")).toHaveCount(0);
  await expect(page.locator("#references")).toBeVisible();
  await expect(page.locator("#arcs > header")).toBeAttached();
  await expect(page.locator("#matrix > header")).toBeAttached();
  await expect(page.locator("#structure")).toHaveCount(0);
  for (const [area, charts] of [["structure", ["sections", "sizes", "chapters"]], ["words", ["jesus"]], ["versions", ["timeline", "coverage"]], ["references", ["arcs", "matrix"]]] as const) {
    await page.locator(".chart-map-label a").filter({ hasText: area === "structure" ? "Bible structure" : area === "words" ? "Words of Jesus" : area === "versions" ? "Versions" : "References" }).click();
    await expect(page).toHaveURL(new RegExp("collection=" + area));
    await expect(page.locator("#" + area)).toBeVisible();
    await expect(page.locator(".chart-area:visible")).toHaveCount(1);
    for (const chart of charts) await expect(page.locator("#" + chart + " > header")).toBeVisible();
    await expect(page.locator(".chart-discovery-guide li")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.locator(".charts-page-nav a[href$='#chart-map']").click();
  }
  expect(errors).toEqual([]);
});

test("charts: each collection has its own explained page and the map preserves direct links", async ({ page }) => {
  for (const [slug, area, ids] of [["references", "references", ["arcs", "matrix"]], ["structure", "structure", ["sections", "sizes", "chapters"]], ["words-of-jesus", "words", ["jesus"]], ["versions", "versions", ["timeline", "coverage"]]] as const) {
    await page.goto("/charts/" + slug);
    await expect(page.locator(".charts-map")).toHaveCount(0);
    await expect(page.locator(".chart-collection-breadcrumb")).toBeVisible();
    await expect(page.locator("#" + area)).toBeVisible();
    await expect(page.locator(".chart-area:visible")).toHaveCount(1);
    for (const id of ids) await expect(page.locator("#" + id + " > header")).toBeAttached();
    await expect(page.locator(".chart-discovery-guide li")).toHaveCount(3);
  }
  await page.goto("/charts#coverage");
  await expect(page.getByLabel("Inspect a book")).toBeVisible();
  await page.locator(".charts-page-nav a[href$='#chart-map']").click();
  await page.locator(".chart-map-label a").filter({ hasText: "References" }).click();
  await page.goBack();
  await expect(page.locator("#versions")).toBeVisible();
});

test("charts: a direct Versions collection does not fetch connection datasets", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/charts/versions#coverage");
  await expect(page.getByLabel("Inspect a book")).toBeVisible();
  expect(requests.some((url) => /xref-(arcs|books)\.json/.test(url))).toBe(false);
  await page.getByRole("link", { name: "All chart collections ↑", exact: true }).click();
  await expect(page).toHaveURL(new RegExp("/charts$"));
  await expect(page.locator("#references")).toBeVisible();
});

test("charts: references are both open and a pinned arc view survives a jump to the matrix", async ({ page }) => {
  await page.goto("/charts#arcs");
  const arcs = page.locator("#arcs");
  await arcs.getByLabel("Light up one book:").selectOption("DAN");
  await expect(arcs.locator(".chart-live-detail strong")).toHaveText("Daniel");
  await page.evaluate(() => { window.location.hash = "matrix"; });
  await expect(page.locator(".matrix-detail h3")).toBeVisible();
  await page.evaluate(() => { window.location.hash = "arcs"; });
  await expect(arcs.getByLabel("Light up one book:")).toHaveValue("DAN");
  await arcs.getByRole("button", { name: "Reset view" }).click();
  await expect(arcs.locator(".chart-live-detail strong")).toHaveText("The whole Bible");
});

test("charts: book matrix selectors report the actual dataset count and ranked pairs are selectable", async ({ page, request }) => {
  const pairs = await (await request.get("/data/xref-books.json")).json() as [string, string, number][];
  const expected = pairs.find(([a, b]) => a === "DAN" && b === "REV")![2];
  await page.goto("/charts#matrix");
  const matrix = page.locator("#matrix");
  await matrix.getByLabel("From book", { exact: true }).selectOption({ label: "Daniel" });
  await matrix.getByLabel("To book", { exact: true }).selectOption({ label: "Revelation" });
  await expect(matrix.locator(".matrix-detail h3")).toHaveText("Daniel → Revelation");
  await expect(matrix.locator(".matrix-detail strong")).toHaveText(new Intl.NumberFormat("en-US").format(expected));
  await matrix.locator(".matrix-pairs button").first().click();
  await expect(matrix.locator(".matrix-pairs button").first()).toHaveAttribute("aria-pressed", "true");
  await matrix.getByRole("button", { name: "Clear selection" }).click();
  await expect(matrix.locator(".matrix-detail h3")).toHaveText("Discover a connection");
});

test("charts: book lengths sort by the chosen measurement", async ({ page }) => {
  await page.goto("/charts#sizes");
  const sizes = page.locator("#sizes");
  await sizes.getByRole("button", { name: "chapters", exact: true }).click();
  await sizes.getByLabel("Order", { exact: true }).selectOption("longest");
  await expect(sizes.locator(".size-bars a").first()).toHaveAttribute("href", "/read/kjv/PSA/1");
  await expect(sizes.locator(".size-bars a").first()).toContainText("150");
});

test("charts: section buttons explain and filter the numbered chapter map", async ({ page }) => {
  await page.goto("/charts#chapters");
  const chapters = page.locator("#chapters");
  await chapters.getByRole("group", { name: "Bible sections" }).getByRole("button", { name: "Poetry & Wisdom" }).click();
  await expect(chapters.locator(".chapter-atlas-row")).toHaveCount(5);
  await expect(chapters.getByRole("searchbox")).toHaveCount(0);
  await expect(chapters.getByRole("combobox")).toHaveCount(0);
  await expect(chapters.getByRole("complementary", { name: "Poetry & Wisdom literary guide" })).toContainText("paired lines");
  await expect(chapters.getByRole("button", { name: /^Psalms 119:/ })).toHaveText("119");
  await chapters.getByRole("button", { name: /^Psalms 1:/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(chapters.getByRole("button", { name: /^Psalms 2:/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/read\/kjv\/PSA\/2$/);
});

test("charts: the same section stays selected across all three open structure charts", async ({ page }) => {
  await page.goto("/charts#sections");
  const sections = page.locator("#sections");
  await sections.getByRole("group", { name: "Bible sections" }).getByRole("button", { name: "Poetry & Wisdom" }).click();
  await sections.getByRole("group", { name: "Measure the sections" }).getByRole("button", { name: "Books", exact: true }).click();
  await expect(sections.locator(".measure-insight strong")).toHaveText("5");
  await page.evaluate(() => { window.location.hash = "sizes"; });
  await expect(page.locator("#sizes .size-bars a")).toHaveCount(5);
  await page.evaluate(() => { window.location.hash = "chapters"; });
  await expect(page.locator("#chapters .chapter-atlas-row")).toHaveCount(5);
  await page.evaluate(() => { window.location.hash = "sections"; });
  await expect(sections.locator(".measure-insight strong")).toHaveText("5");
  await expect(sections.getByRole("button", { name: "Books", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("charts: all nine section measures show counts and traceable study evidence", async ({ page }) => {
  await page.goto("/charts#sections");
  const sections = page.locator("#sections");
  const measures = sections.getByRole("group", { name: "Measure the sections" });
  await expect(measures.getByRole("button")).toHaveCount(9);
  for (const [label, expected] of [["Books", "66"], ["Chapters", "1,189"], ["Verses", "31,102"]]) {
    await measures.getByRole("button", { name: label, exact: true }).click();
    await expect(sections.locator(".measure-insight strong")).toHaveText(expected);
  }
  for (const label of ["Miracles", "Selected prophecies", "Gospel episodes", "Names of God"]) {
    await measures.getByRole("button", { name: label, exact: true }).click();
    await expect(sections.locator(".measure-evidence")).toBeVisible();
    await sections.locator(".measure-evidence summary").click();
    await expect(sections.locator(".measure-evidence a").first()).toHaveAttribute("href", /\/read\/kjv\/.*\?hl=/);
    expect(Number((await sections.locator(".measure-insight strong").innerText()).replaceAll(",", ""))).toBeGreaterThan(0);
  }
  await measures.getByRole("button", { name: "Selected prophecies" }).click();
  await expect(sections.locator(".measure-insight strong")).toHaveText("21");
  await expect(sections.locator(".chart-measure-note")).toContainText("not a total");
  await measures.getByRole("button", { name: "Gospel episodes" }).click();
  await sections.getByRole("group", { name: "Bible sections" }).getByRole("button", { name: "Poetry & Wisdom" }).click();
  await expect(sections.locator(".measure-insight strong")).toHaveText("0");
  await expect(sections.locator(".measure-evidence")).toContainText("No entries");
});

test("charts: reference list is flush with the matrix and its legend is in the footer", async ({ page }, testInfo) => {
  await page.goto("/charts#matrix");
  const matrix = page.locator("#matrix");
  await expect(matrix.locator(".matrix-pairs button").first()).toBeVisible();
  await expect(matrix.locator(".charts-panel-footer")).toContainText("Rows: from · Columns: to");
  await expect(matrix.locator(".charts-panel-footer a")).toHaveText("OpenBible.info ↗");
  if (testInfo.project.name !== "phone") {
    const difference = await matrix.evaluate((element) => {
      const chart = element.querySelector(".matrix-surface")!.getBoundingClientRect();
      const list = element.querySelector(".matrix-pairs ol")!.getBoundingClientRect();
      return Math.abs(chart.bottom - list.bottom);
    });
    expect(difference).toBeLessThan(2);
  }
});

test("charts: teaching and speech are both available, including a direct speech link", async ({ page }) => {
  await page.goto("/charts#speech");
  await expect(page.getByRole("heading", { name: "Where he speaks", exact: true })).toBeInViewport();
  await expect(page.locator(".teaching-paths")).toBeAttached();
  const speech = page.locator("#speech");
  await expect(speech.locator(".speech-books > section")).toHaveCount(4);
  await speech.getByRole("group", { name: "Choose a Gospel" }).getByRole("button", { name: "John" }).click();
  await expect(speech.locator(".speech-books > section")).toHaveCount(1);
  await expect(speech.locator(".speech-bars a")).toHaveCount(21);
  await expect(speech.locator(".speech-bars a").last()).toHaveText("21");
  await speech.getByRole("button", { name: "Number of words" }).click();
  await expect(speech.locator(".speech-books .chart-hint")).toContainText("same scale");
  await page.getByRole("button", { name: "Prayer Teach us to pray." }).click();
  await expect(page.locator(".teaching-scripture").first()).toContainText("Our Father");
  await expect(page.locator(".teaching-scripture").nth(1)).toContainText("teach us to pray");
  await expect(page.locator(".teaching-notice")).toContainText("disciple's request");
  await speech.locator(".speech-bars a").nth(14).click();
  await expect(page).toHaveURL(/\/read\/kjv\/JHN\/15$/);
});

test("charts: coverage remains directly usable and links to the standalone collection", async ({ page }) => {
  await page.goto("/charts#coverage");
  const coverage = page.locator("#coverage");
  await coverage.getByLabel("Inspect a book").selectOption("GEN");
  await expect(coverage.locator(".chart-live-detail")).toContainText("Genesis is included in");
  await expect(page.getByRole("link", { name: "Open this collection ↗" })).toHaveAttribute("href", "/charts/versions");
});
