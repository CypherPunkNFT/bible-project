// What Emoji stories keeps on the device (design §12): settings, today's Daily, stats, best Practice scores and the
// last 60 puzzles seen in local storage under bp-emoji-stories; the round in progress in session storage. Everything
// read back is checked, and anything that does not fit is dropped for a fresh record, never a crash.
import { RECENT_LIMIT, ROUND_LENGTH, type Filter, DIFFICULTIES, TESTAMENTS } from "./deal";

export type AnswerMode = "choices" | "typing";
export type Store = Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
export const DEVICE_KEY = "bp-emoji-stories";
export const ROUND_KEY = "bp-emoji-stories-round";

/** Guesses a Daily allows: three typed, two with choices (§6.1). */
export const maxGuesses = (mode: AnswerMode): number => (mode === "choices" ? 2 : 3);

export interface DailyRecord {
  n: number;
  /** Fixed by the first guess: switching later never changes how many guesses there are. */
  mode: AnswerMode;
  guesses: string[];
  /** Hints the player asked for (the share line counts these). */
  asked: number;
  over: boolean;
  won: boolean;
}

export interface Stats {
  played: number;
  solved: number;
  streak: number;
  best: number;
  /** The last Daily puzzle number that was solved (streaks count by puzzle number). */
  lastSolved: number;
  /** Solved in one, two, three guesses. */
  spread: [number, number, number];
}

export interface Device {
  answer: AnswerMode | null;
  daily: DailyRecord | null;
  stats: Stats;
  best: Record<string, number>;
  recent: string[];
}

export interface RoundPuzzle {
  id: string;
  choices: string[];
  hints: number;
  pick: string | null;
  /** Room mode: how many emoji are showing, and whether the choices are on screen. */
  clues: number;
  choicesShown: boolean;
  revealed: boolean;
}

export interface Round {
  mode: "practice" | "room";
  filter: Filter;
  puzzles: RoundPuzzle[];
  at: number;
  over: boolean;
  recorded: boolean;
}

export function browserStore(kind: "localStorage" | "sessionStorage"): Store {
  try {
    return window[kind];
  } catch {
    return null;
  }
}

/** Whether this store takes a write at all (private modes and blocked storage do not); tried once, then removed. */
export function canStore(store: Store): boolean {
  if (!store) return false;
  const probe = `${DEVICE_KEY}-probe`;
  try {
    store.setItem(probe, "1");
    return true;
  } catch {
    return false;
  } finally {
    try { store.removeItem(probe); } catch { /* nothing was written */ }
  }
}

const freshStats = (): Stats => ({ played: 0, solved: 0, streak: 0, best: 0, lastSolved: 0, spread: [0, 0, 0] });
export const freshDevice = (): Device => ({ answer: null, daily: null, stats: freshStats(), best: {}, recent: [] });

const count = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const isMode = (value: unknown): value is AnswerMode => value === "choices" || value === "typing";

export function validDaily(value: unknown, known: ReadonlySet<string>): value is DailyRecord {
  const record = value as DailyRecord;
  if (!record || typeof record !== "object" || !count(record.n) || record.n < 1 || !isMode(record.mode)) return false;
  if (!strings(record.guesses) || record.guesses.length > maxGuesses(record.mode)) return false;
  if (new Set(record.guesses).size !== record.guesses.length || record.guesses.some((id) => !known.has(id))) return false;
  if (!count(record.asked) || record.asked > 3 || typeof record.over !== "boolean" || typeof record.won !== "boolean") return false;
  return !record.won || record.over;
}

function validStats(value: unknown): value is Stats {
  const stats = value as Stats;
  return (
    !!stats && count(stats.played) && count(stats.solved) && stats.solved <= stats.played && count(stats.streak) &&
    count(stats.best) && stats.streak <= stats.best && count(stats.lastSolved) &&
    Array.isArray(stats.spread) && stats.spread.length === 3 && stats.spread.every(count)
  );
}

