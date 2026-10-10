import { expect, test } from '@playwright/test';
import { geoCentroid, geoEqualEarth, geoOrthographic } from 'd3-geo';
import { readFileSync } from 'node:fs';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
const atlas = JSON.parse(readFileSync('public/assets/muslim-world/atlas.json', 'utf8')) as { land: MultiPolygon; countries: Feature<Polygon | MultiPolygon, { code: string }>[] };
declare global { interface Window { missionGlobeDraws: number[] } }

const route = '/apologetics/worldviews/islam';
test('flags, larger engagement overview and complete group tabs stay readable and load only the chosen country', async ({ page }) => {
  const groupRequests: string[] = [], errors: string[] = [];
  page.on('request', request => { if (request.url().includes('/muslim-world/people-groups/')) groupRequests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route + '?country=IRN#muslim-world');
  const explorer = page.locator('#muslim-world'), overview = page.getByRole('tabpanel', { name: 'Gospel Presence' });
  await expect(explorer.getByRole('heading', { name: 'Iran', exact: true })).toBeVisible();
  await expect(explorer.getByRole('img', { name: 'Iran flag', exact: true })).toHaveAttribute('src', '/assets/muslim-world/flags/IRN.svg');
  await expect.poll(() => explorer.locator('.mw-country-flag').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(overview.locator('.mw-prototype-tiles strong')).toHaveText(['26', '19', '2']);
  await expect(overview.getByRole('button', { name: 'View Unengaged and unreached people groups' })).toBeVisible();
  await expect(overview.locator('.mw-presence-title')).toHaveText(['Unengaged and unreached', 'Engaged yet unreached', 'No longer unreached']);
  expect(await explorer.locator('.mw-header-b-facts > div').last().evaluate(element => getComputedStyle(element).borderLeftWidth)).toBe('1px');
  expect(groupRequests).toEqual([]);
  await page.getByRole('tab', { name: /People Groups/ }).click();
  const groups = page.getByRole('tabpanel', { name: /People Groups/ });
  await expect(groups.locator('[data-people-group]')).toHaveCount(47);
  await expect(groups.getByRole('link', { name: 'Persians', exact: true })).toBeVisible();
  await expect(groups.locator('[data-people-group]').first()).toContainText('29,500,000');
  await groups.getByRole('button', { name: /^Unengaged and unreached/ }).click();
  await expect(groups.locator('[data-people-group]')).toHaveCount(26);
  await groups.getByRole('button', { name: /^All groups/ }).click();
  await groups.getByRole('searchbox', { name: 'Search people groups' }).fill('Persians');
  await expect(groups.locator('[data-people-group]')).toHaveCount(1);
  await groups.getByRole('searchbox', { name: 'Search people groups' }).fill('');
  const scroll = groups.getByRole('region', { name: 'Iran people groups table' });
  expect(await scroll.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await scroll.scrollIntoViewIfNeeded(); await scroll.hover(); const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 200); await expect.poll(() => scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  await page.getByRole('tab', { name: /People Groups/ }).focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Gospel Presence' })).toBeFocused();
  await expect(overview).toBeVisible();
  await page.keyboard.press('End'); await expect(groups.locator('[data-people-group]')).toHaveCount(47);
  expect(groupRequests.length).toBe(1);
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).fill('Bangladesh');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).press('Enter');
  await expect(groups.locator('.mw-group-count')).toContainText('All 56 recorded groups');
  await groups.getByRole('searchbox', { name: 'Search people groups' }).fill('Mara');
  await expect(groups.locator('.mw-pg-editorial')).toContainText('Language not reported');
  expect(groupRequests.length).toBe(2);
  await expect(page).toHaveURL(/panel=groups/);
  expect(errors).toEqual([]);
});

test('unavailable group data leaves the flag, source link and Gospel Presence usable', async ({ page }) => {
  await page.route('**/muslim-world/people-groups/IRN.json', route => route.abort());
  await page.goto(route + '?country=IRN&panel=groups#muslim-world');
  const groups = page.getByRole('tabpanel', { name: /People Groups/ });
  await expect(groups.getByRole('status')).toContainText('could not be loaded');
  await expect(groups.getByRole('link')).toHaveAttribute('href', 'https://peoplegroups.org/country/IRN/');
  await page.getByRole('tab', { name: 'Gospel Presence' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Gospel Presence' }).locator('.mw-prototype-tiles strong')).toHaveText(['26', '19', '2']);
});

test('country selection, demographics, source links and complete group tables preserve the comparison', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(route + '?question=jesus&country=PAK#muslim-world');
  const explorer = page.locator('#muslim-world');
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('heading', { name: 'Pakistan', exact: true })).toBeVisible();
  await expect(explorer.getByRole('group', { name: /^Interactive globe/ })).toHaveAttribute('aria-busy', 'false');
  await explorer.getByRole('searchbox', { name: 'Find a country' }).fill('Indonesia');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).press('Enter');
  await expect(explorer.getByRole('heading', { name: 'Indonesia', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/question=jesus&country=IDN/);
  await expect(explorer).toContainText('87.0');
  await expect(explorer).toContainText('2020 estimates');
  await explorer.getByRole('tab', { name: /People Groups/ }).click();
  await expect(explorer.locator('.mw-group-count')).toContainText('All 669 recorded groups');
  await expect(explorer.locator('[data-people-group]')).toHaveCount(669);
  await expect(explorer.locator('.mw-pg-editorial')).toContainText('Sunda');
  await explorer.getByRole('tab', { name: 'Gospel Presence' }).click();
  await expect(explorer.getByRole('link', { name: /IMB profile/ })).toHaveAttribute('href', 'https://peoplegroups.org/country/IDN/');
  await explorer.getByRole('searchbox', { name: 'Find a country' }).fill('xyznotacountry');
  await expect(explorer.getByRole('status')).toContainText('No matching countries');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).fill('Kosovo');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).press('Enter');
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
  // On refresh the upper and lower quarters lie outside the full circle,
  // rather than inside a magnified Earth cropped by the container.
  await expect.poll(() => stage.locator('canvas').evaluate(canvas => {
    const c = canvas as HTMLCanvasElement, image = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    return [[c.width / 4, 2], [c.width * 3 / 4, 2], [c.width / 4, c.height - 3], [c.width * 3 / 4, c.height - 3]].map(([x, y]) => image.data[(Math.floor(y) * c.width + Math.floor(x)) * 4 + 3]);
  })).toEqual([0, 0, 0, 0]);
  await stage.focus(); await page.keyboard.press('Home');
  expect(await stage.evaluate(element => getComputedStyle(element).borderRadius)).toBe('0px');
  expect(await stage.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  const box = (await stage.boundingBox())!;
  const saudi = geoCentroid(atlas.countries.find(c => c.properties.code === 'SAU') as Feature<Polygon | MultiPolygon>);
  const projection = geoOrthographic().rotate([-saudi[0], -saudi[1]]).scale(box.width / 2 - 1).translate([box.width / 2, box.height / 2]);
  const egypt = projection([29.877917299852545, 26.459585778678562])!;
  await stage.click({ position: { x: egypt[0], y: egypt[1] } });
  await expect(explorer.getByRole('heading', { name: 'Egypt', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/country=EGY/);
  await expect(explorer.locator('.mw-view-switch button')).toHaveCount(2);
  expect(Math.abs(box.width - box.height)).toBeLessThan(1);
  await stage.focus(); await page.keyboard.press('Home');
  await expect.poll(async () => stage.locator('canvas').last().evaluate(canvas => {
    const image = (canvas as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, (canvas as HTMLCanvasElement).width, (canvas as HTMLCanvasElement).height);
    let left = image.width, right = 0, top = image.height, bottom = 0;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) if (image.data[(y * image.width + x) * 4 + 3]) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
    return Math.min((right - left) / image.width, (bottom - top) / image.height);
  })).toBeGreaterThan(.99);
  await stage.hover(); const scrollBefore = await page.evaluate(() => scrollY);
  const wholeWorld = await stage.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL());
  await page.mouse.wheel(0, -700); await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  expect(await stage.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL())).not.toBe(wholeWorld);
  // Deep zoom fills the map viewport, including its corners.
  await page.mouse.wheel(0, -5000); await page.waitForTimeout(150);
  await page.mouse.wheel(0, -5000); await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  const aperture = await stage.locator('canvas').evaluate(canvas => {
    const c = canvas as HTMLCanvasElement, image = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    const alpha = (x: number, y: number) => image.data[(y * c.width + x) * 4 + 3];
    return [alpha(2, 2), alpha(c.width - 3, 2), alpha(2, c.height - 3), alpha(c.width - 3, c.height - 3)];
  });
  expect(aperture.every(alpha => alpha > 240)).toBe(true);
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
  await expect(stage.locator('svg path')).toHaveCount(65);
  await expect(stage.locator('.mw-flat-country.is-selected')).toHaveAttribute('data-country', 'PAK');
  await expect(stage.locator('.mw-flat-ocean')).toHaveAttribute('fill', '#08171e');
  await expect(stage.locator('.mw-flat-land')).toHaveAttribute('fill', '#202b22');
  await expect(stage.locator('.mw-flat-terrain ellipse')).toHaveCount(10);
  const fills = await stage.locator('.mw-flat-country:not(.is-selected)').evaluateAll(paths => paths.map(path => getComputedStyle(path).fill));
  expect(fills.every(fill => fill === 'rgba(0, 0, 0, 0)')).toBe(true);
  const projection = geoEqualEarth().fitExtent([[12,12],[948,708]], atlas.land);
  const point = projection(geoCentroid(atlas.countries.find(country => country.properties.code === 'EGY')!))!;
  const box = (await stage.boundingBox())!;
  await stage.click({position:{x:point[0]*box.width/960,y:point[1]*box.height/720}});
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
  const colours = await explorer.locator('.mw-globe canvas').evaluate(canvas => {
    const c = canvas as HTMLCanvasElement, pixels = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let ocean = 0, land = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 255 && pixels[i + 2] > pixels[i + 1] && pixels[i + 1] > pixels[i]) ocean++;
      if (pixels[i + 3] === 255 && (pixels[i] > pixels[i + 2] || pixels[i + 1] > pixels[i + 2])) land++;
    }
    return { ocean, land };
  });
  expect(colours.ocean).toBeGreaterThan(100); expect(colours.land).toBeGreaterThan(100);
  await expect(explorer.locator('.mw-map-credit')).toHaveCount(0);
  expect((await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name))).some(name => /earth\.(webp|jpg)/.test(name))).toBe(false);
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).fill('Mayotte');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).press('Enter');
  await expect(explorer.getByRole('heading', { name: 'Mayotte', exact: true })).toBeVisible();
  await page.route('**/assets/muslim-world/atlas.json', route => route.abort());
  await page.reload();
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer.getByRole('status')).toContainText('The map is unavailable.');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).fill('Bangladesh');
  await explorer.getByRole('searchbox', { name: 'Find a country', exact: true }).press('Enter');
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


