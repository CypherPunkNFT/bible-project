// Where everything sits on a card (design 4.4), pure and in picture pixels: heading, ornament, verse, reference, the
// visitor's lines, and the footer at the bottom of the safe area. The verse starts at its size's starting letter size and
// shrinks 2 px at a time until it all fits; below the smallest size the card reports `fits: false` and is never cut.
// Widths come from `measure`, which the page backs with a canvas and the tests with a fixed width per letter.
import type { Measure } from "./canvas";
import type { Look } from "./looks";
import { ORNAMENT_PATHS, sunPath } from "./ornaments";
import { SIZES, SIZE_IDS, type CardSize, type SizeId } from "./sizes";
import { resolveCard, type CardSpec, type ResolvedCard } from "./spec";

export const FOOTER = "Berean Standard Bible · bibleguide.io";
export const SERIF = '"Literata Variable", Georgia, serif';
export const SANS = '"Archivo Variable", Arial, sans-serif';
/** LORD and GOD are drawn in made-up small capitals: the first letter full size, the rest at this share. */
export const SMALL_CAPS = 0.78;

export type Role = "heading" | "verse" | "reference" | "line" | "footer";
export interface Run { text: string; x: number; font: string }
export interface TextLine { role: Role; y: number; width: number; runs: Run[] }
export type PlacedOrnament = { kind: "drawing"; path: string; viewBox: number; x: number; y: number; box: number } | { kind: "sun"; path: string };

export interface CardLayout {
  size: CardSize;
  fits: boolean;
  /** The verse's letter size the card settled on. */
  verseSize: number;
  lines: TextLine[];
  ornament: PlacedOrnament | null;
  rule: { x: number; y: number; w: number; h: number } | null;
}

const round = (value: number) => Math.round(value * 100) / 100;
const verseFont = (look: Look, size: number) => (look.lettering === "bold" ? `700 ${round(size)}px ${SANS}` : `400 ${round(size)}px ${SERIF}`);
const sansFont = (weight: string, size: number) => `${weight} ${round(size)}px ${SANS}`;

/** Every face a card may be drawn in, for the font wait. */
export const CARD_FACES: readonly string[] = [`400 64px ${SERIF}`, `700 64px ${SANS}`, `600 64px ${SANS}`, `500 64px ${SANS}`, `italic 400 64px ${SANS}`];