export function readDevice(store: Store, known: ReadonlySet<string>): Device {
  try {
    const saved = JSON.parse(store?.getItem(DEVICE_KEY) ?? "null") as Partial<Device> | null;
    if (!saved || typeof saved !== "object") return freshDevice();
    const best = saved.best && typeof saved.best === "object" ? saved.best : {};
    return {
      answer: isMode(saved.answer) ? saved.answer : null,
      daily: validDaily(saved.daily, known) ? saved.daily : null,
      stats: validStats(saved.stats) ? saved.stats : freshStats(),
      best: Object.fromEntries(Object.entries(best).filter(([key, value]) => /^[a-z]+-[a-z]+$/.test(key) && count(value) && value <= ROUND_LENGTH * 3)),
      recent: strings(saved.recent) ? saved.recent.filter((id) => known.has(id)).slice(-RECENT_LIMIT) : [],
    };
  } catch {
    return freshDevice();
  }
}

/** Saves; false when storage is blocked or full, so the page can say scores cannot be remembered. */
export function writeDevice(store: Store, device: Device): boolean {
  try {
    if (!store) return false;
    store.setItem(DEVICE_KEY, JSON.stringify(device));
    return true;
  } catch {
    return false;
  }
}

/** A finished Daily's effect on the stats, counted once. */
export function addToStats(stats: Stats, record: DailyRecord): Stats {
  if (!record.over) return stats;
  if (!record.won) return { ...stats, played: stats.played + 1, streak: 0 };
  const streak = stats.lastSolved === record.n - 1 ? stats.streak + 1 : 1;
  const spread = [...stats.spread] as Stats["spread"];
  spread[Math.min(2, record.guesses.length - 1)] += 1;
  return { played: stats.played + 1, solved: stats.solved + 1, streak, best: Math.max(stats.best, streak), lastSolved: record.n, spread };
}

/** The streak as it stands today: broken if the last solved puzzle was before yesterday's. */
export const currentStreak = (stats: Stats, today: number): number => (stats.lastSolved >= today - 1 ? stats.streak : 0);

function validRound(value: unknown, known: ReadonlySet<string>): value is Round {
  const round = value as Round;
  // Only Practice rounds are kept: a room keeps its own score, and the game stores nothing of it (§8.3).
  if (!round || round.mode !== "practice" || !round.filter) return false;
  if (!DIFFICULTIES.includes(round.filter.difficulty) || !TESTAMENTS.includes(round.filter.testament)) return false;
  if (!Array.isArray(round.puzzles) || !round.puzzles.length || round.puzzles.length > ROUND_LENGTH) return false;
  if (!count(round.at) || round.at >= round.puzzles.length || typeof round.over !== "boolean" || typeof round.recorded !== "boolean") return false;
  const ids = round.puzzles.map((puzzle) => puzzle?.id);
  if (new Set(ids).size !== ids.length) return false;
  return round.puzzles.every((puzzle, index) =>
    known.has(puzzle.id) && strings(puzzle.choices) && puzzle.choices.length === 4 && puzzle.choices.includes(puzzle.id) &&
    puzzle.choices.every((id) => known.has(id)) && count(puzzle.hints) && puzzle.hints <= 3 && count(puzzle.clues) &&
    (puzzle.pick === null || known.has(puzzle.pick)) && typeof puzzle.choicesShown === "boolean" &&
    typeof puzzle.revealed === "boolean" && (index >= round.at || puzzle.revealed),
  );
}

export function readRound(store: Store, known: ReadonlySet<string>): Round | null {
  try {
    const round = JSON.parse(store?.getItem(ROUND_KEY) ?? "null") as unknown;
    return validRound(round, known) ? round : null;
  } catch {
    return null;
  }
}

export function saveRound(store: Store, round: Round | null): void {
  try {
    if (round) store?.setItem(ROUND_KEY, JSON.stringify(round));
    else store?.removeItem(ROUND_KEY);
  } catch {
    // The round still plays; it just will not survive a reload.
  }
}
