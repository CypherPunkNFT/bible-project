import raw from '@/data/two-truths/two-truths.json';
import { compatible, combinations, deal, eligiblePeople } from './deal';
import type { Deck } from './types';
const deck=raw as unknown as Deck;
function seeded(seed:number) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
it('deals 3,000 valid rounds with each lie position between 30 and 37 percent',()=>{
  const rng=seeded(730), counts=[0,0,0];
  for(let i=0;i<3000;i++) {
    const r=deal(deck,{people:[],statements:[]},[],rng)!;
    const rows=r.ids.map(id=>deck.statements.find(s=>s.id===id)!);
    expect(rows.filter(s=>s.kind==='truth')).toHaveLength(2);
    expect(rows.filter(s=>s.kind==='lie')).toHaveLength(1);
    expect(new Set(rows.map(s=>s.who)).size).toBe(1);
    for(let a=0;a<3;a++) for(let b=a+1;b<3;b++) expect(compatible(rows[a],rows[b])).toBe(true);
    counts[rows.findIndex(s=>s.kind==='lie')]++;
  }
  for(const n of counts) expect(n/3000).toBeGreaterThanOrEqual(.30);
  for(const n of counts) expect(n/3000).toBeLessThanOrEqual(.37);
});
it('checks clashes both ways, including truth pairs, and skips people with no valid triples',()=>{
  const who=deck.people[0].id,rows=structuredClone(deck.statements.filter(s=>s.who===who));
  const [a,b,c]=rows.filter(s=>s.kind==='truth');a.clash=[b.id];
  expect(compatible(b,a)).toBe(false);expect(compatible(a,b)).toBe(false);
  expect(combinations(rows).every(triple=>!(triple.includes(a)&&triple.includes(b)))).toBe(true);
  for(const lie of rows.filter(s=>s.kind==='lie')) lie.clash=[a.id,b.id,c.id];
  const tiny={...deck,people:[deck.people[0]],statements:rows};
  expect(combinations(rows)).toHaveLength(0);expect(eligiblePeople(tiny)).toHaveLength(0);
  expect(deal(tiny,{people:[],statements:[]})).toBeNull();
});
it('honours Lydia home-city and meeting clues, with every valid triple precomputed at build time',()=>{
  for(const p of deck.people) {
    const options=combinations(deck.statements.filter(s=>s.who===p.id));
    expect(options.map(r=>r.map(s=>s.id))).toEqual(deck.triples?.[p.id]);
  }
  const lydia=deck.people.find(p=>p.id.startsWith('lydia'))!;
  const options=combinations(deck.statements.filter(s=>s.who===lydia.id));
  expect(options).toHaveLength(2);
  for(const r of options) {
    const ids=r.map(s=>s.id);
    expect(ids.includes(lydia.id+':t2')&&ids.includes(lydia.id+':l2')).toBe(false);
    expect(ids.includes(lydia.id+':t3')&&ids.includes(lydia.id+':l1')).toBe(false);
  }
});
it('exhausts distinct people before stopping',()=>{
  const used:string[]=[],rng=seeded(18);
  for(let i=0;i<deck.people.length;i++) {const r=deal(deck,{people:[],statements:[]},used,rng)!;expect(used).not.toContain(r.who);used.push(r.who);}
  expect(deal(deck,{people:[],statements:[]},used,rng)).toBeNull();
});
it('prefers recent-person avoidance before unseen statements and safely relaxes both',()=>{
  const tiny={...deck,people:deck.people.slice(0,2)};
  const r=deal(tiny,{people:[tiny.people[0].id],statements:deck.statements.map(s=>s.id)},[],seeded(1))!;
  expect(r.who).toBe(tiny.people[1].id);
  expect(deal(tiny,{people:tiny.people.map(p=>p.id),statements:deck.statements.map(s=>s.id)},[],seeded(1))).not.toBeNull();
});
it('honours Zacchaeus’s clash for every seeded deal',()=>{
  const tiny={...deck,people:deck.people.filter(p=>p.id.startsWith('zacchaeus'))};
  const rng=seeded(432);
  for(let i=0;i<300;i++) {const r=deal(tiny,{people:[],statements:[]},[],rng)!;if(r.ids.some(id=>id.endsWith(':l2'))) expect(r.ids).not.toContain(`${r.who}:t3`);}
});
