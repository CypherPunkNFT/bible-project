// Verse completion: dealing a round and a review (design §7.3, §8.3). A round is seeded and the seed is saved with it,
// so a reload deals the same ten passages.
import { isDue, type Progress } from "./boxes.ts";
import { compareIds, seeded, shuffle, type Level, type Passage, type Settings, type Tier } from "./model.ts";

export const ROUND_SIZE = 10;
export const MAX_PER_BOOK = 2;

/** How many of the ten each tier gives at each level (§7.1), and the tiers a short tier is filled from. */
const QUOTAS: Record<Level, Partial<Record<Tier, number>>> = { easy: { 1: 10 }, medium: { 1: 6, 2: 4 }, hard: { 1: 3, 2: 4, 3: 3 } };
const FILL_ORDER: Record<Level, Tier[]> = { easy: [1, 2, 3], medium: [1, 2, 3], hard: [1, 2, 3] };

const bookOf = (passage: Passage) => Math.floor(passage.from / 1e6);

/**
 * Ten passages for a round, or fewer when the filters leave fewer. Absolute exclusions first: retired, due in My verses
 * (they belong to the review) and the testament filter. Then, per tier: passages never played, then other passages
 * not played recently, both in seeded random order, then recent ones oldest first. Short tiers are filled from the
 * level's other tiers, then from the next tier down. At most two per book, always.
 */
export function dealRound(pool: readonly Passage[], settings: Pick<Settings, "level" | "testament">, progress: Readonly<Record<string, Progress>>,
  recent: readonly string[], today: number, seed: number): string[] {
  const random = seeded(seed);
  const recentAt = new Map(recent.map((id, i) => [id, i]));
  const open = pool.filter((passage) => !passage.retired && !(progress[passage.id] && isDue(progress[passage.id], today))
    && (settings.testament === "all" || passage.testament === settings.testament));
  const ordered = (tier: Tier) => {
    const inTier = open.filter((passage) => passage.tier === tier);
    const fresh = shuffle(inTier.filter((passage) => !recentAt.has(passage.id)), random);
    const unplayed = fresh.filter((passage) => !progress[passage.id]?.played);
    const played = fresh.filter((passage) => progress[passage.id]?.played);
    const old = inTier.filter((passage) => recentAt.has(passage.id)).sort((a, b) => recentAt.get(a.id)! - recentAt.get(b.id)!);
    return [...unplayed, ...played, ...old];
  };
  const queues = new Map(([1, 2, 3] as const).map((tier) => [tier, ordered(tier)]));
  const chosen: Passage[] = [];
  const perBook = new Map<number, number>();
  const takeFrom = (tier: Tier, count: number) => {
    const queue = queues.get(tier)!;
    for (let i = 0; i < queue.length && count > 0 && chosen.length < ROUND_SIZE;) {
      const passage = queue[i];
      if ((perBook.get(bookOf(passage)) ?? 0) >= MAX_PER_BOOK) { i++; continue; }
      queue.splice(i, 1);
      chosen.push(passage);
      perBook.set(bookOf(passage), (perBook.get(bookOf(passage)) ?? 0) + 1);
      count--;
    }
  };
  for (const [tier, count] of Object.entries(QUOTAS[settings.level])) takeFrom(Number(tier) as Tier, count);
  for (const tier of FILL_ORDER[settings.level]) takeFrom(tier, ROUND_SIZE - chosen.length);
  return shuffle(chosen, random).map((passage) => passage.id);
}

/**
 * A review: up to ten due passages from My verses, the most overdue first (§8.3). It ignores recent history, tier,
 * testament and the book cap, so no setting can strand a due passage. Retired passages are never dealt.
 */
export function dueQueue(pool: readonly Passage[], progress: Readonly<Record<string, Progress>>, today: number): string[] {
  const active = new Set(pool.filter((passage) => !passage.retired).map((passage) => passage.id));
  return Object.entries(progress).filter(([id, entry]) => active.has(id) && isDue(entry, today))
    .sort(([a, x], [b, y]) => x.due - y.due || compareIds(a, b)).map(([id]) => id);
}

export const dealReview = (pool: readonly Passage[], progress: Readonly<Record<string, Progress>>, today: number): string[] =>
  dueQueue(pool, progress, today).slice(0, ROUND_SIZE);
