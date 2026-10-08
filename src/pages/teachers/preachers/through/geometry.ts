// The ring's geometry (66 wedges, one per book, Genesis at the top, clockwise) and the spoke animation: each spoke
// eases toward its new length frame by frame, written straight to its SVG path, never through a React re-render.
import { reducedMotion } from "../bible/words";

export const R0 = 92, R1 = 240, BOOKS = 66;
const STEP = (Math.PI * 2) / BOOKS, PAD = 0.012;

export const angle = (b: number) => -Math.PI / 2 + b * STEP;
export const point = (r: number, a: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
export const radiusOf = (fraction: number) => R0 + (R1 - R0) * fraction;
export function wedge(b: number, r: number) {
  const a0 = angle(b) + PAD, a1 = angle(b + 1) - PAD, outer = Math.max(R0 + 1.5, r);
  return `M${point(R0, a0)} L${point(outer, a0)} A${outer} ${outer} 0 0 1 ${point(outer, a1)} L${point(R0, a1)} A${R0} ${R0} 0 0 0 ${point(R0, a0)}Z`;
}

/** A round step for the middle guide circle: the largest of 200/100/50/20/10/5 that fits three times in the maximum. */
export function niceStep(max: number) {
  for (const s of [200, 100, 50, 20, 10, 5]) if (s <= max / 3) return s;
  return 0;
}

/** Where a book's label sits just outside the ring, turned to read outward (flipped on the left half). */
export function labelAt(b: number) {
  const a = angle(b) + STEP / 2, deg = (a * 180) / Math.PI, flip = Math.cos(a) < 0;
  return { transform: `translate(${point(R1 + 10, a).replace(" ", ",")}) rotate(${flip ? deg + 180 : deg})`, anchor: (flip ? "end" : "start") as "end" | "start" };
}

export class SpokeAnimator {
  private readonly shown = new Float32Array(BOOKS); // spoke lengths as drawn, 0–1 of the ring
  private goals: Float32Array = new Float32Array(BOOKS);
  private frame = 0;
  private grown = false;

  constructor(private readonly paths: (SVGPathElement | null)[]) {}

  /** New spoke lengths (0–1); they animate once the ring has first come into view. */
  setGoals(goals: Float32Array) { this.goals = goals; if (this.grown) this.kick(); }

  /** The first time the ring scrolls into view: grow it from nothing. */
  grow() { this.grown = true; this.kick(); }

  private draw() { for (let b = 0; b < BOOKS; b++) this.paths[b]?.setAttribute("d", wedge(b, radiusOf(this.shown[b]))); }

  private kick() {
    if (reducedMotion()) { this.shown.set(this.goals); this.draw(); return; }
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = () => {
    let moving = false;
    for (let b = 0; b < BOOKS; b++) {
      const diff = this.goals[b] - this.shown[b];
      if (Math.abs(diff) > 0.002) { this.shown[b] += diff * 0.16; moving = true; } else this.shown[b] = this.goals[b];
    }
    this.draw();
    this.frame = moving ? requestAnimationFrame(this.tick) : 0;
  };

  stop() { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }
}
