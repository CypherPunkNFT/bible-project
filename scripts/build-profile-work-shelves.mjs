// Lazy per-person catalogue shelves for the profile drawer. Metadata only; no text or rights changes.
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),library=path.join(root,'content/library');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const people=read('src/data/teachers/people.json').people;
const ids=new Set(people.map(p=>p.id)),works=[];
const overlays=new Map();
for(const file of fs.readdirSync(path.join(library,'passage-overlays')).filter(f=>f.endsWith('.json')))for(const [id,entry] of Object.entries(read(path.join(library,'passage-overlays',file)).works))overlays.set(id,entry);
for(const file of fs.readdirSync(path.join(library,'catalog/works')).filter(f=>f.endsWith('.json'))){
 const w=read(path.join(library,'catalog/works',file));
 if(w.creators?.some(c=>ids.has(c.authorId))&&!overlays.get(w.id)?.duplicateOf)works.push(w);
}
const wanted=new Set(works.map(w=>w.id)),records=new Map(),readableRecords=[];
const nameKey=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'');
const names=new Map();
for(const p of people)names.set(nameKey(p.name),p.id);
for(const file of [path.join(library,'authors.json'),...fs.readdirSync(path.join(library,'registry-extensions')).filter(f=>f.endsWith('.json')).map(f=>path.join(library,'registry-extensions',f))]){
 for(const author of read(file).authors??[]){
  if(!ids.has(author.id))continue;
  for(const name of [author.name,...(author.aliases??[])]){
   if(typeof name!=='string')continue;
   const key=nameKey(name);if(names.has(key)&&names.get(key)!==author.id)names.set(key,null);else names.set(key,author.id);
  }
 }
}
// Existing source-hash bindings can connect a public reading copy whose workId was left null.
// Ambiguous hashes remain unbound; the reading copy can still appear as an acquired edition.
const hashWorks=new Map(),addHash=(hash,work)=>{
 if(!hash||!wanted.has(work))return;
 if(hashWorks.has(hash)&&hashWorks.get(hash)!==work)hashWorks.set(hash,null);else hashWorks.set(hash,work);
};
const editions=new Map();
for(const f of fs.readdirSync(path.join(library,'catalog/editions')).filter(f=>f.endsWith('.json'))){const e=read(path.join(library,'catalog/editions',f));editions.set(e.id,e.workId);}
for(const f of fs.readdirSync(path.join(library,'catalog/assets')).filter(f=>f.endsWith('.json'))){const a=read(path.join(library,'catalog/assets',f));addHash(a.sha256,editions.get(a.editionId));}
const snapshot=path.join(root,'../KnowledgeBase/teacher-scripture-analysis/cpu-20261014/inventory.json');
if(fs.existsSync(snapshot))for(const r of read(snapshot).files){const work=r.metadata?.work; if(work?.creators?.some(c=>r.teacherIds.includes(c.authorId))&&!r.mixedAttribution)addHash(r.sha256,work.id);}
for(const file of fs.readdirSync('public/content/teacher-library/records').filter(f=>f.endsWith('.json'))){
 for(const r of Object.values(read(path.join('public/content/teacher-library/records',file)))){
  const authors=new Set((r.authors??[]).map(a=>names.get(nameKey(a))).filter(Boolean));
  if(r.availability==='on-site-text'&&r.pages>0&&authors.size)readableRecords.push({...r,profileIds:authors});
  const workId=r.workId??hashWorks.get(r.sha256);
  if(!wanted.has(workId))continue;
  const catalog=works.find(w=>w.id===workId);
  if(r.availability==='on-site-text'&&!catalog.creators.some(c=>authors.has(c.authorId)))continue;
  if(!records.has(workId)||r.availability==='on-site-text')records.set(workId,{id:r.id,available:r.availability==='on-site-text'&&r.pages>0});
 }
}
const out='public/content/teacher-profiles';fs.mkdirSync(out,{recursive:true});
let total=0;
for(const p of people){
 const rows=works.filter(w=>w.creators.some(c=>c.authorId===p.id)).map(w=>{
  const entry=overlays.get(w.id),main=(w.passages??[]).some(p=>p.role==='main-text'&&p.start)?w.passages:entry?.passages??w.passages??[];
  const references=[...new Set(main.filter(p=>p.role==='main-text'&&p.start).map(p=>p.reference))];
  return {id:records.get(w.id)?.id??w.id,workId:w.id,title:w.title,genre:entry?.genre??w.genre,reference:references.join('; '),readable:records.get(w.id)?.available??false,sourceUrl:w.evidence?.find(e=>/^https?:\/\//.test(e.url))?.url??null};
 });
 const included=new Set(rows.map(r=>r.id));
 for(const r of readableRecords.filter(r=>r.profileIds.has(p.id))){
  if(included.has(r.id))continue;
  rows.push({id:r.id,workId:null,title:r.title,genre:r.genre,reference:'',readable:true,sourceUrl:r.sourceUrl??null,edition:true});
  included.add(r.id);
 }
 rows.sort((a,b)=>Number(b.readable)-Number(a.readable)||a.title.localeCompare(b.title));
 total+=rows.length;fs.writeFileSync(path.join(out,p.id+'.json'),JSON.stringify(rows)+'\n');
}
console.log(`Built ${people.length} profile shelves with ${total.toLocaleString()} catalogue work memberships.`);
