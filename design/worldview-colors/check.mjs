import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:8931/mockups/worldview-colors/');
await page.locator('.pc-card').last().waitFor();
await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.locator('.pc-card').count(),10);
const results={palettes:10,themes:{},viewports:[]};
for(const theme of ['dark','light']){
 if(theme==='light')await page.getByRole('button',{name:'Switch to light theme'}).click();
 const colors=[];
 for(let i=1;i<=10;i++){
  const card=page.locator(`[data-palette="${i}"]`);
  for(const world of ['islam','secular','buddhism','hinduism']){
   await card.locator(`.sm-world-choices a[aria-label="${{islam:'Islam',secular:'Secular',buddhism:'Buddhism',hinduism:'Hinduism'}[world]}"]`).click();
   await page.waitForTimeout(25);
   const color=await card.locator('.sm-current-label').evaluate(el=>getComputedStyle(el).color);
   const expected=await card.evaluate((el,id)=>getComputedStyle(el).getPropertyValue('--palette-'+id).trim(),world);
   colors.push({palette:i,world,color,expected});
   const normalized='rgb('+expected.slice(1).match(/../g).map(value=>parseInt(value,16)).join(', ')+')';
   assert.equal(color,normalized);
   assert.equal(await card.locator('.sm-study-links').count(),1);
  }
  await card.locator('.pc-view').click();
  await page.waitForTimeout(350);
  assert.equal(new URL(page.url()).searchParams.get('p'),String(i));
  const liveColor=await page.locator('.pc-live .pc-live-body h2 em').evaluate(el=>getComputedStyle(el).color);
  assert.equal(liveColor,colors.find(c=>c.palette===i&&c.world==='secular').color);
 }
 results.themes[theme]=colors;
}
await page.getByRole('button',{name:'Switch to dark theme'}).click();
await page.locator('.pc-palette-switch button').first().click();
for(let i=1;i<=10;i++)await page.locator(`[data-palette="${i}"] .pc-show-names`).click();
assert.equal(await page.locator('.pc-card .sm-world-index').count(),10);
await page.evaluate(()=>scrollTo(0,0));
await fs.mkdir('design/worldview-colors/screenshots',{recursive:true});
await page.screenshot({path:'design/worldview-colors/screenshots/desktop.png',fullPage:true});
for(const width of [1440,1024,768,390,320]){
 await page.setViewportSize({width,height:1000});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
 results.viewports.push(width);
 if(width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'design/worldview-colors/screenshots/phone.png',fullPage:true});}
}
assert.deepEqual(errors,[]);results.browserErrors=errors;
await fs.writeFile('design/worldview-colors/verification.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({palettes:results.palettes,themes:Object.keys(results.themes),viewports:results.viewports,browserErrors:errors}));
await browser.close();
