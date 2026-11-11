// One game of Map quest, whichever kind: the Daily Five, a practice round (level and era), or Disputed sites. The page
// turns a game into screens; everything that decides what is asked and how it scores lives here, where tests reach it.
import { DAILY, DISPUTED, PLACES, PLACE_BY_ID } from "./data";
import type { LonLat } from "./geo";
import { ERAS, LEVELS, pickRound, practicePool, sitesOf, type DisputedPlace, type Era, type Level, type QuestPlace } from "./pools";
import { nearestSite, scoreForDistance } from "./scoring";
import type { Pick } from "./storage";

export type Mode = "daily" | "practice" | "disputed";

export interface Question {
  id: string;
  name: string;
  sites: LonLat[];
  /** Disputed sites mode: each proposed site's name, in the order of `sites`. */
  siteNames?: string[];
  verse: number;
  verseCount: number;
  atlas: boolean;
  note?: string;
  source?: string;
}

export interface Result { question: Question; pin: LonLat; site: LonLat; km: number; points: number }

export interface Game {
  mode: Mode;
  /** Daily Five: the puzzle number. */
  n?: number;
  level: Level;
  era: Era;
  /** Set when the chosen level had too few places for the era and the game widened to this level. */
  widenedTo?: Level;
  questions: Question[];
}

export const questionFromPlace = (place: QuestPlace): Question => ({
  id: place.id, name: place.name, sites: sitesOf(place), verse: place.verse, verseCount: place.verseCount, atlas: place.atlas,
});

export const questionFromDisputed = (place: DisputedPlace): Question => ({
  id: place.id, name: place.name, sites: place.sites.map((site) => [site.lon, site.lat] as LonLat), siteNames: place.sites.map((site) => site.name),
  verse: place.verse, verseCount: place.verseCount, atlas: PLACE_BY_ID.get(place.id)?.atlas ?? false, note: place.note, source: place.source,
});

/** A pin scored against the nearest of the question's sites. */
export function scorePin(question: Question, pin: LonLat): Result {
  const { site, km } = nearestSite(pin, question.sites);
  return { question, pin, site, km, points: scoreForDistance(km) };
}

/** Puzzle n's game (null before puzzle #1). */
export function dailyGame(n: number): Game | null {
  const ids = DAILY.placesFor(n);
  if (!ids?.length) return null;
  return { mode: "daily", n, level: "expert", era: "all", questions: ids.map((id) => questionFromPlace(PLACE_BY_ID.get(id)!)) };
}

export function practiceGame(level: Level, era: Era, random: () => number = Math.random): Game {
  const { pool, level: used } = practicePool(PLACES, level, era);
  return { mode: "practice", level, era, widenedTo: used === level ? undefined : used, questions: pickRound(pool, random).map(questionFromPlace) };
}

export function disputedGame(random: () => number = Math.random): Game {
  const places = pickRound(DISPUTED.map((place) => ({ ...place, lon: place.sites[0].lon, lat: place.sites[0].lat })), random);
  return { mode: "disputed", level: "expert", era: "all", questions: places.map(questionFromDisputed) };
}

/** Today's confirmed pins as results, for resuming a Daily Five. */
export const resultsFromPicks = (game: Game, picks: readonly Pick[]): Result[] =>
  picks.slice(0, game.questions.length).map((pick, index) => scorePin(game.questions[index], [pick.lon, pick.lat]));

export const pickFromResult = (result: Result): Pick => ({
  id: result.question.id, lon: result.pin[0], lat: result.pin[1], km: Math.round(result.km * 10) / 10, points: result.points,
});

/** What the address asks for (?play=daily, ?play=practice&level=standard&era=jesus, ?play=disputed); unknown values: null. */
export function readPlay(params: URLSearchParams): { mode: Mode; level: Level; era: Era } | null {
  const mode = params.get("play");
  if (mode !== "daily" && mode !== "practice" && mode !== "disputed") return null;
  const level = LEVELS.find((value) => value === params.get("level")) ?? "beginner";
  const era = ERAS.find((value) => value === params.get("era")) ?? "all";
  return { mode, level, era };
}

export function playParams(mode: Mode, level: Level, era: Era): Record<string, string> {
  return mode === "practice" ? { play: mode, level, era } : { play: mode };
}
