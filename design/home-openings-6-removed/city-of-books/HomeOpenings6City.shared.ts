// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { type CSSProperties } from "react";
export const fixed = (value: number) => value.toFixed(1);

export const tone = (section: string) => ({ "--tone": `var(--${section})` } as CSSProperties);

export const SECTION_NAMES: Record<string, string> = { history: "Law & history", poetry: "Poetry & wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Letters", revelation: "Revelation" };

export function onWall(share: number, inset: number): [number, number] {
  const length = 1000 - inset * 2, side = Math.min(3, Math.floor(share * 4)), along = (share * 4 - side) * length;
  return ([[inset + along, inset], [1000 - inset, inset + along], [1000 - inset - along, 1000 - inset], [inset, 1000 - inset - along]] as [number, number][])[side];
}

export function stone(start: number, end: number, outer: number, inner: number) {
  const shares = [start, ...[0.25, 0.5, 0.75].filter((corner) => corner > start && corner < end), end];
  const edge = (inset: number) => shares.map((share) => onWall(share, inset));
  return `M${[...edge(outer), ...edge(inner).reverse()].map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join("L")}Z`;
}
