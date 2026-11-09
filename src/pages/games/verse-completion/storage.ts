// Verse completion: the record kept in this browser under bp-verse-completion (design §9). It is rebuilt field by field
// on every read, so damaged or hand-edited data comes back sound and never breaks the page. Every write re-reads the
// stored record first and changes only what the answer changed. No account, no server: nothing leaves the browser.
import { freshProgress, type Days, type Progress } from "./boxes.ts";
import { DEFAULT_SETTINGS, type Settings } from "./model.ts";

export const STORAGE_KEY = "bp-verse-completion";
const TAB_KEY = "bp-verse-completion-tab";
export const RECENT_LIMIT = 60;

export interface Done { id: string; status: "answered" | "skipped"; accuracy: number; stars: 0 | 1 | 2 | 3 }

export interface Round {
  /** The pool file's stamp when dealt: a round from another pool is dropped. */
  pool: string;
  seed: number;
  id: string;
  review: boolean;
  settings: Settings;
  ids: string[];
  done: Done[];
  /** The summary and streak are already counted. */
  finished: boolean;
  /** The tab answering this round; another tab must take over first (§9). */
  owner: string;
}

export interface VerseRecord {
  v: 1;
  settings: Settings;
  seenHelp: boolean;
  passages: Record<string, Progress>;
  recent: string[];
  days: Days;
  totals: { rounds: number; cards: number; stars: number };
  round: Round | null;
}

export const freshRecord = (): VerseRecord => ({
  v: 1, settings: { ...DEFAULT_SETTINGS }, seenHelp: false, passages: {}, recent: [],
  days: { streak: 0, best: 0, last: 0 }, totals: { rounds: 0, cards: 0, stars: 0 }, round: null,
});

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value: unknown, max = Number.MAX_SAFE_INTEGER): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0;
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);

export function readSettings(value: unknown): Settings {
  const raw = isObject(value) ? value : {};
  return {
    answer: oneOf(raw.answer, ["pick", "type"], DEFAULT_SETTINGS.answer),
    style: oneOf(raw.style, ["words", "letters"], DEFAULT_SETTINGS.style),
    level: oneOf(raw.level, ["easy", "medium", "hard"], DEFAULT_SETTINGS.level),
    testament: oneOf(raw.testament, ["all", "ot", "nt"], DEFAULT_SETTINGS.testament),
  };
}

function readProgress(value: unknown): Progress {
  const raw = isObject(value) ? value : {};
  const box = count(raw.box, 5) as Progress["box"];
  return { ...freshProgress(), played: count(raw.played), best: count(raw.best, 100), last: count(raw.last), box,
    due: box > 0 ? count(raw.due) : 0, memorised: box === 5 && raw.memorised === true };
}

function readDone(value: unknown, ids: readonly string[]): Done[] {
  if (!Array.isArray(value)) return [];
  const done: Done[] = [];
  for (const entry of value.slice(0, ids.length)) {
    if (!isObject(entry) || entry.id !== ids[done.length] || (entry.status !== "answered" && entry.status !== "skipped")) break;
    const accuracy = typeof entry.accuracy === "number" && Number.isFinite(entry.accuracy) ? Math.min(100, Math.max(0, entry.accuracy)) : 0;
    done.push({ id: entry.id, status: entry.status, accuracy: entry.status === "skipped" ? 0 : accuracy,
      stars: entry.status === "skipped" ? 0 : (count(entry.stars, 3) as Done["stars"]) });
  }
  return done;
}

function readRound(value: unknown, known: ReadonlySet<string>, stamp: string): Round | null {
  if (!isObject(value) || value.pool !== stamp || typeof value.id !== "string" || !Array.isArray(value.ids)) return null;
  const ids = value.ids.filter((id): id is string => typeof id === "string" && known.has(id));
  if (ids.length === 0 || ids.length !== value.ids.length || new Set(ids).size !== ids.length || ids.length > 10) return null;
  return { pool: stamp, seed: count(value.seed, 0xffffffff), id: value.id, review: value.review === true, settings: readSettings(value.settings),
    ids, done: readDone(value.done, ids), finished: value.finished === true, owner: typeof value.owner === "string" ? value.owner : "" };
}

/** The record rebuilt from whatever was stored. Ids not in the pool are dropped with a warning; retired ones stay. */
export function rebuild(value: unknown, known: ReadonlySet<string>, stamp: string): VerseRecord {
  const raw = isObject(value) ? value : {};
  const passages: Record<string, Progress> = {};
  if (isObject(raw.passages)) {
    for (const [id, entry] of Object.entries(raw.passages)) {
      if (known.has(id)) passages[id] = readProgress(entry);
      else console.warn(`Verse completion: dropped saved progress for "${id}", which is not in the game's passage list`);
    }
  }
  const recent = Array.isArray(raw.recent) ? [...new Set(raw.recent.filter((id): id is string => typeof id === "string" && known.has(id)))].slice(-RECENT_LIMIT) : [];
  const days = isObject(raw.days) ? raw.days : {};
  const totals = isObject(raw.totals) ? raw.totals : {};
  return {
    v: 1, settings: readSettings(raw.settings), seenHelp: raw.seenHelp === true, passages, recent,
    days: { streak: count(days.streak), best: count(days.best), last: count(days.last) },
    totals: { rounds: count(totals.rounds), cards: count(totals.cards), stars: count(totals.stars) },
    round: readRound(raw.round, known, stamp),
  };
}

/** localStorage when this browser lets the page use it, else null: the game then plays without saving. */
export function browserStore(): Storage | null {
  try {
    const store = window.localStorage;
    const probe = `${STORAGE_KEY}-probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch (error) {
    console.warn("Verse completion: this browser will not keep progress (storage is blocked or full):", error);
    return null;
  }
}

export function readRecord(store: Storage | null, known: ReadonlySet<string>, stamp: string): VerseRecord {
  if (!store) return freshRecord();
  try {
    const text = store.getItem(STORAGE_KEY);
    return rebuild(text ? JSON.parse(text) : null, known, stamp);
  } catch (error) {
    console.warn("Verse completion: the saved progress could not be read, starting afresh:", error);
    return freshRecord();
  }
}

export function writeRecord(store: Storage | null, record: VerseRecord): void {
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.warn("Verse completion: progress could not be saved (storage is full or blocked):", error);
  }
}

export function clearRecord(store: Storage | null): void {
  if (!store) return;
  try { store.removeItem(STORAGE_KEY); } catch (error) { console.warn("Verse completion: progress could not be cleared:", error); }
}

/** This tab's own id, kept for the tab's life (a reload keeps it) so it can own the active round. */
export function tabId(): string {
  const make = () => `tab-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  try {
    const existing = window.sessionStorage.getItem(TAB_KEY);
    if (existing) return existing;
    const id = make();
    window.sessionStorage.setItem(TAB_KEY, id);
    return id;
  } catch (error) {
    console.warn("Verse completion: no per-tab storage, so this tab gets a fresh id:", error);
    return make();
  }
}

/** Add dealt ids to the recent list, newest last, at most 60. */
export const withRecent = (recent: readonly string[], ids: readonly string[]): string[] =>
  [...recent.filter((id) => !ids.includes(id)), ...ids].slice(-RECENT_LIMIT);
