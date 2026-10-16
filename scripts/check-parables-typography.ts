import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge'});
const report:string[]=[];
mkdirSync('.output/parables',{recursive:true});
try {
 for(const width of [320,390,768,1440]) for(const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(t=>localStorage.setItem('bp-theme',t),theme);
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8931/study/gospels?guide=parables&parable=minas');
  await page.locator('.pb-deep-reading').first().waitFor();
  await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
   const css=(selector:string)=>getComputedStyle(document.querySelector(selector)!);
   const rgb=(color:string)=>{const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d')!;x.fillStyle=color;x.fillRect(0,0,1,1);return [...x.getImageData(0,0,1,1).data].slice(0,3);};
   const lum=(color:string)=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   const contrast=(selector:string)=>{const a=lum(css(selector).color),b=lum(css('.pb-reading').backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
   return {body:parseFloat(css('.pb-deep-reading p').fontSize),source:parseFloat(css('.pb-reading-sources a').fontSize),input:parseFloat(css('#pb-find-story').fontSize),line:parseFloat(css('.pb-deep-reading p').lineHeight),bodyContrast:contrast('.pb-deep-reading p'),sourceContrast:contrast('.pb-reading-sources a'),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.ok(metrics.body>=16 && metrics.source>=14 && metrics.input>=16,JSON.stringify(metrics));
  assert.ok(metrics.line/metrics.body>=1.7);
  assert.ok(metrics.bodyContrast>=4.5 && metrics.sourceContrast>=4.5,JSON.stringify(metrics));
  assert.equal(metrics.overflow,false,`${width}/${theme} overflow`);
  if(width===390 || width===1440) {
   await page.locator('.pb-deep-reading').first().screenshot({path:`.output/parables/${width}-${theme}-typography-reading.png`});
   await page.locator('.pb-selector').screenshot({path:`.output/parables/${width}-${theme}-typography-categories.png`});
  }
  await page.locator('#pb-find-story').focus();
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(()=>getComputedStyle(document.activeElement!).outlineStyle),'none');
  if(width===768) {
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'200% text overflow');
  }
  report.push(`${width}px ${theme}: ${JSON.stringify(metrics)}; focus and reflow passed.`);
  await context.close();
 }
} finally {await browser.close();}
writeFileSync('.output/parables/typography-checks.txt',report.join('\n'));
console.log(report.join('\n'));
