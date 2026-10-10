import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const dir=path.dirname(fileURLToPath(import.meta.url)),website=path.resolve(dir,'../..');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
await page.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
const root='http://localhost:8931/mockups/apologetics-navigation/?d=f';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
async function ready(){await page.locator('.am-content h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);}
async function go(route='/apologetics/worldviews'){await page.goto(root+'#'+route);await ready();}
async function toggleOpen(){const toggle=page.getByRole('button',{name:'Browse Apologetics',exact:true});if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();}
try{
 await go();assert(await page.locator('.av-merged-primary a:visible').count()===9,'Nine main options visible');
 assert(await page.locator('.av-column-browser > section').count()===3,'Three columns retained');
 assert(!/all worldviews|explore the library/i.test(await page.locator('.av-merged').innerText()),'Removed navigation copy');
 await page.screenshot({animations:'disabled',path:path.join(dir,'screenshots','merge-open-1440-dark.png')});
 await page.screenshot({animations:'disabled',path:path.resolve(dir,'../_gallery/thumbs/apologetics-navigation-f-dark.png')});
 await page.getByRole('button',{name:'Browse Apologetics',exact:true}).click();
 assert(await page.locator('.av-merged-primary a:visible').count()===9,'Main options remain when collapsed');
 for(const name of ['Explore','Questions','Reformed theology','Historic texts','Learning paths','Worldviews','Debates','Practice','My study']){
  await page.locator('.av-merged-primary').getByRole('link',{name,exact:true}).click();await ready();
  assert(await page.locator('.av-merged-primary').getByRole('link',{name,exact:true}).getAttribute('aria-current')==='page','Main destination '+name);
  await page.getByRole('button',{name:'Browse '+name,exact:true}).click();
  assert(await page.getByRole('group',{name:'Choose an Apologetics section'}).getByRole('button',{name,exact:true}).getAttribute('aria-pressed')==='true','Dropdown selects '+name);
  await page.keyboard.press('Tab');await page.keyboard.press('Escape');
  assert(await page.getByRole('button',{name:'Browse '+name,exact:true}).evaluate(e=>e===document.activeElement),'Escape focus '+name);
  checks.push('Main link, section expansion and keyboard '+name);
 }
 for(const [name,id] of [['Islam','islam'],['Secular thought','secular'],['Buddhism','buddhism'],['Hinduism','hinduism']]){
  await page.getByRole('button',{name:'Browse Worldviews',exact:true}).click();
  await page.getByRole('button',{name,exact:true}).click();
  await page.getByRole('navigation',{name:'Choose a study destination'}).getByRole('link').filter({hasText:id==='islam'?'Christianity & Islam':name+' collection'}).click();await ready();
  assert(page.url().includes('/worldviews/'+id),'Collection '+id);
  assert(!/all worldviews/i.test(await page.locator('.am-shell').innerText()),'No repeated All worldviews on '+id);
  checks.push('Worldview '+id);
 }
 await go('/apologetics/worldviews/islam');
 assert(await page.locator('.wv-claim-map button').count()===12,'Full comparison preserved');
 assert(await page.locator('#muslim-world').count()===1,'Atlas preserved');
 await page.locator('.wv-claim-map button').filter({hasText:'What happened at the cross?'}).click();const hash=new URL(page.url()).hash;
 await page.getByRole('group',{name:'Choose a navigation design'}).getByRole('button',{name:'E',exact:true}).click();
 await page.getByRole('group',{name:'Choose a navigation design'}).getByRole('button',{name:'F',exact:true}).click();
 assert(new URL(page.url()).hash===hash,'Selected question preserved across design changes');checks.push('Question and route retained');
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:1050});await go('/apologetics/worldviews/islam');
  for(const opened of [false,true]){
   if(opened)await toggleOpen();
   assert(await page.locator('.av-merged-primary a:visible').count()===9,'Main menu remains visible '+width);
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'No overflow '+width+' '+opened);
   if(width===1440||width===390)await page.screenshot({animations:'disabled',path:path.join(dir,'screenshots',`merge-${opened?'open':'closed'}-${width}-islam-dark.png`)});
   checks.push('Layout '+width+' '+(opened?'open':'closed'));
  }
  await page.getByRole('navigation',{name:'Choose a study destination'}).getByRole('link').filter({hasText:'Understanding Islam'}).click();await ready();
  assert(page.url().includes('/guide/understanding'),'Nested navigation '+width);
 }
 await page.getByRole('button',{name:'Search Apologetics',exact:false}).click();await page.locator('dialog[open]').waitFor();
 await page.getByRole('searchbox',{name:'Search library navigation'}).fill('Buddhism');await page.locator('.am-results').getByRole('link').first().click();await ready();assert(page.url().includes('buddhism'),'Search works');checks.push('Separate search');
 await page.setViewportSize({width:1440,height:1050});await go();await page.reload();await ready();
 await page.getByRole('switch',{name:'Dark mode'}).click();
 await page.screenshot({animations:'disabled',path:path.join(dir,'screenshots','merge-open-1440-light.png')});
 await page.screenshot({animations:'disabled',path:path.resolve(dir,'../_gallery/thumbs/apologetics-navigation-f-light.png')});
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'source-baseline.json'),'utf8'));
 const unchanged=Object.entries(baseline.files).every(([file,hash])=>createHash('sha256').update(fs.readFileSync(path.join(website,file))).digest('hex')===hash);
 assert(unchanged,'Production and prior concept unchanged');assert(!errors.length,JSON.stringify(errors));
 fs.writeFileSync(path.join(dir,'merge-verification.json'),JSON.stringify({checks,sourceUnchanged:unchanged,pageErrors:errors},null,2));
 console.log(JSON.stringify({checks:checks.length,sourceUnchanged:unchanged,errors}));
}finally{await browser.close();}
