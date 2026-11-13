// What came first?: one item shape and one rule that decides whether a pair may be asked, and which came first
// (design §5). The build script (scripts/build-what-came-first.ts) and the game import this same file, so they can
// never disagree. It imports only Who's older?'s model, so Node can load it as it is (--experimental-strip-types).
import { EXCLUDED_IDS, labelsClash, pairKey, yearsBetween, type Span, type Tier } from "../whos-older/pairing.ts";

export type { Span, Tier };
export { pairKey };

export type CategoryKey = "lived" | "happened" | "ruled" | "built" | "went" | "died" | "books" | "firsts";
export type PairCategory = Exclude<CategoryKey, "firsts">;
export const PAIR_CATEGORIES: readonly PairCategory[] = ["lived", "happened", "ruled", "built", "went", "died", "books"];

/** What pairing needs to know about an item. Years are historians' years: negative = BC, no year 0. */
export interface Item {
  id: string;
  label: string;
  /** In a translated copy, the English label: the clash rule reads it, so every language asks the same pairs. */
  english?: string;
  tier: Tier;
  /** Window of years; null = an open edge, which proves nothing. Both null for a positional item. */
  lo: number | null;
  hi: number | null;
  /** false = early Genesis: the bounds only keep the text's order, are never printed, and prove order only where the
   *  category's rules allow it (`hiddenBoundsProve`). */
  shown: boolean;
  /** Instead of years: the place in a sequence Scripture gives (a journey's first arrivals, the 66 books). */
  position?: number;
  /** Only items of the same group are ever paired (one traveller's one journey). */
  group?: string;
  /** In Books: the testament, which the bands read. */
  testament?: "old" | "new";
}

export interface Fact {
  first: string;
  second: string;
  /** stated (a verse says so), succession, synchronism, expanded (the judges began before Saul), or Who's older?'s
   *  and the Timeline's own kinds. */
  kind: string;
  refs: Span[];
  why: string;
  /** A generation or less apart (the Timeline's events): banded Hard. */
  close?: boolean;
  /** Derived by a build rather than written by hand. */
  derived?: boolean;
}

export type Reason =
  | { kind: "fact"; fact: Fact }
  | { kind: "windows"; gap: number }
  | { kind: "position"; apart: number };

export interface Order<I extends Item = Item> {
  first: I;
  second: I;
  reason: Reason;
}

export interface Rules {
  /** Ids never dealt in this category. */
  excluded: readonly string[];
  /** Refuse two labels that could be misread as one person (Who's older? §5.3). */
  clash: boolean;
  /** Two `shown: false` items may be ordered by their windows (only Who lived first, as Who's older? always has). */
  hiddenBoundsProve: boolean;
}

export const RULES: Record<PairCategory, Rules> = {
  lived: { excluded: EXCLUDED_IDS, clash: true, hiddenBoundsProve: true },
  happened: { excluded: [], clash: false, hiddenBoundsProve: false },
  ruled: { excluded: [], clash: true, hiddenBoundsProve: false },
  built: { excluded: [], clash: false, hiddenBoundsProve: false },
  went: { excluded: [], clash: false, hiddenBoundsProve: false },
  died: { excluded: EXCLUDED_IDS, clash: true, hiddenBoundsProve: false },
  books: { excluded: [], clash: false, hiddenBoundsProve: false },
};

export interface PairIndex {
  facts: ReadonlyMap<string, Fact>;
  blocked: ReadonlySet<string>;
}

export function buildIndex(facts: readonly Fact[], blocked: readonly (readonly [string, string])[]): PairIndex {
  const factMap = new Map<string, Fact>();
  for (const fact of facts) {
    const key = pairKey(fact.first, fact.second);
    if (!factMap.has(key) || (factMap.get(key)!.derived && !fact.derived)) factMap.set(key, fact); // a hand fact beats a derived one
  }
  return { facts: factMap, blocked: new Set(blocked.map(([a, b]) => pairKey(a, b))) };
}

/** a certainly came before b on its window alone: strictly, with no shared year; an open edge proves nothing. */
const windowsBefore = (a: Item, b: Item) => a.hi !== null && b.lo !== null && a.hi < b.lo;

/** The order of a pair, or null when it must never be asked (§5.2). */
export function orderOf<I extends Item>(a: I, b: I, index: PairIndex, rules: Rules): Order<I> | null {
  if (a.id === b.id || rules.excluded.includes(a.id) || rules.excluded.includes(b.id)) return null;
  if (a.group !== b.group) return null;
  if (rules.clash && labelsClash(a.english ?? a.label, b.english ?? b.label)) return null;
  const key = pairKey(a.id, b.id);
  if (index.blocked.has(key)) return null;
  const fact = index.facts.get(key);
  if (fact) return fact.first === a.id ? { first: a, second: b, reason: { kind: "fact", fact } } : { first: b, second: a, reason: { kind: "fact", fact } };
  if (a.position !== undefined && b.position !== undefined) {
    if (a.position === b.position) return null;
    const [first, second] = a.position < b.position ? [a, b] : [b, a];
    return { first, second, reason: { kind: "position", apart: second.position! - first.position! } };
  }
  if (!a.shown && !b.shown && !rules.hiddenBoundsProve) return null;
  if (windowsBefore(a, b)) return { first: a, second: b, reason: { kind: "windows", gap: yearsBetween(a.hi!, b.lo!) } };
  if (windowsBefore(b, a)) return { first: b, second: a, reason: { kind: "windows", gap: yearsBetween(b.hi!, a.lo!) } };
  return null;
}

/** Every askable pair among `items`, unbanded. */
export function allOrders<I extends Item>(items: readonly I[], index: PairIndex, rules: Rules): Order<I>[] {
  const out: Order<I>[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const order = orderOf(items[i], items[j], index, rules);
      if (order) out.push(order);
    }
  }
  return out;
}
