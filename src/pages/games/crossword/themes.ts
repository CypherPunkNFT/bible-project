// Bible crossword: the themes, levels and sizes (docs/features/bible-crossword/design.md §1–§2, §8). The page and the
// build script (scripts/build-crossword.ts, which checks every theme has clues enough) both read this file, so it
// has no imports. The theme titles live here in the page code, where the translation collector reads them.

export type Kind = "person" | "place" | "verse" | "quiz";
export type Level = "easy" | "medium" | "hard";
export type Size = "small" | "medium" | "large";

/** One clue in clues.json (design §2). */
export interface ClueEntry {
  /** The answer in grid letters. */
  a: string;
  /** The answer as written. */
  w: string;
  /** The clue. */
  c: string;
  k: Kind;
  /** 1 well known, 2 known, 3 deeper. */
  t: 1 | 2 | 3;
  /** Book numbers (1–66) it belongs to. */
  b: number[];
  /** Its verse (BBCCCVVV), or null. */
  r: number | null;
  /** A person's record id, or null. */
  p: string | null;
  /** The question bank's topic, or null. */
  q: string | null;
}

export interface Theme {
  id: string;
  title: string;
  /** The short line under the title on its start-screen tile. */
  note: string;
  /** First and last book number, inclusive. */
  books?: readonly [number, number];
  /** Question-bank topic whose questions also belong. */
  topic?: string;
  kind?: Kind;
}

export const THEMES: readonly Theme[] = [
  { id: "whole", title: "Whole Bible", note: "Genesis to Revelation" },
  { id: "beginnings", title: "Creation & the patriarchs", note: "Genesis", books: [1, 1], topic: "beginnings" },
  { id: "exodus", title: "Moses & the Exodus", note: "Exodus to Deuteronomy", books: [2, 5], topic: "exodus" },
  { id: "kingdom", title: "Judges & kings", note: "Joshua to Esther", books: [6, 17], topic: "kingdom" },
  { id: "wisdom", title: "Psalms & wisdom", note: "Job to Song of Songs", books: [18, 22], topic: "wisdom" },
  { id: "prophets", title: "Prophets & exile", note: "Isaiah to Malachi", books: [23, 39], topic: "prophets" },
  { id: "jesus", title: "Jesus & the Gospels", note: "Matthew to John", books: [40, 43], topic: "jesus" },
  { id: "church", title: "The early church & letters", note: "Acts to Revelation", books: [44, 66], topic: "church" },
  { id: "people", title: "People", note: "Names from every book", kind: "person" },
  { id: "places", title: "Places", note: "Towns, lands and seas", kind: "place" },
  { id: "verses", title: "Words from verses", note: "Key words from Scripture", kind: "verse" },
];

/** Each theme tile's colour (and "book" for Or one book): one of the site's book-colour tones (src/index.css) per tile, spread so neighbours differ in rows of six and three. */
export const TILE_TONES: Record<string, string> = {
  whole: "epistles", beginnings: "poetry", exodus: "history", kingdom: "revelation", wisdom: "acts", prophets: "prophets",
  jesus: "gospels", church: "epistles", people: "poetry", places: "history", verses: "revelation", book: "prophets",
};

export const LEVELS: readonly Level[] = ["easy", "medium", "hard"];
export const SIZES: readonly Size[] = ["small", "medium", "large"];

/** The highest tier each level takes. */
export const LEVEL_TIER: Record<Level, number> = { easy: 1, medium: 2, hard: 3 };

/** The largest grid (squares across and down) and the words aimed for. */
export const SIZE_GRID: Record<Size, { max: number; target: number }> = {
  small: { max: 9, target: 7 },
  medium: { max: 13, target: 12 },
  large: { max: 17, target: 18 },
};

/** A choice is offered when its pool holds this many times the size's target (design §2). */
export const POOL_FACTOR = 4;

/** A puzzle needs at least this share of its size's target (design §8). */
export const MIN_SHARE = 0.75;

/** A passage (one book) or a theme. */
export type Source = { theme: string } | { book: number };

export function inSource(entry: ClueEntry, source: Source): boolean {
  if ("book" in source) return entry.b.includes(source.book);
  const theme = THEMES.find((t) => t.id === source.theme);
  if (!theme) return false;
  if (theme.kind) return entry.k === theme.kind;
  if (!theme.books) return true;
  const [first, last] = theme.books;
  return entry.b.some((book) => book >= first && book <= last) || (!!theme.topic && entry.q === theme.topic);
}

/** The clues a choice draws from: in the source, at or under the level's tier, short enough for the size. */
export function poolOf(entries: readonly ClueEntry[], source: Source, level: Level, size: Size): ClueEntry[] {
  const max = SIZE_GRID[size].max;
  return entries.filter((e) => e.t <= LEVEL_TIER[level] && e.a.length <= max && inSource(e, source));
}

/** Distinct answers in a pool: what decides whether a choice is offered. */
export const answerCount = (pool: readonly ClueEntry[]): number => new Set(pool.map((e) => e.a)).size;

export const isOffered = (entries: readonly ClueEntry[], source: Source, level: Level, size: Size): boolean =>
  answerCount(poolOf(entries, source, level, size)) >= SIZE_GRID[size].target * POOL_FACTOR;

/** The longest clue, in characters. */
export const MAX_CLUE = 160;

const clueWords = (clue: string) =>
  clue.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().split(/[^A-Z]+/).filter(Boolean);

/** Why a clue breaks a rule or gives its answer away, or null when it is fine (design §8): no word in it may start
 *  with the answer, nor be most of the answer (Levi/"Levites", Israel/"ISRAELITES"). */
export function clueProblem(answer: string, clue: string): string | null {
  if (MAX_CLUE < clue.length) return "clue too long";
  if (clue.trim().length < 8) return "clue too short";
  for (const word of clueWords(clue)) {
    if (word.startsWith(answer)) return "clue holds the answer";
    if (word.length >= 4 && answer.startsWith(word) && answer.length - word.length <= 3) return "clue holds most of the answer";
  }
  return null;
}
