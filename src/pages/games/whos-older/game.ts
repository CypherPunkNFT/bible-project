// Who's older?: the pool, the run (a plain object, so it can be saved and resumed) and dealing (design §6).
// Streak ends at the first miss; Relaxed has three hearts. "One stays": the right-hand person moves left and a new
// challenger arrives, chosen so the left card is the answer about half the time. Everything random comes from a
// seed kept in the run, so a reload deals exactly the same.
import { BANDS, allPairs, buildIndex, pairKey, type Band, type Fact, type Order, type Person, type Span, type Tier } from "./pairing";

export interface Character extends Person { tag: string; when: string; brief: string; href: string; tier: Tier }
export interface DataFact extends Fact { quote?: string }
export interface WhosOlderData {
  stamp: string;
  sources: string;
  books: Record<string, [string, string]>;
  characters: Character[];
  facts: DataFact[];
  blocked: [string, string][];
}

export type Mode = "streak" | "relaxed";
export type Difficulty = Band | "mixed";
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard", "mixed"];
export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" };
export const HEARTS = 3;
/** A person is not dealt again within this many rounds, unless they are the one who stays. */
export const PERSON_GAP = 8;
/** After this many rounds the same pair may come back, if it was not among the last PAIR_MEMORY. */
export const PAIR_RELAX_AFTER = 400;
export const PAIR_MEMORY = 200;
export const MILESTONES: Record<number, string> = {
  5: "5 in a row — a good start!", 10: "10 in a row — you know your kings!", 15: "15 in a row — that's a strong streak.",
  25: "25 in a row — remarkable!", 50: "50 in a row — a true chronologist!",
};

export type PoolPair = Order<Character> & { band: Band };

export interface Pool {
  data: WhosOlderData;
  byId: Map<string, Character>;
  pairs: PoolPair[];
  byKey: Map<string, PoolPair>;
  byBand: Record<Band, PoolPair[]>;
  /** Each person's partners, by band. */
  partners: Map<string, Record<Band, PoolPair[]>>;
}

export function buildPool(data: WhosOlderData): Pool {
  const pairs = allPairs(data.characters, buildIndex(data.facts, data.blocked));
  const byBand = { easy: [], medium: [], hard: [] } as Record<Band, PoolPair[]>;
  const partners = new Map<string, Record<Band, PoolPair[]>>(data.characters.map((c) => [c.id, { easy: [], medium: [], hard: [] }]));
  for (const pair of pairs) {
    byBand[pair.band].push(pair);
    partners.get(pair.first.id)![pair.band].push(pair);
    partners.get(pair.second.id)![pair.band].push(pair);
  }
  return { data, byId: new Map(data.characters.map((c) => [c.id, c])), pairs, byKey: new Map(pairs.map((p) => [pairKey(p.first.id, p.second.id), p])), byBand, partners };
}

/** One round: the two cards as shown, and the player's pick (null until answered). */
export interface Round { left: string; right: string; pick: string | null }

export interface Run {
  stamp: string;
  mode: Mode;
  difficulty: Difficulty;
  /** The random generator's state after the last deal. */
  seed: number;
  rounds: Round[];
  hearts: number;
  /** True once the player has moved past the reveal of the miss that ended the run. */
  over: boolean;
}

/** mulberry32: a small seeded generator. Returns a number in [0, 1) and the next state. */
export function random(seed: number): [number, number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

class Rng {
  constructor(public seed: number) {}
  next(): number { const [value, seed] = random(this.seed); this.seed = seed; return value; }
}

export const pairOf = (pool: Pool, round: Pick<Round, "left" | "right">) => pool.byKey.get(pairKey(round.left, round.right));
export const isRight = (pool: Pool, round: Round) => round.pick !== null && round.pick === pairOf(pool, round)?.first.id;
export const current = (run: Run): Round => run.rounds[run.rounds.length - 1];
export const score = (pool: Pool, run: Run) => run.rounds.filter((r) => isRight(pool, r)).length;

/** Right answers in a row up to now. */
export function streakNow(pool: Pool, run: Run): number {
  let n = 0;
  for (let i = run.rounds.length - 1; i >= 0 && isRight(pool, run.rounds[i]); i--) n++;
  return n;
}

/** The band for round n (1-based): Streak and Mixed follow the ramp (§6.3); Relaxed otherwise keeps its choice. */
export function bandFor(mode: Mode, difficulty: Difficulty, n: number, roll: number): Band {
  if (mode === "relaxed" && difficulty !== "mixed") return difficulty;
  if (n <= 5) return "easy";
  if (n <= 15) return roll < 0.5 ? "easy" : "medium";
  return roll < 0.4 ? "hard" : "medium";
}

const lowerBands = (band: Band): Band[] => BANDS.slice(0, BANDS.indexOf(band) + 1).reverse();

/** Weighted towards people seen least in this run (§6.3). */
function pickWeighted<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T {
  const weights = items.map(weight);
  let roll = rng.next() * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < items.length; i++) if ((roll -= weights[i]) < 0) return items[i];
  return items[items.length - 1];
}

interface DealContext { used: Set<string>; recent: Set<string>; seen: Map<string, number> }

