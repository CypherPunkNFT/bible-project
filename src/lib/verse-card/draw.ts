// Painting a laid-out card (layout.ts) on a canvas: background, ornament, words. One function for the small preview
// (scale under 1) and the full picture (scale 1), so the two always agree. The footer is part of every layout.
import type { CardLayout } from "./layout";
import type { Look } from "./looks";

/** Makes a Path2D from SVG path data; null where the browser has none (very old browsers, the test environment). */
export type PathMaker = (data: string) => Path2D | null;

const browserPath: PathMaker = (data) => (typeof Path2D === "undefined" ? null : new Path2D(data));

function paintBackground(context: CanvasRenderingContext2D, look: Look, width: number, height: number): void {
  if (typeof look.background === "string") {
    context.fillStyle = look.background;
  } else {
    const blend = context.createLinearGradient(0, 0, width, height);
    blend.addColorStop(0, look.background.from);
    blend.addColorStop(1, look.background.to);
    context.fillStyle = blend;
  }
  context.fillRect(0, 0, width, height);
}

function paintOrnament(context: CanvasRenderingContext2D, layout: CardLayout, look: Look, makePath: PathMaker): void {
  const line = 3 * (layout.size.width / 1080);
  context.strokeStyle = look.accent;
  context.lineCap = "round";
  context.lineJoin = "round";
  if (layout.ornament?.kind === "sun") {
    const path = makePath(layout.ornament.path);
    context.lineWidth = line;
    if (path) context.stroke(path);
  } else if (layout.ornament?.kind === "drawing") {
    const { x, y, box, viewBox, path: data } = layout.ornament;
    const path = makePath(data);
    context.save();
    context.translate(x, y);
    context.scale(box / viewBox, box / viewBox);
    context.lineWidth = (line * viewBox) / box;
    if (path) context.stroke(path);
    context.restore();
  }
  if (layout.rule) {
    context.fillStyle = look.accent;
    context.fillRect(layout.rule.x, layout.rule.y, layout.rule.w, layout.rule.h);
  }
}

/** Draws one card. `scale` maps picture pixels to canvas pixels (0.4 draws a 1080-wide card 432 wide). */
export function drawCard(context: CanvasRenderingContext2D, layout: CardLayout, look: Look, scale: number, makePath: PathMaker = browserPath): void {
  const { width, height } = layout.size;
  context.save();
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, height);
  paintBackground(context, look, width, height);
  paintOrnament(context, layout, look, makePath);
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  for (const line of layout.lines) {
    context.fillStyle = line.role === "reference" || line.role === "footer" ? look.accent : look.text;
    for (const run of line.runs) {
      context.font = run.font;
      context.fillText(run.text, run.x, line.y);
    }
  }
  context.restore();
}
