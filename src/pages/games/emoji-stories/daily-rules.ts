// The Daily schedule's rules (design §9), shared by scripts/build-emoji-stories.ts and the page, so a day past the end
// of daily.json is chosen exactly as the build would have chosen it. Plain Node can load this file: relative imports
// with their .ts extension, types only.
import type { Story, Tier } from "./types.ts";

export const REPEAT_DAYS = 300;
/** At least this many stories are always free to choose from, however small the pool. */
export const MIN_FREE = 30;
const WEEK = 7;

export type DailyStory = Pick<Story, "id" | "tier" | "testament" | "retired">;

/** The rules that may give way, in the order they give way. The Sunday rule never does. */
export const RELAX_ORDER = ["testament", "week", "gap"] as const;
export type Rule = "sunday" | (typeof RELAX_ORDER)[number];

/** A small seeded random number generator (as Bible Wordle uses), so the same inputs always give the same schedule. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hashText(text: string): number {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Active stories in id order, the order every pick is made from. */
export function dailyPool(stories: readonly DailyStory[]): DailyStory[] {
  return stories.filter((story) => !story.retired).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** No story again within this many days: 300, or the pool less 30 when the pool is small. */
export const repeatGap = (poolSize: number): number => Math.max(0, Math.min(REPEAT_DAYS, poolSize - MIN_FREE));

/** Whether day `index` (0 = puzzle #1) falls on a Sunday, counted on the calendar from the epoch, never the clock. */
export function isSunday(epoch: string, index: number): boolean {
  const [year, month, day] = epoch.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + index)).getUTCDay() === 0;
}

export interface Rules {
  epoch: string;
  byId: ReadonlyMap<string, DailyStory>;
  gap: number;
}

export function rulesFor(pool: readonly DailyStory[], epoch: string, everyStory: readonly DailyStory[] = pool): Rules {
  return { epoch, byId: new Map(everyStory.map((story) => [story.id, story])), gap: repeatGap(pool.length) };
}

/** The rules a story would break as day `index`, given the days before it. */
export function brokenRules(rules: Rules, days: readonly string[], index: number, candidate: DailyStory): Rule[] {
  const broken: Rule[] = [];
  if (isSunday(rules.epoch, index) && candidate.tier !== 1) broken.push("sunday");
  const before = (count: number) => days.slice(Math.max(0, index - count), index).map((id) => rules.byId.get(id));
  const lastThree = before(3);
  if (lastThree.length === 3 && lastThree.every((story) => story?.testament === candidate.testament)) broken.push("testament");
  const week = [...before(WEEK - 1), candidate];
  const count = (tier: Tier) => week.filter((story) => story?.tier === tier).length;
  if (count(3) > 1 || (week.length === WEEK && count(1) < 3)) broken.push("week");
  if (rules.gap > 0 && days.slice(Math.max(0, index - rules.gap), index).includes(candidate.id)) broken.push("gap");
  return broken;
}

/** The stories allowed as day `index` when the first `relaxed` rules of RELAX_ORDER have given way. */
export function candidates(rules: Rules, pool: readonly DailyStory[], days: readonly string[], index: number, relaxed: number): DailyStory[] {
  const waived = new Set<Rule>(RELAX_ORDER.slice(0, relaxed));
  return pool.filter((story) => brokenRules(rules, days, index, story).every((rule) => waived.has(rule)));
}

export interface DayPick {
  id: string;
  /** How many rules had to give way (0 = none). */
  relaxed: number;
}

/** Day `index`'s story: a seeded pick among those that keep every rule, else the rules give way in RELAX_ORDER. */
export function nextDay(rules: Rules, pool: readonly DailyStory[], days: readonly string[], index: number): DayPick {
  for (let relaxed = 0; relaxed <= RELAX_ORDER.length; relaxed++) {
    const allowed = candidates(rules, pool, days, index, relaxed);
    if (!allowed.length) continue;
    if (relaxed === RELAX_ORDER.length) {
      // Even the repeat gap gave way: take the story shown longest ago, so the repeat is as far back as it can be.
      const lastSeen = (id: string) => days.lastIndexOf(id, index - 1);
      const oldest = allowed.reduce((best, story) => (lastSeen(story.id) < lastSeen(best.id) ? story : best));
      return { id: oldest.id, relaxed };
    }
    const random = mulberry32(hashText(rules.epoch) ^ Math.imul(index + 1, 0x9e3779b1));
    return { id: allowed[Math.floor(random() * allowed.length)].id, relaxed };
  }
  throw new Error(`emoji stories: no story can be puzzle #${index + 1}; the pool needs at least one tier 1 story for Sundays`);
}

/** Grows `days` to `length` with nextDay, returning the puzzle numbers where a rule gave way. */
export function extendDays(rules: Rules, pool: readonly DailyStory[], days: string[], length: number): { day: number; relaxed: number }[] {
  const gaveWay: { day: number; relaxed: number }[] = [];
  for (let index = days.length; index < length; index++) {
    const pick = nextDay(rules, pool, days, index);
    days.push(pick.id);
    if (pick.relaxed) gaveWay.push({ day: index + 1, relaxed: pick.relaxed });
  }
  return gaveWay;
}
