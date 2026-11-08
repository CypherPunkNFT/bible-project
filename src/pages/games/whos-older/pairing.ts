// Who's older?: the one rule that decides whether a pair may be asked, and which came first (design §5), plus the
// difficulty bands (§6.3). The build script (scripts/build-whos-older.ts) and the game import this same file, so they
// can never disagree. No imports, so Node can load it as it is (--experimental-strip-types).

export type Tier = 1 | 2 | 3;
export type Band = "easy" | "medium" | "hard";
export const BANDS: readonly Band[] = ["easy", "medium", "hard"];

export type FactKind = "stated-age" | "birth-order" | "parent" | "grandparent" | "generation-gap" | "created-first";
export const FACT_KINDS: readonly FactKind[] = ["stated-age", "birth-order", "parent", "grandparent", "generation-gap", "created-first"];

/** A verse span: [first verse, last verse] as book * 1_000_000 + chapter * 1_000 + verse. */
export type Span = [number, number];

/** What pairing needs to know about a person. Years are historians' years: negative = BC, no year 0 (§4.2.2). */
export interface Person {
  id: string;
  label: string;
  tier: Tier;
  /** Earliest possible birth year; null = no earliest bound. */
  lo: number | null;
  /** Latest possible birth year; null = no latest bound. */
  hi: number | null;
  /** false = early Genesis: the bounds only keep the genealogies' order and are never shown as years. */
  shown: boolean;
}

export interface Fact {
  first: string;
  second: string;
  kind: FactKind;
  refs: Span[];
  why: string;
  /** True for parent and grandparent facts the build derived from the family links. */
  derived?: boolean;
}

export type Reason = { kind: "fact"; fact: Fact } | { kind: "windows"; gap: number };

export interface Order<P extends Person = Person> {
  first: P;
  second: P;
  reason: Reason;
}

/** Never shown as a card (§3.3): Jesus (John 8:58) and Melchizedek (Hebrews 7:3). God and angels are not in people.json. */
export const EXCLUDED_IDS: readonly string[] = ["jesus-isa-7-14", "melchizedek-gen-14-18"];

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

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

/** Throws on year 0, which historians' numbering does not have. */
export function checkYear(year: number): number {
  if (year === 0 || !Number.isInteger(year)) throw new Error(`expected a whole year other than 0 (historians' numbering), got ${year}`);
  return year;
}

/** Whole years from `earlier` to `later`; crossing from BC into AD counts one year fewer (10 BC to AD 15 is 24). */
export function yearsBetween(earlier: number, later: number): number {
  checkYear(earlier);
  checkYear(later);
  return later - earlier - (earlier < 0 && later > 0 ? 1 : 0);
}

const firstWord = (label: string) => label.split(/[\s(]+/)[0].toLowerCase();
const qualified = (label: string) => label.trim().split(/\s+/).length > 1;

/** Two labels that could be misread as the same person: same first word, and at least one with no qualifier (§5.3). */
export function labelsClash(a: string, b: string): boolean {
  return firstWord(a) === firstWord(b) && !(qualified(a) && qualified(b));
}

/** a was certainly born before b on its window alone: strictly, with no shared year; an open edge proves nothing. */
const windowsBefore = (a: Person, b: Person) => a.hi !== null && b.lo !== null && a.hi < b.lo;

/** The order of a pair, or null when it must never be asked (§5.1). */
export function orderOf<P extends Person>(a: P, b: P, index: PairIndex): Order<P> | null {
  if (a.id === b.id || EXCLUDED_IDS.includes(a.id) || EXCLUDED_IDS.includes(b.id)) return null;
  if (labelsClash(a.label, b.label)) return null;
  const key = pairKey(a.id, b.id);
  if (index.blocked.has(key)) return null;
  const fact = index.facts.get(key);
  if (fact) return fact.first === a.id ? { first: a, second: b, reason: { kind: "fact", fact } } : { first: b, second: a, reason: { kind: "fact", fact } };
  if (windowsBefore(a, b)) return { first: a, second: b, reason: { kind: "windows", gap: yearsBetween(a.hi!, b.lo!) } };
  if (windowsBefore(b, a)) return { first: b, second: a, reason: { kind: "windows", gap: yearsBetween(b.hi!, a.lo!) } };
  return null;
}

const FAMILY_KINDS: readonly FactKind[] = ["parent", "grandparent", "created-first"];

/** Easy, Medium or Hard (§6.3): a fact pair is banded by its fact, a windows pair by its tiers and gap. */
export function bandOf(order: Order): Band {
  const { first, second, reason } = order;
  const bothFamous = first.tier === 1 && second.tier === 1;
  const bothKnown = first.tier <= 2 && second.tier <= 2;
  if (reason.kind === "fact") return bothFamous && FAMILY_KINDS.includes(reason.fact.kind) ? "medium" : "hard";
  if (!first.shown && !second.shown) return bothFamous ? "medium" : "hard";
  if (bothFamous && reason.gap >= 400) return "easy";
  if (bothKnown && reason.gap >= 100) return "medium";
  return "hard";
}

/** Every askable pair in a pool, each with its band. */
export function allPairs<P extends Person>(people: readonly P[], index: PairIndex): (Order<P> & { band: Band })[] {
  const out: (Order<P> & { band: Band })[] = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const order = orderOf(people[i], people[j], index);
      if (order) out.push({ ...order, band: bandOf(order) });
    }
  }
  return out;
}
