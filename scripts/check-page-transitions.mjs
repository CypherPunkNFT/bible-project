import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge'});
const page=await browser.newPage({viewport:{width:1366,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.transitionAudit=[];
 const start=document.startViewTransition.bind(document);
 document.startViewTransition=update=>{
  const record={};window.transitionAudit.push(record);
  const transition=start(update);
  transition.ready.then(()=>{
   const root=document.documentElement;
   const name=root.dataset.sitePageSlide?'site-page':root.dataset.memoryPageSlide?'ap-section-page':root.dataset.peopleSlide?'people-page':root.dataset.teacherSlide?'teacher-page':root.dataset.resourceSlide?'resource-page':root.dataset.placesSlide?'places-page':root.dataset.topicsSlide?'topics-page':'ap-section-page';
   Object.assign(record,{path:location.pathname,name,animation:getComputedStyle(root,`::view-transition-new(${name})`).animationName,header:getComputedStyle(root,'::view-transition-new(site-header)').opacity,headerZ:getComputedStyle(root,'::view-transition-group(site-header)').zIndex});
  }).catch(e=>record.error=e.message);return transition;
 };
});
const cases=[
 ['/','/study'],['/study','/study/theology'],
 ['/study/theology?area=people','/study/long-memory'],['/study/theology?area=people','/study/people'],
 ['/study/long-memory?person=moses','/people/moses'],
 ['/study/theology','/bible'],['/bible','/search'],['/search','/teachers'],
 ['/teachers','/resources'],['/resources','/testimonies'],['/testimonies','/study'],
 ['/teachers/preachers-and-authors','/teachers/scholars'],['/resources','/resources/learning'],
];
try{
 for(const [from,to] of cases){
  await page.goto('http://127.0.0.1:8931'+from);
  const link=page.locator(`a[href="${to}"],a[href^="${to}?"]`).first();await link.waitFor();await link.click();
  await page.waitForURL(url=>url.pathname===to);
  await page.waitForFunction(()=>window.transitionAudit.some(x=>x.animation));
  const records=await page.evaluate(()=>window.transitionAudit);
  assert.equal(records.length,1,`${from} → ${to}: exactly one transition`);
  assert.ok(['site-page-rise-in','ap-page-rise-in'].includes(records[0].animation),JSON.stringify(records));
  assert.equal(records[0].header,'1');assert.equal(records[0].headerZ,'100');
  await page.waitForFunction(()=>!document.documentElement.dataset.sitePageSlide&&!document.documentElement.dataset.memoryPageSlide);
  console.log('PASS',from,'→',to);
 }
 // Same-page filtering must not trigger a full-page transition.
 await page.goto('http://127.0.0.1:8931/study/long-memory');
 await page.getByRole('button',{name:'Words spoken',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.transitionAudit.length),0);
 // Browser Back and reduced motion remain usable.
 await page.locator('header a[href="/search"]').click();await page.waitForURL('**/search');
 await page.waitForFunction(()=>!document.documentElement.dataset.sitePageSlide);
 await page.goBack();await page.waitForURL('**/study/long-memory**');
 await page.emulateMedia({reducedMotion:'reduce'});
 const count=await page.evaluate(()=>window.transitionAudit.length);
 await page.locator('header a[href="/search"]').click();await page.waitForURL('**/search');
 assert.equal(await page.evaluate(()=>window.transitionAudit.length),count);
 assert.deepEqual(errors,[]);
 console.log('PASS: filters, Back, reduced motion, no browser errors');
}finally{await browser.close();}
