import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {launch,newContext,open} from '../../scripts/design-review/browser.mjs';
await mkdir('design/review/header-merger',{recursive:true});await mkdir('design/_gallery/thumbs',{recursive:true});
const b=await launch();try{
 for(const width of [1440,1024,768,390])for(const theme of ['dark','light']){
  const c=await newContext(b,{width,theme}),p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await open(p,'/mockups/header-merger/',{quick:true});
  assert.equal(await p.locator('.option').count(),5);assert.equal(await p.locator('.section-tabs button').count(),36);
  assert.equal(await p.getByText('The source room',{exact:true}).count(),0);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  for(const id of ['a','b','c','d']){
   const card=p.locator(`#option-${id}`);
   const frame=card.locator('.original-site-header').contentFrame();await frame.locator('header nav[aria-label=Main]').waitFor();
   assert.equal(await frame.locator('.site-header-row').count(),1);
   assert.equal(await card.locator('.global-row,.global-nav,.paired-brand').count(),0);
   await card.getByRole('tab',{name:'Questions',exact:true}).click();assert.equal(await card.getByRole('tab',{name:'Questions',exact:true}).getAttribute('aria-selected'),'true');
   assert.equal(await card.locator('.world-row .context-chip').count(),4);
   await card.getByRole('tab',{name:'Worldviews',exact:true}).click();
   if(id==='a'){
    await card.locator('.original-worldviews-frame[data-ready=true]').waitFor();
    const original=card.locator('.original-worldviews-frame').contentFrame();
    assert.equal(await original.locator('.sm-world-choices a').count(),4);
    const geometry=await card.evaluate(el=>({outer:el.querySelector('.site-preview').getBoundingClientRect().width,band:el.querySelector('.local-navigation').getBoundingClientRect().width,row:el.querySelector('.original-worldviews-viewport').getBoundingClientRect().width}));
    assert.ok(Math.abs(geometry.outer-geometry.band)<=2);assert.equal(geometry.row,geometry.band);
   }else assert.equal(await card.locator('[data-world]').count(),4);
   await card.locator('.search-button').click();await p.locator('#search-input').fill('Islam');assert.equal(await p.locator('#search-results a').count(),1);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('search-dialog').open);
  }
  const e=p.locator('.original-e-page');
  await p.locator('.original-e-page[data-ready=true]').waitFor();
  const ef=e.contentFrame();
  assert.equal(await ef.locator('.site-header-row').count(),1);
  assert.equal(await ef.locator('.am-masthead').isVisible(),false);
  assert.equal(await ef.locator('.sm-e-bar .e-logo').count(),1);
  assert.equal(await ef.locator('.sm-e-bar .e-search').count(),1);
  assert.equal(await ef.locator('.sm-main>div:visible').count(),7);
  assert.equal(await ef.locator('.ap-orbit-node>span').getByText('Doubt',{exact:true}).count(),0);
  const labels=await ef.locator('.ap-orbit-node>span').allTextContents();assert.ok(labels.includes('Reason'));assert.ok(labels.includes('Faith'));assert.ok(!labels.includes('Reformed'));
  await ef.locator('.e-search').click();await ef.locator('.am-search input').fill('Islam');assert.ok(await ef.locator('.am-results a').count()>0);await ef.locator('.am-close').click();
  assert.equal(await ef.locator('html').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  assert.deepEqual(errors,[]);await p.evaluate(()=>window.scrollTo(0,0));
  if(width===1440){await p.screenshot({path:`design/review/header-merger/all-${theme}.png`,fullPage:true});await p.screenshot({path:`design/_gallery/thumbs/header-merger-${theme}.png`});for(const id of ['a','b','c','d','e'])await p.locator(`#option-${id} .site-preview`).screenshot({path:`design/review/header-merger/${id}-${theme}.png`});}
  if(width===390)await p.screenshot({path:`design/review/header-merger/phone-${theme}.png`,fullPage:true});
  console.log(width,theme,'five options, original header, labels, search and overflow passed');await c.close();
 }
}finally{await b.close()}
