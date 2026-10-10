import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const dir=path.dirname(fileURLToPath(import.meta.url)),website=path.resolve(dir,'../..');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}});
await page.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
const root='http://localhost:8931/mockups/apologetics-navigation/',islam='/apologetics/worldviews/islam';
function assert(v,m){if(!v)throw Error(m);}
async function go(d,route=islam){await page.goto(root+'?d='+d+'#'+route);await page.locator('.am-content h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);}
try{
 for(const d of ['a','b','c','d']){
  await go(d);
  const menu=page.locator('.sm-container');
  assert(await menu.locator('.sm-main a').count()===9,'Nine main links '+d);
  assert(await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link').count()===5,'Five Islam subpages '+d);
  assert(!/Across beliefs|Four starting points|One thoughtful conversation|Explore worldviews|All worldviews|Choose a worldview/i.test(await menu.innerText()),'No redundant copy '+d);
  assert(await page.locator('.wv-claim-map button').count()===12,'Original questions '+d);
  assert(await page.locator('#muslim-world').count()===1,'Atlas '+d);
  assert(await page.locator('.wv-source-roadmap button').count()===4,'Reading stages '+d);
  assert((await page.locator('#sm-panel').boundingBox()).height<105,'Compact desktop submenu '+d);
  for(const name of ['Overview','Understanding Islam','Ministry','Texts & studies','Christianity & Islam']){
   await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link',{name,exact:true}).click();
   await page.locator('.am-content h1').first().waitFor();
   assert(await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link',{name,exact:true}).getAttribute('aria-current')==='page','Selected subpage '+name+' '+d);
  }
  if(d==='a'||d==='c'){
   const before=await page.locator('.am-content h1').first().boundingBox();
   await menu.getByRole('button',{name:'Choose another worldview'}).click();
   await menu.getByRole('navigation',{name:'Worldview collections'}).waitFor();
   const after=await page.locator('.am-content h1').first().boundingBox();
   assert(Math.abs(before.y-after.y)<1,'No layout shift '+d);
   await page.screenshot({path:path.join(dir,'screenshots',`round3-${d}-picker-dark.png`),animations:'disabled'});
   if(d==='a')assert(await page.locator('.sm-fade-layer').first().evaluate(e=>getComputedStyle(e).transitionDuration.includes('0.18')),'Fade transition');
   await page.keyboard.press('Escape');
   assert(await page.locator('#sm-panel').isVisible(),'Escape only dismisses picker '+d);
   assert(await menu.getByRole('button',{name:'Choose another worldview'}).evaluate(e=>e===document.activeElement),'Picker restores focus '+d);
   if(d==='c'){
    await menu.getByRole('button',{name:'Choose another worldview'}).click();
    await page.locator('.am-content h1').first().click();
    assert(await page.locator('.sm-popover').count()===0,'Click outside closes palette');
   }
  }
  for(const name of ['Secular thought','Buddhism','Hinduism','Islam']){
   if(d==='a'||d==='c')await menu.getByRole('button',{name:'Choose another worldview'}).click();
   await menu.getByRole('navigation',{name:'Worldview collections'}).getByRole('link',{name,exact:true}).click();
   await page.locator('.am-content h1').first().waitFor();
   assert(await menu.getByRole('navigation',{name:name+' subpages'}).isVisible(),'Switch '+name+' '+d);
  }
  await menu.getByRole('button',{name:'Collapse Worldviews',exact:true}).click();
  assert(await page.locator('#sm-panel').count()===0,'Close panel '+d);
  await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).click();
  await page.keyboard.press('Escape');
  assert(await page.locator('#sm-panel').count()===0,'Escape main '+d);
  assert(await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).evaluate(e=>e===document.activeElement),'Main focus '+d);
  await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).click();
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:1050});
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),'No overflow '+d+' '+width);
   assert((await page.locator('#sm-panel').boundingBox()).height<105,'One compact submenu row '+d+' '+width);
   const study=menu.getByRole('navigation',{name:'Islam subpages'});
   assert(await study.isVisible(),'Visible study row '+d+' '+width);
   await menu.locator('.sm-main a').first().focus();
   await study.getByRole('link',{name:'Christianity & Islam',exact:true}).focus();
   await page.waitForFunction(()=>{const n=document.querySelector('.sm-study-links');return n.lastElementChild.getBoundingClientRect().right<=innerWidth+1;},null,{timeout:2000});
   const last=await study.getByRole('link',{name:'Christianity & Islam',exact:true}).boundingBox();
   assert(last.x+last.width<=width+1,'Keyboard reveals clipped links '+d+' '+width);
   if(width===390)await page.screenshot({path:path.join(dir,'screenshots',`round3-${d}-390-dark.png`),animations:'disabled'});
  }
  await page.setViewportSize({width:1440,height:1050});
  await menu.locator('.sm-main').getByRole('link',{name:'Questions',exact:true}).click();
  assert(await menu.locator('.sm-main>div[data-current=true]').innerText().then(s=>s.trim())==='Questions','Active top section follows route '+d);
  checks.push(d+': links, worldviews, compact row, active section, keyboard, 320-1440px');
 }
 await go('a',islam+'?question=comparison-3');
 for(const d of ['B','C','D','A']){
  await page.getByRole('group',{name:'Choose a navigation design'}).getByRole('button',{name:d,exact:true}).click();
  assert(page.url().endsWith('#'+islam+'?question=comparison-3'),'Direction retains route/query');
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 assert(await page.locator('.sm-fade-layer').first().evaluate(e=>getComputedStyle(e).transitionDuration.split(',').every(t=>parseFloat(t)<=0.001)),'Reduced motion');
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'source-baseline.json'),'utf8')).files;
 for(const [file,hash] of Object.entries(baseline))assert(createHash('sha256').update(fs.readFileSync(path.join(website,file))).digest('hex')===hash,'Source unchanged '+file);
 assert(errors.length===0,'Browser errors: '+errors.join('; '));
 fs.writeFileSync(path.join(dir,'verification-round3.json'),JSON.stringify({checks,errors,sourceUnchanged:true},null,2));
 console.log(JSON.stringify({checks,errors,sourceUnchanged:true},null,2));
}finally{await browser.close();}
