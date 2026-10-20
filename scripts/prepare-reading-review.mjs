// Private editorial presentation. Reads saved evidence; never writes the curation ledger.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const initiative='initiatives/library-knowledge/distillation/';
const inputs={};
async function json(name){const bytes=await fs.readFile(path.join(root,name));inputs[name]=crypto.createHash('sha256').update(bytes).digest('hex');return JSON.parse(bytes);}
const content=await json('analysis-desk/reading-content.json');
const catalogue=await json('.local/data-analysis/website-candidates.json');
const audit=await json(initiative+'candidate-audit-2026-10-19/audit.json');
const follow=await json(initiative+'candidate-audit-2026-10-19/reader-followup.json');
const source=await json(initiative+'source-followup-2026-10-19/reader-verification.json');
const proof=await json(initiative+'ephesians-readiness-2026-10-19/source-reader-check.json');
const context=await json(initiative+'context-review-2026-10-19/native-context.json');
const supper=await json(initiative+'source-followup-2026-10-19/supper-apparatus-and-http.json');
const bible=await json(initiative+'reading-review-2026-10-20/bible-kjv.json');
assert.deepEqual(content.proposals.map(p=>p.id).sort(),catalogue.candidates.map(p=>p.id).sort());
assert.equal(content.proposals.length,21);assert.equal(content.chapters.length,6);
const safe=link=>{assert.match(link,/^\/(?:teachers\/works\/held-[a-f0-9]+(?:\?page=\d+)?|read\/kjv\/EPH\/\d+(?:\?v=\d+)?)$/);return link;};
for(const p of content.proposals){
 assert.ok(p.opening&&p.outline.length>=4&&p.relationshipToEphesians&&p.limit);
 for(const id of p.related)assert.ok(content.proposals.some(x=>x.id===id));
 const saved=catalogue.candidates.find(x=>x.id===p.id);
 p.savedTitle=saved.title;
 p.sources=saved.sources.map((s,i)=>{
  const a=audit.records.find(x=>x.candidate===p.id&&x.source_id===s.id);
  const newer=[...follow.records,...source.records].find(x=>x.candidate===p.id&&x.source_id===s.id);
  const contextRecord=context.records.find(x=>x.source_id===s.id);
  let links=contextRecord?[...new Set(contextRecord.units.flatMap(u=>u.reader_links??[]))]:(newer?.links??a?.reader?.page_links??[]);
  if(p.id==='supper'&&s.id==='4473820'){assert.ok(supper.reading_http.some(r=>r.page===33&&r.equals_retained));links=[...links,s.reader+'?page=33'];}
  links.forEach(safe);
  return {...s,note:p.sourceNotes[i]??'Read this selected passage in its own setting before using it in the proposed page.',links,access:links.length?'Located passage':'Saved evidence; full reader passage not located',originalSha256:a?.original?.sha256??null};
 });
}
let verseCount=0;
for(const c of content.chapters){
 const verses=bible[String(c.number)].v;
 c.verses=verses.map(v=>({number:Number(v.n),text:v.r.map(r=>typeof r==='string'?r:Array.isArray(r)?r[0]:'').join('').replace(/\s+/g,' ').trim()}));
 let next=1;for(const s of c.sections){assert.equal(s.start,next);assert.ok(s.end>=s.start);next=s.end+1;s.link='/read/kjv/EPH/'+c.number+'?v='+s.start;}assert.equal(next-1,verses.length);verseCount+=verses.length;
 for(const r of c.readings){
  const connection=proof.connections.find(x=>x.chapter===c.number&&x.role===r.role&&x.verse_ids?.includes('verse:kjv:EPH:'+c.number+':'+r.verse)&&x.current_reader_links?.length);
  assert.ok(connection,'Missing located source '+c.number+':'+r.verse+' '+r.role);
  r.connectionId=connection.id;r.heading=connection.heading;r.links=connection.current_reader_links.map(safe);r.gaps=connection.gap_count;r.author=r.role==='calvin-commentary'?'John Calvin · translated by William Pringle':'James Fergusson';
 }
}
assert.equal(verseCount,155);
content.sourceIndex=proof.connections.map(c=>({id:c.id,chapter:c.chapter,role:c.role,heading:c.heading,relationship:c.relationship,links:c.current_reader_links??[],gaps:c.gap_count,notes:c.embedded_notes_overlapping_sample?.length??0}));
content.scope='Local editorial drafts. Saved proposals and owner decisions are unchanged.';
content.dependencies={inputs,sourceGeneration:'Historical source packages and 19 October reader receipts; no current embedding validation.',bibleSource:'Existing local KJV data/text/kjv/EPH/0.json and 1.json, captured 20 October 2026',curationWrites:0,modelCalls:0};
await fs.mkdir(path.join(root,'.local/data-analysis'),{recursive:true});
await fs.writeFile(path.join(root,'.local/data-analysis/reading-review.json'),JSON.stringify(content,null,2)+'\n');
console.log(JSON.stringify({proposals:content.proposals.length,chapters:content.chapters.length,verses:verseCount,commentaryReadings:12,sourceIndex:content.sourceIndex.length,curationWrites:0}));
