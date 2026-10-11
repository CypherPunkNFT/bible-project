import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { PARABLES, PARABLE_GUIDE_URL, passageUrl } from '../src/data/parables';
const base = process.env.BASE ?? 'http://127.0.0.1:8931';
const browser = await chromium.launch({channel:'msedge'});
mkdirSync('.output/parables',{recursive:true});
const results:string[]=[];
try {
  for(const width of [1440,1024,390]) for(const theme of ['light','dark']) {
    const context = await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',colorScheme:theme as 'light'|'dark'});
    await context.addInitScript(value=>localStorage.setItem('bp-theme',value),theme);
    const page = await context.newPage();
    const errors:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+PARABLE_GUIDE_URL);
    await page.locator('.pb-door').last().waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('.pb-door').count(),4);
    assert.equal(await page.locator('.pb-story-list button').count(),16);
    await page.screenshot({path:`.output/parables/${width}-${theme}-top.png`});
    for(const story of PARABLES) {
      await page.locator('.pb-story-list button').filter({hasText:story.title}).click();
      assert.equal(await page.locator('#parable-title').innerText(),story.title);
      assert.equal(new URL(page.url()).searchParams.get('parable'),story.id);
      for(let i=0;i<3;i++) {
        await page.locator('.pb-beats button').nth(i).click();
        assert.equal(await page.locator('.pb-beat-copy').innerText(),story.beats[i][1]);
      }
      if(story.passages.length>1) for(let i=0;i<story.passages.length;i++) {
        await page.locator('.pb-account-tabs button').nth(i).click();
        assert.equal(await page.locator('.pb-read-link').getAttribute('href'),passageUrl(story.passages[i]));
      }
      await page.locator('.pb-close summary').click();
      assert.equal(await page.locator('.pb-close details p').isVisible(),true);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}/${theme}/${story.id}: overflow`);
    }
    for(let i=0;i<4;i++) {
      await page.locator('.pb-door').nth(i).click();
      assert.equal(await page.locator('.pb-story-list button').count(),4);
    }
    await page.getByLabel('Find a parable').fill('no-such-story');
    assert.equal(await page.locator('.pb-story-list button').count(),0);
    await page.getByRole('button',{name:'Show all sixteen stories'}).click();
    await page.getByLabel('Find a parable').fill('Luke 15');
    assert.equal(await page.locator('.pb-story-list button').count(),3);
    for(const name of ['prodigal','Samaritan','Pharisee','tares']) {
      await page.getByLabel('Find a parable').fill(name);
      assert.equal(await page.locator('.pb-story-list button').count(),1);
    }
    await page.getByLabel('Find a parable').fill('');
    await page.goto(base+PARABLE_GUIDE_URL+'&parable=sower');
    assert.equal(await page.locator('#parable-title').innerText(),'The sower & the soils');
    await page.locator('#parable-reading').scrollIntoViewIfNeeded();
    await page.screenshot({path:`.output/parables/${width}-${theme}-reading.png`});
    await page.locator('.pb-read-link').click();
    await page.waitForURL('**/read/kjv/MAT/13?hl=1-23');
    await page.waitForFunction(()=>document.querySelector('main')?.textContent?.includes('The same day'));
    await page.goBack();
    assert.equal(await page.locator('#parable-title').innerText(),'The sower & the soils');
    await page.getByRole('link',{name:'Return to the Gospels'}).click();
    await page.getByRole('link',{name:/The parables of Jesus/}).click();
    await page.locator('.pb-hero h1').waitFor();
    assert.deepEqual(errors,[]);
    results.push(`${width}px ${theme}: 16 studies, 48 story steps, 12 Gospel tabs, 4 paths, search/no-results, direct URL, reader and return navigation passed.`);
    await context.close();
  }
} finally {await browser.close();}
writeFileSync('.output/parables/browser-checks.txt',results.join('\n'));
console.log(results.join('\n'));
