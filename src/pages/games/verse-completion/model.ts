// Verse completion: the shapes the page, the build and the stored record share (design §4.3, §9, §11).

export type Level = "easy" | "medium" | "hard";
export const LEVEL_KEYS: readonly Level[] = ["easy", "medium", "hard"];
export type PickLevel = "easy" | "medium";
export type Tier = 1 | 2 | 3;
export type Testament = "ot" | "nt";
export type Answer = "pick" | "type";
export type Style = "words" | "letters";

/** One passage in pool.json: ids and numbers only, never wording. */
export interface Passage {
  id: string;
  from: number;
  to: number;
  tier: Tier;
  testament: Testament;
  words: number;
  /** For each level, the index of the first hidden word. */
  split: Record<Level, number>;
  /** For Pick at Easy and Medium, the two passages whose endings are the wrong options. */
  decoys: Record<PickLevel, [string, string]>;
  retired?: true;
}

export interface Pool { stamp: string; passages: Passage[] }

/** The groups of books a round can come from besides the testaments (owner, 2026-11-13), by first and last book number. */
export const BOOK_GROUPS = {
  law: [1, 5], history: [6, 17], psalms: [19, 19], prophets: [23, 39], gospels: [40, 43], epistles: [45, 65],
} as const satisfies Record<string, readonly [number, number]>;
export type BookGroup = keyof typeof BOOK_GROUPS;
/** Where a round's verses come from: the whole Bible, a testament or a group of books. */
export type VerseSource = "all" | Testament | BookGroup;
export const VERSE_SOURCES: readonly VerseSource[] = ["all", "ot", "nt", ...(Object.keys(BOOK_GROUPS) as BookGroup[])];

/** Whether a passage belongs to a source of verses. */
export function isFrom(passage: Pick<Passage, "from" | "testament">, source: VerseSource): boolean {
  if (source === "all") return true;
  if (source === "ot" || source === "nt") return passage.testament === source;
  const [first, last] = BOOK_GROUPS[source];
  const book = Math.floor(passage.from / 1e6);
  return book >= first && book <= last;
}

/** `testament` keeps its stored name from before the groups of books, so saved settings still read. */
export interface Settings { answer: Answer; style: Style; level: Level; testament: VerseSource }

export const DEFAULT_SETTINGS: Settings = { answer: "pick", style: "words", level: "easy", testament: "all" };

/** How an answer was given, for the box ceilings (§8.2). */
export type AnswerStyle = "pick" | "letters" | "words";
export const answerStyle = (settings: Pick<Settings, "answer" | "style">): AnswerStyle => settings.answer === "pick" ? "pick" : settings.style;

/** The share of hidden words right, 0–100, to stars (§3.1). Thresholds use the unrounded value. */
export const starsFor = (accuracy: number): 0 | 1 | 2 | 3 => accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 40 ? 1 : 0;

/** Ids in a fixed order, the same in every language. */
export const compareIds = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** A small seeded random number generator (mulberry32), so a reload deals and offers the same things. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable number for a string, to mix a passage id into a seed. */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

/** A copy of `items` in a seeded random order. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
