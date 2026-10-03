import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import map from "@/data/atlas-map.json";
import { sectionColor } from "@/lib/sections";
import { cn } from "@/lib/utils";
import type { MapPlace } from "./projection";
import { preloadTilesFor, type View } from "./imagery";
import { SatelliteLayer } from "./SatelliteLayer";

/**
 * Greedy label placement: the most-named places first; a label is skipped when its box would overlap
 * one already placed. Boxes are in map units at the current zoom, so zooming in reveals more names.
 */
function placeLabels(ranked: MapPlace[], k: number, selectedId: string | undefined): Set<string> {
  const boxes: [number, number, number, number][] = [];
  const chosen = new Set<string>();
  const ordered = selectedId ? [...ranked.filter((p) => p.id === selectedId), ...ranked.filter((p) => p.id !== selectedId)] : ranked;
  for (const place of ordered.slice(0, 400)) {
    const x = place.x + 5 / k;
    const box: [number, number, number, number] = [x, place.y - 9 / k, x + (place.name.length * 6.2) / k, place.y + 4 / k];
    if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    boxes.push(box);
    chosen.add(place.id);
    if (chosen.size >= 18 * k) break;
  }
  return chosen;
}

const FLY_MS = 1100;
const FLY_ZOOM = 6;
/** The fly starts once the panel has slid in … */
const PANEL_IN_MS = 380;
/** … and the destination's sharp tiles are ready — but never waits longer than this for them. */
const MAX_WAIT_MS = 700;

interface Props {
  places: MapPlace[];
  selected: MapPlace | null;
  onSelect: (place: MapPlace) => void;
  /** the place panel, drawn over the right of the map on wide screens (it slides in while the map flies) */
  overlay?: ReactNode;
  /** share of the map's width the overlay covers, so a chosen place is centred in the part still visible */
  coveredFraction?: number;
}

/**
 * The biblical world on NASA imagery. Smoothness rules: while the map moves, frames only rewrite one
 * transform attribute and one CSS variable (dots keep their on-screen size through `--sk`, outlines through
 * non-scaling strokes) — React re-renders only when a move ends, to place labels and choose detail tiles.
 */
