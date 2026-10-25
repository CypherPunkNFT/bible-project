// Everything around Moses, by category (people, places, topics, passages) and, inside each, by relationship: the
// rings of one field. People keep section 03's hand-checked rings (family, beside him, against him, who speaks of him)
// and add everyone else his verses name; places follow his road through the three forties (the Atlas section's data);
// topics and passages are sorted by fixed rules on their names and books, never by a model.
import type { Catalog } from "@/lib/types";
import { chapterName } from "./field-layout";
import type { Entity, GraphIndex, Kind, LinkedChapter } from "./graph-data";

export type CategoryKey = Kind | "x";
export interface RingDef { key: string; label: string; tone: string; total: number }
export interface AroundPoint {
  key: string; ring: string; kind: CategoryKey; id: string; label: string; weight: number; evidence: number[]; links: string[];
  role?: string; claims?: string[]; quote?: { text: string; span: number[] }; chapter?: LinkedChapter;
}
export interface Category { key: CategoryKey; label: string; total: number; rings: RingDef[]; points: AroundPoint[] }

/** The parts of the Moses page's own data this reads (components/moses-page/data). */
export interface MosesData {
  people: { nodes: { id: string; ring: string; label: string; role: string; claims: { text: string }[]; quote: { text: string; span: number[] } | null; verses: (number[] | { ref: number[] })[]; links: string[] }[] };
  route: { placeId: string; name: string; act: number; verse: { ref: number[] } }[];
}

/** A verse span [first, last] (or { ref: span }) as verse numbers (book * 1,000,000 + chapter * 1,000 + verse), within one chapter. */
function versesOf(span: number[] | { ref: number[] }): number[] {
  const [first, last = first] = Array.isArray(span) ? span : span.ref;
  const out: number[] = [];
  for (let v = first; v <= last && Math.floor(v / 1000) === Math.floor(first / 1000) && out.length < 200; v += 1) out.push(v);
  return out;
}

const byWeight = (a: AroundPoint, b: AroundPoint) => b.weight - a.weight;

function people(entity: Entity, data: MosesData): Category {
  const graph = new Map(entity.p.map((row) => [row[0], row]));
  const curated: AroundPoint[] = data.people.nodes.map((n) => {
    const row = graph.get(n.id);
    const evidence = [...new Set([...(row?.[3] ?? []), ...n.verses.flatMap(versesOf)])];
    return { key: n.id, ring: n.ring, kind: "p", id: n.id, label: n.label, weight: row?.[2] ?? evidence.length, evidence, links: n.links,
      role: n.role, claims: n.claims.map((c) => c.text), quote: n.quote ?? undefined };
  });
  // Someone already in a hand-checked ring (by record, or by name, as "Jesus" is under who speaks of him) is not repeated.
  const taken = new Set(curated.flatMap((p) => [p.id, p.label]));
  const named = entity.p.filter((row) => !taken.has(row[0]) && !taken.has(row[1])).map(([id, label, weight, evidence]): AroundPoint =>
    ({ key: id, ring: "named", kind: "p", id, label, weight, evidence, links: [] }));
  const count = (ring: string) => curated.filter((p) => p.ring === ring).length;
  const rings: RingDef[] = [
    { key: "family", label: "Family", tone: "var(--acts)", total: count("family") },
    { key: "with", label: "Beside him", tone: "var(--poetry)", total: count("with") },
    { key: "against", label: "Against him", tone: "var(--revelation)", total: count("against") },
    { key: "speak", label: "Who speaks of him", tone: "var(--gospels)", total: count("speak") },
    { key: "named", label: "Named with him", tone: "var(--history)", total: entity.pN - (entity.p.length - named.length) },
  ];
  return { key: "p", label: "People", total: entity.fam.length + entity.pN, rings, points: [...curated, ...named.sort(byWeight)] };
}

