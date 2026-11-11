// Odd one out: the game's pure logic (docs/features/odd-one-out/design.md, sections 7 and 9). Rounds, shuffling,
// scoring, freshness and the words of the reveal; the sets themselves are built ahead of time by
// scripts/build-odd-one-out.py into src/data/odd-one-out/sets.json. Nothing here touches the page.
import { formatList } from "@/lib/site-format";

export type Kind = "person" | "place" | "book";
export type Choice = Kind | "mixed";
export type Difficulty = "easy" | "medium" | "hard";

export const KINDS: readonly Kind[] = ["person", "place", "book"];
export const CHOICES: readonly Choice[] = ["person", "place", "book", "mixed"];
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];
export const CHOICE_LABELS: Record<Choice, string> = { person: "People", place: "Places", book: "Books", mixed: "Mixed" };
export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
export const ROUND_LENGTH = 10;
export const SEEN_LIMIT = 200;

export interface RuleEntry {
  kind: Kind;
  members: string;
  odd: string;
  oddOnly?: string;
  others?: string;
  keyRef?: [number, number];
}

export interface ItemEntry { kind: Kind; label: string; brief: string; href: string; ref: number }

export interface SetEntry {
  id: string;
  kind: Kind;
  difficulty: Difficulty;
  items: string[];
  odd: string;
  rule: string;
  polarity: "members-share" | "odd-only";
  labels?: Record<string, string>;
  facts?: Record<string, number>;
  also?: string[];
}

export interface SetsFile {
  version: number;
  stamp: string;
  minSets: number;
  first: string;
  books: [string, string][];
  rules: Record<string, RuleEntry>;
  items: Record<string, ItemEntry>;
  sets: SetEntry[];
}

export type Rng = () => number;

/** A small seeded random source, so rounds can be tested; the page seeds it from the clock. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates: every order equally likely, so the odd one is in each place equally often. */
export function shuffle<T>(values: readonly T[], rng: Rng): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function poolFor(data: SetsFile, choice: Choice, difficulty: Difficulty): SetEntry[] {
  return data.sets.filter((set) => set.difficulty === difficulty && (choice === "mixed" || set.kind === choice));
}

/** Whether a choice can be played: a kind needs the minimum on its own; Mixed draws on the kinds that are offered. */
export function isAvailable(data: SetsFile, choice: Choice, difficulty: Difficulty): boolean {
  if (choice !== "mixed") return poolFor(data, choice, difficulty).length >= data.minSets;
  return KINDS.filter((kind) => isAvailable(data, kind, difficulty)).length > 0;
}

/** The sets a round may draw from: Mixed leaves out a kind too thin to be offered on its own. */
export function playablePool(data: SetsFile, choice: Choice, difficulty: Difficulty): SetEntry[] {
  if (choice !== "mixed") return poolFor(data, choice, difficulty);
  return data.sets.filter((set) => set.difficulty === difficulty && isAvailable(data, set.kind, difficulty));
}

/**
 * Ten set ids for a round. Sets seen recently are skipped until the pool runs out, then the oldest seen come back
 * first. A new player's first Easy People round opens with the owner's example (Peter, John, Paul, James).
 */
export function buildRound(data: SetsFile, choice: Choice, difficulty: Difficulty, seen: readonly string[], rng: Rng,
  firstRun = false): string[] {
  const pool = playablePool(data, choice, difficulty);
  const seenAt = new Map(seen.map((id, index) => [id, index]));
  const fresh = shuffle(pool.filter((set) => !seenAt.has(set.id)), rng).map((set) => set.id);
  const stale = pool.filter((set) => seenAt.has(set.id))
    .sort((a, b) => (seenAt.get(a.id) ?? 0) - (seenAt.get(b.id) ?? 0)).map((set) => set.id);
  let ids = [...fresh, ...stale].slice(0, ROUND_LENGTH);
  if (firstRun && opensWithExample(data, choice, difficulty)) {
    ids = [data.first, ...ids.filter((id) => id !== data.first)].slice(0, ROUND_LENGTH);
  }
  return ids;
}

/** Whether rounds of this kind and difficulty are the ones the owner's example can open. */
export function opensWithExample(data: SetsFile, choice: Choice, difficulty: Difficulty): boolean {
  const opener = data.sets.find((set) => set.id === data.first);
  return !!opener && choice === opener.kind && difficulty === opener.difficulty;
}

export function scoreRound(results: readonly boolean[]): { score: number; bestStreak: number } {
  let streak = 0;
  let bestStreak = 0;
  for (const right of results) {
    streak = right ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }
  return { score: results.filter(Boolean).length, bestStreak };
}

/** What the button says: a seed set may give a bare name where the other three make it clear. */
export const shownLabel = (data: SetsFile, set: SetEntry, id: string) => set.labels?.[id] ?? data.items[id].label;

/** "and"-joined list in the site's language: "Peter, John, and James". */
export const joinNames = (names: readonly string[]): string => formatList(names);

/** The reason, in two parts: the odd item's phrase and the sentence about the other three (design 5.5). */
export function headline(data: SetsFile, set: SetEntry): { odd: string; oddPhrase: string; rest: string } {
  const rule = data.rules[set.rule];
  const others = joinNames(set.items.filter((id) => id !== set.odd).map((id) => shownLabel(data, set, id)));
  const oddOnly = set.polarity === "odd-only";
  return {
    odd: shownLabel(data, set, set.odd),
    oddPhrase: oddOnly ? rule.oddOnly ?? rule.odd : rule.odd,
    rest: `${others} ${oddOnly ? rule.others ?? "" : rule.members}.`,
  };
}

/** The verse that shows the rule's fact for one item, else the item's own first verse. */
export const itemRef = (data: SetsFile, set: SetEntry, id: string) => set.facts?.[id] ?? data.items[id].ref;

export function splitRef(ref: number): { book: number; chapter: number; verse: number } {
  return { book: Math.floor(ref / 1_000_000), chapter: Math.floor(ref / 1000) % 1000, verse: ref % 1000 };
}

/** "Matthew 4:18", or "Matthew 4:18–19" for a two-verse key quote. */
export function verseLabel(data: SetsFile, ref: number, end?: number): string {
  const { book, chapter, verse } = splitRef(ref);
  const name = data.books[book - 1]?.[1] ?? "";
  const last = end && end !== ref ? `–${splitRef(end).verse}` : "";
  return `${name} ${chapter}:${verse}${last}`;
}

/** The reader at that verse, in the form the home quiz and connections panel use. */
export function verseHref(data: SetsFile, ref: number, end?: number): string {
  const { book, chapter, verse } = splitRef(ref);
  const code = data.books[book - 1]?.[0] ?? "GEN";
  const last = end && end !== ref ? `-${splitRef(end).verse}` : "";
  return `/read/bsb/${code}/${chapter}?hl=${verse}${last}`;
}
