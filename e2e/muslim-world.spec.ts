import { expect, test } from '@playwright/test';
import { geoCentroid, geoEqualEarth, geoOrthographic } from 'd3-geo';
import { readFileSync } from 'node:fs';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
const atlas = JSON.parse(readFileSync('public/assets/muslim-world/atlas.json', 'utf8')) as { land: MultiPolygon; countries: Feature<Polygon | MultiPolygon, { code: string }>[] };
declare global { interface Window { missionGlobeDraws: number[] } }

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
  const projection = geoOrthographic().rotate([-saudi[0], -saudi[1]]).scale(Math.min(box.width, box.height) / 2 - 1).translate([box.width / 2, box.height / 2]);
  const egypt = projection([29.877917299852545, 26.459585778678562])!;
  await stage.click({ position: { x: egypt[0], y: egypt[1] } });
  await expect(explorer.getByRole('heading', { name: 'Egypt', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/country=EGY/);
  await expect(explorer.locator('.mw-view-switch button')).toHaveCount(2);
  expect(Math.abs(box.width - box.height)).toBeLessThan(2);
  await stage.focus(); await page.keyboard.press('Home');
  await expect.poll(async () => stage.locator('canvas').last().evaluate(canvas => {
    const image = (canvas as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, (canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height);
    let left = image.width, right = 0;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) if (image.data[(y * image.width + x) * 4 + 3]) { left = Math.min(left, x); right = Math.max(right, x); }
    return (right - left) / image.width;
  })).toBeGreaterThan(.96);
  await stage.hover(); const scrollBefore = await page.evaluate(() => scrollY);
  const wholeWorld = await stage.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL());
  await page.mouse.wheel(0, -700); await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  expect(await stage.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())).not.toBe(wholeWorld);
  // Deep zoom retains the same circular window and never leaks into its corners.
  await page.mouse.wheel(0, -5000); await page.waitForTimeout(150);
  await page.mouse.wheel(0, -5000); await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  const aperture = await stage.locator('canvas').evaluate(canvas => {
    const c = canvas as HTMLCanvasElement, image = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    let outside = 0, left = c.width, right = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (image.data[(y * c.width + x) * 4 + 3]) {
      if (Math.hypot(x-c.width/2,y-c.height/2)>c.width/2+1) outside++;
      left=Math.min(left,x);right=Math.max(right,x);
    }
    return { outside, width: (right-left)/c.width };
  });
  expect(aperture.outside).toBe(0); expect(aperture.width).toBeGreaterThan(.98);
  await page.mouse.wheel(0, 5000); await page.waitForTimeout(150);
  await page.mouse.wheel(0, 5000); await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Home');
  await expect(explorer.getByRole('heading', { name: 'Egypt', exact: true })).toBeVisible();
  // The rest of the page retains ordinary wheel scrolling.
  const viewport = page.viewportSize()!;
  await page.mouse.move(viewport.width - 2, viewport.height / 2);
  await page.mouse.wheel(0, 200); await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore);
});

