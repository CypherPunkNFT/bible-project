import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const origin=process.env.MOSES_TEST_ORIGIN||'http://127.0.0.1:8931';
const browser=await chromium.launch({channel:'msedge'});
const errors=[];
async function open(release) {
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 page.on('pageerror',error=>errors.push(error.message));
 if(release)await page.route(origin+'/**',route=>{
  const url=new URL(route.request().url());const base=path.resolve(release);const file=path.resolve(base,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(base+path.sep))return route.abort();
  if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
  if(!path.extname(file))return route.fulfill({path:path.join(base,'index.html')});
  return route.fulfill({status:404,body:'Not found'});
 });
 await page.goto(origin+'/people/moses');await page.locator('.mg-ch').first().waitFor();return page;
}
try {
 const baseline=await open('.release/moses-merged-20261012/site');
 const expected=[];
 for(let act=0;act<3;act++) {
  const chapter=baseline.locator('.mg-ch').nth(act);
  expected.push({events:await chapter.locator('.lg-time li').allTextContents(),links:await chapter.locator('.lg-blocks a').evaluateAll(items=>items.map(item=>item.getAttribute('href')).sort())});
 }
 await baseline.close();
 const page=await open(process.env.MOSES_TEST_RELEASE);
 assert.equal(await page.locator('.mg-ch .moses-topics').count(),3);
 assert.equal(await page.locator('.lg-blocks').count(),0);
 assert.equal(await page.locator('.horizontal-label small').count(),0);
 assert.equal(await page.locator('.review-bar,.study-heading,.events-context').count(),0);
 for(let act=0;act<3;act++) {
  const chapter=page.locator('.mg-ch').nth(act);const topics=chapter.locator('.moses-topics');const links=[];
  assert.deepEqual(await chapter.locator('.lg-time li').allTextContents(),expected[act].events);
  for(let group=0;group<3;group++) {
   await topics.locator('[data-topic-group]').nth(group).evaluate(button=>button.click());
   const count=await topics.locator('[data-topic-sub]').count();assert.ok(count>0);
   for(let sub=0;sub<count;sub++) {
    await topics.locator('[data-topic-sub]').nth(sub).evaluate(button=>button.click());
    links.push(...await topics.locator('.topic-reading a').evaluateAll(items=>items.map(item=>item.getAttribute('href'))));
   }
  }
  assert.deepEqual(links.sort(),expected[act].links,'Chapter '+(act+1)+' citations changed');
 }
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:844});
  const topics=page.locator('.moses-topics').nth(1);
  await topics.locator('[data-topic-group="1"]').evaluate(button=>{if(button.getAttribute('aria-expanded')!=='true')button.click();});
  await topics.locator('.topic-subnav').evaluate(el=>el.scrollIntoView({block:'center'}));
  for(const index of [1,0,2,1,0]) {
   const button=topics.locator('[data-topic-sub]').nth(index);await button.focus();
   const before=await page.evaluate(()=>scrollY);await button.click();await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>scrollY),before,'Subsection switch moved viewport');
  }
  for(const group of [2,0,1]) {
   const before=await page.evaluate(()=>scrollY);await topics.locator('[data-topic-group]').nth(group).evaluate(button=>button.click());await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>scrollY),before,'Category switch moved viewport');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('.moses-topics').nth(1).evaluate(el=>el.scrollIntoView({block:'start'}));
 fs.mkdirSync('.local/moses-qa',{recursive:true});await page.screenshot({path:'.local/moses-qa/topics-integrated.png'});
 assert.deepEqual(errors,[]);console.log('PASS: approved topics only; all original events and citations retained; desktop/mobile switches preserve scroll.');
}finally{await browser.close();}
