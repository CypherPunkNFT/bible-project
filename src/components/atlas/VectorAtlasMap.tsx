import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { ArrowUpRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { OutsideScroll } from "@/components/OutsideScroll";
import map from "@/data/atlas-map.json";
import { sectionColor } from "@/lib/sections";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { projectPlace, type MapPlace } from "./projection";
import { groupPlaces, labelGroups, type PlaceGroup } from "./vector-layout";
import "./vector-atlas.css";

// Allow close inspection of dense city groups; marker sizes remain constant on screen.
const MAX_ZOOM = 8192;
const coordinate = (lon: number, lat: number) => projectPlace({ lon, lat } as MapPlace);
const PRESETS = [
  { name: "Biblical world", point: [map.width / 2, map.height / 2], scale: 0 },
  { name: "Holy Land", point: coordinate(35.2, 31.7), scale: 12 },
  { name: "Galilee", point: coordinate(35.4, 32.8), scale: 42 },
];

interface Props {
  places: MapPlace[];
  selected: MapPlace | null;
  onSelect: (place: MapPlace) => void;
  overlay?: ReactNode;
  coveredFraction?: number;
}

/** Experimental vector atlas. Kept separate from the current satellite atlas for comparison. */
export function VectorAtlasMap({ places, selected, onSelect, overlay, coveredFraction = 0 }: Props) {
  const canvas = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const layer = useRef<SVGGElement>(null);
  const behaviour = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const current = useRef(zoomIdentity);
  const [size, setSize] = useState({ width: 1000, height: 560 });
  const [view, setView] = useState<ZoomTransform>(zoomIdentity);
  const [moving, setMoving] = useState(false);
  const [activeRegion, setActiveRegion] = useState("Holy Land");
  const [opened, setOpened] = useState<PlaceGroup | null>(null);
  const [groupQuery, setGroupQuery] = useState("");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const minZoom = Math.min(size.width / map.width, size.height / map.height);
  const visibleWidth = size.width * (1 - coveredFraction);

  useLayoutEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const zoomer = zoom<SVGSVGElement, unknown>().extent([[0, 0], [size.width, size.height]])
      .scaleExtent([minZoom, MAX_ZOOM]).translateExtent([[0, 0], [map.width, map.height]])
      .on("start", () => setMoving(true))
      .on("zoom", (event: { transform: ZoomTransform }) => {
        current.current = event.transform;
        layer.current?.setAttribute("transform", event.transform.toString());
        element.style.setProperty("--atlas-k", String(event.transform.k));
      })
      .on("end", (event: { transform: ZoomTransform }) => { setView(event.transform); setMoving(false); });
    behaviour.current = zoomer;
    select(element).call(zoomer);
    return () => { select(element).interrupt().on(".zoom", null); };
  }, [size.width, size.height, minZoom]);

  const fly = useCallback((x: number, y: number, scale: number) => {
    if (!svg.current || !behaviour.current) return;
    const k = Math.max(minZoom, Math.min(MAX_ZOOM, scale));
    const target = zoomIdentity.translate(visibleWidth / 2 - x * k, size.height / 2 - y * k).scale(k);
    select(svg.current).interrupt().transition().duration(reducedMotion ? 0 : 550).call(behaviour.current.transform, target);
  }, [minZoom, visibleWidth, size.height, reducedMotion]);

  // Retain the reader's chosen place or region when the panel or viewport changes size.
  useEffect(() => {
    if (selected) { fly(selected.x, selected.y, Math.max(24, current.current.k)); setOpened(null); }
    else {
      const preset = PRESETS.find((p) => p.name === activeRegion);
      if (preset) fly(preset.point[0], preset.point[1], preset.scale || minZoom);
    }
  }, [selected?.id, fly]); // eslint-disable-line react-hooks/exhaustive-deps

  const previousPlaces = useRef(places);
  useEffect(() => {
    if (previousPlaces.current === places) return;
    previousPlaces.current = places;
    setOpened(null);
    if (!places.length) return;
    const xs = places.map((p) => p.x), ys = places.map((p) => p.y);
    const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
    const k = Math.min((visibleWidth - 72) / Math.max(2, right - left), (size.height - 72) / Math.max(2, bottom - top), 48);
    fly((left + right) / 2, (top + bottom) / 2, k);
    setActiveRegion("");
  }, [places, fly, visibleWidth, size.height]);

  const groups = useMemo(() => groupPlaces(places, view, visibleWidth, size.height, selected?.id), [places, view, visibleWidth, size.height, selected?.id]);
  const labels = useMemo(() => labelGroups(groups, visibleWidth, size.height), [groups, visibleWidth, size.height]);
  const zoomBy = (factor: number) => {
    if (!svg.current || !behaviour.current) return;
    setActiveRegion("");
    select(svg.current).interrupt().transition().duration(reducedMotion ? 0 : 350).call(behaviour.current.scaleBy, factor, [visibleWidth / 2, size.height / 2]);
  };
  const pick = (group: PlaceGroup) => {
    if (group.members.length === 1) { setOpened(null); onSelect(group.place); }
    else { setGroupQuery(""); setOpened(group); }
  };

  return <figure className="vector-atlas">
    <div className="vector-atlas-frame">
      <div className="vector-atlas-toolbar">
        <div role="group" aria-label="Map region" className="vector-region-buttons">
          {PRESETS.map((preset) => <button key={preset.name} type="button" aria-pressed={activeRegion === preset.name} onClick={() => { setActiveRegion(preset.name); setOpened(null); fly(preset.point[0], preset.point[1], preset.scale || minZoom); }}>{preset.name}</button>)}
        </div>
        <div className="vector-zoom-buttons">
          <button type="button" onClick={() => zoomBy(1 / 1.8)} disabled={view.k <= minZoom + .01} aria-label="Zoom out"><Minus size={16} /></button>
          <span aria-label="Zoom level">{Math.round(view.k / minZoom)}×</span>
          <button type="button" onClick={() => zoomBy(1.8)} disabled={view.k >= MAX_ZOOM - .01} aria-label="Zoom in"><Plus size={16} /></button>
          <button type="button" aria-label="Reset map view" onClick={() => { setActiveRegion("Holy Land"); setOpened(null); fly(PRESETS[1].point[0], PRESETS[1].point[1], PRESETS[1].scale); }}><RotateCcw size={15} /></button>
        </div>
      </div>
      <div ref={canvas} className="vector-atlas-canvas">
        <svg ref={svg} viewBox={`0 0 ${size.width} ${size.height}`} className="vector-atlas-svg" aria-label="Vector map of biblical places" role="group" data-zoom={view.k.toFixed(2)}>
          <defs><linearGradient id="vector-land" x1="0" y1="0" x2="0.5" y2="1"><stop stopColor="var(--vector-land)" /><stop offset="1" stopColor="var(--vector-land-south)" /></linearGradient></defs>
          <g ref={layer}>
            <rect width={map.width} height={map.height} fill="var(--vector-water)" />
            <path d={map.land} fill="url(#vector-land)" stroke="var(--vector-coast)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            {groups.map((group) => {
              const chosen = group.members.some((p) => p.id === selected?.id);
              const count = group.members.length;
              return <g key={group.id} className="vector-map-marker" role="button" tabIndex={0} data-place={group.place.id} data-count={count}
                aria-label={count > 1 ? `${count} places near ${group.place.name}` : `${group.place.name}, ${group.place.verses.length} verses`}
                onClick={() => pick(group)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(group); } }}
                style={{ "--marker-color": chosen ? "var(--accent)" : sectionColor(group.place.section) } as CSSProperties}>
                <circle cx={group.place.x} cy={group.place.y} className="vector-marker-hit" />
                {chosen && <circle cx={group.place.x} cy={group.place.y} className="vector-marker-selected" />}
                <circle cx={group.place.x} cy={group.place.y} className={count > 1 ? "vector-marker-cluster" : "vector-marker-dot"} data-uncertain={group.place.confidence < .5 && count === 1} />
                {count > 1 && <text x={group.place.x} y={group.place.y} className="vector-marker-count" dominantBaseline="central" textAnchor="middle">{count}</text>}
                <title>{count > 1 ? `Open all ${count} places in this area` : group.place.name}</title>
              </g>;
            })}
            <g className="vector-map-labels" opacity={moving ? 0 : 1} aria-hidden="true">
              {labels.map((label) => {
                const endX = label.x > label.anchorX ? label.x - 3 : label.x + label.name.length * 7.2;
                const endY = label.y - 4;
                const length = Math.hypot(endX - label.anchorX, endY - label.anchorY);
                return <g key={label.id}>
                  {length > 28 && <line x1={view.invertX(label.anchorX + (endX - label.anchorX) * 17 / length)} y1={view.invertY(label.anchorY + (endY - label.anchorY) * 17 / length)} x2={view.invertX(endX)} y2={view.invertY(endY)} stroke="var(--vector-coast)" strokeWidth={1 / view.k} />}
                  <text x={view.invertX(label.x)} y={view.invertY(label.y)} fontSize={12 / view.k} strokeWidth={3 / view.k}>{label.name}</text>
                </g>;
              })}
            </g>
          </g>
          <g transform={`translate(${size.width - 26},28)`} className="vector-compass" aria-hidden="true"><text textAnchor="middle" y="-9">N</text><path d="M0,0 L-4,13 L0,10 L4,13 Z" /></g>
        </svg>
        {opened && <div className="vector-cluster-card" role="region" aria-label="Places in this area">
          <header><div><p>{opened.members.length} places in this area</p><h3>Choose a place.</h3></div><button type="button" aria-label="Close place group" onClick={() => setOpened(null)}><X size={18} /></button></header>
          <input className="vector-group-search" aria-label="Find within this group" placeholder="Find within this group…" value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} />
          <OutsideScroll label="Grouped places" className="vector-cluster-list" frameClassName="rounded-lg" resetKey={groupQuery}>
            <ul>{[...opened.members].filter((place) => place.name.toLowerCase().includes(groupQuery.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)).map((place) => <li key={place.id}><button type="button" onClick={() => { setOpened(null); onSelect(place); }}><span className="vector-list-dot" style={{ background: sectionColor(place.section) }} /><span>{place.name}<small>{place.type}</small></span><span>{place.verses.length}<small>verses</small></span></button></li>)}</ul>
            {!opened.members.some((place) => place.name.toLowerCase().includes(groupQuery.trim().toLowerCase())) && <p className="p-2 text-xs text-muted">No matching place in this group.</p>}
          </OutsideScroll>
          {view.k < MAX_ZOOM && <button type="button" className="vector-cluster-zoom" onClick={() => { fly(opened.place.x, opened.place.y, view.k * 2.5); setActiveRegion(""); setOpened(null); }}>Zoom closer <ArrowUpRight size={15} /></button>}
        </div>}
        {!places.length && <div className="vector-empty">No places match these filters.</div>}
        {overlay}
      </div>
      <div className="vector-atlas-key"><span><i className="vector-key-group">7</i> Places near the named location</span><span><i className="vector-key-dot" /> Individual place</span><span><i className="vector-key-uncertain" /> Less certain location</span></div>
    </div>
    <figcaption>Drag to explore · scroll or pinch to zoom · select a numbered circle to see every place. Coastline: Natural Earth (public domain). Locations: OpenBible.info (CC BY 4.0).</figcaption>
  </figure>;
}
