import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:8935';
const captures = 'front-end capture/2026-10-05/knowledge';
await mkdir(captures, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function search(query, options = {}) {
  await page.locator('#query').fill(query);
  await page.locator(`input[name=mode][value=${options.mode || 'lexical'}]`).check();
  await page.locator('#kind').selectOption(options.kind || '');
  await page.locator('#edition').selectOption(options.edition || '');
  await page.locator('#language').selectOption(options.language || '');
  const response = page.waitForResponse(value => value.url().includes('/api/search?'), { timeout: 180000 });
  await page.locator('button[type=submit]').click();
  const data = await (await response).json();
  await page.locator('#results').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.getElementById('results').hasAttribute('aria-busy'));
  assert.equal(data.notices.length, 0, JSON.stringify(data.notices));
  return data;
}

try {
  await page.goto(base);
  await page.getByText('1,027,939', { exact: true }).waitFor();
  assert.equal(await page.locator('.stat').count(), 4);
  await page.screenshot({ path: `${captures}/desktop.png`, fullPage: true });

  let data = await search('"love your enemies"', { edition: 'kjv' });
  assert(data.results.length >= 2);
  assert(data.results.every(row => row.edition === 'kjv' && /love your enemies/i.test(row.text)));
  const sourceRequest = page.waitForResponse(value => value.url().includes('/api/document?'));
  await page.getByRole('button', { name: 'Read source context' }).first().click();
  const context = await (await sourceRequest).json();
  assert(context.chunks.some(chunk => chunk.id === data.results[0].id));
  await page.locator('#document-content article').first().waitFor();
  assert(await page.locator('#document').evaluate(node => node.open));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#document').evaluate(node => node.open), false);

  data = await search('John 3:16', { edition: 'kjv' });
  assert.equal(data.reference.verses.length, 1);
  assert.equal(data.reference.verses[0].label, '16');
  assert(data.reference.verses[0].text.includes('For God so loved the world'));
  assert(data.reference.connections.outgoing.length > 0);
  assert(data.results.every(row => row.book === 'JHN' && row.chapter === 3));
  await page.screenshot({ path: `${captures}/verse-and-connections.png`, fullPage: true });

  data = await search('神爱世人', { edition: 'cuv' });
  assert(data.results.some(row => row.book === 'JHN' && row.chapter === 3));
  assert(data.results.every(row => row.edition === 'cuv'));

  data = await search('hope when suffering', { mode: 'semantic', kind: 'guide' });
  assert(data.results.length > 0);
  assert(data.results.every(row => row.methods.includes('semantic') && row.kind === 'guide'));
  await page.screenshot({ path: `${captures}/semantic-results.png`, fullPage: true });

  data = await search('Aaron', { kind: 'person' });
  assert(data.results.some(row => row.document_id.startsWith('person:aaron-')));
  const family = await (await page.request.get(`${base}/api/connections?id=person:aaron-exo-4-14`)).json();
  assert(family.outgoing.some(edge => edge.relation === 'parent'));

  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    await page.screenshot({ path: `${captures}/mobile-${width}.png`, fullPage: true });
  }
  assert.equal((await page.request.get(`${base}/health`, { headers: { Host: 'untrusted.test' } })).status(), 403);
  assert.equal((await page.request.get(`${base}/api/status`, { headers: { Origin: 'https://untrusted.test' } })).status(), 403);
  assert.equal((await page.request.get(`${base}/api/search?q=${'a'.repeat(501)}`)).status(), 400);
  assert.equal((await page.request.get(`${base}/api/document?id=missing`)).status(), 404);
  assert.deepEqual(errors, []);
  console.log('PASS: complete corpus, phrase/CJK/verse/semantic search, context, relationships, keyboard dialog, three responsive widths and local access boundaries.');
} finally {
  await browser.close();
}
