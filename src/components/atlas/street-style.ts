import { layers, namedFlavor, type Flavor } from "@protomaps/basemaps";
import type { FeatureCollection, Point } from "geojson";
import type { FilterSpecification, LayerSpecification, StyleSpecification } from "maplibre-gl";
import { resolvedSectionColors } from "@/lib/sections";
import type { Theme } from "@/lib/theme";
import type { MapPlace } from "./projection";

/** Where the map file, label fonts and icons are served (scripts/atlas-tiles-vite.ts locally; R2 in production). */
export const TILES_BASE = "/atlas-tiles";
export const MAP_FILE = "bible-atlas.pmtiles";

/** Earth tones in place of Protomaps' default greys and cyan, to sit with the site's reading-chart colours. */
const EARTH: Record<Theme, Partial<Flavor>> = {
  light: {
    background: "#e9e1cf", earth: "#efe7d4", water: "#a9c6cf", sand: "#eadcb8", beach: "#eadcb8",
    park_a: "#dbe2c4", park_b: "#d3dcb8", wood_a: "#d6dfbf", wood_b: "#cbd6b0", scrub_a: "#e3e2c3", scrub_b: "#dcdbb9",
    buildings: "#ddd2bd", boundaries: "#b49f84", ocean_label: "#5b7f8a", city_label: "#3d3428", city_label_halo: "#efe7d4",
    country_label: "#7c6a55", state_label: "#9a8873", state_label_halo: "#efe7d4",
    landcover: { grassland: "#e2e5c6", barren: "#f0e2c0", urban_area: "#e6dccb", farmland: "#e4e4c4", glacier: "#f7f5ef", scrub: "#e6e2c2", forest: "#cfdcb6" },
  },
  dark: {
    background: "#1d1a16", earth: "#26221c", water: "#1b2d33", sand: "#332c20", beach: "#332c20",
    park_a: "#253021", park_b: "#28331f", wood_a: "#25301f", wood_b: "#222c1c", scrub_a: "#2b2d20", scrub_b: "#292b1e",
    buildings: "#332e26", boundaries: "#5f5444", ocean_label: "#6f949f", city_label: "#e6dccb", city_label_halo: "#1d1a16",
    country_label: "#a8987f", state_label: "#8a7c68", state_label_halo: "#1d1a16",
    landcover: { grassland: "#2a2f20", barren: "#352d1f", urban_area: "#2c2822", farmland: "#2b301f", glacier: "#3a3a38", scrub: "#2e2e20", forest: "#222d1d" },
  },
};

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Places as map features; the colour is resolved now because the map cannot read CSS variables. */
export function placeFeatures(places: MapPlace[]): FeatureCollection<Point> {
  const colors = resolvedSectionColors();
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      properties: { id: p.id, name: p.name, verses: p.verses.length, color: colors[p.section], uncertain: p.confidence < 0.5 },
    })),
  };
}

function placeLayers(selectedId: string): LayerSpecification[] {
  const surface = css("--surface") || "#fff";
  const ink = css("--ink") || "#222";
  const accent = css("--accent") || "#b5562d";
  const isCluster: FilterSpecification = ["has", "point_count"];
  const notCluster: FilterSpecification = ["!", ["has", "point_count"]];
  return [
    { id: "place-cluster", type: "circle", source: "places", filter: isCluster,
      paint: { "circle-color": surface, "circle-radius": ["step", ["get", "point_count"], 13, 10, 16, 50, 20], "circle-stroke-color": accent, "circle-stroke-width": 1.5 } },
    { id: "place-cluster-count", type: "symbol", source: "places", filter: isCluster,
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Medium"], "text-size": 11, "text-allow-overlap": true },
      paint: { "text-color": ink } },
    { id: "place-selected", type: "circle", source: "places", filter: ["==", ["get", "id"], selectedId],
      paint: { "circle-radius": 11, "circle-color": "transparent", "circle-stroke-color": accent, "circle-stroke-width": 2 } },
    { id: "place-dot", type: "circle", source: "places", filter: notCluster,
      paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 4, 12, 6], "circle-color": ["case", ["get", "uncertain"], surface, ["get", "color"]],
        "circle-stroke-color": ["case", ["get", "uncertain"], ["get", "color"], surface], "circle-stroke-width": 1.5 } },
    { id: "place-label", type: "symbol", source: "places", filter: notCluster,
      layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Medium"], "text-size": 12.5, "symbol-sort-key": ["-", ["get", "verses"]],
        "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 0.8, "text-justify": "auto" },
      paint: { "text-color": ink, "text-halo-color": surface, "text-halo-width": 1.6 } },
  ];
}

/** One line of English per modern label (local name when there is no English one), not English over Hebrew/Arabic. */
function englishLabels(base: LayerSpecification[]): LayerSpecification[] {
  return base.map((layer) => {
    if (layer.type !== "symbol" || !layer.layout?.["text-field"] || layer.id.includes("shield")) return layer;
    return { ...layer, layout: { ...layer.layout, "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]] } };
  });
}

/** The map file holds the world at zoom 0-8 everywhere but zoom 9-15 only near Bible places. */
const WORLD_MAX_ZOOM = 8;
const DETAIL_MIN_ZOOM = 9;

/** The same basemap drawn from one source, with ids made unique per source. */
function basemapLayers(source: "world" | "detail", flavor: Flavor): LayerSpecification[] {
  return englishLabels(layers(source, flavor, { lang: "en" })).map((layer) => ({ ...layer, id: `${source}-${layer.id}` }));
}

/**
 * Two readings of one file, so zooming in between places never shows a blank map. MapLibre does not fall back
 * to a coarser tile when a fine one is missing, so:
 *  - "world" stops at zoom 8 and is stretched beyond it: it shows everywhere, at every zoom;
 *  - "detail" starts at zoom 9 and only exists near places; its land and water fill each tile completely,
 *    so wherever it exists it hides the stretched world underneath.
 * World labels stop at zoom 9 so they never crowd out the sharper street-level labels.
 */
function layeredBasemap(flavor: Flavor): LayerSpecification[] {
  const world = basemapLayers("world", flavor).map((layer) =>
    layer.type === "symbol" ? { ...layer, maxzoom: Math.min(layer.maxzoom ?? 24, DETAIL_MIN_ZOOM) } : layer);
  const detail = basemapLayers("detail", flavor).filter((layer) => layer.type !== "background");
  return [...world, ...detail];
}

/** The whole map style: earth-toned OpenStreetMap basemap underneath, the Bible places on top. */
export function buildStyle(theme: Theme, places: MapPlace[], selectedId: string): StyleSpecification {
  const base = new URL(TILES_BASE, window.location.href).href.replace(/\/$/, "");
  const flavor: Flavor = { ...namedFlavor(theme), ...EARTH[theme] } as Flavor;
  const tiles = [`pmtiles://${base}/${MAP_FILE}/{z}/{x}/{y}`];
  return {
    version: 8,
    glyphs: `${base}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${base}/sprites/v4/${theme}`,
    sources: {
      world: { type: "vector", tiles, minzoom: 0, maxzoom: WORLD_MAX_ZOOM,
        attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>' },
      detail: { type: "vector", tiles, minzoom: DETAIL_MIN_ZOOM, maxzoom: 15 },
      places: { type: "geojson", data: placeFeatures(places), cluster: true, clusterRadius: 38, clusterMaxZoom: 11 },
    },
    layers: [...layeredBasemap(flavor), ...placeLayers(selectedId)],
  };
}
