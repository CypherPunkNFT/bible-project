import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import data from '@/data/two-truths/two-truths.json';
import source from '@/data/two-truths/statements.source.json';
import review from '@/data/two-truths/semantic-review.json';
import type { Deck } from './types';
// The builder and the independent evidence checks below validate JSON tuple ranges.
const deck=data as unknown as Deck;
const root=process.cwd();
const books=[...fs.readFileSync(path.join(root,'scripts/bible/books.py'),'utf8').matchAll(/ {4}\("([^"]+)", "([^"]+)",/g)].map(m=>m[1]);
it('ships all 30 starter people with three truths and two corrected lies each',()=>{
  expect(deck.people).toHaveLength(30);expect(deck.statements).toHaveLength(150);
  expect(new Set(deck.statements.map(s=>s.id)).size).toBe(150);
  for(const p of deck.people) {const rows=deck.statements.filter(s=>s.who===p.id);expect(rows.filter(s=>s.kind==='truth')).toHaveLength(3);expect(rows.filter(s=>s.kind==='lie')).toHaveLength(2);}
});
it('independently resolves every evidence verse and requires semantic approval rather than swapped-word absence',()=>{
  const clean=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
  for(const s of deck.statements) {
    const passages=s.refs.map(([from,to])=>{
      const code=books[Math.floor(from/1e6)-1],chapter=Math.floor(from/1000)%1000;
      const book=JSON.parse(fs.readFileSync(path.join(root,`data/plain/bsb/${code}.json`),'utf8'));
      return Array.from({length:to-from+1},(_,i)=>{const words=book[`${chapter}:${from%1000+i}`];expect(words).toBeTypeOf('string');return words;}).join(' ');
    }).join(' ');
    expect(clean(passages)).toContain(clean(s.check));
    expect(s.reviewed).toBe(true);
    expect(review.statements[s.id as keyof typeof review.statements]?.note).toBeTruthy();
    if(s.kind==='lie') {
      expect(s.truth).toBeTruthy();expect(s.swap).toBeTruthy();expect(s.text).toContain(s.swapIn!);
    }
  }
});
it('drops veto-depleted people, excludes unreviewed hand rows and refuses stale statement or triple reviews',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'two-truths-'));
  const run=(...args:string[])=>execFileSync(process.execPath,['--experimental-strip-types','scripts/build-two-truths.ts','--data-out',path.join(temp,'data.json'),'--review-sheet',path.join(temp,'review.md'),...args],{cwd:root,stdio:'pipe'});
  try {
    const veto=path.join(temp,'veto.json');
    fs.writeFileSync(veto,JSON.stringify({[source.statements[0].id]:'Review fixture veto'}));
    run('--veto',veto);
    const reduced=JSON.parse(fs.readFileSync(path.join(temp,'data.json'),'utf8')) as Deck;
    expect(reduced.people).toHaveLength(29);expect(reduced.people.some(p=>p.id===source.people[0])).toBe(false);
    expect(fs.readFileSync(path.join(temp,'review.md'),'utf8')).toContain('not playable');
    const sourcePath=path.join(temp,'source.json'), changed=structuredClone(source);
    changed.statements[0].reviewed=false;fs.writeFileSync(sourcePath,JSON.stringify(changed));run('--source',sourcePath);
    expect((JSON.parse(fs.readFileSync(path.join(temp,'data.json'),'utf8')) as Deck).people).toHaveLength(29);
    changed.statements[0].reviewed=true;changed.statements[0].text=changed.statements[0].text.replace('600','601');
    fs.writeFileSync(sourcePath,JSON.stringify(changed));expect(()=>run('--source',sourcePath)).toThrow();
    const reviewPath=path.join(temp,'approvals.json');fs.writeFileSync(reviewPath,JSON.stringify({...review,triples:{}}));
    expect(()=>run('--review',reviewPath)).toThrow();
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});
it('is reproducible from the stored sources',()=>{
  expect(source.statements.map(s=>s.id)).toEqual(deck.statements.map(s=>s.id));
  expect(()=>execFileSync(process.execPath,['--experimental-strip-types','scripts/build-two-truths.ts','--check'],{cwd:root,stdio:'pipe'})).not.toThrow();
});
