import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const dir=path.dirname(fileURLToPath(import.meta.url)),website=path.resolve(dir,'../..');
const root='http://localhost:8931/mockups/apologetics-navigation/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
await page.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
async function ready(){await page.locator('.am-content h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);}
async function go(d,route='/apologetics/worldviews'){await page.goto(root+'?d='+d+'#'+route);await ready();}
async function primary(d,name){
 if(d==='a')await page.locator('.am-primary').getByRole('link',{name,exact:true}).click();
 if(d==='b')await page.locator('.av-mega-primary').getByRole('link',{name,exact:true}).click();
 if(d==='c')await page.locator('.av-tree-parent').getByRole('link',{name,exact:true}).click();
 if(d==='d'){await page.locator('.av-context-level').nth(0).locator(':scope > button').click();await page.getByRole('navigation',{name:'Apologetics sections',exact:true}).getByRole('link',{name,exact:true}).click();}
 if(d==='e'){if(!await page.locator('.av-column-browser').isVisible())await page.locator('.av-columns-toolbar > button').click();await page.getByRole('group',{name:'Choose an Apologetics section'}).getByRole('button',{name,exact:true}).click();await page.locator('.av-column-footer').click();}
 await ready();
}
async function worldview(d,name){
 if(d==='a')await page.getByRole('navigation',{name:'Worldviews',exact:true}).getByRole('link',{name,exact:true}).click();
 if(d==='b'){if(!await page.locator('.av-mega-panel').isVisible())await page.getByRole('button',{name:'Browse Worldviews',exact:true}).click();await page.locator('.av-world-cards').getByRole('link').filter({has:page.locator('strong',{hasText:name})}).click();}
 if(d==='c')await page.locator('.av-tree-children > div > a').filter({hasText:name}).click();
 if(d==='d'){await page.locator('.av-context-level').nth(1).locator(':scope > button').click();await page.getByRole('navigation',{name:'Worldviews',exact:true}).getByRole('link').filter({hasText:name}).click();}
 if(d==='e'){if(!await page.locator('.av-column-browser').isVisible())await page.locator('.av-columns-toolbar > button').click();await page.getByRole('group',{name:'Choose an Apologetics section'}).getByRole('button',{name:'Worldviews',exact:true}).click();await page.getByRole('button',{name,exact:true}).click();await page.getByRole('navigation',{name:'Choose a study destination'}).getByRole('link',{name:name==='Islam'?'Christianity & Islam':'^',exact:false}).count();const destination=page.getByRole('navigation',{name:'Choose a study destination'}).getByRole('link').filter({hasText:name==='Islam'?'Christianity & Islam':name+' collection'});await destination.click();}
 await ready();assert((await page.locator('.am-content h1').first().innerText()).toLowerCase().includes(name.toLowerCase()),d+' worldview '+name);
}
try{
 for(const d of ['a','b','c','d','e']){
  await go(d);assert(await page.locator('[data-design]').getAttribute('data-design')===d,'Design parameter '+d);
  await page.screenshot({animations:"disabled",path:path.join(dir,'screenshots',`variant-${d}-worldviews-1440-dark.png`)});
  for(const name of ['Islam','Secular thought','Buddhism','Hinduism']){await worldview(d,name);checks.push(d+' worldview '+name);}
  for(const name of ['Explore','Questions','Reformed theology','Historic texts','Learning paths','Debates','Practice','My study','Worldviews']){await primary(d,name);checks.push(d+' section '+name);}
  await go(d,'/apologetics/worldviews/islam');
  assert(await page.locator('.wv-claim-map button').count()===12,'Full collection '+d);
  assert(await page.locator('#muslim-world').count()===1,'Atlas '+d);
  await page.screenshot({animations:"disabled",path:path.join(dir,'screenshots',`variant-${d}-islam-1440-dark.png`)});
  for(const name of ['Understanding Islam','Ministry','Texts & studies','Christianity & Islam']){
   if(d==='d')await page.locator('.av-context-level').nth(2).locator(':scope > button').click();
   await page.getByRole('navigation',{name:'Islam study sections',exact:true}).getByRole('link').filter({hasText:name}).click();await ready();checks.push(d+' Islam '+name);
  }
  await page.getByRole('button',{name:'Browse library',exact:false}).click();await page.locator('dialog[open]').waitFor();
  await page.getByRole('searchbox',{name:'Search library navigation'}).fill('Buddhism');await page.locator('.am-results').getByRole('link').first().click();await ready();assert(page.url().includes('/buddhism'),'Shared search '+d);
  for(const width of [1024,768,390,320]){
   await page.setViewportSize({width,height:1050});
   for(const [name,route] of [['worldviews','/apologetics/worldviews'],['islam','/apologetics/worldviews/islam']]){
    await go(d,route);assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'Overflow '+d+' '+name+' '+width);
    if(width===390)await page.screenshot({animations:"disabled",path:path.join(dir,'screenshots',`variant-${d}-${name}-390-dark.png`)});
    checks.push(d+' layout '+name+' '+width);
   }
  }
  for(const width of [390,320]){
   await page.setViewportSize({width,height:1050});await go(d,'/apologetics/worldviews/islam');
   if(d==='a')await page.locator('.am-mobile-sections').click();
   if(d==='b')await page.getByRole('button',{name:'Browse Worldviews',exact:true}).click();
   if(d==='c')await page.locator('.av-tree-mobile').click();
   if(d==='d')await page.locator('.av-context-level').nth(2).locator(':scope > button').click();
   if(d==='e')await page.locator('.av-columns-toolbar > button').click();
   assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),'Open mobile menu fits '+d+' '+width);
   if(width===390)await page.screenshot({animations:"disabled",path:path.join(dir,'screenshots',`variant-${d}-menu-390-dark.png`)});
   const nav=page.getByRole('navigation',{name:d==='e'?'Choose a study destination':'Islam study sections',exact:true});
   await nav.getByRole('link').filter({hasText:'Understanding Islam'}).click();await ready();assert(page.url().includes('/guide/understanding'),'Mobile destination '+d+' '+width);
   checks.push(d+' mobile open and navigate '+width);
  }
  await page.setViewportSize({width:1440,height:1050});await go(d);await page.reload();await ready();
  await page.screenshot({animations:"disabled",path:path.resolve(dir,`../_gallery/thumbs/apologetics-navigation${d==='a'?'':'-'+d}-dark.png`)});
  await page.getByRole('switch',{name:'Dark mode'}).click();await page.screenshot({animations:"disabled",path:path.join(dir,'screenshots',`variant-${d}-worldviews-1440-light.png`)});
  await page.screenshot({animations:"disabled",path:path.resolve(dir,`../_gallery/thumbs/apologetics-navigation${d==='a'?'':'-'+d}-light.png`)});
  await page.getByRole('switch',{name:'Dark mode'}).click();
 }
 await go('a','/apologetics/worldviews/islam?question=comparison-3');const selected=new URL(page.url()).hash;
 for(const d of ['b','c','d','e','a']){await page.getByRole('group',{name:'Choose a navigation design'}).getByRole('button',{name:d.toUpperCase(),exact:true}).click();assert(new URL(page.url()).hash===selected,'Route retained '+d);assert(new URL(page.url()).searchParams.get('d')===d,'Variant share URL '+d);checks.push('Switch preserves route and question '+d);}
 await page.reload();await ready();assert(await page.locator('[data-design]').getAttribute('data-design')==='a','Reload preserves design');
 for(const d of ['b','d','e']){
  await go(d,'/apologetics/worldviews/islam');
  const trigger=d==='b'?page.getByRole('button',{name:'Browse Worldviews',exact:true}):d==='d'?page.locator('.av-context-level').nth(1).locator(':scope > button'):page.locator('.av-columns-toolbar > button');
  await trigger.click();await page.keyboard.press('Tab');await page.keyboard.press('Escape');
  assert(await trigger.evaluate(e=>document.activeElement===e),'Escape restores focus '+d);checks.push('Escape restores focus '+d);
 }
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'source-baseline.json'),'utf8'));
 const unchanged=Object.entries(baseline.files).every(([file,hash])=>createHash('sha256').update(fs.readFileSync(path.join(website,file))).digest('hex')===hash);
 assert(unchanged,'Source files unchanged');assert(!errors.length,JSON.stringify(errors));
 fs.writeFileSync(path.join(dir,'variants-verification.json'),JSON.stringify({checks,sourceUnchanged:unchanged,pageErrors:errors},null,2));
 console.log(JSON.stringify({checks:checks.length,sourceUnchanged:unchanged,errors}));
}finally{await browser.close();}
