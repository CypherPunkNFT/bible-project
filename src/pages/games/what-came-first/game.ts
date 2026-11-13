// What came first?: the run (a plain object, so it can be saved and resumed) and dealing (design §6). Who's older?'s
// rules, generalised: Streak ends at the first miss, Relaxed has three hearts; the ramp; no pair twice in a run; an item
// not dealt again within eight rounds unless it stays; "one stays" inside one category, with the left card the answer
// about half the time; an item first or last in every one of its pairs never stays. Bible Firsts deals each question
// once, its answers in an order drawn from the seed, and a run that has asked them all ends complete. Mixed draws each
// round's category from the seed: never the same one three rounds running, Bible Firsts never twice running, and no one
// stays. Everything random comes from the seed kept in the run, so a reload deals exactly the same.
import { random } from "../whos-older/game";
import { BANDS, type Band } from "./bands";
import { CATEGORY_KEYS, type Choice } from "./categories";
import { pairKey, type CategoryKey, type PairCategory } from "./order";
import type { FirstsPool, FirstsQuestion, PairPool, PoolPair, Pools } from "./pool";

export { random };
export type Mode = "streak" | "relaxed";
export type Difficulty = Band | "mixed";
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard", "mixed"];
export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" };
export const HEARTS = 3;
/** An item is not dealt again within this many rounds of its category, unless it is the one who stays. */
export const ITEM_GAP = 8;
/** After this many rounds the same pair may come back, if it was not among the last PAIR_MEMORY. */
export const PAIR_RELAX_AFTER = 400;
export const PAIR_MEMORY = 200;
export const MILESTONES: Record<number, string> = {
  5: "5 in a row — a good start!", 10: "10 in a row — you know your Bible!", 15: "15 in a row — that's a strong streak.",
  25: "25 in a row — remarkable!", 50: "50 in a row — a true chronologist!",
};

/** A round of two cards: the ids as shown, and the player's pick (null until answered). */
export interface PairRound { category: PairCategory; left: string; right: string; pick: string | null }
/** A Bible Firsts round: the question, the order its answers were shown in (indexes into [answer, ...options]), and the
 *  pick as an index into that same list, so 0 is the right answer and a language change cannot break a saved run. */
export interface ChoiceRound { category: "firsts"; question: string; order: number[]; pick: number | null }
export type Round = PairRound | ChoiceRound;

export interface Run {
  choice: Choice;
  mode: Mode;
  difficulty: Difficulty;
  /** The random generator's state after the last deal. */
  seed: number;
  rounds: Round[];
  hearts: number;
  /** True once the player has moved past the reveal of the miss that ended the run, or every question was asked. */
  over: boolean;
  /** Each category's data stamp when its rounds were dealt: a saved run resumes only if all still match. */
  stamps: Partial<Record<CategoryKey, string>>;
}

class Rng {
  constructor(public seed: number) {}
  next(): number { const [value, seed] = random(this.seed); this.seed = seed; return value; }
}

export const isPairRound = (round: Round): round is PairRound => round.category !== "firsts";
export const pairOf = (pools: Pools, round: Round): PoolPair | undefined =>
  isPairRound(round) ? pools[round.category]?.byKey.get(pairKey(round.left, round.right)) : undefined;
export const questionOf = (pools: Pools, round: Round): FirstsQuestion | undefined =>
  isPairRound(round) ? undefined : pools.firsts?.byId.get(round.question);
/** A question's answers in [answer, ...options] order. */
export const answersOf = (question: FirstsQuestion) => [question.answer, ...question.options];

export function isRight(pools: Pools, round: Round): boolean {
  if (round.pick === null) return false;
  return isPairRound(round) ? round.pick === pairOf(pools, round)?.first.id : round.pick === 0;
}
export const current = (run: Run): Round => run.rounds[run.rounds.length - 1];
export const score = (pools: Pools, run: Run) => run.rounds.filter((r) => isRight(pools, r)).length;

/** Right answers in a row up to now. */
export function streakNow(pools: Pools, run: Run): number {
  let n = 0;
  for (let i = run.rounds.length - 1; i >= 0 && isRight(pools, run.rounds[i]); i--) n++;
  return n;
}

/** The band for round n (1-based): Streak and Mixed difficulty follow the ramp; Relaxed otherwise keeps its choice. */
export function bandFor(mode: Mode, difficulty: Difficulty, n: number, roll: number): Band {
  if (mode === "relaxed" && difficulty !== "mixed") return difficulty;
  if (n <= 5) return "easy";
  if (n <= 15) return roll < 0.5 ? "easy" : "medium";
  return roll < 0.4 ? "hard" : "medium";
}

