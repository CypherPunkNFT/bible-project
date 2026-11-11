// The early church's data and its small rules: the research record, the generated verses, date spans, held-text checks, reception
// rows, map and allowed links (scripts/build-early-church-study.py), and the address values the page accepts. Every address value is
// looked up in a Map, so an unknown one falls back to the default and nothing here throws while the page loads.
import dossier from "../../../../content/academic-research/21-the-early-church.json";
import generated from "./early-church-data.json";
import { plainText } from "@/pages/study/check-notes/checked";

/** A verse by its place; its words come from the reader's Bible (src/lib/verses.ts). */
export type Verse = { code: string; chapter: number; verse: number };
export type LinkItem = { title: string; route: string };
export type Quote = { words: string; source: string; ref: string };
export type EcRecord = {
  id: string; name: string; when: string; where: string; kind: string; question?: string; hook: string; quote?: Quote;
  evidence: string; inference: string; limit: string; today?: string; links: LinkItem[]; verses: string[]; sources: string[];
};
export type Part = { id: string; n: string; title: string; lead: string; records: EcRecord[] };
export type Period = { id: string; name: string; start: number; end: number; note: string };
export type Step = { id: string; n: string; title: string; when: string; evidence: string; inference: string; limit: string; verses: string[]; sources: string[] };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; sources: string[]; test: TestItem };
export type Source = { id: string; title: string; kind: string; status: string; read: string; url?: string };
export type Span = { from: number; to: number; kind: "year" | "day" | "about" | "argued" | "unknown" | "open"; words: string; pieces?: number[][] };
export type Alternative = { from: number; to: number; holder: string; openStart?: boolean };
export type Held = { words: string; doc: string; title: string };
export type ReceptionRow = { id: string; name: string; receives: string[]; who: string };
export type Place = { id: string; label: string; kind: "council" | "east" | "oriental"; x: number; y: number };
type Note = { id: string; path: string; marker?: boolean };

export const D = dossier as unknown as {
  title: string; premise: string; question: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  figures: { value: string; label: string; caption: string }[]; confusedWords: { word: string; note: string }[];
  periods: Period[]; parts: Part[]; creedPath: { lead: string; steps: Step[] };
  stance: { head: string; confession: string; confessionSource: string; body: string; verses: string[] };
  claims: Claim[]; reach: string[]; readingTrail: { source: string; answers: string }[]; sources: Source[];
  openQuestions: string[]; checkNotes: unknown[];
};
export const EC = generated as unknown as {
  recordHash: string; counts: { years: number; councils: number; ignatius: number; received: number; quotations: number; held: number };
  spans: Record<string, Span>; alternatives: Record<string, Alternative[]>; accounts: { id: string; writer: string; text: string }[];
  held: Record<string, Held[]>; reception: ReceptionRow[]; unchecked: string[];
  map: { width: number; height: number; paths: string[]; places: Place[] };
  verses: Record<string, Verse>; refs: Record<string, string[]>; routes: string[];
};

export const FIRST = 64;
export const LAST = 451;
export const DEFAULT_DRAWER = "after-apostles";
export const DEFAULT_COUNCIL = "nicaea";
export const ACADEMIC = "/study/academic";

/** Each drawer's kind of writing, in this page's words, and the period of the record its writings belong to. */
export const DRAWERS: Record<string, { kind: string; period: string }> = {
  "after-apostles": { kind: "Letters and a church manual", period: "after-apostles" },
  martyrs: { kind: "Trial letters and martyrs' records", period: "great-persecutions" },
  defenders: { kind: "Defences written for outsiders", period: "defenders" },
  teachers: { kind: "Teachers' long books", period: "defenders" },
  constantine: { kind: "An emperor's letters and laws", period: "peace" },
  desert: { kind: "The lives and rules of monks", period: "peace" },
  councils: { kind: "A council's few decided words", period: "peace" },
  augustine: { kind: "A bishop's own account", period: "peace" },
};

export const partById = new Map(D.parts.map((p) => [p.id, p]));
export const councilPart = partById.get("councils")!;
export const councilById = new Map(councilPart.records.map((r) => [r.id, r]));
export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const refByKey = new Map(Object.entries(EC.refs));
const routes = new Set(EC.routes);
const unchecked = new Set(EC.unchecked);

/** Where each record sits in the research record, for the notes that point at one of its fields. */
export const recordPath = new Map<string, string>();
const partOf = new Map<string, Part>();
D.parts.forEach((part, p) => part.records.forEach((r, i) => { recordPath.set(r.id, `.parts[${p}].records[${i}]`); partOf.set(r.id, part); }));

/** Check notes whose words carry no marker in the text (an empty route, a quotation's reference), by the field they sit on. */
export const noteByPath = new Map<string, string>();
for (const item of Array.isArray(D.checkNotes) ? (D.checkNotes as Note[]) : []) {
  if (item && typeof item.id === "string" && typeof item.path === "string" && item.marker === false && !noteByPath.has(item.path)) noteByPath.set(item.path, item.id);
}

/** Every verse link opens the Bible reader in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

/** The verses a reference names, in order; empty when the build did not supply it. */
export function versesOf(key: string): Verse[] {
  return (refByKey.get(key) ?? []).map((id) => EC.verses[id]).filter(Boolean);
}

/** A route the page may link: only one the build checked is routed inside the site. "" and anything else get no link. */
export const linkFor = (route: string | undefined): string | null => (route && routes.has(route) ? route : null);

/** A source whose quotation still has to be compared with a held text before release. */
export const isUnchecked = (id: string): boolean => unchecked.has(id);

/** The headline's two beats: "The apostles die. Their letters stay." → ["The apostles die.", "Their letters stay."]. */
export function beats(title: string): [string, string] {
  const words = plainText(title);
  const at = words.indexOf(". ");
  return at < 0 ? [words, ""] : [words.slice(0, at + 1), words.slice(at + 2)];
}

/** What was read of a source, in the words the citation shows. */
export function readingTag(status: string): string {
  switch (status) {
    case "read": return "read";
    case "part": return "part read";
    case "check": return "quoted, to be checked";
    default: return "located, not read";
  }
}

export function spanWords(span: Span | undefined): string {
  return span ? span.words : "date not given";
}

// ---- The address ----
export const findDrawer = (value: string | null): Part => (value ? partById.get(value) : undefined) ?? partById.get(DEFAULT_DRAWER)!;
export const findCouncil = (value: string | null): EcRecord => (value ? councilById.get(value) : undefined) ?? councilById.get(DEFAULT_COUNCIL)!;

export type Opened =
  | { kind: "record"; key: string; record: EcRecord; part: Part; path: string }
  | { kind: "ref"; key: string; label: string; verses: Verse[] };

const openable = new Map<string, Opened>();
for (const part of D.parts) for (const r of part.records) {
  openable.set(`rec:${r.id}`, { kind: "record", key: `rec:${r.id}`, record: r, part: partOf.get(r.id)!, path: recordPath.get(r.id)! });
}
for (const key of refByKey.keys()) openable.set(`ref:${key}`, { kind: "ref", key: `ref:${key}`, label: key, verses: versesOf(key) });

/** The record or reference the address opens; null for anything unknown. */
export const findOpened = (value: string | null): Opened | null => (value ? openable.get(value) : undefined) ?? null;
