// Hint circles (owner, 2026-11-12): each tap of Hint draws a circle that holds the place, never centred on it, and each
// circle after the first is half the size of the one before, so the hints narrow the search. Beginner may take three,
// Standard two, Expert (and so the Daily Five and Disputed sites) one. Every circle costs HINT_COST points off that place.
// The circles are sized from the round's opening view, so they show at the zoom the map opens at, and drawn from a
// seed, so the Daily Five gives everyone the same circles and a reload draws them again where they were.
import { seeded } from "../kit";
import type { LonLat } from "./geo";
import type { Level } from "./pools";

export const HINT_COST = 150;
export const HINTS_BY_LEVEL: Record<Level, number> = { beginner: 3, standard: 2, expert: 1 };

/** The first circle's radius as a share of the opening view's width; each next one is half the last. */
const FIRST_RADIUS_SHARE = 0.1;
const MIN_RADIUS_KM = 4;
/** How far from the circle's centre the place may lie, as a share of the radius: off-centre, never at the edge. */
const MAX_OFFSET_SHARE = 0.6;
const MIN_OFFSET_SHARE = 0.15;
const KM_PER_DEGREE_LAT = 110.574;
const KM_PER_DEGREE_LON_AT_EQUATOR = 111.32;
const CIRCLE_STEPS = 72;

export interface HintCircle { center: LonLat; km: number }

const kmPerDegreeLon = (lat: number) => KM_PER_DEGREE_LON_AT_EQUATOR * Math.cos((lat * Math.PI) / 180);

/** The view's width in km, measured along its middle latitude. */
export function viewWidthKm(view: readonly [number, number, number, number]): number {
  const [west, south, east, north] = view;
  return (east - west) * kmPerDegreeLon((south + north) / 2);
}

/** A point `km` east and north of `from` (flat-earth step; fine at the size of these circles). */
export function offsetKm(from: LonLat, eastKm: number, northKm: number): LonLat {
  return [from[0] + eastKm / kmPerDegreeLon(from[1]), from[1] + northKm / KM_PER_DEGREE_LAT];
}

/** A whole number from a text, for the seed (FNV-1a). */
function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return hash;
}

/** Every circle a place can have at this level, largest first; the round shows as many as the player has taken. */
export function hintCircles(place: LonLat, view: readonly [number, number, number, number], level: Level, seed: string): HintCircle[] {
  const random = seeded(hashText(seed));
  const first = Math.max(MIN_RADIUS_KM, viewWidthKm(view) * FIRST_RADIUS_SHARE);
  return Array.from({ length: HINTS_BY_LEVEL[level] }, (_, index) => {
    const km = Math.max(MIN_RADIUS_KM, first / 2 ** index);
    const angle = random() * 2 * Math.PI;
    const away = km * (MIN_OFFSET_SHARE + (MAX_OFFSET_SHARE - MIN_OFFSET_SHARE) * Math.sqrt(random()));
    // The centre sits `away` from the place, so the place is inside the circle but not at its middle.
    return { center: offsetKm(place, Math.cos(angle) * away, Math.sin(angle) * away), km };
  });
}

/** The circle's outline as a closed ring of [lon, lat] points, for the map. */
export function circleRing(circle: HintCircle, steps = CIRCLE_STEPS): [number, number][] {
  const ring = Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * 2 * Math.PI;
    return [...offsetKm(circle.center, Math.cos(angle) * circle.km, Math.sin(angle) * circle.km)] as [number, number];
  });
  return [...ring, ring[0]];
}

/** The box (west, south, east, north) around a circle, for framing it on the map. */
export function circleBox(circle: HintCircle): [number, number, number, number] {
  const [west, south] = offsetKm(circle.center, -circle.km, -circle.km);
  const [east, north] = offsetKm(circle.center, circle.km, circle.km);
  return [west, south, east, north];
}
