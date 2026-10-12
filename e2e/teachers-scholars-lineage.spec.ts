import {expect,test} from '@playwright/test';

test('all five idea chains have at least five sourced connections',async({page})=>{
  await page.goto('/teachers/scholars');
  const panel=page.locator('.idea-lineage');
  await expect(panel.getByRole('tab')).toHaveCount(5);
  await expect(panel.getByRole('button',{name:/Reset|Expand|Zoom/})).toHaveCount(0);
  await expect(panel).not.toContainText('Drag to move');
  for(const field of ['History','Languages & texts','Archaeology & places','Reference works','Theology & philosophy']){
    await panel.getByRole('tab',{name:field,exact:true}).click();
    const steps=panel.locator('.il-step');
    expect(await steps.count()).toBeGreaterThanOrEqual(6);
    expect(await panel.locator('.il-link').count()).toBe(await steps.count()-1);
    for(let i=0;i<await steps.count();i++){
      await steps.nth(i).click();
      await expect(steps.nth(i)).toHaveAttribute('aria-pressed','true');
      await expect(panel.locator('.il-detail p')).not.toBeEmpty();
      await expect(panel.getByRole('link',{name:'Read the source'})).toHaveAttribute('href',/^https:\/\//);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('field tabs work by keyboard and the fixed timeline allows page scrolling',async({page})=>{
  await page.goto('/teachers/scholars');
  const panel=page.locator('.idea-lineage');
  await panel.getByRole('tab',{name:'History',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('tab',{name:'Languages & texts',exact:true})).toBeFocused();
  await expect(panel.getByRole('tab',{name:'Languages & texts',exact:true})).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('End');
  await expect(panel.getByRole('tab',{name:'Theology & philosophy',exact:true})).toHaveAttribute('aria-selected','true');
  await panel.locator('.il-timeline').hover();
  const before=await page.evaluate(()=>scrollY);
  await page.mouse.wheel(0,250);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before);
});
