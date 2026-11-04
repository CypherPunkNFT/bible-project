// The Strong's numbers study's data and its small rules: the research record, the generated counts, the Berean reader link,
// the address values it accepts, and how a typed number is read. Everything the address asks for is looked up in a Map, so an
// unknown value falls back to the default.
import dossier from "../../../../content/academic-research/26-strongs-numbers.json";
import generated from "./strongs-data.json";

export type Sample = { code: string; chapter: number; verse: number; kjv: string; bsbWord: string | null };
export type Row = { label: string; count: number; sample: Sample };
export type Word = { id: string; lang: string; lemma: string; translit: string; gloss: string; total: number; rows: Row[]; other: number };
export type Band = { letter: string; name: string; from: number; to: number; first: { n: number; lemma: string; translit: string; gloss: string } };
export type Alphabet = "greek" | "hebrew";

export const ext = { target: "_blank", rel: "noopener" } as const;
export const D = dossier;
export const SN = generated as unknown as {
  counts: { rawTags: number; numbersTagged: { hebrew: number; greek: number }; hebrewTop: number; greekTop: number; greekUnused: number };
  bands: Record<Alphabet, Band[]>;
  outOfPlace: Record<Alphabet, { read: number; count: number; numbers: number[] }>;
  words: Word[];
  lemmas: Omit<Word, "total" | "rows" | "other">[];
  love: { numbers: { id: string; count: number }[]; john21: { verse: number; numbers: string[] }[] };
  samples: Record<"exodus21" | "john3" | "exodus10" | "romans1", Sample>;
};

export const wordsById = new Map(SN.words.map((w) => [w.id, w]));
export const lemmaById = new Map([...SN.words, ...SN.lemmas].map((w) => [w.id, w]));
export const sourceById = new Map(D.sources.map((s) => [s.id, s]));
export const pictureById = new Map(D.pictures.map((p) => [p.id, p]));

/** Every verse on this page opens in the Berean, whatever the reader last read (study rule 3). */
export function readerHref(code: string, chapter: number, verse: number): string {
  return `/read/bsb/${code}/${chapter}?hl=${verse}-${verse}`;
}

export function parseAlphabet(value: string | null): Alphabet {
  return value === "hebrew" ? "hebrew" : "greek";
}

export function findBand(alphabet: Alphabet, name: string | null): Band | undefined {
  return SN.bands[alphabet].find((b) => b.name === name);
}

/** The band holding a number. Bands run unbroken from 1 to the last number, as the data build asserts. */
export function bandOf(alphabet: Alphabet, n: number): Band | undefined {
  return SN.bands[alphabet].find((b) => n >= b.from && n <= b.to);
}

export function findOpened(wordId: string | null, label: string | null): { word: Word; row: Row } | null {
  const word = wordId ? wordsById.get(wordId) : undefined;
  const row = word?.rows.find((r) => r.label === label);
  return word && row ? { word, row } : null;
}

export type Parsed =
  | { kind: "empty" } | { kind: "bad" } | { kind: "hebrew"; id: string }
  | { kind: "range"; n: number } | { kind: "unused"; id: string } | { kind: "ok"; id: string };

/** A typed number: "G26", "g0026" and "26" are the same Greek number. The tags are unpadded, so the result is too. */
export function parseNumber(input: string): Parsed {
  const text = input.trim();
  if (!text) return { kind: "empty" };
  const match = /^([gGhH]?)\s*0*(\d{1,4})$/.exec(text);
  if (!match) return { kind: "bad" };
  const n = Number(match[2]);
  if (match[1].toLowerCase() === "h") return { kind: "hebrew", id: `H${n}` };
  if (n < 1 || n > SN.counts.greekTop) return { kind: "range", n };
  if (n === 2717 || (n >= 3203 && n <= 3302)) return { kind: "unused", id: `G${n}` };
  return { kind: "ok", id: `G${n}` };
}
