// The Atlas home's header picture (owner 2026-10-07, from the Meridian direction): three map layers tilted in 3D and
// floating apart (a latitude/longitude grid, the real coastline, and Paul's first journey drawing itself on top).
// The coastline is the site's own Natural Earth outline (src/data/atlas-map.json) in the same projection.
import { useId, type CSSProperties } from "react";
import map from "@/data/atlas-map.json";
import { projectPlace } from "@/components/atlas/projection";
import type { Place } from "@/lib/types";
import { FIRST_JOURNEY, STACK_BOUNDS } from "./layer-stack-data";

const project = (lon: number, lat: number) => projectPlace({ lon, lat } as Place);
const [W, S, E, N] = STACK_BOUNDS;
const [x0, y0] = project(W, N);
const [x1, y1] = project(E, S);
const VIEW = `${x0.toFixed(1)} ${y0.toFixed(1)} ${(x1 - x0).toFixed(1)} ${(y1 - y0).toFixed(1)}`;

const GRID = (() => {
  let d = "";
  for (let lon = Math.ceil(W); lon <= E; lon++) { const [x] = project(lon, 0); d += `M${x.toFixed(1)} ${y0.toFixed(1)}V${y1.toFixed(1)}`; }
  for (let lat = Math.ceil(S); lat <= N; lat++) { const [, y] = project(0, lat); d += `M${x0.toFixed(1)} ${y.toFixed(1)}H${x1.toFixed(1)}`; }
  return d;
})();
const ROUTE_POINTS = FIRST_JOURNEY.map(([lon, lat]) => project(lon, lat));
const ROUTE = `M${ROUTE_POINTS.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`;
// Draw from the beginning. Only when the head reaches the third stop does the trailing end
// start moving along the same path at the same speed. The tail clears the route before it repeats.
const DRAW_SECONDS = 8;
const HEAD_START = 0.01;
const LENGTHS = ROUTE_POINTS.reduce<number[]>((acc, point, i) => [...acc, i ? acc[i - 1] + Math.hypot(point[0] - ROUTE_POINTS[i - 1][0], point[1] - ROUTE_POINTS[i - 1][1]) : 0], []);
const TOTAL = LENGTHS.at(-1) || 1;
const SPEED = (1 - HEAD_START) / DRAW_SECONDS;
const TAIL_START_SECONDS = (LENGTHS[2] / TOTAL - HEAD_START) / SPEED;
const CYCLE_SECONDS = TAIL_START_SECONDS + 1 / SPEED;
const percent = (seconds: number) => (seconds / CYCLE_SECONDS * 100).toFixed(5);
const DOTS = [...new Map(ROUTE_POINTS.map(([x, y], i) => [`${x},${y}`, { x, y, arrival: Math.max(0, (LENGTHS[i] / TOTAL - HEAD_START) / SPEED), departure: TAIL_START_SECONDS + LENGTHS[i] / TOTAL / SPEED, end: i === 0 || i === ROUTE_POINTS.length - 1 }])).values()];
const timing = { "--atlas-cycle": `${CYCLE_SECONDS}s` } as CSSProperties;

const plane = (className: string, children: React.ReactNode) => <svg className={`atlas-plane ${className}`} viewBox={VIEW} preserveAspectRatio="xMidYMid slice" aria-hidden>{children}</svg>;

export function AtlasLayerStack() {
  const routeMask = useId();
  return <div className="atlas-iso" aria-hidden>
    <style>{`
      @keyframes atlas-route-head {
        0% { stroke-dashoffset: ${1 - HEAD_START}; }
        ${percent(DRAW_SECONDS)}%, 100% { stroke-dashoffset: 0; }
      }
      @keyframes atlas-route-tail {
        0%, ${percent(TAIL_START_SECONDS)}% { stroke-dashoffset: 1; }
        100% { stroke-dashoffset: 0; }
      }
      ${DOTS.map(({ arrival, departure }, i) => `@keyframes atlas-stop-${i} {
        0%, ${percent(arrival)}% { opacity: 0; scale: 0; }
        ${percent(arrival + .3)}% { opacity: 1; scale: 1; animation-timing-function: steps(1, end); }
        ${percent(departure)}%, 100% { opacity: 0; scale: 0; }
      }`).join("\n")}
    `}</style>
    <div className="atlas-stack">
      {plane("atlas-plane-grid", <path className="atlas-plane-graticule" d={GRID} />)}
      {plane("atlas-plane-land", <path className="atlas-plane-coast" d={map.land} />)}
      {plane("atlas-plane-route", <>
        <defs>
          <mask id={routeMask} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
            <path className="atlas-route-head" pathLength={1} d={ROUTE} style={timing} />
            <path className="atlas-route-tail" pathLength={1} d={ROUTE} style={timing} />
          </mask>
        </defs>
        <path className="atlas-plane-path" d={ROUTE} mask={`url(#${routeMask})`} />
        <g className="atlas-plane-dots">{DOTS.map(({ x, y, end }, i) => <circle key={`${x},${y}`} className={end ? "atlas-dot-end" : undefined} cx={x} cy={y} r={end ? 0.7 : 0.55} style={{ ...timing, "--atlas-stop": `atlas-stop-${i}` } as CSSProperties} />)}</g>
      </>)}
    </div>
    <span className="atlas-iso-cap">Eastern Mediterranean · First journey</span>
  </div>;
}
