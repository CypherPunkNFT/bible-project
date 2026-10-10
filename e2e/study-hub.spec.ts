import {expect,test} from "@playwright/test";

test("Study branches preserve selection, keyboard navigation and real destinations",async({page})=>{
 await page.goto('/study');
 await page.locator('.study-door.scripture-door').click();
 await expect(page).toHaveURL(/\/study\/theology/);
 await page.locator('[data-area="books"]').focus();
 await page.keyboard.press('End');
 await expect(page.locator('[data-area="people"]')).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/area=people/);
 await expect(page.locator('.writer-preview-list a')).toHaveCount(6);
 await page.locator('[data-area="jesus"]').click();
 await page.goBack();
 await expect(page.locator('[data-area="people"]')).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('a[href*="/mockups/"],a[href*="/review/research"]')).toHaveCount(0);
 await page.goto('/study/academic?area=unknown');
 await expect(page.locator('#selection-notice')).toBeVisible();
 await expect(page.locator('[data-area="history"]')).toHaveAttribute('aria-expanded','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("Paul arrives at Antioch, holds the camera and marks departure and arrival",async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/study');
 await expect(page.locator('#atlas-map .map-camera')).toHaveAttribute('transform',/translate/);
 await page.locator('[data-map="paul"]').click();
 await expect(page.locator('#atlas-map')).toHaveAttribute('data-phase','zooming');
 await expect(page.locator('#atlas-map')).toHaveAttribute('data-phase','drawing');
 await expect(page.locator('.map-route-origin')).toHaveClass(/endpoint-thump/);
 const origin=await page.locator('.map-route-origin').getAttribute('transform');
 await expect(page.locator('#atlas-map')).toHaveAttribute('data-phase','settled',{timeout:10000});
 await expect(page.locator('.map-route-origin')).toHaveAttribute('transform',origin!);
 await expect(page.locator('.map-route-stops .map-point').last()).toHaveClass(/endpoint-thump/);
 await page.locator('[data-map="map"]').click();
 await expect(page.locator('.map-route')).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('[data-map="paul"]').click();
 await expect(page.locator('#atlas-map')).toHaveAttribute('data-phase','settled');
 await expect(page.locator('.endpoint-thump')).toHaveCount(0);
});


test("Theology retains every original Study2 illustrated card",async({page})=>{
 await page.goto('/study2');
 await expect(page.locator('.study-resource-link')).toHaveCount(10);
 const originals=await page.locator('.study-resource-link').evaluateAll(cards=>cards.map(card=>({
   href:card.getAttribute('href'), copy:card.querySelector('.study-card-copy')!.textContent,
   artwork:card.querySelector('.study-art, .study-gospels')!.className,
 })));
 expect(originals).toHaveLength(10);
 const found=new Set<string>();
 for(const area of ['books','jesus','doctrine','life','people']){
  await page.goto(`/study/theology?area=${area}`);
  await expect(page.locator('.theology-atlas-card .study-resource-link')).toBeVisible();
  const cards=await page.locator('.study-resource-link').evaluateAll(cards=>cards.map(card=>({
   href:card.getAttribute('href'), copy:card.querySelector('.study-card-copy')!.textContent,
   artwork:card.querySelector('.study-art, .study-gospels')!.className,
  })));
  for(const card of cards){
   expect(card).toEqual(originals.find(original=>original.href===card.href));
   found.add(card.href!);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 }
 expect([...found].sort()).toEqual(originals.map(card=>card.href).sort());
});
