// New Testament history's data and its small rules: the research record, the generated verses, anchors and counts
// (scripts/build-nt-history-study.py), the lattice's geometry, year wording with no year zero, and the address values it
// accepts. Every address value is looked up in a Map or matched against a fixed set, so an unknown one falls back to the
// default and nothing here throws while the page loads.
import dossier from "../../../../content/academic-research/43-new-testament-history.json";
import generated from "./nt-history-data.json";
import { plainText } from "@/pages/study/check-notes/checked";

export type Verse = { code: string; chapter: number; verse: number; text: string };
export type Step = { id: string; title: string; when: string; evidence: string; inference: string; limit: string; verses?: string[]; sources: string[] };
export type Era = { id: string; title: string; when: string; lead: string; steps: Step[] };
export type Herod = { id: string; name: string; title: string; ruled: string; territory: string; nt: string[]; note: string };
export type Witness = { id: string; writer: string; work: string; written: string; says: string; evidence: string; inference: string; limit: string };
export type View = { id: string; label: string; held: string; rests?: string; against?: string };
export type TrialStep = { id: string; title: string; evidence: string; inference: string; limit: string };
export type Fixed = { id: string; title: string; when: string; evidence: string; inference: string; limit: string };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; test: TestItem };
export type Source = { id: string; title: string; kind: string; status: string; answers: string; read: string };
export type Row = { id: string; lane: string; name: string; start?: number; end?: number; endAlt?: number; ranges?: number[][]; points?: number[]; open?: boolean; note?: string };
export type YearSpan = { label: string; from: number; to: number; alt?: boolean };
export type Anchor = { id: string; title: string; short: string; verses: string[]; named: string[]; textPath: string; countedFrom?: number; years: YearSpan[] };
export type PaulPoint = { id?: string; label?: string; from: number; to: number; before?: boolean };

export const D = dossier as unknown as {
  title: string; premise: string; question: string; yearRule: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  stance: { head: string; confession: string; confessionSource: string; body: string; guilt: string; verses: string[] };
  herods: { lead: string; rows: Herod[]; titles: string }; eras: Era[];
  witnesses: { lead: string; records: Witness[]; together: string };
  chronology: {
    lead: string; birth: { anchors: string[]; views: View[]; reckoning: string };
    census: { question: string; evidence: string; views: View[]; limit: string }; death: { anchors: string[]; views: View[]; limit: string };
  };
  trial: { lead: string; steps: TrialStep[]; guilt: string };
  paul: { lead: string; fixed: Fixed[]; reconstruction: string; verses: string[] };
  claims: Claim[]; confusedWords: { word: string; note: string }[];
  timeline: { from: number; to: number; lanes: string[]; rows: Row[] };
  reach: string[]; sources: Source[]; checkNotes: unknown[];
};
export const NH = generated as unknown as {
  recordHash: string; counts: { years: number; herods: number; writers: number; crossDates: number; quotations: number };
  kinds: Record<string, "fixed" | "reckoned">; anchors: Anchor[]; paul: { fixed: PaulPoint[]; reckoned: PaulPoint[] };
  verses: Record<string, Verse>; refs: Record<string, string[]>; links: Record<string, string>;
};

export const DEFAULT_ANCHOR = "luke3";
export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const anchorById = new Map(NH.anchors.map((a) => [a.id, a]));
export const rowById = new Map(D.timeline.rows.map((r) => [r.id, r]));
export const refByKey = new Map(Object.entries(NH.refs));
export const herodById = new Map(D.herods.rows.map((h) => [h.id, h]));

/** Every verse link opens the Bible reader in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

/** The verses a reference names, in order; empty when the build did not supply it. */
export function versesOf(key: string): Verse[] {
  return (refByKey.get(key) ?? []).map((id) => NH.verses[id]).filter(Boolean);
}

// ---- Years: negative is BC, and there is no year zero ----
export const axisYear = (year: number): number => (year < 0 ? year + 1 : year);
export const yearWord = (year: number): string => (year < 0 ? `${-year} BC` : `AD ${year}`);
export function rangeWord(from: number, to: number): string {
  if (from === to) return yearWord(from);
  if (to < 0) return `${-from}–${-to} BC`;
  if (from > 0) return `AD ${from}–${to}`;
  return `${-from} BC–AD ${to}`;
}

