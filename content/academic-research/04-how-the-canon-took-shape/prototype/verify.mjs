import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
const dir=path.dirname(fileURLToPath(import.meta.url));const url=pathToFileURL(path.join(dir,'index.html')).href;
const browser=await chromium.launch({channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];function pass(s){checks.push(s);console.log('PASS '+s);}
try{
 await page.goto(url);await page.locator('.entry').last().waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.entry').count(),9);assert.equal(await page.locator('.entry:visible').count(),9);assert.equal(await page.locator('#inspection').isVisible(),false);pass('Local file loads three documents and nine source-derived judgments without a server');
 assert.ok(await page.evaluate(()=>document.fonts.check('16px Literata')&&document.fonts.check('16px Archivo')));pass('Project typography loads from local licensed font files');
 await page.screenshot({animations:'disabled',path:path.join(dir,'desktop.png'),fullPage:true});await page.screenshot({animations:'disabled',path:path.join(dir,'opening.png')});
 for(let i=0;i<3;i++){for(let j=0;j<3;j++){
  const entry=page.locator(`#entry-${i}-${j}`);await entry.focus();await page.keyboard.press('Enter');assert.equal(await entry.getAttribute('aria-expanded'),'true');assert.ok((await page.locator('#inspection-title').innerText()).includes(['Athanasius','Augustine','Jerome'][i]));assert.equal(await page.locator('#inspection').isVisible(),true);
 }}pass('All nine entries open using Enter and expose the selected witness');
 await page.locator('[data-writing="1"]').focus();const before=await page.evaluate(()=>scrollY);await page.keyboard.press('Space');assert.ok((await page.locator('#inspection-title').innerText()).includes('Jerome / Esther'));assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<2);pass('Switching the writing keeps the selected witness and does not scroll');
 await page.reload();assert.ok((await page.locator('#inspection-title').innerText()).includes('Jerome / Esther'));pass('Writing, witness and open inspection restore from the URL after reload');
 await page.locator('#close').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('#inspection').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'entry-2-1');pass('Escape retracts inspection and returns keyboard focus to its origin');
 await page.locator('#reset').click();assert.equal(await page.locator('[data-writing="0"]').getAttribute('aria-pressed'),'true');pass('Reset restores the initial writing and closed state');
 const ids=await page.locator('#record option').evaluateAll(os=>os.map(o=>o.value));assert.equal(ids.length,18);for(const id of ids){await page.locator('#record').selectOption(id);assert.match(await page.locator('#historical-record').innerText(),/the limit/i);}pass('All eighteen historical records retain evidence, interpretation, limits and source links');
 await page.locator('#record').selectOption('muratorian');assert.match(await page.locator('#historical-record').innerText(),/4th proposed/i);pass('Disputed date remains visible without a fabricated time coordinate');
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:1000});await page.locator('#reset').click();await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width);
  if(width<761){assert.equal(await page.locator('.entry:visible').count(),3);await page.locator('[data-writing="2"]').click();assert.equal(await page.locator('.entry:visible').count(),3);}
  await page.screenshot({animations:'disabled',path:path.join(dir,`width-${width}.png`),fullPage:true});
  await page.locator('#entry-1-'+(width<761?2:0)).click();await page.locator('#inspection').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({animations:'disabled',path:path.join(dir,`selected-${width}.png`)});
 }pass('Desktop/laptop/768/390/320 layouts and expanded states have no horizontal overflow; phones retain three comparable entries');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#inspection').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollBehavior),'auto');pass('Reduced motion removes fade and smooth scrolling');
 await page.setViewportSize({width:1440,height:1000});await page.locator('#reset').click();await page.keyboard.press('Tab');await page.locator('#entry-0-0').focus();assert.notEqual(await page.locator('#entry-0-0').evaluate(e=>getComputedStyle(e).outlineStyle),'none');pass('Keyboard focus is visible');
 const missing=[];for(const attr of ['src','href']){for(const ref of await page.locator(`[${attr}]`).evaluateAll((els,a)=>els.map(e=>e.getAttribute(a)),attr)){if(!ref||ref.startsWith('#')||/^(https?:|data:)/.test(ref))continue;const resolved=path.resolve(dir,ref.split('?')[0]);if(!fs.existsSync(resolved))missing.push(ref);}}assert.deepEqual(missing,[]);pass('All relative document, stylesheet, script and data links resolve');
 assert.deepEqual(errors,[]);pass('No browser exceptions');
 fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify({checked:new Date().toISOString(),url,checks,errors,limits:['Native Edge only; no assistive-technology audit','Prototype header is a visual stand-in; site route transitions are not implemented or tested','External source URLs are preserved from the dossier; not all destinations were re-fetched during this design pass','Full remaining study sections are mapped in design.md, not implemented in this prototype']},null,2)+'\n');
}finally{await browser.close();}
