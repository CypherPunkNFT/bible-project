// 04 · Who was alive at the same time: the numbers behind the chart and the side panel (no drawing here).
import type { MapView, PeopleData, Person, Point } from "@/data/teachers/pages-types";
import { FAMILIES, THIS_YEAR, lifeEnd, placeIn, type Family } from "../../shared/people";

export const START = 1500;
export const END = THIS_YEAR;
/** Years per second while playing. */
export const RATE = 16;
/** The year the chart opens on; the first-view sweep runs up to it from SWEEP_FROM. */
export const OPEN_YEAR = 1660;
export const SWEEP_FROM = 1560;

export type Mode = "birth" | "family";
export type MapName = "europe" | "atlantic";
export type ViewChoice = "auto" | MapName;

/** Sizes of the chart, wider or narrower screens. */
export interface Geometry { narrow: boolean; padL: number; padR: number; top: number; pitch: number; head: number; font: number }
export interface Head { label: string; tone?: string; y: number }
export interface Layout { ys: Float32Array; heads: Head[]; height: number }
/** Where someone was living in a year; `unknown` = alive, but the place before their first recorded one is not known. */
export interface Where { name: string | null; index: number; unknown: boolean }
export interface AliveEntry { person: Person; index: number; at: Where }

export const geometry = (width: number): Geometry => {
  const narrow = width < 640;
  return { narrow, padL: narrow ? 50 : 72, padR: narrow ? 12 : 18, top: 26, pitch: narrow ? 9 : 10, head: narrow ? 15 : 17, font: narrow ? 9 : 11 };
};
export const xOf = (g: Geometry, width: number, year: number) => g.padL + ((year - START) / (END - START)) * (width - g.padL - g.padR);
export const yearAt = (g: Geometry, width: number, x: number) => START + ((x - g.padL) / (width - g.padL - g.padR)) * (END - START);
export const isAlive = (person: Person, year: number) => person.born <= year && year <= lifeEnd(person);

/** For people whose first recorded place is not their birthplace (Watson, White), the years before they arrived there
 *  are "place not recorded", never their first place. */
export function whereIn(person: Person, year: number): Where | null {
  if (year < person.born || year > lifeEnd(person)) return null;
  if (person.birthplaceKnown === false && year < person.places[0][3]) return { name: null, index: -1, unknown: true };
  const at = placeIn(person, year);
  return at ? { name: at.name, index: at.index, unknown: false } : null;
}

interface Group { label: string; tone?: string; members: number[] }
/** Rows grouped by century of birth, or by tradition. */
function groups(people: Person[], fams: Family[], mode: Mode): Group[] {
  if (mode === "family") {
    return FAMILIES.map((f) => ({ label: f.label, tone: f.tone, members: people.map((_, i) => i).filter((i) => fams[i].key === f.key) }))
      .filter((group) => group.members.length);
  }
  const byCentury = new Map<number, number[]>();
  people.forEach((person, i) => {
    const century = Math.floor(person.born / 100) * 100;
    byCentury.set(century, [...(byCentury.get(century) ?? []), i]);
  });
  return [...byCentury].map(([century, members]) => ({ label: `Born in the ${century}s`, members }));
}

/** Row heights for one order; both orders take the same total height, so switching never moves the page. */
export function layout(people: Person[], fams: Family[], mode: Mode, g: Geometry): Layout {
  const most = Math.max(groups(people, fams, "birth").length, groups(people, fams, "family").length);
  const list = groups(people, fams, mode), gap = (g.head * most) / list.length, ys = new Float32Array(people.length), heads: Head[] = [];
  let y = g.top;
  for (const group of list) {
    heads.push({ label: group.label, tone: group.tone, y: y + gap * 0.48 });
    y += gap;
    for (const i of group.members) { ys[i] = y + g.pitch / 2; y += g.pitch; }
  }
  return { ys, heads, height: Math.ceil(y + 8) };
}

export const aliveIn = (people: Person[], year: number): AliveEntry[] =>
  people.flatMap((person, index) => { const at = whereIn(person, year); return at ? [{ person, index, at }] : []; });

const pinKey = (entry: AliveEntry) => `${entry.person.id}#${entry.at.index}`;

/** "Follow": Europe when everyone mapped fits on it, otherwise the Atlantic. */
export function chooseView(list: AliveEntry[], views: PeopleData["views"], choice: ViewChoice): MapName {
  if (choice !== "auto") return choice;
  const mapped = list.filter((x) => !x.at.unknown && (views.atlantic.places[pinKey(x)] || views.europe.places[pinKey(x)]));
  return mapped.length && mapped.every((x) => views.europe.places[pinKey(x)]) ? "europe" : "atlantic";
}

export interface CityLabel { name: string; x: number; y: number }
export interface MapPins { pins: Map<number, Point>; labels: CityLabel[]; off: number }

/** Where each living person's pin goes (people in one city sit in a small spiral), and which city names fit. */
export function placePins(list: AliveEntry[], view: MapView): MapPins {
  const pins = new Map<number, Point>(), perCity = new Map<string, number>(), cities = new Map<string, { x: number; y: number; n: number }>();
  let off = 0;
  for (const entry of list) {
    if (entry.at.unknown || entry.at.name === null) continue;
    const xy = view.places[pinKey(entry)];
    if (!xy) { off++; continue; }
    const k = perCity.get(entry.at.name) ?? 0;
    perCity.set(entry.at.name, k + 1);
    const angle = k * 2.4, r = k ? 13 + k * 2 : 0;
    pins.set(entry.index, [xy[0] + Math.cos(angle) * r, xy[1] + Math.sin(angle) * r]);
    const city = cities.get(entry.at.name) ?? { x: xy[0], y: xy[1], n: 0 };
    city.n++;
    cities.set(entry.at.name, city);
  }
  // City names: busiest first, skipping any that would overlap one already placed.
  const placed: { x: number; y: number; w: number; h: number }[] = [], labels: CityLabel[] = [];
  for (const [name, c] of [...cities].sort((a, b) => b[1].n - a[1].n)) {
    const w = name.length * 15 + 10, box = { x: c.x + 16, y: c.y - 14, w, h: 28 };
    if (box.x + w > 1000) box.x = c.x - 16 - w;
    if (placed.some((b) => box.x < b.x + b.w && b.x < box.x + box.w && box.y < b.y + b.h && b.y < box.y + box.h)) continue;
    placed.push(box);
    labels.push({ name, x: box.x, y: c.y + 9 });
  }
  return { pins, labels, off };
}
