// Memory card match (deal.ts): the data file's shape, the pools, drawing a fair board and dealing it
// (docs/features/memory-match/design.md sections 6 and 8). Pure functions over the shipped pairs.json, so the tests can
// draw thousands of boards. A board is fair when every story card on it has exactly one owner among its who cards.

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];
export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
export const BOARD_PAIRS: Record<Difficulty, number> = { easy: 6, medium: 9, hard: 12 };
/** How long a non-pair stays face up before it turns back by itself (design 8). */
export const HOLD_MS: Record<Difficulty, number> = { easy: 3000, medium: 2500, hard: 2000 };
/** A Hard board holds at least this many pairs of tier 2 or 3 (design 8). */
export const HARD_DEEP_PAIRS = 4;
export const MIXED = "mixed";
/** The spec's own example, the lions' den: a new player's first Easy board always has it (design 10). Found by its key
 *  verse, Daniel 6:22, not its story, which a translated copy words in its own language. */
export const SPEC_PAIR = { who: "daniel", keyVerseId: 27006022 } as const;

export interface DeckInfo { key: string; title: string; offered: Record<Difficulty, boolean>; easyExtra: string[] }
export interface CharacterInfo { label: string; href: string | null; first: string; group?: boolean; parable?: boolean }
export interface PairInfo {
  id: string;
  who: string;
  story: string;
  tier: 1 | 2 | 3;
  decks: string[];
  ref: string;
  readerHref: string;
  keyVerse: string;
  keyVerseId: number;
  /** Content words of the story label, worked out by the build (design 6.2). */
  words: string[];
  /** Characters this pair never shares a board with, already symmetric (design 6.1). */
  notWith: string[];
}
export interface PairsFile {
  about: string;
  version: number;
  stamp: string;
  decks: DeckInfo[];
  characters: Record<string, CharacterInfo>;
  pairs: PairInfo[];
}

export interface Card { pair: string; kind: "who" | "story" }

export type Rng = () => number;

/** A small seeded generator (mulberry32), so a board can be drawn again from its seed in tests. */
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

/** Fisher–Yates on a copy. */
export function shuffle<T>(values: readonly T[], rng: Rng): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const deckOf = (data: PairsFile, key: string) => data.decks.find((deck) => deck.key === key);

export const isOffered = (data: PairsFile, deck: string, difficulty: Difficulty) => !!deckOf(data, deck)?.offered[difficulty];

/** The card backs say "Who" or "Story" on Easy and Medium only (design 8). */
export const typedBacks = (difficulty: Difficulty) => difficulty !== "hard";

/** Fixed when the cards are dealt, so a turned phone never moves a card (design 8). */
export function columnsFor(difficulty: Difficulty, narrow: boolean): number {
  const table: Record<Difficulty, [number, number]> = { easy: [3, 4], medium: [3, 6], hard: [4, 6] };
  return table[difficulty][narrow ? 0 : 1];
}

/** The pairs a deck and difficulty draw from: tier 1 (plus the build's top-up) on Easy, tiers 1–2 on Medium, all on Hard. */
export function poolFor(data: PairsFile, deck: string, difficulty: Difficulty): PairInfo[] {
  const inDeck = data.pairs.filter((pair) => deck === MIXED || pair.decks.includes(deck));
  if (difficulty === "hard") return inDeck;
  if (difficulty === "medium") return inDeck.filter((pair) => pair.tier <= 2);
  const extra = new Set(deckOf(data, deck)?.easyExtra ?? []);
  return inDeck.filter((pair) => pair.tier === 1 || extra.has(pair.id));
}

export const specPair = (data: PairsFile) =>
  data.pairs.find((pair) => pair.who === SPEC_PAIR.who && pair.keyVerseId === SPEC_PAIR.keyVerseId);

/** True when two pairs must not share a board (design 6.1–6.4; shared words only on Easy). */
export function clashes(data: PairsFile, a: PairInfo, b: PairInfo, difficulty: Difficulty): boolean {
  if (a.who === b.who) return true;
  if (data.characters[a.who].first === data.characters[b.who].first) return true;
  if (a.notWith.includes(b.who) || b.notWith.includes(a.who)) return true;
  return difficulty === "easy" && a.words.some((word) => b.words.includes(word));
}

/** Unseen pairs first in random order, then seen ones, the longest ago first (design 6.5 and 10). */
function ordered(pool: readonly PairInfo[], seen: readonly string[], rng: Rng, useSeen: boolean): PairInfo[] {
  const mixed = shuffle(pool, rng);
  if (!useSeen) return mixed;
  const age = new Map(seen.map((id, n) => [id, n]));
  return [...mixed.filter((pair) => !age.has(pair.id)),
    ...mixed.filter((pair) => age.has(pair.id)).sort((a, b) => age.get(a.id)! - age.get(b.id)!)];
}

function walk(data: PairsFile, order: readonly PairInfo[], difficulty: Difficulty, first: PairInfo | undefined): PairInfo[] | null {
  const size = BOARD_PAIRS[difficulty];
  const chosen: PairInfo[] = first ? [first] : [];
  const tryAdd = (pair: PairInfo) => {
    if (chosen.length < size && !chosen.includes(pair) && !chosen.some((other) => clashes(data, pair, other, difficulty))) chosen.push(pair);
  };
  if (difficulty === "hard") {
    for (const pair of order) if (pair.tier >= 2 && chosen.filter((p) => p.tier >= 2).length < HARD_DEEP_PAIRS) tryAdd(pair);
  }
  for (const pair of order) tryAdd(pair);
  const deepEnough = difficulty !== "hard" || chosen.filter((p) => p.tier >= 2).length >= HARD_DEEP_PAIRS;
  return chosen.length === size && deepEnough ? chosen : null;
}

/**
 * The board's pair ids. Up to 50 walks favour pairs not seen lately, then 50 more ignore what was seen; on the
 * shipped data the first walk nearly always succeeds (board.test.ts draws thousands).
 */
export function drawPairs(data: PairsFile, deck: string, difficulty: Difficulty, seen: readonly string[], rng: Rng,
  withSpecPair = false): string[] {
  const pool = poolFor(data, deck, difficulty);
  const spec = specPair(data);
  const first = withSpecPair && spec && pool.includes(spec) ? spec : undefined;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const board = walk(data, ordered(pool, seen, rng, attempt < 50), difficulty, first);
    if (board) return board.map((pair) => pair.id);
  }
  throw new Error(`memory match: could not draw a ${difficulty} board from the ${deck} deck (${pool.length} pairs)`);
}

/**
 * The 2n cards in their places. Where the backs show the card type, a who card and its own story never take the first
 * two places, so a lucky first move cannot teach nothing (design 6.5).
 */
export function dealCards(pairIds: readonly string[], difficulty: Difficulty, rng: Rng): Card[] {
  const cards = shuffle(pairIds.flatMap((pair): Card[] => [{ pair, kind: "who" }, { pair, kind: "story" }]), rng);
  if (typedBacks(difficulty) && cards.length > 2 && cards[0].pair === cards[1].pair) {
    const swap = 2 + Math.floor(rng() * (cards.length - 2));
    [cards[1], cards[swap]] = [cards[swap], cards[1]];
  }
  return cards;
}

/** Whether a deck's pool holds the spec's pair (Mixed and Prophets and exile do). */
export const opensWithSpecPair = (data: PairsFile, deck: string, difficulty: Difficulty) => {
  const spec = specPair(data);
  return difficulty === "easy" && !!spec && poolFor(data, deck, difficulty).includes(spec);
};
