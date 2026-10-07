import { ERAS, eraScale, type Era } from "@/lib/eras";
import type { RulerSummary } from "@/lib/people-pages-index";
import type { Prophet } from "@/lib/study";
import { laneOf } from "./kinds";
import { layoutStrip, placeUndated, type StripLayout } from "./strip-layout";

/**
 * The Rulers guide's layout (RulersRibbon.tsx across the page, RulersColumn.tsx down a phone screen): the world stage's
 * lanes above Israel's, the governors after the exile, then the Herods and Rome.
 */
export const WORLD_LANES = ["egypt", "aram", "assyria", "babylon", "persia", "other"];
export const LANES = [...WORLD_LANES, "tribes", "united", "israel", "judah", "governors", "rome"];
/** The ribbon opens a little before the Exodus, so the Pharaohs of Joseph and of the oppression have room before it. */
const FIRST = 1520, LAST = -100;

/** The New Testament is crowded (the Herods beside Rome's emperors and governors): it and Herod's last decades before
 *  it are drawn wider. */
const crowded = (era: Era): Era => (era.id === "New Testament" ? { ...era, stretch: 2.5 } : era.id === "Between the Testaments" ? { ...era, tail: 45, stretch: 2.5 } : era);
const DESKTOP_ERAS = ERAS.map(crowded);
/** The phone's column has no room for the judges' three centuries: their band is drawn short (their bars follow
 *  the story's order, not years, in any case). */
const PHONE_ERAS = ERAS.map((era) => (era.id === "Judges" || era.id === "Egypt and Wilderness" ? { ...era, compressed: true } : era));

/**
 * Every reign on the shared era bands (eras.ts): dated reigns by their years, undated foreign rulers beside the rulers
 * Scripture names with them (dotted), the judges in story order through their era.
 */
export function ribbonLayout(rulers: RulerSummary[], extent: number, phone = false) {
  const scale = eraScale(extent, FIRST, LAST, phone ? PHONE_ERAS : DESKTOP_ERAS);
  const dated = layoutStrip(rulers, laneOf, LANES, scale.x, extent / 400);
  const judgesEnd = scale.bands.find((b) => b.id === "Judges")?.x1 ?? scale.x(1050);
  const all: StripLayout = placeUndated(dated, rulers, laneOf, {
    start: () => 0, end: (lane) => (lane === "tribes" ? judgesEnd - 4 : undefined),
    yearWidth: (scale.x(900) - scale.x(1000)) / 100, gap: extent / 900, minWidth: extent / 200,
  });
  all.lanes.sort((a, b) => LANES.indexOf(a.id) - LANES.indexOf(b.id));
  return { scale, layout: all };
}

/** The era band a bar's middle falls in: the era a ruler belongs to on the guide. */
export function eraAt(scale: ReturnType<typeof eraScale>, at: number) {
  return scale.bands.find((band) => at >= band.x0 && at <= band.x1) ?? scale.bands[scale.bands.length - 1];
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
