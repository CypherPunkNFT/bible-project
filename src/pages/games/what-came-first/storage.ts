// What came first?: what the game keeps in this browser (design §7), under one key: the pill last chosen, the best score
// of each category (and Mixed) in each mode, and the run in progress. The run is saved when each round is dealt and
// after each answer, so a reload brings back the same round and can neither undo a miss nor skip one. A saved run is
// resumed only when every category it dealt from still has the same data stamp and every round is still askable;
// otherwise it is dropped and the bests stay. Storage that is missing, full or corrupt never stops the game.
//
// Who's older? players keep what they had (design §7.2): when the new key is missing, the old key's bests become Who
// lived first's and its saved run is copied as it is into a Who lived first run. The resume check judges that run later,
// like any other. The new key is written at once; the old key is never written or deleted, so this runs only once.
import { isChoice, type Choice } from "./categories";
import { DIFFICULTIES, HEARTS, isPairRound, pairOf, questionOf, type Difficulty, type Mode, type Round, type Run } from "./game";
import type { CategoryKey } from "./order";
import type { Pools } from "./pool";

export const KEY = "bp-what-came-first";
export const OLD_KEY = "bp-whos-older";

export type Store = Pick<Storage, "getItem" | "setItem">;
export interface Best { streak: number; relaxed: number }
export type Bests = Partial<Record<Choice, Best>>;
export interface Saved { version: 1; choice?: Choice; best: Bests; run?: Run }

export const NO_BEST: Best = { streak: 0, relaxed: 0 };
export const bestOf = (bests: Bests, choice: Choice): Best => bests[choice] ?? NO_BEST;

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
const parseBest = (value: unknown): Best => { const v = record(value); return { streak: count(v?.streak), relaxed: count(v?.relaxed) }; };

function readKey(store: Store | null, key: string): Record<string, unknown> | null {
  try {
    const raw = store?.getItem(key);
    return raw ? record(JSON.parse(raw)) : null;
  } catch {
    return null; // corrupt or unreadable: treated as nothing saved
  }
}

const CATEGORY_SET = new Set<string>(["lived", "happened", "ruled", "built", "went", "died", "books", "firsts"]);

/** One saved round's shape, or null. Whether it is still askable is runFits's question, against the data. */
function parseRound(value: unknown): Round | null {
  const r = record(value);
  if (!r || typeof r.category !== "string" || !CATEGORY_SET.has(r.category)) return null;
  if (r.category === "firsts") {
    const order = r.order;
    if (typeof r.question !== "string" || !Array.isArray(order) || order.length < 2 || order.length > 6) return null;
    if (!order.every((i, n) => Number.isInteger(i) && i >= 0 && order.indexOf(i) === n)) return null;
    if (r.pick !== null && !order.includes(r.pick)) return null;
    return { category: "firsts", question: r.question, order: order as number[], pick: r.pick as number | null };
  }
  if (typeof r.left !== "string" || typeof r.right !== "string" || r.left === r.right) return null;
  if (r.pick !== null && r.pick !== r.left && r.pick !== r.right) return null;
  return { category: r.category as Exclude<CategoryKey, "firsts">, left: r.left, right: r.right, pick: r.pick as string | null };
}

/** A saved run's shape, or undefined; anything doubtful is dropped. */
export function parseRun(value: unknown): Run | undefined {
  const v = record(value);
  if (!v || !isChoice(v.choice) || (v.mode !== "streak" && v.mode !== "relaxed")) return undefined;
  if (!DIFFICULTIES.includes(v.difficulty as Difficulty) || !Number.isInteger(v.seed) || !Array.isArray(v.rounds) || !v.rounds.length) return undefined;
  const hearts = v.hearts;
  if (typeof hearts !== "number" || !Number.isInteger(hearts) || hearts < 0 || hearts > HEARTS) return undefined;
  const stamps = record(v.stamps);
  if (!stamps || !Object.entries(stamps).every(([k, s]) => CATEGORY_SET.has(k) && typeof s === "string")) return undefined;
  const rounds = v.rounds.map(parseRound);
  if (rounds.some((r) => r === null)) return undefined;
  const run: Run = { choice: v.choice, mode: v.mode, difficulty: v.difficulty as Difficulty, seed: v.seed as number, rounds: rounds as Round[], hearts,
    over: v.over === true, stamps: stamps as Run["stamps"] };
  return run.rounds.every((r) => run.stamps[r.category] !== undefined && (run.choice === "mixed" || r.category === run.choice)) ? run : undefined;
}

/** Whether a saved run still fits the data now loaded: every stamp the same, every round still askable. */
export function runFits(run: Run, pools: Pools): boolean {
  for (const [key, stamp] of Object.entries(run.stamps) as [CategoryKey, string][]) {
    if ((key === "firsts" ? pools.firsts?.stamp : pools[key]?.stamp) !== stamp) return false;
  }
  return run.rounds.every((r) => {
    if (isPairRound(r)) return !!pairOf(pools, r);
    const question = questionOf(pools, r);
    return !!question && r.order.length === question.options.length + 1 && r.order.every((i) => i <= question.options.length);
  });
}

/** Who's older?'s save, as What came first? keeps it: its bests become Who lived first's, its run a Who lived first run. */
export function migrateOld(old: Record<string, unknown> | null): Saved | null {
  if (!old) return null;
  // Who's older? read its bests whatever the version, and its run only at version 1: so does this.
  const saved: Saved = { version: 1, choice: "lived", best: { lived: parseBest(old.best) } };
  const run = old.version === 1 ? record(old.run) : null;
  if (run && typeof run.stamp === "string" && Array.isArray(run.rounds)) {
    const copied = parseRun({ ...run, choice: "lived", stamps: { lived: run.stamp },
      rounds: run.rounds.map((r) => ({ ...record(r), category: "lived" })) });
    if (copied) saved.run = copied;
  }
  return saved;
}

function write(store: Store | null, saved: Saved): void {
  try {
    store?.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Full or blocked storage: the game carries on without remembering.
  }
}

/** What is saved: the bests, the last choice and the run's shape (not yet checked against the data: see runFits). */
export function readSaved(store: Store | null): Saved {
  const raw = readKey(store, KEY);
  if (!raw || raw.version !== 1) {
    const migrated = migrateOld(readKey(store, OLD_KEY));
    if (migrated) { write(store, migrated); return migrated; }
  }
  const bests = record(raw?.best) ?? {};
  const best: Bests = {};
  for (const [key, value] of Object.entries(bests)) if (isChoice(key)) best[key] = parseBest(value);
  const run = raw?.version === 1 ? parseRun(raw.run) : undefined;
  return { version: 1, ...(isChoice(raw?.choice) ? { choice: raw.choice } : {}), best, ...(run ? { run } : {}) };
}

/** Saves the run in progress (or clears it with null), keeping the bests and the choice as they are. */
export function saveRun(store: Store | null, run: Run | null): void {
  const saved = readSaved(store);
  delete saved.run;
  write(store, { ...saved, ...(run ? { run } : {}) });
}

/** Remembers the pill last chosen, so the start screen opens on it next time. */
export function saveChoice(store: Store | null, choice: Choice): void {
  write(store, { ...readSaved(store), choice });
}

/** Keeps the higher of the saved best and this score for the choice and mode; returns all the bests now held. */
export function saveBest(store: Store | null, choice: Choice, mode: Mode, score: number): Bests {
  const saved = readSaved(store);
  const now = bestOf(saved.best, choice);
  const best = { ...saved.best, [choice]: { ...now, [mode]: Math.max(now[mode], score) } };
  write(store, { ...saved, best });
  return best;
}
