// Bible Wordle's schedule rules (design §6.2), in one place: the build script (scripts/build-wordle.ts) writes daily.json
// with them, and the game uses the same functions past the end of that file, so the two can never disagree.
// No imports, so Node can load this file as it is (--experimental-strip-types).

export type Category = "person" | "place" | "creature" | "object" | "idea" | "action";
export type Tier = 1 | 2 | 3;
/** One answer the schedule may choose (retired words are left out before this). */
export interface PoolWord { word: string; category: Category; tier: Tier }

/** A word comes back at the earliest this many days after it was last the answer. */
export const REPEAT_DAYS = 300;
/** The spacing windows: at most NAMES_PER_WEEK people or places, and at most one tier-3 word, in any WEEK days. */
export const WEEK = 7;
export const NAMES_PER_WEEK = 2;
/** How far back "unused for longest" looks when ranking (a word unused this long counts as never used). */
const AGE_CAP = 2 * REPEAT_DAYS;

/** The schedule file: puzzle #1 is `epoch` (a local calendar date) and `days[n - 1]` is puzzle n's word. */
export interface WordleSchedule { epoch: string; builtOn: string; frozenThrough: number; days: string[] }

export const isName = (word: PoolWord): boolean => word.category === "person" || word.category === "place";

/** A small seeded random generator (mulberry32): the same seed gives the same numbers in every browser. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The words a schedule draws from, in a fixed order (by word), whatever order the file lists them in. */
export function poolOf(words: readonly PoolWord[]): PoolWord[] {
  return words.map(({ word, category, tier }) => ({ word, category, tier })).sort((a, b) => (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
}

/**
 * The days decided so far (frozen days, pins and chosen days; a gap is undecided) and where each word falls, so the
 * rules can look both ways without scanning every day.
 */
export interface Plan { days: (string | undefined)[]; uses: Map<string, number[]> }

export function makePlan(days: readonly (string | undefined)[]): Plan {
  const plan: Plan = { days: [], uses: new Map() };
  days.forEach((word, index) => { if (word !== undefined) setDay(plan, index, word); });
  return plan;
}

export function setDay(plan: Plan, index: number, word: string): void {
  clearDay(plan, index);
  plan.days[index] = word;
  const list = plan.uses.get(word);
  if (list) list.push(index);
  else plan.uses.set(word, [index]);
}

export function clearDay(plan: Plan, index: number): void {
  const old = plan.days[index];
  if (old === undefined) return;
  plan.days[index] = undefined;
  const list = plan.uses.get(old)!.filter((at) => at !== index);
  if (list.length) plan.uses.set(old, list);
  else plan.uses.delete(old);
}

/** The rule `word` would break as the answer on day `index` (0 = puzzle #1), or null when it keeps them all. */
export function problemOn(plan: Plan, index: number, word: PoolWord, byWord: ReadonlyMap<string, PoolWord>): string | null {
  const near = (plan.uses.get(word.word) ?? []).find((at) => at !== index && Math.abs(at - index) < REPEAT_DAYS);
  if (near !== undefined) return `${word.word} is already the answer on puzzle #${near + 1}, closer than ${REPEAT_DAYS} days`;
  const at = (offset: number): PoolWord | undefined => {
    const other = plan.days[index + offset];
    return offset === 0 ? word : other === undefined ? undefined : byWord.get(other);
  };
  if (isName(word)) {
    for (const side of [-1, 1]) {
      const neighbour = at(side);
      if (neighbour && isName(neighbour)) return `${word.word} and ${neighbour.word} are people or places on consecutive days`;
    }
    for (let start = -(WEEK - 1); start <= 0; start++) {
      let names = 0;
      for (let offset = start; offset < start + WEEK; offset++) { const day = at(offset); if (day && isName(day)) names++; }
      if (names > NAMES_PER_WEEK) return `${word.word} makes ${names} people or places within ${WEEK} days`;
    }
  }
  if (word.tier === 3) {
    for (let offset = -(WEEK - 1); offset < WEEK; offset++) {
      const day = offset === 0 ? undefined : at(offset);
      if (day?.tier === 3) return `${word.word} and ${day.word} are both tier-3 words within ${WEEK} days`;
    }
  }
  return null;
}

/** Days since `word` was last the answer before day `index` (Infinity when never). */
function daysSinceUse(plan: Plan, word: string, index: number): number {
  let last = -Infinity;
  for (const at of plan.uses.get(word) ?? []) if (at < index && at > last) last = at;
  return index - last;
}

/**
 * Every word in the order day `index` tries them: shuffled by the seed (the puzzle number), with words unused for
 * longest more likely first, so none is starved. Each word draws one number in pool order, so the order is the same
 * in every browser.
 */
export function rankedFor(pool: readonly PoolWord[], plan: Plan, index: number): PoolWord[] {
  const random = mulberry32(index + 1);
  const key = new Map(pool.map((word) => [word.word, random() / Math.min(daysSinceUse(plan, word.word, index), AGE_CAP)]));
  return [...pool].sort((a, b) => key.get(a.word)! - key.get(b.word)!);
}

/** Day `index`'s word from the days around it: the first in ranked order that keeps every rule, or null if none does. */
export function nextDay(pool: readonly PoolWord[], plan: Plan, index: number, byWord: ReadonlyMap<string, PoolWord>): string | null {
  return rankedFor(pool, plan, index).find((word) => problemOn(plan, index, word, byWord) === null)?.word ?? null;
}

/**
 * Extends `plan` to `length` days with the same rule the browser uses past the end of daily.json: nextDay, or, if no
 * word fits (never with a sound pool), the file's own word from a year or so earlier, so the game never breaks.
 */
export function extendPlan(pool: readonly PoolWord[], plan: Plan, length: number, fileLength: number, byWord: ReadonlyMap<string, PoolWord>): void {
  for (let index = plan.days.length; index < length; index++) {
    const word = nextDay(pool, plan, index, byWord);
    if (word === null) console.warn(`bible wordle: no word fits every rule on puzzle #${index + 1}; reusing #${(index % fileLength) + 1}`);
    setDay(plan, index, word ?? plan.days[index % fileLength]!);
  }
}

/**
 * Fills the undecided days from `from` to `to` (pins and earlier days already set), each with the first ranked word
 * that keeps every rule against the days on both sides, going back a day to try its next word when one has none.
 * Returns the day it could not fill, or null when all are filled. Used by the build script.
 */
export function fillPlan(pool: readonly PoolWord[], plan: Plan, from: number, to: number, fixed: ReadonlySet<number>, byWord: ReadonlyMap<string, PoolWord>): number | null {
  const tries = new Map<number, { list: PoolWord[]; next: number }>();
  let backtracks = 0;
  let index = from;
  while (index < to) {
    if (fixed.has(index)) { index++; continue; }
    clearDay(plan, index);
    let state = tries.get(index);
    if (!state) { state = { list: rankedFor(pool, plan, index), next: 0 }; tries.set(index, state); }
    let placed = false;
    while (!placed && state.next < state.list.length) {
      const word = state.list[state.next++];
      if (problemOn(plan, index, word, byWord) === null) { setDay(plan, index, word.word); placed = true; }
    }
    if (placed) { index++; continue; }
    tries.delete(index);
    let back = index - 1;
    while (back >= from && fixed.has(back)) back--;
    if (back < from || ++backtracks > 10_000) return index;
    index = back;
  }
  return null;
}

/** Every rule the schedule breaks, day by day (empty when it keeps them all): checked by the build and the tests. */
export function scheduleProblems(days: readonly string[], byWord: ReadonlyMap<string, PoolWord>, from = 0): string[] {
  const plan = makePlan(days);
  const problems: string[] = [];
  for (let index = from; index < days.length; index++) {
    const word = byWord.get(days[index]);
    if (!word) { problems.push(`puzzle #${index + 1}: ${days[index]} is not an answer`); continue; }
    const problem = problemOn(plan, index, word, byWord);
    if (problem) problems.push(`puzzle #${index + 1}: ${problem}`);
  }
  return problems;
}

/** Easter Sunday of a year (the Gregorian computus), as YYYY-MM-DD. */
export function easterDate(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
