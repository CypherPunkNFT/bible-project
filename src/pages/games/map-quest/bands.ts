// Each scoring band's colour, in two forms: a CSS expression for the page (the trail, the bars, the sheet) and a resolved
// hex for the map, which cannot read CSS variables. A bullseye wears the site's gold, the rest run green to red.
import type { Band } from "./scoring";
import type { TrailMark } from "../kit";

export const BAND_CSS: Record<Band, string> = {
  bullseye: "var(--accent)", green: "#2f8a4f", yellow: "#c99a2e", orange: "#d9772b", red: "var(--red-letter)",
};

/** The trail's mark for a band: a bullseye or green is right, yellow and orange part, red wrong. */
export const BAND_MARK: Record<Band, Exclude<TrailMark, "empty" | "current">> = { bullseye: "right", green: "right", yellow: "part", orange: "part", red: "wrong" };

/** The sheet's tint for a band. */
export const BAND_TONE: Record<Band, "right" | "part" | "wrong"> = BAND_MARK;

const css = (name: string) => (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(name).trim());

/** The band's colour as the map needs it (a plain colour, never a variable). */
export function resolvedBandColor(band: Band): string {
  if (band === "bullseye") return css("--accent") || "#b5562d";
  if (band === "red") return css("--red-letter") || "#b3261e";
  return BAND_CSS[band];
}
