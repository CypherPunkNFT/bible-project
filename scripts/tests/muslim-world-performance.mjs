import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
await page.addInitScript(() => {
  window.globeCalls = { frames: 0, raf: 0 };
  const draw = WebGL2RenderingContext.prototype.drawArrays;
  WebGL2RenderingContext.prototype.drawArrays = function (...args) { window.globeCalls.frames++; return Reflect.apply(draw, this, args); };
  const raf = window.requestAnimationFrame;
  window.requestAnimationFrame = callback => raf.call(window, t => { window.globeCalls.raf++; callback(t); });
});
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto((process.env.BASE || 'http://127.0.0.1:8931') + '/apologetics/worldviews/islam#muslim-world');
await page.locator('.mw-globe-loading').waitFor({ state: 'hidden', timeout: 30000 });
await page.locator('.mw-globe-stage').scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
async function sample() {
 const first = await cdp.send('Performance.getMetrics'); const a = await page.evaluate(() => ({ ...window.globeCalls }));
 await page.waitForTimeout(4000);
 const last = await cdp.send('Performance.getMetrics'); const b = await page.evaluate(() => ({ ...window.globeCalls }));
 const metrics = Object.fromEntries(last.metrics.map(m => [m.name, m.value])); const start = Object.fromEntries(first.metrics.map(m => [m.name, m.value]));
 return { seconds: +(metrics.Timestamp - start.Timestamp).toFixed(3), mainThreadTaskMs: +((metrics.TaskDuration - start.TaskDuration) * 1000).toFixed(1), scriptMs: +((metrics.ScriptDuration - start.ScriptDuration) * 1000).toFixed(1), globeFrames: b.frames - a.frames, animationCallbacks: b.raf - a.raf };
}
const rotating = await sample();
const stage = page.locator('.mw-globe-stage'); await stage.focus(); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(800);
const paused = await sample();
const resources = await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.includes('/muslim-world/') || r.name.includes('mission-globe')).map(r => ({ name: r.name.split('/').pop(), encodedBytes: r.encodedBodySize, decodedBytes: r.decodedBodySize })));
await page.locator('#muslim-world').screenshot({ path: '.local/globe-performance-' + (process.env.LABEL || 'before') + '.png' });
const result = { rotating, paused, resources, errors };
await writeFile('.local/globe-performance-' + (process.env.LABEL || 'before') + '.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result)); await browser.close();
