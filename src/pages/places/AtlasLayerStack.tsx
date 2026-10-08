// The Atlas home's header picture (owner 2026-10-07, from the Meridian direction): three map layers tilted in 3D and
// floating apart (a latitude/longitude grid, the real coastline, and Paul's first journey drawing itself on top).
// The coastline is the site's own Natural Earth outline (src/data/atlas-map.json) in the same projection.
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
// The route draws once (CSS keyframes atlas-route); its timing lives here so each stop's dot can pop in exactly as the
// line reaches it (owner 2026-10-08). The first and last stops are gold like the line; the rest are teal.
const DRAW_DELAY = 1; // seconds before the line starts
const DRAW_SECONDS = 12;
const EASE: [number, number, number, number] = [0.45, 0, 0.55, 1]; // the line's cubic-bezier easing

/** The share of the draw time at which the line has drawn `progress` of its length (inverse of the easing curve). */
function timeAt(progress: number): number {
  const [x1, y1, x2, y2] = EASE;
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (bez(y1, y2, mid) < progress) lo = mid; else hi = mid; }
  return bez(x1, x2, (lo + hi) / 2);
}
const LENGTHS = ROUTE_POINTS.reduce<number[]>((acc, p, i) => [...acc, i ? acc[i - 1] + Math.hypot(p[0] - ROUTE_POINTS[i - 1][0], p[1] - ROUTE_POINTS[i - 1][1]) : 0], []);
const TOTAL = LENGTHS.at(-1) || 1;
/** Each stop once, at the moment the line first reaches it. */
const DOTS = [...new Map(ROUTE_POINTS.map((p, i) => [p.join(","), { x: p[0], y: p[1], delay: DRAW_DELAY + DRAW_SECONDS * timeAt(LENGTHS[i] / TOTAL), end: i === 0 || i === ROUTE_POINTS.length - 1 }] as const).reverse()).values()].reverse();

const plane = (className: string, children: React.ReactNode) => <svg className={`atlas-plane ${className}`} viewBox={VIEW} preserveAspectRatio="xMidYMid slice" aria-hidden>{children}</svg>;

export function AtlasLayerStack() {
  return <div className="atlas-iso" aria-hidden>
    <div className="atlas-stack">
      {plane("atlas-plane-grid", <path className="atlas-plane-graticule" d={GRID} />)}
      {plane("atlas-plane-land", <path className="atlas-plane-coast" d={map.land} />)}
      {plane("atlas-plane-route", <><path className="atlas-plane-path" pathLength={1} d={ROUTE} style={{ animationDuration: `${DRAW_SECONDS}s`, animationDelay: `${DRAW_DELAY}s`, animationTimingFunction: `cubic-bezier(${EASE.join(",")})` }} />
        <g className="atlas-plane-dots">{DOTS.map(({ x, y, delay, end }) => <circle key={`${x},${y}`} className={end ? "atlas-dot-end" : undefined} cx={x} cy={y} r={end ? 0.7 : 0.55} style={{ animationDelay: `${delay.toFixed(2)}s` }} />)}</g></>)}
    </div>
    <span className="atlas-iso-cap">Eastern Mediterranean · First journey</span>
  </div>;
}
