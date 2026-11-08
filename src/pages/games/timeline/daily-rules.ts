// Timeline sort's Daily rules (design §6.1), in one place: the build script (scripts/build-timeline.ts) writes daily.json
// with them, and the game uses the same functions past the end of that file, so the two can never disagree.
// Only relative imports with their extension, so Node can load this file as it is (--experimental-strip-types).
import { mulberry32 } from "../map-quest/daily-rules.ts";
import { joinIsClose, joinsOf, validRound, type OrderIndex, type TimelineEvent } from "./order.ts";

export { mulberry32 };

export const DAILY_CARDS = 6;
/** An event does not come back within this many days. */
export const REPEAT_DAYS = 28;
/** How many earlier days the rules look back over (the repeat rule and the "unused for longest" weighting). */
export const HISTORY_DAYS = 60;
export const MIN_TIER1 = 2;
export const MAX_TIER3 = 1;
export const MIN_ERAS = 3;
/** At most this many of the five joins may rest on a close fact or a window gap under 40 years. */
export const MAX_CLOSE_JOINS = 2;
const DAY_ATTEMPTS = 30;

/** The schedule file: puzzle #1 is `epoch` (a local calendar date), `days[n - 1]` is puzzle n's six event ids. */
export interface TimelineSchedule { epoch: string; builtOn: string; frozenThrough: number; days: string[][] }

/** The events the Daily draws from: not retired, in a fixed order (by id), whatever order the file lists them in. */
export const dailyPool = (index: OrderIndex): TimelineEvent[] =>
  [...index.active].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** For each event in the history, how many days ago it was last used (1 = the day before). */
function daysAgo(history: readonly (readonly string[])[]): Map<string, number> {
  const ago = new Map<string, number>();
  history.forEach((day, i) => { for (const id of day) ago.set(id, history.length - i); });
  return ago;
}

const closeJoins = (index: OrderIndex, ids: readonly string[]) => joinsOf(index, ids).filter((steps) => joinIsClose(index, steps)).length;

/** The rules a part-built day can still keep: certain, at most one tier-3 card, at most two close joins. */
function partFits(index: OrderIndex, ids: readonly string[]): boolean {
  if (ids.filter((id) => index.byId.get(id)!.tier === 3).length > MAX_TIER3) return false;
  return validRound(index, ids) && closeJoins(index, ids) <= MAX_CLOSE_JOINS;
}

/** Every rule a day breaks (empty when it keeps them all): checked by the build and the tests over the whole schedule. */
export function dayProblems(index: OrderIndex, day: readonly string[], history: readonly (readonly string[])[]): string[] {
  const problems: string[] = [];
  if (day.length !== DAILY_CARDS || new Set(day).size !== day.length) problems.push(`expected ${DAILY_CARDS} different events, got ${day.join(", ")}`);
  const events = day.map((id) => index.byId.get(id));
  if (events.some((event) => !event)) return [...problems, `unknown event in ${day.join(", ")}`];
  const known = events as TimelineEvent[];
  if (!validRound(index, day)) return [...problems, `the order of ${day.join(", ")} is not certain`];
  if (known.filter((e) => e.tier === 1).length < MIN_TIER1) problems.push(`fewer than ${MIN_TIER1} tier-1 events`);
  if (known.filter((e) => e.tier === 3).length > MAX_TIER3) problems.push(`more than ${MAX_TIER3} tier-3 event`);
  if (new Set(known.map((e) => e.era)).size < MIN_ERAS) problems.push(`events from fewer than ${MIN_ERAS} eras`);
  const close = closeJoins(index, day);
  if (close > MAX_CLOSE_JOINS) problems.push(`${close} close joins (at most ${MAX_CLOSE_JOINS})`);
  const ago = daysAgo(history.slice(-HISTORY_DAYS));
  for (const id of day) {
    const last = ago.get(id);
    if (last !== undefined && last <= REPEAT_DAYS) problems.push(`${id} repeats after ${last} days (waits ${REPEAT_DAYS})`);
  }
  return problems;
}

/**
 * Six event ids for one day, or null when no day fits. Candidates are ordered at random by the seed, events unused for
 * longest more likely first (so none is starved); the last slots are kept for the tier-1 and era quotas.
 */
export function pickDay(index: OrderIndex, pool: readonly TimelineEvent[], history: readonly (readonly string[])[], seed: number): string[] | null {
  const ago = daysAgo(history.slice(-HISTORY_DAYS));
  const free = pool.filter((event) => (ago.get(event.id) ?? Infinity) > REPEAT_DAYS);
  for (let attempt = 0; attempt < DAY_ATTEMPTS; attempt++) {
    const random = mulberry32(seed * 1000 + attempt);
    const key = new Map(free.map((event) => [event.id, random() / Math.min(ago.get(event.id) ?? Infinity, HISTORY_DAYS + 1)]));
    const ranked = [...free].sort((a, b) => key.get(a.id)! - key.get(b.id)!);
    const chosen: TimelineEvent[] = [];
    while (chosen.length < DAILY_CARDS) {
      const left = DAILY_CARDS - chosen.length;
      const needTier1 = left <= MIN_TIER1 - chosen.filter((e) => e.tier === 1).length;
      const eras = new Set(chosen.map((e) => e.era));
      const needEra = left <= MIN_ERAS - eras.size;
      const next = ranked.find((event) => !chosen.includes(event) && (!needTier1 || event.tier === 1) && (!needEra || !eras.has(event.era))
        && partFits(index, [...chosen, event].map((e) => e.id)));
      if (!next) break;
      chosen.push(next);
    }
    const ids = chosen.map((event) => event.id);
    if (ids.length === DAILY_CARDS && dayProblems(index, ids, history).length === 0) return ids;
  }
  return null;
}

/** Puzzle `index + 1` from the days before it (the seed is the puzzle number), or null when no day fits. */
export const nextDay = (orderIndex: OrderIndex, pool: readonly TimelineEvent[], days: readonly (readonly string[])[], index: number): string[] | null =>
  pickDay(orderIndex, pool, days.slice(Math.max(0, index - HISTORY_DAYS), index), index + 1);

/**
 * Extends `days` to `length` with the same rule the browser uses past the end of daily.json: nextDay, or, if no day
 * fits (never with a sound pool), the file's own day from earlier, so the game never breaks.
 */
export function extendDays(orderIndex: OrderIndex, days: string[][], length: number, fileLength: number): void {
  const pool = dailyPool(orderIndex);
  for (let index = days.length; index < length; index++) {
    const picked = nextDay(orderIndex, pool, days, index);
    if (!picked && !days[index % fileLength]) throw new Error(`timeline sort: no puzzle #${index + 1} fits every rule and there is no earlier day to reuse`);
    if (!picked) console.warn(`timeline sort: no puzzle #${index + 1} fits every rule; reusing #${(index % fileLength) + 1}`);
    days.push(picked ?? days[index % fileLength]);
  }
}
