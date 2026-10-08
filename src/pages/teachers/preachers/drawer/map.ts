// The drawer's mini map: the smallest pre-drawn map view that holds every place a person lived, cropped close around
// those places, with the route between them and labels that never collide (ported from the mock-up's drawer.js).
import type { PeopleData, Person, Point } from "@/data/teachers/pages-types";

export interface MapLabel { key: number; x: number; y: number; anchor: "start" | "end"; size: number; text: string }
export interface PlaceMapModel {
  viewBox: string;
  land: string;
  /** Points of the route, with repeated stops in the same spot dropped; fewer than two means no route line. */
  route: Point[];
  points: Point[];
  /** Scale of the crop: one unit of the 400-wide drawing in view pixels. */
  k: number;
  labels: MapLabel[];
}

const VIEW_ORDER: ["europe" | "america" | "atlantic" | "world", number][] = [["europe", 260], ["america", 260], ["atlantic", 300], ["world", 1000]];

function cropOf(points: Point[], width: number, height: number, minWidth: number) {
  const xs = points.map((q) => q[0]), ys = points.map((q) => q[1]);
  const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
  const w = Math.min(width, Math.max(minWidth, spanX * 1.5 + 60, (spanY * 1.4 + 60) * 2)), h = Math.min(height, w / 2);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const x = Math.max(0, Math.min(width - w, cx - w / 2)), y = Math.max(0, Math.min(height - h, cy - h / 2));
  return { x, y, w, h };
}

/** Place names beside their dots: right side first (left near the right edge); a label that would collide is dropped. */
function labelsOf(person: Person, points: Point[], crop: { x: number; w: number }, k: number): MapLabel[] {
  const seen = new Set<string>(), boxes: number[][] = [], labels: MapLabel[] = [];
  person.places.forEach((place, i) => {
    if (seen.has(place[0])) return;
    seen.add(place[0]);
    const [px, py] = points[i], tw = place[0].length * 6.4 * k, th = 13 * k;
    for (const right of px < crop.x + crop.w * 0.72 ? [true, false] : [false, true]) {
      const bx = right ? px + 9 * k : px - 9 * k - tw, box = [bx, py - th / 2, bx + tw, py + th / 2];
      if (boxes.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
      boxes.push(box);
      labels.push({ key: i, x: px + (right ? 9 : -9) * k, y: py + 4 * k, anchor: right ? "start" : "end", size: 11 * k, text: place[0] });
      return;
    }
  });
  return labels;
}

export function placeMapOf(data: PeopleData, person: Person): PlaceMapModel | null {
  for (const [name, minWidth] of VIEW_ORDER) {
    const view = data.views[name];
    const found = person.places.map((_, i) => view.places[`${person.id}#${i}`]);
    if (found.some((pt) => !pt)) continue;
    const points = found as Point[];
    const crop = cropOf(points, view.width, view.height, minWidth);
    const k = crop.w / 400;
    const route = points.filter((q, i) => i === 0 || q[0] !== points[i - 1][0] || q[1] !== points[i - 1][1]);
    return {
      viewBox: `${crop.x.toFixed(1)} ${crop.y.toFixed(1)} ${crop.w.toFixed(1)} ${crop.h.toFixed(1)}`,
      land: view.land, route, points, k, labels: labelsOf(person, points, crop, k),
    };
  }
  return null;
}

export interface StripSegment { name: string; from: number; to: number; index: number }
/** The person's life as consecutive stays; when the birthplace is unknown the years before the first place are unnamed. */
export function lifeSegments(person: Person, end: number): StripSegment[] {
  const segments = person.places.map((place, i) => ({
    name: place[0], from: Math.max(person.born, place[3]), to: Math.min(end, person.places[i + 1]?.[3] ?? end), index: i,
  })).filter((s) => s.to > s.from || s.index === person.places.length - 1);
  if (person.birthplaceKnown === false && person.places[0][3] > person.born) {
    segments.unshift({ name: "Not recorded", from: person.born, to: person.places[0][3], index: -1 });
  }
  return segments;
}
