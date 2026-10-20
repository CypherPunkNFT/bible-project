import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {buildModel,topSources,modelForArea,SOURCE_AREAS,layoutFor} from './built/model';
import {featureEvidence,authorCredits} from './site-evidence';
import {SCHOLAR_SECTIONS,sectionNumber} from './sections';
import type {ScholarsData} from '@/data/teachers/pages-types';
const data:ScholarsData=JSON.parse(readFileSync('src/data/teachers/scholars.json','utf8'));

describe('merged Scholars sections',()=>{
 it('keeps connections within sources rather than adding a landing chooser entry',()=>{
  expect(SCHOLAR_SECTIONS.map(s=>s.id)).toEqual(['built','catalogue','discoveries','directory']);
  expect(SCHOLAR_SECTIONS.map(s=>sectionNumber(s.id))).toEqual(['01','02','03','04']);
 });
 it('retains every ribbon group while bounding the opening view through People · rulers',()=>{
  const model=buildModel(data.scholars);
  expect(model.features.map(f=>f.id)).toEqual(featureEvidence.map(f=>f.id));
  expect(model.rows.length).toBe(featureEvidence.reduce((n,f)=>n+topSources(f.sources).length,0));
  expect(new Set(authorCredits(data.scholars).map(c=>c.name))).toEqual(new Set(featureEvidence.flatMap(f=>f.sources.map(s=>s.author))));
  const layout=layoutFor(model,1400),lastRuler=model.rows.map(row=>row.fs[0].id).lastIndexOf('people-rulers');
  expect(layout.openingHeight).toBeLessThan(layout.height);
  expect(layout.work[lastRuler].y+layout.work[lastRuler].h).toBeLessThan(layout.openingHeight);
  expect(layout.work[lastRuler+1].y+6.4).toBeGreaterThan(layout.openingHeight);
  expect(layout.feat[0].y).toBeGreaterThanOrEqual(28);
  for(let i=1;i<layout.feat.length;i++)expect(layout.feat[i].y).toBeGreaterThanOrEqual(layout.feat[i-1].y+layout.feat[i-1].h);
 });
 it('partitions all source records into study tabs without dropping or duplicating associations',()=>{
  const all=buildModel(data.scholars),tabs=SOURCE_AREAS.filter(tab=>tab.id!=='all').map(tab=>modelForArea(all,tab.id));
  const ids=tabs.flatMap(tab=>tab.rows.map(row=>row.s.id));
  expect(ids).toHaveLength(all.rows.length);
  expect(new Set(ids)).toEqual(new Set(all.rows.map(row=>row.s.id)));
  expect(modelForArea(all,'people').features.map(f=>f.id)).toEqual(['people-rulers','people-apostles','people-prophets']);
  expect(modelForArea(all,'study').features.map(f=>f.id)).toContain('letters');
  expect(modelForArea(all,'apologetics').features.map(f=>f.id)).toEqual(expect.arrayContaining(['apologetics','debates','worldviews','apologetics-practice']));
  expect(modelForArea(all,'texts').features.map(f=>f.id)).toEqual(['witnesses','manuscript-passages','dead-sea-scrolls','printed-bible']);
  expect(modelForArea(all,'archaeology').features.map(f=>f.id)).toEqual(['discoveries','cities']);
 });
 it('searches beyond the opening sample and expands connections without changing source identities',()=>{
  const all=buildModel(data.scholars),expanded=buildModel(data.scholars,16);
  expect(all.totalCount).toBeGreaterThan(all.rows.length);
  expect(expanded.rows.length).toBeGreaterThan(all.rows.length);
  expect(expanded.totalCount).toBe(all.totalCount);
  const hidden=featureEvidence.flatMap(f=>topSources(f.sources,Infinity)).find(s=>!all.rows.some(row=>row.s.sourceUrl===s.url&&row.s.works[0][0]===s.title));
  expect(hidden).toBeTruthy();
  const searched=buildModel(data.scholars,8,hidden!.title);
  expect(searched.rows.some(row=>row.s.works[0][0]===hidden!.title)).toBe(true);
  expect(buildModel(data.scholars,8,'zzzz-no-source-match').rows).toHaveLength(0);
 });
 it('keeps every visual area and credit-grid area assigned',()=>{
  const all=buildModel(data.scholars);
  expect(SOURCE_AREAS).toHaveLength(9);
  for(const feature of all.features)expect(SOURCE_AREAS.filter(tab=>tab.features?.includes(feature.id))).toHaveLength(1);
 });
});
