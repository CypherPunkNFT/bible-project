// The Daily Five (design §7): the same five places for everyone on the same local calendar date. Puzzle #1 is the
// schedule's epoch; numbers count calendar days, so they still go up by exactly one on a daylight-saving day.
// Past the end of daily.json the same rules (daily-rules.ts) carry on from the file's last days, so it never runs out.
import { eligiblePool, nextDay, type DailyPlace, type DailySchedule } from "./daily-rules";

const DAY_MS = 86_400_000;

/** A local date's place on the calendar, as a whole number of days. */
export const calendarDay = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;

/** "2026-11-07" read as a calendar date (never through new Date(text), which reads it as UTC). */
export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`map quest: expected a date as YYYY-MM-DD, got ${JSON.stringify(key)}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

const keyDay = (key: string): number => {
  const { year, month, day } = parseDateKey(key);
  return Date.UTC(year, month - 1, day) / DAY_MS;
};

/** Milliseconds from `now` to the next local midnight (recomputed from the clock each time, so a sleeping tab is right). */
export function msUntilMidnight(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
}

export interface Daily {
  epoch: string;
  /** The puzzle number of a local date: 1 on the epoch, below 1 before it. */
  numberOn(date: Date): number;
  /** The local date puzzle `n` belongs to. */
  dateOf(n: number): Date;
  /** Puzzle n's place ids, or null before the first puzzle. Unknown ids are left out rather than breaking the game. */
  placesFor(n: number): string[] | null;
}

export function createDaily(schedule: DailySchedule, places: readonly DailyPlace[]): Daily {
  const epochDay = keyDay(schedule.epoch);
  const { year, month, day } = parseDateKey(schedule.epoch);
  const pool = eligiblePool(places);
  const known = new Set(pool.map((place) => place.id));
  const days: string[][] = [...schedule.days]; // grows past the file as later puzzles are asked for
  const fileLength = schedule.days.length;
  const extendTo = (n: number) => {
    for (let index = days.length; index < n; index++) {
      const picked = nextDay(pool, days, index);
      if (!picked) console.warn(`map quest: no puzzle #${index + 1} fits every rule; reusing #${(index % fileLength) + 1}`);
      days.push(picked ?? schedule.days[index % fileLength]);
    }
  };
  return {
    epoch: schedule.epoch,
    numberOn: (date) => calendarDay(date) - epochDay + 1,
    dateOf: (n) => new Date(year, month - 1, day + n - 1),
    placesFor(n) {
      if (!Number.isInteger(n) || n < 1 || fileLength === 0) return null;
      extendTo(n);
      return days[n - 1].filter((id) => known.has(id));
    },
  };
}
