import { expect, test } from '@playwright/test';

test('eight theme-native panels switch outside the atlas; correct faith bars, complete groups and external scrolling stay usable', async ({ page }) => {
  let atlasRequests = 0;
  page.on('request', request => { if (request.url().endsWith('/muslim-world/atlas.json')) atlasRequests++; });
  await page.goto('/apologetics/worldviews/islam?country=EGY&atlasDesign=a#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Christianity');
  await expect(explorer.locator('.mw-globe-stage')).toHaveAttribute('aria-busy', 'false');
  const canvas = await explorer.locator('.mw-globe-stage canvas').elementHandle();
  const picker = page.getByRole('complementary', { name: 'Atlas design review' });
  await expect(picker.getByRole('button')).toHaveCount(8);
  expect(await picker.evaluate(node => node.closest('#muslim-world') === null)).toBe(true);
  const structures = { A: '.mw-pg-ledger', B: '.mw-pg-editorial', C: '.mw-pg-sections', D: '.mw-pg-directory', E: '.mw-pg-focus', F: '.mw-pg-languages', G: '.mw-pg-matrix', H: '.mw-pg-sheets' };
  for (const design of Object.keys(structures)) {
    await picker.getByRole('button', { name: `Design ${design}`, exact: true }).click();
    await expect(picker.getByRole('button', { name: `Design ${design}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
    await expect(explorer.getByRole('combobox', { name: 'Filter countries by region' })).toHaveCount(0);
    await expect(explorer.getByRole('searchbox', { name: 'Find a country', exact: true })).toHaveAttribute('placeholder', 'Search all 53 countries');
    await expect(explorer.locator(`.mw-header-${design.toLowerCase()}`)).toHaveCount(1);
    if (design === 'A') {
      await expect(explorer.locator('.mw-header-a-identity h3')).toHaveText('Egypt');
      expect(await explorer.locator('.mw-header-a .mw-country-flag').evaluate(node => node.getBoundingClientRect().width)).toBe(80);
      await expect(explorer.locator('.mw-header-a-population strong')).toHaveText('109.3M');
      const christian = explorer.getByRole('meter', { name: 'Christian identification in Egypt, 2020' });
      await expect(christian).toHaveAttribute('aria-valuenow', '4.8');
      const muslim = explorer.getByRole('meter', { name: 'Muslim identification in Egypt, 2020' });
      await expect(muslim).toHaveAttribute('aria-valuenow', '95.2');
      expect(await christian.locator('span').evaluate(node => node.getBoundingClientRect().width / node.parentElement!.getBoundingClientRect().width)).toBeCloseTo(.048, 2);
      expect(await muslim.locator('span').evaluate(node => node.getBoundingClientRect().width / node.parentElement!.getBoundingClientRect().width)).toBeCloseTo(.952, 2);
    }
    if (design === 'C') await expect(explorer.locator('.mw-prototype-tiles > div')).toHaveCount(3);
    await explorer.getByRole('tab', { name: /People Groups/ }).click();
    await expect(explorer.locator(structures[design as keyof typeof structures])).toHaveCount(1);
    await expect(explorer.locator('[data-people-group]')).toHaveCount(23);
    await expect(explorer.getByRole('combobox', { name: 'Filter people groups by engagement' })).toHaveCount(0);
    for (const [label, count] of [['Unengaged and unreached', 7], ['Engaged yet unreached', 15], ['No longer unreached', 1]] as const) {
      await explorer.getByRole('button', { name: new RegExp(`^${label}`) }).click();
      await expect(explorer.locator('[data-people-group]')).toHaveCount(count);
    }
    await explorer.getByRole('button', { name: /^All groups/ }).click();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      expect(await explorer.locator('.mw-pg-unengaged').first().evaluate(node => getComputedStyle(node).getPropertyValue('--pg-color').trim())).toBe(await page.locator('html').evaluate(node => getComputedStyle(node).getPropertyValue('--history').trim()));
    }
    if (design === 'E') {
      await explorer.locator('.mw-pg-focus-index button').nth(1).click();
      expect(await explorer.locator('.mw-pg-focus-detail h4').innerText()).toContain(await explorer.locator('.mw-pg-focus-index button').nth(1).locator('span').innerText());
    }
    await explorer.getByRole('searchbox', { name: 'Search people groups' }).fill('Egyptian Arabs');
    await expect(explorer.locator('[data-people-group]')).toHaveCount(1);
    await expect(explorer.locator('[data-people-group]').first()).toContainText('Egyptian Arabs');
    await explorer.getByRole('searchbox', { name: 'Search people groups' }).fill('');
    if (design === 'D') {
      await explorer.locator('.mw-pg-entry summary').first().click();
      await expect(explorer.locator('.mw-pg-entry').first()).toHaveAttribute('open', '');
      await expect(explorer.locator('.mw-pg-entry-details').first()).toContainText('Language');
    }
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
  await expect(explorer.locator('.mw-header-h h3')).toHaveText('Iran');
  await explorer.getByRole('tab', { name: /People Groups/ }).click();
  await expect(explorer.locator('[data-people-group]')).toHaveCount(47);
});
