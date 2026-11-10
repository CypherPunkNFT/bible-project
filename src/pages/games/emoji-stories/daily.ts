// Today's puzzle (design §9): the same story for everyone on the same local calendar date. Puzzle #1 is the schedule's
// epoch; numbers count calendar days, so they go up by exactly one on a daylight-saving day too. Past the end of
// daily.json the same rules carry on from the file's last days, so it never runs out. Own copies of the date helpers
// (as Bible Wordle and Map quest have) rather than imports from another game.
import { dailyPool, extendDays, rulesFor } from "./daily-rules";
import type { DailySchedule, Story } from "./types";

const DAY_MS = 86_400_000;

/** A local date's place on the calendar, as a whole number of days. */
export const calendarDay = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;

/** "2026-11-09" read as a calendar date (never through new Date(text), which reads it as UTC). */
export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`emoji stories: expected a date as YYYY-MM-DD, got ${JSON.stringify(key)}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Milliseconds from `now` to the next local midnight. */
export function msUntilMidnight(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
}

export interface Daily {
  epoch: string;
  /** The puzzle number of a local date: 1 on the epoch, below 1 before it. */
  numberOn(date: Date): number;
  /** The local date puzzle `n` belongs to. */
  dateOf(n: number): Date;
  /** Puzzle n's story id, or null before the first puzzle or for an id the stories no longer hold. */
  storyFor(n: number): string | null;
}

export function createDaily(schedule: DailySchedule, stories: readonly Story[]): Daily {
  const { year, month, day } = parseDateKey(schedule.epoch);
  const epochDay = Date.UTC(year, month - 1, day) / DAY_MS;
  const known = new Set(stories.map((story) => story.id));
  const pool = dailyPool(stories);
  const rules = rulesFor(pool, schedule.epoch, stories);
  const days = [...schedule.days]; // grows past the file as later puzzles are asked for
  return {
    epoch: schedule.epoch,
    numberOn: (date) => calendarDay(date) - epochDay + 1,
    dateOf: (n) => new Date(year, month - 1, day + n - 1),
    storyFor(n) {
      if (!Number.isInteger(n) || n < 1 || !pool.length) return null;
      if (n > days.length) {
        try {
          extendDays(rules, pool, days, n);
        } catch (error) {
          console.warn(`emoji stories: puzzle #${n} could not be scheduled; reusing an earlier day`, error);
          while (days.length < n) days.push(days[days.length % Math.max(1, schedule.days.length)] ?? pool[0].id);
        }
      }
      const id = days[n - 1];
      return known.has(id) ? id : null;
    },
  };
}
