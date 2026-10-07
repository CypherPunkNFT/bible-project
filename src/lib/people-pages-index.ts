import indexJson from "@/data/people-pages/index.json";
import type { Realm, RulerKind } from "@/data/people-pages/types";

/**
 * A small summary of every ruler and apostle page, generated from the group files by
 * scripts/build-people-pages-index.py (src/data/people-pages/index.json). It is bundled, so the person page's entry
 * card, the two guides and the succession arrows know every page without loading every group file.
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
  personIds?: string[];
  home?: string;
  trade?: string;
  called?: string;
  ending?: string;
  tradition?: string;
  lists?: { book: "MAT" | "MRK" | "LUK" | "ACT"; position: number; name: string }[];
  writings?: string[];
}

export interface PeoplePagesIndex {
  groups: { id: string; title: string; rulers: number; apostles: number }[];
  rulers: RulerSummary[];
  apostles: ApostleSummary[];
}

export const PEOPLE_PAGES = indexJson as unknown as PeoplePagesIndex;

const rulerById = new Map<string, RulerSummary>();
for (const ruler of PEOPLE_PAGES.rulers) for (const id of [ruler.id, ...(ruler.personIds ?? [])]) if (!rulerById.has(id)) rulerById.set(id, ruler);
const apostleById = new Map<string, ApostleSummary>();
for (const apostle of PEOPLE_PAGES.apostles) for (const id of [apostle.id, ...(apostle.personIds ?? [])]) if (!apostleById.has(id)) apostleById.set(id, apostle);

/** The ruler page for a person id (its own id, or another record of the same person). */
export const rulerFor = (personId: string): RulerSummary | undefined => rulerById.get(personId);
export const apostleFor = (personId: string): ApostleSummary | undefined => apostleById.get(personId);

/** A king named elsewhere on the site opens his rule page when there is one, else his person page. */
export function rulerHref(personId: string): string {
  const ruler = rulerFor(personId);
  return ruler ? `/people/${ruler.id}/rule` : `/people/${personId}`;
}

export type Aspect = "rule" | "mission";
export const isAspect = (value: string | undefined): value is Aspect => value === "rule" || value === "mission";

/** The person's page address, or one of their special pages. */
export const personPath = (id: string, aspect?: Aspect) => (aspect ? `/people/${id}/${aspect}` : `/people/${id}`);

/** Rulers of one realm, in order. */
export const rulersOfRealm = (realm: Realm): RulerSummary[] => PEOPLE_PAGES.rulers.filter((r) => r.realm === realm).sort((a, b) => a.order - b.order);

/** The middle year of a reign (BC positive), or undefined when no dates are given. */
export const reignMiddle = (ruler: RulerSummary): number | undefined => (ruler.dates ? (ruler.dates.from + ruler.dates.to) / 2 : undefined);

/** The order for wiping between two rulers: earlier reigns first (larger BC years), then the order in their line. */
export function timeRank(ruler: RulerSummary): number {
  return ruler.dates ? -ruler.dates.from + ruler.order / 1000 : ruler.order;
}
