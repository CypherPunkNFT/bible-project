// Memory card match: what the game keeps on this device (design sections 9, 10 and 16). Local storage holds the best
// records, the pairs seen lately, the opening-board flag and the player's settings; session storage holds the board in
// progress, so Back or a reload returns to it. Storage that is missing, full or corrupt never stops the game.
import { DIFFICULTIES, type Card, type Difficulty, type PairsFile } from "./deal";
import type { GameState } from "./game";
import { DEFAULT_VERSION, isVersionKey, type VersionKey } from "./versions";

const BEST_KEY = "bp-memory-match-best";
const SEEN_KEY = "bp-memory-match-seen";
const OPENER_KEY = "bp-memory-match-opener";
const SETTINGS_KEY = "bp-memory-match-settings";
const GAME_KEY = "bp-memory-match-game";
const VERSION_KEY = "bp-memory-match-version";
/** Pairs remembered as seen lately: most of the Mixed deck, so boards keep changing. */
export const SEEN_LIMIT = 120;

export type Store = Pick<Storage, "getItem" | "setItem">;

/** The browser's storage, or null where the browser refuses it (private modes can throw on access). */
export function browserStore(which: "local" | "session"): Store | null {
  try {
    return which === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function read(store: Store | null, key: string): unknown {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // corrupt or unreadable: treated as nothing saved
  }
}

function write(store: Store | null, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Full or blocked storage: the game carries on without remembering (design 16).
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === "string");
const isCount = (value: unknown, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;

/** True once per device, the first time it is asked, and only if storage can remember that it was asked. */
export function takeOpener(store: Store | null): boolean {
  if (read(store, OPENER_KEY) === true) return false;
  write(store, OPENER_KEY, true);
  return read(store, OPENER_KEY) === true;
}

/** Pair ids seen on this device, oldest first. */
export function readSeen(store: Store | null): string[] {
  const value = read(store, SEEN_KEY);
  return isStringArray(value) ? value.slice(-SEEN_LIMIT) : [];
}

export function rememberSeen(store: Store | null, ids: readonly string[]): string[] {
  const next = [...readSeen(store).filter((id) => !ids.includes(id)), ...ids].slice(-SEEN_LIMIT);
  write(store, SEEN_KEY, next);
  return next;
}

export interface Settings {
  timerHidden: boolean;
  /** "auto": a non-pair turns back after a moment; "tap": it waits for the next tap (WCAG 2.2.1, design 12). */
  turnBack: "auto" | "tap";
}

export const DEFAULT_SETTINGS: Settings = { timerHidden: false, turnBack: "auto" };

export function readSettings(store: Store | null): Settings {
  const value = read(store, SETTINGS_KEY);
  if (!isRecord(value)) return DEFAULT_SETTINGS;
  return {
    timerHidden: value.timerHidden === true,
    turnBack: value.turnBack === "tap" ? "tap" : "auto",
  };
}

export const saveSettings = (store: Store | null, settings: Settings) => write(store, SETTINGS_KEY, settings);

export interface Best { moves: number; timeMs: number; stars: number }

export const bestKey = (deck: string, difficulty: Difficulty) => `${deck}:${difficulty}`;

export function readBest(store: Store | null): Record<string, Best> {
  const value = read(store, BEST_KEY);
  if (!isRecord(value)) return {};
  const out: Record<string, Best> = {};
  for (const [key, entry] of Object.entries(value)) {
    const [, difficulty] = key.split(":");
    if (!DIFFICULTIES.includes(difficulty as Difficulty) || !isRecord(entry)) continue;
    if (isCount(entry.moves, 10_000) && isCount(entry.timeMs, 864e5) && isCount(entry.stars, 3) && entry.moves > 0) {
      out[key] = { moves: entry.moves, timeMs: entry.timeMs, stars: entry.stars };
    }
  }
  return out;
}

/** Keeps the fewest moves, the fastest time and the most stars, each on its own; says which are new. */
export function saveBest(store: Store | null, deck: string, difficulty: Difficulty, result: Best) {
  const all = readBest(store);
  const key = bestKey(deck, difficulty);
  const old = all[key];
  const newMoves = !old || result.moves < old.moves;
  const newTime = !old || result.timeMs < old.timeMs;
  const best = old
    ? { moves: Math.min(old.moves, result.moves), timeMs: Math.min(old.timeMs, result.timeMs), stars: Math.max(old.stars, result.stars) }
    : result;
  write(store, BEST_KEY, { ...all, [key]: best });
  return { best, newMoves: newMoves && !!old, newTime: newTime && !!old, first: !old };
}

/** The saved board, if it still fits the pairs file it was dealt from; anything doubtful deals afresh (design 16). */
export function readGame(store: Store | null, data: PairsFile): GameState | null {
  const value = read(store, GAME_KEY);
  if (!isRecord(value) || value.stamp !== data.stamp || !DIFFICULTIES.includes(value.difficulty as Difficulty)) return null;
  if (typeof value.deck !== "string" || !data.decks.some((d) => d.key === value.deck)) return null;
  const { cards, up, matched, found, players } = value;
  if (!Array.isArray(cards) || !cards.length || cards.length % 2 || !Array.isArray(matched) || matched.length !== cards.length) return null;
  const pairIds = new Set(data.pairs.map((p) => p.id));
  const halves = new Map<string, Set<string>>();
  for (const card of cards as Card[]) {
    if (!isRecord(card) || !pairIds.has(card.pair) || (card.kind !== "who" && card.kind !== "story")) return null;
    halves.set(card.pair, (halves.get(card.pair) ?? new Set()).add(card.kind));
  }
  if (halves.size !== cards.length / 2 || [...halves.values()].some((kinds) => kinds.size !== 2)) return null;
  if (!isStringArray(players) || players.length < 1 || players.length > 4) return null;
  if (!matched.every((m) => m === null || isCount(m, players.length - 1))) return null;
  if (!Array.isArray(up) || up.length > 2 || !up.every((n) => isCount(n, cards.length - 1) && matched[n] === null)) return null;
  if (!isStringArray(found) || !found.every((id) => halves.has(id))) return null;
  if (!isCount(value.moves, 10_000) || !isCount(value.turn, players.length - 1) || !isCount(value.columns, 6) || value.columns < 3) return null;
  if (!isCount(value.elapsedMs, 864e5) || typeof value.studying !== "boolean") return null;
  return value as unknown as GameState;
}

export const saveGame = (store: Store | null, game: GameState | null) => write(store, GAME_KEY, game);

/** The version of the board in progress, if one is saved: the page loads that version's cards to resume it. */
export function savedGameVersion(store: Store | null): VersionKey | null {
  const value = read(store, GAME_KEY);
  if (!isRecord(value)) return null;
  return isVersionKey(value.version) ? value.version : DEFAULT_VERSION;
}

/** The version last chosen on this device; the people version on a first visit. */
export function readVersion(store: Store | null): VersionKey {
  const value = read(store, VERSION_KEY);
  return isVersionKey(value) ? value : DEFAULT_VERSION;
}

export const saveVersion = (store: Store | null, version: VersionKey) => write(store, VERSION_KEY, version);
