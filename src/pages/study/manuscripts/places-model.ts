// "Where are they now?" look-ups (approved mock-up: js/places.js): the cities that hold the manuscripts, their continents
// and colours, and what kind of place each holder is, read from its name.
import type { ManuscriptCollection, MsHolder, MsRecord } from "@/lib/manuscripts";
import { byDate } from "./model";

export const CONTINENTS: [string, string][] = [["Europe", "Europe"], ["Near East", "The Near East and the Caucasus"], ["North America", "North America"]];
const CONTINENT_OF: Record<string, string> = { Egypt: "Near East", Israel: "Near East", Syria: "Near East", Georgia: "Near East", Armenia: "Near East", "United States": "North America" };
export const continentOf = (country: string) => CONTINENT_OF[country] ?? "Europe";
/** Each continent has its own colour on the map, repeated as a key beside its name above the cards (owner 2026-10-18). */
export const TONE: Record<string, string> = { Europe: "--prophets", "Near East": "--history", "North America": "--poetry" };

export type HolderKindKey = "monastery" | "museum" | "treasury" | "library" | "university";
/** What kind of place keeps them, read from the holder's name, checked in order (owner 2026-10-18: an icon for each kind):
 *  "Grottaferrata Abbey Library" is a monastery, "Berlin State Museums and Library" a museum, and a name that says
 *  library is a library even inside a university; what is left is a university. */
export const HOLDER_KINDS: [HolderKindKey, string, RegExp][] = [
  ["monastery", "Monastery", /monaster|abbey|saint catherine/i],
  ["museum", "Museum", /museum|gallery|bodmer/i],
  ["treasury", "Mosque treasury", /qubbat/i],
  ["library", "Library", /librar|bibliot|matenadaran|centre of manuscripts/i],
  ["university", "University", /./],
];
export function holderKind(name: string): [HolderKindKey, string] {
  const found = HOLDER_KINDS.find(([, , test]) => test.test(name));
  if (!found) throw new Error(`Where are they now: no holder kind matches "${name}"`);
  return [found[0], found[1]];
}

/** Cities close together on the map get their labels on different sides. */
export const SIDE: Record<string, string> = { Oxford: "w", London: "e", Cambridge: "n", "Cambridge, Massachusetts": "e", "New Haven": "w", "New York": "s", Princeton: "w", "Washington, D.C.": "e" };
export const shortCity = (name: string) => name.replace(", North Carolina", ", N.C.").replace(", Massachusetts", ", Mass.");

export interface City { city: string; country: string; lat: number; lon: number; holders: MsHolder[]; records: MsRecord[]; n: number }

/** The cities, each with its holders and its records oldest first, biggest first. */
export function cityTable(data: ManuscriptCollection): City[] {
  const byCity = new Map<string, City>();
  for (const h of data.holders) {
    const c = byCity.get(h.city) ?? { city: h.city, country: h.country, lat: h.lat, lon: h.lon, holders: [], records: [], n: 0 };
    c.holders.push(h); byCity.set(h.city, c);
  }
  for (const c of byCity.values()) {
    const ids = new Set(c.holders.map((h) => h.id));
    c.records = data.records.filter((r) => r.h?.some((id) => ids.has(id))).sort(byDate);
    c.n = c.records.length;
  }
  return [...byCity.values()].sort((a, b) => b.n - a.n);
}
