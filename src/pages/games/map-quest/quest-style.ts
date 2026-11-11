// The blank physical map (design §8): the atlas's own earth-toned basemap with every label, border and place dot
// taken away, the dark theme lifted so land and sea read apart (the audit's item 2), with a soft coastline. Beginner
// adds sea, lake and river names back: the game's own short list (water-names.ts), since the tiles' lake labels never
// appear at the era views. Only the coarse "world" layer (zoom 0-8) is used: the sharp "detail" layer exists only
// near Bible places, so its patches would show where the answers are. The map's data and tiles are untouched.
import { layers, namedFlavor, type Flavor } from "@protomaps/basemaps";
import type { FeatureCollection, Geometry } from "geojson";
import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import { BOUNDS, EARTH, MAP_KEY, englishLabels, tilesBase } from "@/components/atlas/street-style";
import type { Theme } from "@/lib/theme";
import type { LonLat } from "./geo";
import { WATER_NAMES, waterNameFeatures } from "./water-names";

const BLANK_LAYERS = new Set(["background", "earth", "landcover", "landuse_park", "landuse_beach", "water", "water_stream", "water_river"]);
const WORLD_MAX_ZOOM = 8;
/** The world layer stretched two levels further: at zoom 8 one pixel is already about 0.5 km. */
export const QUEST_MAX_ZOOM = 10;

/** The dark theme's land lifted and its sea deepened, so the Mediterranean reads at a glance (the light theme already does). */
export const QUEST_EARTH: Record<Theme, Partial<Flavor>> = {
  light: {},
  dark: {
    background: "#142229", water: "#142229", earth: "#312a21", sand: "#3c3326", beach: "#3c3326",
    park_a: "#343b2a", park_b: "#363e28", wood_a: "#333c29", wood_b: "#303826", scrub_a: "#39392a", scrub_b: "#373728",
    landcover: { grassland: "#363c2a", barren: "#413828", urban_area: "#312a21", farmland: "#373c2a", glacier: "#4a4a46", scrub: "#3a3a2a", forest: "#2e3827" },
  },
};
const COAST: Record<Theme, { color: string; opacity: number }> = { light: { color: "#7d9ea7", opacity: 0.55 }, dark: { color: "#4e6a74", opacity: 0.65 } };

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** What a reveal draws: a dashed line from the pin to the scored site (in the round's colour), the scored site, and the
 *  other sites as rings. The summary passes several, one per place. */
export interface RevealShape {
  pin: LonLat;
  scored: LonLat;
  others: readonly LonLat[];
  /** Any CSS colour; the line and the scored dot wear it (the accent when missing). */
  color?: string;
}

export interface RevealFeatures { line: FeatureCollection<Geometry>; sites: FeatureCollection<Geometry>; pins: FeatureCollection<Geometry> }

const empty = (): FeatureCollection<Geometry> => ({ type: "FeatureCollection", features: [] });

/** A point between the pin and the site, `progress` (0 to 1) of the way: the line drawing itself out. */
export const alongLine = (from: LonLat, to: LonLat, progress: number): LonLat => {
  const p = Math.min(1, Math.max(0, progress));
  return [from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p];
};

/** The shapes for one reveal or for several; `progress` below 1 draws the lines only part of the way. */
export function revealFeatures(reveal: RevealShape | readonly RevealShape[] | null, progress = 1): RevealFeatures {
  if (!reveal) return { line: empty(), sites: empty(), pins: empty() };
  const reveals: readonly RevealShape[] = Array.isArray(reveal) ? (reveal as readonly RevealShape[]) : [reveal as RevealShape];
  const point = (at: LonLat, properties: Record<string, unknown>) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [...at] }, properties });
  const fallback = css("--accent") || "#b5562d";
  const colorOf = (shape: RevealShape) => shape.color ?? fallback;
  return {
    line: { type: "FeatureCollection", features: reveals.map((shape) => ({
      type: "Feature", geometry: { type: "LineString", coordinates: [[...shape.pin], [...alongLine(shape.pin, shape.scored, progress)]] }, properties: { color: colorOf(shape) } })) },
    sites: { type: "FeatureCollection", features: reveals.flatMap((shape) => [
      ...shape.others.map((at) => point(at, { scored: false, color: colorOf(shape) })), point(shape.scored, { scored: true, color: colorOf(shape) })]) },
    pins: { type: "FeatureCollection", features: reveals.map((shape) => point(shape.pin, { color: colorOf(shape) })) },
  };
}

