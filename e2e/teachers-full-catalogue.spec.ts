import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const index = JSON.parse(readFileSync('content/teachers/field-shelves.json', 'utf8'));
const total = index.entries.length + index.coverage.withoutSubjectMatch;
test.beforeEach(async ({ page }) => {
  await page.goto('/teachers/scholars#catalogue');
  await expect(page.locator('.cat-count')).toContainText(`${total.toLocaleString()} of ${total.toLocaleString()}`);
});
test('all contributors are reachable with bounded cards, unclassified names and preserved profiles', async ({ page }) => {
  await expect(page.locator('.cat-grid .cat-card')).toHaveCount(48);
  const pages = page.getByRole('combobox', { name: 'Catalogue page', exact: true });
  await pages.selectOption(String(Math.ceil(total / 48) - 1));
  await expect(page.locator('.cat-grid .cat-card')).toHaveCount(total % 48 || 48);
  await page.getByLabel('No assigned field', { exact: true }).check();
  await expect(page.locator('.cat-count')).toContainText(index.coverage.withoutSubjectMatch.toLocaleString());
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
  const seen = new Set<string>();
  const pagination = page.getByRole('navigation', { name: 'Catalogue pages' });
  for (;;) {
    for (const id of await page.locator('.cat-grid [data-id]').evaluateAll(es => es.map(e => e.getAttribute('data-id')!))) seen.add(id);
    if (await pagination.getByRole('button', { name: 'Next', exact: true }).isDisabled()) break;
    await pagination.getByRole('button', { name: 'Next', exact: true }).click();
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
