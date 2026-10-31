// MOCK-UP: the drawing helpers of the foursquare city on /home_mockup6: the wall, its gates, and a stretch of wall turning
// its corners. The city of books (E) that first used them was taken out on the owner's word, 2026-10-31; a copy of it is
// in design/home-openings-6-removed/city-of-books/.
import type { CSSProperties } from "react";

const fixed = (value: number) => value.toFixed(1);
export const tone = (section: string) => ({ "--tone": `var(--${section})` } as CSSProperties);
export const SECTION_NAMES: Record<string, string> = { history: "Law & history", poetry: "Poetry & wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Letters", revelation: "Revelation" };
export const GATES = [250, 500, 750].flatMap((along) => [[along, 70], [along, 930], [70, along], [930, along]]);

/** A point on the square `inset` in from the city's edge, `share` of the way round clockwise from the north-west corner. */
export function onWall(share: number, inset: number): [number, number] {
  const length = 1000 - inset * 2, side = Math.min(3, Math.floor(share * 4)), along = (share * 4 - side) * length;
  return ([[inset + along, inset], [1000 - inset, inset + along], [1000 - inset - along, 1000 - inset], [inset, 1000 - inset - along]] as [number, number][])[side];
}

/** One book's stretch of wall between two shares of the way round, turning any corner it meets. */
export function stone(start: number, end: number, outer: number, inner: number) {
  const shares = [start, ...[0.25, 0.5, 0.75].filter((corner) => corner > start && corner < end), end];
  const edge = (inset: number) => shares.map((share) => onWall(share, inset));
  return `M${[...edge(outer), ...edge(inner).reverse()].map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join("L")}Z`;
}
