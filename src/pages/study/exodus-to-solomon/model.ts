// Israel from the exodus to Solomon: the research record, the generated verses, cords and bars
// (scripts/build-exodus-to-solomon-study.py), and the address values the page accepts. Every address value is looked up in a
// Map or a fixed set, so an unknown one falls back to its default and nothing here throws while the page loads.
import dossier from "../../../../content/academic-research/38-israel-from-the-exodus-to-solomon.json";
import generated from "./exodus-to-solomon-data.json";
import { plainText } from "@/pages/study/check-notes/checked";

/** A verse by its place, with the Berean's own footnotes; its words come from the reader's Bible (src/lib/verses.ts). */
export type Verse = { code: string; chapter: number; verse: number; notes: string[] };
export type Record3 = { id: string; title: string; evidence: string; inference: string; limit: string };
export type Station = { id: string; num: number; name: string; headline: string; verses: string[]; lead: string; records: Record3[] };
export type View = { name: string; held: string; forIt?: string; against?: string; wouldShow?: string; note?: string };
export type Debate = { id: string; name: string; notChosen: boolean; views: View[] };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; test: TestItem };
export type Bar = { id: string; name: string; start: number; end: number; note: string; ranges?: number[][] };
export type Cord = { id: string; name: string; from?: number; length?: number; verse?: string; note: string };
export type Source = { id: string; title: string; kind: string; status: string; read: string };
export type Hang = { exodus: Exodus; reading: Stay; egypt: [number, number]; canaan?: [number, number] };
export type Neighbour = { study: string; order: number; siteTitle: string; route: string };
export type Exodus = "count" | "measure";
export type Stay = "egypt" | "canaan";

export const D = dossier as unknown as {
  title: string; premise: string; question: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  stationsLead: string; stations: Station[]; debates: Debate[];
  inventionView: { head: string; theirs: string; answer: string; beyond: string; siteVoice: string; limit: string };
  claims: Claim[]; confusedWords: { word: string; note: string }[];
  timeline: { from: number; to: number; key: string; fixed: Bar[]; cords: Cord[]; ground: Bar[] };
  stance: { head: string; confession: string; confessionSource: string; body: string; verses: string[] };
  reach: string[]; neighbours: { study: string; cited: string }[]; readingTrail: { work: string; answers: string; read: string }[];
  sources: Source[]; picturesNote: string; checkNotes: unknown[];
};
export const XS = generated as unknown as {
  recordHash: string; counts: { spans: number; nails: number; stations: number; records: number; debates: number; quotations: number };
  cords: { peg: number; exodus: Record<Exodus, number>; lengths: Record<string, number>; hangs: Hang[]; generations: number };
  bars: Record<string, number[][]>; chart: { from: number; to: number; drawnTo: number };
  verses: Record<string, Verse>; refs: Record<string, string[]>; links: Record<string, string>; neighbours: Neighbour[];
};

export const stationById = new Map(D.stations.map((s) => [s.id, s]));
export const debateById = new Map(D.debates.map((d) => [d.id, d]));
export const cordById = new Map(D.timeline.cords.map((c) => [c.id, c]));
export const refByKey = new Map(Object.entries(XS.refs));
export const DEFAULT_STATION = D.stations[0].id;

/** Every verse link opens the Bible reader in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

/** The verses a reference names, in order; empty when the build did not supply it. */
export function versesOf(key: string): Verse[] {
  return (refByKey.get(key) ?? []).map((id) => XS.verses[id]).filter(Boolean);
}

/** A year span in words, BC throughout: [1575, 1525] -> "1575–1525 BC". */
export const spanWord = ([start, end]: number[]): string => (start === end ? `${start} BC` : `${start}–${end} BC`);

// ---- The address ----
const EXODUS = new Set<Exodus>(["count", "measure"]);
const STAY = new Set<Stay>(["egypt", "canaan"]);
/** No reading is chosen until the reader chooses one: the page draws both and picks neither. */
export const findExodus = (value: string | null): Exodus | null => (value && EXODUS.has(value as Exodus) ? (value as Exodus) : null);
export const findStay = (value: string | null): Stay | null => (value && STAY.has(value as Stay) ? (value as Stay) : null);
export const findStation = (value: string | null): Station => (value ? stationById.get(value) : undefined) ?? stationById.get(DEFAULT_STATION)!;

export type Opened =
  | { kind: "record"; key: string; station: Station; record: Record3 }
  | { kind: "ref"; key: string; label: string; verses: Verse[] };

const openable = new Map<string, Opened>();
for (const station of D.stations) for (const record of station.records) {
  const key = `rec:${station.id}.${record.id}`;
  openable.set(key, { kind: "record", key, station, record });
}
for (const key of refByKey.keys()) openable.set(`ref:${key}`, { kind: "ref", key: `ref:${key}`, label: key, verses: versesOf(key) });

/** The record or reference the address opens; null for anything unknown. */
export const findOpened = (value: string | null): Opened | null => (value ? openable.get(value) : undefined) ?? null;
export const recordKey = (stationId: string, recordId: string) => `rec:${stationId}.${recordId}`;

/** A station's record by its two ids; undefined when the record does not hold it. */
export function recordOf(stationId: string, recordId: string): Record3 | undefined {
  return stationById.get(stationId)?.records.find((r) => r.id === recordId);
}

export const titleOf = (item: Opened): string => (item.kind === "ref" ? item.label : plainText(item.record.title));

/** What was read of a source, in the words the citation shows. */
export function readingTag(status: string): string {
  switch (status) {
    case "read": return "read";
    case "part": return "part read";
    default: return "located, not read";
  }
}
