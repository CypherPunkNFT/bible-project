import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import map from "@/data/atlas-map.json";
import { sectionColor } from "@/lib/sections";
import type { MapPlace } from "./projection";


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

interface Props {
  places: MapPlace[];
  selected: MapPlace | null;
  onSelect: (place: MapPlace) => void;
}

/** The biblical world: land pre-drawn at build time, places as dots sized by how often they are named. */
export function AtlasMap({ places, selected, onSelect }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const behaviour = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<MapPlace | null>(null);
  const ranked = useMemo(() => [...places].sort((a, b) => b.verses.length - a.verses.length), [places]);

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const zoomer = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 40])
      // A margin beyond the drawn frame so places at its edge (Tarshish, Spain, India) can be centred.
      .translateExtent([
        [-map.width * 0.6, -map.height * 0.6],
        [map.width * 1.6, map.height * 1.6],
      ])
      .on("zoom", (event) => setTransform({ k: event.transform.k, x: event.transform.x, y: event.transform.y }));
    behaviour.current = zoomer;
    select(element).call(zoomer);
    return () => {
      select(element).on(".zoom", null);
    };
  }, []);

  // Fly to a place chosen from the list or a link.
  useEffect(() => {
    if (!selected || !svg.current || !behaviour.current) return;
    const k = Math.max(transform.k, 6);
    const target = zoomIdentity.translate(map.width / 2 - selected.x * k, map.height / 2 - selected.y * k).scale(k);
    select(svg.current).transition().duration(750).call(behaviour.current.transform, target);
    // Only when the selection changes, not on every zoom step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const zoomBy = (factor: number) => svg.current && behaviour.current && select(svg.current).transition().duration(300).call(behaviour.current.scaleBy, factor);
  const reset = () => svg.current && behaviour.current && select(svg.current).transition().duration(500).call(behaviour.current.transform, zoomIdentity);

  const { k } = transform;
  const labelled = useMemo(() => placeLabels(ranked, k, selected?.id), [ranked, k, selected?.id]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-[color-mix(in_srgb,var(--history)_30%,var(--surface))]">
      <svg ref={svg} viewBox={`0 0 ${map.width} ${map.height}`} className="block h-auto w-full touch-none" role="img" aria-label="Map of places named in the Bible">
        <g transform={`translate(${transform.x},${transform.y}) scale(${k})`}>
          <path d={map.land} fill="var(--surface)" stroke="var(--line)" strokeWidth={0.6 / k} />
          {ranked
            .slice()
            .reverse()
            .map((place) => {
              const radius = (1.2 + Math.sqrt(place.verses.length) * 0.28) / Math.sqrt(k);
              const isSelected = selected?.id === place.id;
              return (
                <circle
                  key={place.id}
                  cx={place.x}
                  cy={place.y}
                  r={isSelected ? radius * 1.6 : radius}
                  fill={place.confidence >= 0.5 ? sectionColor(place.section) : "var(--surface)"}
                  stroke={place.confidence >= 0.5 ? "var(--surface)" : sectionColor(place.section)}
                  strokeWidth={(isSelected ? 2 : 0.6) / k}
                  fillOpacity={0.88}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(place)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect(place)}
                >
                  <title>{`${place.name} — named in ${place.verses.length} verses`}</title>
                </circle>
              );
            })}
          {ranked
            .filter((p) => labelled.has(p.id) || p.id === hover?.id)
            .map((place) => (
              <text
                key={`label-${place.id}`}
                x={place.x + 5 / k}
                y={place.y + 3 / k}
                fontSize={11 / k}
                className="pointer-events-none select-none fill-ink font-sans"
                style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 / k, fontWeight: place.id === selected?.id ? 700 : 500 }}
              >
                {place.name}
              </text>
            ))}
        </g>
      </svg>
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
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
      <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-muted">Scroll or pinch to zoom · drag to move · hollow dots = uncertain location</p>
    </div>
  );
}
