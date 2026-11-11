// Distance on the earth, shared by the scoring and the daily schedule. No imports, so the Node build script
// (scripts/build-map-quest-daily.ts) can load it as it is.

/** [longitude, latitude] in degrees. */
export type LonLat = readonly [number, number];

const EARTH_KM = 6371.0088;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in km (haversine, mean earth radius). */
export function haversineKm(a: LonLat, b: LonLat): number {
  const dLat = radians(b[1] - a[1]);
  const dLon = radians(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
