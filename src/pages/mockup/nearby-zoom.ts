// MOCK-UP (home_mockup, home_mockup2): the geometry of the "Close to home" zoom (NearbyStage.tsx). The USA map is flown
// by its own viewBox, so its lines stay fine and its dots keep their size (placeMarks); the city's map is only ever
// revealed in a circle, never scaled, because its pins size themselves from its size on screen. For the hand-over to be
// seamless (owner, 2026-10-23: the circle opened away from the dot), the flight ends with the USA map at the city map's
// own scale and the city's dot exactly on the city map's centre point, its window grown to the city map's frame; the
// circle then opens from that point.
import { geoAlbersUsa } from "d3-geo";
import type { City, CityMap, UsStates } from "@/data/resources";
import { placeMarks } from "@/pages/resources/life/zoom";

export interface View { x: number; y: number; w: number; h: number }
/** A rectangle measured from the USA map's stage (the box its map is drawn in). */
export interface Box { left: number; top: number; width: number; height: number }
/** Where the USA map stands: its scale (screen px per map unit) and where the city's dot sits, measured like a Box. */
export interface Pose { s: number; x: number; y: number }

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** Resolves after n frames have been drawn: time for a newly drawn map's effects (pins placed, sizes measured) to run. */
export const frames = (n: number) => new Promise<void>((done) => { const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : done()); step(n); });

/** Resolves once the page draws frames on time again (three in a row under 24ms), or after `most` ms: a newly drawn map
 *  keeps the browser busy painting it for a while after it is put on the page. */
export const settle = (most = 1500) => new Promise<void>((done) => {
  const start = performance.now();
  let last = start, calm = 0;
  const step = (now: number) => {
    calm = now - last < 24 ? calm + 1 : 0;
    last = now;
    if (calm >= 3 || now - start > most) done(); else requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});

export function boxOf(el: Element, origin: Element): Box {
  const r = el.getBoundingClientRect(), o = origin.getBoundingClientRect();
  return { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height };
}
export function union(a: Box, b: Box): Box {
  const left = Math.min(a.left, b.left), top = Math.min(a.top, b.top);
  return { left, top, width: Math.max(a.left + a.width, b.left + b.width) - left, height: Math.max(a.top + a.height, b.top + b.height) - top };
}
/** The clip that shows only `inner` of an element laid out over `outer`. */
export const windowOf = (inner: Box, outer: Box) =>
  `inset(${inner.top - outer.top}px ${outer.left + outer.width - inner.left - inner.width}px ${outer.top + outer.height - inner.top - inner.height}px ${inner.left - outer.left}px)`;

export const dotOf = (states: UsStates, city: City) => geoAlbersUsa().scale(states.scale).translate(states.translate)([city.lon, city.lat]);

/** The view that puts the map in `box` at this pose. */
export const viewFor = (dot: [number, number], pose: Pose, box: Box): View =>
  ({ x: dot[0] - (pose.x - box.left) / pose.s, y: dot[1] - (pose.y - box.top) / pose.s, w: box.width / pose.s, h: box.height / pose.s });
/** The pose of a map in `box` showing `view` (its viewBox, drawn to fill the box's width). */
export function poseOf(dot: [number, number], view: View, box: Box): Pose {
  const s = box.width / view.w;
  return { s, x: box.left + (dot[0] - view.x) * s, y: box.top + (dot[1] - view.y) * s };
}
/** Part way between two poses: the scale changes evenly in its ratio, the dot glides in a straight line. */
export const between = (a: Pose, b: Pose, e: number): Pose => ({ s: a.s * (b.s / a.s) ** e, x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e });

export function setView(svg: SVGSVGElement, width: number, v: View) {
  svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  placeMarks(svg, width);
}

/** USA map units per degree of latitude at the city (the projection's scale there). */
function unitsPerDegree(states: UsStates, city: City) {
  const project = geoAlbersUsa().scale(states.scale).translate(states.translate);
  const a = project([city.lon, city.lat + 0.05]), b = project([city.lon, city.lat - 0.05]);
  return a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) / 0.1 : 0;
}
/** Before the city's map is drawn: about the scale it will have, 0.9 degrees of longitude across the USA map's box. */
export function guessScale(states: UsStates, city: City, box: Box) {
  return box.width / (unitsPerDegree(states, city) * 0.9 * Math.cos((city.lat * Math.PI) / 180));
}

/** Where the city map shows the city's centre point (the same point as its dot on the USA map), and the scale at which
 *  the USA map matches it. */
export function anchorOf(frame: Element, map: CityMap, city: City, states: UsStates, origin: Element) {
  const svg = frame.querySelector("svg"), m = svg?.getScreenCTM(), o = origin.getBoundingClientRect(), P = map.projection;
  if (!m) return null;
  const hx = (city.lon - P.west) * P.cos * P.k, hy = (P.north - city.lat) * P.k;
  return { x: m.a * hx + m.e - o.left, y: m.d * hy + m.f - o.top, s: (m.d * P.k) / unitsPerDegree(states, city) };
}

/** The circle the city's map opens through, centred on a point given like a Box, out to past the frame's far corner. */
export function circleAt(x: number, y: number, frame: Box) {
  const [cx, cy] = [x - frame.left, y - frame.top], reach = Math.hypot(Math.max(cx, frame.width - cx), Math.max(cy, frame.height - cy));
  return { closed: `circle(0px at ${cx}px ${cy}px)`, open: `circle(${reach}px at ${cx}px ${cy}px)`, reach };
}

/** Widens the USA map (between half and 68% of its row) until its bottom meets the bottom of the facts and
 *  button beside it (owner, 2026-10-23). The facts grow taller as their column narrows, so the width is found by trying
 *  widths, not worked out. Only where the two stand side by side. */
export function fitBeside(row: HTMLElement, info: HTMLElement, aspect: number) {
  row.style.gridTemplateColumns = "";
  const style = getComputedStyle(row);
  if (style.gridTemplateColumns.split(" ").length < 2) return;
  const room = row.clientWidth - (parseFloat(style.columnGap) || 0);
  const miss = (w: number) => { row.style.gridTemplateColumns = `${w}px minmax(0, 1fr)`; return Math.abs(w / aspect - info.offsetHeight); };
  const best = (from: number, to: number, step: number) => {
    let at = from, least = Infinity;
    for (let w = from; w <= to; w += step) { const m = miss(w); if (m < least) [at, least] = [w, m]; }
    return at;
  };
  const rough = best(room * 0.5, room * 0.68, room * 0.01);
  miss(best(rough - room * 0.01, rough + room * 0.01, 1));
}

/** The page's scroll that puts a box (measured on screen) in the middle of the window, or its top near the top when it
 *  is taller than the window. */
export function scrollToCentre(box: DOMRect | { top: number; height: number }) {
  const top = box.height > innerHeight - 120 ? box.top - 80 : box.top + box.height / 2 - innerHeight / 2;
  return Math.max(0, scrollY + top);
}

/** A part that fades in or out, rising a little as it comes; `delay` is a time on the move's clock. */
export function fade(el: Element | null, show: boolean, delay: number, ms: number, rise = 12) {
  return el?.animate(show
    ? [{ opacity: 0, transform: `translateY(${rise}px)` }, { opacity: 1, transform: "none" }]
    : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateY(${-rise}px)` }], { duration: ms, delay, easing: show ? "cubic-bezier(.2, .7, .2, 1)" : "ease-in", fill: "both" });
}
