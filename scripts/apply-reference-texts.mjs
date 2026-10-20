import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const savedReferences=[
 ['Brad-East','Scholar-Lists/brad-east-theologian-list'],
 ['Carolina-University','Scholar-Lists/carolina-philosophers-theologians'],
 ['Fifty-Key-Christian-Thinkers','Publisher-References/fifty-key-christian-thinkers'],
 ['Great-Theologians','Publisher-References/the-great-theologians'],
 ['131-Christians','Publisher-References/131-christians-everyone-should-know'],
];
export function applyReferenceTexts(records,data,out){
 let bytes=0,count=0;
 for(const [group,file] of savedReferences){
  const metadata=path.join(data,'Derived',file+'.json');if(!fs.existsSync(metadata))continue;
  const m=JSON.parse(fs.readFileSync(metadata)),r=records.find(x=>x.group===group);if(r?.status!=='downloaded')continue;
  const textUrl=`texts/${r.id}.txt`;fs.copyFileSync(path.join(path.dirname(metadata),m.textFilename),path.join(out,textUrl));
  Object.assign(r,{textUrl,textFilename:m.textFilename,textBytes:m.textBytes,textLabel:m.textLabel,subtitle:m.subtitle,quality:m.quality});bytes+=m.textBytes;count++;
 }
 return {bytes,count};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const site=path.resolve(import.meta.dirname,'..'),data=path.resolve(site,'../Data/TheologicalReferenceLibrary'),out=path.join(site,'public/data_acquisition'),file=path.join(out,'catalogue.json');
 const catalogue=JSON.parse(fs.readFileSync(file));const result=applyReferenceTexts(catalogue.records,data,out);catalogue.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(catalogue,null,2)+'\n');console.log(JSON.stringify({...result,readableRecords:catalogue.records.filter(x=>x.textUrl).length}));
}
