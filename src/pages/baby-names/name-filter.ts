// The browse list's filters, search and sort (design 5.2), kept apart from the page so they can be tested alone.
// Filter state lives in the address (?g=girl&t=nt&l=m&m=light&show=all&sort=popular&q=eli) so a filtered list can be
// shared and the back button works; values the page does not know are ignored.
import type { NameRow } from "@/data/baby-names";
import { compareText } from "@/lib/site-format";

export type GenderFilter = "boy" | "girl" | "both" | "all";
export type TestamentFilter = "ot" | "nt" | "all";
export type SortOrder = "popular" | "az" | "mentions";
export type ListVariant = "all" | "boy" | "girl";

export interface Filters {
  gender: GenderFilter;
  testament: TestamentFilter;
  letter: string; // "" or a..z
  theme: string; // "" or a theme id
  showAll: boolean; // false: well-known names only (full pages)
  sort: SortOrder;
  query: string;
}

const GENDERS: GenderFilter[] = ["boy", "girl", "both", "all"];
const TESTAMENTS: TestamentFilter[] = ["ot", "nt", "all"];
const SORTS: SortOrder[] = ["popular", "az", "mentions"];

/** Where each list page starts: the boy and girl pages filtered, sorted by US popularity when that data is present
 *  (otherwise by how often the Bible names them); the hub A to Z. */
export function defaultFilters(variant: ListVariant, hasPopularity: boolean): Filters {
  const sort: SortOrder = variant === "all" ? "az" : hasPopularity ? "popular" : "mentions";
  return { gender: variant === "all" ? "all" : variant, testament: "all", letter: "", theme: "", showAll: false, sort, query: "" };
}

export function readFilters(params: URLSearchParams, variant: ListVariant, hasPopularity: boolean, themes: readonly string[]): Filters {
  const base = defaultFilters(variant, hasPopularity);
  const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
    value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  const letter = (params.get("l") ?? "").toLowerCase();
  const sort = pick(params.get("sort"), SORTS, base.sort);
  return {
    gender: pick(params.get("g"), GENDERS, base.gender),
    testament: pick(params.get("t"), TESTAMENTS, base.testament),
    letter: /^[a-z]$/.test(letter) ? letter : "",
    theme: pick(params.get("m"), themes, ""),
    showAll: params.get("show") === "all",
    sort: sort === "popular" && !hasPopularity ? base.sort : sort,
    query: (params.get("q") ?? "").slice(0, 40),
  };
}

/** The address parameters for these filters: only what differs from the page's starting point. */
export function writeFilters(filters: Filters, variant: ListVariant, hasPopularity: boolean): URLSearchParams {
  const base = defaultFilters(variant, hasPopularity);
  const params = new URLSearchParams();
  if (filters.gender !== base.gender) params.set("g", filters.gender);
  if (filters.testament !== base.testament) params.set("t", filters.testament);
  if (filters.letter) params.set("l", filters.letter);
  if (filters.theme) params.set("m", filters.theme);
  if (filters.showAll) params.set("show", "all");
  if (filters.sort !== base.sort) params.set("sort", filters.sort);
  if (filters.query.trim()) params.set("q", filters.query); // untrimmed, so a space can be typed between words
  return params;
}

const normal = (text: string) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Search: the start of the name or of any other spelling ("eli" finds Eli, Eliab, and Elijah through Elias). */
export function matchesQuery(row: NameRow, query: string): boolean {
  const q = normal(query.trim());
  if (!q) return true;
  return normal(row.n).startsWith(q) || row.a.some((form) => normal(form).startsWith(q));
}

function genderMatches(row: NameRow, gender: GenderFilter): boolean {
  if (gender === "all") return true;
  if (gender === "both") return row.g === "both";
  return row.g === gender || row.g === "both";
}

/** Every filter but the letter: the letter buttons use it to show which letters still have names. */
export function matchesExceptLetter(row: NameRow, filters: Filters): boolean {
  if (!genderMatches(row, filters.gender)) return false;
  if (filters.testament !== "all" && row.t !== filters.testament && row.t !== "both") return false;
  if (filters.theme && !row.th.includes(filters.theme)) return false;
  // A search looks through every name; without one, "well-known" hides the short pages (design 5.2).
  if (!filters.showAll && !filters.query.trim() && row.f !== 1) return false;
  return matchesQuery(row, filters.query);
}

export const firstLetter = (row: NameRow) => normal(row.n).charAt(0);

function popularity(row: NameRow, gender: GenderFilter): number {
  if (gender === "boy") return row.rb ?? Infinity;
  if (gender === "girl") return row.rg ?? Infinity;
  return Math.min(row.rb ?? Infinity, row.rg ?? Infinity);
}

export function sortRows(rows: NameRow[], filters: Filters): NameRow[] {
  const byName = (a: NameRow, b: NameRow) => compareText(a.n, b.n);
  const sorted = [...rows];
  if (filters.sort === "az") sorted.sort(byName);
  else if (filters.sort === "mentions") sorted.sort((a, b) => b.c - a.c || byName(a, b));
  else sorted.sort((a, b) => popularity(a, filters.gender) - popularity(b, filters.gender) || byName(a, b));
  return sorted;
}

export function applyFilters(rows: readonly NameRow[], filters: Filters): NameRow[] {
  const shown = rows.filter((row) => matchesExceptLetter(row, filters) && (!filters.letter || firstLetter(row) === filters.letter));
  return sortRows(shown, filters);
}

/** Letters A-Z with whether any name would show under the other filters (empty letters are shown but disabled). */
export function lettersWithNames(rows: readonly NameRow[], filters: Filters): Set<string> {
  return new Set(rows.filter((row) => matchesExceptLetter(row, filters)).map(firstLetter));
}

export function hasPopularity(rows: readonly NameRow[]): boolean {
  return rows.some((row) => row.rb !== undefined || row.rg !== undefined);
}
