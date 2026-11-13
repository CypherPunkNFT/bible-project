// The clock on each place (owner, 2026-11-12): the longer a pin takes, the more points come off, up to the level's
// most (100 Beginner, 200 Standard, 300 Expert) when its time runs out. Running out never ends the place: the pin can
// still be dropped, it just carries that whole penalty. Easier levels get longer and lose less.
import type { Level } from "./pools";

export const TIME_LIMIT_SECONDS: Record<Level, number> = { beginner: 90, standard: 60, expert: 45 };
export const MAX_TIME_PENALTY: Record<Level, number> = { beginner: 100, standard: 200, expert: 300 };

/** Points off for taking `seconds` at this level: rising evenly from 0 to the level's MAX_TIME_PENALTY at its time limit. */
export function timePenalty(seconds: number, level: Level): number {
  if (!(seconds > 0)) return 0;
  return Math.round(MAX_TIME_PENALTY[level] * Math.min(1, seconds / TIME_LIMIT_SECONDS[level]));
}

/** Whole seconds between two clock readings in ms, never negative (a clock set back counts as no time). */
export const secondsBetween = (startMs: number, endMs: number): number => Math.max(0, Math.floor((endMs - startMs) / 1000));
