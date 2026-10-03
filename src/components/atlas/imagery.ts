import imagery from "@/data/atlas-imagery.json";

/** The visible part of the map, in map units, at the zoom the map last settled at. */
export interface View {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  k: number;
}

/** Zoom level from which close-up tiles are worth fetching. */
export const DETAIL_FROM = 1.6;

export type Layer = (typeof imagery)[number];
export const preview = imagery.find((layer) => layer.role === "preview");
export const overview = imagery.find((layer) => layer.role === "overview");
export const tiles = imagery.filter((layer) => layer.role === "tile");

export const overlaps = (layer: Layer, view: View) => layer.x < view.x1 && layer.x + layer.width > view.x0 && layer.y < view.y1 && layer.y + layer.height > view.y0;

/**
 * Fetch and decode the close-up tiles a view will need, so a fly-to can land on sharp imagery.
 * Resolves when they are ready (the browser cache then serves the <image> elements instantly).
 */
export function preloadTilesFor(view: View): Promise<unknown> {
  if (view.k < DETAIL_FROM) return Promise.resolve();
  return Promise.all(
    tiles
      .filter((tile) => overlaps(tile, view))
      .map((tile) => {
        const image = new Image();
        image.src = tile.file;
        return image.decode().catch((error: unknown) => console.warn(`atlas: tile ${tile.file} did not preload`, error));
      }),
  );
}
