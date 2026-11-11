// The slide maker's choices: layouts, fonts, backgrounds, slide shapes and text sizes, each a fixed template drawn in the
// browser (no pictures are generated). A choice reaches the page from the address, so options.ts reads only the ids
// listed here. Sizes are in slide pixels: 1080 tall, 1920 wide (16:9) or 1440 wide (4:3).

export type LayoutId = "centre" | "left" | "lower-third";
export type FontId = "serif" | "italic" | "sans" | "bold";
export type ThemeId = "night" | "black" | "paper" | "dawn" | "forest" | "clear";
export type ShapeId = "wide" | "standard";
export type PerSlideId = "verse" | "fill";
export type SizeId = "large" | "medium" | "small";

export const LAYOUTS: readonly { id: LayoutId; label: string; what: string }[] = [
  { id: "centre", label: "Centred", what: "The verse in the middle of the slide, the reference beneath." },
  { id: "left", label: "Left", what: "The verse set to the left under a short line, like a page." },
  { id: "lower-third", label: "Lower third", what: "The verse in a band along the bottom, to sit over a camera picture or a livestream." },
];

/** `canvas`: the site's own typefaces, drawn into the pictures. `office`: the typeface named in the PowerPoint file,
 *  one every computer has, so the deck looks the same wherever it is opened. */
export interface FontChoice {
  id: FontId;
  label: string;
  canvas: { family: string; weight: number; italic: boolean };
  office: { family: string; bold: boolean; italic: boolean };
}

export const FONTS: readonly FontChoice[] = [
  { id: "serif", label: "Classic serif", canvas: { family: '"Literata Variable"', weight: 400, italic: false }, office: { family: "Georgia", bold: false, italic: false } },
  { id: "italic", label: "Serif italic", canvas: { family: '"Literata Variable"', weight: 400, italic: true }, office: { family: "Georgia", bold: false, italic: true } },
  { id: "sans", label: "Clean sans", canvas: { family: '"Archivo Variable"', weight: 400, italic: false }, office: { family: "Arial", bold: false, italic: false } },
  { id: "bold", label: "Bold sans", canvas: { family: '"Archivo Variable"', weight: 700, italic: false }, office: { family: "Arial", bold: true, italic: false } },
];

/** A background: one colour, or two blended corner to corner. Colours are six-digit hex without "#". */
export type Fill = { kind: "solid"; color: string } | { kind: "gradient"; from: string; to: string } | { kind: "clear" };

export interface Theme {
  id: ThemeId;
  label: string;
  fill: Fill;
  /** What PowerPoint shows when the pictures would be see-through. */
  officeFill: string;
  text: string;
  /** The reference, the verse numbers and the short line. */
  accent: string;
  /** The lower third's band: a colour and how solid it is (0 to 1). */
  band: { color: string; alpha: number };
}

export const THEMES: readonly Theme[] = [
  { id: "night", label: "Night", fill: { kind: "solid", color: "1B2340" }, officeFill: "1B2340", text: "F7F3EA", accent: "D9C48F", band: { color: "0E1428", alpha: 0.7 } },
  { id: "black", label: "Black", fill: { kind: "solid", color: "000000" }, officeFill: "000000", text: "FFFFFF", accent: "BDBDBD", band: { color: "1C1C1C", alpha: 0.8 } },
  { id: "paper", label: "Paper", fill: { kind: "solid", color: "F6F1E7" }, officeFill: "F6F1E7", text: "2A2420", accent: "8A6A35", band: { color: "E9E0CC", alpha: 0.9 } },
  { id: "dawn", label: "Dawn", fill: { kind: "gradient", from: "35264A", to: "C0704A" }, officeFill: "35264A", text: "FFFAF2", accent: "FFDDB3", band: { color: "241A33", alpha: 0.6 } },
  { id: "forest", label: "Forest", fill: { kind: "solid", color: "1F3A2E" }, officeFill: "1F3A2E", text: "F1EFE6", accent: "CBD6A0", band: { color: "122219", alpha: 0.7 } },
  { id: "clear", label: "See-through", fill: { kind: "clear" }, officeFill: "000000", text: "FFFFFF", accent: "E6E6E6", band: { color: "000000", alpha: 0.55 } },
];

export const SHAPES: readonly { id: ShapeId; label: string; width: number; height: number; emuWidth: number; emuHeight: number }[] = [
  { id: "wide", label: "Wide (16:9)", width: 1920, height: 1080, emuWidth: 12192000, emuHeight: 6858000 },
  { id: "standard", label: "Standard (4:3)", width: 1440, height: 1080, emuWidth: 9144000, emuHeight: 6858000 },
];

export const PER_SLIDE: readonly { id: PerSlideId; label: string }[] = [
  { id: "verse", label: "One verse per slide" },
  { id: "fill", label: "As many verses as fit" },
];

/** `px`: the verse's starting size on a 1080-tall slide (it shrinks to fit). `budget`: about how many letters a slide
 *  holds at that size, used to share verses between slides and to cut a very long verse. */
export const SIZES: readonly { id: SizeId; label: string; px: number; budget: number }[] = [
  { id: "large", label: "Large", px: 96, budget: 120 },
  { id: "medium", label: "Medium", px: 78, budget: 190 },
  { id: "small", label: "Small", px: 62, budget: 280 },
];

/** Slide pixels to PowerPoint's units (EMU): 1920 px is 13.333 inches, 914,400 EMU to the inch. */
export const EMU_PER_PX = 6350;

export const byId = <T extends { id: string }>(list: readonly T[], id: string): T => {
  const found = list.find((item) => item.id === id);
  if (!found) throw new Error(`worship slides: no choice "${id}" among ${list.map((item) => item.id).join(", ")}`);
  return found;
};
