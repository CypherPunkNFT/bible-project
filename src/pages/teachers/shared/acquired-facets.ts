// The row model behind "The texts we hold, by contributor" (sections 09 and 08): one row per acquired contributor,
// joined to their documented profile when they have one, so the shelves can be filtered by where the person came
// from, their recorded tradition and their century, and sorted by how much of them the library holds.
// Profiles supply the place and the century; a contributor with no profile keeps its shelf and says so.
import type { Person, Scholar } from "@/data/teachers/pages-types";
import type { AcquiredCatalogue, AcquiredContributor } from "./acquired";
import { FAMILIES, familyOf } from "./people";
import { originRegion, UNRECORDED_ORIGIN } from "../preachers/directory/regions";
import { compareText } from "@/lib/site-format";

export const NO_PROFILE = "no-profile";
export const UNRECORDED = "unrecorded";
export type Facet = "origin" | "tradition" | "century" | "shelf";
export type Filters = Record<Facet, string[]>;
export const NO_FILTERS: Filters = { origin: [], tradition: [], century: [], shelf: [] };
export const FACETS: Facet[] = ["origin", "tradition", "century", "shelf"];

export type Sort = "held" | "readable" | "az" | "year";
export const SORTS: [Sort, string][] = [["held", "Most held"], ["readable", "Most readable"], ["az", "A–Z"], ["year", "Birth year"]];

/** A shelf's standing in the library: what you can actually do with it today. */
export const SHELVES: [string, string][] = [
  ["readable", "Readable here"],
  ["catalogue", "Catalogue only"],
  [NO_PROFILE, "No profile yet"],
];

export interface ShelfRow {
  contributor: AcquiredContributor;
  origin: string;
  tradition: string;
  traditionLabel: string;
  century: string;
  shelf: string;
  /** The tradition family's colour, when the tradition is one the pages already colour. */
  toneVar?: string;
  born: number | null;
  life: string | null;
  profiled: boolean;
  search: string;
}

/** What a profile contributes to its shelf. Both pages supply the same four facts in their own vocabulary. */
export interface ProfileFacts { origin: string; tradition: string; traditionLabel: string; born: number; life: string }

const century = (born: number) => `${Math.floor(born / 100) * 100}`;
const centuryLabel = (value: string) => (value === UNRECORDED ? "Not recorded" : `${value}–${+value + 99}`);
const titleCase = (value: string) => value.replace(/-/g, " ").replace(/^./, c => c.toUpperCase());
const lifeOf = (born: number, died: number | null, circa?: boolean) => `${circa ? "c. " : ""}${born}–${died ?? ""}`;

/** Preachers: the country they came from, and the tradition family that already colours the rest of their page. */
export function preacherFacts(people: Person[]): Map<string, ProfileFacts> {
  return new Map(people.map(person => {
    const family = familyOf(person);
    return [person.id, {
      origin: originRegion(person), tradition: family.key, traditionLabel: family.label,
      born: person.born, life: lifeOf(person.born, person.died, person.circa),
    }];
  }));
}

/** Scholars: their one recorded place, and the faith recorded for them rather than a Protestant tradition family. */
export function scholarFacts(scholars: Scholar[], faiths: Record<string, string>): Map<string, ProfileFacts> {
  return new Map(scholars.map(scholar => [scholar.id, {
    origin: scholar.place[0] || UNRECORDED_ORIGIN,
    tradition: scholar.faith, traditionLabel: faiths[scholar.faith] ?? titleCase(scholar.faith),
    born: scholar.born, life: lifeOf(scholar.born, scholar.died, scholar.circa),
  }]));
}

/** A contributor with no profile still has the registry's own tradition words; use the first one we can label. */
const familyTone = (key: string) => {
  const family = FAMILIES.find(f => f.key === key);
  return family ? `var(${family.tone})` : undefined;
};

function recordedTradition(contributor: AcquiredContributor): { tradition: string; traditionLabel: string } {
  for (const family of FAMILIES) if (contributor.traditions.includes(family.key)) return { tradition: family.key, traditionLabel: family.label };
  const [first] = contributor.traditions;
  return first ? { tradition: first, traditionLabel: titleCase(first) } : { tradition: UNRECORDED, traditionLabel: "Tradition not recorded" };
}

