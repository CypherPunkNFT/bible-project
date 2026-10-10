import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050}});
await context.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const page=await context.newPage(),errors=[],results={};
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:8931/apologetics/worldviews/islam');
await page.locator('.wv-collection-hero h1').waitFor();
await page.evaluate(()=>document.fonts.ready);
await page.waitForTimeout(350);
const root='/apologetics/worldviews/';
const worlds=['islam','secular','buddhism','hinduism'];
await page.locator('.sm-main a[href="/apologetics/worldviews"]').click();
await page.waitForTimeout(600);
await page.evaluate(()=>{
 window.worldviewSamples=[];
 const start=performance.now();
 function sample(){
  const choices=document.querySelectorAll('.sm-world-choices a');
  const label=choices[1].querySelector('.sm-world-label');
  window.worldviewSamples.push({time:performance.now()-start,x:choices[1].querySelector('svg').getBoundingClientRect().x,width:document.querySelector('.sm-world-choices').getBoundingClientRect().width,opacity:Number(getComputedStyle(label).opacity)});
  if(performance.now()-start<750)requestAnimationFrame(sample);
 }
 requestAnimationFrame(sample);
});
await page.locator('.sm-world-choices a[href="'+root+'islam"]').click();
await page.waitForTimeout(800);
const samples=await page.evaluate(()=>window.worldviewSamples);
const first=samples[0],last=samples.at(-1);
assert.ok(first.width>last.width+200,`Icons did not compact: ${first.width}/${last.width}`);
assert.ok(samples.some(s=>s.x>last.x+2&&s.x<first.x-2),'Icon positions should have intermediate values');
assert.ok(samples.some(s=>s.opacity<.1&&s.width>last.width+150),'Labels should fade before the icons finish grouping');
results.indexTransition={start:first,end:last,intermediateFrames:samples.filter(s=>s.x>last.x+2&&s.x<first.x-2).length};
for(const width of [1440,1024,768,390,320]){
 await page.setViewportSize({width,height:1050});
 const headings=[],nameWidths=[];
 for(const world of worlds){
  await page.locator('.sm-world-choices a[href="'+root+world+'"]').click();
  await page.waitForTimeout(350);
  await page.evaluate(()=>document.fonts.ready);
  const state=await page.evaluate(()=>{const name=document.querySelector('.sm-current');const style=getComputedStyle(name);return {heading:document.querySelector('.wv-collection-hero h1').getBoundingClientRect().top,top:document.querySelector('.sm-main').getBoundingClientRect().height,lower:document.querySelector('.sm-dock-row').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,nameWidth:name.getBoundingClientRect().width,leftEdge:style.borderLeftWidth,rightEdge:style.borderRightWidth,current:document.querySelector('.sm-current-label').textContent};});
  assert.equal(state.top,state.lower);
  assert.equal(state.overflow,false,`${world} overflow at ${width}`);
  headings.push(state.heading);
  nameWidths.push(state.nameWidth);
  assert.equal(state.leftEdge,'1px');assert.equal(state.rightEdge,'1px');
  if(width===1440)await page.screenshot({path:`design/apologetics-navigation/screenshots/live-${world}-motion.png`});
 }
 assert.ok(Math.max(...headings)-Math.min(...headings)<1,`Heading positions differ at ${width}: ${headings}`);
 assert.ok(Math.max(...nameWidths)-Math.min(...nameWidths)<1,`Name widths differ at ${width}: ${nameWidths}`);
 results[width]={headings,nameWidths};
}
await page.setViewportSize({width:1440,height:1050});
await page.locator('.sm-world-choices a[href="'+root+'islam"]').click();
await page.waitForTimeout(350);
const button=page.getByRole('button',{name:'Collapse Worldviews'});
await button.click();
await page.waitForTimeout(350);
assert.equal(await page.locator('#sm-panel').count(),0);
await page.getByRole('button',{name:'Browse Worldviews'}).click();
await page.waitForTimeout(50);
const intermediate=await page.locator('#sm-panel').evaluate(el=>el.getBoundingClientRect().height);
await page.waitForTimeout(350);
const final=await page.locator('#sm-panel').evaluate(el=>el.getBoundingClientRect().height);
assert.ok(intermediate>0&&intermediate<final,`Expected intermediate opening height: ${intermediate}/${final}`);
results.slide={intermediate,final};
// Destinations stay visible; only the selected worldview title fades.
await page.locator('.sm-world-choices a[href="'+root+'buddhism"]').click();
await page.waitForTimeout(350);
assert.equal(await page.locator('.sm-current-label').textContent(),'Buddhism');
await page.evaluate(()=>{
 window.persistentOverview=document.querySelector('.sm-study-links a');
 window.submenuSamples=[];
 const start=performance.now();
 function sample(){
  const nav=document.querySelector('.sm-study-links'),overview=nav.querySelector('a'),title=document.querySelector('.sm-current-label');
  window.submenuSamples.push({same:overview===window.persistentOverview,navOpacity:getComputedStyle(nav).opacity,linkOpacity:getComputedStyle(overview).opacity,color:getComputedStyle(overview).color,titleOpacity:Number(getComputedStyle(title).opacity)});
  if(performance.now()-start<500)requestAnimationFrame(sample);
 }
 requestAnimationFrame(sample);
});
await page.locator('.sm-world-choices a[href="'+root+'hinduism"]').click();
await page.waitForTimeout(600);
const submenuSamples=await page.evaluate(()=>window.submenuSamples);
assert.ok(submenuSamples.every(s=>s.same&&s.navOpacity==='1'&&s.linkOpacity==='1'),'Submenu links should persist without fading');
assert.ok(submenuSamples.some(s=>s.titleOpacity<.9),'Worldview title should still fade');
assert.ok(new Set(submenuSamples.map(s=>s.color)).size>2,'Accent color should interpolate');
results.submenuColor={visibleThroughout:true,titleFades:true,intermediateColors:new Set(submenuSamples.map(s=>s.color)).size};
for(const world of ['secular','hinduism','islam'])await page.locator('.sm-world-choices a[href="'+root+world+'"]').click();
await page.waitForTimeout(350);
assert.equal(await page.locator('.sm-current-label').textContent(),'Islam');
assert.equal(await page.locator('.wv-claim-map button').count(),12);
assert.equal(await page.locator('.mw-explorer').count(),1);
for(const path of ['/guide','/guide/understanding','/guide/ministry','/guide/library','']){
 await page.locator('.sm-study-links a[href="'+root+'islam'+path+'"]').click();
 await page.waitForTimeout(350);
 assert.equal(new URL(page.url()).pathname,root+'islam'+path);
}
await page.keyboard.press('Escape');
await page.waitForTimeout(350);
assert.equal(await page.locator('#sm-panel').count(),0);
assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Browse Worldviews');
await page.emulateMedia({reducedMotion:'reduce'});
await page.getByRole('button',{name:'Browse Worldviews'}).click();
await page.waitForTimeout(40);
assert.equal(await page.locator('#sm-panel').evaluate(el=>el.getBoundingClientRect().height),56);
await page.locator('.sm-world-choices a[href="'+root+'secular"]').click();
await page.waitForTimeout(60);
assert.equal(await page.locator('.sm-world-detail').evaluate(el=>getComputedStyle(el).opacity),'1');
assert.equal(await page.locator('.sm-current-label').textContent(),'Secular');
await page.setViewportSize({width:390,height:900});
await page.screenshot({path:'design/apologetics-navigation/screenshots/live-secular-phone-motion.png'});
assert.deepEqual(errors,[]);
results.browserErrors=errors;
await fs.writeFile('design/apologetics-navigation/live-motion-verification.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
await browser.close();
