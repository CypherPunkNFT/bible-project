import {build} from 'esbuild';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('content/teachers/knowledge-connections/index.json','utf8'));
const counts=Object.fromEntries(Object.keys(data.fields).map(f=>[f,data.chains.filter(c=>c.field===f).length]));
if(Object.values(counts).some(n=>n<10))throw Error('Every category must contain at least ten threads');
const works=new Set(data.works.map(w=>w.id)),edges=new Map(data.connections.map(e=>[e.id,e]));
if(new Set(data.chains.map(c=>c.id)).size!==data.chains.length)throw Error('Duplicate thread ID');
for(const c of data.chains){if(c.workIds.some(id=>!works.has(id)))throw Error('Unknown work in '+c.id);for(const id of c.edgeIds){const e=edges.get(id);if(!e||!c.workIds.includes(e.fromWorkId)||!c.workIds.includes(e.toWorkId))throw Error('Invalid explicit connection in '+c.id);}}
fs.writeFileSync('design/scholar-connections/dataset-audit.json',JSON.stringify({chains:data.chains.length,works:data.works.length,connections:data.connections.length,fields:counts},null,2)+'\n');
await build({entryPoints:['design/scholar-connections/app.ts'],bundle:true,format:'iife',outfile:'design/scholar-connections/app.js'});
console.log(JSON.stringify({chains:data.chains.length,fields:counts}));
