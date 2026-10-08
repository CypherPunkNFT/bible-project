// The catalogue's filtering and sorting: which scholars pass the current filters (optionally ignoring one facet, for
// that facet's own counts), and the three orders.
import type { Era, Faith, Field, Scholar, ScholarsData } from "@/data/teachers/pages-types";
import type { CatalogueFilters } from "../context";
import { isUsed, surname, weight } from "../marks/facts";

export type FacetKey = "field" | "era" | "faith";
export type FacetValue = Field | Era | Faith;
export const FACETS: { key: FacetKey; title: string }[] = [{ key: "field", title: "Field" }, { key: "era", title: "Era" }, { key: "faith", title: "Faith" }];
export const facetLabels = (data: ScholarsData, key: FacetKey): Record<string, string> => data[`${key}s`];

export type SortKey = "year" | "az" | "named";
export const SORTS: { key: SortKey; label: string }[] = [{ key: "year", label: "Year" }, { key: "az", label: "A–Z" }, { key: "named", label: "Most named" }];

/** The text each scholar is searched by: name, place, field, faith, one-line summary and work titles, lower-cased. */
export function buildHaystack(data: ScholarsData): Map<string, string> {
  return new Map(data.scholars.map((s) => [s.id, [s.name, s.short, s.place[0], data.fields[s.field], data.faiths[s.faith], s.line, ...s.works.map((w) => w[0])].join(" ").toLowerCase()]));
}

const chosen = (filters: CatalogueFilters, key: FacetKey): readonly string[] => filters[key];

/** Does s pass every filter, optionally ignoring one facet (or the "used" switch)? */
export function passes(s: Scholar, filters: CatalogueFilters, haystack: Map<string, string>, ignore?: FacetKey | "used"): boolean {
  for (const { key } of FACETS) {
    const list = chosen(filters, key);
    if (key !== ignore && list.length && !list.includes(s[key])) return false;
  }
  if (filters.used && ignore !== "used" && !isUsed(s)) return false;
  if (filters.q) {
    const text = haystack.get(s.id) ?? "";
    if (!filters.q.split(/\s+/).every((word) => text.includes(word))) return false;
  }
  return true;
}

export function sortScholars(list: Scholar[], sort: SortKey): Scholar[] {
  const by: Record<SortKey, (a: Scholar, b: Scholar) => number> = {
    year: (a, b) => a.born - b.born,
    az: (a, b) => surname(a).localeCompare(surname(b)),
    named: (a, b) => weight(b) - weight(a) || a.born - b.born,
  };
  return [...list].sort(by[sort]);
}

/** The filters with one facet value added or removed. */
export function toggled(filters: CatalogueFilters, key: FacetKey, value: string): CatalogueFilters {
  const list: string[] = [...chosen(filters, key)];
  const at = list.indexOf(value);
  if (at >= 0) list.splice(at, 1); else list.push(value);
  return { ...filters, [key]: list } as CatalogueFilters; // values are the data's own keys for that facet
}

export const hasFilters = (f: CatalogueFilters) => f.field.length > 0 || f.era.length > 0 || f.faith.length > 0 || f.used || f.q.length > 0;
export const normaliseQuery = (text: string) => text.trim().toLowerCase();
