import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {launch,newContext,open} from '../../scripts/design-review/browser.mjs';
await mkdir('design/review/header-merger',{recursive:true});await mkdir('design/_gallery/thumbs',{recursive:true});
const b=await launch();try{
 for(const width of [1440,1024,768,390])for(const theme of ['dark','light']){
  const c=await newContext(b,{width,theme}),p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await open(p,'/mockups/header-merger/',{quick:true});
  assert.equal(await p.locator('.option').count(),4);assert.equal(await p.locator('.section-tabs button').count(),36);
  assert.equal(await p.getByText('The source room',{exact:true}).count(),0);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  for(const id of ['a','b','c','d']){
   const card=p.locator(`#option-${id}`);
   const frame=card.locator('iframe').contentFrame();await frame.locator('header nav[aria-label=Main]').waitFor();
   assert.equal(await frame.locator('.site-header-row').count(),1);
   assert.equal(await card.locator('.global-row,.global-nav,.paired-brand').count(),0);
   await card.getByRole('tab',{name:'Questions',exact:true}).click();assert.equal(await card.getByRole('tab',{name:'Questions',exact:true}).getAttribute('aria-selected'),'true');
   assert.equal(await card.locator('.world-row .context-chip').count(),4);
   await card.getByRole('tab',{name:'Worldviews',exact:true}).click();assert.equal(await card.locator('[data-world]').count(),4);
   await card.locator('.search-button').click();await p.locator('#search-input').fill('Islam');assert.equal(await p.locator('#search-results a').count(),1);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('search-dialog').open);
  }
  assert.deepEqual(errors,[]);await p.evaluate(()=>window.scrollTo(0,0));
  if(width===1440){await p.screenshot({path:`design/review/header-merger/all-${theme}.png`,fullPage:true});await p.screenshot({path:`design/_gallery/thumbs/header-merger-${theme}.png`});for(const id of ['a','b','c','d'])await p.locator(`#option-${id} .site-preview`).screenshot({path:`design/review/header-merger/${id}-${theme}.png`});}
  if(width===390)await p.screenshot({path:`design/review/header-merger/phone-${theme}.png`,fullPage:true});
  console.log(width,theme,'four headers, tab switching, search and overflow passed');await c.close();
 }
}finally{await b.close()}
