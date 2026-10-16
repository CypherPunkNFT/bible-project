import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
fs.mkdirSync(path.join(dir,'review'),{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
try {const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 for(const [id,route,selector] of [['witnesses','/study/surviving-witnesses','.sw-desk'],['worldviews','/apologetics/worldviews','.wv-collections'],['letters','/study/letters','.lb'],['preachers','/teachers/preachers-and-authors','.lnd'],['scholars','/teachers/scholars','.idea-lineage']]){
  try {await page.goto('http://127.0.0.1:8931'+route);await page.locator(selector).first().waitFor({timeout:15000});await page.screenshot({path:path.join(dir,'review',id+'-opening.png')});await page.locator(selector).first().screenshot({path:path.join(dir,'review',id+'-experience.png')});results.push({id,status:'rendered',title:await page.title(),headings:await page.locator('h1,h2').allTextContents()});}catch(e){results.push({id,status:'failed',error:String(e)});}
 }
}finally{await browser.close();}
fs.writeFileSync(path.join(dir,'review','references.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
