import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const origin = process.env.MOSES_TEST_ORIGIN || 'http://127.0.0.1:8931';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  if (process.env.MOSES_TEST_RELEASE) {
    const release = path.resolve(process.env.MOSES_TEST_RELEASE);
    await page.route(origin + '/**', async (route) => {
      const url = new URL(route.request().url());
      const file = path.resolve(release, '.' + decodeURIComponent(url.pathname));
      if (!file.startsWith(release + path.sep)) return route.abort();
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({ path: file });
      if (!path.extname(file)) return route.fulfill({ path: path.join(release, 'index.html') });
      return route.fulfill({ status: 404, body: 'Not found' });
    });
  }
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(origin + '/people/moses');
  await page.locator('.mg-ch').first().waitFor({ timeout: 60000 });
  assert.equal(await page.locator('.mg-ch').count(), 3);
  assert.deepEqual(await page.locator('.mg-num').allTextContents(), ['I', 'II', 'III']);
  assert.equal(await page.getByRole('heading', { name: 'Moses', exact: true, level: 1 }).count(), 1);
  assert.equal(await page.locator('.switcher').count(), 0);
  assert.equal(await page.locator('.mx-life .claim').count(), 6);
  assert.equal(await page.locator('[data-fam]').count(), 7);
  fs.mkdirSync('.local/moses-qa', { recursive: true });
  await page.screenshot({ path: '.local/moses-qa/desktop.png' });
  const ch = page.locator('.mg-ch').first();
  await ch.locator('.mg-nav [data-step="1"]').click();
  assert.equal(await ch.locator('.mg-count b').textContent(), '2');
  await ch.locator('.mg-slide').nth(1).getByRole('button', { name: /The full detail/ }).click();
  await page.getByRole('dialog', { name: 'Scene details' }).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.mg-drawer[aria-hidden="true"]').waitFor({ state: 'attached' });
  await ch.locator('.mg-maptoggle').click();
  assert.equal(await ch.locator('.mg-maptoggle').getAttribute('aria-expanded'), 'true');
  await ch.locator('.mg-mapclose').click();
  assert.equal(await ch.locator('.mg-maptoggle').getAttribute('aria-expanded'), 'false');
  await ch.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.local/moses-qa/act.png' });
  await page.locator('[data-fam="jochebed-exo-6-20"]').click();
  assert.match(await page.locator('.mx-fd a.mg-link').getAttribute('href'), /people\/jochebed/);
  await page.locator('.mg-memory').click();
  await page.getByRole('heading', { name: 'The long memory', exact: true }).waitFor();
  assert.equal(await page.locator('.gm-pts .gm-pt').count(), 786);
  assert.equal(await page.locator('.gm-counts li').count(), 31);
  await page.locator('.moses-all-refs summary').click();
  assert.equal(await page.locator('.moses-all-refs a').count(), 786);
  assert.match(await page.locator('.moses-all-refs a').first().getAttribute('href'), /\/read\/.+\?hl=10-10/);
  await page.getByRole('switch', { name: 'Dark mode' }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  assert.equal(await page.locator('.moses-surface').evaluate(el => el.getRootNode().host.dataset.theme), 'dark');
  await page.locator('.tf-deck').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.local/moses-qa/dark.png' });
  await page.locator('.topline a').first().click();
  await page.waitForURL('**/study/people');
  await page.goto(origin + '/people/moses-exo-2-10');
  await page.waitForURL('**/people/moses');
  await page.locator('.mg-ch').first().waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.tf-deck').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.local/moses-qa/mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  const phoneCh = page.locator('.mg-ch').first();
  await phoneCh.locator('.mg-maptoggle').click();
  await phoneCh.locator('.mg-mapclose').click();
  for (const aspect of ['rule', 'word']) {
    await page.goto(origin + '/people/moses/' + aspect);
    await page.locator('[data-people-ready="special:moses-exo-2-10:' + aspect + '"]').waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile, three acts, scene navigation, dialog, maps, all family nodes, 786 references, 31 book counts, theme, legacy route, leader/prophet routes, and no browser errors.');
} finally { await browser.close(); }


