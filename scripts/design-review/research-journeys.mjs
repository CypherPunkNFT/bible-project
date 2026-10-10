// Focused M04 interactions, legacy notebook protection and public-host draft boundary.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { BASE, launch, newContext, open } from "./browser.mjs";

const base = "/review/research";
const data = JSON.parse(readFileSync(new URL("../../design/research-phase-2/preview.json", import.meta.url), "utf8"));
const notebookKey = "bp-apologetics-notebook-v1";
const notebook = JSON.stringify({ saved: ["assurance"], read: ["canon"], notes: { assurance: "Keep this existing reader note." } });
const results = [];
const browser = await launch();
try {
  for (const width of [400, 1440]) for (const theme of ["light", "dark"]) {
    const context = await newContext(browser, { width, theme });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await open(page, base + "/cases/hezekiah-assyria");
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [notebookKey, notebook]);
    await page.getByRole("link", { name: "Examine the evidence record", exact: true }).click();
    await page.waitForURL("**/evidence/sennacherib-022");
    assert.equal(await page.locator("h1").innerText(), data.sources[0].title);
    const citation = page.locator(".rs-citation").first();
    await page.keyboard.press("Tab");
    const summary = citation.locator("summary");
    const beforeFocus = await summary.evaluate(el => getComputedStyle(el).backgroundColor);
    await summary.focus();
    const focused = await summary.evaluate(el => ({ visible: el.matches(":focus-visible"), background: getComputedStyle(el).backgroundColor }));
    assert.ok(focused.visible && focused.background !== beforeFocus, "Keyboard focus must be visible");
    await page.keyboard.press("Enter");
    assert.equal(await citation.getAttribute("open"), "");
    assert.ok((await citation.innerText()).includes(data.sources[0].citation.quote));
    await page.getByRole("link", { name: /Open the bibliographic record/ }).click();
    await page.waitForURL("**/works/sennacherib-022");
    await page.locator('.rs-contributors a[href$="/contributors/grayson"]').click();
    await page.waitForURL("**/contributors/grayson");
    await page.locator('.rs-related a[href$="/study/prayer-under-pressure"]').click();
    await page.waitForURL("**/study/prayer-under-pressure");
    await page.waitForFunction(() => document.querySelector(".rs-passage")?.textContent.includes("spread it before the LORD"));
    const verseSize = await page.locator(".rs-passage > div:nth-child(2) > span").first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(verseSize >= 15, "Scripture text is readable");
    await page.getByLabel("Your reflection for this visit").fill("A reflection kept only for this visit.");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), notebookKey), notebook);
    await page.locator('.rs-nav a[href$="/works"]').click();
    const search = page.getByRole("searchbox", { name: "Search works and editions" });
    await search.fill("Novotny");
    assert.equal(await page.locator(".rs-source-tile").count(), 1);
    assert.ok((await page.locator(".rs-source-tile").innerText()).includes("Sennacherib"));
    await search.fill("no-such-edition");
    assert.ok(await page.getByText(/No edition matches/).isVisible());
    await search.fill("Greek Mark");
    await page.locator(".rs-source-tile").click();
    await page.locator('.rs-related a[href$="/cases/sinaiticus-mark-ending"]').click();
    await page.waitForURL("**/cases/sinaiticus-mark-ending");
    assert.ok(await page.getByText("Closing title after verse 8", { exact: true }).isVisible());
    assert.ok(await page.getByText("Continues with verses 9–20", { exact: true }).isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "No horizontal overflow");
    await open(page, "/apologetics/study/assurance");
    assert.notEqual(await page.locator("h1").innerText(), "Nothing is written here.");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), notebookKey), notebook);
    await open(page, base + "/works/missing");
    assert.equal(await page.locator("h1").innerText(), "Nothing is written here.");
    assert.deepEqual(errors, []);
    results.push({ width, theme, passed: true, journey: "case → evidence → edition → contributor → lesson → catalogue → manuscript case", scriptureFontPx: verseSize, legacyNotebookPreserved: true });
    await context.close();
  }
  // Exercise a non-loopback origin without sending any request to an external server.
  const publicContext = await browser.newContext();
  let draftRequests = 0;
  await publicContext.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/mockups/research-phase-2")) draftRequests++;
    if (url.hostname !== "public-research.test") return route.abort();
    const response = await publicContext.request.get(BASE + url.pathname + url.search);
    await route.fulfill({ response });
  });
  const publicPage = await publicContext.newPage();
  await publicPage.goto("http://public-research.test" + base, { waitUntil: "networkidle" });
  assert.equal(await publicPage.locator("h1").innerText(), "Nothing is written here.");
  assert.equal(draftRequests, 0);
  await publicContext.close();
  const report = { passed: true, checkedAt: new Date().toISOString(), results, publicHost: { showsNotFound: true, draftRequests } };
  writeFileSync(new URL("../../design/review/research-phase-2-journeys.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