// ---- The address ----
export const findAnchor = (value: string | null): Anchor => (value ? anchorById.get(value) : undefined) ?? anchorById.get(DEFAULT_ANCHOR)!;
export const findRuler = (value: string | null): Row | null => (value ? rowById.get(value) : undefined) ?? null;
const BIRTH_VIEWS = new Set(["early", "late"]);
const CROSS_VIEWS = new Set(["30", "33"]);
export const findBirthView = (value: string | null): "early" | "late" | null => (value && BIRTH_VIEWS.has(value) ? (value as "early" | "late") : null);
export const findCrossView = (value: string | null): "30" | "33" | null => (value && CROSS_VIEWS.has(value) ? (value as "30" | "33") : null);

export type Opened =
  | { kind: "record"; key: string; kicker: string; title: string; when?: string; says?: string; evidence: string; inference: string; limit: string; sources: string[]; verses: string[] }
  | { kind: "herod"; key: string; herod: Herod }
  | { kind: "ref"; key: string; label: string; verses: Verse[] };

const openable = new Map<string, Opened>();
for (const era of D.eras) for (const s of era.steps) {
  openable.set(`step:${s.id}`, { kind: "record", key: `step:${s.id}`, kicker: plainText(era.title), title: s.title, when: s.when, evidence: s.evidence, inference: s.inference, limit: s.limit, sources: s.sources, verses: s.verses ?? [] });
}
for (const w of D.witnesses.records) {
  openable.set(`wit:${w.id}`, { kind: "record", key: `wit:${w.id}`, kicker: `${w.writer} · ${w.work}`, title: w.writer, when: w.written, says: w.says, evidence: w.evidence, inference: w.inference, limit: w.limit, sources: [], verses: [] });
}
for (const t of D.trial.steps) {
  openable.set(`trial:${t.id}`, { kind: "record", key: `trial:${t.id}`, kicker: "The trial", title: t.title, evidence: t.evidence, inference: t.inference, limit: t.limit, sources: [], verses: [] });
}
for (const f of D.paul.fixed) {
  openable.set(`paul:${f.id}`, { kind: "record", key: `paul:${f.id}`, kicker: "Paul's fixed points", title: f.title, when: f.when, evidence: f.evidence, inference: f.inference, limit: f.limit, sources: [], verses: [] });
}
for (const h of D.herods.rows) openable.set(`herod:${h.id}`, { kind: "herod", key: `herod:${h.id}`, herod: h });
for (const key of refByKey.keys()) openable.set(`ref:${key}`, { kind: "ref", key: `ref:${key}`, label: key, verses: versesOf(key) });

/** The record or reference the address opens; null for anything unknown. */
export const findOpened = (value: string | null): Opened | null => (value ? openable.get(value) : undefined) ?? null;

/** Witness records grouped by writer, in the record's order. */
export function witnessesByWriter(): { writer: string; records: Witness[] }[] {
  const groups = new Map<string, Witness[]>();
  for (const w of D.witnesses.records) groups.set(w.writer, [...(groups.get(w.writer) ?? []), w]);
  return [...groups].map(([writer, records]) => ({ writer, records }));
}

/** A string in the record by its path (".chronology.death.anchors[1]"); "" if the path does not lead to text. */
export function atPath(path: string): string {
  let node: unknown = D;
  for (const [, name, index] of path.matchAll(/\.([A-Za-z]+)|\[(\d+)\]/g)) {
    if (node === null || typeof node !== "object") return "";
    node = name ? (Object.prototype.hasOwnProperty.call(node, name) ? (node as Record<string, unknown>)[name] : undefined) : (node as unknown[])[Number(index)];
  }
  return typeof node === "string" ? node : "";
}

/** What was read of a source, in the words the citation shows. */
export function readingTag(status: string): string {
  switch (status) {
    case "read": return "read";
    case "part": return "part read";
    case "second-hand": return "reported second-hand";
    default: return "located, not read";
  }
}
