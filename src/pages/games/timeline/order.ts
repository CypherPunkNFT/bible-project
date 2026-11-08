// Timeline sort: the one rule that decides whether a set of events may be dealt, and why each card follows the one
// before it (design §5.1). The build script (scripts/build-timeline.ts) and the game import this same file, so they can
// never disagree. Only relative imports with their extension, so Node can load it as it is (--experimental-strip-types).
import { yearsBetween } from "../whos-older/pairing.ts";

export type Tier = 1 | 2 | 3;
export type Era = "beginnings" | "patriarchs" | "exodus" | "kingdom" | "divided" | "return" | "jesus" | "church";

/** The eight eras in story order (§6.3), with the names the era menu shows. They are never shown on cards. */
export const ERAS: readonly { key: Era; title: string }[] = [
  { key: "beginnings", title: "Beginnings" },
  { key: "patriarchs", title: "Abraham's world" },
  { key: "exodus", title: "Exodus and conquest" },
  { key: "kingdom", title: "Judges and the united kingdom" },
  { key: "divided", title: "Divided kingdom and exile" },
  { key: "return", title: "Return from exile" },
  { key: "jesus", title: "Life of Jesus" },
  { key: "church", title: "Early church" },
];
export const ERA_KEYS: readonly Era[] = ERAS.map((era) => era.key);

/** A verse span: [first verse, last verse] as book * 1_000_000 + chapter * 1_000 + verse. */
export type Span = [number, number];

/** What ordering needs to know about an event. Years are historians' years: negative = BC, no year 0 (§4.3). */
export interface TimelineEvent {
  id: string;
  label: string;
  era: Era;
  tier: Tier;
  /** Earliest possible year of the moment; null = no earliest bound. */
  lo: number | null;
  /** Latest possible year; null = no latest bound. */
  hi: number | null;
  /** false = early Genesis: the bounds only keep the text's order and never prove an order or appear as years. */
  shown: boolean;
  /** Its place in the whole-pool order the build wrote (§5.1): consistent with every certain order. */
  rank: number;
  /** Removed after launch: still shown on past Daily puzzles, never dealt again (§4.7). */
  retired?: boolean;
}

export interface OrderFact {
  first: string;
  second: string;
  refs: Span[];
  why: string;
  /** The text puts them within about a generation (used by the difficulty rules, §6.2). */
  close: boolean;
}

/** A direct reason that one event came before another. `gap` is the smallest number of years any system allows. */
export type Link = { kind: "fact"; fact: OrderFact } | { kind: "windows"; gap: number };
export interface Step { from: string; to: string; link: Link }
/** One step, or two through another pool event (§5.1). */
export type Explanation = readonly [Step] | readonly [Step, Step];

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export interface OrderIndex {
  byId: ReadonlyMap<string, TimelineEvent>;
  /** Events that may be dealt (not retired), in rank order. */
  active: readonly TimelineEvent[];
  facts: ReadonlyMap<string, OrderFact>;
  contested: ReadonlySet<string>;
  /** explain() results, worked out once per ordered pair. */
  memo: Map<string, Explanation | null>;
}

export function buildOrderIndex(events: readonly TimelineEvent[], facts: readonly OrderFact[], contested: readonly (readonly [string, string])[]): OrderIndex {
  const factMap = new Map<string, OrderFact>();
  for (const fact of facts) factMap.set(pairKey(fact.first, fact.second), fact);
  return {
    byId: new Map(events.map((event) => [event.id, event])),
    active: events.filter((event) => !event.retired).sort((a, b) => a.rank - b.rank || (a.id < b.id ? -1 : 1)),
    facts: factMap,
    contested: new Set(contested.map(([a, b]) => pairKey(a, b))),
    memo: new Map(),
  };
}

export const isContested = (index: OrderIndex, a: string, b: string) => index.contested.has(pairKey(a, b));

/**
 * Years by which `a` certainly ended before `b` began on their windows alone, or null. Strict (a shared year proves
 * nothing), an open edge proves nothing, and two early-Genesis events never prove anything by their invented bounds.
 */
export function windowGap(a: TimelineEvent, b: TimelineEvent): number | null {
  if (!a.shown && !b.shown) return null;
  if (a.hi === null || b.lo === null || !(a.hi < b.lo)) return null;
  return yearsBetween(a.hi, b.lo);
}

