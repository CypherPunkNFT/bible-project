import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
const dir=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',colorScheme:theme});
  await context.addInitScript(t=>localStorage.setItem('bp-theme',t),theme);
  const page=await context.newPage();
  for(const d of ['a','b','c','d']){
   await page.goto('http://localhost:8931/mockups/apologetics-navigation/?d='+d+'#/apologetics/worldviews/islam');
   await page.locator('.sm-container').waitFor();await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:path.join(dir,'screenshots',`round4-${d}-1440-${theme}.png`),animations:'disabled'});
   await page.setViewportSize({width:1440,height:900});
   await page.screenshot({path:path.resolve(dir,'../_gallery/thumbs',`apologetics-navigation${d==='a'?'':'-'+d}-${theme}.png`),animations:'disabled'});
   await page.setViewportSize({width:1440,height:1000});
  }
  await context.close();
 }
 console.log('Updated eight gallery pictures and desktop light/dark screenshots.');
}finally{await browser.close();}
