// The distance and points words, and what the map draws for a result; shared by the round and the summary.
import { formatNumber, plural } from "@/lib/site-format";
import { resolvedBandColor } from "./bands";
import type { Result } from "./game";
import type { RevealShape } from "./quest-style";
import { KM_PER_MILE, bandFor } from "./scoring";

export const distanceText = (km: number) => `${formatNumber(Math.round(km))} km (${formatNumber(Math.round(km / KM_PER_MILE))} mi)`;
export const pointsText = (points: number) => plural(points, "{n} point", "{n} points");

/** What the map draws for a result: the pin, the scored site, the other sites, in the band's colour. */
export const shapeOf = (result: Result): RevealShape => ({
  pin: result.pin, scored: result.site, others: result.question.sites.filter((site) => site !== result.site), color: resolvedBandColor(bandFor(result.points)),
});
