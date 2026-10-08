// The map beside the city list: Britain and western Europe, or the eastern United States. Choosing a city glides the
// viewBox onto it (rAF, straight to the SVG; no React render per frame) and draws a line from where each teacher came.
// The first glide waits until the map is on screen, so the reader sees it fly in.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { MapView, Point } from "@/data/teachers/pages-types";
import { familyOf } from "../../shared/people";
import { applyBox, cityOverlay, dotStyle, glide, reducedMotion, spreadLabels, wideBox, type Box } from "./frame";
import { viewCaption, type City, type CityView, type Projector } from "./places";

interface CityMapProps { city: City; view: MapView; project: Projector; lit: number | null }

export function CityMap({ city, view, project, lit }: CityMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<Box | null>(null);
  const viewRef = useRef<CityView | null>(null);
  const offsetsRef = useRef<Point[]>([]);
  const pendingRef = useRef<Box | null>(null);
  const seenRef = useRef(false);
  const cancelRef = useRef<() => void>(() => undefined);
  const overlay = useMemo(() => cityOverlay(city, project, view, (i) => familyOf(city.stays[i].person).tone), [city, project, view]);

  const paint = useCallback((box: Box) => {
    boxRef.current = box;
    if (svgRef.current) applyBox(svgRef.current, box, offsetsRef.current);
  }, []);
  const glideTo = useCallback((target: Box) => {
    cancelRef.current();
    const from = boxRef.current;
    if (!from || reducedMotion()) { paint(target); return; }
    cancelRef.current = glide(from, target, paint);
  }, [paint]);

  // A new city: start wide when the map itself changes, place the labels for the final frame, then glide (or wait).
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (viewRef.current !== city.view || !boxRef.current) { viewRef.current = city.view; cancelRef.current(); boxRef.current = wideBox(view); }
    offsetsRef.current = spreadLabels(overlay.labels, overlay.box, svg.clientWidth);
    paint(boxRef.current);
    if (seenRef.current) glideTo(overlay.box); else pendingRef.current = overlay.box;
  }, [overlay, city.view, view, paint, glideTo]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reveal = () => {
      if (seenRef.current) return;
      seenRef.current = true;
      if (pendingRef.current) { glideTo(pendingRef.current); pendingRef.current = null; }
    };
    const resize = new ResizeObserver(() => { if (boxRef.current) paint(boxRef.current); });
    resize.observe(svg);
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => { if (entries.some((x) => x.isIntersecting)) { io?.disconnect(); reveal(); } }, { threshold: 0.35 });
      io.observe(svg);
    } else reveal();
    const cancel = cancelRef;
    return () => { resize.disconnect(); io?.disconnect(); cancel.current(); };
  }, [paint, glideTo]);

  const isLit = (stay: number) => (lit === stay ? " is-lit" : "");
  return <div className="cty-map">
    <svg ref={svgRef} className={`cty-svg${lit !== null ? " has-lit" : ""}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Map of ${city.name}`}>
      <g className="cty-base">
        <rect x={-3000} y={-3000} width={7000} height={7000} className="cty-water" />
        <path className="cty-coast" d={view.land} />
      </g>
      <g className="cty-overlay" key={city.name}>
        {overlay.lines.map((l) => <path key={`l${l.stay}`} className={`cty-came${isLit(l.stay)}`} style={dotStyle(l.tone)} d={l.d} />)}
        {overlay.lines.map((l) => <circle key={`c${l.stay}`} className={`cty-from${isLit(l.stay)}`} style={dotStyle(l.tone)} cx={l.x} cy={l.y} />)}
        <circle className="cty-halo" cx={overlay.cx} cy={overlay.cy} />
        <circle className="cty-pin" cx={overlay.cx} cy={overlay.cy} />
        {overlay.labels.map((t, i) => <text key={`t${i}`} className={t.city ? "cty-lbl cty-lbl-city" : "cty-lbl"} x={t.x} y={t.y}>{t.name}</text>)}
      </g>
    </svg>
    <p className="cty-caption">{viewCaption(city.view)}</p>
    <p className="cty-offmap" hidden={!overlay.offMap.length}>{overlay.offMap.length ? `Also came from off this map: ${overlay.offMap.join(" · ")}` : ""}</p>
  </div>;
}
