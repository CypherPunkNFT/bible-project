import indexJson from "@/data/people-pages/index.json";
import type { ProphetEra, ProphetKind, Realm, RulerKind } from "@/data/people-pages/types";

/**
 * A small summary of every ruler, apostle and prophet page, generated from the group files by
 * scripts/build-people-pages-index.py (src/data/people-pages/index.json). It is bundled, so the person page's entry
 * cards and switch, the guides and the succession arrows know every page without loading every group file.
 */
export interface RulerSummary {
  id: string;
  group: string;
  kind: RulerKind;
  realm: Realm;
  name: string;
  title: string;
  tagline: string;
  order: number;
  reignText: string;
  verdictTone: "right" | "evil" | "mixed" | "none";
  prophets: string[];
  /** From the person's own record: "M", "F" or "" (for "his" or "her"). */
  sex: "M" | "F" | "G" | "";
  personIds?: string[];
  otherNames?: string[];
  years?: number;
  months?: number;
  days?: number;
  /** The reign in the main dating system: BC positive, AD negative. */
  dates?: { from: number; to: number; label: string; approx?: boolean };
  /**
   * Undated rulers only: where they are drawn on the time lines (BC positive), from the dated rulers Scripture names
   * beside them. Never shown as a date; the bar is dotted. Absent for the judges, who follow the story's order.
   */
  near?: number;
  verdict?: string;
  predecessor?: string;
  successor?: string;
  house?: string;
  tribe?: string;
  capital?: string;
}

export interface ApostleSummary {
  id: string;
  group: string;
  name: string;
  otherNames: string[];
  title: string;
  tagline: string;
  order: number;
  /** "G" when the page covers a couple (Priscilla and Aquila): "their". */
  sex?: "M" | "F" | "G" | "";
  personIds?: string[];
  home?: string;
  trade?: string;
  called?: string;
  ending?: string;
  tradition?: string;
  lists?: { book: "MAT" | "MRK" | "LUK" | "ACT"; position: number; name: string }[];
  writings?: string[];
}

/** A prophet page ("the word", /people/:id/word). */
export interface ProphetSummary {
  id: string;
  group: string;
  name: string;
  kind: ProphetKind;
  era: ProphetEra;
  /** Story order within the era (the era's arrows step through it). */
  order: number;
  title: string;
  tagline: string;
  /** Person ids of the rulers in whose days they spoke. */
  kings: string[];
  /** USFM codes of the books bearing their name. */
  books: string[];
  sex: "M" | "F" | "G" | "";
  personIds?: string[];
  otherNames?: string[];
}

export interface PeoplePagesIndex {
  groups: { id: string; title: string; rulers: number; apostles: number; prophets?: number }[];
  rulers: RulerSummary[];
  apostles: ApostleSummary[];
  prophets: ProphetSummary[];
}

const loadedIndex = indexJson as unknown as Partial<PeoplePagesIndex>;
export const PEOPLE_PAGES: PeoplePagesIndex = { groups: loadedIndex.groups ?? [], rulers: loadedIndex.rulers ?? [], apostles: loadedIndex.apostles ?? [], prophets: loadedIndex.prophets ?? [] };

const rulerById = new Map<string, RulerSummary>();
for (const ruler of PEOPLE_PAGES.rulers) for (const id of [ruler.id, ...(ruler.personIds ?? [])]) if (!rulerById.has(id)) rulerById.set(id, ruler);
const apostleById = new Map<string, ApostleSummary>();
for (const apostle of PEOPLE_PAGES.apostles) for (const id of [apostle.id, ...(apostle.personIds ?? [])]) if (!apostleById.has(id)) apostleById.set(id, apostle);
const prophetById = new Map<string, ProphetSummary>();
for (const prophet of PEOPLE_PAGES.prophets) for (const id of [prophet.id, ...(prophet.personIds ?? [])]) if (!prophetById.has(id)) prophetById.set(id, prophet);

/** The ruler page for a person id (its own id, or another record of the same person). */
export const rulerFor = (personId: string): RulerSummary | undefined => rulerById.get(personId);
export const apostleFor = (personId: string): ApostleSummary | undefined => apostleById.get(personId);
export const prophetFor = (personId: string): ProphetSummary | undefined => prophetById.get(personId);

/** A king named elsewhere on the site opens his rule page when there is one, else his person page. */
export function rulerHref(personId: string): string {
  const ruler = rulerFor(personId);
  return ruler ? `/people/${ruler.id}/rule` : `/people/${personId}`;
}

/** A prophet named elsewhere on the site opens their word page when there is one; else (Paul, Barnabas, Silas) their
 *  mission page; else their person page. */
export function prophetHref(personId: string): string {
  const page = prophetFor(personId) ?? apostleFor(personId);
  return page ? personPath(page.id, prophetFor(personId) ? "word" : "mission") : `/people/${personId}`;
}

