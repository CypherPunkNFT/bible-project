import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PARABLES, PARABLE_FORMS, PARABLE_ROOMS, passageLabel, passageUrl } from '../src/data/parables';
import { PARABLE_DEEP_READINGS } from '../src/data/parables-deep-reading';
assert.deepEqual(Object.keys(PARABLE_DEEP_READINGS).sort(), ['talents','minas','wedding-feast','shrewd-manager','midnight-friend','lazarus','sheep-goats'].sort());
for(const [id,notes] of Object.entries(PARABLE_DEEP_READINGS)) {
  assert.ok(PARABLES.some(story=>story.id===id), `Orphaned reading notes: ${id}`);
  assert.ok(notes?.length);
  for(const note of notes!) {
    assert.ok(note.title && note.text && note.sources.length, `Incomplete reading note: ${id}`);
    for(const source of note.sources) assert.equal(new URL(source.href).protocol, 'https:');
  }
}
const corpus = Object.fromEntries(['MAT','MRK','LUK'].map(book=>[book,JSON.parse(readFileSync(`data/plain/kjv/${book}.json`,'utf8')) as Record<string,string>]));
assert.equal(new Set(PARABLES.map(p=>p.id)).size,PARABLES.length);
for(const room of PARABLE_ROOMS) assert.ok(PARABLES.some(p=>p.room===room.id),`Empty category: ${room.id}`);
const trenchChapters=['sower','weeds','mustard','leaven','treasure','pearl','net','debtor','workers','obedient-sons','tenants','wedding-feast','bridesmaids','talents','growing-seed','two-debtors','samaritan','midnight-friend','rich-fool','barren-fig','great-supper','sheep','coin','sons','shrewd-manager','lazarus','servants-duty','persistent-widow','prayers','minas'];
for(const id of trenchChapters) assert.ok(PARABLES.some(p=>p.id===id),`Missing Trench chapter: ${id}`);
const report:string[]=[];
assert.ok(PARABLES.find(story=>story.id==='lamp')?.passages.some(p=>p.book==='LUK' && p.chapter===11 && p.start===33 && p.end===33));
assert.ok(PARABLES.find(story=>story.id==='tree-fruit')?.passages.some(p=>p.book==='MAT' && p.chapter===12 && p.start===33 && p.end===37));
let verses=0;
for(const story of PARABLES){
  assert.equal(new Set(story.passages.map(passageUrl)).size,story.passages.length,`Duplicate account: ${story.id}`);
  assert.ok(story.form in PARABLE_FORMS,`Missing or invalid form: ${story.id}`);
  assert.equal(story.beats.length,3);
  assert.ok(PARABLE_ROOMS.some(r=>r.id===story.room),`Invalid category: ${story.id}`);
  for(const passage of story.passages){
    assert.ok(passage.start<=passage.end);
    for(let v=passage.start;v<=passage.end;v++){assert.ok(corpus[passage.book][`${passage.chapter}:${v}`],`${story.id}: missing ${v}`);verses++;}
    report.push(`${story.title} | ${passageLabel(passage)} | ${corpus[passage.book][`${passage.chapter}:${passage.start}`]} ... ${corpus[passage.book][`${passage.chapter}:${passage.end}`]}`);
  }
}
for(const book of ['MAT','MRK','LUK']) report.push(`${book} SHA-256: ${createHash('sha256').update(readFileSync(`data/plain/kjv/${book}.json`)).digest('hex')}`);
mkdirSync('.output/parables',{recursive:true});
writeFileSync('.output/parables/source-check.txt',report.join('\n\n'));
console.log(`${PARABLES.length} studies, ${PARABLES.reduce((n,p)=>n+p.passages.length,0)} passage ranges, ${verses} verse references verified against local KJV. Report: .output/parables/source-check.txt`);
