import { ERAS, eraScale } from "@/lib/eras";
import type { RulerSummary } from "@/lib/people-pages-index";
import type { Prophet } from "@/lib/study";
import { laneOf } from "./kinds";
import { layoutStrip, placeUndated, type StripLayout } from "./strip-layout";

/** The Rulers guide's layout (RulersRibbon.tsx across the page, RulersColumn.tsx down a phone screen). */
export const LANES = ["empire", "tribes", "united", "israel", "judah", "governors", "rome"];
const FIRST = 1460, LAST = -100;

/** The phone's column has no room for the judges' three centuries: their band is drawn short (their bars follow
 *  the story's order, not years, in any case). */
const PHONE_ERAS = ERAS.map((era) => (era.id === "Judges" || era.id === "Egypt and Wilderness" ? { ...era, compressed: true } : era));

/** Every reign on the shared era bands (eras.ts): dated reigns by their years, the judges in story order. */
export function ribbonLayout(rulers: RulerSummary[], extent: number, phone = false) {
  const scale = eraScale(extent, FIRST, LAST, phone ? PHONE_ERAS : ERAS);
  const dated = layoutStrip(rulers, laneOf, LANES, scale.x, extent / 400);
  const judgesEnd = scale.bands.find((b) => b.id === "Judges")?.x1 ?? scale.x(1050);
  const all: StripLayout = placeUndated(dated, rulers, laneOf, () => scale.x(1450), judgesEnd - 4, 12, extent / 900);
  all.lanes.sort((a, b) => LANES.indexOf(a.id) - LANES.indexOf(b.id));
  return { scale, layout: all };
}

/** Where a prophet sits on the time line: beside the reign of the king Scripture names, else in the middle of their era. */
export function prophetPositions(prophets: Prophet[], rulers: RulerSummary[], at: (r: RulerSummary) => number | undefined, eraMiddle: (era: string) => number | undefined) {
  const byName = new Map<string, RulerSummary>();
  for (const r of rulers) if (!byName.has(r.name)) byName.set(r.name, r);
  const placed = prophets.flatMap((p) => {
    const king = p.king ? byName.get(p.king) : undefined;
    const x = (king && at(king)) ?? eraMiddle(p.era);
    return x === undefined ? [] : [{ prophet: p, x, row: 0 }];
  }).sort((a, b) => a.x - b.x);
  // Neighbours too close to share a row step down a row (three rows), so medallions never cover each other.
  const last = [-Infinity, -Infinity, -Infinity];
  for (const spot of placed) {
    const row = last.findIndex((x) => spot.x - x > 30);
    spot.row = row < 0 ? last.indexOf(Math.min(...last)) : row;
    last[spot.row] = spot.x;
  }
  return placed;
}
