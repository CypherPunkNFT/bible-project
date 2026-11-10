// Making the full-size picture (design 3.3): wait for the lettering, lay out, draw on one reused canvas, PNG out. No
// React here, so the link-preview script's small bundle can import it; the page's hook is in use-card-picture.ts.
// Renders run one after another, because they share the canvas.
import { canvasMeasure, canvasPng, fileStem, loadFaces } from "./canvas";
import { drawCard } from "./draw";
import { CARD_FACES, FOOTER, layoutResolved } from "./layout";
import { SIZES, type SizeId } from "./sizes";
import { resolveCard, type CardSpec, type ResolvedCard } from "./spec";

export interface CardPicture { blob: Blob; fileName: string; width: number; height: number }

/** "John-3-16-Bible-Guide.png". */
export const pictureName = (reference: string) => `${fileStem(reference)}-Bible-Guide.png`;

/** Every letter a card will draw, for asking the fonts for exactly those. */
export const cardLetters = (card: ResolvedCard) => [card.heading ?? "", card.text, card.reference, ...card.lines, FOOTER].join(" ");

/** True once the card's fonts have loaded with its letters, or false after three seconds (the card is then drawn with
 *  what loaded, never half in one font and half in another). */
export const cardFontsReady = (card: ResolvedCard, limitMs = 3000) => loadFaces(CARD_FACES, cardLetters(card), limitMs);

let shared: HTMLCanvasElement | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function renderNow(spec: CardSpec, size: SizeId): Promise<CardPicture> {
  const card = resolveCard(spec);
  await cardFontsReady(card);
  const dimensions = SIZES[size];
  shared ??= document.createElement("canvas");
  const canvas = shared;
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(`verse card: this browser cannot draw the ${size} card on a canvas`);
  const layout = layoutResolved(card, dimensions, canvasMeasure(context));
  if (!layout.fits) throw new Error(`verse card: ${card.reference} is too long for the ${size} card even at ${dimensions.min} px`);
  drawCard(context, layout, card.look, 1);
  const blob = await canvasPng(canvas, size);
  return { blob, fileName: pictureName(card.reference), width: dimensions.width, height: dimensions.height };
}

/** The card as a full-size PNG, or an error naming the size and what failed. */
export function renderCard(spec: CardSpec, size: SizeId): Promise<CardPicture> {
  const run = queue.then(() => renderNow(spec, size));
  queue = run.catch(() => undefined);
  return run;
}

/** Lets the shared canvas go (the worship slides' habit on a phone short of memory). */
export function releaseCanvas(): void {
  if (!shared) return;
  shared.width = 0;
  shared.height = 0;
  shared = null;
}
