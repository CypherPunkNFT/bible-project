// How the church has read the Bible: the research record, the generated verses, the Berean reader link, the address values it accepts,
// how a verse is cut at the phrases readers fasten on, and where a reader's range sits on the line of time. Everything the address asks
// for is looked up in a Map, so an unknown value falls back to the default.
import dossier from "../../../../content/academic-research/30-how-the-church-has-read-the-bible.json";
import generated from "./church-reading-data.json";

export type Verse = { code: string; chapter: number; verse: number };
export type QuestionId = "happened" | "word" | "children" | "use";
export type Reader = { id: string; mark: string; name: string; when: string; from: number; to: number; place: string; work: string; lane: string; side: "left" | "right"; gloss: string;
  fasten: { verse: string; phrase: string }; quote: string; looking: string; evidence: string; inference: string; limit: string; answers: Record<QuestionId, string>; sources: string[];
  profile?: { href: string; label: string } };
export type Question = { id: QuestionId; label: string; reads: string };
export type Lane = { id: string; name: string; note: string };
export type Sense = { id: string; n: string; name: string; alt: string; asks: string; jerusalem: string; light: string };
export type TestItem = { question: string; options: { text: string; right: boolean; why: string }[] };
export type Claim = { id: string; claim: string; head: string; evidence: string; inference: string; limit: string; sources: string[]; picture?: string; test: TestItem };
export type Picture = { id: string; src: string; alt: string; credit: string; licence: string; licenceUrl: string; href: string; retrieved: string; width: number; height: number; record?: { href: string; label: string } };
export type Source = { id: string; title: string; url: string; kind: string; status: string; answers: string; read: string };
export type Target = { id: string; reader: string; target: string; text: string; source: string };
export type Segment = { text: string; readers: Reader[] };

export const D = dossier as unknown as {
  outcomes: string[]; question: string; boundaries: { in: string; out: string[] }; readers: Reader[]; questions: Question[]; lanes: Lane[];
  turns: { id: string; title: string; when: string; text: string }[];
  baptist: { head: string; text: string; confession: { href: string; label: string } };
  senses: { note: string; sets: { id: string; name: string; who: string; source: string }[]; items: Sense[]; rhyme: { latin: string; english: string; note: string; source: string };
    tyndale: { quote: string; more: string; source: string; profile: { href: string; label: string } }; test: TestItem };
  targets: Target[]; targetsNote: { evidence: string; inference: string; limit: string; stand: string; sources: string[] }; claims: Claim[];
  theWord: { note: string }; leaf: { facts: string[]; reading: string; shape: string }; confusedWords: { word: string; note: string }[]; reach: string[];
  sources: Source[]; pictures: Picture[]; verses: { label: string }[];
};
export const CR = generated as { verses: Record<string, Verse>; word: { tag: string; times: number; kingJames: string; greek: string } };

export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export const DEFAULT_READER = "origen";
export const DEFAULT_QUESTION: QuestionId = "word";
export const DEFAULT_SENSE = "allegory";
export const TIME_START = 200;
export const TIME_END = 2020;
export const PASSAGE = Array.from({ length: 11 }, (_, i) => `Galatians 4:${21 + i}`);

export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));
export const verseByLabel = new Map(Object.entries(CR.verses));
export const readerById = new Map(D.readers.map((r) => [r.id, r]));
const questionById = new Map(D.questions.map((q) => [q.id as string, q]));
const senseById = new Map(D.senses.items.map((s) => [s.id, s]));
const openable = new Map(D.readers.map((r) => [`reader:${r.id}`, r]));

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

export function findReader(value: string | null): Reader {
  return (value ? readerById.get(value) : undefined) ?? readerById.get(DEFAULT_READER)!;
}

export function findQuestion(value: string | null): Question {
  return (value ? questionById.get(value) : undefined) ?? questionById.get(DEFAULT_QUESTION)!;
}

export function findSense(value: string | null): Sense {
  return (value ? senseById.get(value) : undefined) ?? senseById.get(DEFAULT_SENSE)!;
}

export function findOpened(value: string | null): Reader | null {
  return (value ? openable.get(value) : undefined) ?? null;
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

/** A verse cut at its readers' phrases. Readers sharing a phrase share one segment, and a phrase not found stays unmarked: it never throws. */
export function segmentVerse(text: string, readers: Reader[], reportMissing = true): Segment[] {
  const lower = text.toLowerCase();
  const spans = new Map<string, { start: number; end: number; readers: Reader[] }>();
  for (const reader of readers) {
    const phrase = reader.fasten.phrase.toLowerCase();
    const start = lower.indexOf(phrase);
    if (start < 0) { if (reportMissing) console.error(`The church reading page: "${reader.fasten.phrase}" is not in the verse "${text}"`); continue; }
    const key = `${start}-${start + phrase.length}`;
    const span = spans.get(key) ?? { start, end: start + phrase.length, readers: [] };
    span.readers.push(reader);
    spans.set(key, span);
  }
  const segments: Segment[] = [];
  let at = 0;
  for (const span of [...spans.values()].sort((a, b) => a.start - b.start)) {
    if (span.start < at) continue;
    if (span.start > at) segments.push({ text: text.slice(at, span.start), readers: [] });
    segments.push({ text: text.slice(span.start, span.end), readers: span.readers });
    at = span.end;
  }
  if (at < text.length) segments.push({ text: text.slice(at), readers: [] });
  return segments;
}

export function readersOnVerse(label: string): Reader[] {
  return D.readers.filter((r) => r.fasten.verse === label);
}

/** Where a reader's range sits on the line of time, in percent. The bar keeps its minimum width on the track, so the left edge is held back at the far end. */
export function barPlace(from: number, to: number, minPercent = 1.1): { left: number; width: number } {
  const span = TIME_END - TIME_START;
  const width = Math.max(((to - from) / span) * 100, minPercent);
  return { left: Math.min(((from - TIME_START) / span) * 100, 100 - width), width };
}

export function percentAt(year: number): number {
  return ((year - TIME_START) / (TIME_END - TIME_START)) * 100;
}

/** The longest stretch with no reader on this page, from one reader's end to the next one's start. */
export function longestGap(readers: Reader[]): { from: number; to: number; years: number } {
  let best = { from: 0, to: 0, years: -1 };
  let lastEnd = readers[0]?.to ?? 0;
  for (const reader of readers.slice(1)) {
    const years = reader.from - lastEnd;
    if (years > best.years) best = { from: lastEnd, to: reader.from, years };
    lastEnd = Math.max(lastEnd, reader.to);
  }
  return best;
}

export function sourceCounts(sources: Source[]): { part: number; whole: number; secondHand: number; located: number } {
  const count = (status: string) => sources.filter((s) => s.status === status).length;
  return { part: count("part"), whole: count("read"), secondHand: count("second-hand"), located: count("located") };
}
