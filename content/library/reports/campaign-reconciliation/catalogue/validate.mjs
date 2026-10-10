// Aggregate validation of only this task's new catalogue records.
import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv from 'ajv';

const out=path.dirname(fileURLToPath(import.meta.url));
const site=path.resolve(out,'../../../../..');
const root=path.join(site,'content/library');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):e.name.endsWith('.json')?[path.join(p,e.name)]:[]);
const schema=read(path.join(root,'schema.json'));
const ajv=new Ajv({strict:true,allErrors:true,allowUnionTypes:true});
ajv.addFormat('https-url',v=>{try {const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}});
ajv.addFormat('date',v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v)));
ajv.addFormat('date-time',v=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(v)&&Number.isFinite(Date.parse(v)));
const validate=ajv.compile(schema);
const all=walk(path.join(root,'catalog')).map(p=>[p,read(p)]);
const records=new Map(all.map(([p,r])=>[r.id,r]));
const registry=read(path.join(root,'authors.json')).authors;
for(const p of walk(path.join(root,'registry-extensions')))registry.push(...(read(p).authors||[]));
const authors=new Set(registry.map(a=>a.id));
const sources=new Map(read(path.join(root,'sources.json')).sources.map(s=>[s.id,s]));
const vocabulary=read(path.join(root,'vocabulary.json'));
const terms=k=>new Set(vocabulary[k].map(v=>typeof v==='string'?v:v.id));
const own=new Set(read(path.join(out,'generated-records.state')).paths.map(p=>path.resolve(p)));
const issues=[];
let checked=0;
for(const [file,r] of all){
  if(!own.has(path.resolve(file)))continue;
  checked++;
  const fail=message=>issues.push({path:file,message});
  if(!validate(r))fail(ajv.errorsText(validate.errors));
  if(path.basename(file)!==r.id+'.json'||path.basename(path.dirname(file))!==r.kind+'s')fail('Record ID, filename and folder disagree');
  if(r.kind==='work'){
    for(const c of r.creators)if(!authors.has(c.authorId))fail('Unknown canonical author: '+c.authorId);
    for(const [field,list] of [['genre','genres'],['role','roles'],['depth','depths'],['era','eras']])if(!terms(list).has(r[field]))fail('Unknown vocabulary '+field);
  }
  if(r.kind==='edition'&&records.get(r.workId)?.kind!=='work')fail('Missing work reference');
  if(r.kind==='asset'){
    if(records.get(r.editionId)?.kind!=='edition')fail('Missing edition reference');
    if(!sources.has(r.sourceId))fail('Missing source reference');
    if(!terms('formats').has(r.format))fail('Unknown format');
    if(!r.relativePath?.startsWith(`library/${r.sourceId}/${r.id}/`))fail('Raw asset path is outside canonical asset folder');
    if(!existsSync(path.join(site,'../sources',r.relativePath)))fail('Original is not held');
    if(r.acquisitionStatus==='downloaded'&&(!r.retrievedAt||r.rights.actions.download!=='allowed'))fail('Missing recorded acquisition support');
    if(r.rights.category==='public-domain'&&!r.rights.jurisdiction)fail('Missing public-domain jurisdiction');
    if(['open-license','restricted-license'].includes(r.rights.category)&&(!r.rights.licenseId||!r.rights.licenseUrl))fail('Missing recorded license identity/policy URL');
    if(r.fullTextIndexed&&r.rights.actions.indexFullText!=='allowed')fail('Missing private index authorization');
    if(sources.get(r.sourceId)?.automation==='prohibited')fail('Source automation prohibition needs separate documented exception');
  }
}
const result={checked,issues:issues.length,items:issues,scope:'Only newly created records; schema, identity references, vocabulary, canonical paths and recorded acquisition metadata. No original rehash, corpus build or embedding.'};
writeFileSync(path.join(out,'validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checked,issues:issues.length,samples:issues.slice(0,3)}));
if(issues.length)process.exitCode=1;