export type Aspect = "rule" | "mission" | "word";
export const ASPECTS: Aspect[] = ["rule", "mission", "word"];
export const isAspect = (value: string | undefined): value is Aspect => ASPECTS.includes(value as Aspect);

/**
 * The Twelve, Matthias and Paul (the apostles-1 and apostles-2 groups) have ONE page, the apostle page, at their person
 * address (/people/<id>): it is the endpoint for that person from anywhere on the site, with no separate person page and
 * no person | mission switch (owner, 2026-10-08). Only the apostle's own main record: other records named with him
 * (Nathanael beside Bartholomew) keep their own person pages. The wider circle keeps person + mission pages.
 */
export const isApostleEndpoint = (id: string): boolean => {
  const apostle = apostleFor(id);
  return Boolean(apostle && apostle.id === id && apostle.group.startsWith("apostles-"));
};

/** The person's page address, or one of their special pages (an apostle's "mission" is his person address). */
export const personPath = (id: string, aspect?: Aspect) =>
  aspect === "mission" && isApostleEndpoint(apostleFor(id)?.id ?? "") ? `/people/${apostleFor(id)!.id}` : aspect ? `/people/${id}/${aspect}` : `/people/${id}`;

export type SpecialPage =
  | { aspect: "rule"; id: string; summary: RulerSummary }
  | { aspect: "mission"; id: string; summary: ApostleSummary }
  | { aspect: "word"; id: string; summary: ProphetSummary };

/**
 * Every special page a person has, in the switch's order (the rule, the mission, the word): Moses, Samuel and Deborah
 * have both a rule page and a word page. Each entry carries the page's own id (the person's main record).
 */
export function specialPagesOf(personId: string): SpecialPage[] {
  const ruler = rulerFor(personId), apostle = apostleFor(personId), prophet = prophetFor(personId);
  return [
    ...(ruler ? [{ aspect: "rule" as const, id: ruler.id, summary: ruler }] : []),
    ...(apostle ? [{ aspect: "mission" as const, id: apostle.id, summary: apostle }] : []),
    ...(prophet ? [{ aspect: "word" as const, id: prophet.id, summary: prophet }] : []),
  ];
}

/** One special page of a person, by its aspect. */
export const specialPageOf = (personId: string, aspect: Aspect): SpecialPage | undefined => specialPagesOf(personId).find((page) => page.aspect === aspect);

/** Prophets of one era, in story order (the word pages' arrows). */
export const prophetsOfEra = (era: ProphetEra): ProphetSummary[] => PEOPLE_PAGES.prophets.filter((p) => p.era === era).sort((a, b) => a.order - b.order);

/**
 * Rulers in the order of their reigns: by their years where they have them, an undated ruler by the dated neighbour in
 * their own group's story order (Joseph's Pharaoh before Shishak; Lysanias after Pilate). Ties fall back to the group,
 * then its order, so two groups that share a realm (the Herods and the Romans; Gedaliah among Babylon's kings) never
 * interleave out of turn.
 */
export function inLineOrder(rulers: RulerSummary[]): RulerSummary[] {
  const year = new Map<string, number>();
  const groups = new Map<string, RulerSummary[]>();
  for (const r of rulers) groups.set(`${r.group}|${r.realm}`, [...(groups.get(`${r.group}|${r.realm}`) ?? []), r]);
  for (const list of groups.values()) {
    list.sort((a, b) => a.order - b.order);
    const own = list.map((r) => r.dates?.from);
    list.forEach((r, i) => {
      let found = own[i];
      for (let j = i - 1; found === undefined && j >= 0; j--) found = own[j];
      for (let j = i + 1; found === undefined && j < list.length; j++) found = own[j];
      if (found !== undefined) year.set(r.id, found);
    });
  }
  return [...rulers].sort((a, b) => {
    const ya = year.get(a.id) ?? Infinity, yb = year.get(b.id) ?? Infinity;
    if (ya !== yb) return yb > ya ? 1 : -1;
    if (a.group !== b.group) return a.group < b.group ? -1 : 1;
    return a.order - b.order;
  });
}

/** Rulers of one realm, in the order of their reigns (inLineOrder). */
export const rulersOfRealm = (realm: Realm): RulerSummary[] => inLineOrder(PEOPLE_PAGES.rulers.filter((r) => r.realm === realm));

/** The middle year of a reign (BC positive), or undefined when no dates are given. */
export const reignMiddle = (ruler: RulerSummary): number | undefined => (ruler.dates ? (ruler.dates.from + ruler.dates.to) / 2 : undefined);

/** The order for wiping between two rulers: earlier reigns first (larger BC years), then the order in their line. */
export function timeRank(ruler: RulerSummary): number {
  const year = ruler.dates?.from ?? ruler.near;
  return year !== undefined ? -year + ruler.order / 1000 : ruler.order;
}
