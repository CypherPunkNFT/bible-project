// The clock on each place (owner, 2026-11-12): the longer a pin takes, the more points come off, up to
// MAX_TIME_PENALTY when the level's time runs out. Running out never ends the place: the pin can still be dropped,
// it just carries the whole penalty. Easier levels get longer.
import type { Level } from "./pools";

export const TIME_LIMIT_SECONDS: Record<Level, number> = { beginner: 90, standard: 60, expert: 45 };
export const MAX_TIME_PENALTY = 300;

/** Points off for taking `seconds` at this level: rising evenly from 0 to MAX_TIME_PENALTY at the time limit. */
export function timePenalty(seconds: number, level: Level): number {
  if (!(seconds > 0)) return 0;
  return Math.round(MAX_TIME_PENALTY * Math.min(1, seconds / TIME_LIMIT_SECONDS[level]));
}

/** Whole seconds between two clock readings in ms, never negative (a clock set back counts as no time). */
export const secondsBetween = (startMs: number, endMs: number): number => Math.max(0, Math.floor((endMs - startMs) / 1000));
