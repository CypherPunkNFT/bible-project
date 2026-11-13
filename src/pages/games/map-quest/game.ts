// One game of Map quest, whichever kind: the Daily Five, a practice round (level and era), or Disputed sites. The page
// turns a game into screens; everything that decides what is asked and how it scores lives here, where tests reach it.
import { nearestOnShape, type AreaShape } from "./area";
import { DAILY, DISPUTED, PLACES, PLACE_BY_ID, SHAPES } from "./data";
import type { LonLat } from "./geo";
import { ERAS, LEVELS, pickRound, practicePool, sitesOf, type DisputedPlace, type Era, type Level, type QuestPlace } from "./pools";
import { timePenalty } from "./clock";
import { HINT_COST } from "./hints";
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
  /** A river, sea, valley or region: the pin is scored by its distance to this shape (design §16). */
  shape?: AreaShape;
}

/** `hints`: hint circles taken (each HINT_COST points off); `seconds`: time taken; `timeOff`: the points the clock took. */
export interface Result { question: Question; pin: LonLat; site: LonLat; km: number; points: number; hints: number; seconds: number; timeOff: number }

/** What a place cost besides distance: hint circles and the time taken, at the game's level. */
export interface Costs { hints?: number; seconds?: number; level?: Level }

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
  ...(place.shape && SHAPES[place.id] ? { shape: SHAPES[place.id] } : {}),
});

export const questionFromDisputed = (place: DisputedPlace): Question => ({
  id: place.id, name: place.name, sites: place.sites.map((site) => [site.lon, site.lat] as LonLat), siteNames: place.sites.map((site) => site.name),
  verse: place.verse, verseCount: place.verseCount, atlas: PLACE_BY_ID.get(place.id)?.atlas ?? false, note: place.note, source: place.source,
});

/** A pin scored against the nearest of the question's sites (or its shape), less HINT_COST per hint circle and the clock's penalty. */
export function scorePin(question: Question, pin: LonLat, { hints = 0, seconds = 0, level = "expert" }: Costs = {}): Result {
  const { site, km } = question.shape ? nearestOnShape(pin, question.shape) : nearestSite(pin, question.sites);
  const timeOff = timePenalty(seconds, level);
  return { question, pin, site, km, points: Math.max(0, scoreForDistance(km) - hints * HINT_COST - timeOff), hints, seconds, timeOff };
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
  picks.slice(0, game.questions.length).map((pick, index) => scorePin(game.questions[index], [pick.lon, pick.lat], { hints: pick.hints, seconds: pick.seconds, level: game.level }));

export const pickFromResult = (result: Result): Pick => ({
  id: result.question.id, lon: result.pin[0], lat: result.pin[1], km: Math.round(result.km * 10) / 10, points: result.points, hints: result.hints, seconds: result.seconds,
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
