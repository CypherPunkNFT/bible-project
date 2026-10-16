import fs from 'node:fs';
import {transform} from 'esbuild';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const files=['src/pages/study/history/evidence.ts','src/pages/study/history/cities-research.ts'];
const modules=[];const hashes={};
for(const f of files){const raw=fs.readFileSync(root+f,'utf8');hashes[f]=createHash('sha256').update(raw).digest('hex');const r=await transform(raw,{loader:'ts',format:'esm'});modules.push(await import('data:text/javascript;base64,'+Buffer.from(r.code).toString('base64')));}
const {cities,sources}=modules[0];const {research,investigations,grainMeasurements}=modules[1];
const used=new Set(cities.flatMap(c=>c.layers.flatMap(l=>[...l.sources,...l.finds.flatMap(f=>f.sources)])));
const data={cities,sources:Object.fromEntries([...used].map(id=>[id,sources[id]])),research,investigations,grainMeasurements};
fs.writeFileSync(new URL('prototype-data.js',import.meta.url),'window.CITIES_DATA = '+JSON.stringify(data,null,2)+';\n');
fs.writeFileSync(new URL('source-snapshot.json',import.meta.url),JSON.stringify({date:'2026-10-14',hashes,cities:cities.length,horizons:cities.reduce((n,c)=>n+c.layers.length,0)},null,2));
console.log('Copied source data only; no application build.');
