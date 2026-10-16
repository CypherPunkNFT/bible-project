import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_LIBRARY, hasCatalogueField, matchesLibrary, mergeLibrary } from './library';
import { NO_FILTERS } from '../context';
import type { Field, ScholarsData } from '@/data/teachers/pages-types';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const data: ScholarsData = read('src/data/teachers/scholars.json');
const people = mergeLibrary(read('content/teachers/field-shelves.json'), read('public/content/teacher-library/catalogue.json'), data);

describe('catalogue fields match the fields displayed on cards', () => {
  it('excludes text scholars from History despite historical words in held titles', () => {
    for (const id of ['origen', 'jerome', 'tyndale']) {
      const person = people.find(p => p.scholar?.id === id)!;
      expect(person.fields.history).toBeTruthy();
      expect(matchesLibrary(person, { ...NO_FILTERS, field: ['history'] }, ALL_LIBRARY)).toBe(false);
      expect(matchesLibrary(person, { ...NO_FILTERS, field: ['texts'] }, ALL_LIBRARY)).toBe(true);
    }
  });
  it('uses the same rule for results, facet counts and statistics across every field', () => {
    for (const field of Object.keys(data.fields) as Field[]) {
      const filtered = people.filter(p => matchesLibrary(p, { ...NO_FILTERS, field: [field] }, ALL_LIBRARY));
      expect(filtered.map(p => p.id)).toEqual(people.filter(p => hasCatalogueField(p, field)).map(p => p.id));
      expect(filtered.filter(p => p.scholar).every(p => p.scholar!.field === field)).toBe(true);
      expect(filtered.filter(p => !p.scholar).every(p => Boolean(p.fields[field]))).toBe(true);
    }
  });
  it('retains overlapping library subjects and multi-select OR behavior', () => {
    const person = people.find(p => !p.scholar && Object.keys(p.fields).length > 1)!;
    expect(person).toBeTruthy();
    for (const field of Object.keys(person.fields) as Field[]) expect(hasCatalogueField(person, field)).toBe(true);
    const origen = people.find(p => p.scholar?.id === 'origen')!;
    expect(matchesLibrary(origen, { ...NO_FILTERS, field: ['history', 'texts'] }, ALL_LIBRARY)).toBe(true);
    expect(matchesLibrary(origen, { ...NO_FILTERS, field: ['history'] }, ALL_LIBRARY, 'field')).toBe(true);
  });
});