/** Straight quotes and apostrophes as printed ones: "word" -> “word”, it's -> it’s. */
export function printQuotes(text: string): string {
  return text
    .replace(/(^|[\s([{—–-])"/g, "$1“").replace(/"/g, "”")
    .replace(/(^|[\s([{“—–-])'/g, "$1‘").replace(/'/g, "’");
}

interface Piece { text: string; small: boolean; width: number }
export interface Word { pieces: Piece[]; width: number }

/** A word's pieces: "LORD’s," -> L, ORD (small), ’s,. Only the whole words LORD and GOD. */
export function smallCapPieces(word: string): Omit<Piece, "width">[] {
  const match = /^(.*?)(?<![A-Za-z])(L|G)(ORD|OD)(?![A-Za-z])(.*)$/.exec(word);
  if (!match || (match[2] === "L") !== (match[3] === "ORD")) return [{ text: word, small: false }];
  return [{ text: match[1], small: false }, { text: match[2], small: false }, { text: match[3], small: true }, ...smallCapPieces(match[4])]
    .filter((piece) => piece.text);
}

/** The words of a text, measured; in the verse, LORD and GOD are split into small-capital pieces. */
export function measureWords(text: string, font: (small: boolean) => string, measure: Measure, smallCaps: boolean): Word[] {
  return text.split(" ").filter(Boolean).map((raw) => {
    const pieces = (smallCaps ? smallCapPieces(raw) : [{ text: raw, small: false }]).map((piece) => ({ ...piece, width: measure(piece.text, font(piece.small)) }));
    return { pieces, width: pieces.reduce((sum, piece) => sum + piece.width, 0) };
  });
}

/** Wraps words greedily into lines no wider than `width`; null when one word alone is wider. */
function greedy(words: Word[], space: number, width: number): Word[][] | null {
  const lines: Word[][] = [];
  let current: Word[] = [];
  let used = 0;
  for (const word of words) {
    if (word.width > width) return null;
    const next = current.length ? used + space + word.width : word.width;
    if (current.length && next > width) { lines.push(current); current = [word]; used = word.width; }
    else { current.push(word); used = next; }
  }
  if (current.length) lines.push(current);
  return lines;
}

/** The same number of lines as a greedy wrap, made as even as possible, so no word is left alone on the last line
 *  where moving one up fixes it. */
export function balancedWrap(words: Word[], space: number, width: number): Word[][] | null {
  const first = greedy(words, space, width);
  if (!first || first.length < 2) return first;
  let low = width * 0.4;
  let high = width;
  for (let step = 0; step < 14; step++) {
    const middle = (low + high) / 2;
    const lines = greedy(words, space, middle);
    if (lines && lines.length <= first.length) high = middle; else low = middle;
  }
  return greedy(words, space, high) ?? first;
}

interface Block { role: Role; lines: Word[][]; size: number; font: (small: boolean) => string; space: number; lineHeight: number }
type Item = { kind: "block"; block: Block } | { kind: "space"; height: number } | { kind: "drawing"; box: number } | { kind: "rule"; height: number };

function textBlock(role: Role, text: string, size: number, font: (small: boolean) => string, measure: Measure, width: number, maxLines: number, lineHeight = 1.3): Block | null {
  const words = measureWords(text, font, measure, role === "verse");
  const space = measure(" ", font(false));
  const lines = role === "verse" ? balancedWrap(words, space, width) : greedy(words, space, width);
  if (!lines || lines.length > maxLines) return null;
  return { role, lines, size, font, space, lineHeight };
}

const blockHeight = (block: Block) => block.lines.length * block.size * block.lineHeight;
const itemHeight = (item: Item) => (item.kind === "block" ? blockHeight(item.block) : item.kind === "drawing" ? item.box : item.height);
const stackHeight = (items: Item[]) => items.reduce((sum, item) => sum + itemHeight(item), 0);

/** The settled sizes of everything but the verse, for a verse letter size `size`; never under 30 px on a 1080-wide card. */
function companionSizes(card: CardSize, size: number) {
  const scale = card.width / 1080;
  const floor = Math.round(30 * scale);
  return { scale, footer: floor, heading: Math.max(floor, Math.round(size * 0.55)), reference: Math.max(floor, Math.round(size * 0.6)), line: Math.max(floor, Math.round(size * 0.55)) };
}

/** Room for heading-to-lines above the footer. */
const blockRoom = (size: CardSize, footer: number) => size.safe.h - footer * 2.4;

const hasTopDrawing = (card: ResolvedCard) => typeof card.ornament === "object" || card.ornament === "star" || card.ornament === "sprig";

/** Everything from heading to the visitor's lines at one verse letter size, top to bottom; null if it does not fit. */
function stackAt(card: ResolvedCard, size: CardSize, verseSize: number, measure: Measure): Item[] | null {
  const sizes = companionSizes(size, verseSize);
  const width = size.safe.w;
  const items: Item[] = [];
  const add = (block: Block | null) => { if (block) items.push({ kind: "block", block }); return block !== null; };
  if (card.heading) {
    if (!add(textBlock("heading", card.heading, sizes.heading, () => sansFont("600", sizes.heading), measure, width, 2))) return null;
    items.push({ kind: "space", height: verseSize * 0.5 });
  }
  if (hasTopDrawing(card)) items.push({ kind: "drawing", box: Math.round(verseSize * 1.1) }, { kind: "space", height: verseSize * 0.45 });
  const verseFonts = (small: boolean) => verseFont(card.look, small ? verseSize * SMALL_CAPS : verseSize);
  if (!add(textBlock("verse", printQuotes(card.text), verseSize, verseFonts, measure, width, 99, card.look.lettering === "bold" ? 1.2 : 1.35))) return null;
  if (card.ornament === "rule") {
    const rule = Math.max(2, Math.round(3 * sizes.scale));
    items.push({ kind: "space", height: verseSize * 0.55 }, { kind: "rule", height: rule }, { kind: "space", height: verseSize * 0.55 });
  } else items.push({ kind: "space", height: verseSize * 0.6 });
  if (!add(textBlock("reference", card.reference, sizes.reference, () => sansFont("600", sizes.reference), measure, width, 2))) return null;
  if (card.lines.length) items.push({ kind: "space", height: verseSize * 0.5 });
  for (const line of card.lines) {
    if (!add(textBlock("line", line, sizes.line, () => sansFont("italic 400", sizes.line), measure, width, 2, 1.35))) return null;
  }
  return stackHeight(items) <= blockRoom(size, sizes.footer) ? items : null;
}

/** A block's lines, each centred in the safe area, with every piece's own position. */
function placeLines(block: Block, top: number, safe: CardSize["safe"]): TextLine[] {
  const height = block.size * block.lineHeight;
  return block.lines.map((words, index) => {
    const width = words.reduce((sum, word) => sum + word.width, 0) + block.space * (words.length - 1);
    let x = safe.x + (safe.w - width) / 2;
    const runs: Run[] = [];
    words.forEach((word, at) => {
      if (at) x += block.space;
      for (const piece of word.pieces) {
        runs.push({ text: piece.text, x: round(x), font: block.font(piece.small) });
        x += piece.width;
      }
    });
    return { role: block.role, y: round(top + index * height + height / 2 + block.size * 0.34), width: round(width), runs };
  });
}

function drawingAt(card: ResolvedCard, centre: number, top: number, box: number): PlacedOrnament | null {
  const drawing = typeof card.ornament === "object" ? card.ornament : card.ornament === "star" || card.ornament === "sprig" ? { path: ORNAMENT_PATHS[card.ornament], viewBox: 100 } : null;
  return drawing ? { kind: "drawing", path: drawing.path, viewBox: drawing.viewBox, x: round(centre - box / 2), y: round(top), box } : null;
}

/** The stack placed top to bottom, centred in its room, and the footer at the bottom of the safe area. */
function arrange(card: ResolvedCard, size: CardSize, verseSize: number, items: Item[], measure: Measure): Omit<CardLayout, "fits"> {
  const { safe } = size;
  const footerSize = companionSizes(size, verseSize).footer;
  const footer = textBlock("footer", FOOTER, footerSize, () => sansFont("500", footerSize), measure, Number.MAX_SAFE_INTEGER, 1);
  const lines: TextLine[] = [];
  let ornament: PlacedOrnament | null = card.ornament === "sun" ? { kind: "sun", path: sunPath(size.width, size.height) } : null;
  let rule: CardLayout["rule"] = null;
  let top = safe.y + (blockRoom(size, footerSize) - stackHeight(items)) / 2;
  for (const item of items) {
    if (item.kind === "block") lines.push(...placeLines(item.block, top, safe));
    if (item.kind === "drawing") ornament = drawingAt(card, safe.x + safe.w / 2, top, item.box);
    if (item.kind === "rule") { const w = Math.round(verseSize * 1.6); rule = { x: round(safe.x + (safe.w - w) / 2), y: round(top), w, h: item.height }; }
    top += itemHeight(item);
  }
  if (footer) lines.push(...placeLines(footer, safe.y + safe.h - footerSize * 1.3, safe));
  return { size, verseSize, lines, ornament, rule };
}

/** Lays a resolved card out at one size. */
export function layoutResolved(card: ResolvedCard, size: CardSize, measure: Measure): CardLayout {
  const start = card.look.lettering === "bold" ? Math.round((size.start * 1.08) / 2) * 2 : size.start;
  for (let verseSize = start; verseSize >= size.min; verseSize -= 2) {
    const items = stackAt(card, size, verseSize, measure);
    if (items) return { ...arrange(card, size, verseSize, items, measure), fits: true };
  }
  return { ...arrange(card, size, size.min, [], measure), fits: false };
}

/** Lays a card out at one size. Throws, naming every problem, for a card that cannot be drawn (see cardProblems). */
export function layoutCard(spec: CardSpec, size: SizeId, measure: Measure): CardLayout {
  return layoutResolved(resolveCard(spec), SIZES[size], measure);
}

export interface SizeFit { id: SizeId; fits: boolean; verseSize: number }

/** Which sizes the card fits and at what letter size, and the size where its words look largest on a phone. */
export function fitSizes(spec: CardSpec, measure: Measure, sizes: readonly SizeId[] = SIZE_IDS): { fits: SizeFit[]; best: SizeId | null } {
  const card = resolveCard(spec);
  const fits = sizes.map((id) => { const layout = layoutResolved(card, SIZES[id], measure); return { id, fits: layout.fits, verseSize: layout.verseSize }; });
  const best = fits.filter((fit) => fit.fits).sort((a, b) => b.verseSize / SIZES[b.id].width - a.verseSize / SIZES[a.id].width)[0];
  return { fits, best: best?.id ?? null };
}
