// Timeline sort's Practice dealing (design §5.2, §6.2): a random set of events whose order is certain, close enough or
// far enough apart for the level, then shuffled so it never starts sorted. Certainty is never relaxed: when a set cannot
// be found, the dealer widens the tiers (era packs only) or gives up, never deals a doubtful one.
// Only relative imports with their extension, so the build script can load it (--experimental-strip-types).
import { joinsOf, validRound, windowGap, type Era, type Explanation, type OrderIndex, type Tier, type TimelineEvent } from "./order.ts";

export type Level = "easy" | "medium" | "hard";
export type EraChoice = Era | "all";
export const LEVEL_KEYS: readonly Level[] = ["easy", "medium", "hard"];
export const LEVELS: Record<Level, { title: string; cards: number; maxTier: Tier }> = {
  easy: { title: "Easy", cards: 4, maxTier: 1 },
  medium: { title: "Medium", cards: 5, maxTier: 2 },
  hard: { title: "Hard", cards: 7, maxTier: 3 },
};
/** Restarts before the "seen least recently" weighting is dropped, and in all. */
const WEIGHTED_ATTEMPTS = 200;
const ATTEMPTS = 400;
/**
 * An era pack widens its tiers when it has fewer than this many events per card at the level's tiers, so a thin era
 * (the Return has five famous events, the judges and kings twelve) still deals varied rounds rather than the same two again and again.
 */
const MIN_POOL_PER_CARD = 4;

/**
 * Whether one join is far enough apart for a rule (§6.2). Easy: windows at least 200 years apart, a fact between two
 * early-Genesis events, or any join from early Genesis to a dated event. Medium: windows at least 40 years apart, or
 * steps that are all non-close facts or wide windows. Hard (and every era pack): any join.
 */
export function joinAllowed(index: OrderIndex, steps: Explanation, rule: Level): boolean {
  if (rule === "hard") return true;
  const from = index.byId.get(steps[0].from)!;
  const to = index.byId.get(steps[steps.length - 1].to)!;
  if (rule === "easy") {
    if (!from.shown && !to.shown) return steps.every((step) => step.link.kind === "fact");
    if (!from.shown) return true;
    return (windowGap(from, to) ?? 0) >= 200;
  }
  if ((windowGap(from, to) ?? 0) >= 40) return true;
  return steps.every((step) => (step.link.kind === "fact" ? !step.link.fact.close : step.link.gap >= 40));
}

/** A set of events may be dealt at this rule: certain, with every join allowed. */
export function roundFits(index: OrderIndex, ids: readonly string[], rule: Level): boolean {
  return validRound(index, ids) && (rule === "hard" || joinsOf(index, ids).every((steps) => joinAllowed(index, steps, rule)));
}

/** The events Practice may deal for a level and era, at a tier limit. */
export function candidates(index: OrderIndex, era: EraChoice, maxTier: Tier): TimelineEvent[] {
  return index.active.filter((event) => event.tier <= maxTier && (era === "all" || event.era === era));
}

/** How strongly to prefer each event: 1 when not seen lately, down towards 0 for the one seen last. */
function recencyWeight(recent: readonly string[]): (id: string) => number {
  const last = new Map(recent.map((id, i) => [id, i]));
  return (id) => {
    const at = last.get(id);
    return at === undefined ? 1 : (recent.length - at) / (recent.length + 1);
  };
}

/** One set of `cards` events from `pool` that fits `rule`, in true order, or null after every attempt. */
export function pickRound(index: OrderIndex, pool: readonly TimelineEvent[], cards: number, rule: Level, random: () => number, recent: readonly string[] = []): string[] | null {
  if (pool.length < cards) return null;
  const weight = recencyWeight(recent);
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const weighted = attempt < WEIGHTED_ATTEMPTS;
    const key = new Map(pool.map((event) => [event.id, weighted ? random() ** (1 / weight(event.id)) : random()]));
    const ranked = [...pool].sort((a, b) => key.get(b.id)! - key.get(a.id)!);
    const chosen = [ranked[0].id];
    while (chosen.length < cards) {
      const next = ranked.find((event) => !chosen.includes(event.id) && roundFits(index, [...chosen, event.id], rule));
      if (!next) break;
      chosen.push(next.id);
    }
    if (chosen.length === cards) return chosen;
  }
  return null;
}

/** The dealt order: never already sorted, and at most one card starting in its right slot (§5.2). */
export function shuffleForDisplay(truth: readonly string[], random: () => number): string[] {
  for (let attempt = 0; attempt < 500; attempt++) {
    const order = [...truth];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const inPlace = order.filter((id, i) => truth[i] === id).length;
    if (inPlace <= 1 && order.some((id, i) => truth[i] !== id)) return order;
  }
  return [...truth.slice(1), truth[0]]; // every card one slot off: never right, never sorted
}

export interface Dealt { dealt: string[]; widened: boolean }

/**
 * A Practice round (§5.2, §6.2): the level's card count and tiers. With an era chosen the closeness rule drops to
 * Hard's, and if the era cannot fill a round at the level's tiers, or has too few events there to vary, they widen one
 * step at a time (`widened` says so).
 */
export function deal(index: OrderIndex, level: Level, era: EraChoice, random: () => number, recent: readonly string[] = []): Dealt | null {
  const { cards, maxTier } = LEVELS[level];
  const rule: Level = era === "all" ? level : "hard";
  for (let tier = maxTier; tier <= 3; tier++) {
    const pool = candidates(index, era, tier as Tier);
    if (era !== "all" && tier < 3 && pool.length < cards * MIN_POOL_PER_CARD) continue; // too few to vary: widen
    const truth = pickRound(index, pool, cards, rule, random, recent);
    if (truth) return { dealt: shuffleForDisplay(truth, random), widened: tier > maxTier };
    if (era === "all") break;
  }
  return null;
}
