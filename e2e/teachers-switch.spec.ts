import {expect,test} from '@playwright/test';

test('Teachers switches with a quick fade and keeps navigation stable',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(`window.teacherMotions=[];const start=document.startViewTransition.bind(document);document.startViewTransition=update=>{const t=start(update);t.ready.then(()=>window.teacherMotions.push(getComputedStyle(document.documentElement,'::view-transition-new(teacher-page)').animationName),()=>window.teacherMotions.push('failed'));return t;};`);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const libraryRequests:string[]=[];page.on('request',r=>{if(/field-shelves.*\.json|contributor-facts.*\.json/.test(r.url()))libraryRequests.push(r.url());});
  await page.goto('/teachers/preachers-and-authors');
  const nav=page.locator('.tp-sides');await expect(page.locator('.tp-preachers h1')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.lnd-band')).toHaveAttribute('style',/height:/);
  const geometry=()=>page.evaluate(()=>['.lnd-kicker','.lnd-title','.lnd-tools','.lnd-figs','.lnd-band,.idea-lineage'].map(selector=>{
    const {x,y,width,height}=document.querySelector(selector)!.getBoundingClientRect();return {x,y,width,height};
  }));
  const before=await geometry();
  await expect(page.locator('.lnd-band .lnd-legend')).toBeVisible();
  await expect(page.getByText('Each circle is one teacher, placed by the year they were born.')).toHaveCount(0);
  await nav.evaluate(el=>el.setAttribute('data-persisted','yes'));
  for(const [name,side] of [['Scholars','scholars'],['Preachers & authors','preachers'],['Scholars','scholars']] as const){
    await nav.getByRole('link',{name,exact:true}).click();
    await expect(page.locator(`.tp-${side} h1`)).toBeVisible();
    await expect(nav).toHaveAttribute('data-persisted','yes');
    await expect(nav.getByRole('link',{name,exact:true})).toHaveAttribute('aria-current','page');
    await expect.poll(()=>page.evaluate(()=>document.documentElement.hasAttribute('data-teacher-slide'))).toBe(false);
    expect(await page.locator('.tp-route-content *').count()).toBeLessThan(7000);
    await expect(page.locator('.tp-route-content .tp-status')).toHaveCount(0);
    const after=await geometry();
    after.forEach((rect,index)=>{
      expect(Math.abs(rect.x-before[index].x)).toBeLessThan(2);
      expect(Math.abs(rect.y-before[index].y)).toBeLessThan(2);
      expect(Math.abs(rect.width-before[index].width)).toBeLessThan(2);
      // On phones the scholars chain becomes a readable vertical sequence.
      if(index<4||(page.viewportSize()?.width??0)>600)expect(Math.abs(rect.height-before[index].height)).toBeLessThan(2);
    });
  }
  expect(libraryRequests.filter(url=>url.includes('field-shelves'))).toHaveLength(1);
  expect(libraryRequests.filter(url=>url.includes('contributor-facts'))).toHaveLength(1);
  expect(errors).toEqual([]);
  expect(await page.evaluate('window.teacherMotions')).toEqual(['teacher-fade-in','teacher-fade-in','teacher-fade-in']);
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
