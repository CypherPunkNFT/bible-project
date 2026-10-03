import { geoMercator } from "d3-geo";
import map from "@/data/atlas-map.json";
import type { Place, SectionId } from "@/lib/types";

export interface MapPlace extends Place {
  section: SectionId;
  x: number;
  y: number;
}

/** Same projection scripts/build-map.mjs used to pre-draw the land. */
const projection = geoMercator()
  .scale(map.scale)
  .translate(map.translate as [number, number]);

export function projectPlace(place: Place): [number, number] {
  return projection([place.lon, place.lat]) ?? [-100, -100];
}
