import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const website=path.resolve(dir,'../..');
const require=createRequire(path.join(website,'package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
const root='http://localhost:8931/mockups/christianity-islam/';
const collection=root+'?view=collection';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const results=[];
for(const width of [1440,390,320]){
 await page.setViewportSize({width,height:1050});
 for(const view of ['hub','ministry','understanding','library','worldviews','collection']){
  await page.goto(root+'?view='+view);await page.locator('.concept-content h1').waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  if(overflow)throw Error('Overflow '+width+' '+view);
  if(view!=='worldviews'&&await page.locator('.concept-nav-container > nav').count()!==2)throw Error('Shared navigation rows missing');
  if(await page.locator('.concept-breadcrumb,.concept-review,.concept-review-notes').count())throw Error('Development banner or breadcrumb rendered');
  if(['hub','ministry'].includes(view)){
   const link=page.getByRole('link',{name:'Explore the collection',exact:true});
   if(await link.getAttribute('href')!=='/mockups/christianity-islam/?view=collection')throw Error('Full collection duplicate link missing');
  }
  if(width!==320)await page.screenshot({path:path.join(dir,'screenshots',`preserved-${view}-${width}.png`),fullPage:true});
  results.push({width,view,overflow:false});
 }
}
await page.setViewportSize({width:1440,height:1050});
await page.goto(root);
await page.getByRole('link',{name:'Explore the collection',exact:true}).click();
await page.waitForURL(collection);await page.locator('.wv-hero h1').waitFor();
if(!(await page.locator('.wv-hero h1').innerText()).includes('Islam'))throw Error('Original title missing');
if(await page.locator('.wv-claim-map button').count()!==12)throw Error('Original question desk missing');
if(await page.locator('#muslim-world').count()!==1)throw Error('Original atlas missing');
if(await page.locator('.wv-source-roadmap button').count()!==4)throw Error('Original reading plan missing');
await page.goBack();await page.locator('.concept-existing-page').waitFor();
for(const [view,anchor] of [['questions','comparison'],['reading','reading-sources'],['world','muslim-world']]){
 await page.goto(root+'?view='+view+'&country=PAK');
 await page.waitForURL(collection+'&country=PAK#'+anchor);
 await page.locator('#'+anchor).waitFor();
}
await page.goto(root+'?view=worldviews');
await page.locator('.wv-collection').filter({hasText:'Christianity & Islam'}).click();
await page.waitForURL(collection);
await page.goto(root+'?view=library');
await page.locator('.concept-source-list a').first().click();
await page.waitForURL(collection+'&reading=q112#reading-sources');
await page.locator('.wv-analysis-heading').waitFor();
for(const theme of ['dark','light']){
 await page.goto(root);await page.locator('.concept-existing-page').waitFor();
 if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('switch',{name:'Dark mode'}).click();
 await page.screenshot({path:path.resolve(dir,`../_gallery/thumbs/christianity-islam-${theme}.png`)});
}
const baseline=JSON.parse(fs.readFileSync(path.join(dir,'source-baseline.json'),'utf8'));
const unchanged=Object.entries(baseline.files).every(([f,hash])=>createHash('sha256').update(fs.readFileSync(path.join(website,f))).digest('hex')===hash);
await browser.close();
const report={scope:'Complete local Collection duplicate beneath shared two-row navigation; production source unchanged.',results,localCollectionLink:'passed',completeCollection:'passed',sharedNavigation:'passed',allThreeSectionLinks:'passed',legacyMockupLinks:'passed',localWorldviewsCard:'passed',sourceLink:'passed',browserBack:'passed',productionSourceUnchanged:unchanged,errors};
fs.writeFileSync(path.join(dir,'preservation-verification.json'),JSON.stringify(report,null,2));
if(errors.length||!unchanged)throw Error(JSON.stringify(report));
console.log(JSON.stringify({checks:results.length,exactPageLink:'passed',pageAndAllSections:'passed',productionSourceUnchanged:unchanged,errors}));
