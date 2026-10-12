import {expect,test} from '@playwright/test';

test('Teachers switches with the Apologetics rise motion and keeps navigation stable',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(`window.teacherMotions=[];const start=document.startViewTransition.bind(document);document.startViewTransition=update=>{const t=start(update);t.ready.then(()=>window.teacherMotions.push(getComputedStyle(document.documentElement,'::view-transition-new(teacher-page)').animationName),()=>window.teacherMotions.push('failed'));return t;};`);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const libraryRequests:string[]=[];page.on('request',r=>{if(/field-shelves.*\.json|contributor-facts.*\.json/.test(r.url()))libraryRequests.push(r.url());});
  await page.goto('/teachers/preachers-and-authors');
  const nav=page.locator('.tp-sides');await expect(page.locator('.tp-preachers h1')).toBeVisible();
  await nav.evaluate(el=>el.setAttribute('data-persisted','yes'));
  for(const [name,side] of [['Scholars','scholars'],['Preachers & authors','preachers'],['Scholars','scholars']] as const){
    await nav.getByRole('link',{name,exact:true}).click();
    await expect(page.locator(`.tp-${side} h1`)).toBeVisible();
    await expect(nav).toHaveAttribute('data-persisted','yes');
    await expect(nav.getByRole('link',{name,exact:true})).toHaveAttribute('aria-current','page');
    await expect.poll(()=>page.evaluate(()=>document.documentElement.hasAttribute('data-teacher-slide'))).toBe(false);
    expect(await page.locator('.tp-route-content *').count()).toBeLessThan(7000);
    await expect(page.locator('.tp-route-content .tp-status')).toHaveCount(0);
  }
  expect(libraryRequests.filter(url=>url.includes('field-shelves'))).toHaveLength(1);
  expect(libraryRequests.filter(url=>url.includes('contributor-facts'))).toHaveLength(1);
  expect(errors).toEqual([]);
  expect(await page.evaluate('window.teacherMotions')).toEqual(['teacher-rise-in','teacher-rise-in','teacher-rise-in']);
  const named=page.locator('#named');await named.scrollIntoViewIfNeeded();
  await expect(named.locator('.nmd-rows li').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('rapid switching and browser Back leave the requested page visible',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/teachers/preachers-and-authors');await expect(page.locator('.tp-preachers h1')).toBeVisible();
  await page.locator('.tp-sides').getByRole('link',{name:'Scholars',exact:true}).click();
  await expect(page.locator('.tp-scholars h1')).toBeVisible();
  await page.locator('.tp-sides').getByRole('link',{name:'Preachers & authors',exact:true}).click();
  await page.locator('.tp-sides').getByRole('link',{name:'Scholars',exact:true}).click();
  await expect(page.locator('.tp-scholars h1')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.hasAttribute('data-teacher-slide'))).toBe(false);
  await page.goto('/teachers/preachers-and-authors');
  await page.locator('.tp-sides').getByRole('link',{name:'Scholars',exact:true}).click();
  await expect(page.locator('.tp-scholars h1')).toBeVisible();await page.goBack();
  await expect(page.locator('.tp-preachers h1')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.hasAttribute('data-teacher-slide'))).toBe(false);
});

test('reduced motion switches without a transition and section links still load their content',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/teachers/preachers-and-authors');
  await page.locator('.tp-sides').getByRole('link',{name:'Scholars',exact:true}).click();
  await expect(page.locator('.tp-scholars h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.hasAttribute('data-teacher-slide'))).toBe(false);
  await page.locator('.lnd-jump a[href="#directory"]').click();
  await expect(page.locator('#directory .dir-list li').first()).toBeVisible();
});
