// Today's puzzle (design §6): the same word for everyone on the same local calendar date. Puzzle #1 is the schedule's
// epoch; numbers count calendar days, so they still go up by exactly one on a daylight-saving day. Past the end of
// daily.json the same rules (daily-rules.ts) carry on from the file's last days, so it never runs out.
import { extendPlan, makePlan, poolOf, type Category, type Plan, type PoolWord, type Tier, type WordleSchedule } from "./daily-rules";

const DAY_MS = 86_400_000;

/** One answer as answers.json holds it: category, tier, verse id, and for a person their page and record. */
export interface AnswerEntry { c: Category; t: Tier; v: number; p?: string; pid?: string; r?: 1 }
export type Answers = Record<string, AnswerEntry>;

/** A local date's place on the calendar, as a whole number of days. */
export const calendarDay = (date: Date): number => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;

/** "2026-11-07" read as a calendar date (never through new Date(text), which reads it as UTC). */
export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`bible wordle: expected a date as YYYY-MM-DD, got ${JSON.stringify(key)}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

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
  /** Puzzle n's word, or null before the first puzzle. */
  wordFor(n: number): string | null;
}

export function createDaily(schedule: WordleSchedule, answers: Answers): Daily {
  const { year, month, day } = parseDateKey(schedule.epoch);
  const epochDay = Date.UTC(year, month - 1, day) / DAY_MS;
  const all: PoolWord[] = Object.entries(answers).map(([word, entry]) => ({ word, category: entry.c, tier: entry.t }));
  const byWord = new Map(all.map((word) => [word.word, word]));
  const pool = poolOf(all.filter((word) => !answers[word.word].r));
  const fileLength = schedule.days.length;
  let plan: Plan | null = null; // made only when a puzzle past the file is asked for
  return {
    epoch: schedule.epoch,
    numberOn: (date) => calendarDay(date) - epochDay + 1,
    dateOf: (n) => new Date(year, month - 1, day + n - 1),
    wordFor(n) {
      if (!Number.isInteger(n) || n < 1 || fileLength === 0) return null;
      if (n <= fileLength) return schedule.days[n - 1];
      plan ??= makePlan(schedule.days);
      extendPlan(pool, plan, n, fileLength, byWord);
      return plan.days[n - 1]!;
    },
  };
}
