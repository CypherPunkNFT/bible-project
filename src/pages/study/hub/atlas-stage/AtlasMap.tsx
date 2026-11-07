// The study page's Atlas window map: the site's own coastline (atlas-map.json), a camera that glides to fit each category's
// places, journeys told stop by stop after the glide (RouteTrail, which lights each stop it reaches), and labels placed so they do not overlap (a hidden label shows on hover).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import world from "@/data/atlas-map.json";
import type { AtlasCategory } from "./atlas-data";
import { RouteTrail } from "./RouteTrail";

interface Camera { scale: number; tx: number; ty: number }
type Side = "right" | "left" | "above" | "below";
interface Label { side: Side | null }

const project = ([lon, lat]: number[]) => [world.translate[0] + world.scale * lon * Math.PI / 180, world.translate[1] - world.scale * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
const REGIONS: [string, number, number][] = [["ITALY", 13, 43.4], ["GREECE", 22.2, 39.6], ["ASIA MINOR", 31.5, 39.6], ["EGYPT", 29.5, 27.6], ["MESOPOTAMIA", 42.3, 34.4], ["PERSIA", 50.5, 31.2], ["ARABIA", 40.5, 27.5]];
const MAX_SCALE = 24;

/** Space kept clear of points, in screen pixels, where a version lays panels over the map. */
export interface Inset { left?: number; right?: number; top?: number; bottom?: number }

function fitCamera(category: AtlasCategory, height: number, k: number, inset: Inset): Camera {
  const xy = category.places.map(p => project([p.lon, p.lat]));
  const xs = xy.map(([x]) => x), ys = xy.map(([, y]) => y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const width = Math.max(x1 - x0, 4), tall = Math.max(y1 - y0, 4);
  const left = (inset.left ?? 0) * k + 105, right = 1000 - (inset.right ?? 0) * k - 105, top = (inset.top ?? 0) * k + 50, bottom = height - (inset.bottom ?? 0) * k - 50;
  const scale = Math.min(MAX_SCALE, (right - left) / width, (bottom - top) / tall);
  return { scale, tx: (left + right) / 2 - (x0 + x1) / 2 * scale, ty: (top + bottom) / 2 - (y0 + y1) / 2 * scale };
}

const toScreen = ([x, y]: number[], c: Camera) => [x * c.scale + c.tx, y * c.scale + c.ty];
const OFFSETS: Record<Side, [number, number, "start" | "end" | "middle"]> = { right: [12, 5, "start"], left: [-12, 5, "end"], above: [0, -13, "middle"], below: [0, 22, "middle"] };
const offset = (side: Side, k: number): [number, number, "start" | "end" | "middle"] => { const [dx, dy, anchor] = OFFSETS[side]; return [dx * k, dy * k, anchor]; };

/** Picks a side for each label so no two labels, and no label and dot, overlap; the chosen place is placed first. */
function placeLabels(points: { key: string; name: string; x: number; y: number }[], chosen: string, height: number, k: number, inset: Inset): Record<string, Label> {
  const r = 6 * k, boxes: number[][] = points.map(p => [p.x - r, p.y - r, p.x + r, p.y + r]);
  const [minX, maxX] = [(inset.left ?? 0) * k + 4, 1000 - (inset.right ?? 0) * k - 4];
  const order = [...points].sort((a, b) => Number(b.key === chosen) - Number(a.key === chosen));
  const result: Record<string, Label> = {};
  for (const p of order) {
    const width = (p.name.length * 7.3 + 4) * k;
    let found: Side | null = null;
    for (const side of ["right", "left", "above", "below"] as Side[]) {
      const [dx, dy, anchor] = offset(side, k), left = p.x + dx - (anchor === "end" ? width : anchor === "middle" ? width / 2 : 0);
      const box = [left, p.y + dy - 12 * k, left + width, p.y + dy + 3 * k];
      const inside = box[0] > minX && box[2] < maxX && box[1] > 4 && box[3] < height - 4;
      const clear = boxes.every(b => box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3] || (b[0] === p.x - r && b[1] === p.y - r));
      if (inside && clear) { found = side; boxes.push(box); break; }
    }
    if (!found && p.key === chosen) found = (["right", "left", "above", "below"] as Side[]).find(side => { const [dx, , anchor] = offset(side, k), left = p.x + dx - (anchor === "end" ? width : anchor === "middle" ? width / 2 : 0); return left > minX && left + width < maxX; }) ?? "right";
    result[p.key] = { side: found };
  }
  return result;
}

const NO_INSET: Inset = {};
export function AtlasMap({ category, chosen, choose, inset = NO_INSET }: { category: AtlasCategory; chosen: string; choose: (key: string) => void; inset?: Inset }) {
  const host = useRef<HTMLDivElement>(null), current = useRef<Camera | null>(null);
  const [size, setSize] = useState({ width: 1000, height: 440 });
  const height = Math.round(1000 * size.height / size.width), k = 1000 / size.width;
  if (size.width < 861) inset = NO_INSET;
  const [camera, setCamera] = useState<Camera>(() => fitCamera(category, height, k, inset));
  const [settled, setSettled] = useState(true);
  /** The stop each journey's comet has reached, by route; those stops light up as if the mouse were on them. */
  const [passing, setPassing] = useState<Record<number, string | null>>({});
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width), tall = Math.round(entry.contentRect.height);
      if (width && tall) setSize(old => old.width === width && old.height === tall ? old : { width, height: tall });
    });
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const target = fitCamera(category, height, k, inset), from = current.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!from || reduced) { current.current = target; setCamera(target); setSettled(true); return; }
    setSettled(false);
    const start = performance.now(), cx = (500 - from.tx) / from.scale, cy = (height / 2 - from.ty) / from.scale, nx = (500 - target.tx) / target.scale, ny = (height / 2 - target.ty) / target.scale;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900), ease = t * t * (3 - 2 * t), scale = from.scale * Math.pow(target.scale / from.scale, ease);
      const view = { scale, tx: 500 - (cx + (nx - cx) * ease) * scale, ty: height / 2 - (cy + (ny - cy) * ease) * scale };
      current.current = view; setCamera(view);
      if (t < 1) frame = requestAnimationFrame(tick); else { current.current = target; setCamera(target); setSettled(true); }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [category, height, k, inset]);

  const target = fitCamera(category, height, k, inset);
  const points = category.places.map(p => { const [x, y] = toScreen(project([p.lon, p.lat]), camera); return { ...p, x, y }; });
  const finalPoints = category.places.map(p => { const [x, y] = toScreen(project([p.lon, p.lat]), target); return { key: p.key, name: p.name, x, y }; });
  const labels = placeLabels(finalPoints, chosen, height, k, inset);
  const byKey = Object.fromEntries(points.map(p => [p.key, p]));
  const step = camera.scale > 6 ? 1 : 5;
  let grid = "";
  for (let lon = -10; lon <= 60; lon += step) { const [x] = toScreen(project([lon, 0]), camera); if (x > -10 && x < 1010) grid += `M${x.toFixed(1)} 0V${height}`; }
  for (let lat = 20; lat <= 46; lat += step) { const [, y] = toScreen(project([0, lat]), camera); if (y > -10 && y < height + 10) grid += `M0 ${y.toFixed(1)}H1000`; }

  return <div ref={host} className="am-map">
    <svg viewBox={`0 0 1000 ${height}`} role="group" aria-label={`${category.title}: ${category.places.length} places`}>
      <path className="map-grid" d={grid} />
      <g transform={`translate(${camera.tx} ${camera.ty}) scale(${camera.scale})`}><path className="map-land" d={world.land} fillRule="evenodd" vectorEffect="non-scaling-stroke" /></g>
      {camera.scale < 3.2 && REGIONS.map(([name, lon, lat]) => { const [x, y] = toScreen(project([lon, lat]), camera); return <text key={name} className="map-region" x={x} y={y} textAnchor="middle" style={{ fontSize: 10 * k, letterSpacing: 3 * k }}>{name}</text>; })}
      {settled && category.routes?.map((route, i) => <RouteTrail key={`${category.id}-${i}`} k={k} stops={route.map(key => ({ key, x: byKey[key].x, y: byKey[key].y }))}
        onPassing={key => setPassing(old => old[i] === key ? old : { ...old, [i]: key })} />)}
      {points.map(p => {
        const side = labels[p.key]?.side ?? null, [dx, dy, anchor] = offset(side ?? "right", k);
        return <g key={p.key} className={`map-point${side ? "" : " am-quiet"}${p.uncertain ? " am-unsure" : ""}${Object.values(passing).includes(p.key) ? " am-passing" : ""}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} role="button" tabIndex={0} aria-label={`Select ${p.name}`} aria-pressed={chosen === p.key}
          onClick={() => choose(p.key)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(p.key); } }}>
          <circle className="halo" r={(chosen === p.key ? 15 : 11) * k} /><circle className="dot" r={(chosen === p.key ? 4.5 : 3.5) * k} />
          <text x={dx} y={dy} textAnchor={anchor} style={{ fontSize: 13 * k, strokeWidth: 3 * k }}>{p.name}</text>
        </g>;
      })}
    </svg>
  </div>;
}
