// What the landing says, computed from the data: the figures, the search over names and towns, and the three famous
// works to start reading (ported from the mock-up's landing.js).
import type { KnownWork, Person } from "@/data/teachers/pages-types";
import { THIS_YEAR, formatNumber } from "../../shared/people";

export interface Figure { label: string; value: string; note: string }
export function figuresOf(people: Person[]): Figure[] {
  const works = people.reduce((s, p) => s + p.works, 0), sermons = people.reduce((s, p) => s + (p.genres.sermon ?? 0), 0);
  const living = people.filter((p) => !p.died).length, first = Math.min(...people.map((p) => p.born));
  return [
    { label: "Teachers", value: String(people.length), note: `${living} still living` },
    { label: "Works", value: formatNumber(works), note: "in the library" },
    { label: "Sermons", value: formatNumber(sermons), note: "among those works" },
    { label: "Since", value: String(first), note: `${THIS_YEAR - first} years to today` },
  ];
}

export const JUMPS: [string, string][] = [["bible", "Through the Bible"], ["cities", "Where they served"], ["lives", "When they lived"], ["directory", "Everyone"]];

export interface SearchHit { person: Person; town: string }
/** Names first, then any town they lived in; an empty query finds nothing. */
export function searchPeople(people: Person[], query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const person of people) {
    if (person.name.toLowerCase().includes(q)) { hits.push({ person, town: "" }); continue; }
    const town = person.places.find((place) => place[0].toLowerCase().includes(q));
    if (town) hits.push({ person, town: town[0] });
  }
  return hits;
}
export const RESULTS_SHOWN = 7;

export interface Read { person: Person; work: KnownWork & { u: string } }
// Three famous works the library holds and can open, across three centuries (kept only if the data still says so).
const READS: [string, string][] = [["Calvin", "Institutes"], ["Edwards", "Religious Affections"], ["Spurgeon", "Morning and Evening"]];
export function readsOf(people: Person[]): Read[] {
  const reads: Read[] = [];
  for (const [short, title] of READS) {
    const person = people.find((x) => x.short === short);
    const work = person?.known.find((w) => w.t.includes(title) && w.inLibrary && w.u);
    if (person && work?.u) reads.push({ person, work: { ...work, u: work.u } });
  }
  return reads;
}

const COUNT_WORDS: Record<number, string> = { 2: "Two", 3: "Three", 47: "Forty-seven" };
export const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);
