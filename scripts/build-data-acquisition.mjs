// Export only this reference acquisition's recorded files. No intake or library scan.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {applyReferenceTexts} from './apply-reference-texts.mjs';
import {applyCompletenessReview} from './apply-completeness-review.mjs';
import {applyWaceReview,mergeWaceReview} from './apply-wace-review.mjs';
import {applyCorpusAdditions} from './apply-corpus-additions.mjs';
const site=path.resolve(import.meta.dirname,'..');
const data=path.resolve(site,'../Data/TheologicalReferenceLibrary');
const out=path.join(site,'public/data_acquisition');
const receipt=JSON.parse(fs.readFileSync(path.join(data,'download-receipt.json')));
const additions=JSON.parse(fs.readFileSync(path.join(data,'download-additions.json')));
const names={'Schaff-Herzog':'New Schaff–Herzog Encyclopedia','Christian-Biography':'Wace & Piercy · Dictionary of Christian Biography','Catholic-Encyclopedia':'The Catholic Encyclopedia','McClintock-Strong':'McClintock & Strong · Cyclopaedia','Brad-East':'Brad East · 153 theologians','Carolina-University':'100 philosophers and theologians','Fifty-Key-Christian-Thinkers':'Fifty Key Christian Thinkers','Great-Theologians':'The Great Theologians','131-Christians':'131 Christians Everyone Should Know','St-Andrews':'St Andrews Encyclopaedia of Theology'};
fs.mkdirSync(path.join(out,'texts'),{recursive:true});
let exportedBytes=0;
const records=[...Object.values(receipt.items),...additions.map(x=>({...x,status:'identified'}))].map(x=>{
 const local=path.resolve(data,x.file);if(!local.startsWith(data+path.sep))throw Error('Invalid source path');
 const format=path.extname(x.file).slice(1).toUpperCase();
 const id=createHash('sha256').update(x.file).digest('hex').slice(0,16);
 const volume=/volume-(\d+)/.exec(x.file)?.[1];
 const subtitle=volume?`Volume ${Number(volume)}${x.file.includes('archive-ocr')?' · alternate IA OCR':''}`:x.file.includes('/index-')?'Index':x.file.includes('christianity-articles')?'Article directory':x.file.includes('about.html')?'About the encyclopedia':x.file.includes('christian-theology')?'Christian Theology · article':'Reference';
 const exists=fs.existsSync(local);const bytes=exists?fs.statSync(local).size:null;
 let status=x.status==='downloaded'?(exists&&bytes===x.bytes?'downloaded':'unverified'):x.status;
 let textUrl=null;
 if(status==='downloaded'&&format==='TXT'){
  textUrl=`texts/${id}.txt`;fs.copyFileSync(local,path.join(out,textUrl));exportedBytes+=bytes;
 }
 let quality=format==='TXT'?'Saved text; OCR accuracy and complete coverage have not been certified.':format==='PDF'?'PDF downloaded; no separate readable text exported.':'Saved reference page; full book text is not held.';
 if(x.group==='Schaff-Herzog'&&format==='TXT'&&bytes<100000)quality='Short text file: coverage is unverified and may be substantially incomplete. Do not treat this as the complete volume.';
 if(status==='identified')quality='Alternative source identified only. This file has not been downloaded.';
 if(status==='failed')quality='Download failed. No saved text is available.';
 if(status==='unverified')quality='The receipt and local file do not agree. Availability needs checking.';
 return {id,collection:names[x.group]||x.group,group:x.group,category:x.file.startsWith('Encyclopedias/')?'Encyclopedias':x.file.startsWith('Scholar-Lists/')?'Scholar lists':'Publisher references',subtitle,format,status,bytes:status==='downloaded'?bytes:null,textUrl,sourceUrl:x.url,note:x.note,quality,problem:status==='failed'?(x.error||'Download failed'):null,recordedAt:x.finishedAt||null,shortText:x.group==='Schaff-Herzog'&&format==='TXT'&&bytes<100000,filename:path.basename(x.file)};
});
const manifest={schema:1,generatedAt:new Date().toISOString(),receiptUpdatedAt:receipt.updatedAt,scope:'Theological reference acquisitions only. Counts are files/representations, not distinct books or authors.',activity:'No downloads running in this saved receipt. This page does not start or retry downloads.',records};
// Preserve the five specifically prepared reference texts on later desk exports.
exportedBytes+=applyReferenceTexts(records,data,out).bytes;
manifest.completenessReview=applyCompletenessReview(records,data,out);
exportedBytes+=manifest.completenessReview?.exportedBytes||0;
const waceReview=applyWaceReview(records,data,out);manifest.completenessReview=mergeWaceReview(manifest.completenessReview,waceReview);exportedBytes+=waceReview?.exportedBytes||0;
// Christian writers corpus additions: McClintock 11-12, Catholic Encyclopedia 6, candidate people.
applyCorpusAdditions(records,out);
fs.writeFileSync(path.join(out,'catalogue.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({records:records.length,status:records.reduce((s,x)=>(s[x.status]=(s[x.status]||0)+1,s),{}),readableTextFiles:records.filter(x=>x.textUrl).length,exportedBytes,output:out},null,2));
