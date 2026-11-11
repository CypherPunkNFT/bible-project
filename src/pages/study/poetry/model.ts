// Hebrew poetry and biblical narrative: the research record, the generated verses (ids with the word offsets of their Berean
// lines, and the Leningrad Hebrew; the Berean's words come from the reader's Bible files, src/lib/verses.ts),
// the Hebrew-beside-Berean pairs, the folds, threads and alphabet columns (scripts/build-poetry-study.py), and the address
// values the page accepts. Every address value is looked up in a Map, so an unknown one falls back to the default and
// nothing here throws while the page loads.
import dossier from "../../../../content/academic-research/13-hebrew-poetry-and-biblical-narrative.json";
import generated from "./poetry-data.json";

/** `breaks`: the word offsets in the Berean's verse where its second and later poetic lines begin (checked by the build). */
export type Verse = { code: string; chapter: number; verse: number; breaks: number[]; hebrew: string | null; hebrewVerse?: number };
/** `line`: which of the verse's Berean lines stands beside this Hebrew line. */
export type Row = { line: number; he: string | null };
/** A psalm title carries the Berean's superscription (`en`, a chapter heading, not verse wording); another heading is a line of the verse. */
export type Pair = { title?: { he: string; en?: string; line?: number }; rows: Row[] };
export type Item = { id: string; name: string; examples: string[]; look: string; evidence: string; inference: string; limit: string; lowth?: string };
export type View = { who: string; held: string; source?: string };
export type Reader = View & { id: string; note?: string };
export type Poem = { ref: string; shape: string; note: string };
export type Letter = { letter: string; name: string; verse: number | null; word?: string; second?: boolean };
export type Column = { poem: number; label: string; code: string; chapter: number; per: number; offset: number; unit: string; letters: Letter[];
  extra: { verse: number; letter: string } | null; repeats: { verse: number; letter: string }[]; units: number };
export type ThreadRow = { ref: string; key: string; en: string; he: number[] };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; verses: string[]; sources: string[]; test: TestItem };
export type Source = { id: string; title: string; kind: string; status: string; answers: string; read: string };

export const D = dossier as unknown as {
  title: string; premise: string; question: string; outcomes: string[]; boundaries: { in: string; out: string[] };
  stance: { head: string; confession: string; confessionSource: string; body: string; verses: string[] };
  parallelism: { headline: string; lead: string; readers: Reader[]; kinds: Item[];
    metre: { head: string; lead: string; views: View[]; limit: string };
    border: { head: string; evidence: string[]; inference: string; views: View[]; limit: string } };
  patterns: { headline: string; lead: string; items: Item[]; tests: { head: string; lead: string; items: string[] } };
  acrostics: { headline: string; lead: string; poems: Poem[]; edge: { ref: string; note: string }; lamentations5: string; evidence: string; inference: string; limit: string };
  keyWords: { headline: string; lead: string; items: Item[]; caution: string };
  storyteller: { headline: string; lead: string; tools: Item[]; fiction: { head: string; views: View[]; note: string } };
  greek: { headline: string; lead: string; items: Item[]; more: string };
  claims: Claim[]; confusedWords: { word: string; note: string }[];
  timeline: { head: string; note: string; rows: { year: string; who: string; what: string }[] };
  reach: string[]; pictures: { note: string; candidates: { id: string; what: string; where: string; licence: string }[] };
  sources: Source[]; readingTrail: { source: string; why: string }[];
  links: { theology: string[]; academic: string[] }; checkNotes: unknown[];
};
export const P = generated as unknown as {
  recordHash: string; counts: { letters: number; poems: number; psalm119: number; verdicts: number; quotations: number };
  pairs: Record<string, Pair>; verses: Record<string, Verse>; refs: Record<string, string[]>;
  folds: { gen96: { words: string[]; pairs: number[][]; glosses: string[] }; isa610: { hebrew: number[]; english: string[] };
    flood: { ref: string; words: string; count: string; at: number }[]; floodSpan: string[]; floodVerses: number };
  refrain: Record<string, number[]>;
  threads: { rows: Record<string, ThreadRow[]>; verdicts: number; judgesEvil: string[]; judgesKing: string[] };
  acrostics: { columns: Column[]; notDrawn: Record<string, string>; lamentations5: { verse: number; letter: string }[]; psalm119: number; lamentations3: number };
  links: { pages: Record<string, string>; studies: Record<string, string> };
};

