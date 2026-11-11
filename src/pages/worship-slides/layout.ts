// Where everything sits on a slide (pure, in slide pixels): the text box for the layout, the words wrapped into lines,
// the letters shrunk step by step until the lines fit, and the reference's place. The pictures (draw.ts) and the
// PowerPoint file (pptx.ts) both read this, so the two agree. Widths come from `measure`, which the page backs with a
// canvas and the tests with a fixed width per letter.
import type { Slide } from "./slides";
import type { FontChoice, LayoutId } from "./templates";

export type Measure = (text: string, font: string) => number;

export interface Box { x: number; y: number; w: number; h: number }
export interface Word { text: string; x: number; mark: boolean }
export interface Line { words: Word[]; width: number; y: number }

export interface SlideLayout {
  align: "center" | "left";
  /** The verse's (or title's) letter size, and where the text block sits. */
  size: number;
  box: Box;
  lines: Line[];
  /** The verse numbers' size; they ride a little above the line. */
  markSize: number;
  /** A second line of smaller text: the reference on a verse slide, "Berean Standard Bible" on the title slide. */
  note: { text: string; size: number; x: number; y: number } | null;
  /** The lower third's band behind the words. */
  band: Box | null;
  /** The left layout's short line above the words. */
  rule: Box | null;
}

export const LINE_HEIGHT = 1.32;
const MIN_SCALE = 0.55;

export const fontString = (font: FontChoice, size: number, weight = font.canvas.weight) =>
  `${font.canvas.italic ? "italic " : ""}${weight} ${Math.round(size * 100) / 100}px ${font.canvas.family}`;

interface Token { text: string; mark: boolean; glued: boolean }

/** The slide's words as tokens: a verse number is glued to the word after it, so a line never ends on one. */
function tokens(slide: Slide, numbers: boolean): Token[] {
  if (slide.kind === "title") return slide.heading.split(/\s+/).filter(Boolean).map((text) => ({ text, mark: false, glued: false }));
  const out: Token[] = [];
  for (const piece of slide.pieces) {
    if (numbers && piece.mark) out.push({ text: piece.mark, mark: true, glued: false });
    piece.text.split(/\s+/).filter(Boolean).forEach((text, i) => out.push({ text, mark: false, glued: i === 0 && numbers && !!piece.mark }));
  }
  return out;
}

/** Wraps tokens into lines no wider than `width` at letter size `size`. */
function wrap(list: Token[], size: number, width: number, font: FontChoice, measure: Measure): { words: Word[]; width: number }[] {
  const body = fontString(font, size);
  const small = fontString(font, size * 0.55, Math.max(font.canvas.weight, 600));
  const space = measure(" ", body);
  const lines: { words: Word[]; width: number }[] = [];
  let words: Word[] = [];
  let x = 0;
  for (let i = 0; i < list.length; i++) {
    const token = list[i];
    // A verse number travels with its first word.
    const next = token.mark && list[i + 1]?.glued ? list[i + 1] : null;
    const markWidth = token.mark ? measure(token.text, small) + size * 0.12 : 0;
    const wordWidth = token.mark ? (next ? measure(next.text, body) : 0) : measure(token.text, body);
    const needed = markWidth + wordWidth;
    if (words.length && x + space + needed > width) {
      lines.push({ words, width: x });
      words = [];
      x = 0;
    }
    const start = words.length ? x + space : 0;
    if (token.mark) {
      words.push({ text: token.text, x: start, mark: true });
      if (next) { words.push({ text: next.text, x: start + markWidth, mark: false }); i++; }
    } else words.push({ text: token.text, x: start, mark: false });
    x = start + needed;
  }
  if (words.length) lines.push({ words, width: x });
  return lines;
}

/** The text box and the note's place for each layout, on a slide `width` × `height`. */
function frame(layout: LayoutId, width: number, height: number, hasNote: boolean) {
  const side = Math.round(width * 0.08);
  if (layout === "lower-third") {
    const band = { x: 0, y: Math.round(height * 0.64), w: width, h: Math.round(height * 0.31) };
    const noteSpace = hasNote ? height * 0.06 : 0;
    return { box: { x: side, y: band.y + height * 0.035, w: width - side * 2, h: band.h - height * 0.07 - noteSpace }, band, noteY: band.y + band.h - height * 0.045, align: "center" as const };
  }
  const top = layout === "left" ? height * 0.16 : height * 0.1;
  const noteSpace = hasNote ? height * 0.13 : height * 0.04;
  return { box: { x: side, y: top, w: width - side * 2, h: height - top - noteSpace - height * 0.06 }, band: null, noteY: height - height * 0.08, align: layout === "left" ? "left" as const : "center" as const };
}

export interface LayoutSettings { layout: LayoutId; font: FontChoice; width: number; height: number; size: number; numbers: boolean; footer: boolean }

/** Everything's place on one slide. */
export function layoutSlide(slide: Slide, settings: LayoutSettings, measure: Measure): SlideLayout {
  const { layout, font, width, height, numbers, footer } = settings;
  const title = slide.kind === "title";
  const noteText = title ? slide.subtitle : footer ? slide.reference : null;
  const { box, band, noteY, align } = frame(layout, width, height, noteText !== null);
  const lowerThird = layout === "lower-third";
  // The lower third's band is short, so its words start smaller; a title starts larger.
  let size = settings.size * (lowerThird ? 0.66 : 1) * (title ? 1.25 : 1);
  const floor = size * MIN_SCALE;
  const list = tokens(slide, numbers);
  let wrapped = wrap(list, size, box.w, font, measure);
  while (wrapped.length * size * LINE_HEIGHT > box.h && size > floor) {
    size = Math.max(floor, size * 0.94);
    wrapped = wrap(list, size, box.w, font, measure);
  }
  const blockHeight = wrapped.length * size * LINE_HEIGHT;
  const top = box.y + Math.max(0, (box.h - blockHeight) / 2);
  const lines: Line[] = wrapped.map((line, i) => {
    const offset = align === "center" ? (box.w - line.width) / 2 : 0;
    return { width: line.width, y: top + i * size * LINE_HEIGHT + size, words: line.words.map((word) => ({ ...word, x: box.x + offset + word.x })) };
  });
  const noteSize = Math.round(height * (lowerThird ? 0.032 : 0.04));
  const note = noteText === null ? null : {
    text: noteText,
    size: noteSize,
    x: align === "center" ? width / 2 : box.x,
    y: title && !lowerThird ? Math.min(noteY, top + blockHeight + noteSize * 2.2) : noteY,
  };
  const rule = layout === "left" ? { x: box.x, y: Math.max(height * 0.07, top - height * 0.06), w: Math.round(width * 0.06), h: Math.max(4, Math.round(height * 0.006)) } : null;
  return { align, size, box, lines, markSize: size * 0.55, note, band, rule };
}
