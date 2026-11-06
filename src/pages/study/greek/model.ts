// The How New Testament Greek works study's data and its small rules: the research record, the generated words and counts, the Berean
// reader link, how the six orders of a clause work, how an arc between two words is drawn, and the address values it accepts. Everything
// the address asks for is looked up in a Map, so an unknown value falls back to the default.
import dossier from "../../../../content/academic-research/31-how-new-testament-greek-works.json";
import generated from "./greek-data.json";
import { formatNumber } from "@/lib/site-format";

export type Verse = { code: string; chapter: number; verse: number; text: string };
export type TestOption = { text: string; right: boolean; why: string };
export type Parts = { evidence: string; inference: string; limit: string };
export type WordRef = { form: string; code: string; chapter: number; verse: number; phrase: string; say: string; means: string };
export type Letter = { id: string; lower: string; final?: string; upper: string; name: string; sound: string; group: string; lookslike?: string; word: WordRef; note?: string };
export type CaseName = { id: string; name: string; plain: string; mark: string; line: string };
export type Noun = { id: string; strong: string; stem: string; name: string; say: string; means: string; gender: string; line: string };
export type GreekLine = { id: string; label: string; code: string; chapter: number; verse: number; phrase: string; note: string };
export type RailItem = { id: string; code: string; chapter: number; verse: number; form: string; phrase: string; formName: string; usual: string; here: string; note: string };
export type AoristItem = { id: string; code: string; chapter: number; verse: number; form: string; phrase: string; note: string };
export type VerbForm = { id: string; code: string; chapter: number; verse: number; form: string; phrase: string; name: string; parts: [string, string][] };
export type Source = { id: string; title: string; kind: string; url: string; status: string; read: string; answers: string };
export type Picture = { id: string; src: string; alt: string; caption: string; credit: string; licence: string; href: string; retrieved: string; width: number; height: number };
export type Claim = { claim?: string; question: string; quote?: string; quoteBy?: string; options: TestOption[] };
export type Unit = "v" | "s" | "o";
export type UnitText = { greek: string; say: string; english: string; role?: string };
export type WordData = { sound: string; gloss: string; code: string; label: string };
export type LineWord = { g: string; t: string; e: string; c: string; k: string; to?: number };
export type NounCell = { form: string; end: string; count: number; all: number; shown: string; label: string };
export type Quoted = { text: string; by: string; note?: string };
export type Opened =
  | { type: "letter"; letter: Letter }
  | { type: "word"; line: GreekLine; word: LineWord; index: number }
  | { type: "cell"; noun: Noun; slot: string; cell: NounCell }
  | { type: "form"; item: RailItem | AoristItem; data: WordData };

export const D = dossier as unknown as {
  outcomes: string[]; question: string; boundaries: { in: string; out: string[] }; sound: { scheme: string; noAudio: string };
  letters: Letter[]; letterGroups: { id: string; label: string; line: string }[]; marks: { id: string; glyph: string; name: string; line: string }[];
  practice: { form: string; code: string; chapter: number; verse: number; say: string }[];
  moved: { code: string; chapter: number; verse: number; units: Record<Unit, UnitText>; swapped: Record<"s" | "o", UnitText>; orders: { id: string; note: string }[]; madeUp: string };
  cases: CaseName[]; nouns: Noun[]; lines: GreekLine[];
  records: Record<"order" | "letters" | "article" | "time" | "common", Parts>;
  claims: Record<"order" | "article" | "aorist" | "spirit", Claim>;
  harner: { line: string; clauses: { id: string; greek: string; says: string; actual?: boolean }[]; views: { who: string; view: string; status: string }[]; voice: string };
  verb: { name: string; forms: VerbForm[]; viewpoint: { line: string; code: string; chapter: number; verse: number; phrase: string; example: string } };
  moodNames: { id: string; label: string; plain: string }[]; tenseNames: { id: string; label: string }[];
  rail: RailItem[]; railPoints: { id: string; label: string }[]; aoristVerses: AoristItem[];
  aspectViews: { who: string; view: string; side: string }[]; aspectNote: string;
  papyrus: { id: string; marks: { id: string; greek: string; line: number; top: number; gloss: string; note: string }[]; translation: string; translationBy: string; facts: { label: string; value: string }[];
    luke: { form: string }; lord: { line: string; form: string; note: string } };
  confusedWords: { word: string; note: string }[]; reach: string[]; voice: string; quotes: Record<"burton" | "stagg" | "deissmann" | "robertson", Quoted>;
  credit: { line: string; url: string; licence: string }; sources: Source[]; pictures: Picture[]; closing: { note: string };
};
export const G = generated as unknown as {
  counts: { words: number; allRows: number; nouns: number; verbs: number; articles: number; cases: Record<string, number>; grid: Record<string, number>; gridTotal: number; indicative: number; letters: Record<string, number>; lettersTotal: number };
  letters: Record<string, WordData>;
  moved: { label: string };
  nouns: Record<string, { total: number; vocative: number; cells: Record<string, NounCell> }>;
  lines: Record<string, { label: string; words: LineWord[] }>;
  theos: { verse: number; form: string; article: boolean; case: string; label: string }[];
  verb: { forms: Record<string, WordData>; viewpoint: string };
  rail: Record<string, WordData>; aorists: Record<string, WordData>; onceForAll: string;
  common: Record<"luke" | "lord", WordData & { count: number }>;
  codes: Record<string, { parse: string; plain: string }>;
  verses: Record<string, Verse>;
};

