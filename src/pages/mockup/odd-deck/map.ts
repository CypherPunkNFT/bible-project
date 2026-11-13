import { MAP_DOTS } from "./deck";

// The map's dots cover Egypt to Persia (the bounds the card script keeps them inside); a map zooms to the points it
// shows, at least `span` degrees of longitude wide, in a 200 by 110 frame.
export const MAP_W = 200, MAP_H = 110;
export const DOTS_LON = [29, 49], DOTS_LAT = [27, 38];
export function mapFrame(points: [number, number][], span: number) {
  const inside = points.map(([lon, lat]) => [Math.min(DOTS_LON[1], Math.max(DOTS_LON[0], lon)), Math.min(DOTS_LAT[1], Math.max(DOTS_LAT[0], lat))]);
  const lons = inside.map((p) => p[0]), lats = inside.map((p) => p[1]);
  const midLon = (Math.min(...lons) + Math.max(...lons)) / 2, midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const wide = Math.max(span, (Math.max(...lons) - Math.min(...lons)) * 1.35, (Math.max(...lats) - Math.min(...lats)) * 1.35 * (MAP_W / MAP_H));
  const tall = wide * (MAP_H / MAP_W);
  const x = (lon: number) => ((lon - (midLon - wide / 2)) / wide) * MAP_W;
  const y = (lat: number) => MAP_H - ((lat - (midLat - tall / 2)) / tall) * MAP_H;
  const dots = MAP_DOTS.filter(([lon, lat]) => Math.abs(lon - midLon) <= wide / 2 && Math.abs(lat - midLat) <= tall / 2);
  return { x, y, dots, scale: 6 / wide };
}
