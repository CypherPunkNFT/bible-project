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
const DOTS = [...new Map(ROUTE_POINTS.map((p) => [p.join(","), p])).values()];

const plane = (className: string, children: React.ReactNode) => <svg className={`atlas-plane ${className}`} viewBox={VIEW} preserveAspectRatio="xMidYMid slice" aria-hidden>{children}</svg>;

export function AtlasLayerStack() {
  return <div className="atlas-iso" aria-hidden>
    <div className="atlas-stack">
      {plane("atlas-plane-grid", <path className="atlas-plane-graticule" d={GRID} />)}
      {plane("atlas-plane-land", <path className="atlas-plane-coast" d={map.land} />)}
      {plane("atlas-plane-route", <><path className="atlas-plane-path" pathLength={1} d={ROUTE} /><g className="atlas-plane-dots">{DOTS.map(([x, y]) => <circle key={`${x},${y}`} cx={x} cy={y} r={0.9} />)}</g></>)}
    </div>
    <span className="atlas-iso-cap">Place · People · Story</span>
  </div>;
}
