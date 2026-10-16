// Keep complete population data while satisfying Pages' 25 MiB per-file limit.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export async function preparePopulationHosting(base,{omitOriginals=false}={}){
 base=path.resolve(base);const manifest={schemaVersion:1,shelves:{},zipParts:[],zipBytes:0,unattributedPages:{}};
 const remove=async relative=>{const target=path.resolve(base,relative);if(!target.startsWith(base+path.sep))throw Error('Hosting target outside population');await fs.unlink(target);};
 for(const name of await fs.readdir(path.join(base,'contributors'))){
  if(!/^[a-f0-9]{2}\.json$/.test(name))continue;
  const file=path.join(base,'contributors',name);if((await fs.stat(file)).size<=24*1024*1024)continue;
  const data=JSON.parse(await fs.readFile(file,'utf8')),parts=[];let chunk={},bytes=2;
  for(const [id,rows] of Object.entries(data)){
   const size=Buffer.byteLength(JSON.stringify({[id]:rows}));
   if(size>20*1024*1024){
    if(Object.keys(chunk).length){parts.push(chunk);chunk={};bytes=2;}
    let group=[],groupBytes=2;
    for(const row of rows){const rowBytes=Buffer.byteLength(JSON.stringify(row));if(rowBytes>24*1024*1024)throw Error(`One work exceeds Pages limit: ${id}`);if(groupBytes+rowBytes>20*1024*1024&&group.length){parts.push({[id]:group});group=[];groupBytes=2;}group.push(row);groupBytes+=rowBytes;}
    if(group.length)parts.push({[id]:group});continue;
   }
   if(bytes+size>20*1024*1024&&Object.keys(chunk).length){parts.push(chunk);chunk={};bytes=2;}
   chunk[id]=rows;bytes+=size;
  }
  if(Object.keys(chunk).length)parts.push(chunk);
  for(const [i,rows] of parts.entries()){const part=name.slice(0,-5)+'-part-'+i+'.json';await fs.writeFile(path.join(base,'contributors',part),JSON.stringify(rows));for(const id of Object.keys(rows))(manifest.shelves[id]??=[]).push(part);}
  if(omitOriginals)await remove('contributors/'+name);
 }
 const zipName='scholars-library-export.zip',zip=await fs.readFile(path.join(base,zipName));manifest.zipBytes=zip.length;
 if(zip.length>24*1024*1024){
  for(let offset=0,i=0;offset<zip.length;offset+=8*1024*1024,i++){
   const part=zip.subarray(offset,offset+8*1024*1024),file=`scholars-library-export.part-${i}.bin`;
   await fs.writeFile(path.join(base,file),part);manifest.zipParts.push({file,bytes:part.length,sha256:createHash('sha256').update(part).digest('hex')});
  }
  if(omitOriginals)await remove(zipName);
 }
 const pages=(await fs.readdir(path.join(base,'unattributed'))).filter(n=>/^\d+\.json$/.test(n)).sort((a,b)=>Number.parseInt(a)-Number.parseInt(b));
 for(let offset=0;offset<pages.length;offset+=100){
  const bundle={},file=`unattributed-bundle-${offset/100}.json`;
  for(const page of pages.slice(offset,offset+100)){bundle[page.slice(0,-5)]=JSON.parse(await fs.readFile(path.join(base,'unattributed',page),'utf8'));manifest.unattributedPages[page.slice(0,-5)]=file;}
  const text=JSON.stringify(bundle);if(Buffer.byteLength(text)>24*1024*1024)throw Error('Unattributed bundle exceeds Pages limit');await fs.writeFile(path.join(base,file),text);
 }
 if(omitOriginals)for(const page of pages)await remove('unattributed/'+page);
 await fs.writeFile(path.join(base,'hosting.json'),JSON.stringify(manifest));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const m=await preparePopulationHosting('public/content/scholar-population');console.log(JSON.stringify({splitShelves:Object.keys(m.shelves).length,zipParts:m.zipParts.length,zipBytes:m.zipBytes}));}
