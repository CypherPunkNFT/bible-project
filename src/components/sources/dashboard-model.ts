import type { SourceEntry } from './types';
export type ReviewFilter = 'all' | 'identity' | 'source' | 'unassigned';
// Explicit missing fields only: an anonymous historical author is not corrupt data.
export const missingIdentity = (entry: SourceEntry) => !entry.title.trim() || !entry.author.trim() || entry.title === 'Title not recorded' || entry.author === 'Author not recorded';
export function needsReview(entry: SourceEntry, filter: ReviewFilter) {
  if (filter === 'identity') return missingIdentity(entry);
  if (filter === 'source') return !entry.links.some(link => /^https?:\/\//i.test(link.url));
  if (filter === 'unassigned') return entry.categories.includes('research');
  return true;
}
export const sourceViews = [['overview', 'Overview'], ['bibliography', 'Catalogue'], ['collections', 'Collections'], ['scriptures', 'Bible editions'], ['repositories', 'Providers'], ['quality', 'Review & gaps'], ['foundations', 'Credits']] as const;
export type SourceView = typeof sourceViews[number][0];
export function sourceView(hash: string): SourceView {
  const id = hash.replace(/^#/, '');
  if (id === 'reference-library') return 'foundations';
  if (id === 'research') return 'quality';
  return sourceViews.some(([key]) => key === id) ? id as SourceView : 'overview';
}

/** Prefer a requested title over incidental matches in an acquisition URL; never a quality score. */
export function titleMatchRank(entry: SourceEntry, query: string) {
 const phrase = query.trim().toLocaleLowerCase();
 if (!phrase) return 0;
 const title = entry.title.toLocaleLowerCase();
 return title === phrase ? 2 : title.includes(phrase) ? 1 : 0;
}

export const extraFacetKeys = ['tradition', 'era', 'format', 'provider', 'use'] as const;
export type ExtraFacet = typeof extraFacetKeys[number];
export type FacetKey = 'category' | 'holdings' | 'review' | ExtraFacet;
export type CatalogueFilters = { category: string; holdings: string; review: ReviewFilter; query: string; facets?: Partial<Record<ExtraFacet, string[]>> };
export const eraLabels: Record<string,string> = {ancient:'Ancient · before 500',medieval:'Medieval · 500–1499','early-modern':'Early modern · 1500–1799',modern:'Modern · 1800 onward',unrecorded:'Unrecorded / unresolved'};
export const traditionLabel = (value: string) => value === 'early' ? 'Early Church' : value === 'unrecorded' ? 'Unrecorded / unresolved' : value.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
export function facetValues(entry: SourceEntry, key: FacetKey): string[] {
  const known = (values: string[]) => [...new Set(values.length ? values : ['unrecorded'])];
  if (key === 'category') return entry.categories;
  if (key === 'holdings') return [entry.held ? 'held' : 'catalog'];
  if (key === 'review') return (['identity','source','unassigned'] as ReviewFilter[]).filter(value=>needsReview(entry,value));
  if (key === 'tradition') return known(entry.metadata?.traditions ?? []);
  if (key === 'era') return known(entry.metadata?.eras ?? []);
  if (key === 'format') return known(entry.links.flatMap(link=>link.format ? [link.format.toLowerCase() === 'txt' ? 'text' : link.format.toLowerCase()] : []));
  if (key === 'provider') return known(entry.links.flatMap(link=>{try {return [new URL(link.url).hostname.replace(/^www\./,'')];}catch{return [];}}));
  return [entry.citedOn?.length ? 'cited' : 'not-cited'];
}
export const selectedValues = (filters: CatalogueFilters, key: FacetKey): string[] => extraFacetKeys.includes(key as ExtraFacet) ? filters.facets?.[key as ExtraFacet] ?? [] : filters[key as 'category' | 'holdings' | 'review'] === 'all' ? [] : [filters[key as 'category' | 'holdings' | 'review']];
export function toggleFacet(filters: CatalogueFilters, key: FacetKey, value: string): CatalogueFilters {
  if (!extraFacetKeys.includes(key as ExtraFacet)) return {...filters, [key]: value === filters[key as 'category' | 'holdings' | 'review'] ? 'all' : value};
  const selected = selectedValues(filters,key);
  return {...filters, facets:{...filters.facets,[key]:value === 'all' ? [] : selected.includes(value) ? selected.filter(v=>v!==value) : [...selected,value]}};
}
export function matchesCatalogue(entry: SourceEntry, filters: CatalogueFilters, omit?: FacetKey) {
  const terms = filters.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [entry.title, entry.author, entry.kind, ...entry.links.map(link => (link.name || '') + ' ' + link.url)].join(' ').toLocaleLowerCase();
  return terms.every(term => text.includes(term))
    && (omit === 'category' || filters.category === 'all' || entry.categories.includes(filters.category))
    && (omit === 'holdings' || filters.holdings === 'all' || (filters.holdings === 'held' ? !!entry.held : !entry.held))
    && (omit === 'review' || needsReview(entry, filters.review))
    && extraFacetKeys.every(key=>omit === key || !filters.facets?.[key]?.length || filters.facets[key]!.some(value=>facetValues(entry,key).includes(value)));
}
