import { expect, test } from '@playwright/test';
import { geoCentroid, geoOrthographic } from 'd3-geo';
import { readFileSync } from 'node:fs';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
const atlas = JSON.parse(readFileSync('public/assets/muslim-world/atlas.json', 'utf8')) as { countries: Feature<Polygon | MultiPolygon, { code: string }>[] };

const route = '/apologetics/worldviews/islam';
test('country selection, demographics, source links and group examples preserve the comparison', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(route + '?question=jesus&country=PAK#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('heading', { name: 'Pakistan', exact: true })).toBeVisible();
  await expect(explorer.getByRole('group', { name: /^Interactive globe/ })).toHaveAttribute('aria-busy', 'false');
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

test('clicking an actual projected country selects its profile; wheel and keyboard gestures work without control buttons', async ({ page }) => {
  await page.goto(route + '?country=SAU#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('group', { name: /^Interactive globe/ })).toHaveAttribute('aria-busy', 'false');
  const stage = explorer.getByRole('group', { name: /^Interactive globe/ });
  const box = (await stage.boundingBox())!;
  const saudi = geoCentroid(atlas.countries.find(c => c.properties.code === 'SAU') as Feature<Polygon | MultiPolygon>);
  const projection = geoOrthographic().rotate([-saudi[0], -saudi[1]]).scale(Math.min(box.width, box.height) * .49).translate([box.width / 2, box.height / 2]);
  const egypt = projection([29.877917299852545, 26.459585778678562])!;
  await stage.click({ position: { x: egypt[0], y: egypt[1] } });
  await expect(explorer.getByRole('heading', { name: 'Egypt', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/country=EGY/);
  await expect(explorer.locator('.mw-globe button')).toHaveCount(0);
  expect(Math.abs(box.width - box.height)).toBeLessThan(2);
  await stage.focus(); await page.keyboard.press('Home');
  await expect.poll(async () => stage.locator('canvas').last().evaluate(canvas => {
    const image = (canvas as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, (canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height);
    let left = image.width, right = 0;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) if (image.data[(y * image.width + x) * 4 + 3]) { left = Math.min(left, x); right = Math.max(right, x); }
    return (right - left) / image.width;
  })).toBeGreaterThan(.96);
  await stage.hover(); const scrollBefore = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 200); await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  const shrunk = await stage.locator('canvas').last().evaluate(canvas => {
    const c = canvas as HTMLCanvasElement; const pixels = c.getContext('2d')!.getImageData(0, c.height / 2, c.width, 1).data;
    let left = c.width, right = 0; for (let x = 0; x < c.width; x++) if (pixels[x * 4 + 3]) { left = Math.min(left, x); right = Math.max(right, x); }
    return (right - left) / c.width;
  });
  expect(shrunk).toBeLessThan(.85);
  await page.mouse.wheel(0, -200); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Home');
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
  await expect(explorer.getByRole('group', { name: /^Interactive globe/ })).toHaveAttribute('aria-busy', 'false');
  await expect(explorer).toContainText('Geographic map view');
  await explorer.getByRole('combobox', { name: 'Choose a country', exact: true }).selectOption('MYT');
  await expect(explorer.getByRole('heading', { name: 'Mayotte', exact: true })).toBeVisible();
  await page.route('**/assets/muslim-world/atlas.json', route => route.abort());
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
  await expect(explorer.getByRole('group', { name: /^Interactive globe/ })).toHaveAttribute('aria-busy', 'false');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await explorer.screenshot({ path: testInfo.outputPath('muslim-world-' + theme + '.png'), style: '.sticky.top-0{visibility:hidden}' });
  }
  await page.goto('/apologetics/worldviews/buddhism');
  await expect(page.locator('#muslim-world')).toHaveCount(0);
});
