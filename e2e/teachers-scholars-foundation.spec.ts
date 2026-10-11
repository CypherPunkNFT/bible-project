import { expect, test } from '@playwright/test';

test('live headings and all jump links share consecutive numbering', async ({ page }) => {
  await page.goto('/teachers/scholars');
  const ids = ['catalogue', 'built', 'discoveries', 'named', 'numbers', 'directory'];
  await expect(page.locator('.lnd-jump a')).toHaveCount(6);
  for (const [i, id] of ids.entries()) {
    const number = String(i + 1).padStart(2, '0');
    await expect(page.locator(`#${id} .tp-num`)).toHaveText(number);
    await expect(page.locator(`.lnd-jump a[href="#${id}"] b`)).toHaveText(number);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
