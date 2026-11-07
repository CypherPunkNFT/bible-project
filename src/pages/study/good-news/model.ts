// The good news: the page's data, built and checked by design/the-good-news-directions/build-data.py from the study's
// content.md (every Bible quotation word for word the Berean, every quote in the verse cited beside it). Do not edit the
// JSON by hand; change content.md and run the build. A passage holds its verse numbers only; the words come from the
// reader's Bible (src/components/Verse.tsx), which for English is the Berean the build checked against.
import { verseIdOf } from "@/lib/verses";
import type { Catalog } from "@/lib/types";
import raw from "./good-news-data.json";

/** A run of text: plain, italic, bold, a site link, a named study, or a verse reference that opens the sheet. */
export type Run = string | { i: string } | { b: string } | { a: string; t: string } | { s: string | null; t: string } | { r: string; t: string };
export type Block =
  | { k: "p" | "care" | "limits"; runs: Run[] }
  | { k: "h3"; t: string }
  | { k: "quote"; r: string; label: string }
  | { k: "step"; label: string; runs: Run[] };
export interface Part { n: string; title: string; readings: string[]; blocks: Block[]; consider: Run[]; reflect: Run[] }
export interface Question { title: string; blocks: Block[] }
/** `verses`: "chapter:verse" for each verse, in order. */
export interface Passage { label: string; verses: string[] }
export interface NewsRow { r: string; then: string; news: string; response: string | null; note: string }
export interface LostThing { id: string; name: string; count: number; who: string; search: string; end: string; r: string; sr: string; er: string }
export interface GoodNewsData {
  study: {
    title: string; subtitle: string; concepts: string[]; motto: string[]; lead: Run[]; frame: Run[]; selection: Run[];
    opening: { r: string; label: string }[]; parts: Part[]; questions: Question[];
    close: { title: string; way: Run[]; invite: Run[]; question: Run[]; again: Run[]; passage: string };
  };
  passages: Record<string, Passage>;
  news: NewsRow[];
  lost: LostThing[];
  numbers: { parts: number; questions: number; versesShown: number; references: number; luke15: number };
  sources: [string, string][];
}

export const D = raw as unknown as GoodNewsData;

/** A passage's verse ids (its key starts with the book's code, e.g. "LUK.15.1-32"). */
export function passageIds(catalog: Catalog, id: string): number[] {
  const code = id.split(".")[0];
  return (D.passages[id]?.verses ?? []).map((cv) => {
    const [chapter, verse] = cv.split(":").map(Number);
    return verseIdOf(catalog, code, chapter, verse);
  });
}
export const hasPassage = (id: string | null): id is string => Boolean(id && Object.hasOwn(D.passages, id));