export function shelfRows(contributors: AcquiredContributor[], facts: Map<string, ProfileFacts>): ShelfRow[] {
  return contributors.map(contributor => {
    const profile = contributor.profileId ? facts.get(contributor.profileId) : undefined;
    const tradition = profile ? { tradition: profile.tradition, traditionLabel: profile.traditionLabel } : recordedTradition(contributor);
    const row: ShelfRow = {
      contributor,
      origin: profile?.origin ?? UNRECORDED_ORIGIN,
      ...tradition,
      century: profile ? century(profile.born) : UNRECORDED,
      shelf: !profile ? NO_PROFILE : contributor.readable ? "readable" : "catalogue",
      born: profile?.born ?? null,
      life: profile?.life ?? null,
      profiled: Boolean(profile),
      toneVar: familyTone(tradition.tradition),
      search: "",
    };
    row.search = [contributor.name, ...contributor.traditions, ...contributor.roles, ...(contributor.sourceLifeDates ?? []),
      row.origin, row.traditionLabel, row.life ?? ""].join(" ").toLocaleLowerCase();
    return row;
  });
}

/** Rows matching the search words and every set facet. `ignore` leaves one facet out, so its own counts stay live. */
export function matches(row: ShelfRow, words: string[], filters: Filters, role: string, ignore?: Facet): boolean {
  if (role && !row.contributor.roles.includes(role)) return false;
  if (!words.every(word => row.search.includes(word))) return false;
  return FACETS.every(key => key === ignore || !filters[key].length || filters[key].includes(row[key]));
}

export function order(rows: ShelfRow[], sort: Sort): ShelfRow[] {
  const name = (row: ShelfRow) => row.contributor.name;
  return [...rows].sort((a, b) => {
    if (sort === "az") return compareText(name(a), name(b));
    if (sort === "readable") return b.contributor.readable - a.contributor.readable || b.contributor.records - a.contributor.records || compareText(name(a), name(b));
    // Unprofiled shelves have no birth year; they sort last rather than at year zero.
    if (sort === "year") return (a.born ?? Infinity) - (b.born ?? Infinity) || compareText(name(a), name(b));
    return b.contributor.records - a.contributor.records || compareText(name(a), name(b));
  });
}

export interface FacetOption { value: string; label: string; tone?: string }

/** The options for one facet, commonest first, with "not recorded" always last however many it holds. */
export function options(rows: ShelfRow[], key: Facet): FacetOption[] {
  if (key === "shelf") return SHELVES.filter(([value]) => rows.some(row => row.shelf === value)).map(([value, label]) => ({ value, label }));
  const labels = new Map<string, string>(), counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
    labels.set(value, key === "century" ? centuryLabel(value) : key === "tradition" ? row.traditionLabel : value);
  }
  const unknown = (value: string) => value === UNRECORDED || value === UNRECORDED_ORIGIN;
  const tone = (value: string) => (key === "tradition" ? familyTone(value) : undefined);
  return [...counts.keys()]
    .sort((a, b) => Number(unknown(a)) - Number(unknown(b))
      || (key === "century" ? compareText(a, b) : (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
      || compareText(labels.get(a) ?? a, labels.get(b) ?? b))
    .map(value => ({ value, label: labels.get(value) ?? value, tone: tone(value) }));
}

export interface Spread { label: string; count: number }
export interface Stats {
  contributors: number; profiled: number; unprofiled: number; readableShelves: number;
  heldTextRecords: number; onSiteTexts: number; workRecordCount: number; unknownAuthorRecords: number;
  largest: Spread[]; traditions: Spread[]; origins: Spread[];
}

/** The header figures: how much is held, who holds it, and how it spreads across traditions and places. */
export function stats(rows: ShelfRow[], catalogue: AcquiredCatalogue): Stats {
  const tally = (pick: (row: ShelfRow) => string, labelOf: (row: ShelfRow) => string) => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const row of rows) {
      const entry = counts.get(pick(row)) ?? { label: labelOf(row), count: 0 };
      entry.count += row.contributor.records;
      counts.set(pick(row), entry);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  };
  return {
    contributors: rows.length,
    profiled: rows.filter(row => row.profiled).length,
    unprofiled: rows.filter(row => !row.profiled).length,
    readableShelves: rows.filter(row => row.contributor.readable > 0).length,
    heldTextRecords: catalogue.heldTextRecords,
    onSiteTexts: catalogue.onSiteTexts,
    workRecordCount: catalogue.workRecordCount,
    unknownAuthorRecords: catalogue.unknownAuthorRecords,
    largest: [...rows].sort((a, b) => b.contributor.records - a.contributor.records).slice(0, 5)
      .map(row => ({ label: row.contributor.name, count: row.contributor.records })),
    traditions: tally(row => row.tradition, row => row.traditionLabel),
    origins: tally(row => row.origin, row => row.origin),
  };
}
