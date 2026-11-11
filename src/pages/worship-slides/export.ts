// Getting the slides out of the browser: one picture, every picture in a zip, or the PowerPoint file. All of it is made
// here, on the visitor's own device; nothing is uploaded. One canvas is reused for every full-size picture so a long
// passage never holds hundreds of 1920 × 1080 canvases at once, and the long jobs stop as soon as `stillWanted` says the
// visitor changed something.
import { useEffect, useState } from "react";
import { canvasPng, drawSlide } from "./draw";
import { fontString, type SlideLayout } from "./layout";
import type { FontChoice, Theme } from "./templates";
import { makeZip, type ZipEntry } from "./zip";

/** A file name from a reference the page has already read: "Psalm 23:1–6" -> "Psalm-23-1-6". */
export function fileStem(reference: string): string {
  // eslint-disable-next-line no-control-regex
  const stem = reference.normalize("NFKD").replace(/[\u0000-\u001F\\/:*?"<>|–—]+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return (stem || "slides").slice(0, 60);
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

export interface PictureSettings { theme: Theme; font: FontChoice; width: number; height: number }

/** One slide as a full-size PNG, drawn on `canvas`. */
export function slidePicture(canvas: HTMLCanvasElement, layout: SlideLayout, settings: PictureSettings): Promise<Blob> {
  canvas.width = settings.width;
  canvas.height = settings.height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("worship slides: this browser cannot draw on a canvas"));
  drawSlide(context, layout, settings.theme, settings.font, settings.width, settings.height, 1);
  return canvasPng(canvas);
}

/** Every slide as a PNG in one zip ("01 Psalm 23.png", …), or null when the visitor changed something meanwhile. */
export async function picturesZip(layouts: readonly SlideLayout[], names: readonly string[], settings: PictureSettings, stillWanted: () => boolean): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const entries: ZipEntry[] = [];
  try {
    for (let i = 0; i < layouts.length; i++) {
      if (!stillWanted()) return null;
      const picture = await slidePicture(canvas, layouts[i], settings);
      entries.push({ name: names[i], data: new Uint8Array(await picture.arrayBuffer()) });
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
  return stillWanted() ? new Blob(makeZip(entries) as BlobPart[], { type: "application/zip" }) : null;
}

/** The picture names in a zip, in slide order: "01-Psalm-23-1.png". */
export function pictureNames(references: readonly string[]): string[] {
  const digits = String(references.length).length;
  const used = new Set<string>();
  return references.map((reference, i) => {
    let name = `${String(i + 1).padStart(Math.max(2, digits), "0")}-${fileStem(reference)}.png`;
    if (used.has(name)) name = name.replace(/\.png$/, `-${i + 1}.png`);
    used.add(name);
    return name;
  });
}

/** True once the fonts a slide is drawn in have loaded, or after three seconds whatever happened: the slides are then
 *  drawn with what the browser has rather than never. */
export function useFontsReady(font: FontChoice): boolean {
  const faces = [fontString(font, 64), fontString(font, 64, Math.max(font.canvas.weight, 600)), fontString(font, 64, Math.max(font.canvas.weight, 500))];
  const key = faces.join("|");
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) { setReady(key); return; }
    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 3000));
    const loading = Promise.all(key.split("|").map((face) => fonts.load(face, "The LORD is my shepherd 123")))
      .catch((error: unknown) => console.warn(`worship slides: a font did not load (${key}); drawing with what loaded`, error));
    void Promise.race([loading, timeout]).finally(() => { if (current) setReady(key); });
    return () => { current = false; };
  }, [key]);
  return ready === key;
}
