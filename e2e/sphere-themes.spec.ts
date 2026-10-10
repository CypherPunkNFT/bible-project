import { expect, test } from '@playwright/test';

declare global { interface Window { sphereRadius: number } }
const route = '/apologetics/worldviews/islam?country=PAK';
const samples = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')!;
  return [0.25, 0.4, 0.6, 0.75].flatMap(y => [0.25, 0.4, 0.6, 0.75].flatMap(x => [...ctx.getImageData(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1).data])).join(',');
};

test('sixteen sphere cards recolour one canvas while preserving zoom, selection and cached geography', async ({ page }) => {
  const errors: string[] = []; let atlasRequests = 0;
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().endsWith('/muslim-world/atlas.json')) atlasRequests++; });
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.arc = function (...args) {
      if (this.canvas.parentElement?.classList.contains('mw-globe-stage')) window.sphereRadius = args[2];
      return original.apply(this, args);
    };
  });
  await page.goto(route + '#muslim-world');
  const stage = page.locator('.mw-globe-stage');
  await expect(stage).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('complementary', { name: 'Sphere theme mock-up' })).toHaveCount(0);
  const baseline = await stage.locator('canvas').evaluate(samples);
  await page.goto(route + '&globeDesign=a#muslim-world');
  const preview = page.getByRole('complementary', { name: 'Sphere theme mock-up' });
  await expect(stage).toHaveAttribute('aria-busy', 'false');
  await expect(preview.getByRole('button')).toHaveCount(16);
  await preview.scrollIntoViewIfNeeded();
  for (const image of await preview.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(256);
  }
  expect(await page.locator('canvas').count()).toBe(1);
  await stage.scrollIntoViewIfNeeded();
  await expect.poll(() => stage.locator('canvas').evaluate(samples)).toBe(baseline);
  const canvas = await stage.locator('canvas').elementHandle();
  const requestsBefore = atlasRequests;
  const seen = new Set<string>();
  for (const [id, name] of [['A', 'Earth'], ['B', 'Midnight'], ['C', 'Quiet olive'], ['D', 'Blue slate'], ['E', 'Deep forest'], ['F', 'Atlantic'], ['G', 'Warm shore'], ['H', 'Smoke blue'], ['I', 'Moss'], ['J', 'Deep navy'], ['K', 'Charcoal'], ['L', 'Silver coast'], ['M', 'Muted teal'], ['N', 'Dusk'], ['O', 'Soft earth'], ['P', 'Quiet midnight']]) {
    const button = preview.getByRole('button', { name: `Sphere theme ${id}: ${name}`, exact: true });
    const before = await stage.locator('canvas').evaluate(samples);
    await button.click(); await expect(button).toHaveAttribute('aria-pressed', 'true');
    await stage.scrollIntoViewIfNeeded();
    if (id !== 'A') await expect.poll(() => stage.locator('canvas').evaluate(samples)).not.toBe(before);
    seen.add(await stage.locator('canvas').evaluate(samples));
    expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
    await expect(page).toHaveURL(new RegExp(`globeDesign=${id.toLowerCase()}`));
    const box = (await stage.boundingBox())!;
    expect(Math.abs(box.width - box.height)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
  expect(seen.size).toBe(16);
  await stage.focus(); const radius = await page.evaluate(() => window.sphereRadius); await page.keyboard.press('+');
  await expect.poll(() => page.evaluate(() => window.sphereRadius)).toBeGreaterThan(radius);
  const zoomed = await page.evaluate(() => window.sphereRadius);
  const pixels = await stage.locator('canvas').evaluate(samples);
  await preview.getByRole('button', { name: 'Sphere theme B: Midnight', exact: true }).click();
  await stage.scrollIntoViewIfNeeded();
  await expect.poll(() => stage.locator('canvas').evaluate(samples)).not.toBe(pixels);
  expect(await page.evaluate(() => window.sphereRadius)).toBe(zoomed);
  await page.getByRole('button', { name: 'Search countries', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Find a country', exact: true }).fill('Iran');
  await page.getByRole('searchbox', { name: 'Find a country', exact: true }).press('Enter');
  await expect(page.locator('#muslim-world').getByRole('heading', { name: 'Iran', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/globeDesign=b/);
  await page.getByRole('button', { name: 'Flat map view', exact: true }).click();
  await expect(stage).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Globe view', exact: true }).click();
  await expect(stage).toHaveAttribute('aria-busy', 'false');
  expect(atlasRequests).toBe(requestsBefore);
  expect(errors).toEqual([]);
});
