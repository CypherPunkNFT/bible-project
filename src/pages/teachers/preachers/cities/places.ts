// The place maths for "Cities that gathered them": each person's stays, the towns where two or more of them lived,
// and the projections fitted to the pre-projected map views (copied from the mock-up's "Their world" geo maths).
import type { PeopleData, Person, Point } from "@/data/teachers/pages-types";
import { lifeEnd, THIS_YEAR } from "../../shared/people";

export type CityView = "europe" | "america";
export type Projector = (lon: number, lat: number) => Point;

export interface Stay {
  person: Person;
  name: string;
  lat: number;
  lon: number;
  /** Index of this place in person.places. */
  index: number;
  bornHere: boolean;
  from: number;
  to: number;
  cameFrom: string | null;
  returned: boolean;
}
export interface City { name: string; lat: number; lon: number; stays: Stay[]; first: number; last: number; view: CityView }

const RAD = Math.PI / 180;
const mercator = (lon: number, lat: number): Point => [lon, Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];

/** Least-squares line b ≈ k·a + c, returned as [k, c]. */
function fitLine(a: number[], b: number[]): [number, number] {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n, meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - meanA) * (b[i] - meanB); den += (a[i] - meanA) ** 2; }
  if (!den) throw new Error(`Teachers · cities: cannot fit a map projection from ${n} point(s) that share one coordinate`);
  return [num / den, meanB - (num / den) * meanA];
}

/** A projection fitted to a map view: the view lists already-projected places ("personId#index" → [x, y]). */
export function fitView(data: PeopleData, name: CityView): Projector {
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const pairs: [Point, Point][] = [];
  for (const [key, xy] of Object.entries(data.views[name].places)) {
    const [id, index] = key.split("#");
    const place = byId.get(id)?.places[Number(index)];
    if (place) pairs.push([mercator(place[2], place[1]), xy]);
    else console.warn(`Teachers · cities: the ${name} map lists "${key}", which matches no person's place`);
  }
  const [kx, bx] = fitLine(pairs.map((p) => p[0][0]), pairs.map((p) => p[1][0]));
  const [ky, by] = fitLine(pairs.map((p) => p[0][1]), pairs.map((p) => p[1][1]));
  return (lon, lat) => { const [x, y] = mercator(lon, lat); return [kx * x + bx, ky * y + by]; };
}

/** A person's stays: each place from the year they arrived to the next arrival (or the end of their life). When the
 *  birthplace is unknown, the first place is only the earliest known one, counted from the year they arrived there. */
function staysOf(person: Person): Stay[] {
  const knowsBirthplace = person.birthplaceKnown !== false;
  return person.places.map((place, i) => {
    const birth = i === 0 && knowsBirthplace;
    return {
      person, name: place[0], lat: place[1], lon: place[2], index: i, bornHere: birth,
      from: birth ? person.born : place[3],
      to: i + 1 < person.places.length ? person.places[i + 1][3] : lifeEnd(person),
      cameFrom: i === 0 ? null : person.places[i - 1][0],
      returned: false,
    };
  });
}

/** Towns where two or more teachers lived, with each teacher's stay there (counted once per town). */
export function sharedCities(data: PeopleData): City[] {
  const byName = new Map<string, { name: string; lat: number; lon: number; stays: Stay[] }>();
  for (const person of data.people) {
    for (const stay of staysOf(person)) {
      let city = byName.get(stay.name);
      if (!city) { city = { name: stay.name, lat: stay.lat, lon: stay.lon, stays: [] }; byName.set(stay.name, city); }
      const mine = city.stays.find((s) => s.person === person);
      if (mine) { mine.to = Math.max(mine.to, stay.to); mine.returned = true; continue; }
      city.stays.push(stay);
    }
  }
  return [...byName.values()].filter((c) => c.stays.length >= 2).map((c): City => {
    const stays = [...c.stays].sort((a, b) => a.from - b.from);
    const view: CityView = data.views.europe.places[`${stays[0].person.id}#${stays[0].index}`] ? "europe" : "america";
    return { ...c, stays, first: stays[0].from, last: Math.max(...stays.map((s) => s.to)), view };
  }).sort((a, b) => b.stays.length - a.stays.length || a.first - b.first);
}

export const yearsLabel = (c: City) => `${c.first}–${c.last >= THIS_YEAR ? "today" : c.last}`;
export const countLabel = (n: number) => `${n} ${n === 1 ? "teacher" : "teachers"}`;
export const viewCaption = (view: CityView) => (view === "europe" ? "Britain and western Europe" : "Eastern United States");
