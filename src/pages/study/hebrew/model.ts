// The How Hebrew works study's data and its small rules: the research record, the generated words and counts, the Berean reader link,
// how a line is peeled into layers and cut into letters, and the address values it accepts. Everything the address asks for is looked
// up in a Map, so an unknown value falls back to the default.
import dossier from "../../../../content/academic-research/28-how-hebrew-works.json";
import generated from "./hebrew-data.json";
import { formatNumber } from "@/lib/site-format";

export type Verse = { code: string; chapter: number; verse: number; text: string };
export type Letter = { id: string; glyph: string; final?: string; name: string; sound: string; dot?: string; twins: string[]; note?: string };
export type Lens = { id: string; label: string; line: string };
export type Vowel = { id: string; mark: string; name: string; sound: string; line: string };
export type Carrier = { id: string; glyph: string; sound: string };
export type Rule = { id: string; name: string; line: string };
export type LineWord = { sound: string; steps?: [string, string][] };
export type Line = { id: string; label: string; code: string; chapter: number; verse: number; guided: boolean; words: LineWord[] };
export type TestOption = { text: string; right: boolean; why: string };
export type ReaderTest = { id: string; line: string; label: string; note: string; options: TestOption[] };
export type Featured = { id: string; group: string; strong: string; form: string; root?: number[]; sound: string; word: string; stem?: string; stemCode?: string; tends?: string; formName?: string; note?: string };
export type Root = { id: string; letters: string; gloss: string; line: string };
export type Source = { id: string; title: string; kind: string; url: string; status: string; read: string; answers: string };
export type Picture = { id: string; src: string; alt: string; caption: string; credit: string; licence: string; href: string; retrieved: string; width: number; height: number };
export type Form = { id: string; name: string; plain: string };
export type Parts = { evidence: string; inference: string; limit: string };
export type WordData = { he: string; gloss: string; code: string; note: string; count: number; label: string };
export type Cell = { he: string; count: number; all: number; label: string; step: string; gloss: string; code: string; note: string };
export type Book = { name: string; total: number } & Record<string, number | string>;
export type GridRow = { id: string; label: string };
export type Layer = "letters" | "points" | "accents";
export type Opened =
  | { type: "letter"; letter: Letter }
  | { type: "word"; item: Featured; data: WordData }
  | { type: "cell"; row: GridRow; col: GridRow; cell: Cell };

export const D = dossier as unknown as {
  outcomes: string[]; question: string; boundaries: { in: string; out: string[] }; sound: { scheme: string; noAudio: string };
  letters: Letter[]; lenses: Lens[]; vowels: Vowel[]; carriers: Carrier[]; vowelLetters: { glyph: string; sound: string; line: string }[]; rules: Rule[];
  lines: Line[]; tests: ReaderTest[]; featured: Featured[]; roots: Root[];
  views: { who: string; view: string; status: string; source: string }[];
  records: Record<"layers" | "letters" | "points" | "roots" | "verbs", Parts>;
  claims: { vowels: Parts & { claim: string; test: { question: string; options: TestOption[] } }; root: { claim: string; line: string }; time: Parts & { claim: string; test: { question: string; options: TestOption[] } } };
  confusedWords: { word: string; note: string }[]; reach: string[]; voice: string; divineName: string;
  chain: { line: string; steps: { name: string; note: string }[] }; credit: { line: string; url: string; licence: string };
  sources: Source[]; pictures: Picture[]; forms: Form[];
  grid: { strong: string; letters: string; name: string; rows: GridRow[]; cols: GridRow[] };
};
export const H = generated as unknown as {
  counts: { hebrewWords: number; aramaicWords: number; setAside: number; letterCounts: Record<string, number>; lettersTotal: number; vowels: Record<string, number>; pointsTotal: number;
    forms: Record<string, number>; verbsTotal: number; books: Book[]; seeStems: Record<string, number>; seeTotal: number };
  lines: Record<string, { words: { he: string; gloss: string; step: string }[] }>;
  featured: Record<string, WordData>;
  psalm: Record<string, { verse: number; first: string }>;
  grid: Record<string, Cell>;
  verses: Record<string, Verse>;
};

export const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export const DEFAULT_LINE = "gen1-3", DEFAULT_LAYER: Layer = "accents", DEFAULT_LENS = "all", DEFAULT_ROOT = "mlk", DEFAULT_FORM = "w";
export const LAYERS: { id: Layer; label: string; line: string }[] = [
  { id: "letters", label: "Letters", line: "The consonants, some of them holding a vowel. This is what the Nash Papyrus below looks like." },
  { id: "points", label: "Letters and points", line: "Now every vowel is marked, and the dots that change a letter's sound." },
  { id: "accents", label: "Letters, points and accents", line: "The whole page as the Leningrad Codex has it. Accents mark stress and how the line is sung and divided." },
];

