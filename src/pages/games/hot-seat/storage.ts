// Hot seat: what the game keeps on the phone (design §7). Settings, the last roster and the phone's records under
// `bp-hot-seat`; the session in progress under `bp-hot-seat-game`, offered back for 12 hours; the last 2,000 question
// ids asked under `bp-hot-seat-seen`. All in local storage, because phones unload background tabs while the phone goes
// round the room. Storage that is missing, full or broken never stops the game; anything doubtful read back is dropped.
import { NAME_MAX } from "@/lib/live-quiz/names";
import { SEEN_MAX, type FrozenQuestion } from "./deal";
import { DEFAULT_SETTINGS, ROUND_COUNTS, SECONDS, type Asked, type Mark, type Player, type SavedTurn, type Session, type Settings, type Turn } from "./game";
import { GROUP_KEYS, type Group } from "./pool";

export const KEY = "bp-hot-seat";
export const GAME_KEY = "bp-hot-seat-game";
export const SEEN_KEY = "bp-hot-seat-seen";
/** A saved session is offered back for this long after its last save (§6.1). */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface Prefs {
  version: 1;
  settings: Settings;
  rounds: number;
  /** The last roster as typed (a name may be empty: the game then calls them Player 1, Player 2…). */
  roster: { name: string; group: Group }[];
  /** Best single-turn score on this phone, by recordKey (group, seconds, style). */
  records: Record<string, number>;
}
export interface SavedSession { session: Session; savedAt: number }

export const defaultPrefs = (): Prefs => ({ version: 1, settings: { ...DEFAULT_SETTINGS }, rounds: 2, roster: [], records: {} });

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
    const kept = store.getItem(`${KEY}-probe`) === "1";
    store.removeItem(`${KEY}-probe`);
    return kept;
  } catch {
    return false;
  }
}

const record = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const oneOf = <T,>(v: unknown, allowed: readonly T[]): v is T => allowed.includes(v as T);
const whole = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const text = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
const textOrNull = (v: unknown, max: number) => v === null || text(v, max);
const isName = (v: unknown): v is string => typeof v === "string" && v.length > 0 && Array.from(v).length <= NAME_MAX;

function readJson(store: Store | null, key: string): Record<string, unknown> | null {
  try {
    const raw = store?.getItem(key);
    return raw ? record(JSON.parse(raw)) : null;
  } catch {
    return null; // corrupt or unreadable: treated as nothing saved
  }
}