test('vertical view icons switch to an SVG map, preserve selection, and contain zoom without reloading geography', async ({ page }, testInfo) => {
  let atlasRequests = 0; page.on('request', request => { if (request.url().endsWith('/muslim-world/atlas.json')) atlasRequests++; });
  await page.goto(route + '?question=jesus&country=PAK#muslim-world');
  const explorer = page.locator('#muslim-world'), globe = explorer.getByRole('button', { name: 'Globe view', exact: true }), flat = explorer.getByRole('button', { name: 'Flat map view', exact: true });
  await expect(explorer.getByRole('group', { name: /^Interactive globe/ })).toHaveAttribute('aria-busy', 'false');
  const globeBox = (await globe.boundingBox())!, flatBox = (await flat.boundingBox())!;
  expect(Math.abs(globeBox.x - flatBox.x)).toBeLessThan(1); expect(flatBox.y).toBeGreaterThan(globeBox.y + globeBox.height);
  await flat.click(); const stage = explorer.getByRole('group', { name: /^Interactive flat map/ });
  await expect(stage).toHaveAttribute('aria-busy', 'false'); await expect(flat).toHaveAttribute('aria-pressed', 'true');
  await expect(stage.locator('canvas')).toHaveCount(0); await expect(stage.locator('svg')).toHaveCount(1);
  await expect(stage.locator('.mw-flat-country')).toHaveCount(53);
  await expect(stage.locator('svg path')).toHaveCount(62);
  await expect(stage.locator('.mw-flat-country.is-selected')).toHaveAttribute('data-country', 'PAK');
  const projection = geoEqualEarth().fitExtent([[16,240],[944,720]], atlas.land);
  const point = projection(geoCentroid(atlas.countries.find(country => country.properties.code === 'EGY')!))!;
  const box = (await stage.boundingBox())!;
  await stage.click({position:{x:point[0]*box.width/960,y:point[1]*box.height/960}});
  await expect(explorer.getByRole('heading', { name: 'Egypt', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/question=jesus&country=EGY/);
  const group=stage.locator('svg > g'), before=await group.getAttribute('transform');
  await stage.hover();const scroll=await page.evaluate(()=>scrollY);
  for(const delta of [-5000,-5000,5000,5000]){await page.mouse.wheel(0,delta);await page.waitForTimeout(80);expect(await page.evaluate(()=>scrollY)).toBe(scroll);}
  await stage.focus();await page.keyboard.press('+');expect(await group.getAttribute('transform')).not.toBe(before);
  await page.keyboard.press('ArrowRight');await page.keyboard.press('Home');expect(await group.getAttribute('transform')).toBe(before);
  for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await explorer.screenshot({path:testInfo.outputPath('flat-map-'+theme+'.png'),style:'.sticky.top-0{visibility:hidden}'});}
  await globe.click();await expect(explorer.getByRole('group',{name:/^Interactive globe/})).toHaveAttribute('aria-busy','false');
  await expect(explorer.getByRole('heading',{name:'Egypt',exact:true})).toBeVisible();
  await flat.click();await expect(stage).toHaveAttribute('aria-busy','false');expect(atlasRequests).toBe(1);
  await page.reload(); await stage.scrollIntoViewIfNeeded(); await expect(stage).toHaveAttribute('aria-busy', 'false');
  await expect(explorer.getByRole('heading',{name:'Egypt',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('wheel zoom paints smoothly and stops rendering after the gesture settles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.missionGlobeDraws = [];
    const draw = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.parentElement?.classList.contains('mw-globe-stage')) window.missionGlobeDraws.push(performance.now());
      return Reflect.apply(draw, this, args);
    };
  });
  await page.goto(route + '?country=PAK#muslim-world');
  const stage = page.getByRole('group', { name: /^Interactive globe/ });
  await expect(stage).toHaveAttribute('aria-busy', 'false');
  await stage.hover(); await page.waitForTimeout(350);
  await page.evaluate(() => { window.missionGlobeDraws = []; });
  await page.mouse.wheel(0, -200); await page.waitForTimeout(350);
  const frames = await page.evaluate(() => window.missionGlobeDraws);
  expect(frames.length).toBeGreaterThanOrEqual(5);
  const intervals = frames.slice(1).map((time, index) => time - frames[index]).sort((a, b) => a - b);
  expect(intervals[Math.floor(intervals.length / 2)]).toBeLessThan(35);
  await page.evaluate(() => { window.missionGlobeDraws = []; });
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.missionGlobeDraws.length)).toBe(0);
});

test('outline globe needs no WebGL or imagery; profiles stay usable if the map fetch fails', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2' || type === 'webgl') throw new Error('The outline globe must not request WebGL.');
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto(route + '?country=MDV#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('group', { name: /^Interactive globe/ })).toHaveAttribute('aria-busy', 'false');
  await expect(explorer.locator('.mw-globe canvas')).toHaveCount(1);
  await expect(explorer.locator('.mw-map-credit')).toHaveCount(0);
  expect((await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name))).some(name => /earth\.(webp|jpg)/.test(name))).toBe(false);
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