export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));
export const verseByLabel = new Map(Object.entries(H.verses));
export const letterById = new Map(D.letters.map((l) => [l.id, l]));
export const ruleById = new Map(D.rules.map((r) => [r.id, r]));
export const featuredById = new Map(D.featured.map((f) => [f.id, f]));
const lineById = new Map(D.lines.map((l) => [l.id, l]));
const layerById = new Map(LAYERS.map((l) => [l.id as string, l.id]));
const lensById = new Map(D.lenses.map((l) => [l.id, l]));
const rootById = new Map(D.roots.map((r) => [r.id, r]));
const formById = new Map(D.forms.map((f) => [f.id, f]));
const openable = new Map<string, Opened>([
  ...D.letters.map((letter) => [`letter:${letter.id}`, { type: "letter", letter }] as [string, Opened]),
  ...D.featured.map((item) => [`word:${item.id}`, { type: "word", item, data: H.featured[item.id] }] as [string, Opened]),
  ...D.grid.rows.flatMap((row) => D.grid.cols.flatMap((col) => {
    const cell = H.grid[`${row.id}-${col.id}`];
    return cell ? [[`cell:${row.id}-${col.id}`, { type: "cell", row, col, cell }] as [string, Opened]] : [];
  })),
]);

export const findLine = (value: string | null): Line => (value ? lineById.get(value) : undefined) ?? lineById.get(DEFAULT_LINE)!;
export const findLayer = (value: string | null): Layer => (value ? layerById.get(value) : undefined) ?? DEFAULT_LAYER;
export const findLens = (value: string | null): Lens => (value ? lensById.get(value) : undefined) ?? lensById.get(DEFAULT_LENS)!;
export const findRoot = (value: string | null): Root => (value ? rootById.get(value) : undefined) ?? rootById.get(DEFAULT_ROOT)!;
export const findForm = (value: string | null): Form => (value ? formById.get(value) : undefined) ?? formById.get(DEFAULT_FORM)!;
export const findOpened = (value: string | null): Opened | null => (value ? openable.get(value) : undefined) ?? null;

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

const cp = (n: number) => String.fromCodePoint(n);
const ACCENTS = new RegExp(`[${cp(0x591)}-${cp(0x5af)}${cp(0x5bd)}${cp(0x5c0)}]`, "g");
const POINTS = new RegExp(`[${cp(0x5b0)}-${cp(0x5bc)}${cp(0x5c1)}${cp(0x5c2)}${cp(0x5c7)}]`, "g");
const JOINERS = new RegExp(`[${cp(0x34f)}${cp(0x200c)}${cp(0x200d)}]`, "g");
const PUNCTUATION = new RegExp(`[${cp(0x5be)}${cp(0x5c3)}]`, "g");
const CLUSTER = new RegExp(`[${cp(0x5d0)}-${cp(0x5ea)}][^${cp(0x5d0)}-${cp(0x5ea)}]*`, "g");

/** One layer of a word: the page's text with accents, or with points, taken away. Spaces, the joining stroke and the verse's end stay. */
export function peel(text: string, layer: Layer): string {
  if (layer === "accents") return text;
  const pointed = text.replace(ACCENTS, "").replace(JOINERS, "");
  return (layer === "points" ? pointed : pointed.replace(POINTS, "")).normalize("NFC");
}

/** The word on its own, with its points: no accents, joining stroke or verse end. */
export function bare(text: string): string {
  return peel(text, "points").replace(PUNCTUATION, "");
}

/** A word cut into letters, each with the marks that belong to it. */
export function clusters(word: string): string[] {
  return word.match(CLUSTER) ?? [];
}

/** A root's letters split a word into seven places, so three threads can run down the same columns of every row. */
export function rootPlaces(word: string, root: number[]): string[] {
  const c = clusters(word);
  const [a, b, d] = root;
  return [c.slice(0, a).join(""), c[a], c.slice(a + 1, b).join(""), c[b], c.slice(b + 1, d).join(""), c[d], c.slice(d + 1).join("")];
}

/** What a reader says for one letter and one point. */
export function syllable(carrier: Carrier, vowel: Vowel): string {
  if (vowel.id === "sheva") return `${carrier.sound}e, or ${carrier.sound}`;
  return `${carrier.sound}${vowel.sound}`;
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

/** The thing a lens picks out, among the twenty-two. */
export function inLens(letter: Letter, lens: string): boolean {
  if (lens === "twins") return letter.twins.length > 0;
  if (lens === "dots") return Boolean(letter.dot);
  if (lens === "finals") return Boolean(letter.final);
  return true;
}