test('the default page adopts B/C/B and engagement cards open the matching directory filter, including shared links', async ({ page }) => {
  await page.goto(route + '?country=EGY&question=jesus#muslim-world');
  const explorer = page.locator('#muslim-world');
  await expect(page.getByRole('complementary', { name: 'Atlas design review' })).toHaveCount(0);
  await expect(explorer.locator('.mw-header-b-facts dt')).toHaveText(['Population', 'Muslim', 'Christian']);
  await expect(explorer.locator('.mw-header-b-facts dd')).toHaveText(['109.3M', '95.2%', '4.8%']);
  const muslim = await explorer.locator('.mw-header-b-facts > div').nth(1).boundingBox();
  const christian = await explorer.locator('.mw-header-b-facts > div').nth(2).boundingBox();
  expect(christian!.x).toBeGreaterThan(muslim!.x);
  expect(Math.abs(christian!.y - muslim!.y)).toBeLessThan(1);
  const statuses = [
    ['Unengaged and unreached', 'unengaged', 7],
    ['Engaged yet unreached', 'engagedUnreached', 15],
    ['No longer unreached', 'noLongerUnreached', 1],
  ] as const;
  for (const [label, status, count] of statuses) {
    const card = explorer.getByRole('button', { name: `View ${label} people groups`, exact: true });
    await card.focus(); await page.keyboard.press('Enter');
    const tab = explorer.getByRole('tab', { name: /People Groups/ });
    await expect(tab).toHaveAttribute('aria-selected', 'true'); await expect(tab).toBeFocused();
    await expect(explorer.locator('.mw-pg-editorial [data-people-group]')).toHaveCount(count);
    await expect(explorer.getByRole('button', { name: new RegExp(`^${label}`) })).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(new RegExp(`engagement=${status}`));
    await expect(page).toHaveURL(/question=jesus/);
    await page.reload();
    await expect(explorer.locator('.mw-pg-editorial [data-people-group]')).toHaveCount(count);
    await explorer.getByRole('tab', { name: 'Gospel Presence', exact: true }).click();
  }
  await explorer.getByRole('tab', { name: /People Groups/ }).click();
  await explorer.getByRole('button', { name: /^All groups/ }).click();
  await expect(explorer.locator('[data-people-group]')).toHaveCount(23);
  await expect(page).not.toHaveURL(/engagement=/);
});
