import type { Scholar, ScholarsData } from '@/data/teachers/pages-types';
import type { AcquiredCatalogue } from '../../shared/acquired';
import type { FieldEntry, FieldLibrary } from '../field-library';
import type { ContributorFact, ContributorFacts } from '../facts';
import type { CatalogueFilters } from '../context';
import { isUsed, weight } from '../marks/facts';
import featured from '../../../../../content/teachers/field-featured.json';

export interface LibraryPerson extends FieldEntry { scholar?: Scholar; facts?: ContributorFact; search: string; sourceLifeDates: string[] }
export interface LibraryOptions { collection: string; role: string; scope: string; unclassified: boolean; unknownEra: boolean; expertiseOnly: boolean }
export const ALL_LIBRARY: LibraryOptions = { collection: '', role: '', scope: '', unclassified: false, unknownEra: false, expertiseOnly: false };
export type LibrarySort = 'featured' | 'az' | 'year' | 'held' | 'named';

/** Retain every source credit, including names with no assigned field. Only previously verified aliases are merged. */
export function mergeLibrary(index: FieldLibrary, acquired: AcquiredCatalogue, data: ScholarsData, facts?: ContributorFacts): LibraryPerson[] {
  const entries: FieldEntry[] = index.entries.map(p => ({ ...p }));
  const covered = new Set(entries.flatMap(p => p.contributorIds));
  for (const c of acquired.contributors) if (!covered.has(c.id)) entries.push({
    id: c.id, name: c.name, profileId: c.profileId, aliases: [c.name], contributorIds: [c.id],
    roles: c.roles, traditions: c.traditions, collections: [], fields: {}, records: c.records, readable: c.readable, supplements: [],
  });
  const sources = new Map(acquired.contributors.map(c => [c.id, c]));
  const profiles = new Map(data.scholars.map(s => [s.id, s]));
  return entries.map(p => {
    const scholar = profiles.get(p.profileId ?? '');
    const sourceLifeDates = [...new Set(p.contributorIds.flatMap(id => sources.get(id)?.sourceLifeDates ?? []))];
    const search = [p.name, ...p.aliases, ...p.roles, ...p.traditions, ...sourceLifeDates,
      ...Object.entries(p.fields).flatMap(([key, field]) => [data.fields[key as keyof typeof data.fields], field?.example?.title]),
      ...(scholar ? [scholar.short, scholar.place[0], scholar.line, ...scholar.works.map(w => w[0]), ...(scholar.tags ?? [])] : []),
    ].join(' ').toLocaleLowerCase();
    return { ...p, scholar, search, sourceLifeDates, facts: facts?.entries[p.id] };
  });
}

export const libraryEra = (p: LibraryPerson) => p.facts ? p.facts.dates.era : p.scholar?.era ?? null;
export const libraryYear = (p: LibraryPerson) => p.facts?.dates.born ?? p.facts?.dates.floruit ?? p.scholar?.born ?? Infinity;
export const libraryFields = (p: LibraryPerson, expertiseOnly = false) => expertiseOnly ? p.facts?.expertise ?? (p.scholar ? [p.scholar.field] : []) : Object.keys(p.fields);

export function matchesLibrary(p: LibraryPerson, f: CatalogueFilters, o: LibraryOptions, ignore = ''): boolean {
  if (ignore !== 'field' && f.field.length && !f.field.some(key => libraryFields(p, o.expertiseOnly).includes(key))) return false;
  const era = libraryEra(p);
  if (ignore !== 'era' && (f.era.length || o.unknownEra) && !(era ? f.era.includes(era) : o.unknownEra)) return false;
  if (ignore !== 'faith' && f.faith.length && !f.faith.includes(p.scholar?.faith ?? 'unrecorded')) return false;
  if (ignore !== 'used' && f.used && (!p.scholar || !isUsed(p.scholar))) return false;
  if (o.collection && !p.collections.includes(o.collection)) return false;
  if (o.role && !p.roles.includes(o.role)) return false;
  if (o.scope === 'profiles' && !p.scholar || o.scope === 'library' && p.scholar) return false;
  if (o.unclassified && Object.keys(p.fields).length) return false;

  return f.q.split(/\s+/).filter(Boolean).every(word => p.search.includes(word));
}

const featuredIds = new Set(Object.values(featured).flat().map(([id]) => id));
export function orderLibrary(people: LibraryPerson[], sort: LibrarySort): LibraryPerson[] {
  const rank = (p: LibraryPerson) => p.scholar ? 0 : featuredIds.has(p.id) ? 1 : 2;
  return [...people].sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    if (sort === 'featured') return rank(a) - rank(b) || (a.scholar && b.scholar ? a.scholar.born - b.scholar.born : 0) || b.records - a.records || a.name.localeCompare(b.name);
    if (sort === 'year') return libraryYear(a) - libraryYear(b) || a.name.localeCompare(b.name);
    if (sort === 'named') return (b.scholar ? weight(b.scholar) : 0) - (a.scholar ? weight(a.scholar) : 0) || a.name.localeCompare(b.name);
    return b.records - a.records || a.name.localeCompare(b.name);
  });
}
