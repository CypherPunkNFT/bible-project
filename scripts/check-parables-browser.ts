import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { PARABLES, PARABLE_FORMS, PARABLE_ROOMS, PARABLE_GUIDE_URL, passageLabel, passageUrl } from '../src/data/parables';
import { PARABLE_DEEP_READINGS } from '../src/data/parables-deep-reading';
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
    await page.locator('.pb-category').last().waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('.pb-category').count(),PARABLE_ROOMS.length+1);
    const columns = await page.locator('.pb-selector-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(columns, width === 390 ? 2 : 4);
    assert.equal(await page.locator('.pb-story-list button').count(),PARABLES.length);
    await page.screenshot({path:`.output/parables/${width}-${theme}-top.png`});
    for(const story of PARABLES) {
      await page.locator('.pb-story-list button').filter({hasText:story.title}).click();
      assert.equal(await page.locator('#parable-title').innerText(),story.title);
      assert.ok((await page.locator('.pb-reading-head .pb-kicker').textContent())?.includes(PARABLE_FORMS[story.form]));
      assert.equal(new URL(page.url()).searchParams.get('parable'),story.id);
      assert.equal(await page.locator('.pb-open-passage').getAttribute('href'),passageUrl(story.passages[0]));
      assert.equal(await page.locator('#pb-movement-title').innerText(),story.form==='narrative'?'Follow the turn':'Look closely at the image');
      const notes = PARABLE_DEEP_READINGS[story.id] ?? [];
      assert.equal(await page.locator('.pb-deep-reading').count(),notes.length);
      for(let i=0;i<notes.length;i++) {
        const block=page.locator('.pb-deep-reading').nth(i);
        assert.equal(await block.locator('h4').innerText(),notes[i].title);
        assert.equal(await block.locator('p').innerText(),notes[i].text);
        assert.deepEqual(await block.locator('a').evaluateAll(links=>links.map(link=>link.getAttribute('href'))),notes[i].sources.map(source=>source.href));
      }
      if(story.id==='sheep-goats' || story.id==='minas') await page.locator('.pb-close').screenshot({path:`.output/parables/${width}-${theme}-${story.id}-close.png`});
      for(let i=0;i<3;i++) {
        await page.locator('.pb-beats button').nth(i).click();
        assert.equal(await page.locator('.pb-beat-copy').innerText(),story.beats[i][1]);
      }
      if(story.passages.length>1) for(let i=0;i<story.passages.length;i++) {
        const button=page.locator('.pb-account-tabs button').nth(i);
        assert.equal(await button.innerText(),passageLabel(story.passages[i]));
        await button.click();
        assert.equal(await button.getAttribute('aria-pressed'),'true');
        assert.equal(await page.locator('.pb-account-tabs button[aria-pressed=true]').count(),1);
        assert.equal(await page.locator('#pb-account-note p').innerText(),story.passages[i].note);
        assert.equal(await page.locator('.pb-account-title').innerText(),passageLabel(story.passages[i]));
        assert.ok((await page.locator('.pb-reading-head .pb-kicker').textContent())?.includes(passageLabel(story.passages[i])));
        assert.equal(await page.locator('.pb-read-link').getAttribute('href'),passageUrl(story.passages[i]));
        assert.equal(await page.locator('.pb-open-passage').getAttribute('href'),passageUrl(story.passages[i]));
      }
      if(story.id==='lamp' || story.id==='tree-fruit') await page.locator('.pb-accounts').screenshot({path:`.output/parables/${width}-${theme}-${story.id}-accounts.png`});
      await page.locator('.pb-close summary').click();
      assert.equal(await page.locator('.pb-close details p').isVisible(),true);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}/${theme}/${story.id}: overflow`);
    }
    for(let i=0;i<PARABLE_ROOMS.length;i++) {
      await page.locator('.pb-category').nth(i+1).click();
      assert.equal(await page.locator('.pb-story-list button').count(),PARABLES.filter(p=>p.room===PARABLE_ROOMS[i].id).length);
    }
    await page.getByLabel('Find a parable').fill('no-such-story');
    assert.equal(await page.locator('.pb-story-list button').count(),0);
    await page.getByRole('button',{name:`Show all ${PARABLES.length} studies`}).click();
    await page.getByLabel('Find a parable').fill('Luke 15');
    assert.equal(await page.locator('.pb-story-list button').count(),3);
    for(const name of ['prodigal','Samaritan','Pharisee','tares']) {
      await page.getByLabel('Find a parable').fill(name);
      assert.equal(await page.locator('.pb-story-list button').count(),1);
    }
    await page.getByLabel('Find a parable').fill('');
    for(const [query,id] of [['son prodigal','sons'],['Matt. 13:18','sower'],['Luke 11:33','lamp'],['Matthew 12:35','tree-fruit']]) {
      await page.getByLabel('Find a parable').fill(query);
      assert.ok(await page.locator('.pb-story-list button').filter({hasText:PARABLES.find(story=>story.id===id)!.title}).count());
    }
    await page.locator('.pb-story-list button').filter({hasText:'The tree & its fruit'}).click();
    assert.equal(await page.locator('.pb-account-title').innerText(),'Matthew 12:33–37');
    await page.getByRole('button',{name:'Clear search',exact:true}).click();
    assert.equal(await page.locator('.pb-story-list button').count(),PARABLES.length);
    assert.equal(await page.getByLabel('Find a parable').evaluate(el=>el===document.activeElement),true);
    await page.goto(base+PARABLE_GUIDE_URL+'&theme=field&q=prodigal');
    assert.equal(await page.locator('.pb-story-list button').count(),0);
    await page.locator('#pb-story-browser').screenshot({path:`.output/parables/${width}-${theme}-search-empty.png`});
    await page.getByRole('button',{name:'Search all categories (1)',exact:true}).click();
    assert.equal(await page.getByLabel('Find a parable').inputValue(),'prodigal');
    assert.equal(await page.locator('.pb-story-list button').count(),1);
    // Navigation state must survive a copied URL, reload, history and a reader round trip.
    const savedStudy=base+PARABLE_GUIDE_URL+'&parable=lamp&theme=field&q=lamp&passage=LUK-11-33-33&moment=2';
    await page.goto(savedStudy);
    assert.equal(await page.getByLabel('Find a parable').inputValue(),'lamp');
    assert.equal(await page.locator('.pb-category[aria-pressed=true]').count(),1);
    assert.equal(await page.locator('.pb-beats button[aria-pressed=true]').innerText(),'03\nSeen');
    assert.equal(await page.locator('.pb-account-title').innerText(),'Luke 11:33');
    await page.reload();
    assert.equal(await page.locator('.pb-account-title').innerText(),'Luke 11:33');
    await page.locator('.pb-read-link').click();
    await page.waitForURL('**/read/kjv/LUK/11?hl=33-33');
    await page.goBack();
    assert.equal(await page.locator('.pb-account-title').innerText(),'Luke 11:33');
    assert.equal(await page.getByLabel('Find a parable').inputValue(),'lamp');
    assert.equal(await page.locator('.pb-beats button[aria-pressed=true]').innerText(),'03\nSeen');
    await page.getByRole('button',{name:'Luke 8:16–18',exact:true}).click();
    await page.goBack();
    assert.equal(await page.locator('.pb-account-title').innerText(),'Luke 11:33');
    await page.goForward();
    assert.equal(await page.locator('.pb-account-title').innerText(),'Luke 8:16–18');
    await page.getByRole('button',{name:'Choose another study'}).click();
    assert.equal(await page.getByLabel('Find a parable').evaluate(el=>el===document.activeElement),true);
    await page.locator('.pb-story-list button').first().click();
    await page.waitForFunction(()=>document.activeElement?.id==='parable-title');
    assert.equal(await page.locator('#parable-title').evaluate(el=>el===document.activeElement),true);
    assert.equal(new URL(page.url()).searchParams.has('passage'),false);
    await page.goto(base+PARABLE_GUIDE_URL+'&parable=invalid&theme=invalid&passage=invalid&moment=999');
    assert.equal(await page.locator('#parable-title').innerText(),'A father & two sons');
    assert.equal(await page.locator('.pb-beats button[aria-pressed=true]').count(),1);
    for(const [id,book,chapter,start,end] of [['lamp','LUK',11,33,33],['tree-fruit','MAT',12,33,37]] as const) {
      await page.goto(base+PARABLE_GUIDE_URL+'&parable='+id);
      const target=PARABLES.find(story=>story.id===id)!.passages.find(p=>p.book===book && p.chapter===chapter)!;
      const choice=page.getByRole('button',{name:passageLabel(target),exact:true});
      await choice.focus();
      await page.keyboard.press('Enter');
      assert.equal(await choice.getAttribute('aria-pressed'),'true');
      await page.locator('.pb-read-link').click();
      await page.waitForURL(`**/read/kjv/${book}/${chapter}?hl=${start}-${end}`);
      await page.waitForFunction(()=>document.querySelector('main')?.textContent?.includes('the tree') || document.querySelector('main')?.textContent?.includes('lighted a candle'));
      await page.goBack();
      assert.equal(await page.locator('#parable-title').innerText(),PARABLES.find(story=>story.id===id)!.title);
    }
    await page.goto(base+PARABLE_GUIDE_URL+'&parable=sower');
    await page.locator('.pb-begin').waitFor();
    assert.ok(await page.evaluate(()=>Boolean(document.querySelector('.pb-begin')!.compareDocumentPosition(document.querySelector('.pb-context')!) & Node.DOCUMENT_POSITION_FOLLOWING)));
    assert.ok(await page.evaluate(()=>Boolean(document.querySelector('.pb-method')!.compareDocumentPosition(document.querySelector('#parable-count')!) & Node.DOCUMENT_POSITION_FOLLOWING)));
    assert.equal(await page.locator('#parable-title').innerText(),'The sower & the soils');
    await page.locator('#parable-reading').scrollIntoViewIfNeeded();
    await page.screenshot({path:`.output/parables/${width}-${theme}-reading.png`});
    await page.locator('.pb-open-passage').click();
    await page.waitForURL('**/read/kjv/MAT/13?hl=1-23');
    await page.waitForFunction(()=>document.querySelector('main')?.textContent?.includes('The same day'));
    await page.goBack();
    assert.equal(await page.locator('#parable-title').innerText(),'The sower & the soils');
    await page.getByRole('link',{name:'Return to the Gospels'}).click();
    await page.getByRole('link',{name:/The parables of Christ/}).click();
    await page.locator('.pb-hero h1').waitFor();
    assert.deepEqual(errors,[]);
    results.push(`${width}px ${theme}: ${PARABLES.length} studies, ${PARABLES.length*3} story steps, Gospel tabs, ${PARABLE_ROOMS.length} categories, search/no-results, direct URL, reader and return navigation passed.`);
    await context.close();
  }
} finally {await browser.close();}
writeFileSync('.output/parables/browser-checks.txt',results.join('\n'));
console.log(results.join('\n'));
