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

/** Two sets clash in one round when they have the same answer or share three of their four (the audit's repeats). */
export function clashes(a: SetEntry, b: SetEntry): boolean {
  if (a.odd === b.odd) return true;
  return a.items.filter((id) => b.items.includes(id)).length >= 3;
}

/**
 * Takes up to `want` sets from `candidates` in order, skipping any that clash with one already chosen, then, when the
 * rule leaves the round short, the skipped ones in their original order: a round is always as long as the pool allows.
 */
export function spread(candidates: readonly SetEntry[], chosen: readonly SetEntry[], want: number): SetEntry[] {
  const taken: SetEntry[] = [];
  const skipped: SetEntry[] = [];
  for (const set of candidates) {
    if (taken.length >= want) break;
    if ([...chosen, ...taken].some((other) => clashes(set, other))) skipped.push(set);
    else taken.push(set);
  }
  return [...taken, ...skipped].slice(0, want);
}

/**
 * Ten set ids for a round. Sets seen recently are skipped until the pool runs out, then the oldest seen come back
 * first; freshness outranks everything else. Within the fresh and then the stale, sets that would repeat an answer
 * or three of the same four in one round are left for later (spread). A new player's first Easy People round opens
 * with the owner's example (Peter, John, Paul, James).
 */
export function buildRound(data: SetsFile, choice: Choice, difficulty: Difficulty, seen: readonly string[], rng: Rng,
  firstRun = false): string[] {
  const pool = playablePool(data, choice, difficulty);
  const seenAt = new Map(seen.map((id, index) => [id, index]));
  const opener = firstRun && opensWithExample(data, choice, difficulty) ? pool.find((set) => set.id === data.first) : undefined;
  const rest = pool.filter((set) => set !== opener);
  const fresh = shuffle(rest.filter((set) => !seenAt.has(set.id)), rng);
  const stale = rest.filter((set) => seenAt.has(set.id)).sort((a, b) => (seenAt.get(a.id) ?? 0) - (seenAt.get(b.id) ?? 0));
  let chosen: SetEntry[] = opener ? [opener] : [];
  chosen = [...chosen, ...spread(fresh, chosen, ROUND_LENGTH - chosen.length)];
  chosen = [...chosen, ...spread(stale, chosen, ROUND_LENGTH - chosen.length)];
  return chosen.map((set) => set.id);
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

/** The share text: the score, the round, the ten squares and the address; never a name, so it spoils nothing. */
export const SHARE_ADDRESS = "bibleguide.io/games/odd-one-out";
export function shareLines(choice: Choice, difficulty: Difficulty, score: number, squares: string): string {
  return [`Odd one out: ${score} of ${ROUND_LENGTH}`, `${CHOICE_LABELS[choice]} · ${DIFFICULTY_LABELS[difficulty]}`, squares, SHARE_ADDRESS].join("\n");
}

/** The title a round's score earns, by its share of ten. */
export const RANKS = [
  { from: 0, title: "Keep looking" },
  { from: 0.4, title: "A good eye" },
  { from: 0.7, title: "Hard to fool" },
  { from: 1, title: "Nothing gets past you" },
] as const;

/** Why some levels are greyed for a choice, in one fixed line; null when every level is open. */
export function levelsNote(data: SetsFile, choice: Choice): string | null {
  const open = DIFFICULTIES.filter((d) => isAvailable(data, choice, d));
  if (open.length === DIFFICULTIES.length) return null;
  if (open.length === 2) return "Easy and Medium for now: Hard needs more puzzles.";
  if (open.length === 1) return "Easy only for now: the other levels need more puzzles.";
  return "No puzzles at any level yet.";
}
