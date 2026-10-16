import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const url='http://127.0.0.1:8931/study/how-the-canon-took-shape';
const out='.local/canon-qa';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const pass=s=>{checks.push(s);console.log('PASS',s);};
try{
 await page.goto(url);await page.locator('.cn-r-folios').waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.cn-r-entry:visible').count(),9);
 assert.equal(await page.locator('.cn-r-folios').evaluate(e=>getComputedStyle(e).display),'grid');
 await page.screenshot({path:out+'/registers-opening.png',animations:'disabled'});
 await page.locator('.cn-r-workspace').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/registers-desktop.png',animations:'disabled'});
 const entry=page.locator('#cn-entry-1-0');await entry.focus();
 const y=await page.evaluate(()=>scrollY);await page.keyboard.press('Enter');
 assert.ok(Math.abs(await page.evaluate(()=>scrollY)-y)<2,'Selection must not scroll');
 assert.ok(await page.locator('#cn-r-inspection').isVisible());
 await page.getByRole('group',{name:'Compare ancient judgments'}).getByRole('button').nth(1).click();
 assert.match(await page.locator('#cn-r-inspection h3').innerText(),/Augustine \/ Esther/);
 assert.equal(new URL(page.url()).searchParams.get('witness'),'1');
 await page.reload();await page.locator('#cn-r-inspection h3').waitFor();assert.match(await page.locator('#cn-r-inspection h3').innerText(),/Augustine \/ Esther/);
 await page.locator('.cn-breadcrumb a').click();await page.waitForURL(u=>u.pathname==='/study/academic');await page.waitForFunction(()=>!document.documentElement.dataset.sitePageSlide);await page.goBack();await page.waitForURL(u=>u.pathname==='/study/how-the-canon-took-shape');await page.locator('#cn-r-inspection h3').waitFor();await page.waitForFunction(()=>!document.documentElement.dataset.sitePageSlide);
 assert.match(await page.locator('#cn-r-inspection h3').innerText(),/Augustine \/ Esther/);
 pass('Stable selection, writing switches retain witness, reload and browser Back retain source inspection');
 await page.getByRole('button',{name:'Close source inspection'}).focus();await page.keyboard.press('Escape');
 assert.ok(await page.locator('#cn-r-inspection').isHidden());await page.waitForFunction(()=>document.activeElement.id==='cn-entry-1-1');
 await page.getByRole('button',{name:'Reset view'}).click();assert.equal(new URL(page.url()).searchParams.get('writing'),'0');
 pass('Keyboard Enter/Escape, close focus restoration and reset');
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:1000});await page.locator('.cn-r-workspace').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('.cn-r-entry:visible').count(),width<=760?3:9);
  for(let writing=0;writing<3;writing++){
   await page.getByRole('group',{name:'Compare ancient judgments'}).getByRole('button').nth(writing).click();
   await page.locator(`#cn-entry-2-${writing}`).click();assert.ok(await page.locator('#cn-r-inspection').isVisible());
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width);
  }
  await page.locator('.cn-r-workspace').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/registers-${width}.png`,animations:'disabled'});
  await page.locator('#cn-r-inspection').scrollIntoViewIfNeeded();await page.waitForTimeout(250);await page.screenshot({path:`${out}/registers-inspection-${width}.png`,animations:'disabled'});
 }
 pass('All writing selections at 1440/1024/768/390/320px; mobile keeps three witnesses; no page overflow');
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('switch',{name:'Dark mode'}).click();
 await page.locator('.cn-r-workspace').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/registers-dark.png',animations:'disabled'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#cn-entry-0-2').click();
 assert.equal(await page.locator('#cn-r-inspection').evaluate(e=>getComputedStyle(e).animationName),'none');
 assert.ok(await page.locator('[data-site-header]').evaluate(e=>Math.abs(e.getBoundingClientRect().top)<1));
 await page.goto(url+'?writing=bad&witness=99&record=athanasius');await page.locator('.cn-r-folios').waitFor();
 assert.ok(await page.locator('#cn-r-inspection').isHidden());assert.equal(await page.locator('.cn-r-entry.match').count(),3);
 assert.equal(await page.locator('#cn-record-heading').innerText(),'Two lists, two purposes');
 pass('Dark theme, reduced motion, fixed header and invalid-query fallback without losing timeline selection');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/registers-report.json',JSON.stringify({checks,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close();}
