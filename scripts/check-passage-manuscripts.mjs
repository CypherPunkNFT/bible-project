import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='.local/passage-qa';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
const errors=[];const report=[];
async function check(page,name,fn){await fn();report.push(name);console.log('PASS',name);}
async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no horizontal page overflow');}
const url='http://127.0.0.1:8931/study/passage-through-manuscripts';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},colorScheme:'dark'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.passageTransitions=[];if(document.startViewTransition){const original=document.startViewTransition.bind(document);document.startViewTransition=fn=>{const t=original(fn);const record={};window.passageTransitions.push(record);t.ready.then(()=>{record.animation=getComputedStyle(document.documentElement,'::view-transition-new(site-page)').animationName;record.header=getComputedStyle(document.documentElement,'::view-transition-new(site-header)').opacity;}).catch(()=>{});return t;};}});
 await page.goto(url);await page.locator('.pm-study h1').waitFor();await page.evaluate(()=>document.fonts.ready);
 await check(page,'Desktop renders, title and no overflow',async()=>{assert.match(await page.title(),/A passage through/);await noOverflow(page);});
 await page.screenshot({path:out+'/desktop.png',fullPage:true});
 await check(page,'Spelling / word order; two distinct edition readings',async()=>{
  assert.match(await page.locator('.pm-table').innerText(),/ὑμεῖν/);
  const button=page.getByRole('button',{name:'Word order',exact:true});await button.focus();await page.keyboard.press('Enter');
  assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('.pm-table').innerText(),/καὶ κυρίου ἡμῶν/);assert.match(await page.locator('.pm-table').innerText(),/ἡμῶν καὶ κυρίου/);
 });
 await check(page,'Keyboard opens and closes manuscript evidence',async()=>{
  const b=page.getByRole('button',{name:/Papyrus 46/});await b.focus();await page.keyboard.press('Space');
  assert.equal(await b.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#pm-evidence-p46').isVisible(),true);
  await page.keyboard.press('Space');assert.equal(await page.locator('#pm-evidence-p46').isVisible(),false);
 });
 await check(page,'Keyboard focus remains visible with site outlines disabled',async()=>{
  await page.getByRole('button',{name:'Word order',exact:true}).focus();
  for(let i=0;i<4;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>{const a=document.activeElement;const e=a.tagName==='INPUT'?a.closest('label'):a;return a.matches(':focus-visible')&&getComputedStyle(e).boxShadow!=='none';}),true);}
 });
 await check(page,'Highlight toggle retains text',async()=>{const before=await page.locator('.pm-table').innerText();await page.getByLabel('Highlight the focus').uncheck();assert.equal(await page.locator('.pm-desk').evaluate(el=>el.classList.contains('pm-highlight')),false);assert.equal(await page.locator('.pm-table').innerText(),before);await page.getByLabel('Highlight the focus').check();});
 await check(page,'Real apparatus decodes all four parts with keyboard',async()=>{const tokens=await page.locator('.pm-apparatus-line button').all();for(const [i,b] of tokens.entries()){await b.focus();await page.keyboard.press('Enter');assert.equal(await b.getAttribute('aria-pressed'),'true');assert.ok((await page.locator('#pm-apparatus-note').innerText()).length>90);if(i===2)assert.match(await page.locator('#pm-apparatus-note').innerText(),/not damaged parchment/);}await page.locator('.pm-apparatus').screenshot({path:out+'/apparatus.png'});});
 await check(page,'Romans changes hands without adding manuscript rows',async()=>{
  await page.getByRole('button',{name:/Romans 5:1 A changed vowel/}).click();
  assert.equal(await page.locator('.pm-gloss').filter({hasText:'Let us have peace.'}).count(),2);
  await page.getByRole('button',{name:'Corrected',exact:true}).click();
  assert.equal(await page.locator('.pm-gloss').filter({hasText:'We have peace.'}).count(),3);
  assert.equal(await page.locator('.pm-evidence-toggle').count(),3);
  await page.locator('.pm-reasoning summary').focus();await page.keyboard.press('Enter');assert.match(await page.locator('.pm-reasoning').innerText(),/UBS4/);
 });
 await check(page,'Romans criteria expose different arguments without invented scores',async()=>{for(const b of await page.locator('.pm-lens-controls button').all()){await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');assert.ok((await page.locator('.pm-argument-conclusion').innerText()).length>90);}await page.locator('.pm-argument').screenshot({path:out+'/romans-argument.png'});});
 await check(page,'Mark distinguishes surviving ending, present ending, loss and edition',async()=>{
  await page.getByRole('button',{name:/Mark 16:8/}).click();
  assert.equal(await page.locator('.pm-evidence-toggle').count(),5);assert.match(await page.locator('.pm-lost-row').innerText(),/not extant/);
  for(const b of await page.locator('.pm-evidence-toggle').all()){await b.click();assert.equal(await b.getAttribute('aria-expanded'),'true');}
  await page.locator('.pm-reasoning summary').click();assert.match(await page.locator('.pm-reasoning').innerText(),/Irenaeus/);
  await page.locator('.pm-desk').screenshot({path:out+'/mark-desk.png'});
 });
 await check(page,'Mark endings change narrative and distinguish the Shorter Ending',async()=>{for(const b of await page.locator('.pm-ending-controls button').all()){await b.focus();await page.keyboard.press('Space');assert.equal(await b.getAttribute('aria-pressed'),'true');}assert.match(await page.locator('.pm-join-comment').innerText(),/reintroduces Mary/);await page.getByRole('button',{name:'Shorter Ending',exact:true}).click();assert.match(await page.locator('.pm-join-comment').innerText(),/not the same thing/);await page.locator('.pm-deeper summary').click();assert.match(await page.locator('.pm-ancient-voices').innerText(),/punctuate/);await page.locator('.pm-mark-join').screenshot({path:out+'/mark-join.png'});});
 await check(page,'Deep link and reload preserve passage selection',async()=>{assert.match(page.url(),/passage=mark/);await page.reload();await page.locator('.pm-study h1').waitFor();assert.equal(await page.getByRole('button',{name:/Mark 16:8/}).getAttribute('aria-pressed'),'true');});
 await check(page,'Restoration remains visibly supplied',async()=>{await page.getByLabel('Show supplied letters').check();assert.equal(await page.locator('.pm-supplied').innerText(),'[ημα]');assert.match(await page.locator('.pm-restoration [role=status]').innerText(),/supplied, not surviving ink/);});
 await check(page,'GA304 changes classification after context is revealed',async()=>{const b=page.getByRole('button',{name:'Reveal the surrounding evidence'});await b.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.pm-document-context').getAttribute('aria-hidden'),'false');assert.match(await page.locator('#pm-context-finding').innerText(),/unfinished copying/);await page.waitForFunction(()=>getComputedStyle(document.querySelector('.pm-document-context')).opacity==='1');await page.locator('.pm-investigation').screenshot({path:out+'/ga304.png'});});
 await check(page,'Copying paths reveal dependence and uncertainty',async()=>{await page.locator('.pm-dependence>summary').click();await page.getByRole('button',{name:'Trace the copying paths'}).click();assert.equal(await page.locator('.pm-paths').evaluate(el=>el.classList.contains('visible')),true);assert.match(await page.locator('.pm-model-result').innerText(),/unknown/);});
 await check(page,'All assessment states provide feedback',async()=>{for(const [i,b] of (await page.locator('.pm-answer-options button').all()).entries()){await b.click();assert.match(await page.locator('.pm-answer').innerText(),i===2?/Yes\./:/Look again/);}});
 await check(page,'Source register opens from keyboard',async()=>{await page.locator('.pm-source-register summary').focus();await page.keyboard.press('Space');assert.equal(await page.locator('.pm-source-content').isVisible(),true);assert.ok(await page.locator('.pm-source-content a').count()>15);});
 await check(page,'Source destinations and study anchors are valid',async()=>{const links=await page.locator('.pm-study a').evaluateAll(nodes=>nodes.map(a=>({href:a.getAttribute('href'),target:a.target,rel:a.rel})));for(const a of links){assert.ok(a.href);if(a.href.startsWith('#'))assert.equal(await page.locator(a.href).count(),1);else if(a.href.startsWith('https:')){assert.equal(new URL(a.href).protocol,'https:');assert.equal(a.target,'_blank');assert.ok(a.rel.includes('noopener'));}}});
 await check(page,'Fixed site header survives scrolling',async()=>{assert.equal(await page.locator('[data-site-header]').evaluate(el=>Math.round(el.getBoundingClientRect().top)),0);});
 await check(page,'Academic category navigation uses standard transition',async()=>{
  await page.locator('.pm-end a').click();await page.waitForURL('**/study/academic?area=texts');await page.waitForFunction(()=>!document.documentElement.dataset.sitePageSlide);
  const link=page.locator('a[href="/study/passage-through-manuscripts"]').first();await link.click();await page.waitForURL('**/study/passage-through-manuscripts');await page.waitForFunction(()=>!document.documentElement.dataset.sitePageSlide);
  const audit=await page.evaluate(()=>window.passageTransitions);assert.ok(audit.some(x=>x.animation==='site-page-rise-in'));assert.ok(audit.some(x=>x.header==='1'));await page.locator('.pm-study h1').waitFor();
 });
 await check(page,'Same-page passage changes do not trigger route transitions',async()=>{const n=await page.evaluate(()=>window.passageTransitions.length);await page.getByRole('button',{name:/Romans 5:1 A changed vowel/}).click();assert.equal(await page.evaluate(()=>window.passageTransitions.length),n);});
 await page.emulateMedia({colorScheme:'light'});await page.getByRole('switch',{name:'Dark mode'}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');await page.screenshot({path:out+'/light.png',fullPage:true});
 for(const width of [390,320,768]){
  const mobile=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce',colorScheme:'light'});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(url);await mobile.locator('.pm-study h1').waitFor();await mobile.evaluate(()=>document.fonts.ready);
  await check(mobile,`${width}px layout and all passage states`,async()=>{await noOverflow(mobile);for(const name of [/Galatians 1:3/,/Romans 5:1/,/Mark 16:8/]){await mobile.getByRole('button',{name}).click();await noOverflow(mobile);await mobile.locator('.pm-evidence-toggle').first().click();await noOverflow(mobile);}await mobile.getByLabel('Show supplied letters').check();await noOverflow(mobile);});
  await check(mobile,`${width}px new close readings and long labels`,async()=>{for(const b of await mobile.locator('.pm-ending-controls button').all()){await b.click();await noOverflow(mobile);}await mobile.locator('.pm-deeper summary').click();await noOverflow(mobile);await mobile.getByRole('button',{name:'Reveal the surrounding evidence'}).click();await noOverflow(mobile);await mobile.locator('.pm-investigation').screenshot({path:`${out}/ga304-${width}.png`});await mobile.getByRole('button',{name:/Galatians 1:3/}).click();for(const b of await mobile.locator('.pm-apparatus-line button').all()){await b.click();await noOverflow(mobile);}await mobile.locator('.pm-apparatus').screenshot({path:`${out}/apparatus-${width}.png`});});
  await check(mobile,`${width}px reduced-motion controls`,async()=>{assert.equal(await mobile.locator('.pm-document-context').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');await mobile.locator('.pm-dependence>summary').click();await mobile.getByRole('button',{name:'Trace the copying paths'}).click();assert.match(await mobile.locator('.pm-model-result').innerText(),/unknown/);});
  await mobile.screenshot({path:`${out}/mobile-${width}.png`,fullPage:true});await mobile.close();
 }
 await check(page,'Reduced motion bypasses page transition',async()=>{await page.emulateMedia({reducedMotion:'reduce'});const n=await page.evaluate(()=>window.passageTransitions.length);await page.locator('.pm-breadcrumb a').click();await page.waitForURL('**/study/academic?area=texts');assert.equal(await page.evaluate(()=>window.passageTransitions.length),n);});
 assert.deepEqual(errors,[]);report.push('No browser page errors');
 fs.writeFileSync(out+'/report.json',JSON.stringify({date:new Date().toISOString(),preview:url,checks:report,errors},null,2));
}finally{await browser.close();}
