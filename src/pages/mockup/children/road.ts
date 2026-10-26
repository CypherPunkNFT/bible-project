// The road a part's lessons stand on (PathView.tsx Path), and the dot that travels it as the page scrolls.
// Units are a thousandth of the path's width, x across and y down.
import { useEffect, useMemo, useState, type RefObject } from "react";

const NARROW = "(max-width: 760px)";

/** The road's shape: `swing` is how far a turn reaches either side of the middle and `wobble` how much less any one
 * turn may reach, `bend` how far down one sweep across goes, `flat` (0 to 1) how level the middle of a sweep runs and
 * so how round its turns are, `perSweep` how many lessons stand on each sweep, and `top` and `bottom` keep the first
 * circle and the last title inside. */
export interface Road { swing: number; wobble: number; bend: number; flat: number; perSweep: number; top: number; bottom: number }

interface Spot { x: number; y: number; along: number }

/** The laid road: each lesson's point and distance along it, the line itself, its height, and any point along it. */
export interface LaidRoad { points: Spot[]; d: string; height: number; pointAt: (along: number) => Spot }

/** A road winding down the page like a board game's: nearly level across, then a wide round turn at each side, with
 * no row ends and no two lessons stacked (owner, 2026-10-25: "really smooth, long winding things … like the game of
 * life. Nice and easy. Turns"). With `art` (E) a sweep holds at most three and never more than a third of the part's
 * lessons, so the road always winds through at least two bends; two on a phone, where the circles fill more of the
 * width. */
