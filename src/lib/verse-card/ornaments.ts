// The small line drawings a design may carry (design 4.1–4.2): drawn here as SVG path strings in a 100-unit box, never
// a downloaded picture, so no source needs registering. "rule" is a short thin line between the verse and its reference;
// "sun" is a flat low arc along the bottom edge, made to the card's own width by `sunPath`.

export type OrnamentId = "none" | "rule" | "star" | "sprig" | "sun";

export const ORNAMENT_IDS: readonly OrnamentId[] = ["none", "rule", "star", "sprig", "sun"];

/** Line drawings shown above the verse, in a 100 × 100 box, stroked in the design's accent colour. */
export const ORNAMENT_PATHS: Readonly<Record<"star" | "sprig", string>> = {
  star: "M50 12 L59 39 L88 39 L64 56 L73 84 L50 67 L27 84 L36 56 L12 39 L41 39 Z",
  sprig: "M18 82 C38 64 58 46 86 24 M40 64 C31 54 33 44 43 40 C47 50 46 58 40 64 Z M56 51 C50 40 55 31 65 29 C67 39 63 46 56 51 Z"
    + " M47 58 C57 64 66 62 71 54 C61 49 53 51 47 58 Z M66 42 C75 47 83 45 87 37 C78 33 71 35 66 42 Z",
};

/** The low sun: a flat arc rising from the bottom edge, centred, a little over half the card wide. */
export function sunPath(width: number, height: number): string {
  const radius = Math.round(width * 0.3);
  const rise = Math.round(Math.min(height * 0.1, width * 0.09));
  const centre = width / 2;
  return `M${centre - radius} ${height} A${radius} ${rise} 0 0 1 ${centre + radius} ${height}`;
}

export const isOrnamentId = (value: unknown): value is OrnamentId => typeof value === "string" && (ORNAMENT_IDS as readonly string[]).includes(value);
