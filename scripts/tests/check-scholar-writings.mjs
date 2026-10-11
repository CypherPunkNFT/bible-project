// RF01: source completeness, filter behaviour, and discovery through both sections.
// Run against a local preview: BASE=http://127.0.0.1:8941 node scripts/tests/check-scholar-writings.mjs
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium, expect } from '@playwright/test';
const data = JSON.parse(readFileSync('content/teachers/writings/william-lane-craig.json', 'utf8'));
const base = process.env.BASE ?? 'http://127.0.0.1:8941';
const out = '.local/rf01-checks';
mkdirSync(out, {recursive:true});
assert.equal(data.writings.length, 177);
assert.equal(new Set(data.writings.map(w => w.pdfUrl)).size, 177);
assert.equal(data.writings.reduce((n,w) => n+w.pages,0),2597);
const browser = await chromium.launch({channel:'msedge'});
const results = [];
try {
  for (const width of [1440,400]) {
    const context = await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
    await context.addInitScript(() => localStorage.setItem('bp-theme','light'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base+data.path);
    await expect(page.getByRole('heading',{name:data.name,exact:true})).toBeVisible();
    await expect(page.locator('.sw-list > li')).toHaveCount(177);
    for (const category of data.categories) {
      await page.getByLabel('Source category').selectOption(category);
      await expect(page.locator('.sw-list > li')).toHaveCount(data.writings.filter(w=>w.categories.includes(category)).length);
    }
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.getByLabel('Search titles and subjects').fill('resurrection');
    await expect(page.locator('.sw-list > li')).toHaveCount(data.writings.filter(w=>`${w.title} ${w.categories.join(' ')}`.toLowerCase().includes('resurrection')).length);
    await page.reload();
    await expect(page.getByLabel('Search titles and subjects')).toHaveValue('resurrection');
    await page.getByLabel('Search titles and subjects').fill('no-match-rf01');
    await expect(page.locator('.sw-empty')).toBeVisible();
    await page.getByRole('button',{name:'Clear filters'}).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`${out}/catalogue-${width}.png`});
    await page.goto(base+'/teachers/scholars');
    await page.getByRole('searchbox',{name:'Search the scholars'}).fill('apologetics');
    const card=page.locator('.cat-card[data-id="william-lane-craig"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText('b. 1949');
    await expect(card).toContainText('Apologetics');
    await card.getByRole('button').click();
    await expect(page.locator('#sc-prf-name')).toHaveText(data.name);
    await expect(page.locator('#sc-prf-name')).toBeInViewport();
    await expect(page.locator('.prf-facts')).toContainText('Living');
    assert.ok(!await page.locator('.prf-grid').evaluate(el=>el.innerHTML.includes('NaN')));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({path:`${out}/profile-${width}.png`});
    await page.getByRole('link',{name:'Browse 177 writings'}).click();
    await expect(page).toHaveURL(base+data.path);
    await page.goto(base+'/apologetics/sources');
    await page.getByRole('button',{name:'Search Apologetics',exact:true}).click();
    const dialog=page.getByRole('dialog');
    await dialog.getByRole('link',{name:/William Lane Craig writings/}).click();
    await expect(page).toHaveURL(base+data.path);
    await page.goto(base+'/teachers/scholars/missing/writings');
    await expect(page.getByRole('heading',{name:'Collection not found'})).toBeVisible();
    assert.deepEqual(errors,[]);
    results.push({width,status:'passed',categories:data.categories.length,documents:177});
    await context.close();
  }
} finally { await browser.close(); }
writeFileSync(`${out}/results.json`,JSON.stringify({base,results},null,2)+'\n');
console.log(JSON.stringify(results));
