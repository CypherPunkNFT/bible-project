// Render small review images from the real globe. Run after a local build, then rebuild to copy them into dist.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.BASE ?? 'http://127.0.0.1:8931';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base), 'Use a local preview server.');
const folder = 'public/assets/muslim-world/sphere-previews';
await mkdir(folder, { recursive: true });
await mkdir('design/_gallery/thumbs', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const mode of ['dark', 'light']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await page.addInitScript(mode => localStorage.setItem('bp-theme', mode), mode);
    await page.goto(`${base}/apologetics/worldviews/islam?country=PAK&globeDesign=a#muslim-world`);
    const stage = page.locator('.mw-globe-stage');
    await stage.waitFor();
    await page.waitForFunction(() => document.querySelector('.mw-globe-stage')?.getAttribute('aria-busy') === 'false');
    await page.addStyleTag({ content: '.mw-globe-stage{width:256px!important;height:256px!important;aspect-ratio:1!important}' });
    for (const id of 'abcdefghijklmnop') {
      await page.getByRole('button', { name: new RegExp(`^Sphere theme ${id.toUpperCase()}:`) }).click();
      await stage.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.mw-globe-stage canvas')?.width === 256);
      await page.waitForTimeout(100);
      const data = await stage.locator('canvas').evaluate(canvas => canvas.toDataURL('image/webp', .88));
      assert.ok(data.startsWith('data:image/webp;base64,'));
      if (mode === 'dark' || id === 'a') {
        const filename = `${id}${mode === 'light' ? '-light' : ''}.webp`;
        await writeFile(`${folder}/${filename}`, Buffer.from(data.split(',')[1], 'base64'));
      }
      await stage.locator('canvas').screenshot({ path: `design/_gallery/thumbs/muslim-world-sphere-${id}-${mode}.png` });
    }
    console.log(`${mode}: sixteen globe previews captured from the shared renderer.`);
    await page.close();
  }
} finally { await browser.close(); }
