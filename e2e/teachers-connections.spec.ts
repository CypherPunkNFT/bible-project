import {test,expect} from '@playwright/test';

test('connections stays inside Sources without adding a landing chooser entry',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/teachers/scholars');await page.locator('.ft-placed').first().waitFor();
 await expect(page.locator('.tp-scholars>.tp-sec')).toHaveCount(5);
 expect(await page.locator('.tp-scholars>.tp-sec').evaluateAll(nodes=>nodes.map(n=>n.id))).toEqual(['landing','built','catalogue','discoveries','directory']);
 await expect(page.locator('#landing .lnd-section-nav a')).toHaveCount(4);
 const graph=await page.locator('.focus-timeline').boundingBox(),tools=await page.locator('#landing .lnd-tools').boundingBox();expect(graph!.height).toBe(420);expect(Math.abs(graph!.width-tools!.width)).toBeLessThan(1);expect(graph!.x).toBeGreaterThanOrEqual(0);expect(graph!.x+graph!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
 await expect(page.locator('#landing .idea-lineage')).toHaveCount(0);
 await expect(page.locator('#landing .ft-connections,#landing .il-views')).toHaveCount(0);
 await page.locator('#landing .lnd-section-nav a[href="#built"]').click();
 const section=page.locator('#connections');await section.scrollIntoViewIfNeeded();await expect(section.locator('.il-section')).toBeVisible();
 await expect(page.locator('#built #connections')).toHaveCount(1);
 await expect(page.locator('#built>.tp-section-content>.tp-head .tp-num')).toHaveText('01');
 await expect(section.locator('.tp-num')).toHaveCount(0);
 await expect(page.getByText('Profiles without a matched credit in this source index:')).toHaveCount(0);
 await expect(section.getByRole('heading',{name:'Knowledge, handed on.'})).toHaveCount(1);
 await expect(section.locator('.scholar-subhead p')).toContainText('archaeologists bring new inscriptions');
 await expect(section.locator('.scholar-subhead p')).toContainText('theology and philosophy');
 await expect(section.getByRole('tab')).toHaveCount(5);
 await expect(section.getByRole('button',{name:'Birth-year timeline view'})).toHaveCount(0);
 for(const tab of await section.getByRole('tab').all()){
  await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');expect(await section.locator('.il-step').count()).toBeGreaterThanOrEqual(6);
  await section.locator('.il-step').first().click();await expect(section.locator('.il-reveal')).toHaveClass(/is-open/);await expect(section.locator('.il-detail a')).toHaveAttribute('href',/^https:\/\//);
 }
 await section.getByRole('tab',{name:'Languages & texts',exact:true}).click();await section.locator('.il-step').first().click();await section.getByRole('button',{name:'Open profile',exact:true}).click();await expect(page.locator('.prf-open #sc-prf-name')).toHaveText('Desiderius Erasmus');await page.keyboard.press('Escape');await expect(page.locator('.prf-open')).toHaveCount(0);
 const firstTab=section.getByRole('tab').first();await firstTab.focus();await firstTab.press('End');await expect(section.getByRole('tab').last()).toBeFocused();await expect(section.getByRole('tab').last()).toHaveAttribute('aria-selected','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 await page.goto('/teachers/scholars#connections');await expect(page.locator('#built #connections .il-section')).toBeVisible();expect(errors).toEqual([]);
});
