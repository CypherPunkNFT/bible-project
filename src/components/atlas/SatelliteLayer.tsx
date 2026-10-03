import { useState } from "react";
import map from "@/data/atlas-map.json";
import { DETAIL_FROM, overlaps, overview, preview, tiles, type Layer, type View } from "./imagery";

/** Width of the soft edge, in map units (the map is 1000 wide). */
const FADE = 26;

/**
 * NASA Blue Marble under the places: a light preview at once, the whole-area overview over it when loaded,
 * and — once zoomed in — only the close-up tiles the view touches (a tile once shown stays, so panning back
 * costs nothing). The edges fade into the dark surround instead of ending in a hard box. If no picture
 * loads, the drawn land outline stands in.
 */
export function SatelliteLayer({ view }: { view: View }) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState(false);
  const [wanted, setWanted] = useState<Set<string>>(new Set());
  if (view.k >= DETAIL_FROM) {
    const visible = tiles.filter((tile) => overlaps(tile, view) && !wanted.has(tile.file));
    if (visible.length) setWanted(new Set([...wanted, ...visible.map((tile) => tile.file)]));
  }

  // Tiles get half a map unit of overlap so no hairline seam shows between neighbours.
  const picture = (layer: Layer | undefined, visible: boolean, bleed = 0) =>
    layer && (
      <image
        key={layer.file}
        href={layer.file}
        x={layer.x - bleed}
        y={layer.y - bleed}
        width={layer.width + 2 * bleed}
        height={layer.height + 2 * bleed}
        preserveAspectRatio="none"
        opacity={visible ? 1 : 0}
        style={{ transition: "opacity 400ms ease" }}
        onLoad={() => setLoaded((state) => ({ ...state, [layer.file]: true }))}
        onError={() => layer.role === "preview" && setFailed(true)}
      />
    );

  return (
    <>
      <defs>
        <filter id="edge-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={FADE / 2.5} />
        </filter>
        <mask id="edge-fade" maskUnits="userSpaceOnUse" x={0} y={0} width={map.width} height={map.height}>
          <rect x={FADE} y={FADE} width={map.width - 2 * FADE} height={map.height - 2 * FADE} fill="#fff" filter="url(#edge-blur)" />
        </mask>
        <linearGradient id="land-tone" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={map.height}>
          <stop offset="0.15" stopColor="var(--land-north)" />
          <stop offset="0.55" stopColor="var(--land-mid)" />
          <stop offset="0.9" stopColor="var(--land-south)" />
        </linearGradient>
      </defs>
      <g mask="url(#edge-fade)">
        <rect width={map.width} height={map.height} fill="var(--sea)" />
        {failed ? (
          <path d={map.land} fill="url(#land-tone)" stroke="var(--coast)" strokeWidth={0.7} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        ) : (
          <>
            {picture(preview, true)}
            {overview && picture(overview, !!loaded[overview.file])}
            {tiles.filter((tile) => wanted.has(tile.file)).map((tile) => picture(tile, !!loaded[tile.file], 0.5))}
          </>
        )}
      </g>
    </>
  );
}
