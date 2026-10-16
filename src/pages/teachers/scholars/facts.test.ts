import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { ContributorFacts } from './facts';
import { contributorEra } from './facts';
import { SCHOLAR_SECTIONS, sectionNumber } from './sections';
import { hydratePopulation } from './population';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const snapshot=read('public/content/scholar-population/index.json');
const facts: ContributorFacts={schemaVersion:1,inputs:{},summary:snapshot.factSummary,entries:Object.fromEntries(snapshot.entries.map((p:{id:string;facts:unknown})=>[p.id,p.facts]))};
it('has evidence for every catalogue entry and hashes the exact source snapshots', () => {
  const people = hydratePopulation(snapshot,read('src/data/teachers/scholars.json'));
  expect(people.map(p => p.id).sort()).toEqual(Object.keys(facts.entries).sort());
  expect(people.every(p => p.facts)).toBe(true);
  for (const [path, hash] of Object.entries(snapshot.reconciliation.inputs)) { if(typeof hash==='string'&&path.endsWith('.json')) expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(hash); }
});
it('includes unknowns in era totals and never promotes subject matches into expertise', () => {
  const entries = Object.values(facts.entries);
  for (const [era, count] of Object.entries(facts.summary.eras)) expect(entries.filter(f => contributorEra(f) === era)).toHaveLength(count);
  expect(Object.values(facts.summary.eras).reduce((a, b) => a + b, 0)).toBe(facts.summary.catalogueEntries);
  expect(entries.filter(f => f.expertise.includes('places'))).toHaveLength(facts.summary.expertiseCounts.places);
  expect(facts.summary.subjectCounts.places).toBeGreaterThan(facts.summary.expertiseCounts.places);
  expect(entries.filter(f => f.dates.status === 'conflicting').every(f => !f.dates.era)).toBe(true);
});
it('numbers every live section once in page order', () => {
  expect(SCHOLAR_SECTIONS.map(s => sectionNumber(s.id))).toEqual(['01', '02', '03', '04']);
  expect(sectionNumber('built')).toBe('02');
  expect(sectionNumber('directory')).toBe('04');
});
