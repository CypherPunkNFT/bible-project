// Where a round opens and whether its answer is in that view (the audit's item 7): the era views are fixed boxes, and
// a few places (Babylon or Nineveh in the Life of Jesus era) lie outside them, so the round says "further afield" and
// the player knows to zoom out. A place counts as in view when any of its credible sites is inside the box, with a
// small margin so a site right on the edge is not called far.
import type { LonLat } from "./geo";

export type View = [number, number, number, number];

const EDGE_MARGIN_DEGREES = 0.25;

/** True when the site is inside the view box (west, south, east, north), the margin allowed. */
export function inView(site: LonLat, view: View, margin = EDGE_MARGIN_DEGREES): boolean {
  const [west, south, east, north] = view;
  const [lon, lat] = site;
  return lon >= west - margin && lon <= east + margin && lat >= south - margin && lat <= north + margin;
}

/** True when none of the sites a pin is scored against lies in the opening view: the player must zoom out to be right. */
export const furtherAfield = (sites: readonly LonLat[], view: View): boolean => sites.length > 0 && !sites.some((site) => inView(site, view));
