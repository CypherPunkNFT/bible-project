import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.resolve('package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
const errors=[],badResponses=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()})});
await page.addInitScript(()=>localStorage.setItem('bp-theme','dark'));
const root='http://127.0.0.1:8931/mockups/christianity-islam/';
const shots=path.join(dir,'screenshots');fs.mkdirSync(shots,{recursive:true});
await page.goto(root);
await page.locator('.concept-two-paths').waitFor();
await page.screenshot({path:path.join(shots,'dark-hub-desktop.png'),fullPage:true});
console.log(JSON.stringify({smoke:'loaded',title:await page.title(),errors,badResponses}));
for(const width of [1440,768,390,320]){
 await page.setViewportSize({width,height:1050});
 for(const theme of ['dark','light']){
  for(const view of ['hub','understanding','ministry','questions','reading','world','library','article','worldviews']){
   await page.goto(root+'?view='+view);
   await page.locator('.concept-content h1').waitFor();
   if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('switch',{name:'Dark mode'}).click();
   if(view==='world'){
    await page.locator('#muslim-world').scrollIntoViewIfNeeded();
    await page.getByText('Opening the atlas…',{exact:true}).waitFor({state:'hidden',timeout:30000});
   }
   const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth+1,extra:[...document.querySelectorAll('.concept-content *')].filter(x=>{const b=x.getBoundingClientRect();return b.width&&b.right>innerWidth+2&&getComputedStyle(x).position!=='absolute'}).slice(0,4).map(x=>x.className)}));
   results.push({width,theme,view,overflow:overflow.document});
   if(overflow.document)throw Error(JSON.stringify({width,theme,view,overflow}));
   if(width===1440||width===390)await page.screenshot({path:path.join(shots,`${theme}-${view}-${width===1440?'desktop':'mobile'}.png`),fullPage:view!=='questions'});
  }
 }
}
await page.setViewportSize({width:1440,height:1050});
await page.goto(root+'?view=questions');
await page.locator('.wv-claim-map').waitFor();
if(await page.locator('.wv-claim-map button').count()!==12)throw Error('Twelve questions missing');
await page.getByRole('button',{name:'What happened at the cross?',exact:true}).click();
if(!await page.locator('.wv-current-question').innerText().then(x=>x.includes('What happened at the cross?')))throw Error('Comparison selection failed');
await page.getByRole('button',{name:'Read the texts side by side'}).first().click();
await page.locator('.wv-basis-text').last().waitFor();
await page.screenshot({path:path.join(shots,'paired-sources.png')});
await page.getByRole('link',{name:'Read the passages in context',exact:true}).click();
await page.locator('.wv-analysis-heading').waitFor();
if(!page.url().includes('view=reading'))throw Error('Reading link lost its mockup route');
await page.goto(root+'?view=reading');
const stages=page.locator('.wv-source-roadmap button');
if(await stages.count()!==4)throw Error('Four stages missing');
let passages=0;
for(let i=0;i<4;i++){await stages.nth(i).click();const choices=page.locator('.wv-passage-rail nav button');passages+=await choices.count();for(let j=0;j<await choices.count();j++){await choices.nth(j).click();if(!await page.locator('.wv-analysis-heading h3').innerText())throw Error('Passage missing')}}
if(passages!==10)throw Error('Ten readings missing');
await page.goto(root+'?view=understanding');
await page.getByRole('button',{name:/Worship & daily life/}).click();
if(!await page.locator('#topic-detail').innerText().then(x=>x.includes('Ramadan and fasting')))throw Error('Topic navigation failed');
await page.getByRole('link',{name:/Ramadan and fasting/}).click();
if(await page.locator('.concept-article-header h1').innerText()!=='Ramadan and fasting')throw Error('Distinct article route failed');
await page.goBack();
await page.locator('.concept-curriculum').waitFor();
await page.goto(root+'?view=world&country=PAK');
await page.locator('#muslim-world').scrollIntoViewIfNeeded();
await page.getByText('Opening the atlas…',{exact:true}).waitFor({state:'hidden',timeout:30000});
await page.screenshot({path:path.join(shots,'atlas-pakistan.png'),fullPage:true});
fs.writeFileSync(path.join(dir,'verification.json'),JSON.stringify({results,checks:{questions:12,passages,readingStages:4,pairedTexts:'passed',relatedReadingLink:'passed',topicNavigation:'passed',articleNavigation:'passed',browserBack:'passed'},errors,badResponses},null,2));
await browser.close();
if(errors.length||badResponses.length)throw Error(JSON.stringify({errors,badResponses}));
console.log(JSON.stringify({viewportThemeViews:results.length,questions:12,readingStages:4,passages,errors,badResponses}));
