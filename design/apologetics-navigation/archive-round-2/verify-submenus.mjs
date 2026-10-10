import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const dir=path.dirname(fileURLToPath(import.meta.url)),website=path.resolve(dir,'../..');
fs.mkdirSync(path.join(dir,'screenshots'),{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
await page.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
const root='http://localhost:8931/mockups/apologetics-navigation/',islam='/apologetics/worldviews/islam';
function assert(v,m){if(!v)throw Error(m);}
async function go(d,route=islam){await page.goto(root+'?d='+d+'#'+route);await page.locator('.am-content h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);}
try{
 for(const d of ['a','b','c','d']){
  await go(d);
  const menu=page.locator('.sm-container');
  assert(await menu.locator('.sm-main a').count()===9,'Nine main links '+d);
  assert(await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link').count()===5,'Five Islam subpages '+d);
  assert(!/Across beliefs|Four starting points|One thoughtful conversation|Explore worldviews|All worldviews|Choose a worldview/i.test(await menu.innerText()),'Redundant copy removed '+d);
  assert(await page.locator('.wv-claim-map button').count()===12,'12 original questions '+d);
  assert(await page.locator('#muslim-world').count()===1,'Atlas '+d);
  assert(await page.locator('.wv-source-roadmap button').count()===4,'Reading stages '+d);
  for(const name of ['Overview','Understanding Islam','Ministry','Texts & studies','Christianity & Islam']){
   await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link',{name,exact:true}).click();
   await page.locator('.am-content h1').first().waitFor();
   assert(await menu.getByRole('link',{name,exact:true}).getAttribute('aria-current')==='page','Current subpage '+name+' '+d);
  }
  await menu.getByRole('button',{name:/Collapse Islam subpages/}).click();
  assert(await menu.getByRole('navigation',{name:'Islam subpages'}).count()===0,'Collapse '+d);
  if(d==='a')await menu.getByRole('button',{name:'Show Islam subpages'}).click();
  else await menu.getByRole('button',{name:'Expand Islam subpages'}).click();
  assert(await menu.getByRole('navigation',{name:'Islam subpages'}).isVisible(),'Expand '+d);
  for(const name of ['Secular thought','Buddhism','Hinduism','Islam']){
   if(d==='a')await menu.getByRole('button',{name:/Collapse .* subpages and choose/}).click();
   await menu.getByRole('link',{name,exact:true}).click();
   await page.locator('.am-content h1').first().waitFor();
   assert(await menu.getByRole('navigation',{name:name+' subpages'}).isVisible(),'Switch '+name+' '+d);
  }
  await menu.getByRole('button',{name:'Collapse Worldviews',exact:true}).click();
  assert(await page.locator('#sm-panel').count()===0,'Close main '+d);
  await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).click();
  await page.keyboard.press('Escape');
  assert(await page.locator('#sm-panel').count()===0,'Escape '+d);
  assert(await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).evaluate(e=>e===document.activeElement),'Focus '+d);
  await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).click();
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:1050});
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),'No overflow '+d+' '+width);
   assert(await menu.getByRole('navigation',{name:'Islam subpages'}).isVisible(),'Visible subpages '+d+' '+width);
   if(width===1440||width===390)await page.screenshot({path:path.join(dir,'screenshots',`round2-${d}-${width}-dark.png`),animations:'disabled'});
  }
  await page.setViewportSize({width:1440,height:1050});
  checks.push(d+': links, current states, collapse, worldviews, Escape/focus, preserved content, responsive');
 }
 await go('a',islam+'?question=comparison-3');
 for(const d of ['B','C','D','A']){
  await page.getByRole('group',{name:'Choose a navigation design'}).getByRole('button',{name:d,exact:true}).click();
  assert(page.url().endsWith('#'+islam+'?question=comparison-3'),'Direction retains route/query');
 }
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'source-baseline.json'),'utf8')).files;
 for(const [file,hash] of Object.entries(baseline))assert(createHash('sha256').update(fs.readFileSync(path.join(website,file))).digest('hex')===hash,'Source unchanged '+file);
 assert(errors.length===0,'Browser errors: '+errors.join('; '));
 fs.writeFileSync(path.join(dir,'verification-round2.json'),JSON.stringify({checks,errors,sourceUnchanged:true},null,2));
 console.log(JSON.stringify({checks,errors,sourceUnchanged:true},null,2));
}finally{await browser.close();}
