import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('content/academic-research/04-how-the-canon-took-shape.json','utf8'));
const output='.local/canon-qa';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];const pass=s=>{checks.push(s);console.log('PASS',s);};
try {
 await page.goto('http://127.0.0.1:8931/study/how-the-canon-took-shape');
 await page.locator('#cn-close-title').waitFor({timeout:60000});
 assert.equal(await page.locator('.cn-r-folios').evaluate(e=>getComputedStyle(e).display),'grid','Current study stylesheet must be loaded');
 for(const [i,h] of data.investigations.jewish.hypotheses.entries()){
  const button=page.getByRole('group',{name:'Interpret the Psalms scroll'}).getByRole('button').nth(i);
  await button.focus();await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.ok((await page.locator('#cn-hypothesis-result').innerText()).includes(h.requires));
 }
 pass('Both Psalter hypotheses reveal their distinct evidential assumptions by keyboard');
 for(const [i,book] of data.investigations.boundaries.books.entries()){
  const button=page.getByRole('group',{name:'Compare ancient judgments'}).getByRole('button').nth(i);
  await button.focus();await page.keyboard.press('Space');
  for(const [j,w] of data.investigations.boundaries.witnesses.entries()){
   await page.locator(`#cn-entry-${j}-${i}`).click();
   assert.ok((await page.locator('#cn-r-inspection').innerText()).includes(w.states[i].text));
  }
 }
 pass('All nine ancient-witness judgments; silence remains distinct from exclusion');
 await page.getByRole('button',{name:'Read the second clause too'}).focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.cn-clause-unread').count(),0);assert.ok(await page.locator('.cn-eusebius-note').isVisible());
 await page.getByRole('button',{name:'Return to the first clause'}).click();assert.equal(await page.locator('.cn-clause-unread').count(),1);
 pass('Eusebius conditional placement and second-clause disclosure');
 assert.equal(await page.locator('.cn-leaf').count(),3);
 const toggle=page.getByRole('checkbox',{name:'Include the contents-list evidence'});await toggle.focus();await page.keyboard.press('Space');
 assert.equal(await page.locator('.cn-leaf').count(),4);
 for(const [i,s] of data.investigations.codex.segments.entries()){
  await page.locator('.cn-leaf').nth(i).focus();await page.keyboard.press('Enter');assert.ok((await page.locator('#cn-leaf-note').innerText()).includes(s.note));
 }
 await toggle.uncheck();assert.equal(await page.locator('.cn-leaf').count(),3);assert.ok((await page.locator('#cn-leaf-note').innerText()).startsWith('Revelation'));
 pass('Surviving-text versus contents-list evidence, all four annotations, hidden-selection reset');
 const ids=new Set(data.sources.map(s=>s.id));for(const claim of data.claimLedger)for(const id of claim.sourceIds)assert.ok(ids.has(id));
 const broken=await page.locator('.cn-study a').evaluateAll(as=>as.filter(a=>!a.getAttribute('href')||a.getAttribute('href')==='undefined').map(a=>a.textContent));assert.deepEqual(broken,[]);
 assert.equal(await page.locator('.cn-scholarship-row').count(),5);
 pass('Claim-level source references, rendered links and scholarly access notes');
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:1000});await toggle.check();await page.locator('.cn-leaf').last().click();
  await page.getByRole('button',{name:'Read the second clause too'}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width);
  for(const [name,selector] of [['hypothesis','.cn-hypothesis'],['boundary','.cn-r-folios'],['codex','.cn-codex-strip']]){
   await page.locator(selector).scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/deep-${name}-${width}.png`});
  }
  await page.getByRole('button',{name:'Return to the first clause'}).click();
 }
 pass('Expanded states at 1440, 768, 390 and 320px without page overflow; screenshots captured');
 await page.emulateMedia({reducedMotion:'reduce'});
 const animations=await page.locator('.cn-investigations').evaluate(el=>[...el.querySelectorAll('*')].some(e=>getComputedStyle(e).animationName!=='none'));assert.equal(animations,false);
 assert.deepEqual(errors,[]);pass('Reduced motion and zero browser exceptions');
 fs.writeFileSync(output+'/investigations-report.json',JSON.stringify({checks,errors,checked:new Date().toISOString()},null,2));
}finally{await browser.close();}
