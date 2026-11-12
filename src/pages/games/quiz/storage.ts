// /games/quiz: what the games page keeps (its own addition; the homepage quiz keeps nothing). Session storage holds
// the round in progress, so a reload or Back returns to the same board; local storage holds the best score on this
// device. Storage that is missing, full or corrupt never stops the game: it just keeps nothing.
import { TOTAL, freshPicked, type Picked } from "./game";

const ROUND_KEY = "bp-quiz-round";
const BEST_KEY = "bp-quiz-best";

export type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface SavedRound { picked: Picked; order: number[]; current: number; board: boolean }

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
    return null;
  }
}

function write(store: Store | null, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`quiz: could not save ${key}:`, error);
  }
}

const isChoice = (value: unknown): value is number | null => value === null || (Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3);

/** The saved round, or null when none was saved or the saved shape is not one this game wrote. */
export function readRound(store: Store | null): SavedRound | null {
  const raw = read(store, ROUND_KEY) as Partial<SavedRound> | null;
  if (!raw || !Array.isArray(raw.picked) || raw.picked.length !== TOTAL || !raw.picked.every(isChoice)) return null;
  if (!Array.isArray(raw.order) || !raw.order.every((i) => Number.isInteger(i) && i >= 0 && i < TOTAL)) return null;
  if (!Number.isInteger(raw.current) || (raw.current as number) < -1 || (raw.current as number) >= TOTAL) return null;
  return { picked: raw.picked as Picked, order: raw.order as number[], current: raw.current as number, board: raw.board !== false };
}

export function saveRound(store: Store | null, round: SavedRound | null): void {
  if (!round) {
    try { store?.removeItem(ROUND_KEY); } catch (error) { console.warn("quiz: could not clear the saved round:", error); }
    return;
  }
  write(store, ROUND_KEY, round);
}

export const readBest = (store: Store | null): number => {
  const value = read(store, BEST_KEY);
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= TOTAL ? (value as number) : 0;
};
export const writeBest = (store: Store | null, best: number): void => write(store, BEST_KEY, best);

export const freshRound = (): SavedRound => ({ picked: freshPicked(), order: [], current: 0, board: true });
