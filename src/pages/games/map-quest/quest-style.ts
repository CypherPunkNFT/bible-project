// The blank physical map (design §8): the atlas's own earth-toned basemap with every label, border and place dot
// taken away. Beginner adds sea, lake and river names back. Only the coarse "world" layer (zoom 0-8) is used: the sharp
// "detail" layer exists only near Bible places, so its patches would show where the answers are.
import { layers, namedFlavor, type Flavor } from "@protomaps/basemaps";
import type { FeatureCollection, Geometry } from "geojson";
import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import { BOUNDS, EARTH, MAP_KEY, englishLabels, tilesBase } from "@/components/atlas/street-style";
import type { Theme } from "@/lib/theme";
import type { LonLat } from "./geo";

const BLANK_LAYERS = new Set(["background", "earth", "landcover", "landuse_park", "landuse_beach", "water", "water_stream", "water_river"]);
const BEGINNER_LABELS = new Set(["water_label_ocean", "water_label_lakes", "water_waterway_label"]);
const WORLD_MAX_ZOOM = 8;
/** The world layer stretched two levels further: at zoom 8 one pixel is already about 0.5 km. */
export const QUEST_MAX_ZOOM = 10;

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** What the reveal draws: a dashed line from the pin to the scored site, the scored site, and the other sites as rings. */
export interface RevealShape { pin: LonLat; scored: LonLat; others: readonly LonLat[] }

export function revealFeatures(reveal: RevealShape | null): { line: FeatureCollection<Geometry>; sites: FeatureCollection<Geometry> } {
  if (!reveal) return { line: { type: "FeatureCollection", features: [] }, sites: { type: "FeatureCollection", features: [] } };
  const point = (at: LonLat, scored: boolean) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [...at] }, properties: { scored } });
  return {
    line: { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "LineString", coordinates: [[...reveal.pin], [...reveal.scored]] }, properties: {} }] },
    sites: { type: "FeatureCollection", features: [...reveal.others.map((at) => point(at, false)), point(reveal.scored, true)] },
  };
}

function revealLayers(): LayerSpecification[] {
  const accent = css("--accent") || "#b5562d";
  const surface = css("--surface") || "#fff";
  const ink = css("--ink") || "#222";
  return [
    { id: "mq-line", type: "line", source: "mq-line", layout: { "line-cap": "round" },
      paint: { "line-color": ink, "line-width": 2, "line-opacity": 0.75, "line-dasharray": [1.5, 1.5] } },
    { id: "mq-other", type: "circle", source: "mq-sites", filter: ["!", ["get", "scored"]],
      paint: { "circle-radius": 7, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": accent, "circle-stroke-width": 2 } },
    { id: "mq-scored", type: "circle", source: "mq-sites", filter: ["get", "scored"],
      paint: { "circle-radius": 8, "circle-color": accent, "circle-stroke-color": surface, "circle-stroke-width": 2.5 } },
  ];
}

/** The whole style for one theme; `beginner` shows water names. */
export function buildQuestStyle(theme: Theme, beginner: boolean): StyleSpecification {
  const base = tilesBase();
  const earthy = { ...namedFlavor(theme), ...EARTH[theme] } as Flavor;
  const flavor: Flavor = { ...earthy, landcover: { ...earthy.landcover!, urban_area: earthy.earth } }; // modern towns drawn as open land
  const keep = (id: string) => BLANK_LAYERS.has(id) || (beginner && BEGINNER_LABELS.has(id));
  const empty = revealFeatures(null);
  return {
    version: 8,
    glyphs: `${base}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      world: { type: "vector", tiles: [`pmtiles://${MAP_KEY}/{z}/{x}/{y}`], bounds: BOUNDS, minzoom: 0, maxzoom: WORLD_MAX_ZOOM,
        attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>' },
      "mq-line": { type: "geojson", data: empty.line },
      "mq-sites": { type: "geojson", data: empty.sites },
    },
    layers: [...englishLabels(layers("world", flavor, { lang: "en" })).filter((layer) => keep(layer.id)), ...revealLayers()],
  };
}
