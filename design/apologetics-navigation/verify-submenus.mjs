import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const dir=path.dirname(fileURLToPath(import.meta.url)),website=path.resolve(dir,'../..');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await page.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
const root='http://localhost:8931/mockups/apologetics-navigation/',islam='/apologetics/worldviews/islam';
function assert(v,m){if(!v)throw Error(m);}
async function go(d,route=islam){await page.goto(root+'?d='+d+'#'+route);await page.locator('.am-content h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);}
async function equalRows(label){const heights=await page.evaluate(()=>[document.querySelector('.sm-main').getBoundingClientRect().height,document.querySelector('#sm-panel').getBoundingClientRect().height]);assert(Math.abs(heights[0]-heights[1])<1,'Equal row heights '+label+' '+heights.join('/'));}
try{
 for(const d of ['a','b','c','d']){
  await go(d);const menu=page.locator('.sm-container');
  assert(await menu.locator('.sm-main a').count()===9,'Nine main links '+d);
  assert(await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link').count()===5,'Five subpages '+d);
  assert(await menu.locator('.sm-study-links svg').count()===0,'No lower arrows '+d);
  assert(await menu.getByRole('link',{name:'Secular thought',exact:true}).locator('ellipse').count()===3,'Atom artwork '+d);
  assert(await page.locator('.wv-claim-map button').count()===12,'Original questions '+d);
  assert(await page.locator('#muslim-world').count()===1,'Atlas '+d);
  assert(await page.locator('.wv-source-roadmap button').count()===4,'Reading stages '+d);
  await equalRows(d);
  const mainStyle=await menu.locator('.sm-main>div[data-current=true]').evaluate(e=>({shadow:getComputedStyle(e).boxShadow,bg:getComputedStyle(e).backgroundColor,dot:getComputedStyle(e.querySelector('a'),'::before').content}));
  assert(mainStyle.shadow.includes('-4px'),'C main underline '+d);assert(mainStyle.dot!=='none','C main dot '+d);
  for(const name of ['Overview','Understanding Islam','Ministry','Texts & studies','Christianity & Islam']){
   await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link',{name,exact:true}).click();
   await page.locator('.am-content h1').first().waitFor();
   assert(await menu.getByRole('navigation',{name:'Islam subpages'}).getByRole('link',{name,exact:true}).getAttribute('aria-current')==='page','Selected subpage '+name+' '+d);
  }
  const colors=[];
  for(const name of ['Secular thought','Buddhism','Hinduism','Islam']){
   await menu.getByRole('navigation',{name:'Worldview collections'}).getByRole('link',{name,exact:true}).click();
   await page.locator('.am-content h1').first().waitFor();
   const study=menu.getByRole('navigation',{name:name+' subpages'});
   assert(await study.isVisible(),'Switch '+name+' '+d);
   const color=await study.locator('a[aria-current]').evaluate(e=>({color:getComputedStyle(e).color,shadow:getComputedStyle(e).boxShadow,dot:getComputedStyle(e,'::before').content}));
   const iconColor=await menu.getByRole('navigation',{name:'Worldview collections'}).locator('a[aria-current]').evaluate(e=>getComputedStyle(e).color);
   assert(color.color===iconColor,'Worldview-specific selected color '+name+' '+d);
   assert(color.shadow.includes('-4px')&&color.dot!=='none','Matching lower dot/underline '+name+' '+d);
   colors.push(color.color);await equalRows(name+' '+d);
  }
  assert(new Set(colors).size>=3,'Distinct worldview colors '+d);
  await menu.getByRole('button',{name:'Collapse Worldviews',exact:true}).click();
  assert(await page.locator('#sm-panel').count()===0,'Close panel '+d);
  await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).click();await page.keyboard.press('Escape');
  assert(await page.locator('#sm-panel').count()===0,'Escape main '+d);
  assert(await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).evaluate(e=>e===document.activeElement),'Main focus '+d);
  await menu.getByRole('button',{name:'Browse Worldviews',exact:true}).click();
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:1000});await equalRows(d+' '+width);
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)),'No overflow '+d+' '+width);
   const study=menu.getByRole('navigation',{name:'Islam subpages'});
   await menu.locator('.sm-main a').first().focus();await study.getByRole('link',{name:'Christianity & Islam',exact:true}).focus();
   await page.waitForFunction(()=>document.querySelector('.sm-study-links').lastElementChild.getBoundingClientRect().right<=innerWidth+1);
   if(width===390)await page.screenshot({path:path.join(dir,'screenshots',`round4-${d}-390-dark.png`),animations:'disabled'});
  }
  await page.setViewportSize({width:1440,height:1000});
  await menu.locator('.sm-main').getByRole('link',{name:'Questions',exact:true}).click();
  assert((await menu.locator('.sm-main>div[data-current=true]').innerText()).trim()==='Questions','Active top section follows route '+d);
  await menu.getByRole('button',{name:'Browse Questions'}).click();await equalRows('Questions '+d);
  assert(await page.locator('.sm-other-sections svg').count()===0,'No other lower arrows '+d);
  await go(d,'/apologetics/worldviews');
  assert(await menu.locator('.sm-world-choices a').count()===4,'Index choices '+d);
  assert(await menu.locator('.sm-world-choices a[aria-current]').count()===0,'No implied index selection '+d);
  checks.push(d+': equal heights 320-1440px; matching highlights/colors; links; artwork; keyboard; preserved content');
 }
 await go('a',islam+'?question=comparison-3');
 for(const d of ['B','C','D','A']){await page.getByRole('group',{name:'Choose a navigation design'}).getByRole('button',{name:d,exact:true}).click();assert(page.url().endsWith('#'+islam+'?question=comparison-3'),'Retains route/query');}
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'source-baseline.json'),'utf8')).files;
 for(const [file,hash] of Object.entries(baseline))assert(createHash('sha256').update(fs.readFileSync(path.join(website,file))).digest('hex')===hash,'Source unchanged '+file);
 assert(errors.length===0,'Browser errors: '+errors.join('; '));
 fs.writeFileSync(path.join(dir,'verification-round4.json'),JSON.stringify({checks,errors,sourceUnchanged:true},null,2));console.log(JSON.stringify({checks,errors,sourceUnchanged:true},null,2));
}finally{await browser.close();}
