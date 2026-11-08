// The sums behind the games' drawings (parts.tsx draws them), and the type every game's art has.
import type { CSSProperties, ReactElement } from "react";

/** The site's canonical book colours (index.css), one per game. */
export type Tone = "history" | "poetry" | "prophets" | "gospels" | "acts" | "epistles" | "revelation";

/** A game's picture on the hub: the scene, the colour it is drawn in, and what it shows, for screen readers. */
export interface GameArt {
  /** Draws inside a 240 × 160 box, in front of the arched window; ground line at y = 150. */
  Scene: () => ReactElement;
  tone: Tone;
  /** A short description of the picture (not the game's title, which the card already says). */
  alt: string;
}

/** Parallel 45° strokes filling the rectangle x, y, w, h, `gap` apart: engraved shading. */
export function hatch(x: number, y: number, w: number, h: number, gap = 3.2): string {
  const lines: string[] = [];
  for (let k = gap; k < w + h; k += gap) {
    const x1 = Math.min(x + k, x + w), y1 = y + Math.max(0, k - w);
    const x2 = Math.max(x + k - h, x), y2 = y + Math.min(h, k);
    lines.push(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }
  return lines.join("");
}

/** The engraved shadow under something standing at cx on the ground (y): shorter strokes below longer ones. */
export function shadow(cx: number, y: number, half: number): string {
  return [0, 1, 2].map((i) => {
    const w = half * (1 - i * .28);
    return `M${(cx - w).toFixed(1)} ${y + 2 + i * 2.6}H${(cx + w).toFixed(1)}`;
  }).join("");
}

/** A four-pointed spark, for twinkles. */
export const spark = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

/** The style for an element whose motion is staggered: its turn (`--i`) and, for a turn about a point, that point. */
export const at = (i: number, origin?: string): CSSProperties => ({ "--i": i, ...(origin ? { transformOrigin: origin } : {}) } as CSSProperties);
