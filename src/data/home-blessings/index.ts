// Blessings for the home: every page in hub order, the addresses the sitemap lists, and the print limits a test holds every
// item to (design 3.2, 6.1, 9.1). Adding a page means adding one entry to a group file and its slug to HUB_ORDER.
import { CHILDREN_PAGES } from "./children";
import { HOUSE_PAGES } from "./house";
import { OLDER_TEXTS } from "./older";
import { SCRIPTURE_PAGES } from "./scripture";
import { TABLE_PAGES } from "./table";
import type { BlessingGroup, BlessingItem, BlessingPage, PrintLayout } from "./types";

export type {
  BlessingGroup, BlessingItem, BlessingPage, FillInItem, OlderId, OlderItem, OlderText, PrintLayout, ScriptureItem, Station, WrittenItem,
} from "./types";
export { DEATH_NOTE, OLDER_TEXTS, olderCredit } from "./older";

export const BLESSINGS_PATH = "/blessings";
export const NAME_TOKEN = "[name]";

/** The hub's four groups, in order (design 5.3). */
export const GROUPS: { id: BlessingGroup; title: string }[] = [
  { id: "house", title: "For the house" },
  { id: "table", title: "At the table" },
  { id: "children", title: "For children" },
  { id: "scripture", title: "From Scripture" },
];

export const HUB_ORDER: readonly string[] = [
  "house-blessing", "room-by-room", "before-meals", "holiday-meals", "graces-for-kids", "bedtime", "blessing-your-children", "scripture-blessings",
];

const ALL = [...HOUSE_PAGES, ...TABLE_PAGES, ...CHILDREN_PAGES, ...SCRIPTURE_PAGES];
const bySlug = new Map(ALL.map((page) => [page.slug, page]));

/** Every page, in hub order. */
export const BLESSING_PAGES: BlessingPage[] = HUB_ORDER.map((slug) => {
  const page = bySlug.get(slug);
  if (!page) throw new Error(`home-blessings: HUB_ORDER names "${slug}", which no group file defines`);
  return page;
});

/** Every page a group file defines, whether or not HUB_ORDER lists it (the tests compare the two). */
export const DEFINED_PAGES: readonly BlessingPage[] = ALL;

export function pageBySlug(slug: string | undefined): BlessingPage | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export const pagePath = (page: Pick<BlessingPage, "slug">): string => `${BLESSINGS_PATH}/${page.slug}`;

/** The hub and every page: the indexable addresses. */
export function homeBlessingPaths(): string[] {
  return [BLESSINGS_PATH, ...BLESSING_PAGES.map(pagePath)];
}

/** Which layouts each page offers (design 6.1, "Offered on"). */
export const PAGE_LAYOUTS: Record<string, readonly PrintLayout[]> = {
  "house-blessing": ["wall", "cards"],
  "room-by-room": ["order"],
  "before-meals": ["cards", "table-card"],
  "holiday-meals": ["cards", "table-card"],
  "graces-for-kids": ["cards", "table-card", "colouring"],
  bedtime: ["wall", "cards", "colouring"],
  "blessing-your-children": ["wall", "cards", "colouring"],
  "scripture-blessings": ["wall", "cards"],
};

export interface LayoutLimit {
  words: number;
  /** Characters of the words, lines joined by single spaces; absent where the line count is the only measure. */
  characters?: number;
  lines: number;
  perLine: number;
}

/** The fixed-size layouts' limits (design 6.1). The order layout flows over as many pages as it needs. */
export const LAYOUT_LIMITS: Record<Exclude<PrintLayout, "order">, LayoutLimit> = {
  wall: { words: 90, characters: 520, lines: 14, perLine: 44 },
  cards: { words: 60, characters: 360, lines: 12, perLine: 34 },
  "table-card": { words: 45, characters: 280, lines: 6, perLine: 60 },
  // Design 6.1 says 50 words, but names Duncan's 51-word verses as this layout's test item: the printed-line limit binds.
  colouring: { words: 51, lines: 14, perLine: 32 },
};

/** A card goes up from 14 pt to 18 pt when its words fit this many printed lines at this width (design 6.1). */
export const LARGE_CARD = { lines: 8, perLine: 26 };

export const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;

/**
 * Printed lines (design 6.1): every stored line is wrapped at whole words to `perLine` characters, and a stanza break ("")
 * counts as a line. A word longer than the line takes a line of its own.
 */
export function printedLines(lines: readonly string[], perLine: number): number {
  let total = 0;
  for (const line of lines) {
    const words = line.split(/\s+/).filter(Boolean);
    if (!words.length) { total += 1; continue; }
    let current = 0;
    let count = 1;
    for (const word of words) {
      if (current === 0) current = word.length;
      else if (current + 1 + word.length <= perLine) current += 1 + word.length;
      else { count += 1; current = word.length; }
    }
    total += count;
  }
  return total;
}

export const textCharacters = (lines: readonly string[]): number => lines.filter(Boolean).join(" ").length;

/** Do these lines fit a layout's limits? */
export function fitsLayout(lines: readonly string[], layout: Exclude<PrintLayout, "order">): boolean {
  const limit = LAYOUT_LIMITS[layout];
  const words = wordCount(lines.join(" "));
  if (words > limit.words) return false;
  if (limit.characters !== undefined && textCharacters(lines) > limit.characters) return false;
  return printedLines(lines, limit.perLine) <= limit.lines;
}

/** Is this card printed at 18 pt? */
export const largeCard = (lines: readonly string[]): boolean => printedLines(lines, LARGE_CARD.perLine) <= LARGE_CARD.lines;

/** A written item's lines: prose is one line, a rhyme keeps its breaks. */
export const writtenLines = (text: string): string[] => text.split("\n");

/** The stored lines of a written or older item (Scripture's words load from the Berean, so they are not here). */
export function storedLines(item: BlessingItem): string[] | null {
  if (item.kind === "written") return writtenLines(item.text);
  if (item.kind === "older") return OLDER_TEXTS[item.id].lines;
  return null;
}