const lowerBands = (band: Band): Band[] => BANDS.slice(0, BANDS.indexOf(band) + 1).reverse();

function pickWeighted<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T {
  const weights = items.map(weight);
  let roll = rng.next() * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < items.length; i++) if ((roll -= weights[i]) < 0) return items[i];
  return items[items.length - 1];
}

interface DealContext { used: Set<string>; recent: Set<string>; seen: Map<string, number> }

function context(rounds: readonly PairRound[], strict: boolean): DealContext {
  const memory = rounds.length >= PAIR_RELAX_AFTER ? rounds.slice(-PAIR_MEMORY) : rounds;
  const seen = new Map<string, number>();
  for (const r of rounds) for (const id of [r.left, r.right]) seen.set(id, (seen.get(id) ?? 0) + 1);
  return { used: new Set(memory.map((r) => pairKey(r.left, r.right))), recent: new Set(strict ? rounds.slice(-ITEM_GAP).flatMap((r) => [r.left, r.right]) : []), seen };
}

const other = (pair: PoolPair, id: string) => (pair.first.id === id ? pair.second.id : pair.first.id);

/** A challenger for the item that stays, or null when none is left in this band or below. */
function challenger(pool: PairPool, stayer: string, band: Band, ctx: DealContext, rng: Rng): PairRound | null {
  const preferAfter = rng.next() < 0.5; // the stayer (left) is the answer when the challenger came after
  for (const b of lowerBands(band)) {
    const open = pool.partners.get(stayer)![b].filter((p) => !ctx.used.has(pairKey(p.first.id, p.second.id)) && !ctx.recent.has(other(p, stayer)));
    const after = open.filter((p) => p.first.id === stayer);
    const before = open.filter((p) => p.second.id === stayer);
    const group = (preferAfter ? after : before).length ? (preferAfter ? after : before) : preferAfter ? before : after;
    if (!group.length) continue;
    const pair = pickWeighted(group, (p) => 1 / (1 + (ctx.seen.get(other(p, stayer)) ?? 0)), rng);
    return { category: pool.key, left: stayer, right: other(pair, stayer), pick: null };
  }
  return null;
}

/** A fresh pair of two items not seen lately, on random sides. */
function freshPair(pool: PairPool, band: Band, ctx: DealContext, rng: Rng): PairRound | null {
  for (const b of lowerBands(band)) {
    const open = pool.byBand[b].filter((p) => !ctx.used.has(pairKey(p.first.id, p.second.id)) && !ctx.recent.has(p.first.id) && !ctx.recent.has(p.second.id));
    if (!open.length) continue;
    const pair = pickWeighted(open, (p) => 1 / (1 + (ctx.seen.get(p.first.id) ?? 0) + (ctx.seen.get(p.second.id) ?? 0)), rng);
    const [left, right] = rng.next() < 0.5 ? [pair.first.id, pair.second.id] : [pair.second.id, pair.first.id];
    return { category: pool.key, left, right, pick: null };
  }
  return null;
}

/** The right-hand item stays; when it is a giveaway, the left-hand one stays instead, unless it already stayed. */
export function whoStays(pool: PairPool, rounds: readonly PairRound[]): string | null {
  const last = rounds[rounds.length - 1];
  if (!last) return null;
  if (!pool.giveaways.has(last.right)) return last.right;
  const before = rounds[rounds.length - 2];
  const leftStayed = !!before && (last.left === before.right || last.left === before.left);
  return leftStayed || pool.giveaways.has(last.left) ? null : last.left;
}

function dealPair(pool: PairPool, run: Run, band: Band, rng: Rng): PairRound {
  const rounds = run.rounds.filter((r): r is PairRound => r.category === pool.key);
  const last = run.rounds[run.rounds.length - 1];
  const stays = run.choice !== "mixed" && last && last.category === pool.key;
  for (const strict of [true, false]) { // if a small pool runs dry, the eight-round item gap gives way first
    const ctx = context(rounds, strict);
    const stayer = stays ? whoStays(pool, rounds) : null;
    const round = (stayer && challenger(pool, stayer, band, ctx, rng)) || freshPair(pool, band, ctx, rng);
    if (round) return round;
  }
  // Every pair has been used: allow repeats rather than stop.
  const pair = pool.byBand[band][Math.floor(rng.next() * pool.byBand[band].length)] ?? pool.pairs[0];
  return { category: pool.key, left: pair.second.id, right: pair.first.id, pick: null };
}

const askedQuestions = (run: Run) => new Set(run.rounds.flatMap((r) => (isPairRound(r) ? [] : [r.question])));

