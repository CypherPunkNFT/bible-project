// Local review assets only. Preserve original PDF bytes; load one work at a time.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../..');
const sources=process.env.BIBLE_SOURCES||[path.join(root,'sources'),path.resolve(root,'../Sources')].find(p=>fs.existsSync(p));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const data=read('design/scholars-built-directions/rings-data.json'),readers={};
const out=path.join(dir,'reader-files');fs.mkdirSync(out,{recursive:true});
function asset(id,page){
 const a=read(`content/library/catalog/assets/${id}.json`);
 if(!a.relativePath)return null;
 const file=path.resolve(sources,a.relativePath);if(!file.startsWith(path.resolve(sources)+path.sep)||!fs.existsSync(file))return null;
 const target=path.join(out,id+'.json');
 if(!fs.existsSync(target)||fs.statSync(target).mtimeMs<fs.statSync(file).mtimeMs){
  fs.writeFileSync(target,JSON.stringify({mime:a.format==='pdf'?'application/pdf':'application/xml',data:fs.readFileSync(file).toString('base64')}));
 }
 return {file:`reader-files/${id}.json`,page:page||1,source:a.canonicalUrl,credit:a.rights.attribution||'Charles Haddon Spurgeon · '+(a.sourceId==='source-ccel'?'Christian Classics Ethereal Library':'Internet Archive')};
}
for(const s of read('content/library/reports/spurgeon/sermons.json').filter(s=>s.creatorId==='author-charles-spurgeon')){
 const r=asset(s.assetId,s.acquisitionStatus==='contained-in-volume'?s.volumeLocator?.page:1);
 if(r)readers[s.workId]=r;
}
const books={
 'All of Grace':'asset-ready-text-edition-spurgeon-grace',
 'Morning and Evening':'asset-ready-text-edition-spurgeon-morning-evening',
 'Lectures to My Students':'asset-l12-spurgeon-lectures-pdf',
 'The New Park Street and Metropolitan Tabernacle Pulpit':'asset-spurgeon-gems-chsbm1',
};
for(const w of data.works.filter(w=>w.leader==='author-charles-spurgeon'))if(books[w.title]){
 readers[w.id]=asset(books[w.title]);
 if(w.title==='Lectures to My Students')readers[w.id].edition='First series';
 if(w.title==='The New Park Street and Metropolitan Tabernacle Pulpit')readers[w.id].edition='Volume 1 · 1855';
}
const featured=read('content/library/reports/study-paths/resources.json').resources.filter(r=>r.authors.some(a=>/Spurgeon/.test(a))).map(r=>r.workId);
function ocr(id,edition){
 const file=path.join(sources,'library/bulk/ia',id+'.txt');
 const target=path.join(out,id+'.json');
 if(!fs.existsSync(target))fs.writeFileSync(target,JSON.stringify({mime:'text/plain',data:fs.readFileSync(file).toString('base64')}));
 return {file:`reader-files/${id}.json`,edition,source:`https://archive.org/details/${id}`,credit:'Charles Haddon Spurgeon · Internet Archive · Scanned book text (OCR; may contain errors)'};
}
const spurgeon=data.works.filter(w=>w.leader==='author-charles-spurgeon');
readers[spurgeon.find(w=>w.title==='Commenting and Commentaries').id]=ocr('commentingandco00spurgoog','Commenting and Commentaries · scanned edition');
const treasury=['thetreasuryofdav01spuruoft','thetreasuryofdav02spuruoft','thetreasuryofdav03spuruoft','treasuryofdavid04spuruoft','thetreasuryofdav00spuruoft','treasuryofdavid06spuruoft'].map((id,i)=>ocr(id,`Volume ${i+1}`));
readers[spurgeon.find(w=>w.title==='The Treasury of David').id]={...treasury[0],parts:treasury};
const volumes=read('content/library/reports/spurgeon/inventory.json').volumes.map(v=>({...asset(`asset-spurgeon-gems-chsbm${v.volume}`),edition:`Volume ${v.volume} · ${v.publicationYear}`}));
readers[spurgeon.find(w=>w.title==='The New Park Street and Metropolitan Tabernacle Pulpit').id]={...volumes[0],parts:volumes};
fs.writeFileSync(path.join(dir,'readers.json'),JSON.stringify({readers,featured}));
console.log(`${Object.keys(readers).length} local readers prepared; ${featured.length} study-path selections.`);
