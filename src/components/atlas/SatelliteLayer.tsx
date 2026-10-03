import { useState } from "react";
import imagery from "@/data/atlas-imagery.json";
import map from "@/data/atlas-map.json";

/** Zoom level at which the close-up core picture is worth fetching (it is ~6 MB). */
const DETAIL_FROM = 1.6;
/** Width of the soft edge, in map units (the map is 1000 wide). */
const FADE = 26;

type Layer = (typeof imagery)[number];
const byRole = (role: string): Layer | undefined => imagery.find((layer) => layer.role === role);

/**
 * NASA Blue Marble under the places: a light preview at once, the whole-area overview over it when loaded,
 * and the sharp core (Italy to Persia) only once someone zooms in. The edges fade into the dark surround
 * instead of ending in a hard box. If no picture loads, the drawn land outline stands in.
 */
export function SatelliteLayer({ k }: { k: number }) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState(false);
  const [wantDetail, setWantDetail] = useState(false);
  if (k >= DETAIL_FROM && !wantDetail) setWantDetail(true);
  const preview = byRole("preview");
  const overview = byRole("overview");
  const detail = byRole("detail");

  const picture = (layer: Layer | undefined, visible: boolean) =>
    layer && (
      <image
        href={layer.file}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        preserveAspectRatio="none"
        opacity={visible ? 1 : 0}
        style={{ transition: "opacity 400ms ease" }}
        onLoad={() => setLoaded((state) => ({ ...state, [layer.role]: true }))}
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
          <path d={map.land} fill="url(#land-tone)" stroke="var(--coast)" strokeWidth={0.7 / k} strokeLinejoin="round" />
        ) : (
          <>
            {picture(preview, true)}
            {picture(overview, !!loaded.overview)}
            {wantDetail && picture(detail, !!loaded.detail)}
          </>
        )}
      </g>
    </>
  );
}
