import { expect, test } from '@playwright/test';

test('four panel options switch in the real atlas without remounting the globe; scroll thumb is external and has no track', async ({ page }) => {
  let atlasRequests = 0;
  page.on('request', request => { if (request.url().endsWith('/muslim-world/atlas.json')) atlasRequests++; });
  await page.goto('/apologetics/worldviews/islam?country=EGY&atlasDesign=a#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Christianity');
  await expect(explorer.locator('.mw-globe-stage')).toHaveAttribute('aria-busy', 'false');
  const canvas = await explorer.locator('.mw-globe-stage canvas').elementHandle();
  for (const design of ['A', 'B', 'C', 'D']) {
    await explorer.getByRole('button', { name: `Design ${design}`, exact: true }).click();
    await expect(explorer.getByRole('button', { name: `Design ${design}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
    await expect(explorer.getByRole('combobox', { name: 'Filter countries by region' })).toHaveCount(0);
    await expect(explorer.getByRole('searchbox', { name: 'Find a country', exact: true })).toHaveAttribute('placeholder', 'Search all 53 countries');
    await explorer.getByRole('tab', { name: /People Groups/ }).click();
    await expect(explorer.locator('.mw-groups-table tbody tr')).toHaveCount(23);
    const viewport = explorer.getByRole('region', { name: 'Egypt people groups table', exact: true });
    const pill = explorer.getByRole('scrollbar', { name: 'Scroll Egypt people groups table', exact: true });
    await viewport.scrollIntoViewIfNeeded();
    await expect(pill).toBeVisible();
    const box = (await viewport.boundingBox())!, thumb = (await pill.boundingBox())!;
    expect(thumb.x).toBeGreaterThan(box.x + box.width);
    expect(await viewport.evaluate(node => getComputedStyle(node).scrollbarWidth)).toBe('none');
    await pill.focus(); await page.keyboard.press('End');
    await expect.poll(() => pill.getAttribute('aria-valuenow')).toBe('100');
    await pill.hover(); const pageScroll = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 200); await page.waitForTimeout(80);
    expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
    await page.keyboard.press('Home'); await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBe(0);
    const start = (await pill.boundingBox())!;
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.down(); await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2 + 25, { steps: 5 }); await page.mouse.up();
    await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await explorer.getByRole('tab', { name: 'Gospel Presence', exact: true }).click();
  }
  expect(atlasRequests).toBe(1);
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).fill('Iran');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).press('Enter');
  await expect(explorer.locator('.mw-prototype-identity h3')).toHaveText('Iran');
  await explorer.getByRole('tab', { name: /People Groups/ }).click();
  await expect(explorer.locator('.mw-groups-table tbody tr')).toHaveCount(47);
});
