// Bounded extraction: four already-saved short lists, shortest first. No corpus reads.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const started=performance.now(),site=path.resolve(import.meta.dirname,'..');
const data=path.resolve(site,'../Data/TheologicalReferenceLibrary'),out=path.join(site,'public/data_acquisition');
const catalogue=JSON.parse(fs.readFileSync(path.join(out,'catalogue.json')));
const registry=JSON.parse(fs.readFileSync(path.join(site,'content/teachers/scholars.json'))).scholars;
const normalize=s=>s.normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase();
const aliases=new Map();
for(const p of registry)for(const name of new Set([p.name,p.short].filter(Boolean))){const k=normalize(name);if(!aliases.has(k))aliases.set(k,[]);if(!aliases.get(k).some(x=>x.id===p.id))aliases.get(k).push(p);}
const specs=[
 {group:'Great-Theologians',file:'Publisher-References/the-great-theologians.txt',label:'Great Theologians',expected:11,scope:'Eleven chapter subjects; the book body is not held.'},
 {group:'Fifty-Key-Christian-Thinkers',file:'Publisher-References/fifty-key-christian-thinkers.txt',label:'Fifty Key Thinkers',expected:47,scope:'47 publisher contents entries, including a collective and a paired entry.'},
 {group:'Carolina-University',file:'Scholar-Lists/carolina-philosophers-theologians.json',label:'Carolina list',expected:100,scope:'Mixed philosophy/theology list; not all subjects are Christian scholars.'},
 {group:'Brad-East',file:'Scholar-Lists/brad-east-theologian-list.txt',label:'Brad East',expected:178,scope:'153 main entries and 25 suggested additions; not ranked.'}
];
const exclusions=new Map([
 ['The Cloud of Unknowing','Book title; anonymous attribution. Not an individual name.'],
 ['Theologia Germanica','Book title; anonymous attribution. Not an individual name.'],
 ['Cappadocian Fathers','Collective entry; individuals have not been separated.'],
 ['John & Donald Baillie','Paired entry; retained together for review, not counted as one person.']
]);
const sources=[],occurrences=[],excluded=[];
for(const spec of specs){
 const record=catalogue.records.find(r=>r.group===spec.group);if(!record?.textUrl)throw Error('Missing saved text: '+spec.group);
 const raw=fs.readFileSync(path.join(data,'Derived',spec.file));const source={id:record.id,title:record.collection,label:spec.label,sourceUrl:record.sourceUrl,textUrl:record.textUrl,entries:spec.expected,scope:spec.scope,derivedFile:'Derived/'+spec.file,sha256:createHash('sha256').update(raw).digest('hex')};sources.push(source);
 let list=[];
 if(spec.group==='Carolina-University')list=JSON.parse(raw).entries.map(e=>({name:e.name,dates:e.dates,locator:`No. ${e.number} · PDF page ${e.pdfPage}`}));
 else if(spec.group==='Great-Theologians')list=[...raw.toString('utf8').matchAll(/^Chapter (\d+): (.+)$/gm)].map(m=>({name:m[2],dates:null,locator:`Chapter ${m[1]}`}));
 else {let section='Contents';for(const line of raw.toString('utf8').split(/\r?\n/)){if(/^(Patristic|Medieval|Reformation|Modern) Period$/.test(line)||line.startsWith('Suggested additions'))section=line.startsWith('Suggested')?'Suggested additions':line;const m=/^(\d+)\. (.+?)(?: \(([^)]+)\))?$/.exec(line);if(m)list.push({name:m[2],dates:m[3]||null,locator:`${section} · No. ${m[1]}`});}}
 if(list.length!==spec.expected)throw Error(`${spec.group}: expected ${spec.expected}, found ${list.length}`);
 for(const [i,item] of list.entries()){const occurrence={id:`${record.id}:${i+1}`,sourceId:record.id,...item};if(exclusions.has(item.name))excluded.push({...occurrence,reason:exclusions.get(item.name)});else occurrences.push(occurrence);}
}
function parseDates(value){
 if(!value)return {born:null,died:null};
 const years=value.match(/\d+/g)?.map(Number)||[];const bc=/\bBC\b/i.test(value),sign=bc?-1:1;
 if(/^d\./.test(value))return {born:null,died:(years[0]??null)*sign};
 return {born:years[0]==null?null:years[0]*sign,died:years[1]==null?null:years[1]*sign};
}
const eras=[{id:'ancient',label:'Before 500'},{id:'middle',label:'500–1499'},{id:'early-modern',label:'1500–1799'},{id:'modern',label:'1800 onwards'},{id:'unknown',label:'Date not established'}];
const eraFor=y=>y<500?'ancient':y<1500?'middle':y<1800?'early-modern':'modern';
const grouped=new Map();
for(const occurrence of occurrences){
 const matches=aliases.get(normalize(occurrence.name))||[],profile=matches.length===1?matches[0]:null;
 const key=profile?'profile:'+profile.id:'name:'+normalize(occurrence.name);
 if(!grouped.has(key))grouped.set(key,{id:'short-list-'+createHash('sha256').update(key).digest('hex').slice(0,16),name:profile?.name||occurrence.name,existingAuthorId:profile?.id||null,identityBasis:profile?'Exact recorded name/short-name match to existing profile; not independently verified.':'Exact name spelling grouped for review; not a verified identity merge.',profile:profile?{id:profile.id,born:profile.born??null,died:profile.died??null,circa:profile.circa||false,evidence:'content/teachers/scholars.json'}:null,occurrences:[]});
 grouped.get(key).occurrences.push(occurrence);
}
const rows=[...grouped.values()].map(row=>{
 const names=[...new Set(row.occurrences.map(o=>o.name))];const dates=row.occurrences.filter(o=>o.dates).map(o=>({text:o.dates,sourceId:o.sourceId,locator:o.locator,...parseDates(o.dates)}));
 if(row.profile&&Number.isFinite(row.profile.born))dates.push({text:`${row.profile.circa?'c. ':''}${row.profile.born}–${row.profile.died??''}`,sourceId:'site-profile',locator:row.profile.evidence+' · '+row.profile.id,born:row.profile.born,died:row.profile.died});
 const births=[...new Set(dates.map(d=>d.born).filter(Number.isFinite))],deaths=[...new Set(dates.map(d=>d.died).filter(Number.isFinite))],bands=new Set(births.map(eraFor));
 const notes=[];if(births.length>1||deaths.length>1)notes.push('Recorded dates differ; check sources.');
 if(row.occurrences.some(o=>o.name==='Niebuhr'))notes.push('Surname only; which Niebuhr is unresolved.');
 if(row.occurrences.some(o=>o.name==='Aristole'))notes.push('Spelling retained from the handout.');
 return {...row,names,dates,eraId:bands.size===1?[...bands][0]:'unknown',sortYear:births.length?Math.min(...births):null,notes};
}).sort((a,b)=>eras.findIndex(e=>e.id===a.eraId)-eras.findIndex(e=>e.id===b.eraId)||(a.sortYear??Infinity)-(b.sortYear??Infinity)||a.name.localeCompare(b.name));
const result={schemaVersion:1,generatedAt:new Date().toISOString(),scope:'Four short saved reference lists, processed in ascending entry count. This is an extraction review, not a ranking or a census of held authors.',grouping:'Exact spellings are grouped, plus exact existing profile name/short-name aliases. No fuzzy or surname-based identity merges. Other variants remain separate.',datePolicy:'Grouped by recorded birth year, not by intellectual movement. Source dates remain unverified. Conflicting birth-year bands and missing births go to Date not established. Existing profile dates, where used, are explicitly inherited metadata.',sources,eras,counts:{sourceEntries:sources.reduce((n,s)=>n+s.entries,0),individualNameOccurrences:occurrences.length,nameRows:rows.length,excludedEntries:excluded.length,undatedRows:rows.filter(r=>r.eraId==='unknown').length,dateDisagreementRows:rows.filter(r=>r.notes.some(n=>n.startsWith('Recorded'))).length},rows,excluded,notExtracted:[{sourceId:'716e5a479448aa5d',title:'131 Christians Everyone Should Know',reason:'The saved bibliographic page does not supply the 131-name roster.'}]};
const json=JSON.stringify(result,null,2)+'\n';
fs.writeFileSync(path.join(out,'authors-by-era.json'),json);
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const csv=[['row_id','existing_author_id','name','era_birth_year_band','name_as_listed','source_dates','source','location','source_url','review_notes'],...rows.flatMap(r=>r.occurrences.map(o=>{const s=sources.find(s=>s.id===o.sourceId);return [r.id,r.existingAuthorId,r.name,eras.find(e=>e.id===r.eraId).label,o.name,o.dates,s.title,o.locator,s.sourceUrl,r.notes.join(' ')];}))].map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n';
fs.writeFileSync(path.join(out,'authors-by-era.csv'),'\ufeff'+csv);
const canonical=path.join(data,'Derived/Author-Review');fs.mkdirSync(canonical,{recursive:true});fs.writeFileSync(path.join(canonical,'short-lists-by-era.json'),json);fs.writeFileSync(path.join(canonical,'short-lists-by-era.csv'),'\ufeff'+csv);
console.log(JSON.stringify({...result.counts,eras:eras.map(e=>({...e,rows:rows.filter(r=>r.eraId===e.id).length})),runtimeMs:Math.round(performance.now()-started)},null,2));
