// Family charades: what the game keeps on the device (design §6.5). Settings, the best score per round length and
// the recently seen scenes in local storage (`bp-charades`); a team game in progress in session storage
// (`bp-charades-game`), so a reload or a trip to the reader in the same tab never loses the scores. Storage that is
// missing, full or broken never stops the game: it just keeps nothing. Anything doubtful read back is dropped.
import { AGE_GROUPS, DIFFICULTIES, RECENT_LIMIT, type AgeGroup, type DeckKey, type Difficulty, type ThemeKey } from "./deck";
import { MAX_TEAM_NAME, ROUND_SECONDS, type Seconds, type TeamGame } from "./game";

export const KEY = "bp-charades";
export const GAME_KEY = "bp-charades-game";

export type Mode = "guess" | "act";
export type Controls = "tilt" | "buttons";
export type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface Settings {
  mode: Mode;
  ageGroup: AgeGroup;
  deck: DeckKey;
  difficulty: Difficulty;
  seconds: Record<AgeGroup, Seconds>;
  /** Per mode: Guess it starts on tilt, Act it on buttons (§1.1). */
  controls: Record<Mode, Controls>;
  sound: boolean;
  pictures: Record<AgeGroup, boolean>;
}

export interface Saved {
  version: 1;
  settings: Settings;
  /** The last check found no tilt readings: Controls starts on Buttons only (§5.4). */
  tiltFailed: boolean;
  best: Partial<Record<`${Seconds}`, number>>;
  /** Oldest first. */
  recent: string[];
}

const THEME_KEYS: readonly ThemeKey[] = ["beginnings", "kings", "jesus", "miracles", "parables", "church", "seasons"];

export const defaultSettings = (): Settings => ({
  mode: "guess", ageGroup: "kids", deck: "everything", difficulty: "medium",
  seconds: { little: 90, kids: 60, adults: 60 },
  controls: { guess: "tilt", act: "buttons" },
  sound: true,
  pictures: { little: true, kids: false, adults: false },
});

export const emptySaved = (): Saved => ({ version: 1, settings: defaultSettings(), tiltFailed: false, best: {}, recent: [] });

/** A browser store, or null where the browser refuses it (private modes can throw on access). */
export function browserStore(kind: "local" | "session"): Store | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

const record = (value: unknown): Record<string, unknown> | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null);
const oneOf = <T,>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
const count = (value: unknown): number | undefined => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined);
const AGE_KEYS = AGE_GROUPS.map((g) => g.key);

function readJson(store: Store | null, key: string): Record<string, unknown> | null {
  try {
    const raw = store?.getItem(key);
    return raw ? record(JSON.parse(raw)) : null;
  } catch {
    return null; // corrupt or unreadable: treated as nothing saved
  }
}

function writeJson(store: Store | null, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Full or blocked storage: the game carries on without remembering (design §12).
  }
}

function perAge<T>(value: unknown, allowed: readonly T[], fallback: Record<AgeGroup, T>): Record<AgeGroup, T> {
  const v = record(value);
  return Object.fromEntries(AGE_KEYS.map((age) => [age, oneOf(v?.[age], allowed, fallback[age])])) as Record<AgeGroup, T>;
}

function parseSettings(value: unknown): Settings {
  const v = record(value);
  const d = defaultSettings();
  const controls = record(v?.controls);
  return {
    mode: oneOf(v?.mode, ["guess", "act"] as const, d.mode),
    ageGroup: oneOf(v?.ageGroup, AGE_KEYS, d.ageGroup),
    deck: oneOf(v?.deck, ["everything", ...THEME_KEYS] as DeckKey[], d.deck),
    difficulty: oneOf(v?.difficulty, DIFFICULTIES.map((x) => x.key), d.difficulty),
    seconds: perAge(v?.seconds, ROUND_SECONDS, d.seconds),
    controls: { guess: oneOf(controls?.guess, ["tilt", "buttons"] as const, d.controls.guess), act: oneOf(controls?.act, ["tilt", "buttons"] as const, d.controls.act) },
    sound: typeof v?.sound === "boolean" ? v.sound : d.sound,
    pictures: perAge(v?.pictures, [true, false], d.pictures),
  };
}

/** Everything kept in local storage; an unknown version is dropped and the defaults used. */
export function readSaved(store: Store | null): Saved {
  const raw = readJson(store, KEY);
  if (!raw || raw.version !== 1) return emptySaved();
  const best = record(raw.best);
  const recent = Array.isArray(raw.recent) ? raw.recent.filter((id): id is string => typeof id === "string").slice(-RECENT_LIMIT) : [];
  return {
    version: 1,
    settings: parseSettings(raw.settings),
    tiltFailed: raw.tiltFailed === true,
    best: Object.fromEntries(ROUND_SECONDS.flatMap((s) => { const n = count(best?.[String(s)]); return n === undefined ? [] : [[String(s), n]]; })),
    recent,
  };
}

/** Writes what is kept. The page holds the current copy, so blocked storage never resets its settings. */
export function writeSaved(store: Store | null, saved: Saved): void {
  writeJson(store, KEY, saved);
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

export const bestFor = (saved: Saved, seconds: Seconds) => saved.best[`${seconds}`] ?? 0;

export function readTeamGame(store: Store | null): TeamGame | null {
  const v = readJson(store, GAME_KEY);
  const teams = v?.teams;
  if (!v || v.version !== 1 || !Array.isArray(teams) || teams.length < 2 || teams.length > 4) return null;
  if (!teams.every((t) => typeof t === "string" && t.length > 0 && t.length <= MAX_TEAM_NAME)) return null;
  const totals = Array.isArray(v.totals) ? v.totals.map(count) : [];
  const turnsEach = count(v.turnsEach);
  const turn = count(v.turn);
  const lastScore = count(v.lastScore) ?? 0;
  if (totals.length !== teams.length || totals.some((t) => t === undefined) || !turnsEach || turnsEach > 5 || turn === undefined || turn > teams.length * turnsEach) return null;
  return { teams: teams as string[], turnsEach, totals: totals as number[], turn, lastScore };
}

export function saveTeamGame(store: Store | null, game: TeamGame | null): void {
  if (!game) {
    try { store?.removeItem(GAME_KEY); } catch { /* blocked storage: nothing was kept */ }
    return;
  }
  writeJson(store, GAME_KEY, { version: 1, ...game });
}
