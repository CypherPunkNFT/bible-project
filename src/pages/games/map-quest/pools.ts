// Which places a practice game can ask (design §5): a level decides how well-known they are, an era which part of the
// story. The places come from src/data/map-quest/places.json, built by scripts/build-map-quest.py.
import type { DailyPlace } from "./daily-rules";
import { haversineKm, type LonLat } from "./geo";

export type Era = "all" | "abraham" | "exodus" | "kingdoms" | "jesus" | "paul";
export type Level = "beginner" | "standard" | "expert";

export interface QuestPlace extends DailyPlace {
  name: string;
  /** Other credible sites, scored against too (the nearest counts). */
  alts: [number, number][];
  eras: Exclude<Era, "all">[];
  verseCount: number;
  /** The verse shown on the reveal card (a BBCCCVVV id). */
  verse: number;
  /** The atlas has this place, so "Open in atlas" can link to it. */
  atlas: boolean;
}

export interface DisputedSite { name: string; lon: number; lat: number }
export interface DisputedPlace { id: string; name: string; sites: DisputedSite[]; note: string; verse: number; verseCount: number; source: string }

export const LEVELS: readonly Level[] = ["beginner", "standard", "expert"];
export const ERAS: readonly Era[] = ["all", "abraham", "exodus", "kingdoms", "jesus", "paul"];
const LEVEL_TIER: Record<Level, number> = { beginner: 1, standard: 2, expert: 3 };

/** Opening view per era (west, south, east, north): frames the whole area, so opening the map gives nothing away. */
export const ERA_VIEWS: Record<Era, [number, number, number, number]> = {
  all: [10, 24, 50, 42],
  abraham: [28, 24, 50, 39],
  exodus: [30, 26, 38, 34],
  kingdoms: [31, 28, 46, 37],
  jesus: [34, 30.5, 36.5, 33.5],
  paul: [11, 30, 37, 42],
};

export const ROUND_LENGTH = 5;
/** An era and level with fewer places than this widens to the next level. */
export const MIN_POOL = 15;
const MIN_APART_KM = 15;

/** Every site a pin can be scored against: the place itself and its credible alternatives. */
export const sitesOf = (place: QuestPlace): LonLat[] => [[place.lon, place.lat], ...place.alts];

/** The places a level and era can ask, widened a level at a time while there are too few (Expert is never widened). */
export function practicePool(places: readonly QuestPlace[], level: Level, era: Era): { pool: QuestPlace[]; level: Level } {
  for (let index = LEVELS.indexOf(level); index < LEVELS.length; index++) {
    const current = LEVELS[index];
    const pool = places.filter((place) => place.tier <= LEVEL_TIER[current] && (era === "all" || place.eras.includes(era)));
    if (pool.length >= MIN_POOL || current === "expert") return { pool, level: current };
  }
  return { pool: [...places], level: "expert" };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Five different places, none within 15 km of another. Should the pool be too tight for that, the distance rule gives way. */
export function pickRound<T extends { id: string; lon: number; lat: number }>(pool: readonly T[], random: () => number = Math.random, count = ROUND_LENGTH): T[] {
  const order = shuffled(pool, random);
  const chosen: T[] = [];
  for (const place of order) {
    if (chosen.length === count) break;
    if (chosen.every((other) => haversineKm([place.lon, place.lat], [other.lon, other.lat]) >= MIN_APART_KM)) chosen.push(place);
  }
  for (const place of order) {
    if (chosen.length === count) break;
    if (!chosen.includes(place)) chosen.push(place);
  }
  return chosen;
}
