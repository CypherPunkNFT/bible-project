import { expect, test } from '@playwright/test';
import { geoOrthographic } from 'd3-geo';

const route = '/apologetics/worldviews/islam';
test('country selection, demographics, source links and group examples preserve the comparison', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(route + '?question=jesus&country=PAK#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('heading', { name: 'Pakistan', exact: true })).toBeVisible();
  await expect(explorer.getByRole('button', { name: 'Start globe rotation' })).toBeEnabled();
  await explorer.getByRole('searchbox', { name: 'Find a country' }).fill('Indonesia');
  await explorer.getByRole('combobox', { name: 'Choose a country', exact: true }).selectOption('IDN');
  await expect(explorer.getByRole('heading', { name: 'Indonesia', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/question=jesus&country=IDN/);
  await expect(explorer).toContainText('87.0');
  await expect(explorer).toContainText('2020 estimate');
  await explorer.getByRole('button', { name: 'Meet three of the people groups' }).click();
  await expect(explorer.locator('#mw-group-examples a')).toHaveCount(3);
  await expect(explorer.locator('#mw-group-examples')).toContainText('Sunda');
  await expect(explorer.getByRole('link', { name: 'Read the full IMB profile' })).toHaveAttribute('href', 'https://peoplegroups.org/country/IDN/');
  await explorer.getByRole('searchbox', { name: 'Find a country' }).fill('xyznotacountry');
  await expect(explorer.getByRole('status')).toContainText('No matches');
  await explorer.getByRole('button', { name: 'Clear filters' }).click();
  await explorer.getByRole('combobox', { name: 'Filter countries by region' }).selectOption('europe');
  await explorer.getByRole('combobox', { name: 'Choose a country', exact: true }).selectOption('KOS');
  await expect(explorer.getByRole('heading', { name: 'Kosovo', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/question=jesus&country=KOS/);
  expect(errors).toEqual([]);
});

test('clicking an actual projected country selects its profile; rotation and zoom controls work', async ({ page }) => {
  await page.goto(route + '?country=SAU#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('button', { name: 'Start globe rotation' })).toBeEnabled();
  const stage = explorer.getByRole('group', { name: /^Interactive globe/ });
  const box = (await stage.boundingBox())!;
  const projection = geoOrthographic().rotate([-44.66316551813148, -24.086527584490447]).scale(Math.min(box.width, box.height) * .46).translate([box.width / 2, box.height / 2]);
  const egypt = projection([29.877917299852545, 26.459585778678562])!;
  await stage.click({ position: { x: egypt[0], y: egypt[1] } });
  await expect(explorer.getByRole('heading', { name: 'Egypt', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/country=EGY/);
  await explorer.getByRole('button', { name: 'Start globe rotation' }).click();
  await expect(explorer.getByRole('button', { name: 'Pause globe rotation' })).toHaveAttribute('aria-pressed', 'true');
  await explorer.getByRole('button', { name: 'Pause globe rotation' }).click();
  await explorer.getByRole('button', { name: 'Zoom in on globe' }).click();
  await explorer.getByRole('button', { name: 'Zoom out on globe' }).click();
  await explorer.getByRole('button', { name: 'Reset globe to selected country' }).click();
  await stage.focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Home');
  await expect(explorer.getByRole('heading', { name: 'Egypt', exact: true })).toBeVisible();
});

test('country data stays usable when WebGL is unavailable or map fetch fails', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2') return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto(route + '?country=MDV#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('button', { name: 'Start globe rotation' })).toBeEnabled();
  await expect(explorer).toContainText('Geographic map view');
  await explorer.getByRole('combobox', { name: 'Choose a country', exact: true }).selectOption('MYT');
  await expect(explorer.getByRole('heading', { name: 'Mayotte', exact: true })).toBeVisible();
  await page.route('**/assets/muslim-world/countries-50m.json', route => route.abort());
  await page.reload();
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('status')).toContainText('The map is unavailable.');
  await explorer.getByRole('combobox', { name: 'Choose a country', exact: true }).selectOption('BGD');
  await expect(explorer.getByRole('heading', { name: 'Bangladesh', exact: true })).toBeVisible();
});

test('both themes remain readable without overflow; invalid URL uses Pakistan and other collections have no atlas', async ({ page }, testInfo) => {
  await page.goto(route + '?country=INVALID#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('heading', { name: 'Pakistan', exact: true })).toBeVisible();
  await expect(explorer.getByRole('button', { name: 'Start globe rotation' })).toBeEnabled();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await explorer.screenshot({ path: testInfo.outputPath('muslim-world-' + theme + '.png'), style: '.sticky.top-0{visibility:hidden}' });
  }
  await page.goto('/apologetics/worldviews/buddhism');
  await expect(page.locator('#muslim-world')).toHaveCount(0);
});
