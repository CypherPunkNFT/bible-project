// What the Fellowships page derives from fellowships.json and fellowship-cities.json: a fellowship's short name, the
// words for who it is for and how it meets, its cost in a few words, and each researched gathering in the shape the
// Help for life city map draws (so both pages share one map). Every word shown still comes from the data.
import type { City, Fellowship, FellowshipCity, Gathering, LocalHelp } from "@/data/resources";
import { kindOf, plural, type CityWords } from "../life/format";

/** "Bible Study Fellowship (BSF)" -> "BSF"; "9Marks Church Search" -> "9Marks"; otherwise the name as written. */
export function shortName(name: string) {
  const abbreviation = name.match(/\(([A-Z0-9]{2,6})\)\s*$/)?.[1];
  if (abbreviation) return abbreviation;
  return name.replace(/\s+(Church Search|Church Directory|Ministries International|Ministries Church Search|Christian Fellowship\/USA|International|Task Force)$/, "").replace(/^The /, "");
}

/** "all" in the data means open to anyone. */
export const sentence = (text: string) => (text === "all" ? "Anyone" : text.charAt(0).toUpperCase() + text.slice(1));

/** The cost in a few words for a closed row: its first clause, or the whole when it is already short. */
export function shortCost(cost?: string) {
  if (!cost) return undefined;
  const first = cost.split(/\s\(|\.\s|;\s/)[0].replace(/\.$/, "");
  return first.length <= 60 ? first : undefined;
}

/** The audiences, in the order a reader looks for themselves. */
export const AUDIENCES = ["men", "women", "children", "youth", "students", "young adults", "mothers", "all"] as const;

/** A gathering as a place on the shared city map: the host's name, what meets there and when, its page and its finder. */
export function toPlace(g: Gathering, f: Fellowship | undefined, kind: string): LocalHelp {
  const what = [g.name, g.when].filter(Boolean).join(", ");
  const contact = [
    ...(g.link ? [{ kind: "web", value: g.link, note: "Its own page" }] : []),
    ...(f?.locator && f.locator !== g.link ? [{ kind: "web", value: f.locator, note: `${shortName(f.name)} group finder` }] : []),
  ];
  return {
    id: g.id, name: g.host, summary: `${what}. ${f ? `${f.name}: ${f.summary}` : ""}`.trim(), faith: null, contact,
    // A church search costs nothing to use, which says nothing about the church: its place reads "Open to anyone" (its "for").
    hours: g.when ?? undefined, cost: kind === "church-finders" ? (g.for.includes("all") ? "Open to anyone" : undefined) : shortCost(f?.cost), source: g.source, checked: g.checked,
    category: kind, address: g.address, lat: g.lat, lon: g.lon, geocode: g.geocode,
  };
}

/** A researched city in the shape the shared city section draws. */
export function toCity(c: FellowshipCity, fellowship: (id: string) => { f?: Fellowship; kind: string }): City {
  const entries = c.places.map((g) => { const { f, kind } = fellowship(g.fellowship); return toPlace(g, f, kind); });
  return { id: c.id, name: c.name, lat: c.lat, lon: c.lon, centre: c.centre, centreLabel: c.centreLabel, checked: c.checked, verified: true, entries };
}

/** The shared city section's words for gatherings, with the fellowship's short name before each distance. */
export function gatheringWords(fellowshipOf: (placeId: string) => string): CityWords {
  return {
    kick: "02 · Where they meet",
    lead: (places) => `${plural(places, "place")} where these fellowships meet, each listed by the fellowship’s own finder and found on the map by its street address.`,
    title: (place) => `Gather in ${place}`,
    count: (places) => `${plural(places, "place")} on the map · tap a pin or a row`,
    tag: (e) => fellowshipOf(e.id) || kindOf(e.category).short,
  };
}
