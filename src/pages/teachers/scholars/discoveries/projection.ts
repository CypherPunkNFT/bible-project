// The discoveries map's geometry (ported from the mock-up's direction C map). Each pre-projected view is Mercator; two
// known finds give the projection, so the sea labels and the off-map marker sit in the same coordinates as the data.
import type { Point, ScholarsData } from "@/data/teachers/pages-types";
import type { View } from "./model";

export interface Cam { x: number; y: number; w: number }
export interface Projection { project: (lon: number, lat: number) => Point; invert: (x: number, y: number) => Point }

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** a and b are [lon, lat, x, y] of two known places. */
function mercatorFrom(a: number[], b: number[]): Projection {
  const A = (b[2] - a[2]) / (b[0] - a[0]), B = a[2] - A * a[0];
  const C = (b[3] - a[3]) / (mercY(b[1]) - mercY(a[1])), D = a[3] - C * mercY(a[1]);
  return {
    project: (lon, lat) => [A * lon + B, C * mercY(lat) + D],
    invert: (x, y) => [(x - B) / A, ((2 * Math.atan(Math.exp((y - D) / C)) - Math.PI / 2) * 180) / Math.PI],
  };
}

export function buildProjections(data: ScholarsData): Record<View, Projection> {
  const fromFind = (view: View, id: string) => {
    const find = data.finds.find((f) => f.id === id), p = data.views[view].points[`find:${id}`];
    if (!find || !p) throw new Error(`Discoveries map: the find "${id}" is needed to place the ${view} map, but it is missing from the data`);
    return [find.where[2], find.where[1], p[0], p[1]];
  };
  const from = (view: View) => mercatorFrom(fromFind(view, "sinaiticus"), fromFind(view, "hazor"));
  return { holyland: from("holyland"), med: from("med") };
}

/** [label, lon, lat]; the Dead Sea and the Sea of Galilee are holes in the land outline. */
export const WATERS: Record<View, [string, number, number][]> = {
  holyland: [["Mediterranean Sea", 33.55, 32.35], ["Sinai", 33.75, 29.75], ["Dead Sea", 35.5, 31.5], ["Sea of Galilee", 35.59, 32.83]],
  med: [["Mediterranean Sea", 18.5, 35.2], ["Asia Minor", 33, 39.3], ["Black Sea", 34.5, 43.2]],
};

/** Move a camera from one view's coordinates to the other's through longitude and latitude. */
export function convertCam(projections: Record<View, Projection>, from: View, to: View, cam: Cam): Cam {
  const P = projections[from], Q = projections[to];
  const [lonA, latA] = P.invert(cam.x - cam.w / 2, cam.y), [lonB] = P.invert(cam.x + cam.w / 2, cam.y);
  const [lon, lat] = P.invert(cam.x, cam.y), [x, y] = Q.project(lon, lat);
  return { x, y, w: Math.abs(Q.project(lonB, latA)[0] - Q.project(lonA, latA)[0]) };
}

export interface Zoom { at: (t: number) => [number, number, number]; duration: number }

/** d3's smooth zoom (van Wijk and Nuij): pans out a little on long moves so the eye keeps its place. */
export function interpolateZoom([ux0, uy0, w0]: number[], [ux1, uy1, w1]: number[]): Zoom {
  const rho = Math.SQRT2, dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
  if (d2 < 1e-12) {
    const S0 = Math.log(w1 / w0) / rho;
    return { at: (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S0)], duration: Math.abs(S0) * 1000 };
  }
  const d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + 4 * d2) / (2 * w0 * 2 * d1), b1 = (w1 * w1 - w0 * w0 - 4 * d2) / (2 * w1 * 2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), S1 = (r1 - r0) / rho;
  const at = (t: number): [number, number, number] => {
    const s = t * S1, c0 = Math.cosh(r0), u = (w0 / (2 * d1)) * (c0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
    return [ux0 + u * dx, uy0 + u * dy, (w0 * c0) / Math.cosh(rho * s + r0)];
  };
  return { at, duration: S1 * 1000 };
}

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
