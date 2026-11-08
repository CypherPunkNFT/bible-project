// Timeline sort: what the game keeps in this browser (design §11.1), under one key: Daily results and streaks, the
// Practice choices and perfect streaks, the events seen lately, and the round in progress. A round is saved when it is
// dealt and after every move and Check, so a reload brings back the same cards and can neither re-deal nor undo a try.
// A Practice round made from older data (another stamp) is dropped; stats and Daily results always stay. Storage that
// is missing, full or corrupt never stops the game: it just keeps nothing.
import { LEVEL_KEYS, type EraChoice, type Level } from "./deal";
import { ERA_KEYS, type OrderIndex } from "./order";
import { isSolved } from "./scoring";
import { DAILY_TRIES } from "./share";

const KEY = "bp-timeline";
/** How many recently seen events dealing keeps, to prefer the ones seen least lately (§5.2). */
export const RECENT_MAX = 60;

export type Store = Pick<Storage, "getItem" | "setItem">;
export interface DailyResult { tries: string[][]; solved: boolean }
export type Round =
  | { mode: "daily"; n: number; order: string[] }
  | { mode: "practice"; level: Level; era: EraChoice; dealt: string[]; order: string[]; checked: boolean; widened: boolean };
export interface Saved {
  version: 1;
  stamp: string;
  daily: { results: Record<string, DailyResult>; streak: number; best: number };
  practice: { level: Level; era: EraChoice; bestPerfect: Record<Level, number>; perfect: Record<Level, number>; recent: string[] };
  round?: Round;
}

const zeroLevels = (): Record<Level, number> => ({ easy: 0, medium: 0, hard: 0 });
export const emptySaved = (stamp: string): Saved => ({
  version: 1, stamp,
  daily: { results: {}, streak: 0, best: 0 },
  practice: { level: "medium", era: "all", bestPerfect: zeroLevels(), perfect: zeroLevels(), recent: [] },
});

/** The browser's local storage, or null where the browser refuses it (private modes can throw on access). */
export function browserStore(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Whether this store really keeps what is written to it (it may be full or blocked). */
export function canSave(store: Store | null): boolean {
  if (!store) return false;
  try {
    store.setItem(`${KEY}-probe`, "1");
    return store.getItem(`${KEY}-probe`) === "1";
  } catch {
    return false;
  }
}

const count = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0);
const record = (value: unknown): Record<string, unknown> | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null);
const idList = (value: unknown, index: OrderIndex): string[] | null =>
  Array.isArray(value) && value.length > 0 && value.every((id) => typeof id === "string" && index.byId.has(id)) && new Set(value).size === value.length ? (value as string[]) : null;
const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));
const levels = (value: unknown): Record<Level, number> => { const v = record(value) ?? {}; return { easy: count(v.easy), medium: count(v.medium), hard: count(v.hard) }; };

function parseResults(value: unknown, index: OrderIndex): Record<string, DailyResult> {
  const out: Record<string, DailyResult> = {};
  for (const [n, raw] of Object.entries(record(value) ?? {})) {
    const r = record(raw);
    if (!/^\d+$/.test(n) || !r || !Array.isArray(r.tries) || r.tries.length > DAILY_TRIES) continue;
    const tries = r.tries.map((t) => idList(t, index));
    if (tries.some((t) => !t)) continue;
    out[n] = { tries: tries as string[][], solved: r.solved === true };
  }
  return out;
}

function parseRound(value: unknown, index: OrderIndex, stampMatches: boolean): Round | undefined {
  const r = record(value);
  if (!r) return undefined;
  const order = idList(r.order, index);
  if (!order) return undefined;
  if (r.mode === "daily" && Number.isInteger(r.n) && (r.n as number) >= 1) return { mode: "daily", n: r.n as number, order };
  if (r.mode !== "practice" || !stampMatches) return undefined; // a Practice round from older data is dropped
  const dealt = idList(r.dealt, index);
  const era = r.era === "all" || ERA_KEYS.includes(r.era as never) ? (r.era as EraChoice) : null;
  if (!dealt || !sameSet(dealt, order) || !LEVEL_KEYS.includes(r.level as Level) || !era) return undefined;
  return { mode: "practice", level: r.level as Level, era, dealt, order, checked: r.checked === true, widened: r.widened === true };
}

