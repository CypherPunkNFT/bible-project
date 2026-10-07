// Journey motion on the atlas map: the route draws itself and a traveller moves along it, stop to stop.
// Distances are measured along the straight legs between stops (in map degrees, which is all the drawing needs).
export type Point = [number, number];

/** Distance from the start of the route to each of its points. */
export function cumulative(path: Point[]): number[] {
  const out = [0];
  for (let i = 1; i < path.length; i++) out.push(out[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  return out;
}

/** The route up to a distance along it, ending exactly at that distance (the traveller's position is the last point). */
export function sliceTo(path: Point[], lengths: number[], distance: number): Point[] {
  if (path.length === 0) return [];
  if (distance <= 0) return [path[0]];
  const out: Point[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    if (lengths[i] <= distance) { out.push(path[i]); continue; }
    const leg = lengths[i] - lengths[i - 1];
    const t = leg > 0 ? (distance - lengths[i - 1]) / leg : 0;
    out.push([path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t]);
    break;
  }
  return out;
}

/** How many route points the traveller has reached at a distance (a stop counts once it is reached). */
export const reachedCount = (lengths: number[], distance: number) => lengths.filter((length) => length <= distance + 1e-9).length;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Animate the travelled distance from one value to another, calling `frame` on every animation frame.
 * Returns a cancel function; a new animation should cancel the last one.
 */
export function animateDistance(from: number, to: number, duration: number, frame: (distance: number) => void): () => void {
  if (duration <= 0 || from === to) { frame(to); return () => undefined; }
  let handle = 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    frame(from + (to - from) * ease(t));
    if (t < 1) handle = requestAnimationFrame(step);
  };
  handle = requestAnimationFrame(step);
  return () => cancelAnimationFrame(handle);
}

/** Drawing a whole chapter: a steady pace per leg, never too slow for a long journey. */
export const drawDuration = (legs: number) => Math.min(4200, 700 + legs * 240);