export function useRoad(count: number, art?: boolean): Road {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const change = () => setNarrow(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return useMemo(() => {
    if (art) return narrow ? { swing: 260, wobble: 40, bend: 1150, flat: 0.3, perSweep: 2, top: 190, bottom: 340 }
      : { swing: 370, wobble: 100, bend: 600, flat: 0.6, perSweep: Math.max(2, Math.min(3, Math.ceil(count / 3))), top: 90, bottom: 150 };
    return narrow ? { swing: 300, wobble: 40, bend: 700, flat: 0.4, perSweep: 3, top: 120, bottom: 260 }
      : { swing: 400, wobble: 60, bend: 340, flat: 0.6, perSweep: 6, top: 60, bottom: 110 };
  }, [narrow, count, art]);
}

/** A repeatable random series from a word, so each part's road is its own and the same on every visit. */
function seeded(word: string) {
  let h = 2166136261;
  for (const c of word) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const SAMPLES = 200;

/** Lays `count` lessons on a road shaped by `seed` (owner, 2026-10-25: "don't make every single path the same path"):
 * every turn reaches out its own way, every sweep drops (never less than `bend`, so the lessons keep their spacing)
 * and runs level its own way. Sweep k goes from turn a to turn b
 * as x = (a + b)/2 − (b − a)/2 · cos φ, y = drop/π · (φ + level/2 · sin 2φ) for φ from 0 to π, upright at both turns,
 * so the sweeps join smoothly. The lessons stand evenly along each sweep, one on every turn. */
export function layRoad(count: number, { swing, wobble, bend, flat, perSweep, top, bottom }: Road, seed: string): LaidRoad {
  const random = seeded(seed);
  const sweeps = Math.max(1, Math.ceil((count - 1) / perSweep));
  const reach = Array.from({ length: sweeps + 1 }, (_, k) => 500 + (k % 2 ? 1 : -1) * (swing - random() * wobble));
  const samples: Spot[] = [{ x: reach[0], y: top, along: 0 }];
  const stops: number[] = [];
  let y0 = top;
  for (let k = 0; k < sweeps; k++) {
    const a = reach[k], b = reach[k + 1], start = samples[samples.length - 1].along;
    const drop = bend * (1 + random() * 0.3), level = Math.min(0.8, Math.max(0, flat + (random() - 0.5) * 0.3));
    for (let i = 1; i <= SAMPLES; i++) {
      const phi = (Math.PI * i) / SAMPLES, last = samples[samples.length - 1];
      const x = (a + b) / 2 - ((b - a) / 2) * Math.cos(phi), y = y0 + (drop / Math.PI) * (phi + (level / 2) * Math.sin(2 * phi));
      samples.push({ x, y, along: last.along + Math.hypot(x - last.x, y - last.y) });
    }
    const end = samples[samples.length - 1].along;
    for (let j = 0; j < perSweep; j++) stops.push(start + ((end - start) * j) / perSweep);
    y0 += drop;
  }
  stops.push(samples[samples.length - 1].along);
  stops.length = Math.max(1, count);
  const pointAt = (along: number): Spot => {
    let low = 0, high = samples.length - 1;
    while (high - low > 1) { const mid = (low + high) >> 1; if (samples[mid].along <= along) low = mid; else high = mid; }
    const p = samples[low], q = samples[high], f = q.along > p.along ? Math.min(1, Math.max(0, (along - p.along) / (q.along - p.along))) : 0;
    return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, along };
  };
  const finish = stops[stops.length - 1];
  const line = samples.filter((s) => s.along < finish).concat(pointAt(finish)).map((s) => `${s.x.toFixed(1)} ${s.y.toFixed(1)}`);
  return { points: stops.map(pointAt), d: `M${line.join("L")}`, height: pointAt(finish).y + bottom, pointAt };
}

/** The outline of a swell on the road centred `along` it: `length` long, as wide as `width` either side at its middle
 * and narrowing smoothly to nothing at both ends. */
function swell(road: LaidRoad, along: number, length: number, width: number): string {
  const STEPS = 32, left: string[] = [], right: string[] = [];
  let nx = 0, ny = -1;
  for (let i = 0; i <= STEPS; i++) {
    const s = -length / 2 + (length * i) / STEPS, p = road.pointAt(along + s), a = road.pointAt(along + s - 1), b = road.pointAt(along + s + 1);
    const dx = b.x - a.x, dy = b.y - a.y, run = Math.hypot(dx, dy);
    if (run > 0) { nx = -dy / run; ny = dx / run; }
    const w = width * Math.cos((Math.PI * s) / length) ** 2;
    left.push(`${(p.x + nx * w).toFixed(1)} ${(p.y + ny * w).toFixed(1)}`);
    right.unshift(`${(p.x - nx * w).toFixed(1)} ${(p.y - ny * w).toFixed(1)}`);
  }
  return `M${left.join("L")}L${right.join("L")}Z`;
}

/** A wave that flows along the road as the page scrolls, a swell on both sides of the line, at the place the window's
 * middle has reached; the lesson it is passing through is returned, to light as if pointed at (owner, 2026-10-25: "a
 * dot that travels. And then hovers selections when it gets to the destination, and it keeps going", then "the
 * traveling dot is speeding like a little bullet … a double-sided wave. Flowing through rather than a dot"). It moves
 * at one steady speed with the scroll, and glides to each new place rather than jumping. */
export function useTraveller(box: RefObject<HTMLElement>, wave: RefObject<SVGPathElement>, halo: RefObject<SVGPathElement>, road: LaidRoad): number {
  const [near, setNear] = useState(-1);
  useEffect(() => {
    const glide = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.1;
    let frame = 0, shown = Number.NaN;
    // The window's middle, from the first lesson down to the last, as the same share of the whole road: one steady
    // speed all the way, never racing along a level stretch.
    const target = (rect: DOMRect) => {
      const { points } = road, first = points[0], last = points[points.length - 1];
      const y = ((window.innerHeight * 0.55 - rect.top) / rect.width) * 1000;
      return last.y > first.y ? Math.min(1, Math.max(0, (y - first.y) / (last.y - first.y))) * last.along : 0;
    };
    const step = () => {
      frame = 0;
      const area = box.current, core = wave.current, glow = halo.current;
      if (!area || !core || !glow || !road.points.length) return;
      const rect = area.getBoundingClientRect(), goal = target(rect);
      shown = Number.isNaN(shown) ? goal : shown + (goal - shown) * glide;
      if (Math.abs(goal - shown) < 0.5) shown = goal;
      // Sizes in pixels, turned into the road's units (a thousandth of the path's width).
      const unit = 1000 / rect.width, length = Math.min(240, rect.width * 0.45) * unit;
      core.setAttribute("d", swell(road, shown, length, 5 * unit));
      glow.setAttribute("d", swell(road, shown, length * 1.2, 13 * unit));
      const circle = ((area.querySelector(".ck-node")?.getBoundingClientRect().width ?? 0) / 2) * unit;
      setNear(road.points.findIndex((p) => Math.abs(p.along - shown) < circle + length * 0.3));
      if (shown !== goal) frame = requestAnimationFrame(step);
    };
    const ask = () => { if (!frame) frame = requestAnimationFrame(step); };
    step();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", ask); window.removeEventListener("resize", ask); };
  }, [box, wave, halo, road]);
  return near;
}
