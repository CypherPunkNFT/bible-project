import {chromium} from 'playwright';
import fs from 'node:fs';
const root=new URL('./',import.meta.url),url=new URL('prototype.html',root).href;
const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[],checks=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#record-title').filter({hasText:'Level III'}).waitFor();
 await page.screenshot({path:new URL('review/prototype-desktop.png',root).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
 for(let c=0;c<4;c++){
  await page.locator('#cities button').nth(c).click();
  for(let l=0;l<3;l++){
   await page.locator('#layers button').nth(l).click();
   if(!(await page.locator('#observation').innerText()))throw Error('Missing observation');
   if(await page.locator('.earth-layer.selected').count()!==1)throw Error('Selection mark');
   for(let f=0;f<await page.locator('#find-buttons button').count();f++)await page.locator('#find-buttons button').nth(f).click();
  }
  await page.locator('#compare').click();if(!(await page.locator('#comparison').isVisible()))throw Error('Comparison');
  await page.locator('#close-comparison').click();
  await page.locator('#open-record').click();if(!(await page.locator('#full-record').isVisible()))throw Error('Record');
  await page.locator('#bottom-close').click();
  if(await page.evaluate(()=>document.activeElement.id)!=='open-record')throw Error('Focus return');
 }
 checks.push('4 cities, 12 horizons, find selectors, comparisons, records and close-focus return');
 await page.locator('[data-city="lachish"]').focus();await page.keyboard.press('Enter');
 if(await page.evaluate(()=>document.activeElement.dataset.city)!=='lachish')throw Error('Keyboard city focus lost');
 await page.locator('[data-layer="0"]').focus();await page.keyboard.press('Enter');
 if(await page.evaluate(()=>document.activeElement.dataset.layer)!=='0')throw Error('Keyboard layer focus lost');
 await page.locator('#restore').check();await page.locator('#compare').click();await page.reload();
 if(!(await page.locator('#restore').isChecked())||!(await page.locator('#comparison').isVisible()))throw Error('State reload');
 checks.push('Keyboard selection and query-state reload');
 await page.locator('#comparison').screenshot({path:new URL('review/prototype-comparison.png',root).pathname.replace(/^\/(\w:)/,'$1')});
 for(const width of [320,390,1024,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await page.goto(url);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.screenshot({path:new URL(`review/prototype-${width}-${theme}.png`,root).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
  if(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)>1)throw Error('Overflow '+width);
 }
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#layers button').nth(0).click();await page.waitForTimeout(400);
 if(errors.length)throw Error(errors.join('\n'));
 const localLinks=await page.locator('a[href]').evaluateAll(es=>es.map(e=>e.getAttribute('href')).filter(x=>!x.startsWith('http')&&!x.startsWith('#')));
 for(const href of localLinks)if(!fs.existsSync(new URL(href,root)))throw Error('Local link missing '+href);
 checks.push('320/390/1024/1440 light and dark; normal/reduced motion; local artifact link; no runtime errors');
 fs.writeFileSync(new URL('review/validation.json',root),JSON.stringify({status:'passed',checks,errors,notTested:['Screen reader announcement quality','External source availability','Production integration'],date:'2026-10-14'},null,2));console.log(checks.join('\n'));
}finally{await browser.close();}
