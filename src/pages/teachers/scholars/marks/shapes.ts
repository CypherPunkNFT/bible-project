// The field-shaped mark every Scholars section draws for a person: one shape per field in a 48 × 48 box (circle =
// history, rounded square = languages & texts, hexagon = archaeology & places, tall card = reference works,
// arch = theology), filled faintly in the field's colour, with the person's initials inside.
import type { CSSProperties } from "react";
import type { Field, Scholar } from "@/data/teachers/pages-types";

/** Each field's colour token from the site's palette. */
export const FIELD_TONE: Record<Field, string> = {
  history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels",
};
export const toneVar = (field: Field) => `var(${FIELD_TONE[field]})`;
/** A style that sets `--tone` to the field's colour (the sections' CSS reads `var(--tone)`). */
export const toneStyle = (field: Field): CSSProperties => ({ "--tone": toneVar(field) }) as CSSProperties;

export type ShapeGeometry =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number }
  | { kind: "path"; d: string; round: boolean };

const hexagon = (k: number) => [0, 1, 2, 3, 4, 5].map((i) => {
  const a = Math.PI / 3 * i - Math.PI / 2;
  return `${i ? "L" : "M"}${(24 + 23 * k * Math.cos(a)).toFixed(2)} ${(24 + 23 * k * Math.sin(a)).toFixed(2)}`;
}).join("") + "Z";

/** The field's shape at scale k (1 = the full 48 × 48 box). */
export function fieldShape(field: Field, k: number): ShapeGeometry {
  switch (field) {
    case "history": return { kind: "circle", cx: 24, cy: 24, r: 22 * k };
    case "texts": { const r = 21 * k; return { kind: "rect", x: 24 - r, y: 24 - r, width: 2 * r, height: 2 * r, rx: 11 * k }; }
    case "places": return { kind: "path", d: hexagon(k), round: true };
    case "reference": return { kind: "rect", x: 24 - 16 * k, y: 24 - 22 * k, width: 32 * k, height: 44 * k, rx: 7 * k };
    case "theology": {
      const w = 19 * k, top = 24 - 21 * k, bot = 24 + 21 * k;
      return { kind: "path", d: `M${24 - w} ${bot}V${top + w}A${w} ${w} 0 0 1 ${24 + w} ${top + w}V${bot}Z`, round: false };
    }
  }
}

/** One or two initials: "Flavius Josephus" → FJ, "Jerome" → J, "Eusebius of Caesarea" → E (von / van / de skipped). */
export function initials(scholar: Scholar): string {
  const words = scholar.name.split(/ (?:of|the) /)[0].split(" ").filter((w) => w && !/^(von|van|de)$/i.test(w));
  if (!words.length) return scholar.name.slice(0, 1);
  return words.length === 1 ? words[0][0] : words[0][0] + words[words.length - 1][0];
}
