// Where each point of a RingField sits, and which points are joined to the chosen one.
import { C } from "./field-layout";
import type { AroundPoint, RingDef } from "./around-data";

export interface Placed extends AroundPoint { x: number; y: number; angle: number }

/** Up to `most` points per ring, spread evenly round it; inner rings first, each starting a little further round. */
export function placeRings(rings: RingDef[], points: AroundPoint[], most: number): Placed[] {
  const used = rings.filter((ring) => points.some((p) => p.ring === ring.key));
  const radius = (k: number) => (used.length === 1 ? 300 : 120 + (345 * k) / (used.length - 1));
  return used.flatMap((ring, k) => {
    const list = points.filter((p) => p.ring === ring.key).slice(0, most);
    return list.map((p, i) => {
      const angle = ((-90 + 14 + (332 * (i + 0.2 + ((k * 0.37) % 0.6))) / list.length) * Math.PI) / 180;
      return { ...p, angle, x: C + Math.cos(angle) * radius(k), y: C + Math.sin(angle) * radius(k) };
    });
  });
}

/** Points sharing a verse with the chosen one, or named by it, or naming it. */
export function joinedTo(points: AroundPoint[], chosen: AroundPoint | undefined): Set<string> {
  if (!chosen) return new Set();
  const verses = new Set(chosen.evidence);
  return new Set(points.filter((p) => p.key !== chosen.key && (chosen.links.includes(p.key) || p.links.includes(chosen.key) || p.evidence.some((v) => verses.has(v)))).map((p) => p.key));
}