function context(rounds: readonly Round[], strict: boolean): DealContext {
  const memory = rounds.length >= PAIR_RELAX_AFTER ? rounds.slice(-PAIR_MEMORY) : rounds;
  const seen = new Map<string, number>();
  for (const r of rounds) for (const id of [r.left, r.right]) seen.set(id, (seen.get(id) ?? 0) + 1);
  return {
    used: new Set(memory.map((r) => pairKey(r.left, r.right))),
    recent: new Set(strict ? rounds.slice(-PERSON_GAP).flatMap((r) => [r.left, r.right]) : []),
    seen,
  };
}

/** A challenger for the person who stays, or null when none is left in this band or below. */
function challenger(pool: Pool, stayer: string, band: Band, ctx: DealContext, rng: Rng): Round | null {
  const preferAfter = rng.next() < 0.5; // the stayer (left) is the answer when the challenger came after
  for (const b of lowerBands(band)) {
    const open = pool.partners.get(stayer)![b].filter((p) => {
      const other = p.first.id === stayer ? p.second.id : p.first.id;
      return !ctx.used.has(pairKey(p.first.id, p.second.id)) && !ctx.recent.has(other);
    });
    const after = open.filter((p) => p.first.id === stayer);
    const before = open.filter((p) => p.second.id === stayer);
    const group = (preferAfter ? after : before).length ? (preferAfter ? after : before) : preferAfter ? before : after;
    if (!group.length) continue;
    const pair = pickWeighted(group, (p) => 1 / (1 + (ctx.seen.get(p.first.id === stayer ? p.second.id : p.first.id) ?? 0)), rng);
    return { left: stayer, right: pair.first.id === stayer ? pair.second.id : pair.first.id, pick: null };
  }
  return null;
}

/** A fresh pair of two people not seen lately, on random sides. */
function freshPair(pool: Pool, band: Band, ctx: DealContext, rng: Rng): Round | null {
  for (const b of lowerBands(band)) {
    const open = pool.byBand[b].filter((p) => !ctx.used.has(pairKey(p.first.id, p.second.id)) && !ctx.recent.has(p.first.id) && !ctx.recent.has(p.second.id));
    if (!open.length) continue;
    const pair = pickWeighted(open, (p) => 1 / (1 + (ctx.seen.get(p.first.id) ?? 0) + (ctx.seen.get(p.second.id) ?? 0)), rng);
    return rng.next() < 0.5 ? { left: pair.first.id, right: pair.second.id, pick: null } : { left: pair.second.id, right: pair.first.id, pick: null };
  }
  return null;
}

function deal(pool: Pool, run: Run): Run {
  const rng = new Rng(run.seed);
  const n = run.rounds.length + 1;
  const band = bandFor(run.mode, run.difficulty, n, rng.next());
  const last = run.rounds[run.rounds.length - 1];
  let round: Round | null = null;
  for (const strict of [true, false]) { // if a small pool runs dry, the eight-round person gap gives way first
    const ctx = context(run.rounds, strict);
    round = (last && challenger(pool, last.right, band, ctx, rng)) || freshPair(pool, band, ctx, rng);
    if (round) break;
  }
  if (!round) { // every pair has been used: allow repeats rather than stop
    const pair = pool.byBand[band][Math.floor(rng.next() * pool.byBand[band].length)] ?? pool.pairs[0];
    round = { left: pair.second.id, right: pair.first.id, pick: null };
  }
  return { ...run, seed: rng.seed, rounds: [...run.rounds, round] };
}

export function newRun(pool: Pool, mode: Mode, difficulty: Difficulty, seed: number): Run {
  return deal(pool, { stamp: pool.data.stamp, mode, difficulty: mode === "streak" ? "mixed" : difficulty, seed: seed | 0, rounds: [], hearts: HEARTS, over: false });
}

/** Locks in the first answer for the current round; a second tap, or a tap after the run is over, changes nothing. */
export function answer(pool: Pool, run: Run, pick: string): Run {
  const round = current(run);
  if (run.over || round.pick !== null || (pick !== round.left && pick !== round.right)) return run;
  const answered = { ...round, pick };
  const hearts = run.mode === "relaxed" && !isRight(pool, answered) ? run.hearts - 1 : run.hearts;
  return { ...run, hearts, rounds: [...run.rounds.slice(0, -1), answered] };
}

/** True when the answered round has ended the run: a miss in Streak, the last heart in Relaxed. */
export function endsRun(pool: Pool, run: Run): boolean {
  const round = current(run);
  if (round.pick === null) return false;
  return run.mode === "streak" ? !isRight(pool, round) : run.hearts <= 0;
}

/** After the reveal: the next pair, or the run-over screen. */
export function next(pool: Pool, run: Run): Run {
  if (run.over || current(run).pick === null) return run;
  return endsRun(pool, run) ? { ...run, over: true } : deal(pool, run);
}

/** The run's result for the best score: Streak counts its streak, Relaxed its right answers. */
export const runScore = (pool: Pool, run: Run) => score(pool, run);

/** The pairs answered wrongly, for the run-over recap (§7.3). */
export const missedRounds = (pool: Pool, run: Run) => run.rounds.filter((r) => r.pick !== null && !isRight(pool, r));

export type { Band, Span };
