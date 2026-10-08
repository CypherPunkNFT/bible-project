// 05 · Did their lives cross?: where each person lived, year by year, and the cities two people shared at the same time.
import type { Person } from "@/data/teachers/pages-types";
import { lifeEnd } from "../../shared/people";

/** One place a person lived, as a span of years: from arrival until the next arrival (or their death).
 *  `end` is exclusive, so a person who died in 1747 is in their last place for the year 1747 itself. */
export interface Stay { name: string; index: number; start: number; end: number; until: number; last: boolean }
export interface SharedPlace { name: string; start: number; until: number }
export interface Suggestion { a: Person; b: Person; place: string; years: number }

export const FIRST_PAIR = { a: "author-john-calvin", b: "author-john-knox" };

export const stays = (p: Person): Stay[] => p.places.map((place, i) => {
  const last = i === p.places.length - 1;
  return { name: place[0], index: i, start: place[3], end: last ? lifeEnd(p) + 1 : p.places[i + 1][3], until: last ? lifeEnd(p) : p.places[i + 1][3], last };
});

/** Cities where both lived at the same time (from the year each arrived until they moved on or died). */
export function sharedPlaces(p: Person, q: Person): SharedPlace[] {
  const out: SharedPlace[] = [];
  for (const x of stays(p)) for (const y of stays(q)) {
    if (x.name !== y.name) continue;
    const start = Math.max(x.start, y.start), end = Math.min(x.end, y.end);
    if (end > start) out.push({ name: x.name, start, until: Math.min(x.until, y.until) });
  }
  return out.sort((m, n) => m.start - n.start);
}

/** The years both were alive (e < s when their lives never overlapped). */
export const overlap = (p: Person, q: Person) => ({ s: Math.max(p.born, q.born), e: Math.min(lifeEnd(p), lifeEnd(q)) });

/** Suggested pairs: teachers who really shared a city, longest first, no one twice; Calvin and Knox lead. */
export function suggestions(people: Person[]): Suggestion[] {
  const all: Suggestion[] = [];
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const shared = sharedPlaces(people[i], people[j]);
    if (shared.length) all.push({ a: people[i], b: people[j], place: shared[0].name, years: shared.reduce((n, x) => n + Math.max(1, x.until - x.start), 0) });
  }
  all.sort((m, n) => n.years - m.years);
  const used = new Set([FIRST_PAIR.a, FIRST_PAIR.b]);
  const first = all.find((x) => x.a.id === FIRST_PAIR.a && x.b.id === FIRST_PAIR.b);
  const out: Suggestion[] = first ? [first] : [];
  for (const x of all) {
    if (out.length >= 6) break;
    if (used.has(x.a.id) || used.has(x.b.id)) continue;
    used.add(x.a.id);
    used.add(x.b.id);
    out.push(x);
  }
  return out;
}

/** People grouped by the century they were born in, for the two pickers. */
export function byCentury(people: Person[]): [number, Person[]][] {
  const groups = new Map<number, Person[]>();
  for (const p of people) { const c = Math.floor(p.born / 100) * 100; groups.set(c, [...(groups.get(c) ?? []), p]); }
  return [...groups];
}
