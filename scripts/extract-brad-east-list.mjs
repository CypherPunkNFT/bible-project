// One saved reference page: transcribe its factual names/dates, preserving attribution.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {JSDOM} from 'jsdom';
const site=path.resolve(import.meta.dirname,'..'),data=path.resolve(site,'../Data/TheologicalReferenceLibrary');
const sourceFile='Scholar-Lists/brad-east-153-theologians.html';const raw=fs.readFileSync(path.join(data,sourceFile));
const sourceUrl='https://www.bradeast.org/blog/2020/07/100-theologians-before-20th-century.html';
const doc=new JSDOM(raw.toString('utf8')).window.document;
const lists=[...doc.querySelectorAll('.blog-item-content ol')];const expected=[32,39,50,32,25];
if(lists.length!==expected.length)throw Error('Saved page structure changed');
let removedArtifacts=0;
const sections=lists.map((ol,i)=>{
 const items=[...ol.querySelectorAll(':scope > li')].map(li=>{
  const original=li.textContent;const cleaned=original.replace(/\n\s*\d+\.\s*$/,'');if(cleaned!==original)removedArtifacts++;
  return cleaned.replace(/\s+/g,' ').trim();
 });
 if(items.length!==expected[i]||items.some(x=>!x))throw Error('List count changed');
 return {heading:ol.previousElementSibling.textContent.trim(),items};
});
const header=`THEOLOGIANS LISTED BY BRAD EAST\n\nSource: ${sourceUrl}\n\nThis reference transcribes the names and dates from Brad East's saved webpage. The main list contains 153 entries across four periods. The page also supplies 25 suggested additions. This is the author's selection, not a ranked or comprehensive list. Dates and attributions are reproduced as recorded, without independent verification.\n`;
let number=0;const text=header+sections.map((s,i)=>'\n'+s.heading+'\n'+'-'.repeat(s.heading.length)+'\n'+s.items.map(name=>`${i<4?++number:++number-153}. ${name}`).join('\n')+'\n').join('');
const dir=path.join(data,'Derived/Scholar-Lists');fs.mkdirSync(dir,{recursive:true});const textFilename='brad-east-theologian-list.txt';fs.writeFileSync(path.join(dir,textFilename),text);
const metadata={textFilename,textBytes:Buffer.byteLength(text),textLabel:'Text extracted from saved HTML',subtitle:'Theologian list',quality:'Names and dates extracted from the saved webpage: 153 main entries and 25 suggested additions. Dates remain as recorded in the source.',mainEntries:153,suggestedAdditions:25,sourceFile,sourceUrl,sourceSha256:createHash('sha256').update(raw).digest('hex'),textSha256:createHash('sha256').update(text).digest('hex'),removedTrailingNumberArtifacts:removedArtifacts};
fs.writeFileSync(path.join(dir,'brad-east-theologian-list.json'),JSON.stringify(metadata,null,2)+'\n');
const cataloguePath=path.join(site,'public/data_acquisition/catalogue.json');const catalogue=JSON.parse(fs.readFileSync(cataloguePath));const record=catalogue.records.find(x=>x.group==='Brad-East');if(!record||record.status!=='downloaded')throw Error('Downloaded Brad East record missing');
const textUrl=`texts/${record.id}.txt`;fs.writeFileSync(path.join(site,'public/data_acquisition',textUrl),text);
Object.assign(record,{textUrl,textFilename,textBytes:metadata.textBytes,textLabel:metadata.textLabel,subtitle:metadata.subtitle,quality:metadata.quality});catalogue.generatedAt=new Date().toISOString();fs.writeFileSync(cataloguePath,JSON.stringify(catalogue,null,2)+'\n');
console.log(JSON.stringify({id:record.id,textUrl,mainEntries:153,suggestedAdditions:25,bytes:metadata.textBytes,removedArtifacts},null,2));
