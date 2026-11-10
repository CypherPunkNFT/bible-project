// The verse-of-the-day schedule (docs/features/verse-widget/design.md 4.1, 4.3, 4.4): which passage each date shows.
// Pure functions of the curation file, the countdowns and the previous schedule, so the build script and the tests use
// the same rules. The build script (scripts/build-verse-of-the-day.ts) adds the Berean words and writes the files.
import { OCCASIONS, type CountdownDay, type Occasion } from "@/data/countdowns";
import { FIXED_DAYS, POOL } from "@/data/verse-of-the-day/curation";
import { dayOfKey, fallbackPosition, keyOfDay, passageFromKey, passageKey } from "@/data/verse-of-the-day/keys";
import type { LifeEventPassage } from "@/data/life-events/types";
import { dayNumber, easterSunday, fromDayNumber } from "@/pages/countdowns/calendar";
import { buildRun, dayName, targetIn } from "@/pages/countdowns/season";

/** Days kept before the build date, days frozen after it, and how many years ahead the schedule runs (design 4.3). */
export const PAST_DAYS = 30;
export const FROZEN_DAYS = 14;
export const YEARS_AHEAD = 3;
/** The seed of the first shuffle; recorded in the schedule so a rebuild never reshuffles (design 4.3). */
export const FIRST_SEED = 20261109;
export const SEASON_LINK_TEXT = "Read today's reading";
/** The occasions whose days become the widget's seasonal days. Holy Week borrows Lent's days, so it adds nothing. */
export const SEASONAL_OCCASIONS = ["advent", "lent"] as const;

export interface Season { label: string; link: string; linkText: string }
/** An ordinary day is its passage key; a seasonal or fixed day says what it is. */
export type ScheduledDay = string | { passage: string; season: Season } | { passage: string; fixed: string };

export interface Schedule {
  v: 1;
  /** The first date in `days`. */
  epoch: string;
  builtOn: string;
  frozenThrough: string;
  seed: number;
  /** Every ordinary passage key ever scheduled, in rotation order; keys no longer in the curation file are skipped. */
  poolOrder: string[];
  /** The last date in `days`, and the rotation position after it, for the fallback rule (design 4.4). */
  lastDate: string;
  next: number;
  days: Record<string, ScheduledDay>;
}

export interface SpecialDay { passage: LifeEventPassage; season?: Season; fixed?: string }

export const scheduledKey = (day: ScheduledDay): string => (typeof day === "string" ? day : day.passage);
export const bookOfKey = (key: string): string => key.split(".")[0];

/** The label the Countdowns page gives a day: its own label, or the occasion and the day's name ("Advent, December 12"). */
export const seasonLabel = (occasion: Occasion, day: CountdownDay): string => day.label ?? `${occasion.name}, ${dayName(occasion, day)}`;

/** The first and last day numbers of a schedule built on a date (design 4.3). */
export function horizon(builtOn: string): { first: number; last: number } {
  const built = dayOfKey(builtOn);
  const date = fromDayNumber(built);
  return { first: built - PAST_DAYS, last: dayNumber({ year: date.year + YEARS_AHEAD, month: date.month, day: date.day }) };
}

/** Every Advent and Lent day and fixed day between two day numbers, by day number (design 4.1, rules 1 and 2). */
export function specialDays(first: number, last: number): Map<number, SpecialDay> {
  const found = new Map<number, SpecialDay>();
  const firstYear = fromDayNumber(first).year;
  const lastYear = fromDayNumber(last).year;
  for (let year = firstYear; year <= lastYear + 1; year++) {
    for (const slug of SEASONAL_OCCASIONS) {
      const occasion = OCCASIONS.find((item) => item.slug === slug)!;
      const run = buildRun(occasion, targetIn(occasion, year), OCCASIONS);
      for (const entry of run.entries) {
        if (entry.n < first || entry.n > last) continue;
        found.set(entry.n, { passage: entry.day.card, season: { label: seasonLabel(occasion, entry.day), link: `/countdowns/${slug}/${entry.day.key}`, linkText: SEASON_LINK_TEXT } });
      }
    }
    for (const fixed of FIXED_DAYS) {
      const n = "easterOffset" in fixed.on ? dayNumber(easterSunday(year)) + fixed.on.easterOffset : dayNumber({ year, month: fixed.on.month, day: fixed.on.day });
      if (n >= first && n <= last && !found.has(n)) found.set(n, { passage: fixed.passage, fixed: fixed.key });
    }
  }
  return found;
}

/** A small seeded generator (mulberry32), so the same seed always gives the same shuffle. */
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

