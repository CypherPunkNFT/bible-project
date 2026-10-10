import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
await context.addInitScript(()=>{
 localStorage.setItem('bp-theme','dark');
 window.globeMarkers=[];
 const arc=CanvasRenderingContext2D.prototype.arc;
 CanvasRenderingContext2D.prototype.arc=function(x,y,r,...args){
  if(r===4.5&&this.canvas.closest('.mw-globe-stage')){const box=this.canvas.getBoundingClientRect();window.globeMarkers.push({x,y,width:box.width,height:box.height,time:performance.now(),country:new URLSearchParams(location.search).get('country')??'PAK'});}
  return arc.call(this,x,y,r,...args);
 };
});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:8931/apologetics/worldviews/islam');
await page.locator('.wv-islam-illustration').waitFor();
await page.evaluate(()=>document.fonts.ready);
const clearance=await page.locator('.wv-claims-book path').evaluate(path=>{
 let minimum=Infinity;
 for(let i=0;i<=150;i++){
  const p=path.getPointAtLength(path.getTotalLength()*i/150);
  for(const cx of [202,258])minimum=Math.min(minimum,76-Math.hypot(p.x-cx,p.y-88));
 }
 return minimum;
});
assert.ok(clearance>8,`Book needs clearance inside both circles: ${clearance}`);
assert.equal(await page.locator('.wv-islam-illustration .wv-scroll-artifact ellipse').count(),2);
assert.equal(await page.locator('.wv-claims-diagram .wv-scroll-artifact').count(),1);
await page.locator('.wv-hero-art').screenshot({path:'design/apologetics-navigation/screenshots/islam-art-redrawn-dark.png',animations:'disabled'});
await page.locator('.wv-claims-motif').screenshot({path:'design/apologetics-navigation/screenshots/islam-claims-redrawn-dark.png',animations:'disabled'});
const stage=page.locator('.mw-globe-stage');
await stage.scrollIntoViewIfNeeded();
await page.locator('.mw-globe-stage[aria-busy="false"]').waitFor({timeout:20000});
await page.waitForTimeout(200);
const results={bookClearance:clearance,countries:[]};
// Pakistan is already selected on arrival: opening the atlas must center it
// without requiring a second selection or leaving unattended rotation running.
await page.waitForTimeout(1900);
const initial=await page.evaluate(()=>window.globeMarkers.filter(m=>m.country==='PAK'));
const centerDistance=m=>Math.hypot(m.x-m.width/2,m.y-m.height/2);
assert.ok(initial.length>5,'The initial country should turn smoothly into view');
assert.ok(centerDistance(initial[0])>10,'The initial country should animate from its opening orientation');
assert.ok(centerDistance(initial.at(-1))<.1,'The default Pakistan selection must finish centered without another click');
const initialSpeeds=initial.slice(1).map((m,i)=>Math.hypot(m.x-initial[i].x,m.y-initial[i].y)/(m.time-initial[i].time)).filter(Number.isFinite);
const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
assert.ok(mean(initialSpeeds.slice(-5))<mean(initialSpeeds.slice(0,5))*.1,'The opening turn should slow down before stopping');
const firstFrameCount=initial.length;
await page.waitForTimeout(1000);
const idle=await page.evaluate(()=>window.globeMarkers);
assert.equal(idle.length,firstFrameCount,'The globe must stop rendering rotation after it centers the initial selection');
results.initialSelection={country:'PAK',frames:initial.length,finalDistance:centerDistance(initial.at(-1)),stopped:true};
await stage.screenshot({path:'design/apologetics-navigation/screenshots/globe-initial-pakistan-centered.png'});
async function choose(name,code){
 await page.locator('.mw-map-search .mw-country-search-toggle').click();
 const input=page.locator('.mw-map-search input');
 await input.fill(name);
 await page.evaluate(()=>window.globeMarkers=[]);
 const start=await page.evaluate(()=>performance.now());
 await input.press('Enter');
 await page.waitForTimeout(1900);
 const markers=await page.evaluate(code=>window.globeMarkers.filter(m=>m.country===code),code);
 assert.ok(markers.length>0,'Missing selected marker: '+name);
 const last=markers.at(-1),distance=m=>Math.hypot(m.x-m.width/2,m.y-m.height/2);
 assert.ok(distance(last)<.1,`${name} should finish at the center: ${distance(last)}`);
 const moving=markers.filter(m=>distance(m)>.1);
 if(moving.length>5){
  const early=moving.filter(m=>m.time-start<400),late=moving.filter(m=>m.time-start>700);
  const speed=frames=>frames.slice(1).map((m,i)=>Math.hypot(m.x-frames[i].x,m.y-frames[i].y)/(m.time-frames[i].time)).filter(Number.isFinite);
  const average=values=>values.reduce((a,b)=>a+b,0)/values.length;
  if(early.length>2&&late.length>2)assert.ok(average(speed(late))<average(speed(early)),name+' should decelerate');
 }
 await page.waitForTimeout(300);
 const settled=await page.evaluate(()=>window.globeMarkers.at(-1));
 assert.ok(distance(settled)<.1,name+' should remain centered');
 results.countries.push({name,frames:markers.length,finalDistance:distance(last),movingDuration:Math.round((moving.at(-1)?.time??start)-start)});
}
// Selecting the default country again leaves it centered.
await choose('Pakistan','PAK');
await choose('Indonesia','IDN');
await choose('Morocco','MAR');
// Choosing that same country again after manually turning must also recenter it.
await stage.focus();
for(let i=0;i<4;i++)await stage.press('ArrowRight');
await page.waitForTimeout(80);
const turned=await page.evaluate(()=>window.globeMarkers.at(-1));
assert.ok(Math.hypot(turned.x-turned.width/2,turned.y-turned.height/2)>25);
await choose('Morocco','MAR');
// Retarget an active turn without jumping back to its starting orientation.
await page.locator('.mw-map-search .mw-country-search-toggle').click();
await page.locator('.mw-map-search input').fill('Albania');
await page.locator('.mw-map-search input').press('Enter');
await page.waitForTimeout(100);
await choose('Indonesia','IDN');
await page.emulateMedia({reducedMotion:'reduce'});
await choose('Morocco','MAR');
await page.getByRole('button',{name:'Flat map view',exact:true}).click();
await page.locator('.mw-globe-stage.is-flat[aria-busy="false"]').waitFor();
await page.getByRole('button',{name:'Globe view',exact:true}).click();
await page.locator('.mw-globe-stage:not(.is-flat)[aria-busy="false"]').waitFor();
await page.evaluate(()=>document.documentElement.dataset.theme='light');
await page.locator('.wv-hero-art').screenshot({path:'design/apologetics-navigation/screenshots/islam-art-redrawn-light.png',animations:'disabled'});
await page.locator('.wv-claims-motif').screenshot({path:'design/apologetics-navigation/screenshots/islam-claims-redrawn-light.png',animations:'disabled'});
for(const width of [1024,900,390,320]){
 await page.setViewportSize({width,height:1100});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow at '+width);
}
assert.deepEqual(errors,[]);results.browserErrors=errors;
await fs.writeFile('design/apologetics-navigation/art-globe-verification.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
await browser.close();
