// Bible Jeopardy's saving (design 7.1, 8): the game in progress under bp-jeopardy after every action, the setup under
// bp-jeopardy-settings, and the ids of the last 1,500 clues played under bp-jeopardy-seen. Everything read back is
// checked field by field: a damaged or foreign record is dropped and removed, never crashes the page. Storage that is
// blocked or full leaves the game playable, only unsaved.
import { isQuestion } from "@/lib/live-quiz/protocol";
import {
  COLUMN_COUNTS, DEFAULT_SETTINGS, MAX_TEAMS, MIN_TEAMS, TIMERS, VALUES,
  type Board, type BoardSettings, type FinalClue, type Settings,
} from "./model";
import type { Game, Mark, Play, Screen } from "./rules";

export const GAME_KEY = "bp-jeopardy";
export const SETTINGS_KEY = "bp-jeopardy-settings";
export const SEEN_KEY = "bp-jeopardy-seen";
const TAB_KEY = "bp-jeopardy-tab";
export const SEEN_LIMIT = 1500;

export interface SavedGame { game: Game; savedAt: number; tab: string }

type Raw = Record<string, unknown>;
const isObject = (value: unknown): value is Raw => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown, max = 400): value is string => typeof value === "string" && value.length <= max;
/** A team name, counted in characters as checkName counts them, so an emoji is one, not two. */
const isName = (value: unknown): value is string => typeof value === "string" && Array.from(value).length <= 16;
const isWhole = (value: unknown, low: number, high: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= low && value <= high;
const oneOf = <T,>(value: unknown, allowed: readonly T[]): value is T => allowed.includes(value as T);
const LEVELS = ["easy", "medium", "hard"] as const;
const SCREENS: readonly Screen[] = ["board", "daily-double", "clue", "answer", "final-category", "final-clue", "final-answer", "results", "tie-clue", "tie-answer"];
const SCORE = 1_000_000;

const pick = <T,>(value: unknown, allowed: readonly T[], fallback: T): T => (oneOf(value, allowed) ? value : fallback);
const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

function readNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_SETTINGS.teamNames];
  const names = value.slice(0, MAX_TEAMS).map((name, index) => (isName(name) && name.trim() ? name.trim() : `Team ${index + 1}`));
  while (names.length < MIN_TEAMS) names.push(`Team ${names.length + 1}`);
  return names;
}

/** The remembered setup, rebuilt field by field: anything odd falls back to the default. */
export function readSettings(value: unknown): Settings {
  const raw = isObject(value) ? value : {};
  const d = DEFAULT_SETTINGS;
  return {
    columns: pick(raw.columns, COLUMN_COUNTS, d.columns), difficulty: pick(raw.difficulty, ["gentle", "standard", "challenging"] as const, d.difficulty),
    choices: flag(raw.choices, d.choices), children: flag(raw.children, d.children), catechism: flag(raw.catechism, d.catechism),
    testament: pick(raw.testament, ["", "OT", "NT"] as const, d.testament), dailyDouble: flag(raw.dailyDouble, d.dailyDouble),
    final: flag(raw.final, d.final), answering: pick(raw.answering, ["turns", "buzz"] as const, d.answering),
    penalty: flag(raw.penalty, d.penalty), timer: pick(raw.timer, TIMERS, d.timer), teamNames: readNames(raw.teamNames),
    randomStart: flag(raw.randomStart, d.randomStart),
  };
}

/** A saved game's settings must be exactly well formed (the board was built with them). */
function isSettings(value: unknown): value is Settings {
  if (!isObject(value) || !Array.isArray(value.teamNames)) return false;
  const rebuilt = readSettings(value);
  return (Object.keys(rebuilt) as (keyof Settings)[]).every((key) => key === "teamNames" || rebuilt[key] === value[key]);
}

const isBoardSettings = (value: unknown): value is BoardSettings => isObject(value) && isSettings({ ...DEFAULT_SETTINGS, ...value });
const isSpot = (value: unknown, columns: number, rows = VALUES.length) => isObject(value) && isWhole(value.col, 0, columns - 1) && isWhole(value.row, 0, rows - 1);
const isFinalClue = (value: unknown): value is FinalClue =>
  isObject(value) && isText(value.category, 64) && isText(value.title) && isText(value.line) && isQuestion(value.q) && oneOf(value.level, LEVELS);

function isBoard(value: unknown): value is Board {
  if (!isObject(value) || !isBoardSettings(value.settings) || !Array.isArray(value.columns) || !Array.isArray(value.notices)) return false;
  const { columns } = value;
  if (columns.length < 1 || columns.length > 6 || !value.notices.every((notice) => isText(notice))) return false;
  const tilesOk = columns.every((column) => isObject(column) && isText(column.category, 64) && isText(column.title) && isText(column.line)
    && Array.isArray(column.tiles) && column.tiles.length === VALUES.length
    && column.tiles.every((tile, row) => isObject(tile) && tile.value === VALUES[row] && oneOf(tile.level, LEVELS) && isQuestion(tile.q)));
  if (!tilesOk) return false;
  if (value.dailyDouble !== null && !isSpot(value.dailyDouble, columns.length)) return false;
  return value.final === null || isFinalClue(value.final);
}

const isMarks = (value: unknown, teams: number): value is Mark[] =>
  Array.isArray(value) && value.length === teams && value.every((mark) => mark === null || mark === "right" || mark === "wrong");
const isTeamIndexList = (value: unknown, teams: number) =>
  Array.isArray(value) && value.every((index) => isWhole(index, 0, teams - 1)) && new Set(value).size === value.length;

