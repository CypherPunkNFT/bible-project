// Odd one out: what the game keeps on this device (design sections 9 and 14). Local storage holds the sets seen
// lately and the best score for each choice; session storage holds the round in progress, so Back or a reload returns
// to the same puzzle. Storage that is missing, full or corrupt never stops the game: it just keeps nothing.
import { CHOICES, DIFFICULTIES, SEEN_LIMIT, type Choice, type Difficulty, type SetsFile } from "./game";

const SEEN_KEY = "bp-odd-one-out-seen";
const BEST_KEY = "bp-odd-one-out-best";
const ROUND_KEY = "bp-odd-one-out-round";
const OPENER_KEY = "bp-odd-one-out-opener";

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
    // Full or blocked storage: the game carries on without remembering (design 14).
  }
}

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === "string");

/**
 * True once per device: the first time it is asked, and only if storage can remember that it was asked. Storage that
 * is blocked answers false, so the owner's example doesn't open every round there.
 */
export function takeOpener(store: Store | null): boolean {
  if (read(store, OPENER_KEY) === true) return false;
  write(store, OPENER_KEY, true);
  return read(store, OPENER_KEY) === true;
}

/** Set ids seen on this device, oldest first, at most SEEN_LIMIT. */
export function readSeen(store: Store | null): string[] {
  const value = read(store, SEEN_KEY);
  return isStringArray(value) ? value.slice(-SEEN_LIMIT) : [];
}

export function rememberSeen(store: Store | null, ids: readonly string[]): string[] {
  const next = [...readSeen(store).filter((id) => !ids.includes(id)), ...ids].slice(-SEEN_LIMIT);
  write(store, SEEN_KEY, next);
  return next;
}

export const bestKey = (choice: Choice, difficulty: Difficulty) => `${choice}:${difficulty}`;

export function readBest(store: Store | null): Record<string, number> {
  const value = read(store, BEST_KEY);
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const choice of CHOICES) {
    for (const difficulty of DIFFICULTIES) {
      const score = (value as Record<string, unknown>)[bestKey(choice, difficulty)];
      if (typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= 100) out[bestKey(choice, difficulty)] = score;
    }
  }
  return out;
}

/** Keeps the higher of the saved best and this score; returns the best now held. */
export function saveBest(store: Store | null, choice: Choice, difficulty: Difficulty, score: number): number {
  const best = readBest(store);
  const key = bestKey(choice, difficulty);
  const next = Math.max(best[key] ?? 0, score);
  write(store, BEST_KEY, { ...best, [key]: next });
  return next;
}

/** A round in progress: its sets, the order each set's four were shown in, and the answers so far. */
export interface RoundState {
  stamp: string;
  choice: Choice;
  difficulty: Difficulty;
  ids: string[];
  orders: string[][];
  picks: (string | null)[];
  index: number;
}

const samePeople = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** The saved round, if it still fits the sets file it was made from; anything doubtful starts afresh. */
export function readRound(store: Store | null, data: SetsFile): RoundState | null {
  const value = read(store, ROUND_KEY) as Partial<RoundState> | null;
  if (!value || value.stamp !== data.stamp || !CHOICES.includes(value.choice as Choice)) return null;
  if (!DIFFICULTIES.includes(value.difficulty as Difficulty) || !isStringArray(value.ids) || !Array.isArray(value.orders)) return null;
  if (!Array.isArray(value.picks) || !Number.isInteger(value.index)) return null;
  const { ids, orders, picks } = value;
  const index = value.index as number;
  const byId = new Map(data.sets.map((set) => [set.id, set]));
  if (!ids.length || orders.length !== ids.length || picks.length !== ids.length || index < 0 || index > ids.length) return null;
  for (const [n, id] of ids.entries()) {
    const set = byId.get(id);
    const order = orders[n];
    const pick = picks[n];
    if (!set || !isStringArray(order) || !samePeople(order, set.items)) return null;
    if (pick !== null && !(typeof pick === "string" && set.items.includes(pick))) return null;
  }
  return value as RoundState;
}

export function saveRound(store: Store | null, round: RoundState | null): void {
  write(store, ROUND_KEY, round);
}
