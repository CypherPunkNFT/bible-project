// Rivers, seas, valleys and regions (design §16): a place that is a shape, scored by the pin's distance to it. Inside a
// region or sea counts as 0 km; a river or valley line counts its nearest point. The shapes come from
// src/data/map-quest/shapes.json (scripts/build-map-quest.py, from OpenBible's geometry files).
import type { LineString, Polygon } from "geojson";
import { haversineKm, type LonLat } from "./geo";

export type AreaShape = Polygon | LineString;

const KM_PER_DEGREE_LAT = 110.57;
const KM_PER_DEGREE_LON_AT_EQUATOR = 111.32;

/** Ray casting: is the point inside this closed ring? */
export function insideRing(at: LonLat, ring: readonly (readonly number[])[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[j];
    if ((y1 > at[1]) !== (y2 > at[1]) && at[0] < x1 + ((at[1] - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring and in none of the holes. */
export const insidePolygon = (at: LonLat, rings: readonly (readonly (readonly number[])[])[]): boolean =>
  insideRing(at, rings[0]) && !rings.slice(1).some((hole) => insideRing(at, hole));

/** The point of the segment a-b nearest `at`, on a flat map local to `at` (fine at the few hundred km that matter). */
function nearestOnSegment(at: LonLat, a: readonly number[], b: readonly number[]): LonLat {
  const scale = Math.cos((at[1] * Math.PI) / 180) * KM_PER_DEGREE_LON_AT_EQUATOR;
  const ax = (a[0] - at[0]) * scale, ay = (a[1] - at[1]) * KM_PER_DEGREE_LAT;
  const dx = (b[0] - a[0]) * scale, dy = (b[1] - a[1]) * KM_PER_DEGREE_LAT;
  const length = dx * dx + dy * dy;
  const t = length > 0 ? Math.min(1, Math.max(0, -(ax * dx + ay * dy) / length)) : 0;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** The shape's lines: a river's path, or a region's rings. */
export const linesOf = (shape: AreaShape): readonly (readonly (readonly number[])[])[] =>
  shape.type === "LineString" ? [shape.coordinates] : shape.coordinates;

/** The point of the shape nearest the pin and how far it is: the pin itself (0 km) when it is inside a region. */
export function nearestOnShape(pin: LonLat, shape: AreaShape): { site: LonLat; km: number } {
  if (shape.type === "Polygon" && insidePolygon(pin, shape.coordinates)) return { site: pin, km: 0 };
  let best: { site: LonLat; km: number } | null = null;
  for (const line of linesOf(shape)) {
    for (let i = 1; i < line.length; i++) {
      const site = nearestOnSegment(pin, line[i - 1], line[i]);
      const km = haversineKm(pin, site);
      if (!best || km < best.km) best = { site, km };
    }
  }
  if (!best) throw new Error(`Map quest: a shape with no segments (type ${shape.type}, ${linesOf(shape).length} lines); expected 2+ points per line`);
  return best;
}