/** Everything saved, checked against the data; anything doubtful is dropped rather than trusted. */
export function readSaved(store: Store | null, index: OrderIndex, stamp: string): Saved {
  let raw: Record<string, unknown> | null = null;
  try {
    const text = store?.getItem(KEY);
    raw = text ? record(JSON.parse(text)) : null;
  } catch {
    raw = null; // corrupt or unreadable: treated as nothing saved
  }
  const saved = emptySaved(stamp);
  if (!raw || raw.version !== 1) return saved;
  const daily = record(raw.daily) ?? {};
  const practice = record(raw.practice) ?? {};
  saved.daily = { results: parseResults(daily.results, index), streak: count(daily.streak), best: count(daily.best) };
  saved.practice = {
    level: LEVEL_KEYS.includes(practice.level as Level) ? (practice.level as Level) : "medium",
    era: practice.era === "all" || ERA_KEYS.includes(practice.era as never) ? (practice.era as EraChoice) : "all",
    bestPerfect: levels(practice.bestPerfect), perfect: levels(practice.perfect),
    recent: (Array.isArray(practice.recent) ? practice.recent : []).filter((id): id is string => typeof id === "string" && index.byId.has(id)).slice(-RECENT_MAX),
  };
  saved.round = parseRound(raw.round, index, raw.stamp === stamp);
  return saved;
}

export function writeSaved(store: Store | null, saved: Saved): void {
  try {
    store?.setItem(KEY, JSON.stringify(saved));
  } catch (error) {
    console.warn("Timeline sort: could not save progress in this browser:", error);
  }
}

export const isDone = (result: DailyResult | undefined) => !!result && (result.solved || result.tries.length >= DAILY_TRIES);

/** A Daily try recorded: the try kept, and on a finish the streak and best updated (§7.1). */
export function recordTry(saved: Saved, n: number, order: readonly string[], truth: readonly string[]): Saved {
  const before = saved.daily.results[n] ?? { tries: [], solved: false };
  if (isDone(before)) return saved;
  const result: DailyResult = { tries: [...before.tries, [...order]], solved: isSolved(order, truth) };
  let { streak, best } = saved.daily;
  if (result.solved) streak = saved.daily.results[n - 1]?.solved ? streak + 1 : 1;
  else if (isDone(result)) streak = 0;
  best = Math.max(best, streak);
  return { ...saved, daily: { results: { ...saved.daily.results, [n]: result }, streak, best } };
}

/** The current streak as of puzzle `today`: it lapses when yesterday's puzzle was not solved. */
export function streakOn(saved: Saved, today: number): number {
  const { results, streak } = saved.daily;
  return results[today]?.solved || results[today - 1]?.solved ? streak : 0;
}

/** Solved in 1, 2, 3 or 4 tries, and not solved: how many puzzles each. */
export function distribution(saved: Saved): { solvedIn: number[]; missed: number } {
  const solvedIn = [0, 0, 0, 0];
  let missed = 0;
  for (const result of Object.values(saved.daily.results)) {
    if (result.solved) solvedIn[result.tries.length - 1]++;
    else if (isDone(result)) missed++;
  }
  return { solvedIn, missed };
}

/** A checked Practice round: the perfect streak for its level, its best, and the events seen lately. */
export function recordPractice(saved: Saved, level: Level, ids: readonly string[], perfect: boolean): Saved {
  const now = perfect ? saved.practice.perfect[level] + 1 : 0;
  const recent = [...saved.practice.recent.filter((id) => !ids.includes(id)), ...ids].slice(-RECENT_MAX);
  return { ...saved, practice: { ...saved.practice, recent,
    perfect: { ...saved.practice.perfect, [level]: now },
    bestPerfect: { ...saved.practice.bestPerfect, [level]: Math.max(saved.practice.bestPerfect[level], now) } } };
}
