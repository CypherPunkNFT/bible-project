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
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const root='http://localhost:8931/mockups/apologetics-navigation/';
const checks=[];
function assert(value,message){if(!value)throw Error(message);}
async function ready(){await page.locator('.am-content h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);}
async function go(route){await page.goto(root+'#'+route);await ready();}
try {
 await page.goto(root);await ready();
 assert(await page.locator('.am-primary a').count()===9,'All main sections');
 for(const name of ['Islam','Secular thought','Buddhism','Hinduism']){
  await page.getByRole('navigation',{name:'Worldviews',exact:true}).getByRole('link',{name,exact:true}).click();await ready();
  assert((await page.locator('.am-content h1').innerText()).toLowerCase().includes(name.toLowerCase()),'Collection '+name);
  assert(await page.locator('.am-secondary .am-world-dot').count()===4,'Worldviews remain visible');
  checks.push('Complete collection '+name);
 }
 await go('/apologetics/worldviews/islam');
 assert(await page.locator('.wv-claim-map button').count()===12,'Twelve questions preserved');
 await page.locator('.wv-claim-map button').filter({hasText:'What happened at the cross?'}).click();
 assert(page.url().includes('question=comparison-3'),'Question selection retains local route');
 assert(await page.locator('#muslim-world').count()===1,'Atlas present');
 assert(await page.locator('.wv-source-roadmap button').count()===4,'Reading plan present');
 for(const name of ['Overview','Understanding Islam','Ministry','Texts & studies','Christianity & Islam']){
  await page.getByRole('navigation',{name:'Islam study sections'}).getByRole('link',{name:new RegExp(name)}).click();await ready();
  assert(await page.getByRole('navigation',{name:'Worldviews',exact:true}).getByRole('link',{name:'Islam',exact:true}).getAttribute('aria-current')==='page','Islam stays selected');
  checks.push('Islam section '+name);
 }
 for(const name of ['Explore','Questions','Reformed theology','Historic texts','Learning paths','Debates','Practice','My study','Worldviews']){
  await page.locator('.am-primary').getByRole('link',{name,exact:true}).click();await ready();
  assert(await page.locator('.am-primary').getByRole('link',{name,exact:true}).getAttribute('aria-current')==='page','Main section selection '+name);
  checks.push('Primary section '+name);
 }
 await page.getByRole('button',{name:'Browse library'}).click();await page.locator('dialog[open]').waitFor();
 await page.screenshot({path:path.join(dir,'screenshots','library-menu-dark.png')});
 await page.getByRole('searchbox',{name:'Search library navigation'}).fill('Buddhism');
 await page.locator('.am-results').getByRole('link',{name:'Buddhism',exact:false}).first().click();await ready();
 assert(page.url().includes('/worldviews/buddhism'),'Search opens worldview');
 await page.keyboard.press('Control+k');await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');
 assert(await page.locator('dialog[open]').count()===0,'Escape closes menu');
 assert(await page.getByRole('button',{name:'Browse library'}).evaluate(e=>document.activeElement===e),'Focus restored');
 checks.push('Menu search, keyboard shortcut, Escape and focus');
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:1050});
  for(const [name,route] of [['worldviews','/apologetics/worldviews'],['islam','/apologetics/worldviews/islam'],['guide','/apologetics/worldviews/islam/guide']]){
   await go(route);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert(!overflow,'Overflow '+name+' '+width);
   if(width<=900&&name==='islam'){
    await page.getByRole('button',{name:/Islam \/ Christianity/}).click();
    assert(await page.getByRole('navigation',{name:'Islam study sections'}).isVisible(),'Mobile section menu');
    await page.getByRole('navigation',{name:'Islam study sections'}).getByRole('link',{name:/Understanding Islam/}).click();await ready();
    assert(page.url().includes('/guide/understanding'),'Mobile section navigation');
    await go(route);
   }
   if(width===1440||width===390)await page.screenshot({path:path.join(dir,'screenshots',name+'-'+width+'-dark.png')});
   checks.push('Layout '+name+' '+width);
  }
 }
 await page.getByRole('button',{name:'Browse library'}).click();await page.locator('dialog[open]').waitFor();
 assert(!(await page.evaluate(()=>document.querySelector('dialog').scrollWidth>document.querySelector('dialog').clientWidth+1)),'Mobile dialog fits');
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:1440,height:1050});await go('/apologetics/worldviews');
 await page.screenshot({path:path.resolve(dir,'../_gallery/thumbs/apologetics-navigation-dark.png')});
 await page.getByRole('switch',{name:'Dark mode'}).click();
 await page.screenshot({path:path.resolve(dir,'../_gallery/thumbs/apologetics-navigation-light.png')});
 await go('/apologetics/worldviews/islam');await page.screenshot({path:path.join(dir,'screenshots','islam-1440-light.png')});
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'source-baseline.json'),'utf8'));
 const unchanged=Object.entries(baseline.files).every(([file,hash])=>createHash('sha256').update(fs.readFileSync(path.join(website,file))).digest('hex')===hash);
 assert(unchanged,'Original sources unchanged');assert(errors.length===0,'Browser errors: '+JSON.stringify(errors));
 fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify({checks,productionAndPreviousPreviewUnchanged:unchanged,pageErrors:errors},null,2));
 console.log(JSON.stringify({checks:checks.length,sourceUnchanged:unchanged,errors}));
} finally {await browser.close();}
