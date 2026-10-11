import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { NO_FILTERS } from '../context';
import { ALL_LIBRARY, libraryEra, libraryYear, matchesLibrary, mergeLibrary, orderLibrary } from './library';
import { dateLabel } from './dates';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const facts = read('content/teachers/contributor-facts.json');
const people = mergeLibrary(read('content/teachers/field-shelves.json'), read('public/content/teacher-library/catalogue.json'), read('src/data/teachers/scholars.json'), facts);

it('partitions the entire catalogue into supported eras and explicit unknowns', () => {
  for (const [era, count] of Object.entries(facts.summary.eras)) {
    const matching = people.filter(p => era === 'unknown' ? matchesLibrary(p, NO_FILTERS, { ...ALL_LIBRARY, unknownEra: true }) : matchesLibrary(p, { ...NO_FILTERS, era: [era as 'ancient'] }, ALL_LIBRARY));
    expect(matching).toHaveLength(count as number);
  }
  expect(people.filter(p => !p.scholar && libraryEra(p)).length).toBeGreaterThan(3000);
  const combined = people.filter(p => matchesLibrary(p, { ...NO_FILTERS, era: ['ancient'] }, { ...ALL_LIBRARY, unknownEra: true }));
  expect(combined).toHaveLength(facts.summary.eras.ancient + facts.summary.eras.unknown);
});

it('sorts by supported birth or activity dates without turning death-only labels into birth dates', () => {
  const sorted = orderLibrary(people, 'year').map(libraryYear);
  expect(sorted.every((year, i) => i === 0 || year >= sorted[i - 1])).toBe(true);
  const deathOnly = people.find(p => p.facts?.dates.status === 'source-supported' && p.facts.dates.died && !p.facts.dates.born && !p.facts.dates.floruit)!;
  expect(deathOnly).toBeDefined();
  expect(libraryYear(deathOnly)).toBe(Infinity);
  expect(dateLabel(deathOnly)).toMatch(/Died .*era unknown/);
});

it('distinguishes work subjects from documented expertise', () => {
  const filters = { ...NO_FILTERS, field: ['places' as const] };
  expect(people.filter(p => matchesLibrary(p, filters, ALL_LIBRARY))).toHaveLength(facts.summary.subjectCounts.places);
  expect(people.filter(p => matchesLibrary(p, filters, { ...ALL_LIBRARY, expertiseOnly: true }))).toHaveLength(facts.summary.expertiseCounts.places);
});

it('restores omitted structured credits and editors with actual work destinations and roles', () => {
  for (const name of ['James R. White', 'Shabir Ally', 'Yusuf Bux', 'Zakir Hussain', 'Particular Baptist churches and messengers', 'Mrs. John G. Paton', 'Cuthbert Lennox', 'James Paton']) {
    const p = people.find(p => p.name === name)!;
    expect(p, name).toBeDefined();
    expect(p.supplements.length).toBeGreaterThan(0);
    expect(p.facts?.dates.era).toBeNull();
  }
  expect(people.find(p => p.name === 'Cuthbert Lennox')?.roles).toContain('editor');
  expect(people.find(p => p.name === 'James Paton')?.roles).toContain('editor');
  expect(people.find(p => p.name === 'Mrs. John G. Paton')?.supplements[0].id).toBe('work-l13-paton-1889-v2-chapter-09');
});