export function AtlasMap({ places, selected, onSelect, overlay, coveredFraction = 0 }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const layer = useRef<SVGGElement>(null);
  const behaviour = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [settled, setSettled] = useState<ZoomTransform>(zoomIdentity);
  const [moving, setMoving] = useState(false);
  const [hover, setHover] = useState<MapPlace | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const ranked = useMemo(() => [...places].sort((a, b) => b.verses.length - a.verses.length), [places]);

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const apply = (t: ZoomTransform) => {
      layer.current?.setAttribute("transform", t.toString());
      element.style.setProperty("--sk", String(Math.sqrt(t.k)));
      element.style.setProperty("--k", String(t.k));
    };
    const zoomer = zoom<SVGSVGElement, unknown>()
      // Fully zoomed out = the whole area (every place) exactly fills the map; no dragging past its edges.
      .scaleExtent([1, 16])
      .translateExtent([
        [0, 0],
        [map.width, map.height],
      ])
      .on("start", () => setMoving(true))
      .on("zoom", (event: { transform: ZoomTransform }) => apply(event.transform))
      .on("end", (event: { transform: ZoomTransform }) => {
        setSettled(event.transform);
        setMoving(false);
      });
    behaviour.current = zoomer;
    apply(zoomIdentity);
    select(element).call(zoomer);
    return () => {
      select(element).on(".zoom", null);
    };
  }, []);

  // A chosen place, in three beats: its dot pulses and its name shows at once; the panel slides in while the
  // close-up tiles for the destination load; then the map flies (d3's smooth zoom: out a little, across,
  // in) and lands on sharp imagery, centred in the part of the map the panel leaves visible.
  useEffect(() => {
    const element = svg.current;
    const zoomer = behaviour.current;
    if (!selected || !element || !zoomer) return;
    const centreX = (map.width * (1 - coveredFraction)) / 2;
    const target = zoomIdentity.translate(centreX - selected.x * FLY_ZOOM, map.height / 2 - selected.y * FLY_ZOOM).scale(FLY_ZOOM);
    const destination: View = {
      x0: -target.x / FLY_ZOOM,
      y0: -target.y / FLY_ZOOM,
      x1: (map.width - target.x) / FLY_ZOOM,
      y1: (map.height - target.y) / FLY_ZOOM,
      k: FLY_ZOOM,
    };
    let cancelled = false;
    const panelIn = new Promise((resolve) => window.setTimeout(resolve, PANEL_IN_MS));
    const tilesReady = Promise.race([preloadTilesFor(destination), new Promise((resolve) => window.setTimeout(resolve, MAX_WAIT_MS))]);
    void Promise.all([panelIn, tilesReady]).then(() => {
      if (!cancelled) select(element).transition().duration(FLY_MS).call(zoomer.transform, target);
    });
    return () => {
      cancelled = true;
    };
    // Only when the selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const animate = useCallback((run: (element: SVGSVGElement, zoomer: ZoomBehavior<SVGSVGElement, unknown>) => void) => {
    if (svg.current && behaviour.current) run(svg.current, behaviour.current);
  }, []);
  const zoomBy = (factor: number) => animate((element, zoomer) => select(element).transition().duration(450).call(zoomer.scaleBy, factor));
  const reset = () => animate((element, zoomer) => select(element).transition().duration(FLY_MS).call(zoomer.transform, zoomIdentity));

  const k = settled.k;
  const view: View = { x0: -settled.x / k, y0: -settled.y / k, x1: (map.width - settled.x) / k, y1: (map.height - settled.y) / k, k };
  const labelled = useMemo(() => placeLabels(ranked, k, selected?.id), [ranked, k, selected?.id]);

  // The dots never depend on the zoom level (their size follows --sk in CSS), so they render once per
  // place list / selection, not on every move.
  const dots = useMemo(
    () =>
      ranked
        .slice()
        .reverse()
        .map((place) => {
          const isSelected = selected?.id === place.id;
          const base = (1.2 + Math.sqrt(place.verses.length) * 0.28) * (isSelected ? 1.6 : 1);
          return (
            <circle
              key={place.id}
              cx={place.x}
              cy={place.y}
              style={{ r: `calc(${base.toFixed(2)}px / var(--sk, 1))` } as CSSProperties}
              // On satellite imagery a white ring keeps every dot visible over sea, sand or green land;
              // uncertain locations are hollow (white ring, see-through middle).
              fill={place.confidence >= 0.5 ? sectionColor(place.section) : "rgba(255,255,255,0.18)"}
              stroke="#fff"
              strokeWidth={isSelected ? 2.4 : 1.1}
              vectorEffect="non-scaling-stroke"
              fillOpacity={0.95}
              className="cursor-pointer"
              onMouseEnter={() => setHover(place)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectRef.current(place)}
            >
              <title>{`${place.name} — named in ${place.verses.length} verses`}</title>
            </circle>
          );
        }),
    [ranked, selected?.id],
  );

  return (
    <figure>
      <div className="relative overflow-hidden rounded-xl border border-line bg-[#1c1e21]">
        <svg ref={svg} viewBox={`0 0 ${map.width} ${map.height}`} className="block h-auto w-full touch-none" role="img" aria-label="Map of places named in the Bible">
          <g ref={layer}>
            <SatelliteLayer view={view} />
            {dots}
            {selected && (
              <g key={`pulse-${selected.id}`} className="pointer-events-none">
                {/* A ring ripples out from the chosen dot (twice), and its name stays up while the map flies. */}
                <circle cx={selected.x} cy={selected.y} className="atlas-pulse" style={{ r: "calc(7px / var(--sk, 1))" } as CSSProperties} fill="none" stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                <text
                  x={selected.x}
                  y={selected.y}
                  dx="0.6em"
                  dy="0.35em"
                  className="atlas-name-in select-none font-sans"
                  vectorEffect="non-scaling-stroke"
                  style={{ fill: "#fff", paintOrder: "stroke", stroke: "rgba(0,0,0,0.8)", strokeWidth: 3, fontWeight: 700, fontSize: "calc(13px / var(--k, 1))" } as CSSProperties}
                >
                  {selected.name}
                </text>
              </g>
            )}
            {/* Labels are placed for the zoom the map settles at; they fade out while it moves. */}
            <g className={cn("transition-opacity duration-300", moving ? "opacity-0" : "opacity-100")}>
              {ranked
                .filter((p) => (labelled.has(p.id) || p.id === hover?.id) && p.id !== selected?.id)
                .map((place) => (
                  <text
                    key={`label-${place.id}`}
                    x={place.x + 5 / k}
                    y={place.y + 3 / k}
                    fontSize={11 / k}
                    className="pointer-events-none select-none font-sans"
                    style={{ fill: "#fff", paintOrder: "stroke", stroke: "rgba(0,0,0,0.78)", strokeWidth: 3 / k, fontWeight: place.id === selected?.id ? 700 : 500 }}
                  >
                    {place.name}
                  </text>
                ))}
            </g>
          </g>
        </svg>
        <div className="absolute left-3 top-3 flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
          <button type="button" onClick={() => zoomBy(1.8)} className="p-2 hover:bg-surface-2" aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => zoomBy(1 / 1.8)} className="border-t border-line p-2 hover:bg-surface-2" aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={reset} className="border-t border-line p-2 hover:bg-surface-2" aria-label="Show the whole map">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        {overlay}
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        Scroll or pinch to zoom · drag to move · hollow dots = uncertain location. Satellite imagery: NASA Blue Marble (public domain).
      </figcaption>
    </figure>
  );
}