export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export const DEFAULT_ORDER = "vso", DEFAULT_VIEW = "groups", DEFAULT_LENS = "all";
export const DEFAULT_NOUN = "logos", DEFAULT_LINE = "rom5-8", DEFAULT_FORM = "aorist";
export const VIEWS = [{ id: "groups", label: "By how they look" }, { id: "order", label: "In Greek order" }];
export const SLOTS = ["NS", "GS", "DS", "AS", "NP", "GP", "DP", "AP"];

export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));
export const verseByLabel = new Map(Object.entries(G.verses));
export const caseById = new Map(D.cases.map((c) => [c.id, c]));
const orderById = new Map(D.moved.orders.map((o) => [o.id, o.id]));
const viewById = new Map(VIEWS.map((v) => [v.id, v.id]));
const lensById = new Map([[DEFAULT_LENS, DEFAULT_LENS], ...D.cases.map((c) => [c.id, c.id] as [string, string])]);
const nounById = new Map(D.nouns.map((n) => [n.id, n]));
const lineById = new Map(D.lines.map((l) => [l.id, l]));
const formById = new Map(D.verb.forms.map((f) => [f.id, f]));
const openable = new Map<string, Opened>([
  ...D.letters.map((letter) => [`letter:${letter.id}`, { type: "letter", letter }] as [string, Opened]),
  ...D.lines.flatMap((line) => G.lines[line.id].words.map((word, index) => [`word:${line.id}:${index}`, { type: "word", line, word, index }] as [string, Opened])),
  ...D.nouns.flatMap((noun) => Object.entries(G.nouns[noun.id].cells).map(([slot, cell]) => [`cell:${noun.id}:${slot}`, { type: "cell", noun, slot, cell }] as [string, Opened])),
  ...D.rail.map((item) => [`form:${item.id}`, { type: "form", item, data: G.rail[item.id] }] as [string, Opened]),
  ...D.aoristVerses.map((item) => [`form:${item.id}`, { type: "form", item, data: G.aorists[item.id] }] as [string, Opened]),
]);

export const findOrder = (value: string | null): string => (value ? orderById.get(value) : undefined) ?? DEFAULT_ORDER;
export const findView = (value: string | null): string => (value ? viewById.get(value) : undefined) ?? DEFAULT_VIEW;
export const findLens = (value: string | null): string => (value ? lensById.get(value) : undefined) ?? DEFAULT_LENS;
export const findNoun = (value: string | null): Noun => (value ? nounById.get(value) : undefined) ?? nounById.get(DEFAULT_NOUN)!;
export const findLine = (value: string | null): GreekLine => (value ? lineById.get(value) : undefined) ?? lineById.get(DEFAULT_LINE)!;
export const findForm = (value: string | null): VerbForm => (value ? formById.get(value) : undefined) ?? formById.get(DEFAULT_FORM)!;
export const findOpened = (value: string | null): Opened | null => (value ? openable.get(value) : undefined) ?? null;

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

export const unitsOf = (order: string): Unit[] => order.split("") as Unit[];

/** Pressing a unit sends it to the front, and the other two keep their places. */
export function moveToFront(order: string, unit: Unit): string {
  return [unit, ...unitsOf(order).filter((u) => u !== unit)].join("");
}

/** English reads the word before the verb as the doer. So only two of the six orders are plain English, and one of those reverses it. */
export function englishReads(order: string): "same" | "opposite" | "broken" {
  if (order === "svo") return "same";
  return order === "ovs" ? "opposite" : "broken";
}

/** The unit's words in this version of the clause: its own endings, or the swapped ones. */
export function unitText(unit: Unit, swapped: boolean): UnitText {
  return swapped && unit !== "v" ? D.moved.swapped[unit] : D.moved.units[unit];
}

/** The curve from an article up and across to its noun. Taller for a longer reach, within the room it has. */
export function arcPath(from: number, to: number, base: number, room: number): string {
  const rise = Math.min(room, 8 + Math.abs(to - from) * 0.28);
  return `M${from} ${base}C${from} ${base - rise} ${to} ${base - rise} ${to} ${base}`;
}

export function caseOfSlot(slot: string): CaseName {
  return caseById.get(slot[0])!;
}

/** The share as whole percent, with the denominator always carried by the caller. */
export function percent(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

export const thousands = (n: number) => formatNumber(n);

/** What was read of a source, in the words the citation shows. */
export function readingTag(status: string): string {
  switch (status) {
    case "read": return "read";
    case "part": return "part read";
    case "second-hand": return "reported second-hand";
    default: return "located, not read";
  }
}
