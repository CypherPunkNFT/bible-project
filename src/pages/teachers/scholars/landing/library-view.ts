import type { Field } from '@/data/teachers/pages-types';
import { ALL_LIBRARY, matchesLibrary, orderLibrary, type LibraryPerson } from '../catalogue/library';
import { NO_FILTERS } from '../context';
import featured from '../../../../../content/teachers/field-featured.json';

export function searchOpening(library: LibraryPerson[], query: string): LibraryPerson[] {
  const q = query.trim().toLocaleLowerCase();
  return q ? library.filter(p => matchesLibrary(p, { ...NO_FILTERS, q }, ALL_LIBRARY)) : [];
}

/** A bounded selection, with both profiles and library-only credits represented. */
export function openingGroups(library: LibraryPerson[], fields: Field[]) {
  const ordered = orderLibrary(library, 'featured');
  return [...fields, 'unassigned' as const].map(field => {
    const preferred = field === 'unassigned' ? [] : featured[field].map(([id]) => id);
    const priority = (p: LibraryPerson) => { const rank = preferred.indexOf(p.profileId ?? p.id); return rank < 0 ? Infinity : rank; };
    const members = ordered.filter(p => field === 'unassigned' ? !Object.keys(p.fields).length : Boolean(p.fields[field])).sort((a, b) => priority(a) - priority(b));
    const profiles = members.filter(p => p.scholar).slice(0, 3);
    const credits = members.filter(p => !p.scholar).slice(0, 6 - profiles.length);
    const selected = [...profiles, ...credits];
    for (const p of members) if (selected.length < 6 && !selected.includes(p)) selected.push(p);
    return { field, total: members.length, selected };
  });
}