/** A direct reason that `a` came before `b`: a fact first, else windows; null for a contested pair (§5.1). */
export function link(index: OrderIndex, a: TimelineEvent, b: TimelineEvent): Link | null {
  if (a.id === b.id || isContested(index, a.id, b.id)) return null;
  const fact = index.facts.get(pairKey(a.id, b.id));
  if (fact) return fact.first === a.id ? { kind: "fact", fact } : null;
  const gap = windowGap(a, b);
  return gap === null ? null : { kind: "windows", gap };
}

const facts = (steps: readonly Step[]) => steps.filter((step) => step.link.kind === "fact").length;
const smallestGap = (steps: readonly Step[]) =>
  Math.min(...steps.map((step) => (step.link.kind === "windows" ? step.link.gap : Infinity)));

/** True when two-step route `x` explains better than `y`: more facts, then the larger smallest gap, then the middle id. */
function better(x: readonly [Step, Step], y: readonly [Step, Step]): boolean {
  if (facts(x) !== facts(y)) return facts(x) > facts(y);
  if (smallestGap(x) !== smallestGap(y)) return smallestGap(x) > smallestGap(y);
  return x[0].to < y[0].to;
}

/** Why `a` came before `b`: one direct link, or two through one other dealable event. Null when it is not certain. */
export function explain(index: OrderIndex, a: TimelineEvent, b: TimelineEvent): Explanation | null {
  const key = `${a.id}>${b.id}`;
  if (index.memo.has(key)) return index.memo.get(key)!;
  let result: Explanation | null = null;
  if (a.id !== b.id && !isContested(index, a.id, b.id)) {
    const direct = link(index, a, b);
    if (direct) result = [{ from: a.id, to: b.id, link: direct }];
    else {
      let best: readonly [Step, Step] | null = null;
      for (const middle of index.active) {
        if (middle.id === a.id || middle.id === b.id) continue;
        const first = link(index, a, middle);
        if (!first) continue;
        const second = link(index, middle, b);
        if (!second) continue;
        const route = [{ from: a.id, to: middle.id, link: first }, { from: middle.id, to: b.id, link: second }] as const;
        if (!best || better(route, best)) best = route;
      }
      result = best;
    }
  }
  index.memo.set(key, result);
  return result;
}

/** The events of a round in their true order (by the build's rank). */
export function trueOrder(index: OrderIndex, ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => index.byId.get(a)!.rank - index.byId.get(b)!.rank);
}

/**
 * A round may be dealt when no two of its events are contested and every card has a reason to follow the one before
 * it in rank order: then the whole order is certain by chaining, with exactly one right answer (§5.1).
 */
export function validRound(index: OrderIndex, ids: readonly string[]): boolean {
  if (new Set(ids).size !== ids.length || ids.some((id) => !index.byId.has(id))) return false;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (isContested(index, ids[i], ids[j])) return false;
  const sorted = trueOrder(index, ids).map((id) => index.byId.get(id)!);
  for (let i = 1; i < sorted.length; i++) if (!explain(index, sorted[i - 1], sorted[i])) return false;
  return true;
}

/** Each join of a round in true order, with its explanation; only for a valid round. */
export function joinsOf(index: OrderIndex, ids: readonly string[]): Explanation[] {
  const sorted = trueOrder(index, ids).map((id) => index.byId.get(id)!);
  return sorted.slice(1).map((event, i) => explain(index, sorted[i], event)!);
}

/**
 * A join counts as close (§6.1) unless the windows alone put the two at least 40 years apart: it is close when any of
 * its steps is a `close` fact, or windows under 40 years between two dated events (an early-Genesis gap is invented).
 */
export const CLOSE_YEARS = 40;
export function joinIsClose(index: OrderIndex, steps: Explanation): boolean {
  const from = index.byId.get(steps[0].from)!;
  const to = index.byId.get(steps[steps.length - 1].to)!;
  const direct = windowGap(from, to);
  if (direct !== null && direct >= CLOSE_YEARS) return false;
  return steps.some((step) => {
    if (step.link.kind === "fact") return step.link.fact.close;
    const shown = index.byId.get(step.from)!.shown && index.byId.get(step.to)!.shown;
    return shown && step.link.gap < CLOSE_YEARS;
  });
}
