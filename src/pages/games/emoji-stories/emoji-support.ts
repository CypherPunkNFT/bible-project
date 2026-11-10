// Which emoji this device cannot draw (design §11.6). Each is drawn in black to a small hidden canvas: a real emoji
// comes out in colour, a missing one as a black box or nothing. An emoji with no colour counts as missing only when it
// is also as wide as the box drawn for a code point no font has, so a grey one that does draw is never blanked.
// A control emoji every emoji font has is tried first; if even it shows no colour (no canvas, a blocked or noisy
// canvas, a black-and-white font), nothing is reported missing and the emoji are assumed to draw.
const CONTROL = "😀";
const NO_GLYPH = "\u{10FFFD}";
const SIZE = 32;
const known = new Map<string, boolean>();
let reliable: boolean | null = null;

function drawsInColour(context: CanvasRenderingContext2D, emoji: string): boolean {
  context.clearRect(0, 0, SIZE, SIZE);
  context.fillText(emoji, 0, 0);
  const { data } = context.getImageData(0, 0, SIZE, SIZE);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0 && (Math.abs(data[i] - data[i + 1]) > 24 || Math.abs(data[i + 1] - data[i + 2]) > 24)) return true;
  }
  return false;
}

/** The drawn width of the text, or null where the canvas cannot measure it. */
function widthOf(context: CanvasRenderingContext2D, text: string): number | null {
  return typeof context.measureText === "function" ? context.measureText(text).width : null;
}

function canvasContext(): CanvasRenderingContext2D | null {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
  if (!context) return null;
  context.textBaseline = "top";
  context.fillStyle = "#000";
  context.font = `${SIZE - 4}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  return context;
}

/** The emoji of `list` this device cannot draw; empty when it cannot tell. */
export function missingEmoji(list: readonly string[]): Set<string> {
  const missing = new Set<string>();
  if (reliable === false) return missing;
  try {
    const unknown = list.filter((emoji) => !known.has(emoji));
    if (unknown.length) {
      const context = canvasContext();
      if (!context) return missing;
      if (reliable === null) reliable = drawsInColour(context, CONTROL);
      if (!reliable) return missing;
      const boxWidth = widthOf(context, NO_GLYPH);
      for (const emoji of unknown) {
        const width = widthOf(context, emoji);
        const asWideAsTheBox = boxWidth !== null && width !== null && Math.abs(width - boxWidth) <= 1;
        known.set(emoji, drawsInColour(context, emoji) || (boxWidth !== null && !asWideAsTheBox));
      }
    }
  } catch (error) {
    console.warn("Emoji stories: could not test which emoji draw; assuming they all do", error);
    reliable = false;
    return missing;
  }
  for (const emoji of list) if (known.get(emoji) === false) missing.add(emoji);
  return missing;
}

/** For tests: forget every answer. */
export function resetEmojiSupport(): void {
  known.clear();
  reliable = null;
}
