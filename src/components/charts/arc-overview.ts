import type { SectionId } from "@/lib/types";

/** public/images/arcs/manifest.json, written by scripts/build-arc-images.mjs with the pictures. */
interface OverviewManifest {
  chapters: number;
  arcs: number;
  references: number;
  images: { file: string; width: number; ratio: number; base: number; background: string; colors: Record<SectionId, string> }[];
}

let manifest: Promise<OverviewManifest | null> | undefined;
const loadManifest = () => manifest ??= fetch("/images/arcs/manifest.json")
  .then((response) => response.ok ? response.json() as Promise<OverviewManifest> : Promise.reject(new Error(`HTTP ${response.status}`)))
  .catch((error: unknown) => { console.warn("arc overview: no manifest, drawing live", error); return null; });

/** The pre-drawn whole-Bible arcs for this width and these colours, or null to draw them live: when the pictures are
 *  missing, or were drawn from other cross-reference data or other colours than the page has now. The picture holds the
 *  arcs drawn `width` CSS pixels wide on the page colour `background`, from the top to just below their baseline `base`,
 *  without the chapter bar; it suits only a chart that sits on the page itself. */
export async function loadOverview(width: number, ratio: number, background: string, colors: Record<SectionId, string>, data: { chapters: number; arcs: number; references: number }): Promise<{ image: HTMLImageElement; width: number; base: number } | null> {
  const found = await loadManifest();
  if (!found || found.chapters !== data.chapters || found.arcs !== data.arcs || found.references !== data.references) return null;
  const same = (drawn: Record<SectionId, string>) => (Object.keys(drawn) as SectionId[]).every((id) => drawn[id].toLowerCase() === colors[id]?.toLowerCase());
  // The nearest pixel ratio, then the nearest width: the faint arcs add up differently at each ratio, and stretching a
  // picture changes how densely they overlap, so the pictures come in two ratios and eight widths.
  const pick = found.images.filter((item) => item.background.toLowerCase() === background.toLowerCase() && same(item.colors))
    .sort((a, b) => Math.abs(a.ratio - ratio) - Math.abs(b.ratio - ratio) || Math.abs(a.width - width) - Math.abs(b.width - width))[0];
  if (!pick) return null;
  const image = new Image();
  image.src = `/images/arcs/${pick.file}`;
  try {
    await image.decode();
    return { image, width: pick.width, base: pick.base };
  } catch (error) {
    console.warn(`arc overview: ${pick.file} could not be decoded, drawing live`, error);
    return null;
  }
}