export function shuffled(keys: readonly string[], seed: number): string[] {
  const random = seeded(seed);
  const order = [...keys];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Moves entries so no two neighbours share a book, the last and first included since the rotation cycles. Only places
 * from `from` on are moved, so a rebuild never disturbs entries already in the rotation. The same input always gives
 * the same output. Throws if it cannot be done (a pool too small or too lopsided to rotate).
 */
export function separateBooks(order: readonly string[], from = 0): string[] {
  const result = [...order];
  const clash = (a: string | undefined, b: string | undefined) => a !== undefined && b !== undefined && bookOfKey(a) === bookOfKey(b);
  for (let i = Math.max(1, from); i < result.length; i++) {
    if (!clash(result[i - 1], result[i])) continue;
    const j = result.findIndex((key, index) => index > i && !clash(result[i - 1], key));
    if (j < 0) throw new Error(`verse of the day: cannot keep ${result[i]} away from another ${bookOfKey(result[i])} verse`);
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.length > 2 && clash(result[result.length - 1], result[0])) {
    // The last verse moves between two neighbours from other books; the one before it becomes the last.
    const moving = result.pop()!;
    const at = clash(result[result.length - 1], result[0]) ? -1
      : result.findIndex((key, index) => index >= Math.max(1, from) && !clash(result[index - 1], moving) && !clash(key, moving));
    if (at < 0) throw new Error("verse of the day: cannot keep the rotation's last and first verses from the same book");
    result.splice(at, 0, moving);
  }
  return result;
}

/** The rotation order: the old order kept as it was, with entries new to the curation file shuffled onto its end. */
export function rotationOrder(previous: Schedule | null, activeKeys: readonly string[]): string[] {
  if (!previous) return separateBooks(shuffled(activeKeys, FIRST_SEED));
  const known = new Set(previous.poolOrder);
  const added = activeKeys.filter((key) => !known.has(key));
  if (!added.length) return [...previous.poolOrder];
  const active = new Set(activeKeys);
  const kept = previous.poolOrder.filter((key) => active.has(key));
  const tail = separateBooks([...kept, ...shuffled(added, previous.seed + previous.poolOrder.length)], kept.length).slice(kept.length);
  return [...previous.poolOrder, ...tail];
}

/** The ordinary keys in the curation file. */
export const activeKeys = (): string[] => POOL.map(passageKey);

/**
 * Every date's passage from `first` to `last` (design 4.3): days up to the frozen margin copied from the previous
 * schedule; frozen days past its end continued by the fallback rule, as browsers worked them out; then Advent, Lent
 * and the fixed days; and every other day the next entry of the rotation, cycling.
 */
export function assignDays(previous: Schedule | null, builtOn: string, rotation: readonly string[], special: Map<number, SpecialDay>): Pick<Schedule, "days" | "next" | "lastDate" | "epoch" | "frozenThrough"> {
  const { first, last } = horizon(builtOn);
  const frozen = dayOfKey(builtOn) + FROZEN_DAYS;
  const days: Record<string, ScheduledDay> = {};
  const oldLast = previous ? dayOfKey(previous.lastDate) : Number.POSITIVE_INFINITY;
  let position = 0;
  for (let n = first; n <= last; n++) {
    const key = keyOfDay(n);
    const kept = previous?.days[key];
    if (n <= frozen && kept !== undefined) {
      days[key] = kept;
      if (typeof kept === "string" && rotation.includes(kept)) position = rotation.indexOf(kept) + 1;
      continue;
    }
    if (previous && n <= frozen && n > oldLast) {
      const index = fallbackPosition(previous.next, oldLast, n, rotation.length);
      days[key] = rotation[index];
      position = index + 1;
      continue;
    }
    const day = special.get(n);
    if (day) {
      const passage = passageKey(day.passage);
      days[key] = day.season ? { passage, season: day.season } : { passage, fixed: day.fixed! };
      continue;
    }
    position %= rotation.length;
    days[key] = rotation[position];
    position += 1;
  }
  return { days, next: position % rotation.length, lastDate: keyOfDay(last), epoch: keyOfDay(first), frozenThrough: keyOfDay(frozen) };
}

/** A whole schedule built on a date, from the previous one (or none). */
export function buildSchedule(previous: Schedule | null, builtOn: string): Schedule {
  const active = activeKeys();
  const poolOrder = rotationOrder(previous, active);
  const live = new Set(active);
  const rotation = poolOrder.filter((key) => live.has(key));
  const { first, last } = horizon(builtOn);
  const assigned = assignDays(previous, builtOn, rotation, specialDays(first, last));
  return { v: 1, builtOn, seed: previous?.seed ?? FIRST_SEED, poolOrder, ...assigned };
}

/** The rotation the fallback rule and pool.json use: the schedule's order without removed entries. */
export function rotationOf(schedule: Schedule, activeKeyList: readonly string[] = activeKeys()): string[] {
  const live = new Set(activeKeyList);
  return schedule.poolOrder.filter((key) => live.has(key));
}

/** The passage a scheduled day names. */
export function passageOfDay(day: ScheduledDay): LifeEventPassage {
  const passage = passageFromKey(scheduledKey(day));
  if (!passage) throw new Error(`verse of the day: "${scheduledKey(day)}" is not a passage key`);
  return passage;
}
