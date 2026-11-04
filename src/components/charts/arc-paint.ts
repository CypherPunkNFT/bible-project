import type { SectionId } from "@/lib/types";

/** What the arc chart draws: every chapter pair as [chapter index, chapter index, references], weakest first so the
 *  strong arcs land on top, plus each chapter's book code and section. Shared with scripts/build-arc-images.mjs. */
export interface ArcScene {
  arcs: [number, number, number][];
  bookOf: string[];
  sections: SectionId[];
}

export interface ArcView {
  width: number;
  height: number;
  colors: Record<SectionId, string>;
  /** The lit book's code, or "" for the whole Bible. */
  active: string;
}

/** The chart's height for its width. The arcs stand on a baseline 22px above the bottom, under the chapter bar. */
export const arcHeight = (width: number) => Math.round(Math.min(430, width * .45)) + 26;
export const arcBase = (height: number) => height - 22;

/** Draws onto a context already scaled to CSS pixels: `arc` one chapter pair at a time (so callers can spread the
 *  ~140,000 of the whole Bible over several frames), `bar` the strip of chapters under them. */
export function arcPainter(paint: CanvasRenderingContext2D, scene: ArcScene, view: ArcView) {
  const n = scene.bookOf.length;
  const base = arcBase(view.height);
  const x = (i: number) => ((i + .5) / n) * view.width;
  const verticalScale = (view.height - 28) / (view.width / 2);
  // A lit book is drawn as faintly as the whole Bible so its arcs layer into strands and glow instead of one solid
  // band: the fewer arcs it has, the stronger each one (3 John's 160 would vanish at the dense books' strength, and
  // Psalms' 28,000 would fill in solid at the sparse books'). Genesis, with ~9,800, sets the middle.
  let lit = 0;
  if (view.active) for (const [a, b] of scene.arcs) if (scene.bookOf[a] === view.active || scene.bookOf[b] === view.active) lit++;
  const strength = view.active ? Math.min(6, Math.max(.4, (9800 / Math.max(lit, 1)) ** .75)) : 1;
  paint.lineWidth = view.active ? Math.min(.8, .55 * strength ** .25) : .55;
  return {
    arc([a, b, count]: [number, number, number]) {
      const x1 = x(a);
      const radius = Math.abs(x(b) - x1) / 2;
      if (radius === 0) return;
      paint.beginPath();
      paint.ellipse(x1 + radius, base, radius, radius * verticalScale, 0, Math.PI, 0);
      const other = view.active && scene.bookOf[a] === view.active ? b : a;
      paint.strokeStyle = view.colors[scene.sections[other]];
      paint.globalAlpha = view.active
        ? Math.min(.9, .5 * Math.sqrt(strength), .05 * strength * (1 + Math.log2(count)))
        : Math.min(.35, .018 * (1 + Math.log2(count)));
      paint.stroke();
    },
    bar() {
      for (let i = 0; i < n; i++) {
        paint.fillStyle = view.colors[scene.sections[i]];
        paint.globalAlpha = view.active && scene.bookOf[i] !== view.active ? .25 : 1;
        paint.fillRect((i / n) * view.width, base + 3, view.width / n + .4, 12);
      }
      paint.globalAlpha = 1;
    },
  };
}
