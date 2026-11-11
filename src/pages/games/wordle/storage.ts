// The player's Bible Wordle record, kept in this browser only (design §8): games played and won, streaks, how many
// tries each win took, today's guesses and the settings. Only guesses are stored; colours and the result are worked
// out again from the answer. Whatever is stored is rebuilt field by field, so a damaged value can never break the page.
import { MAX_TRIES, WORD_LENGTH, outcomeOf } from "./evaluate";

export interface TodayRecord { n: number; guesses: string[]; hard: boolean; hint: boolean }
export interface WordleRecord {
  v: 1;
  played: number;
  won: number;
  /** Wins on consecutive puzzle numbers. */
  streak: number;
  bestStreak: number;
  /** Puzzle number of the last win, and the highest puzzle number finished (0: none). */
  lastWon: number;
  lastDone: number;
  /** Wins in 1, 2, … 6 tries. */
  dist: number[];
  today: TodayRecord | null;
  settings: { hard: boolean; contrast: boolean };
  seenHelp: boolean;
}

export const STORAGE_KEY = "bp-wordle";

export const emptyRecord = (): WordleRecord => ({
  v: 1, played: 0, won: 0, streak: 0, bestStreak: 0, lastWon: 0, lastDone: 0, dist: Array.from({ length: MAX_TRIES }, () => 0),
  today: null, settings: { hard: false, contrast: false }, seenHelp: false,
});

const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0);
const record = (value: unknown): Record<string, unknown> | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null);
const isGuess = (value: unknown): value is string => typeof value === "string" && new RegExp(`^[a-z]{${WORD_LENGTH}}$`).test(value);

function parseToday(value: unknown): TodayRecord | null {
  const v = record(value);
  if (!v || count(v.n) < 1 || !Array.isArray(v.guesses)) return null;
  return { n: count(v.n), guesses: v.guesses.filter(isGuess).slice(0, MAX_TRIES), hard: v.hard === true, hint: v.hint === true };
}

/** A stored value, whatever its shape, as a sound record. */
export function parseRecord(raw: unknown): WordleRecord {
  const v = record(raw);
  if (!v) return emptyRecord();
  const settings = record(v.settings);
  const dist = Array.isArray(v.dist) && v.dist.length === MAX_TRIES ? v.dist.map(count) : emptyRecord().dist;
  const played = count(v.played);
  return {
    v: 1, played, won: Math.min(count(v.won), played), streak: count(v.streak), bestStreak: Math.max(count(v.bestStreak), count(v.streak)),
    lastWon: count(v.lastWon), lastDone: count(v.lastDone), dist, today: parseToday(v.today),
    settings: { hard: settings?.hard === true, contrast: settings?.contrast === true }, seenHelp: v.seenHelp === true,
  };
}

/** The stored record, and whether this browser lets the game keep one (a private window or blocked storage does not). */
export function readRecord(): { record: WordleRecord; available: boolean } {
  let text: string | null;
  try {
    text = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Bible Wordle: this browser does not let the game read its saved record:", error);
    return { record: emptyRecord(), available: false };
  }
  try {
    return { record: parseRecord(JSON.parse(text ?? "null")), available: true };
  } catch (error) {
    console.warn("Bible Wordle: the saved record was damaged and has been started afresh:", error);
    return { record: emptyRecord(), available: true };
  }
}

/** Saves the record; false when the browser refused (storage blocked or full). */
export function writeRecord(value: WordleRecord): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Bible Wordle: the record could not be saved in this browser:", error);
    return false;
  }
}

/** Opens puzzle n: keeps it when it is already under way, otherwise starts it afresh (an older one is dropped). */
export function startToday(value: WordleRecord, n: number): WordleRecord {
  if (value.today?.n === n) return value;
  return { ...value, today: { n, guesses: [], hard: value.settings.hard, hint: false } };
}

/**
 * Saves guess number `index` (0 = the first) of puzzle n. Refused unless exactly `index` guesses are stored, so a
 * double tap or another tab can never add a guess twice, and once the game is over.
 */
export function recordGuess(value: WordleRecord, n: number, index: number, guess: string, answer: string): WordleRecord {
  const today = value.today;
  if (!today || today.n !== n || today.guesses.length !== index || !isGuess(guess) || outcomeOf(today.guesses, answer) !== "playing") return value;
  return { ...value, today: { ...today, guesses: [...today.guesses, guess] } };
}

/** Counts a finished puzzle once: never again, and never one at or below the last finished (a clock set back). */
export function finishToday(value: WordleRecord, n: number, answer: string): WordleRecord {
  const today = value.today;
  if (!today || today.n !== n || n <= value.lastDone) return value;
  const outcome = outcomeOf(today.guesses, answer);
  if (outcome === "playing") return value;
  const next = { ...value, played: value.played + 1, lastDone: n };
  if (outcome === "won") {
    const streak = value.lastWon === n - 1 ? value.streak + 1 : 1;
    const dist = value.dist.map((bar, i) => (i === today.guesses.length - 1 ? bar + 1 : bar));
    return { ...next, won: value.won + 1, dist, streak, lastWon: n, bestStreak: Math.max(value.bestStreak, streak) };
  }
  return { ...next, streak: 0 };
}

/** Hard mode on or off: only before today's first guess. The choice is remembered for the next day. */
export function setHard(value: WordleRecord, n: number, hard: boolean): WordleRecord {
  const today = value.today;
  if (today?.n === n && today.guesses.length > 0) return value;
  return { ...value, settings: { ...value.settings, hard }, today: today?.n === n ? { ...today, hard } : today };
}

export const setContrast = (value: WordleRecord, contrast: boolean): WordleRecord => ({ ...value, settings: { ...value.settings, contrast } });
export const markHelpSeen = (value: WordleRecord): WordleRecord => (value.seenHelp ? value : { ...value, seenHelp: true });

export function withHint(value: WordleRecord, n: number): WordleRecord {
  const today = value.today;
  return today?.n === n && !today.hint ? { ...value, today: { ...today, hint: true } } : value;
}

/** The streak as it stands on puzzle `todayN`: a missed day ends it, but today does not break it until today is over. */
export const currentStreak = (value: WordleRecord, todayN: number): number => (value.lastWon >= todayN - 1 && value.lastWon <= todayN ? value.streak : 0);
