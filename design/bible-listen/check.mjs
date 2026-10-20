import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({reducedMotion:'reduce'});
for(const width of [1440,768,390,320]) {
 await page.setViewportSize({width,height:1100});
 await page.goto('http://127.0.0.1:8931/mockups/bible-listen/');
 await page.locator('.bible-listening').waitFor();
 const cards=await page.locator('.bible-path').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {title:node.querySelector('h2').textContent,x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};}));
 assert.deepEqual(cards.map(c=>c.title),['Read','Listen','Library']);
 const [read,listen,library]=cards;
 if(width>=768){assert.equal(read.y,listen.y);assert.equal(read.width,listen.width);assert(library.y>=read.bottom);assert.equal(library.width,listen.x+listen.width-read.x);}
 else {assert(listen.y>=read.bottom);assert(library.y>=listen.bottom);}
 for(const [index,card] of cards.entries())if(index>2)assert(card.y>=cards[index-1].bottom);
 assert.equal(await page.locator('.horizontal-book').count(),5);
 assert.equal(await page.locator('.revelation-volume').count(),1);
 for(const variant of []){
  const card=page.locator(`.library-option-${variant}`);
  assert.equal(await card.locator('.individual-book').count(),34);
  assert.equal(new Set(await card.locator('.individual-book').allTextContents()).size,34);
  for(const pile of await card.locator('.category-stack').all())assert(await pile.locator('.individual-book').count()<=8);
  const art=await card.locator('.category-library').boundingBox(),copy=await card.locator('.bible-path-copy').boundingBox();
  assert(copy.y>=art.y+art.height);
  assert.deepEqual(await card.locator('.category-label strong').allTextContents(),['Historical','Poetical','Prophetical','Gospels','Epistles','Revelation']);
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`.local/bible-listen-${width}.png`,fullPage:true});
 if(width===320)await page.locator('.library-option-1').screenshot({path:'.local/bible-library-phone.png'});
 if(width===1440){await page.locator('.bible-listening').screenshot({path:'.local/bible-listen-art.png'});await page.locator('.library-option-1').screenshot({path:'.local/bible-library-option-1.png'});}
 console.log(JSON.stringify({width,cards}));
}
await browser.close();
