// The slide maker's choices as they sit in the address (?ref=Psalm+23&layout=left&theme=paper), so a set of slides can
// be bookmarked or sent as a link. Anyone can write a link, so every value is checked against the lists in templates.ts
// and anything unknown falls back to the default; only choices that differ from the default are written back.
import { MAX_REFERENCE } from "@/pages/citation-generator/parse";
import { FONTS, LAYOUTS, PER_SLIDE, SHAPES, SIZES, THEMES, type FontId, type LayoutId, type PerSlideId, type ShapeId, type SizeId, type ThemeId } from "./templates";

export interface Choices {
  layout: LayoutId;
  font: FontId;
  theme: ThemeId;
  shape: ShapeId;
  per: PerSlideId;
  size: SizeId;
  /** Verse numbers on the slides. */
  numbers: boolean;
  /** The reference at the foot of each slide. */
  footer: boolean;
  /** A first slide with the passage's name. */
  title: boolean;
}

export const DEFAULT_CHOICES: Choices = {
  layout: "centre", font: "serif", theme: "night", shape: "wide", per: "verse", size: "large", numbers: false, footer: true, title: true,
};

const SWITCHES = ["numbers", "footer", "title"] as const;
const PICKS = { layout: LAYOUTS, font: FONTS, theme: THEMES, shape: SHAPES, per: PER_SLIDE, size: SIZES } as const;
type PickKey = keyof typeof PICKS;
const PICK_KEYS = Object.keys(PICKS) as PickKey[];

const oneOf = (list: readonly { id: string }[], value: string | null) => (value && list.some((item) => item.id === value) ? value : null);

/** The reference typed, as the address holds it: trimmed and no longer than the reference box takes. */
export const readReference = (params: URLSearchParams): string => (params.get("ref") ?? "").slice(0, MAX_REFERENCE).trim();

export function readChoices(params: URLSearchParams): Choices {
  const choices: Choices = { ...DEFAULT_CHOICES };
  for (const key of PICK_KEYS) {
    const value = oneOf(PICKS[key], params.get(key));
    if (value) (choices as unknown as Record<string, string>)[key] = value;
  }
  for (const key of SWITCHES) {
    const value = params.get(key);
    if (value === "1" || value === "0") choices[key] = value === "1";
  }
  return choices;
}

/** The address's query for a reference and choices, with only what differs from the defaults. */
export function writeParams(reference: string, choices: Choices): Record<string, string> {
  const params: Record<string, string> = {};
  if (reference) params.ref = reference.slice(0, MAX_REFERENCE);
  for (const key of PICK_KEYS) if (choices[key] !== DEFAULT_CHOICES[key]) params[key] = choices[key];
  for (const key of SWITCHES) if (choices[key] !== DEFAULT_CHOICES[key]) params[key] = choices[key] ? "1" : "0";
  return params;
}
