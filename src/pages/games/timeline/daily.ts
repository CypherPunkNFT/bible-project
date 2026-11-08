// Today's timeline (design §6.1): the same six events for everyone on the same local calendar date. Puzzle #1 is the
// schedule's epoch; numbers count calendar days, so they still go up by exactly one on a daylight-saving day. Past the
// end of daily.json the same rules (daily-rules.ts) carry on from the file's last days, so it never runs out.
import { calendarDay, parseDateKey } from "../map-quest/daily";
import { extendDays, type TimelineSchedule } from "./daily-rules";
import type { OrderIndex } from "./order";

export { calendarDay, msUntilMidnight } from "../map-quest/daily";

export interface Daily {
  epoch: string;
  /** The puzzle number of a local date: 1 on the epoch, below 1 before it. */
  numberOn(date: Date): number;
  /** The local date puzzle `n` belongs to. */
  dateOf(n: number): Date;
  /** Puzzle n's event ids, or null before the first puzzle. Unknown ids are left out rather than breaking the game. */
  eventsFor(n: number): string[] | null;
}

export function createDaily(schedule: TimelineSchedule, index: OrderIndex): Daily {
  const { year, month, day } = parseDateKey(schedule.epoch);
  const epochDay = Date.UTC(year, month - 1, day) / 86_400_000;
  const fileLength = schedule.days.length;
  const days = schedule.days.map((ids) => [...ids]); // grows past the file as later puzzles are asked for
  return {
    epoch: schedule.epoch,
    numberOn: (date) => calendarDay(date) - epochDay + 1,
    dateOf: (n) => new Date(year, month - 1, day + n - 1),
    eventsFor(n) {
      if (!Number.isInteger(n) || n < 1 || fileLength === 0) return null;
      if (n > days.length) extendDays(index, days, n, fileLength);
      return days[n - 1].filter((id) => index.byId.has(id));
    },
  };
}