/** Whether a generated table has its own entry for a key (never one inherited, such as "constructor"). */
export const owns = (table: object, key: string): boolean => Object.prototype.hasOwnProperty.call(table, key);

export const refByKey = new Map(Object.entries(P.refs));
export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const kindById = new Map(D.parallelism.kinds.map((k) => [k.id, k]));
export const patternById = new Map(D.patterns.items.map((k) => [k.id, k]));
export const wordById = new Map(D.keyWords.items.map((k) => [k.id, k]));
export const toolById = new Map(D.storyteller.tools.map((k) => [k.id, k]));
export const greekById = new Map(D.greek.items.map((k) => [k.id, k]));

/** Every verse link opens the Bible reader in the Berean (study rule 3). */
export function readerHref(code: string, chapter: number, verse?: number): string {
  return verse ? `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}` : `/read/bsb/${code}/${chapter}`;
}

/** The verses a reference names, in order; empty when the build did not supply it. */
export function versesOf(label: string): Verse[] {
  return (refByKey.get(label) ?? []).map((id) => P.verses[id]).filter(Boolean);
}

/** The first verse of a reference, with its Hebrew-beside-Berean pair when the build divided it. */
export function firstOf(label: string): { key: string; verse: Verse; pair?: Pair } | null {
  const key = refByKey.get(label)?.[0];
  return key ? byKey(key) : null;
}

/** A verse by its build key ("PSA 19:1"), with its pair when the build divided it. */
export function byKey(key: string): { key: string; verse: Verse; pair?: Pair } | null {
  const verse = owns(P.verses, key) ? P.verses[key] : undefined;
  return verse ? { key, verse, pair: owns(P.pairs, key) ? P.pairs[key] : undefined } : null;
}

/** The Berean's verse cut into its poetic lines at the build's word offsets: always one line more than there are breaks.
 * Words the offsets do not fit (a Bible file changed since the build) all go to the first line, so none is lost. */
export function bereanLines(text: string, breaks: number[]): string[] {
  const words = text.split(" ");
  const fits = breaks.every((at, i) => at > (i ? breaks[i - 1] : 0) && at < words.length);
  if (!fits) return [text, ...breaks.map(() => "")];
  return [0, ...breaks].map((from, i) => words.slice(from, i < breaks.length ? breaks[i] : words.length).join(" "));
}

/** "Said once. *Said again, sharper.*" → the plain part and the gold turn. */
export function splitHeadline(text: string): { title: string; turn: string } {
  const match = /^(.*?)\s*\*(.+)\*\s*$/.exec(text);
  return match ? { title: match[1], turn: match[2] } : { title: text, turn: "" };
}

// ---- The address ----
function pick<T>(map: Map<string, T>, value: string | null, fallback: string): string {
  return value && map.has(value) ? value : fallback;
}
export const findKind = (value: string | null) => pick(kindById, value, "restate");
export const findWord = (value: string | null) => pick(wordById, value, "recognize");
export const findTool = (value: string | null) => pick(toolById, value, "gaps");
const TESTS = new Map(D.patterns.tests.items.map((t, i) => [String(i + 1), t]));
export const findTest = (value: string | null): number | null => (value && TESTS.has(value) ? Number(value) : null);
const POEMS = new Map(D.acrostics.poems.map((p, i) => [String(i + 1), p]));
export const findPoem = (value: string | null): number => (value && POEMS.has(value) ? Number(value) - 1 : 7);

export type Opened = { kind: "ref"; key: string; label: string; verses: Verse[] } | { kind: "source"; key: string; source: Source };

/** The reference or source the address opens; null for anything unknown. */
export function findOpened(value: string | null): Opened | null {
  if (!value) return null;
  if (value.startsWith("ref:")) {
    const label = value.slice(4);
    return refByKey.has(label) ? { kind: "ref", key: value, label, verses: versesOf(label) } : null;
  }
  if (value.startsWith("source:")) {
    const source = sourceById.get(value.slice(7));
    return source ? { kind: "source", key: value, source } : null;
  }
  return null;
}

/** What was read of a source, in the words the citation shows. */
export function readingTag(status: string): string {
  switch (status) {
    case "read": return "read";
    case "part": return "part read";
    default: return "located, not read";
  }
}

/** The Berean verse number of a Hebrew verse in an alphabet column (a psalm's title counts as Hebrew verse 1 in some psalms). */
export const bereanVerse = (column: Column, hebrewVerse: number): number => hebrewVerse - column.offset;
