import { expect, test } from "@playwright/test";

test("study: one illustrated landing contains nine collections and Charts redirects here", async ({ page }) => {
  await page.goto("/charts");
  await expect(page).toHaveURL(new RegExp("/study$"));
  await expect(page.locator(".study-resource")).toHaveCount(9);
  await expect(page.locator(".chart-area")).toHaveCount(0);
  const titles = ["Jesus & the Gospels", "Miracles & encounters", "Connections in Scripture", "The shape of the Bible", "People & relationships", "Letters & their message", "Places & journeys", "Names & descriptions of God", "Versions & languages"];
  await expect(page.locator(".study-card-copy h2")).toHaveText(titles);
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Charts", exact: true })).toHaveCount(0);
  for (const [path, label] of [["references", "Connections in Scripture"], ["structure", "The shape of the Bible"], ["gospels", "Jesus & the Gospels"], ["versions", "Versions & languages"]]) {
    await page.locator(".study-resource-link").filter({ hasText: label }).click();
    await expect(page).toHaveURL(new RegExp("/study/" + path + "$"));
    await expect(page.locator(".chart-area")).toHaveCount(1);
    await expect(page.locator(".chart-collection-breadcrumb")).toContainText(label);
    await expect(page.getByRole("navigation", { name: "Collection contents" })).toBeVisible();
    await expect(page.locator(".charts-page-nav")).toHaveCount(0);
    await page.getByRole("link", { name: "Back to Study", exact: true }).click();
    await expect(page).toHaveURL(new RegExp("/study$"));
  }
});

test("study: complete collections and old links resolve to their canonical Study pages", async ({ page }) => {
  for (const [old, slug, area, ids] of [["references", "references", "references", ["arcs", "matrix"]], ["structure", "structure", "structure", ["sections", "sizes", "chapters"]], ["words-of-jesus", "gospels", "words", ["jesus", "speech", "harmony"]], ["versions", "versions", "versions", ["timeline", "coverage"]]] as const) {
    await page.goto("/charts/" + old);
    await expect(page).toHaveURL(new RegExp("/study/" + slug + "$"));
    await expect(page.locator(".study-content-card")).toHaveCount(slug === "references" ? 2 : 3);
    await expect(page.locator("#" + area)).toBeVisible();
    for (const id of ids) await expect(page.locator("#" + id + " > header")).toBeAttached();
  }
  await page.goto("/charts#coverage");
  await expect(page).toHaveURL(new RegExp("/study/versions#coverage$"));
  await expect(page.getByLabel("Inspect a book")).toBeVisible();
  await page.goto("/charts?collection=structure#chapters");
  await expect(page).toHaveURL(new RegExp("/study/structure#chapters$"));
  await expect(page.locator(".chapter-atlas")).toBeVisible();
});

test("study: contents cards navigate within each collection and chart controls survive the return", async ({ page }) => {
  for (const [slug, cards] of [
    ["references", [["Cross-reference arcs", "arcs"], ["Book to book", "matrix"]]],
    ["structure", [["Sections & measures", "sections"], ["Book lengths", "sizes"], ["Chapter atlas", "chapters"]]],
    ["gospels", [["Teaching journeys", "jesus"], ["Where he speaks", "speech"], ["Gospel harmony", "harmony"]]],
    ["versions", [["Versions through time", "timeline"], ["Version coverage", "coverage"]]],
  ] as const) {
    await page.goto("/study/" + slug);
    const contents = page.getByRole("navigation", { name: "Collection contents" });
    for (const [label, id] of cards) {
      await contents.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp("/study/" + slug + "#" + id + "$"));
      await expect(page.locator("#" + id + "-title")).toBeInViewport();
      await page.locator("#" + id).getByRole("link", { name: "Back to contents" }).click();
      await expect(page.locator("#collection-contents-title")).toBeInViewport();
    }
  }
  await page.goto("/study/references");
  await page.getByLabel("Light up one book:").selectOption("DAN");
  await page.getByRole("navigation", { name: "Collection contents" }).getByRole("link", { name: "Book to book", exact: true }).click();
  await page.locator("#matrix").getByRole("link", { name: "Back to contents" }).click();
  await page.getByRole("navigation", { name: "Collection contents" }).getByRole("link", { name: "Cross-reference arcs", exact: true }).click();
  await expect(page.getByLabel("Light up one book:")).toHaveValue("DAN");
});

test("study: landing and Versions avoid reference datasets, and all collections return to Study", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/study");
  await expect(page.locator(".study-resource")).toHaveCount(10); // the nine collections plus Topics (since 2026-10-06)
  await page.goto("/study/versions#coverage");
  await expect(page.getByLabel("Inspect a book")).toBeVisible();
  expect(requests.some(url => /xref-(arcs|books)\.json/.test(url))).toBe(false);
  await page.getByRole("link", { name: "Study", exact: true }).last().click();
  await expect(page).toHaveURL(new RegExp("/study$"));
  await expect(page.locator(".chart-area")).toHaveCount(0);
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
  await expect(page.getByRole("heading", { name: "Where he speaks", exact: true, level: 2 })).toBeInViewport();
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
  await expect(page.getByRole("link", { name: "Return to the Study collection ↑" })).toHaveAttribute("href", "/study");
});
