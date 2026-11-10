// The six designs a card can wear (docs/features/verse-cards/design.md 4.2), the contrast check every design passes
// (4.5:1 for all its text, against both ends of a gradient), and the fixed book-to-part table the Book colour design
// reads. Every colour is a constant here, never read from the page's CSS, so a card made in dark mode looks the same as
// one made in light mode: a shared picture must look the same to everyone.
import type { OrnamentId } from "./ornaments";

/** A design as plain data: colours as #rrggbb, an optional ornament id or SVG path (100-unit box). */
export interface Look {
  id: string;
  name: string;
  /** A colour, or a corner-to-corner gradient. */
  background: string | { from: string; to: string };
  text: string;
  /** The reference and the footer. */
  accent: string;
  ornament?: OrnamentId | { path: string; viewBox: number };
  /** Literata for the verse (the default), or Archivo bold, larger and tighter. */
  lettering?: "serif" | "bold";
}

export type LookId = "paper" | "night" | "dawn" | "olive" | "book" | "bold";

export const DEFAULT_LOOK: LookId = "paper";

export const hasOwn = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);

/** The light-theme part colours of src/index.css, copied as constants (Acts sits with the Gospels in the catalogue). */
export const PART_COLOURS = {
  history: "#a14d28", poetry: "#18716a", prophets: "#22599f", gospels: "#6b38a3", epistles: "#87610a", revelation: "#b3263c",
} as const;
export type PartId = keyof typeof PART_COLOURS;

/** Book number (1–66) -> its part of the Bible, as data/catalog.json has it; a test checks the two agree. */
export const BOOK_PARTS: readonly PartId[] = [
  ...Array<PartId>(17).fill("history"), ...Array<PartId>(5).fill("poetry"), ...Array<PartId>(17).fill("prophets"),
  ...Array<PartId>(5).fill("gospels"), ...Array<PartId>(21).fill("epistles"), "revelation",
];

export const BUILT_IN_LOOKS: Readonly<Record<LookId, Look>> = {
  paper: { id: "paper", name: "Paper", background: "#F6F1E7", text: "#2A2420", accent: "#7A5C2A", ornament: "rule" },
  night: { id: "night", name: "Night", background: "#1B2340", text: "#F7F3EA", accent: "#D9C48F", ornament: "star" },
  dawn: { id: "dawn", name: "Dawn", background: { from: "#35264A", to: "#94502F" }, text: "#FFFAF2", accent: "#FFDDB3", ornament: "sun" },
  olive: { id: "olive", name: "Olive", background: "#1F3A2E", text: "#F1EFE6", accent: "#CBD6A0", ornament: "sprig" },
  book: { id: "book", name: "Book colour", background: PART_COLOURS.gospels, text: "#FFFFFF", accent: "#FFFFFF", ornament: "none" },
  bold: { id: "bold", name: "Bold", background: "#000000", text: "#FFFFFF", accent: "#BDBDBD", ornament: "rule", lettering: "bold" },
};

export const LOOK_IDS = Object.keys(BUILT_IN_LOOKS) as LookId[];

/** Design ids once published and since retired -> the design that replaces them. Never remove an entry. Empty at
 *  launch; a test holds every id ever published (the six above and these). */
export const RETIRED_LOOKS: Readonly<Record<string, LookId>> = {};

/** The Book colour design for a book: its part's colour behind white words. */
export function bookLook(book: number): Look {
  const part = BOOK_PARTS[book - 1];
  if (!part) throw new Error(`verse card: no part of the Bible for book ${book} (expected 1 to 66)`);
  return { ...BUILT_IN_LOOKS.book, background: PART_COLOURS[part] };
}

/** WCAG AA for ordinary text. */
export const AA = 4.5;

const HEX = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG 2 contrast ratio of two #rrggbb colours. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Plain sentences naming every colour of the look under 4.5:1 against its background (both ends of a gradient), or a
 *  colour that is not #rrggbb. Empty when the look is fine. */
export function lookProblems(look: Look): string[] {
  const grounds = typeof look.background === "string" ? [look.background] : [look.background.from, look.background.to];
  const named = [["background", ...grounds], ["text", look.text], ["reference and footer", look.accent]] as const;
  const bad = named.flatMap(([what, ...colours]) => colours.filter((colour) => typeof colour !== "string" || !HEX.test(colour)).map((colour) => `The ${look.name} design's ${what} colour ${String(colour)} is not a #rrggbb colour.`));
  if (bad.length) return bad;
  const problems: string[] = [];
  for (const [what, colour] of [["text", look.text], ["reference and footer", look.accent]] as const) {
    for (const ground of grounds) {
      const ratio = contrastRatio(colour, ground);
      if (ratio < AA) problems.push(`The ${look.name} design's ${what} colour ${colour} on ${ground} is ${ratio.toFixed(2)}:1, under ${AA}:1.`);
    }
  }
  return problems;
}
