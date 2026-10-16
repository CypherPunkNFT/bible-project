import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='.local/world-expanded-qa';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:8931/study/world-of-jesus-apostles';
try {
 await page.goto(base);await page.locator('.wi-entry').waitFor();
 await page.locator('.wi-entry-links a').first().click();await page.locator('#wi-layers-title').waitFor();await page.waitForTimeout(700);
 assert.equal(new URL(page.url()).searchParams.get('scene'),'synagogue');
 const y=await page.locator('#world-investigation').evaluate(e=>e.getBoundingClientRect().top);assert(y>=60&&y<250,`Deep investigation anchor y=${y}`);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const scene of ['synagogue','household','ephesus']){
   await page.goto(base+`?scene=${scene}#world-investigation`);await page.locator('.wi-investigation').waitFor();
   if(scene==='synagogue')for(let i=0;i<3;i++){const b=page.locator('.wi-strata button').nth(i);await b.focus();await page.keyboard.press('Space');assert.equal(await b.getAttribute('aria-pressed'),'true');assert((await page.locator('#wi-layer-reading').textContent()).includes(['80 CE','building phase','43 CE'][i]));}
   if(scene==='household'){
    for(let i=0;i<4;i++){await page.locator('.wi-letter button').nth(i).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.wi-letter button').nth(i).getAttribute('aria-pressed'),'true');}
    for(const [a,b] of [[false,false],[true,false],[true,true],[false,true]]){await page.getByLabel('Separate dining spaces').setChecked(a);await page.getByLabel('Different arrival times').setChecked(b);assert.equal(await page.locator('.wi-divided').count(),a?1:0);assert((await page.locator('#wi-meal-model').innerText()).includes('Paul rebukes an unequal'))}
   }
   if(scene==='ephesus')for(let i=0;i<2;i++){await page.locator('.wi-switch button').nth(i).focus();await page.keyboard.press('Space');assert((await page.locator('#wi-civic-record').textContent()).includes(i?'104':'50s'));}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${scene}/${width} overflows`);
   await page.locator('.wi-investigation').screenshot({path:`${out}/${scene}-${width}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(base+'?scene=household#world-investigation');await page.locator('.wi-letter button').first().focus();await page.keyboard.press('Tab');assert.notEqual(await page.locator(':focus').evaluate(e=>getComputedStyle(e).boxShadow),'none');
 await page.getByLabel('Separate dining spaces').focus();await page.keyboard.press('Space');assert(await page.getByLabel('Separate dining spaces').isChecked());
 await page.locator('.wi-letter a').click();await page.locator('.verse-highlight').first().waitFor();await page.goBack();await page.locator('.wi-investigation').waitFor();
 await page.evaluate(()=>document.documentElement.dataset.theme='light');await page.locator('.wi-investigation').screenshot({path:out+'/household-light.png'});
 await page.locator('.wi-source-register summary').click();assert.equal(await page.locator('.wi-source-register .wi-source').count(),8);
 for(const a of await page.locator('.wi-source').all()){const href=await a.getAttribute('href');assert(href?.startsWith('https://')||href?.startsWith('/read/'));}
 assert.deepEqual(errors,[]);const result={status:'passed',scenes:['synagogue','household','ephesus'],viewports:[1440,390,320],checks:['entry links and hash scrolling','all three stratigraphic contexts','four passage annotations','all four assumption combinations','two civic accounts','keyboard focus and Space/Enter','mobile overflow','light theme','reduced-motion interaction','Bible highlighted navigation and back','expanded research register','no runtime errors']};fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));console.log(result);
} finally {await browser.close();}
