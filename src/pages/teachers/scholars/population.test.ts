import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ScholarsData } from '@/data/teachers/pages-types';
import { dateLabel, eligibleBirth, hydratePopulation, type PopulationSnapshot } from './population';
import { ALL_LIBRARY, matchesLibrary } from './catalogue/library';
import { NO_FILTERS } from './context';
import { layoutArc } from '../preachers/landing/arc';
const snapshot:PopulationSnapshot=JSON.parse(readFileSync('public/content/scholar-population/index.json','utf8'));
const data:ScholarsData=JSON.parse(readFileSync('src/data/teachers/scholars.json','utf8'));
const people=hydratePopulation(snapshot,data);
describe('shared reconciled population selectors',()=>{
  it('retains every entry and every Scholars profile without manufacturing biographies',()=>{
    expect(people).toHaveLength(snapshot.summary.contributors);
    expect(people.filter(p=>p.scholar)).toHaveLength(data.scholars.length);
    expect(people.every(p=>p.facts&&p.population)).toBe(true);
    expect(people.filter(p=>p.population!.profileAvailability.teacherId)).toHaveLength(snapshot.summary.documentedTeacherProfiles);
  });
  it('plots all supported births, including approximate dates, and never substitutes floruit',()=>{
    const eligible=people.filter(p=>eligibleBirth(p)!==null);
    expect(eligible).toHaveLength(snapshot.summary.datedBirths);
    expect(eligible.filter(p=>p.facts!.dates.approximate)).toHaveLength(snapshot.summary.approximateBirths);
    for(const p of people.filter(p=>p.facts!.dates.floruit!==undefined&&p.facts!.dates.born===undefined)) {
      expect(eligibleBirth(p)).toBeNull();expect(dateLabel(p)).toContain('fl.');
    }
    expect(people.filter(p=>p.facts!.dates.status==='conflicting').every(p=>eligibleBirth(p)===null)).toBe(true);
    expect(eligibleBirth(people.find(p=>p.contributorIds.includes('author-john-calvin'))!)).toBe(1509);
  });
  it('uses the same evidence filters for every unknown/review state',()=>{
    for(const [status,total] of Object.entries(snapshot.summary.dateStatus))expect(people.filter(p=>matchesLibrary(p,NO_FILTERS,{...ALL_LIBRARY,dateStatus:status}))).toHaveLength(total);
    expect(people.filter(p=>matchesLibrary(p,NO_FILTERS,{...ALL_LIBRARY,dateStatus:'birth-unknown'}))).toHaveLength(people.length-snapshot.summary.datedBirths);
    for(const [identity,total] of Object.entries(snapshot.summary.kinds))expect(people.filter(p=>matchesLibrary(p,NO_FILTERS,{...ALL_LIBRARY,identity}))).toHaveLength(total);
    expect(people.filter(p=>matchesLibrary(p,NO_FILTERS,{...ALL_LIBRARY,identity:'review-required'}))).toHaveLength(snapshot.summary.identityReviewEntries);
  });
  it('searches stable IDs and all associated titles, beyond profile bibliographies and examples',()=>{
    for(const id of ['author-james-r-white','josephus',people.find(p=>p.id.startsWith('intake-credit-'))!.id]) {
      const entry=people.find(p=>p.id===id||p.contributorIds.includes(id))!;
      expect(matchesLibrary(entry,{...NO_FILTERS,q:id},ALL_LIBRARY)).toBe(true);
    }
    const entry=people.find(p=>!p.scholar&&p.population!.searchText.length>1000)!;
    const phrase=entry.population!.searchText.slice(-60).trim();
    expect(matchesLibrary(entry,{...NO_FILTERS,q:phrase},ALL_LIBRARY)).toBe(true);
  });
  it('resolves every exact feature credit through stable population IDs',()=>{
    expect(Object.keys(snapshot.sourceCredits)).toHaveLength(snapshot.summary.featureCreditLabels);
    for(const ids of Object.values(snapshot.sourceCredits))expect(ids.length>0&&ids.every(id=>people.some(p=>p.id===id))).toBe(true);
  });
  it('keeps a fixed year domain when a timeline batch starts in a later century',()=>{
    const first=layoutArc([{id:'a',born:1900}],900,0);
    const second=layoutArc([{id:'b',born:1900},{id:'c',born:2000}],900,0);
    expect(first.positions[0].x).toBe(second.positions[0].x);
    expect(first.positions[0].x).toBeGreaterThan(800);
    const original=layoutArc([{id:'a',born:1500},{id:'b',born:1900}],900);
    expect(original.centuries[0].year).toBe(1500);
  });
});
