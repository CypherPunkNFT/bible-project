import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {focusLayout,focusName} from './focus-timeline';
import type {PopulationSnapshot} from '../population';
const snapshot=JSON.parse(readFileSync('public/content/scholar-population/index.json','utf8')) as PopulationSnapshot;
const people=snapshot.entries.filter(p=>['documented-profile','source-supported'].includes(p.facts.dates.status)&&Number.isFinite(p.facts.dates.born)).map(p=>({id:p.id,name:p.name,born:p.facts.dates.born!}));
describe('approved full-population timeline',()=>{
 it.each([390,880,1440])('conserves identities and readable nonoverlapping circles at %ipx',width=>{
  const layout=focusLayout(people,width),all=layout.groups.flatMap(g=>g.people.map(p=>p.id));
  expect(new Set(all)).toEqual(new Set(people.map(p=>p.id)));expect(all.length).toBe(snapshot.summary.datedBirths);
  expect(layout.groups.reduce((sum,g)=>sum+g.hidden,0)+layout.positions.size).toBe(all.length);
  const marks=[...layout.positions.values()];for(let i=0;i<marks.length;i++){
   expect(marks[i].y-layout.radius).toBeGreaterThanOrEqual(64);
   expect(marks[i].y+layout.radius).toBeLessThanOrEqual(364);
   for(const other of marks.slice(i+1))expect(Math.hypot(marks[i].x-other.x,marks[i].y-other.y)).toBeGreaterThanOrEqual(layout.radius*2+3.98);
  }
  expect(layout.today.x-layout.year2000).toBeGreaterThan(0);expect(layout.today.x-layout.year2000).toBeLessThan(60);
 });
 it('retains compact dates separately without altering source names',()=>{const raw='David Jones [1736–1820]';expect(focusName(raw)).toBe('David Jones');expect(raw).toBe('David Jones [1736–1820]');expect(focusName('Anonymous [editor]')).toBe('Anonymous [editor]');});
});
