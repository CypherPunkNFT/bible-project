// The Daily Five's mixing rules (design §7), in one place: the build script (scripts/build-map-quest-daily.ts) writes
// daily.json with them, and the game uses the same functions past the end of that file, so the two can never disagree.
// Only one import, with its extension, so Node can load this file as it is (--experimental-strip-types).
import { haversineKm } from "./geo.ts";

export type Tier = 1 | 2 | 3;
export type Scope = "holy" | "wider";
export interface DailyPlace { id: string; lon: number; lat: number; tier: Tier; scope: Scope }

/** Which tiers each of the five slots draws from, easy to hard: slot 5 is Expert only, so it is never Jerusalem. */
export const SLOT_TIERS: readonly (readonly Tier[])[] = [[1], [1, 2], [2], [2], [3]];
/** A place does not come back within this many days (review change: 30 for Beginner and Standard, 90 for Expert). */
export const REPEAT_DAYS: Record<Tier, number> = { 1: 30, 2: 30, 3: 90 };
/** No two places of a day closer than this. */
export const MIN_APART_KM = 15;
/** How many earlier days the rules look back over: the longest no-repeat window. */
export const HISTORY_DAYS = 90;
/** Whole-day retries with a new seed before a day counts as impossible, and candidates tried per slot. */
const DAY_ATTEMPTS = 25;
const BRANCH = 6;

/** The schedule file: puzzle #1 is `epoch` (a local calendar date), `days[n - 1]` is puzzle n. */
export interface DailySchedule { epoch: string; frozenThrough: number; days: string[][] }

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

/** The places the Daily Five draws from, in a fixed order (by id), whatever order the file lists them in. */
export function eligiblePool(places: readonly DailyPlace[]): DailyPlace[] {
  return places.map(({ id, lon, lat, tier, scope }) => ({ id, lon, lat, tier, scope })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** For each place in the history, how many days ago it was last used (1 = the day before). */
function daysAgo(history: readonly (readonly string[])[]): Map<string, number> {
  const ago = new Map<string, number>();
  history.forEach((day, index) => { for (const id of day) ago.set(id, history.length - index); });
  return ago;
}

// Distances are compared against 15 km; a pair within a hair of it could round differently between engines, which
// only matters for the fallback past the file and is vanishingly rare with real places.
const farEnough = (place: DailyPlace, chosen: readonly DailyPlace[]) =>
  chosen.every((other) => haversineKm([place.lon, place.lat], [other.lon, other.lat]) >= MIN_APART_KM);

/**
 * Five place ids for one day, or null when no day fits the rules. Candidates are ordered at random by the seed,
 * places unused for longest more likely first (so none is starved), and searched with backtracking.
 */
export function pickDay(pool: readonly DailyPlace[], history: readonly (readonly string[])[], seed: number): string[] | null {
  const ago = daysAgo(history.slice(-HISTORY_DAYS));
  const free = pool.filter((place) => (ago.get(place.id) ?? Infinity) > REPEAT_DAYS[place.tier]);
  for (let attempt = 0; attempt < DAY_ATTEMPTS; attempt++) {
    const random = mulberry32(seed * 1000 + attempt);
    const key = new Map(free.map((place) => [place.id, random() / Math.min(ago.get(place.id) ?? Infinity, 3 * REPEAT_DAYS[place.tier])]));
    const ranked = [...free].sort((a, b) => key.get(a.id)! - key.get(b.id)!);
    const freeCount = (tier: Tier) => ranked.filter((place) => place.tier === tier).length;
    const chosen: DailyPlace[] = [];
    const search = (slot: number): boolean => {
      if (slot === SLOT_TIERS.length) return chosen.some((p) => p.scope === "holy") && chosen.some((p) => p.scope === "wider");
      // A slot open to two tiers tries the tier with more places free first.
      const tiers = [...SLOT_TIERS[slot]].sort((a, b) => freeCount(b) - freeCount(a));
      const last = slot === SLOT_TIERS.length - 1;
      const needed: Scope | null = !last ? null : !chosen.some((p) => p.scope === "holy") ? "holy" : !chosen.some((p) => p.scope === "wider") ? "wider" : null;
      let tried = 0;
      for (const tier of tiers) {
        for (const place of ranked) {
          if (place.tier !== tier || chosen.includes(place) || (needed && place.scope !== needed) || !farEnough(place, chosen)) continue;
          if (++tried > BRANCH * tiers.length) return false;
          chosen.push(place);
          if (search(slot + 1)) return true;
          chosen.pop();
        }
      }
      return false;
    };
    if (search(0)) return chosen.map((place) => place.id);
  }
  return null;
}

/** Every rule a day breaks (empty when it keeps them all): checked by the tests over the whole schedule. */
export function checkDay(day: readonly string[], byId: ReadonlyMap<string, DailyPlace>, history: readonly (readonly string[])[]): string[] {
  const problems: string[] = [];
  if (day.length !== SLOT_TIERS.length || new Set(day).size !== day.length) problems.push(`expected ${SLOT_TIERS.length} different places, got ${day.join(", ")}`);
  const places = day.map((id) => byId.get(id));
  if (places.some((place) => !place)) return [...problems, `unknown place in ${day.join(", ")}`];
  const known = places as DailyPlace[];
  known.forEach((place, slot) => { if (!SLOT_TIERS[slot]?.includes(place.tier)) problems.push(`slot ${slot + 1}: ${place.id} is tier ${place.tier}`); });
  known.forEach((place, i) => known.slice(i + 1).forEach((other) => {
    if (!farEnough(place, [other])) problems.push(`${place.id} and ${other.id} are closer than ${MIN_APART_KM} km`);
  }));
  if (!known.some((p) => p.scope === "holy") || !known.some((p) => p.scope === "wider")) problems.push("needs a Holy Land place and a wider-world place");
  const ago = daysAgo(history.slice(-HISTORY_DAYS));
  for (const place of known) {
    const last = ago.get(place.id);
    if (last !== undefined && last <= REPEAT_DAYS[place.tier]) problems.push(`${place.id} repeats after ${last} days (tier ${place.tier} waits ${REPEAT_DAYS[place.tier]})`);
  }
  return problems;
}

/** Puzzle `index + 1` from the days before it (the seed is the puzzle number), or null when no day fits. */
export const nextDay = (pool: readonly DailyPlace[], days: readonly (readonly string[])[], index: number): string[] | null =>
  pickDay(pool, days.slice(Math.max(0, index - HISTORY_DAYS), index), index + 1);
