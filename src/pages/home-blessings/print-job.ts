// What a print draws (design 6.1, 6.2): the chosen layout and paper, the personal fields, and each item reduced to the
// lines, heading and credit a sheet needs. Pure, so the sheets and their tests share it.
import { largeCard, OLDER_TEXTS, olderCredit, writtenLines, type BlessingItem, type BlessingPage, type PrintLayout, type Station } from "@/data/home-blessings";
import type { Paper } from "@/pages/life-events/print-sheet";
import type { ShownSympathy } from "@/pages/sympathy/useSympathyPassages";
import { cleanName, FAMILY_LINE_MAX, NAME_HEADING_MAX } from "./message";

export type Theme = "house" | "table" | "night";

export interface PrintText {
  id: string;
  /** "A grace for every day", "Psalm 4:8", "Jesus, tender Shepherd". */
  heading: string;
  lines: string[];
  /** "John Cennick, 1741", "Psalm 4:8 · Berean Standard Bible", "Rooted in James 1:17 · Psalm 136:1". */
  credit: string;
  /** Holds "[name]": the sheet fills it in, or leaves a line to write on. */
  forSomeone: boolean;
  /** Scripture is printed in italic and needs the Berean line. */
  scripture: boolean;
  /** Scripture and older texts stay English (lang="en") whatever language the site is shown in. */
  english: boolean;
  /** The fill-in card's prompts, each with writing lines. */
  prompts?: string[];
}

export interface PrintJob {
  layout: PrintLayout;
  paper: Paper;
  slug: string;
  theme: Theme;
  texts: PrintText[];
  /** Order layout only: the stations the family ticked. */
  stations?: { station: Station; reading: ShownSympathy }[];
  /** Order layout only: the closing words (the Doxology and Numbers 6). */
  closing?: PrintText[];
  /** Wall print on the house pages: "The Okafor home · 2026". */
  familyLine: string;
  /** A heading above the words: "For Lily". */
  nameHeading: string;
  /** Fills "[name]" in a written blessing for someone. */
  name: string;
  /** Cut guides (cards) or the fold guide (table card). */
  guides: boolean;
}

/** The colouring border and ornament for a page (design 6.1). */
export function themeOf(page: Pick<BlessingPage, "slug" | "group">): Theme {
  if (page.slug === "bedtime" || page.slug === "blessing-your-children") return "night";
  if (page.group === "table" || page.slug === "graces-for-kids") return "table";
  return "house";
}

export function printText(item: BlessingItem, verses: ReadonlyMap<unknown, ShownSympathy>): PrintText {
  if (item.kind === "written") {
    const references = item.rootedIn.map((passage) => verses.get(passage)?.reference).filter(Boolean);
    return { id: item.id, heading: item.label, lines: writtenLines(item.text), credit: references.length ? `Rooted in ${references.join(" · ")}` : "", forSomeone: Boolean(item.forSomeone), scripture: false, english: false };
  }
  if (item.kind === "older") {
    const text = OLDER_TEXTS[item.id];
    return { id: item.id, heading: text.title, lines: text.lines, credit: olderCredit(text), forSomeone: false, scripture: false, english: true };
  }
  if (item.kind === "scripture") {
    const verse = verses.get(item.passage);
    return { id: item.id, heading: verse?.reference ?? "", lines: [verse?.text ?? ""], credit: `${verse?.reference ?? ""} · Berean Standard Bible`, forSomeone: false, scripture: true, english: true };
  }
  const references = item.rootedIn.map((passage) => verses.get(passage)?.reference).filter(Boolean);
  return { id: item.id, heading: item.label, lines: [], credit: references.join(" · "), forSomeone: false, scripture: false, english: false, prompts: item.prompts };
}

/** A card at 18 pt or 14 pt (design 6.1); the fill-in card keeps its own size. */
export const cardSize = (text: PrintText): "large" | "regular" => (!text.prompts && largeCard(text.lines) ? "large" : "regular");

/** Cards in sheets of four, in order (design 6.1: "print a set" of nine makes three sheets). */
export function inSheets<T>(texts: T[], perSheet = 4): T[][] {
  const sheets: T[][] = [];
  for (let index = 0; index < texts.length; index += perSheet) sheets.push(texts.slice(index, index + perSheet));
  return sheets;
}

export const cleanFields = (job: Pick<PrintJob, "familyLine" | "nameHeading" | "name">) => ({
  familyLine: cleanName(job.familyLine, FAMILY_LINE_MAX),
  nameHeading: cleanName(job.nameHeading, NAME_HEADING_MAX),
  name: cleanName(job.name),
});

/** "bibleguide.io/blessings/bedtime", the footer every sheet carries. */
export const footerAddress = (slug: string) => `bibleguide.io/blessings/${slug}`;