function isPlay(value: unknown, board: Board): value is Play {
  if (!isObject(value) || !oneOf(value.screen, SCREENS) || !Array.isArray(value.teams)) return false;
  const teams = value.teams.length;
  if (teams < MIN_TEAMS || teams > MAX_TEAMS || !value.teams.every((team) => isObject(team) && isName(team.name) && isWhole(team.score, -SCORE, SCORE))) return false;
  if (!isWhole(value.chooser, 0, teams - 1) || !isMarks(value.marks, teams)) return false;
  const played = value.played;
  if (!Array.isArray(played) || played.length !== board.columns.length
    || !played.every((column) => Array.isArray(column) && column.length === VALUES.length && column.every((done) => typeof done === "boolean"))) return false;
  if (value.open !== null && !isSpot(value.open, board.columns.length)) return false;
  if (value.bet !== null && !isWhole(value.bet, 0, SCORE)) return false;
  if (!isTeamIndexList(value.finalOrder, teams) || !Array.isArray(value.finalMarks) || value.finalMarks.length !== teams
    || !value.finalMarks.every((entry) => entry === null || (isObject(entry) && isWhole(entry.bet, 0, SCORE) && typeof entry.right === "boolean"))) return false;
  const tie = value.tie;
  if (tie !== null && !(isObject(tie) && isFinalClue(tie.clue) && isTeamIndexList(tie.teams, teams) && isMarks(tie.marks, teams)
    && (tie.winner === null || isWhole(tie.winner, 0, teams - 1)))) return false;
  const last = value.last;
  return last === null || (isObject(last) && isWhole(last.team, 0, teams - 1) && isWhole(last.delta, -SCORE, SCORE));
}

/** A saved game, or null when what is stored is not one. */
export function readGame(value: unknown): SavedGame | null {
  if (!isObject(value) || !isWhole(value.savedAt, 0, Number.MAX_SAFE_INTEGER) || !isText(value.tab, 80)) return null;
  const game = value.game;
  if (!isObject(game) || game.v !== 1 || !isText(game.id, 80) || !isSettings(game.settings) || !isBoard(game.board)) return null;
  const board = game.board;
  if (!isPlay(game.play, board) || !Array.isArray(game.history) || !game.history.every((play) => isPlay(play, board))) return null;
  const teams = (game.play as Play).teams.length;
  if (!game.history.every((play: Play) => play.teams.length === teams)) return null;
  return { game: game as unknown as Game, savedAt: value.savedAt, tab: value.tab };
}

/** localStorage when this browser lets the page use it, else null. */
export function browserStore(): Storage | null {
  try {
    const store = window.localStorage;
    const probe = `${GAME_KEY}-probe`;
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch (error) {
    console.warn("Bible Jeopardy: this browser will not keep the game (storage is blocked or full):", error);
    return null;
  }
}

function readJson(store: Storage | null, key: string): unknown {
  if (!store) return null;
  try {
    const text = store.getItem(key);
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn(`Bible Jeopardy: the saved "${key}" could not be read, so it is ignored:`, error);
    return undefined;
  }
}

function writeJson(store: Storage | null, key: string, value: unknown): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Bible Jeopardy: "${key}" could not be saved (storage is full or blocked):`, error);
    return false;
  }
}

function remove(store: Storage | null, key: string): void {
  if (!store) return;
  try { store.removeItem(key); } catch (error) { console.warn(`Bible Jeopardy: "${key}" could not be removed:`, error); }
}

/** The saved game; a damaged or foreign one is removed and null returned. */
export function loadGame(store: Storage | null): SavedGame | null {
  const raw = readJson(store, GAME_KEY);
  if (raw === null) return null;
  const saved = readGame(raw);
  if (!saved) {
    console.warn("Bible Jeopardy: the saved game was damaged or from another version, so it was removed.");
    remove(store, GAME_KEY);
  }
  return saved;
}

/** Save the game; returns the time it was saved under, or null when it could not be. */
export function saveGame(store: Storage | null, game: Game, tab: string, now = Date.now()): number | null {
  return writeJson(store, GAME_KEY, { game, savedAt: now, tab }) ? now : null;
}

export const clearGame = (store: Storage | null) => remove(store, GAME_KEY);

export const loadSettings = (store: Storage | null): Settings => readSettings(readJson(store, SETTINGS_KEY));
export const saveSettings = (store: Storage | null, settings: Settings) => writeJson(store, SETTINGS_KEY, settings);

/** The recently played ids, oldest first, at most 1,500. */
export function loadSeen(store: Storage | null): string[] {
  const raw = readJson(store, SEEN_KEY);
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is string => typeof id === "string" && /^[0-9a-f]{16}$/.test(id)))].slice(-SEEN_LIMIT);
}

/** Add played ids, newest last, keeping the newest 1,500. */
export function withSeen(seen: readonly string[], ids: readonly string[]): string[] {
  const added = new Set(ids);
  return [...seen.filter((id) => !added.has(id)), ...added].slice(-SEEN_LIMIT);
}

export function addSeen(store: Storage | null, ids: readonly string[]): string[] {
  const next = withSeen(loadSeen(store), ids);
  writeJson(store, SEEN_KEY, next);
  return next;
}

export const clearSeen = (store: Storage | null) => remove(store, SEEN_KEY);

/** This tab's own id, kept for the tab's life, so a newer save from another tab can be noticed (7.1). */
export function tabId(): string {
  const make = () => `tab-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  try {
    const existing = window.sessionStorage.getItem(TAB_KEY);
    if (existing) return existing;
    const id = make();
    window.sessionStorage.setItem(TAB_KEY, id);
    return id;
  } catch (error) {
    console.warn("Bible Jeopardy: no per-tab storage, so this tab gets a fresh id:", error);
    return make();
  }
}
