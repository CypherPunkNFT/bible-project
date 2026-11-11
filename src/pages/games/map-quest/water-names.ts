// The water names Beginner shows (the audit's item 7: the basemap's own lake labels never appear at the era views, so
// the level's promise of sea and lake names was thin). A short list drawn as the game's own labels, in the same italic
// the basemap uses for water, so the map data stays untouched. Positions are label anchors, not shorelines.
import type { FeatureCollection, Point } from "geojson";

export interface WaterName { name: string; lon: number; lat: number; /** Shown from this zoom. */ from: number }

export const WATER_NAMES: readonly WaterName[] = [
  { name: "Mediterranean Sea", lon: 22, lat: 35, from: 0 },
  { name: "Red Sea", lon: 36.3, lat: 23, from: 0 },
  { name: "Persian Gulf", lon: 51.5, lat: 27.3, from: 0 },
  { name: "Black Sea", lon: 34, lat: 43.3, from: 0 },
  { name: "Aegean Sea", lon: 25.2, lat: 38.6, from: 4 },
  { name: "Sea of Galilee", lon: 35.59, lat: 32.82, from: 6 },
  { name: "Dead Sea", lon: 35.49, lat: 31.4, from: 6 },
  { name: "Jordan River", lon: 35.56, lat: 32.2, from: 7 },
  { name: "Nile", lon: 31.1, lat: 28.5, from: 4 },
  { name: "Euphrates", lon: 40.5, lat: 35.5, from: 4 },
  { name: "Tigris", lon: 43.2, lat: 36.2, from: 4 },
];

export function waterNameFeatures(names: readonly WaterName[] = WATER_NAMES): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: names.map((water) => ({ type: "Feature", geometry: { type: "Point", coordinates: [water.lon, water.lat] }, properties: { name: water.name, from: water.from } })),
  };
}
