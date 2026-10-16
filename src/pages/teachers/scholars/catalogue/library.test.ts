import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mergeLibrary, matchesLibrary, orderLibrary, ALL_LIBRARY, type LibrarySort } from './library';
import { NO_FILTERS } from '../context';
import { evidencedProfiles } from '../site-evidence';
import type { ScholarsData } from '@/data/teachers/pages-types';
import type { FieldLibrary } from '../field-library';
import type { AcquiredCatalogue } from '../../shared/acquired';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const acquired: AcquiredCatalogue = read('public/content/teacher-library/catalogue.json');
const fields: FieldLibrary = read('content/teachers/field-shelves.json');
const data: ScholarsData = evidencedProfiles(read('src/data/teachers/scholars.json'));
const people = mergeLibrary(fields, acquired, data);
describe('complete contributor catalogue against the acquired corpus', () => {
  it('represents every acquired contributor exactly once and retains every documented scholar', () => {
    const ids = people.flatMap(p => p.contributorIds);
    expect(new Set(ids).size).toBe(acquired.contributors.length);
    expect(ids.length).toBe(new Set(ids).size);
    expect(new Set(ids)).toEqual(new Set(acquired.contributors.map(c => c.id)));
    expect(people.filter(p => p.scholar).map(p => p.scholar!.id).sort()).toEqual(data.scholars.map(s => s.id).sort());
    expect(new Set(people.map(p => p.id)).size).toBe(people.length);
  });
  it('includes unclassified credits without inventing fields or biographies', () => {
    const found = people.filter(p => matchesLibrary(p, NO_FILTERS, { ...ALL_LIBRARY, unclassified: true }));
    const represented=new Set(fields.entries.flatMap(p=>p.contributorIds));
    expect(found.length).toBe(acquired.contributors.filter(c=>!represented.has(c.id)).length);
    expect(found.every(p => !p.scholar && !Object.keys(p.fields).length)).toBe(true);
    expect(people.length).toBe(fields.entries.length + found.length);
    expect(people.filter(p => matchesLibrary(p, { ...NO_FILTERS, q: found[0].name.toLowerCase() }, ALL_LIBRARY))).toContain(found[0]);
  });
  it('retains all CCEL and Latin Fathers contributors and their shelf evidence', () => {
    for (const collection of ['ccel', 'latin-fathers']) {
      const found = people.filter(p => matchesLibrary(p, NO_FILTERS, { ...ALL_LIBRARY, collection }));
      expect(found.length).toBe(fields.coverage.collections[collection]);
      expect(found.every(p => p.contributorIds.length || p.supplements.length)).toBe(true);
    }
    expect(people.find(p => p.name === 'Ambrose of Milan')?.supplements.length).toBeGreaterThan(0);
  });
  it('keeps the complete set in every sort and separates profile status from library records', () => {
    const ids = people.map(p => p.id).sort();
    for (const sort of ['featured', 'year', 'held', 'az', 'named'] as LibrarySort[]) expect(orderLibrary(people, sort).map(p => p.id).sort()).toEqual(ids);
    expect(people.filter(p => matchesLibrary(p, NO_FILTERS, { ...ALL_LIBRARY, scope: 'profiles' }))).toHaveLength(data.scholars.length);
    expect(people.filter(p => matchesLibrary(p, { ...NO_FILTERS, used: true }, { ...ALL_LIBRARY, scope: 'profiles' })).length).toBe(data.scholars.filter(s => s.site?.status === 'in-use').length);
  });
});
