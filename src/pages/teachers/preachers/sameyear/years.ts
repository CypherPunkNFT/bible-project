// "Same year, different worlds": who was alive in a year and the town each was living in (ported from the mock-up's
// sameyear.js).
import type { Person } from "@/data/teachers/pages-types";
import { THIS_YEAR, lifeEnd, placeIn } from "../../shared/people";

export const PRESETS = [1560, 1650, 1740, 1850, 1890, 1960];
export const START_YEAR = 1650;

export const aliveIn = (people: Person[], year: number) => people.filter((p) => year >= p.born && year <= lifeEnd(p));
export const firstBirth = (people: Person[]) => Math.min(...people.map((p) => p.born));

/** The shaded chart behind the slider: how many were alive in each year, as one SVG path 60 units high. */
export function histogramOf(people: Person[]) {
  const first = firstBirth(people), counts: number[] = [];
  for (let y = first; y <= THIS_YEAR; y++) counts.push(aliveIn(people, y).length);
  const max = Math.max(...counts), width = THIS_YEAR - first;
  const path = `M0 60${counts.map((c, i) => `L${i} ${(60 - (c / max) * 54).toFixed(1)}`).join("")}L${width} 60Z`;
  return { path, max, width };
}

export interface PlaceGroup { place: string; people: Person[] }
/** Everyone alive in the year, gathered by where they were living; the busiest places first. */
export function groupsIn(people: Person[], year: number): PlaceGroup[] {
  const groups = new Map<string, Person[]>();
  for (const p of aliveIn(people, year)) {
    // Someone whose birthplace is not recorded is never placed anywhere before their earliest known place.
    const place = p.birthplaceKnown === false && year < p.places[0][3] ? "Place not recorded" : placeIn(p, year)?.name ?? "Place not recorded";
    groups.set(place, [...(groups.get(place) ?? []), p]);
  }
  return [...groups].map(([place, list]) => ({ place, people: list }))
    .sort((a, b) => b.people.length - a.people.length || a.people[0].born - b.people[0].born);
}

/** "born this year", "died this year", or the age they turn (about, when the birth year is approximate). */
export function ageNote(person: Person, year: number) {
  const age = year - person.born;
  if (age === 0) return "born this year";
  if (person.died === year) return "died this year";
  return `${person.circa ? "about " : "turns "}${age}`;
}
