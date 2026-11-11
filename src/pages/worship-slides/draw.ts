// Drawing a laid-out slide on a canvas: the previews at a small scale, and the downloaded pictures at full size
// (1920 × 1080 or 1440 × 1080), always from the same layout (layout.ts). The see-through background leaves the picture
// transparent, for a livestream program to lay over video, and gives the words a soft shadow so they read on anything.
import { fontString, type Measure, type SlideLayout } from "./layout";
import type { FontChoice, Theme } from "./templates";

const hex = (color: string) => `#${color}`;

function rgba(color: string, alpha: number): string {
  const n = parseInt(color, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** A measure backed by a canvas context, remembering each word's width per font (a deck measures the same words
 *  hundreds of times while it shrinks to fit). Without a canvas (tests, very old browsers) a letter is half its size. */
export function canvasMeasure(context: CanvasRenderingContext2D | null): Measure {
  const widths = new Map<string, number>();
  return (text, font) => {
    const key = `${font}\u0000${text}`;
    let width = widths.get(key);
    if (width === undefined) {
      if (context) { context.font = font; width = context.measureText(text).width; }
      else width = text.length * (parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? "16") * 0.5);
      widths.set(key, width);
    }
    return width;
  };
}

/** Draws one slide. `scale` maps slide pixels to canvas pixels (0.25 draws a 1920-wide slide 480 wide). */
export function drawSlide(context: CanvasRenderingContext2D, layout: SlideLayout, theme: Theme, font: FontChoice, width: number, height: number, scale: number): void {
  context.save();
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, height);
  if (theme.fill.kind === "solid") {
    context.fillStyle = hex(theme.fill.color);
    context.fillRect(0, 0, width, height);
  } else if (theme.fill.kind === "gradient") {
    const blend = context.createLinearGradient(0, 0, width, height);
    blend.addColorStop(0, hex(theme.fill.from));
    blend.addColorStop(1, hex(theme.fill.to));
    context.fillStyle = blend;
    context.fillRect(0, 0, width, height);
  }
  if (layout.band) {
    context.fillStyle = rgba(theme.band.color, theme.band.alpha);
    context.fillRect(layout.band.x, layout.band.y, layout.band.w, layout.band.h);
  }
  if (layout.rule) {
    context.fillStyle = hex(theme.accent);
    context.fillRect(layout.rule.x, layout.rule.y, layout.rule.w, layout.rule.h);
  }
  if (theme.fill.kind === "clear") {
    context.shadowColor = "rgba(0, 0, 0, 0.6)";
    context.shadowBlur = 12;
    context.shadowOffsetY = 2;
  }
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  const body = fontString(font, layout.size);
  const small = fontString(font, layout.markSize, Math.max(font.canvas.weight, 600));
  for (const line of layout.lines) {
    for (const word of line.words) {
      context.font = word.mark ? small : body;
      context.fillStyle = hex(word.mark ? theme.accent : theme.text);
      context.fillText(word.text, word.x, word.mark ? line.y - layout.size * 0.32 : line.y);
    }
  }
  if (layout.note) {
    context.font = fontString(font, layout.note.size, Math.max(font.canvas.weight, 500));
    context.fillStyle = hex(theme.accent);
    context.textAlign = layout.align === "center" ? "center" : "left";
    context.fillText(layout.note.text, layout.note.x, layout.note.y);
  }
  context.restore();
}

/** The canvas as a PNG, or an error naming what failed (some browsers refuse very large canvases). */
export function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`worship slides: the browser made no picture from a ${canvas.width} × ${canvas.height} canvas`))), "image/png");
  });
}
