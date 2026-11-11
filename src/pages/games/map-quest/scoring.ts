// Points for a pin (design §6): 1,000 inside 3 km, falling on a logarithmic curve to 0 at 2,500 km, so one formula
// still tells Bethel from Jerusalem (17 km) yet gives fair credit for Babylon from 200 km.
import { haversineKm, type LonLat } from "./geo";

export { haversineKm, type LonLat };

export const MAX_POINTS = 1000;
const FULL_MARKS_KM = 3;
const ZERO_KM = 2500;
const SCALE_KM = 10;

/** Points for a miss of `km`, rounded to a whole point. */
export function scoreForDistance(km: number): number {
  if (!(km < ZERO_KM)) return 0;
  const over = Math.max(0, km - FULL_MARKS_KM);
  return Math.round(MAX_POINTS * (1 - Math.log(1 + over / SCALE_KM) / Math.log(1 + (ZERO_KM - FULL_MARKS_KM) / SCALE_KM)));
}

export type Band = "bullseye" | "green" | "yellow" | "orange" | "red";

/** The colour a result gets in the summary and the share grid. */
export function bandFor(points: number): Band {
  if (points >= 950) return "bullseye";
  if (points >= 800) return "green";
  if (points >= 600) return "yellow";
  if (points >= 350) return "orange";
  return "red";
}

export const BAND_EMOJI: Record<Band, string> = { bullseye: "🎯", green: "🟩", yellow: "🟨", orange: "🟧", red: "🟥" };

/** The site a pin is scored against: the nearest of the place's credible sites. */
export function nearestSite(pin: LonLat, sites: readonly LonLat[]): { site: LonLat; km: number } {
  let best = { site: sites[0], km: haversineKm(pin, sites[0]) };
  for (const site of sites.slice(1)) {
    const km = haversineKm(pin, site);
    if (km < best.km) best = { site, km };
  }
  return best;
}

export const KM_PER_MILE = 1.609344;