function revealLayers(): LayerSpecification[] {
  const surface = css("--surface") || "#fff";
  const ink = css("--ink") || "#222";
  return [
    { id: "mq-line", type: "line", source: "mq-line", layout: { "line-cap": "round" },
      paint: { "line-color": ["get", "color"], "line-width": 2.5, "line-opacity": 0.9, "line-dasharray": [1.2, 1.6] } },
    { id: "mq-pins", type: "circle", source: "mq-pins",
      paint: { "circle-radius": 5, "circle-color": ink, "circle-stroke-color": surface, "circle-stroke-width": 2 } },
    { id: "mq-other", type: "circle", source: "mq-sites", filter: ["!", ["get", "scored"]],
      paint: { "circle-radius": 7, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": ["get", "color"], "circle-stroke-width": 2 } },
    { id: "mq-scored", type: "circle", source: "mq-sites", filter: ["get", "scored"],
      paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-color": surface, "circle-stroke-width": 2.5 } },
  ];
}

/** The coast, and the shores of the lakes, as a soft line: river polygons are left out so the Nile keeps no banks. */
function coastLayer(theme: Theme): LayerSpecification {
  return {
    id: "mq-coast", type: "line", source: "world", "source-layer": "water",
    filter: ["all", ["==", ["geometry-type"], "Polygon"], ["in", ["get", "kind"], ["literal", ["ocean", "sea", "lake", "water"]]]],
    layout: { "line-join": "round" },
    paint: { "line-color": COAST[theme].color, "line-opacity": COAST[theme].opacity, "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.6, 8, 1.3] },
  };
}

/** Beginner's water names: one symbol layer per "from" zoom, since a layer's minzoom is the one zoom gate a style has. */
function waterNameLayers(flavor: Flavor): LayerSpecification[] {
  const froms = [...new Set(WATER_NAMES.map((water) => water.from))].sort((a, b) => a - b);
  return froms.map((from) => ({
    id: `mq-water-names-${from}`, type: "symbol", source: "mq-water-names", minzoom: from, filter: ["==", ["get", "from"], from],
    layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Italic"], "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 8, 13], "text-letter-spacing": 0.08, "text-max-width": 8, "text-transform": "uppercase" },
    paint: { "text-color": flavor.ocean_label, "text-halo-color": flavor.water, "text-halo-width": 1.2 },
  }));
}

/** The whole style for one theme; `beginner` shows water names; `reveal` is drawn in from the start, so a theme switch
 *  (which replaces the style) keeps the answer on the map. */
export function buildQuestStyle(theme: Theme, beginner: boolean, reveal: RevealShape | readonly RevealShape[] | null = null): StyleSpecification {
  const base = tilesBase();
  const earthy = { ...namedFlavor(theme), ...EARTH[theme], ...QUEST_EARTH[theme] } as Flavor;
  const flavor: Flavor = { ...earthy, landcover: { ...earthy.landcover!, urban_area: earthy.earth } }; // modern towns drawn as open land
  const features = revealFeatures(reveal);
  const basemap = englishLabels(layers("world", flavor, { lang: "en" })).filter((layer) => BLANK_LAYERS.has(layer.id));
  return {
    version: 8,
    glyphs: `${base}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      world: { type: "vector", tiles: [`pmtiles://${MAP_KEY}/{z}/{x}/{y}`], bounds: BOUNDS, minzoom: 0, maxzoom: WORLD_MAX_ZOOM,
        attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>' },
      "mq-water-names": { type: "geojson", data: waterNameFeatures() },
      "mq-line": { type: "geojson", data: features.line },
      "mq-sites": { type: "geojson", data: features.sites },
      "mq-pins": { type: "geojson", data: features.pins },
    },
    layers: [...basemap, coastLayer(theme), ...(beginner ? waterNameLayers(flavor) : []), ...revealLayers()],
  };
}
