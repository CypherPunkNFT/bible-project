import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const index = JSON.parse(readFileSync('content/teachers/field-shelves.json', 'utf8'));
const total = index.entries.length + index.coverage.withoutSubjectMatch;
test.beforeEach(async ({ page }) => {
  await page.goto('/teachers/scholars#catalogue');
  await expect(page.locator('.cat-count')).toContainText(`${total.toLocaleString()} of ${total.toLocaleString()}`);
});
// The card view draws a window of rows (the rows on screen plus 50 above and below; e2e/virtual-lists.spec.ts checks
// the window itself), so every contributor is reachable by scrolling without the whole list being drawn at once.
test('all contributors are reachable with bounded cards, unclassified names and preserved profiles', async ({ page }) => {
  const cards = page.locator('.cat-grid .cat-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeLessThan(total);
  await expect(page.getByRole('navigation', { name: 'Catalogue pages' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Show more contributors/ })).toHaveCount(0);
  const scroller = page.locator('.cat-scroll');
  await scroller.scrollIntoViewIfNeeded();
  const first = await cards.first().elementHandle();
  const windowY = await page.evaluate(() => scrollY);
  const position = await scroller.evaluate(async e => {
    e.scrollTop = (e.scrollHeight - e.clientHeight) * .41;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return e.scrollTop;
  });
  // Far down the list the first cards are released, the page itself does not scroll, and the place holds.
  await expect.poll(() => first!.evaluate(e => e.isConnected)).toBe(false);
  expect(Math.abs(await scroller.evaluate(e => e.scrollTop) - position)).toBeLessThan(400);
  expect(await page.evaluate(() => scrollY)).toBe(windowY);
  expect(await cards.count()).toBeLessThan(total);
  await page.getByLabel('No assigned field', { exact: true }).check();
  await expect(page.locator('.cat-count')).toContainText(index.coverage.withoutSubjectMatch.toLocaleString());
  await expect(cards.first()).toBeVisible();
  expect(await scroller.evaluate(e => e.scrollTop)).toBe(0);
  const unknown = page.locator('.cat-library-card').first();
  await expect(unknown).toContainText('Field unassigned');
  await unknown.getByRole('button').click();
  await expect(page.locator('.cat-shelf .fld-works a').first()).toBeVisible();
  await page.getByRole('button', { name: 'Clear all', exact: true }).click();
  await page.getByRole('combobox', { name: 'Entry type', exact: true }).selectOption('profiles');
  await expect(page.locator('.cat-count')).toContainText('36 of');
  await page.getByRole('button', { name: 'Open the profile of Flavius Josephus', exact: true }).click();
  await expect(page.locator('.tp-scholars [role="dialog"]')).toContainText('Flavius Josephus');
  await page.keyboard.press('Escape');
  await expect(page.locator('.tp-sec-fields')).toHaveCount(0);
  await expect(page.locator('.acq-catalogue')).toHaveCount(0);
});
test('every Latin Fathers contributor and CCEL contributor is present in the unified catalogue', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Collection', exact: true }).selectOption('latin-fathers');
  await expect(page.locator('.cat-count')).toContainText(`${index.coverage.collections['latin-fathers']} of`);
  // Scroll the whole list, collecting every card drawn on the way (rows far from the view are released).
  const seen = new Set<string>();
  for (let step = 0; step < 200; step++) {
    (await page.locator('.cat-grid > [data-id]').evaluateAll(es => es.map(e => e.getAttribute('data-id')!))).forEach(id => seen.add(id));
    const end = await page.locator('.cat-scroll').evaluate(async e => {
      const atEnd = e.scrollTop + e.clientHeight >= e.scrollHeight - 1;
      e.scrollTop += e.clientHeight;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return atEnd;
    });
    if (end) break;
  }
  expect(seen.size).toBe(index.coverage.collections['latin-fathers']);
  await page.getByRole('combobox', { name: 'Collection', exact: true }).selectOption('ccel');
  await expect(page.locator('.cat-count')).toContainText(`${index.coverage.collections.ccel} of`);
  await page.getByRole('searchbox', { name: 'Search the scholars', exact: true }).fill('Ambrose of Milan');
  await page.getByRole('button', { name: 'Browse held works by Ambrose of Milan', exact: true }).click();
  await expect(page.locator('.cat-shelf')).toContainText('Ambrose of Milan');
  await expect(page.locator('.cat-shelf .fld-works a').first()).toBeVisible();
  await page.locator('.cat-shelf .fld-works input').fill('NPNF2-10');
  await page.locator('.cat-shelf .fld-works a').click();
  await expect(page.locator('.acq-reader h1')).toContainText('Ambrose');
});
test('landing search covers library-only authors and catalogue scroll stays internal', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Search the full catalogue', exact: true }).fill('Tertullian');
  await page.locator('.lnd-full-search button').click();
  await expect(page.getByRole('button', { name: 'Browse held works by Tertullian', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all', exact: true }).click();
  const scroll = page.locator('.cat-scroll');
  await scroll.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await scroll.hover(); await page.mouse.wheel(0, 400);
  await expect.poll(() => scroll.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('saved Fields mockup remains interactive and independent of the live catalogue', async ({ page }) => {
  await page.goto('/mockups/scholars-fields-archive/');
  await expect(page.locator('.fld-card')).toHaveCount(5);
  await expect(page.locator('[data-field="history"] .fld-featured')).toHaveCount(10);
  await page.locator('[data-field="history"] .fld-head').click();
  await expect(page.locator('[data-field="history"] .fld-head')).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('searchbox', { name: 'Search History', exact: true }).fill('Josephus');
  await page.getByRole('button', { name: 'Open the profile of Flavius Josephus', exact: true }).click();
  await expect(page.locator('[role="dialog"]')).toContainText('Flavius Josephus');
});
