// The canvas, file and font helpers the generator needs. They follow the worship slides' own (src/pages/worship-slides/
// draw.ts and export.ts), copied rather than imported so the generator and the link-preview script's small bundle stand
// on their own, and so a failure names the verse card rather than another feature.

/** Width of `text` in a CSS font string such as `400 64px "Literata Variable"`. */
export type Measure = (text: string, font: string) => number;

/** A measure backed by a canvas context, remembering each word's width per font (a card measures the same words many
 *  times while it shrinks to fit). Without a context, a letter is half its size: tests and very old browsers. */
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

/** The canvas as a PNG, or an error naming the size that failed (some browsers refuse very large canvases). */
export function canvasPng(canvas: HTMLCanvasElement, what: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`verse card: the browser made no picture from the ${what} canvas (${canvas.width} × ${canvas.height})`))), "image/png");
    } catch (error) {
      reject(new Error(`verse card: the ${what} canvas could not be turned into a picture: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}

/** A file name from a reference: "Proverbs 3:5–6" -> "Proverbs-3-5-6". */
export function fileStem(reference: string): string {
  // eslint-disable-next-line no-control-regex
  const stem = reference.normalize("NFKD").replace(/[\u0000-\u001F\\/:*?"<>|–—]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return (stem || "verse").slice(0, 60);
}

/** Hands a file to the browser's download. The address is let go a minute later: Safari drops a download whose address
 *  is revoked at once. */
export function saveFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Waits until every font face has loaded with these very letters, or `limitMs` passes. True when all loaded. Canvas
 *  drawing does not ask for a font by itself, so each face is asked for by name. */
export async function loadFaces(faces: readonly string[], text: string, limitMs = 3000): Promise<boolean> {
  const fonts = typeof document === "undefined" ? undefined : (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts) return true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), limitMs); });
  const sample = text.slice(0, 400) || "Berean Standard Bible";
  const loading = Promise.all(faces.map((face) => fonts.load(face, sample)))
    .then(() => true)
    .catch((error: unknown) => { console.warn(`verse card: a font did not load (${faces.join(" | ")}); drawing with what loaded`, error); return false; });
  try {
    return await Promise.race([loading, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
