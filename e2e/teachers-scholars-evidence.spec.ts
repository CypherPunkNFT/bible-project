import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
const { summary } = JSON.parse(readFileSync('content/teachers/contributor-facts.json', 'utf8'));

test('era facets include the full evidence-backed catalogue and explicit unknowns', async ({ page }) => {
  await page.goto('/teachers/scholars#catalogue');
  const cat = page.locator('#catalogue');
  await expect(cat.locator('.cat-count')).toContainText(summary.catalogueEntries.toLocaleString());
  for (const era of ['ancient', 'medieval', 'early-modern', 'modern']) await expect(cat.locator(`.cat-opt[data-facet="era"][data-value="${era}"] em`)).toHaveText(String(summary.eras[era]));
  await cat.getByRole('checkbox', { name: 'Era unknown', exact: true }).check();
  await expect(cat.locator('.cat-count')).toContainText(`${summary.eras.unknown.toLocaleString()} of`);
  await cat.locator('.cat-opt[data-facet="era"][data-value="ancient"]').click();
  await expect(cat.locator('.cat-count')).toContainText(`${(summary.eras.unknown + summary.eras.ancient).toLocaleString()} of`);
  await cat.getByRole('button', { name: 'Clear all', exact: true }).click();
  await cat.locator('.cat-opt[data-facet="field"][data-value="places"]').click();
  await expect(cat.locator('.cat-count')).toContainText(`${summary.subjectCounts.places} of`);
  await cat.getByRole('checkbox', { name: 'Use documented expertise for fields' }).check();
  await expect(cat.locator('.cat-count')).toContainText(`${summary.expertiseCounts.places} of`);
});

test('restored attribution credits have evidence and held works load continuously', async ({ page }) => {
  await page.goto('/teachers/scholars#catalogue');
  const cat = page.locator('#catalogue');
  await cat.getByRole('searchbox', { name: 'Search the scholars' }).fill('Cuthbert Lennox');
  await expect(cat.locator('.cat-library-card')).toContainText('editor');
  await cat.getByRole('button', { name: 'Browse held works by Cuthbert Lennox', exact: true }).click();
  await cat.locator('.cat-evidence summary').click();
  await expect(cat.locator('.cat-evidence')).toContainText('Signed Introductory Note');
  await expect(cat.locator('.fld-works a')).toHaveCount(1);
  await cat.getByRole('searchbox', { name: 'Search the scholars' }).fill('Particular Baptist churches and messengers');
  await cat.getByRole('button', { name: 'Browse held works by Particular Baptist churches and messengers', exact: true }).click();
  const scroll = cat.locator('.fld-works-scroll');
  await expect(scroll.locator('li')).toHaveCount(20);
  const first = await scroll.locator('li').first().elementHandle();
  await scroll.evaluate(e => { e.scrollTop = (e.scrollHeight - e.clientHeight) * .2; });
  await expect(scroll.locator('li')).toHaveCount(20);
  const position = await scroll.evaluate(e => { e.scrollTop = (e.scrollHeight - e.clientHeight) * .41; return e.scrollTop; });
  await expect(scroll.locator('li')).toHaveCount(40);
  expect(await scroll.evaluate(e => e.scrollTop)).toBe(position);
  expect(await first!.evaluate(e => e.isConnected)).toBe(true);
  await expect(cat.getByRole('navigation', { name: /work pages/ })).toHaveCount(0);
  await cat.getByRole('searchbox', { name: 'Find a held work' }).fill('1695 Baptist Catechism');
  await expect(scroll.locator('li')).toHaveCount(1);
  expect(await scroll.evaluate(e => e.scrollTop)).toBe(0);
});
