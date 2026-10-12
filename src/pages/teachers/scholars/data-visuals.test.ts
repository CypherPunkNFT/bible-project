import { describe, expect, it } from 'vitest';
import raw from '../../../../src/data/teachers/scholars.json';
import facts from '../../../../content/teachers/contributor-facts.json';
import type { Era, ScholarsData } from '@/data/teachers/pages-types';
import { authorCredits, evidencedProfiles, featureEvidence } from './site-evidence';
import { buildModel as ribbons } from './built/model';
import { buildModel as discoveries } from './discoveries/model';
import { matchesLibrary, ALL_LIBRARY, type LibraryPerson } from './catalogue/library';
const data=evidencedProfiles(raw as unknown as ScholarsData);
describe('shared data in established scholar visuals',()=>{
 it('retains every exact source in the ribbon model and every credit in the heat grid',()=>{
  const model=ribbons(data.scholars);
  expect(model.rows.length).toBe(featureEvidence.reduce((n,f)=>n+f.sources.length,0));
  expect(model.features).toHaveLength(featureEvidence.length);
  expect(new Set(authorCredits(data.scholars).map(c=>c.name))).toEqual(new Set(featureEvidence.flatMap(f=>f.sources.map(s=>s.author))));
  for(const row of model.rows)expect(row.s.sourceUrl).toBeTruthy();
 });
 it('uses cited Westcott books instead of the first biography title',()=>{
  const records=ribbons(data.scholars).rows.filter(r=>r.s.name.includes('Westcott'));
  expect(records.some(r=>r.s.works[0][0].includes('Hebrews'))).toBe(true);
  expect(records.some(r=>r.s.works[0][0].includes('Original Greek'))).toBe(false);
 });
 it('includes every era and unknown in the audit total',()=>{
  expect(Object.values(facts.summary.eras).reduce((a,b)=>a+b,0)).toBe(facts.summary.catalogueEntries);
  expect(facts.summary.eras.unknown).toBeGreaterThan(0);
 });
 it('filters non-profile dated contributors using evidence',()=>{
  const fact=Object.values(facts.entries).find(f=>f.dates.era&&f.dates.status==='source-supported')!;
  const person={facts:fact,fields:{},search:'',collections:[],roles:[]} as unknown as LibraryPerson;
  const filters={field:[],era:[fact.dates.era! as Era],faith:[],q:'',used:false};
  expect(matchesLibrary(person,filters,ALL_LIBRARY)).toBe(true);
  expect(matchesLibrary(person,filters,{...ALL_LIBRARY,unknownEra:true})).toBe(false);
 });
 it('retains the discovery thread model with explicit evidence',()=>{
  const model=discoveries(data);
  expect(model.finds).toHaveLength(7);
  expect(model.finds.find(f=>f.id==='asia-minor')?.year).toBe(1880);
  expect(model.threads['dead-sea-scrolls'].steps[0]).toMatchObject({kind:'who',role:expect.stringContaining('not the original finder')});
  expect(model.threads.sinaiticus.steps.some(s=>s.kind==='site'&&s.url==='/study/letters')).toBe(true);
 });
});
