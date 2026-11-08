// Who's older?: what the game keeps in this browser (design §6.4), under one key: the best score of each mode and the
// run in progress. The run is saved when each pair is dealt and after each answer, so a reload brings back the same
// pair and can neither undo a miss nor skip a question. A run made from older data (another stamp) is dropped; the
// best scores stay. Storage that is missing, full or corrupt never stops the game: it just keeps nothing.
import { DIFFICULTIES, HEARTS, pairOf, type Difficulty, type Mode, type Pool, type Run } from "./game";

const KEY = "bp-whos-older";

export type Store = Pick<Storage, "getItem" | "setItem">;
export interface Best { streak: number; relaxed: number }
export interface Saved { version: 1; best: Best; run?: Run }

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

function readRaw(store: Store | null): Record<string, unknown> | null {
  try {
    const raw = store?.getItem(KEY);
    return raw ? record(JSON.parse(raw)) : null;
  } catch {
    return null; // corrupt or unreadable: treated as nothing saved
  }
}

/** A saved run, if it still fits the data it was made from; anything doubtful is dropped. */
function parseRun(value: unknown, pool: Pool): Run | undefined {
  const v = record(value);
  if (!v || v.stamp !== pool.data.stamp || (v.mode !== "streak" && v.mode !== "relaxed")) return undefined;
  if (!DIFFICULTIES.includes(v.difficulty as Difficulty) || !Number.isInteger(v.seed) || !Array.isArray(v.rounds) || !v.rounds.length) return undefined;
  const hearts = v.hearts;
  if (typeof hearts !== "number" || !Number.isInteger(hearts) || hearts < 0 || hearts > HEARTS) return undefined;
  for (const r of v.rounds) {
    const round = record(r);
    if (!round || typeof round.left !== "string" || typeof round.right !== "string" || !pairOf(pool, { left: round.left, right: round.right })) return undefined;
    if (round.pick !== null && round.pick !== round.left && round.pick !== round.right) return undefined;
  }
  return { stamp: v.stamp as string, mode: v.mode as Mode, difficulty: v.difficulty as Difficulty, seed: v.seed as number,
    rounds: (v.rounds as Run["rounds"]).map(({ left, right, pick }) => ({ left, right, pick })), hearts, over: v.over === true };
}

export function readSaved(store: Store | null, pool: Pool): Saved {
  const raw = readRaw(store);
  const best = record(raw?.best);
  const run = raw?.version === 1 ? parseRun(raw.run, pool) : undefined;
  return { version: 1, best: { streak: count(best?.streak), relaxed: count(best?.relaxed) }, ...(run ? { run } : {}) };
}

function write(store: Store | null, saved: Saved): void {
  try {
    store?.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Full or blocked storage: the game carries on without remembering (design §12).
  }
}

/** Saves the run in progress (or clears it with null), keeping the best scores as they are. */
export function saveRun(store: Store | null, pool: Pool, run: Run | null): void {
  const { best } = readSaved(store, pool);
  write(store, { version: 1, best, ...(run ? { run } : {}) });
}

/** Keeps the higher of the saved best and this score for the mode; returns the bests now held. */
export function saveBest(store: Store | null, pool: Pool, mode: Mode, score: number): Best {
  const saved = readSaved(store, pool);
  const best = { ...saved.best, [mode]: Math.max(saved.best[mode], score) };
  write(store, { ...saved, best });
  return best;
}