function places(entity: Entity, data: MosesData): Category {
  const graph = new Map(entity.l.map((row) => [row[0], row]));
  const ACT = ["", "egypt", "midian", "wild"];
  const seen = new Set<string>();
  const road: AroundPoint[] = data.route.filter((stop) => !seen.has(stop.placeId) && seen.add(stop.placeId)).map((stop) => {
    const row = graph.get(stop.placeId);
    return { key: stop.placeId, ring: ACT[stop.act], kind: "l", id: stop.placeId, label: stop.name, weight: row?.[2] ?? 1,
      evidence: [...new Set([...versesOf(stop.verse.ref), ...(row?.[3] ?? [])])], links: [] };
  });
  const named = entity.l.filter((row) => !seen.has(row[0])).map(([id, label, weight, evidence]): AroundPoint =>
    ({ key: id, ring: "named", kind: "l", id, label, weight, evidence, links: [] }));
  const count = (ring: string) => road.filter((p) => p.ring === ring).length;
  const rings: RingDef[] = [
    { key: "egypt", label: "Egypt · years 0–40", tone: "var(--egypt)", total: count("egypt") },
    { key: "midian", label: "Midian · years 40–80", tone: "var(--midian)", total: count("midian") },
    { key: "wild", label: "The wilderness · 80–120", tone: "var(--wild)", total: count("wild") },
    { key: "named", label: "Named with him", tone: "var(--poetry)", total: entity.lN - (entity.l.length - named.length) },
  ];
  return { key: "l", label: "Places", total: entity.lN, rings, points: [...road, ...named.sort(byWeight)] };
}

/** Topics by what they are named for: a place or nation (checked first), a person, or anything else (a theme). A name
 *  only counts when the topic is at most ten times that place's or person's size, so "Sin" the theme (1,816 verses)
 *  is not the town of Sin, while "Sin" the wilderness (37) is. */
function topics(entity: Entity, index: GraphIndex): Category {
  const size = { p: new Map<string, number>(), l: new Map<string, number>() };
  for (const [key, [name, verses]] of Object.entries(index.entities)) {
    if (key[0] === "p" || key[0] === "l") size[key[0]].set(name, Math.max(size[key[0]].get(name) ?? 0, verses));
  }
  const ringOf = (id: string, label: string) => {
    const bare = label.replace(/^The /, "");
    const verses = index.entities[`t:${id}`]?.[1] ?? 0;
    const fits = (kind: "p" | "l") => verses <= 10 * (size[kind].get(bare) ?? 0);
    return fits("l") || /(ites|ians|ines)$/.test(bare) ? "places" : fits("p") ? "people" : "themes";
  };
  const points = entity.t.filter((row) => row[1] !== entity.n).map(([id, label, weight, evidence]): AroundPoint =>
    ({ key: id, ring: ringOf(id, label), kind: "t", id, label, weight, evidence, links: [] }));
  const count = (ring: string) => points.filter((p) => p.ring === ring).length;
  const rings: RingDef[] = [
    { key: "people", label: "About people", tone: "var(--history)", total: count("people") },
    { key: "places", label: "About places and nations", tone: "var(--poetry)", total: count("places") },
    { key: "themes", label: "Themes", tone: "var(--prophets)", total: count("themes") },
  ];
  return { key: "t", label: "Topics", total: entity.tN - 1, rings, points: points.sort(byWeight) };
}

/** Chapters his verses point to: within the Law (Genesis–Deuteronomy), the rest of the Old Testament, the New. */
function passages(entity: Entity, catalog: Catalog): Category {
  const point = (ring: string) => (c: LinkedChapter): AroundPoint =>
    ({ key: `x${c[0]}`, ring, kind: "x", id: String(c[0]), label: chapterName(catalog, c[0]), weight: c[2], evidence: c[3].map((pair) => pair[0]), links: [], chapter: c });
  const book = (c: LinkedChapter) => Math.floor(c[0] / 1000);
  const points = [
    ...entity.x.filter((c) => book(c) <= 5).map(point("law")),
    ...entity.x.filter((c) => book(c) > 5 && book(c) <= 39).map(point("ot")),
    ...entity.xo.map(point("nt")),
  ].sort(byWeight);
  const count = (ring: string) => points.filter((p) => p.ring === ring).length;
  const rings: RingDef[] = [
    { key: "law", label: "Within the Law", tone: "var(--accent)", total: count("law") },
    { key: "ot", label: "The rest of the Old Testament", tone: "var(--poetry)", total: count("ot") },
    { key: "nt", label: "The New Testament, looking back", tone: "var(--gospels)", total: entity.xoN },
  ];
  return { key: "x", label: "Passages", total: entity.xN, rings, points };
}

export function aroundMoses(entity: Entity, data: MosesData, index: GraphIndex, catalog: Catalog): Category[] {
  return [people(entity, data), places(entity, data), topics(entity, index), passages(entity, catalog)];
}
