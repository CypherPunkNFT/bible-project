import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
const { summary } = JSON.parse(readFileSync('content/teachers/contributor-facts.json', 'utf8'));

test('opening uses audited counts and clears previous catalogue restrictions when searching', async ({ page }) => {
  await page.goto('/teachers/scholars');
  const figures = page.locator('#landing .lnd-figs dd');
  await expect(figures).toHaveText([summary.catalogueEntries.toLocaleString(), '5', (summary.catalogueEntries - summary.eras.unknown).toLocaleString(), summary.eras.unknown.toLocaleString()]);
  await page.getByRole('combobox', { name: 'Entry type', exact: true }).selectOption('profiles');
  const search = page.getByRole('searchbox', { name: 'Search the full catalogue', exact: true });
  await search.fill('Tertullian');
  await expect(page.locator('.lnd-library-results')).toContainText('Tertullian');
  await search.press('Enter');
  await expect(page.locator('#catalogue').getByRole('button', { name: 'Browse held works by Tertullian', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Entry type', exact: true })).toHaveValue('');
  await search.fill('zzzz-unfindable');
  await expect(page.locator('#opening-search-status')).toContainText('0 matching entries');
  await expect(page.locator('.lnd-library-results')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('subject navigation agrees with the full catalogue and library marks have working destinations', async ({ page }) => {
  await page.goto('/teachers/scholars');
  const cluster = page.locator('.lnd-cluster').filter({ has: page.getByRole('button', { name: 'Archaeology & places', exact: true }) });
  await expect(cluster.locator('h3 > span')).toHaveText(summary.subjectCounts.places.toLocaleString());
  await cluster.locator('h3 button').click();
  await expect(page.locator('.cat-count')).toContainText(`${summary.subjectCounts.places} of`);
  const credit = page.locator('.lnd-cluster-marks button[aria-label^="Find "]').first();
  const label = (await credit.getAttribute('aria-label'))!;
  await credit.click();
  await expect(page.locator('.cat-grid')).toContainText(label.slice(5, -17));
});
