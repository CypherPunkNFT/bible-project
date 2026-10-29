import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

// 3,769 works store their language as a list (["en"]) instead of one code; reading one used to replace the whole
// page with "This page could not be shown." Checked on the public build, where no local library hides them.
// Run: node node_modules/@playwright/test/cli.js test -c e2e/language-lists.config.ts

const LIBRARY = "public/content/teacher-library";
interface Collection { id: string; source: string; records: number; readable: number }
interface Row { id: string; title: string; language: unknown }
const read = <T,>(file: string) => JSON.parse(readFileSync(file, "utf8")) as T;
const COLLECTIONS = read<Collection[]>(`${LIBRARY}/collections/index.json`);
/** Every collection view holding a list-language row, with those rows' ids; read from the files the page loads. */
const AFFECTED = COLLECTIONS.flatMap(c => (["all", "readable"] as const).map(view => {
  const folder = `${LIBRARY}/collections/${c.id}/${view}-500`;
  const rows = existsSync(folder) ? readdirSync(folder).sort((a, b) => parseInt(a) - parseInt(b)).flatMap(f => read<Row[]>(`${folder}/${f}`)) : [];
  return { ...c, view, count: rows.length, listed: rows.filter(r => Array.isArray(r.language)).map(r => r.id) };
})).filter(v => v.listed.length);
const shelf = (id: string) => read<Record<string, Row[]>>(`${LIBRARY}/contributors/${createHash("sha256").update(id).digest("hex").slice(0, 2)}.json`)[id];
/** A work record with a list language, found by title (the Heidelberg Catechism, which the audit opened). */
function listedRecord(title: string) {
  for (const file of readdirSync(`${LIBRARY}/records`)) {
    const found = Object.values(read<Record<string, Row>>(`${LIBRARY}/records/${file}`)).find(r => r.title === title && Array.isArray(r.language));
    if (found) return found;
  }
  throw new Error(`no record titled ${title} with a list language`);
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  return errors;
}
async function expectShown(page: Page, errors: string[]) {
  await expect(page.getByText("This page could not be shown.")).toHaveCount(0);
  await expect(page.getByText(/This section could not be shown/)).toHaveCount(0);
  expect(errors).toEqual([]);
}

test("the data still holds the 10 collections the audit found", () => {
  expect(AFFECTED.map(v => v.view)).toEqual(Array(10).fill("all"));
  expect(AFFECTED.reduce((n, v) => n + v.listed.length, 0)).toBe(3770);
});

for (const v of AFFECTED) {
  test(`${v.source.slice(0, 60)}: every list-language row is drawn, under All catalogue records`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/teachers/works?collection=${v.id}&view=${v.view}`);
    const rows = page.locator(".acq-collection-rows");
    await expect(rows.locator("li").first()).toBeVisible();
    // Down the whole list a step at a time (each step well inside the 50 rows drawn below the screen), noting the
    // text of every list-language row as it is drawn, until the last row has arrived and been drawn.
    const wanted = new Set(v.listed), seen = new Map<string, string>();
    for (let step = 0; step < 2000; step++) {
      const drawn = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>(".acq-collection-rows > li[data-id]"), li => [li.dataset.id!, li.querySelector("span")?.textContent ?? "", li.dataset.row!] as const));
      for (const [id, text] of drawn) if (wanted.has(id)) seen.set(id, text);
      if (drawn.some(([, , row]) => Number(row) === v.count - 1)) break;
      await page.evaluate(() => scrollBy(0, innerHeight * 2));
      await page.waitForTimeout(40);
      await expect(page.getByRole("status").filter({ hasText: "Loading more works…" })).toHaveCount(0, { timeout: 30_000 });
    }
    await expectShown(page, errors);
    expect([...wanted].filter(id => !seen.has(id))).toEqual([]);
    for (const text of seen.values()) expect(text).toMatch(/ · English$/);
  });
}

test("a work page whose language is a list", async ({ page }) => {
  const errors = watchErrors(page), work = listedRecord("Heidelberg Catechism");
  await page.goto(`/teachers/works/${encodeURIComponent(work.id)}`);
  await expect(page.getByRole("heading", { level: 1, name: "Heidelberg Catechism" })).toBeVisible();
  await expect(page.locator(".tp-kicker").first()).toHaveText(/ · English$/);
  await expectShown(page, errors);
});

for (const [id, name] of [["author-louis-berkhof", "Louis Berkhof"], ["author-john-calvin", "John Calvin"]]) {
  test(`${name}'s shelf, at its first page holding list-language works`, async ({ page }) => {
    const errors = watchErrors(page), page20 = Math.floor(shelf(id).findIndex(r => Array.isArray(r.language)) / 20);
    expect(page20).toBeGreaterThanOrEqual(0);
    await page.goto(`/teachers/works?author=${id}`);
    const card = page.locator(".acq-contributors details").filter({ has: page.locator("summary strong", { hasText: name }) }).first();
    await card.locator("summary").click();
    const list = card.locator(".acq-works ul > li");
    await expect(list.first()).toBeVisible();
    for (let i = 0; i < page20; i++) await card.getByRole("button", { name: "Next" }).click();
    if (page20) await expect(card.locator(".acq-pagination span")).toHaveText(new RegExp(`^${page20 + 1} / `));
    await expect(list.filter({ hasText: "English ·" }).first()).toBeVisible();
    await expectShown(page, errors);
  });
}