/** Writes a value; false when the store refused it (full or blocked), so the page can say it is not saving. */
function writeJson(store: Store | null, key: string, value: unknown): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Hot seat: could not save ${key}:`, error);
    return false;
  }
}

function parseSettings(v: unknown): Settings {
  const s = record(v);
  const d = DEFAULT_SETTINGS;
  return {
    seconds: oneOf(s?.seconds, SECONDS) ? s.seconds : d.seconds,
    testament: oneOf(s?.testament, ["", "OT", "NT"] as const) ? s.testament : d.testament,
    twoChoices: oneOf(s?.twoChoices, ["little", "kids", "nobody"] as const) ? s.twoChoices : d.twoChoices,
    sound: typeof s?.sound === "boolean" ? s.sound : d.sound,
  };
}

export function readPrefs(store: Store | null): Prefs {
  const raw = readJson(store, KEY);
  if (!raw || raw.version !== 1) return defaultPrefs();
  const roster = Array.isArray(raw.roster) ? raw.roster.map(record).filter((p): p is Record<string, unknown> => !!p && typeof p.name === "string" && Array.from(p.name).length <= NAME_MAX && oneOf(p.group, GROUP_KEYS))
    .slice(0, 12).map((p) => ({ name: p.name as string, group: p.group as Group })) : [];
  const records = Object.fromEntries(Object.entries(record(raw.records) ?? {}).filter(([key, n]) => text(key, 40) && whole(n, 1, 1000)));
  return { version: 1, settings: parseSettings(raw.settings), rounds: oneOf(raw.rounds, ROUND_COUNTS) ? raw.rounds : 2, roster, records: records as Record<string, number> };
}

export const writePrefs = (store: Store | null, prefs: Prefs) => writeJson(store, KEY, prefs);

// ---- The session ---------------------------------------------------------------------------------------------------

const isLink = (v: unknown) => {
  const l = record(v);
  return v === null || (!!l && typeof l.book === "string" && /^[A-Z0-9]{2,8}$/.test(l.book) && whole(l.chapter, 1, 999) && (l.verse === null || whole(l.verse, 1, 999)));
};

function isQuestion(v: unknown): v is FrozenQuestion {
  const q = record(v);
  if (!q || !text(q.id, 16) || !text(q.text, 300) || !text(q.answer, 200) || !textOrNull(q.full, 2000) || !textOrNull(q.reference, 160)) return false;
  if (!isLink(q.link) || !text(q.level, 10) || !textOrNull(q.topic, 60) || !(q.earlier === undefined || q.earlier === true)) return false;
  return q.choices === null || (Array.isArray(q.choices) && q.choices.length === 2 && q.choices.every((c) => text(c, 200)));
}

const MARKS: readonly (Mark | null)[] = ["right", "wrong", "pass", null];
const isAsked = (v: unknown): v is Asked => { const a = record(v); return !!a && isQuestion(a.q) && oneOf(a.mark, MARKS); };

function isTurnBase(v: Record<string, unknown>, playerIds: Set<string>, rounds: number): boolean {
  return whole(v.round, 1, rounds) && typeof v.playerId === "string" && playerIds.has(v.playerId) && oneOf(v.group, GROUP_KEYS)
    && oneOf(v.seconds, SECONDS) && oneOf(v.style, ["open", "two"] as const) && Array.isArray(v.questions) && v.questions.length <= 200 && v.questions.every(isAsked);
}

function readTurn(v: unknown, playerIds: Set<string>, rounds: number): Turn | null {
  const t = record(v);
  if (!t || !isTurnBase(t, playerIds, rounds) || !oneOf(t.testament, ["", "OT", "NT"] as const) || !oneOf(t.phase, ["live", "overtime", "recap"] as const)) return null;
  if (!Array.isArray(t.discarded) || !t.discarded.every((id) => text(id, 16)) || typeof t.leftMs !== "number" || !Number.isFinite(t.leftMs)) return null;
  const turn = t as unknown as Turn;
  if (turn.phase !== "recap" && (turn.questions.length === 0 || turn.questions.at(-1)!.mark !== null)) return null;
  return { ...turn, leftMs: Math.max(0, Math.min(turn.seconds * 1000, turn.leftMs)) };
}

function isPlayer(v: unknown): v is Player {
  const p = record(v);
  return !!p && text(p.id, 8) && isName(p.name) && oneOf(p.group, GROUP_KEYS) && whole(p.joinedRound, 1, 100) && typeof p.left === "boolean";
}

function parseSession(v: unknown): Session | null {
  const s = record(v);
  if (!s || s.version !== 1 || !whole(s.rounds, 1, 99) || !whole(s.nextId, 1, 10_000) || typeof s.ended !== "boolean") return null;
  if (!Array.isArray(s.players) || s.players.length < 1 || s.players.length > 100 || !s.players.every(isPlayer)) return null;
  const ids = new Set(s.players.map((p) => p.id));
  if (ids.size !== s.players.length || !Array.isArray(s.turns) || s.turns.length > 1000) return null;
  if (!s.turns.every((t) => { const r = record(t); return !!r && isTurnBase(r, ids, s.rounds as number) && typeof r.skipped === "boolean"; })) return null;
  const current = s.current === null ? null : readTurn(s.current, ids, s.rounds);
  if (s.current !== null && !current) return null;
  return { version: 1, settings: parseSettings(s.settings), players: s.players, rounds: s.rounds, turns: s.turns as SavedTurn[], current, ended: s.ended, nextId: s.nextId };
}

/** The saved session, if it is well formed and was saved less than 12 hours ago (and not in the future). */
export function readSession(store: Store | null, now = Date.now()): SavedSession | null {
  const raw = readJson(store, GAME_KEY);
  if (!raw || raw.version !== 1 || typeof raw.savedAt !== "number" || raw.savedAt > now + 60_000 || now - raw.savedAt > SESSION_TTL_MS) return null;
  const session = parseSession(raw.session);
  return session ? { session, savedAt: raw.savedAt } : null;
}

export function writeSession(store: Store | null, session: Session | null, now = Date.now()): boolean {
  if (!session) {
    try { store?.removeItem(GAME_KEY); return true; } catch (error) { console.warn("Hot seat: could not clear the saved game:", error); return false; }
  }
  return writeJson(store, GAME_KEY, { version: 1, savedAt: now, session });
}

// ---- The seen list ---------------------------------------------------------------------------------------------------

export function readSeen(store: Store | null): string[] {
  const raw = readJson(store, SEEN_KEY);
  if (!raw || raw.version !== 1 || !Array.isArray(raw.ids)) return [];
  return raw.ids.filter((id): id is string => text(id, 16) && id.length > 0).slice(-SEEN_MAX);
}

export const writeSeen = (store: Store | null, ids: readonly string[]) => writeJson(store, SEEN_KEY, { version: 1, ids: ids.slice(-SEEN_MAX) });