/** A question not yet asked in this run: its band first, then easier ones, then harder ones; null when all are asked. */
function dealQuestion(pool: FirstsPool, run: Run, band: Band, rng: Rng): ChoiceRound | null {
  const asked = askedQuestions(run);
  const order = [...lowerBands(band), ...BANDS.slice(BANDS.indexOf(band) + 1)];
  for (const b of order) {
    const open = pool.byBand[b].filter((q) => !asked.has(q.id));
    if (!open.length) continue;
    const question = open[Math.floor(rng.next() * open.length)];
    const shown = answersOf(question).map((_, i) => i);
    for (let i = shown.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [shown[i], shown[j]] = [shown[j], shown[i]]; }
    return { category: "firsts", question: question.id, order: shown, pick: null };
  }
  return null;
}

/** Whether a category still has something to deal in this run (pair categories may repeat once used up). */
const hasLeft = (pools: Pools, run: Run, key: CategoryKey) =>
  key === "firsts" ? !!pools.firsts && pools.firsts.questions.some((q) => !askedQuestions(run).has(q.id)) : !!pools[key]?.pairs.length;

/** Mixed: the next round's category, evenly among those left, never three running, Bible Firsts never twice running. */
export function drawCategory(pools: Pools, run: Run, roll: number): CategoryKey | null {
  const open = CATEGORY_KEYS.filter((key) => hasLeft(pools, run, key));
  const [before, last] = run.rounds.slice(-2).map((r) => r.category);
  const allowed = open.filter((key) => !(key === last && key === before && run.rounds.length >= 2) && !(key === "firsts" && last === "firsts"));
  const from = allowed.length ? allowed : open;
  return from.length ? from[Math.floor(roll * from.length)] : null;
}

/** The next round, or null when there is nothing left to deal (Bible Firsts has asked every question). */
function deal(pools: Pools, run: Run): Run | null {
  const rng = new Rng(run.seed);
  const n = run.rounds.length + 1;
  const band = bandFor(run.mode, run.difficulty, n, rng.next());
  const key = run.choice === "mixed" ? drawCategory(pools, run, rng.next()) : run.choice;
  if (!key) return null;
  let round: Round | null;
  if (key === "firsts") round = pools.firsts ? dealQuestion(pools.firsts, run, band, rng) : null;
  else round = pools[key] ? dealPair(pools[key]!, run, band, rng) : null;
  if (!round) return null;
  const stamp = key === "firsts" ? pools.firsts!.stamp : pools[key]!.stamp;
  return { ...run, seed: rng.seed, rounds: [...run.rounds, round], stamps: { ...run.stamps, [key]: stamp } };
}

export function newRun(pools: Pools, choice: Choice, mode: Mode, difficulty: Difficulty, seed: number): Run | null {
  return deal(pools, { choice, mode, difficulty: mode === "streak" ? "mixed" : difficulty, seed: seed | 0, rounds: [], hearts: HEARTS, over: false, stamps: {} });
}

/** Locks in the first answer for the current round; a second tap, or a tap after the run is over, changes nothing. */
export function answer(pools: Pools, run: Run, pick: string | number): Run {
  const round = current(run);
  if (run.over || round.pick !== null) return run;
  let answered: Round;
  if (isPairRound(round)) {
    if (pick !== round.left && pick !== round.right) return run;
    answered = { ...round, pick: pick as string };
  } else {
    if (typeof pick !== "number" || !round.order.includes(pick)) return run;
    answered = { ...round, pick };
  }
  const hearts = run.mode === "relaxed" && !isRight(pools, answered) ? run.hearts - 1 : run.hearts;
  return { ...run, hearts, rounds: [...run.rounds.slice(0, -1), answered] };
}

/** True when the answered round has ended the run: a miss in Streak, the last heart in Relaxed. */
export function endsRun(pools: Pools, run: Run): boolean {
  const round = current(run);
  if (round.pick === null) return false;
  return run.mode === "streak" ? !isRight(pools, round) : run.hearts <= 0;
}

/** True when the answered round is the last there is: Bible Firsts alone, with every question asked. */
export const askedAll = (pools: Pools, run: Run) => run.choice === "firsts" && !!pools.firsts && askedQuestions(run).size >= pools.firsts.questions.length;

/** After the reveal: the next round, or the run-over screen. */
export function next(pools: Pools, run: Run): Run {
  if (run.over || current(run).pick === null) return run;
  if (endsRun(pools, run)) return { ...run, over: true };
  return deal(pools, run) ?? { ...run, over: true };
}

/** The rounds answered wrongly, for the run-over recap. */
export const missedRounds = (pools: Pools, run: Run) => run.rounds.filter((r) => r.pick !== null && !isRight(pools, r));

/** The categories a choice deals from. */
export const categoriesOf = (choice: Choice): CategoryKey[] => (choice === "mixed" ? [...CATEGORY_KEYS] : [choice]);
