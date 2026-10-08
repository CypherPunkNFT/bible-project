// The map maths for "Cities that gathered them": what to draw for a city (a line from where each teacher came), the
// frame to zoom to, label placement, and the per-frame update that keeps pins and labels one size on screen while the
// viewBox glides. Per-frame work goes straight to the SVG through these helpers, never through a React re-render.
import type { CSSProperties } from "react";
import type { MapView, Point } from "@/data/teachers/pages-types";
import type { City, Projector } from "./places";

/** A little taller than the map views, so the map stands level with the list beside it. */
export const ASPECT = 1000 / 740;
const GLIDE_MS = 1100;

export interface Box { x: number; y: number; w: number; h: number }
export interface CameLine { stay: number; d: string; x: number; y: number; tone: string }
export interface MapLabel { name: string; x: number; y: number; city: boolean }
export interface CityOverlay { cx: number; cy: number; lines: CameLine[]; labels: MapLabel[]; offMap: string[]; box: Box }

/** Lines from where each teacher came from (when that place is on this map) into the city, and the frame around them. */
export function cityOverlay(city: City, project: Projector, view: MapView, toneOf: (stay: number) => string): CityOverlay {
  const [cx, cy] = project(city.lon, city.lat);
  const points: Point[] = [[cx, cy]], lines: CameLine[] = [], offMap = new Set<string>(), labels = new Map<string, Point>();
  city.stays.forEach((s, i) => {
    if (!s.cameFrom || s.bornHere) return;
    const prev = s.person.places[s.index - 1];
    const [x, y] = project(prev[2], prev[1]);
    if (x < 0 || y < 0 || x > view.width || y > view.height) { offMap.add(prev[0]); return; }
    points.push([x, y]);
    const mx = (x + cx) / 2, my = (y + cy) / 2, dx = cx - x, dy = cy - y, bend = 0.18;
    lines.push({ stay: i, d: `M${x},${y} Q${mx - dy * bend},${my + dx * bend} ${cx},${cy}`, x, y, tone: toneOf(i) });
    if (!labels.has(prev[0])) labels.set(prev[0], [x, y]);
  });
  return {
    cx, cy, lines, offMap: [...offMap], box: boxAround(points, view),
    labels: [{ name: city.name, x: cx, y: cy, city: true }, ...[...labels].map(([name, [x, y]]) => ({ name, x, y, city: false }))],
  };
}

/** A city with no lines on this map gets a wider frame, so there is coastline around it; the frame is kept inside the
 *  map's drawn area where it fits (beyond it the outline stops in a straight edge). */
function boxAround(points: Point[], view: MapView): Box {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const least = points.length > 1 ? 160 : 720;
  let w = Math.max(least, (x1 - x0) * 1.5), h = Math.max(least / ASPECT, (y1 - y0) * 1.6);
  if (w / h < ASPECT) w = h * ASPECT; else h = w / ASPECT;
  if (w > view.width) { w = view.width; h = w / ASPECT; }
  if (h > view.height) { h = view.height; w = h * ASPECT; }
  const fit = (start: number, size: number, limit: number) => (size <= limit ? Math.min(Math.max(start, 0), limit - size) : (limit - size) / 2);
  return { x: fit((x0 + x1) / 2 - w / 2, w, view.width), y: fit((y0 + y1) / 2 - h / 2, h, view.height), w, h };
}

/** The wide opening frame of a map view, before the glide onto a city. */
export function wideBox(view: MapView): Box {
  const h = Math.min(view.width / ASPECT, view.height), w = h * ASPECT;
  return { x: (view.width - w) / 2, y: 0, w, h };
}

/** Screen-pixel offset of each label from its point. Labels that would overlap at the final zoom drop below their
 *  point, then to its left. */
export function spreadLabels(labels: MapLabel[], box: Box, screenWidth: number): Point[] {
  const unit = box.w / Math.max(1, screenWidth), taken: number[][] = [];
  return labels.map((label) => {
    const x = label.x / unit, y = label.y / unit, w = label.name.length * (label.city ? 8.2 : 7.2);
    let dx = label.city ? 11 : 7, dy = label.city ? 17 : -7;
    const boxAt = () => [x + dx, y + dy - 11, x + dx + w, y + dy + 3];
    const hits = (b: number[]) => taken.some((o) => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]));
    let b = boxAt();
    if (hits(b)) { dy = 16; b = boxAt(); }
    if (hits(b)) { dx = -10 - w; dy = 4; b = boxAt(); }
    taken.push(b);
    return [dx, dy];
  });
}

/** Set the viewBox, keeping pins and labels the same size on screen. Labels are matched to `offsets` in DOM order. */
export function applyBox(svg: SVGSVGElement, box: Box, offsets: Point[]) {
  svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
  const unit = box.w / Math.max(1, svg.clientWidth);
  svg.querySelectorAll<SVGTextElement>(".cty-lbl").forEach((t, i) => {
    const [dx, dy] = offsets[i] ?? [0, 0];
    t.setAttribute("font-size", String((t.classList.contains("cty-lbl-city") ? 13 : 12) * unit));
    t.setAttribute("dx", String(dx * unit));
    t.setAttribute("dy", String(dy * unit));
  });
  svg.querySelectorAll(".cty-from").forEach((n) => n.setAttribute("r", String(3.5 * unit)));
  svg.querySelector(".cty-pin")?.setAttribute("r", String(5.5 * unit));
  svg.querySelector(".cty-halo")?.setAttribute("r", String(14 * unit));
}

/** Glide from one frame to another (cubic ease in-out); calls `step` each frame and returns a cancel function. */
export function glide(from: Box, to: Box, step: (box: Box) => void): () => void {
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const k = Math.min(1, (now - start) / GLIDE_MS), e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
    step({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
    if (k < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The inline style that hands a family colour token to CSS as --dot. */
export const dotStyle = (tone: string) => ({ "--dot": `var(${tone})` }) as CSSProperties;
