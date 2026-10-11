import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PARABLES, PARABLE_ROOMS, passageLabel } from '../src/data/parables';
const corpus = Object.fromEntries(['MAT','MRK','LUK'].map(book=>[book,JSON.parse(readFileSync(`data/plain/kjv/${book}.json`,'utf8')) as Record<string,string>]));
assert.equal(new Set(PARABLES.map(p=>p.id)).size,PARABLES.length);
for(const room of PARABLE_ROOMS) assert.equal(PARABLES.filter(p=>p.room===room.id).length,4);
const report:string[]=[];
let verses=0;
for(const story of PARABLES){
  assert.equal(story.beats.length,3);
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
