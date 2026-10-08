// Map outlines for the Teachers subpages: land projected once at build time, so the pages draw a ready SVG path.
import fs from "node:fs";
import path from "node:path";
import { geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryObject } from "topojson-specification";
import type { Feature, FeatureCollection, GeoJsonObject, Geometry } from "geojson";

export type Point = [number, number];
export interface ViewSpec { size: [number, number]; projection: GeoProjection; fit: GeoJsonObject; detail: "50m" | "110m" }

function land(site: string, detail: "50m" | "110m"): Feature | FeatureCollection {
  const file = path.join(site, "node_modules/world-atlas", `land-${detail}.json`);
  if (!fs.existsSync(file)) throw new Error(`teacher pages: world-atlas outline missing at ${file}; run bun install`);
  const topology = JSON.parse(fs.readFileSync(file, "utf8")) as Topology<{ land: GeometryObject }>;
  return feature(topology, topology.objects.land);
}

/** Four corners as points, so d3 fits the box without any ring winding to get wrong. */
export const box = (west: number, south: number, east: number, north: number): GeoJsonObject =>
  ({ type: "MultiPoint", coordinates: [[west, south], [east, south], [east, north], [west, north]] }) as GeoJsonObject;
export const sphere = { type: "Sphere" } as unknown as GeoJsonObject;
export const mercator = geoMercator;
export const naturalEarth = geoNaturalEarth1;

// The world outline has no inland water, so the two seas of the Holy Land are simplified hand-drawn outlines (clockwise,
// as d3 expects), added to the land path as holes: draw that path with fill-rule: evenodd to show them as water.
const LAKES: Feature<Geometry>[] = ([
  ["Dead Sea", [[35.40, 31.05], [35.38, 31.20], [35.39, 31.35], [35.42, 31.50], [35.45, 31.65], [35.47, 31.77], [35.53, 31.77], [35.56, 31.74], [35.59, 31.60], [35.58, 31.40], [35.56, 31.27], [35.52, 31.17], [35.47, 31.05]]],
  ["Sea of Galilee", [[35.55, 32.90], [35.60, 32.88], [35.64, 32.82], [35.645, 32.75], [35.60, 32.70], [35.56, 32.72], [35.53, 32.77], [35.52, 32.84]]],
] as [string, number[][]][]).map(([name, ring]) => ({ type: "Feature", properties: { name }, geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] } }));

const round = (n: number) => Math.round(n * 10) / 10;

/** Project one view: its land path (with the lakes, unless `lakes` is false) and each named point that falls inside it. */
export function projectView(site: string, spec: ViewSpec, points: Record<string, [number, number]>, lakes = true) {
  const [width, height] = spec.size;
  spec.projection.fitSize([width, height], spec.fit as Parameters<GeoProjection["fitSize"]>[1]);
  const world = spec.fit === sphere;
  if (!world) spec.projection.clipExtent([[-20, -20], [width + 20, height + 20]]);
  const draw = geoPath(spec.projection).digits(1);
  const inside: Record<string, Point> = {};
  for (const [key, [lat, lon]] of Object.entries(points)) {
    const xy = spec.projection([lon, lat]);
    if (xy && xy[0] >= 0 && xy[0] <= width && xy[1] >= 0 && xy[1] <= height) inside[key] = [round(xy[0]), round(xy[1])];
  }
  const water = lakes && !world ? LAKES.map((lake) => draw(lake) ?? "").join("") : "";
  return { width, height, land: (draw(land(site, spec.detail)) ?? "") + water, points: inside };
}
