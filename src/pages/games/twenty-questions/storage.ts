// Bible twenty questions: what the game keeps in this browser (design §12), under one key. The game in progress is
// stored by ids, not positions, and dropped when the game file's version changes or any id no longer exists. The
// device's softened values (design §10.3) are keyed by version, person and tag. Missing, full or damaged storage
// never stops the game: it just remembers nothing.
import { EXTRA_TURNS, TURNS, softKey, type Answer, type Engine, type Turn } from "./engine";

const KEY = "bp-twenty-questions";
const RECENT = 30;

export type Store = Pick<Storage, "getItem" | "setItem">;
export type Level = "easy" | "hard";
export type Outcome = "won" | "lost" | null;
export interface GuessGame { mode: "guess"; seed: number; turns: Turn[]; limit: number; over: Outcome }
/** Reverse mode's turns in order: a question asked (tag) or a guess made (person). */
export type Move = { kind: "q"; tag: number } | { kind: "g"; person: number };
export interface ReverseGame { mode: "reverse"; seed: number; level: Level; secret: number; moves: Move[]; over: Outcome }
export type Game = GuessGame | ReverseGame;
export interface Totals { played: number; siteWon: number; playerWon: number }
export interface Saved { game: Game | null; recent: string[]; softened: string[]; totals: Totals; dropped: boolean }

type StoredTurn = { k: "q"; tag: string; a?: Answer } | { k: "g"; person: string; right?: boolean };

export function browserStore(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null; // private modes can refuse access outright
  }
}

const record = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const count = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0);
const strings = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(-max) : []);

function readRaw(store: Store | null): Record<string, unknown> {
  try {
    const raw = store?.getItem(KEY);
    return (raw && record(JSON.parse(raw))) || {};
  } catch {
    return {}; // damaged: treated as nothing saved
  }
}

function writeRaw(store: Store | null, value: Record<string, unknown>): void {
  try {
    store?.setItem(KEY, JSON.stringify(value));
  } catch (error) {
    console.warn("Twenty questions: this device's storage refused the save:", error);
  }
}

function parseTurns(engine: Engine, value: unknown): Turn[] | null {
  if (!Array.isArray(value)) return null;
  const turns: Turn[] = [];
  for (const raw of value) {
    const t = record(raw);
    const tag = t?.k === "q" && typeof t.tag === "string" ? engine.tagIndex.get(t.tag) : undefined;
    const person = t?.k === "g" && typeof t.person === "string" ? engine.personIndex.get(t.person) : undefined;
    if (tag !== undefined && (t!.a === "y" || t!.a === "n" || t!.a === "d")) turns.push({ kind: "q", tag, answer: t!.a });
    else if (person !== undefined && typeof t!.right === "boolean") turns.push({ kind: "g", person, right: t!.right });
    else return null;
  }
  return turns;
}

function parseMoves(engine: Engine, value: unknown): Move[] | null {
  if (!Array.isArray(value)) return null;
  const moves: Move[] = [];
  for (const raw of value) {
    const t = record(raw);
    const tag = t?.k === "q" && typeof t.tag === "string" ? engine.tagIndex.get(t.tag) : undefined;
    const person = t?.k === "g" && typeof t.person === "string" ? engine.personIndex.get(t.person) : undefined;
    if (tag !== undefined) moves.push({ kind: "q", tag });
    else if (person !== undefined) moves.push({ kind: "g", person });
    else return null;
  }
  return moves;
}

function parseGame(engine: Engine, value: unknown): Game | null {
  const g = record(value);
  if (!g || g.version !== engine.data.version || typeof g.seed !== "number" || !Number.isInteger(g.seed)) return null;
  const over: Outcome = g.over === "won" || g.over === "lost" ? g.over : null;
  if (g.mode === "guess") {
    const turns = parseTurns(engine, g.turns), limit = g.limit === TURNS + EXTRA_TURNS ? TURNS + EXTRA_TURNS : TURNS;
    return turns && turns.length <= limit ? { mode: "guess", seed: g.seed, turns, limit, over } : null;
  }
  if (g.mode === "reverse" && typeof g.secret === "string" && (g.level === "easy" || g.level === "hard")) {
    const secret = engine.personIndex.get(g.secret), moves = parseMoves(engine, g.moves);
    if (secret === undefined || !moves || moves.length > TURNS) return null;
    return { mode: "reverse", seed: g.seed, level: g.level, secret, moves, over };
  }
  return null;
}

/** Everything saved, rebuilt field by field; `dropped` says a game from an older game file was let go. */
export function readSaved(store: Store | null, engine: Engine): Saved {
  const raw = readRaw(store), totals = record(raw.totals) ?? {};
  const game = parseGame(engine, raw.game);
  const soft = record(raw.softened) ?? {};
  return {
    game, dropped: Boolean(raw.game) && !game,
    recent: strings(raw.recent, RECENT),
    softened: strings(soft[engine.data.version], 2000),
    totals: { played: count(totals.played), siteWon: count(totals.siteWon), playerWon: count(totals.playerWon) },
  };
}

function storedGame(engine: Engine, game: Game | null): Record<string, unknown> | null {
  if (!game) return null;
  const { data } = engine, base = { version: data.version, seed: game.seed, over: game.over };
  if (game.mode === "guess") {
    const turns: StoredTurn[] = game.turns.map((t) => (t.kind === "q" ? { k: "q", tag: data.tags[t.tag].id, a: t.answer }
      : { k: "g", person: data.people[t.person].id, right: t.right }));
    return { ...base, mode: "guess", turns, limit: game.limit };
  }
  const moves: StoredTurn[] = game.moves.map((m) => (m.kind === "q" ? { k: "q", tag: data.tags[m.tag].id } : { k: "g", person: data.people[m.person].id }));
  return { ...base, mode: "reverse", level: game.level, secret: data.people[game.secret].id, moves };
}

/** Saves the whole record; the softened values of other versions are dropped (the shared file has absorbed them). */
export function save(store: Store | null, engine: Engine, saved: Omit<Saved, "dropped">): void {
  writeRaw(store, { game: storedGame(engine, saved.game), recent: saved.recent.slice(-RECENT),
    softened: { [engine.data.version]: saved.softened }, totals: saved.totals });
}

/** Adds one "I still think your note is wrong" for this device (design §10.3). */
export function soften(softened: readonly string[], personId: string, tagId: string): string[] {
  const key = softKey(personId, tagId);
  return softened.includes(key) ? [...softened] : [...softened, key];
}
