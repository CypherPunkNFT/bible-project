// A story's passage ("GEN 18:9-15; GEN 21:1-7") read as books, verse ranges and the reader's address (design §7, §10).
import { bookByCode } from "@/lib/refs";
import type { Catalog } from "@/lib/types";

export interface Range {
  book: string;
  chapter: number;
  verse: number;
  endChapter: number;
  endVerse: number;
}

export function parseRef(ref: string): Range[] {
  return ref.split(";").map((part) => {
    const match = /^\s*([1-3A-Z]{3}) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?\s*$/.exec(part);
    if (!match) throw new Error(`emoji stories: cannot read the passage ${JSON.stringify(part)} in ${JSON.stringify(ref)}`);
    const chapter = Number(match[2]), verse = Number(match[3]);
    const endChapter = match[4] ? Number(match[4]) : chapter;
    return { book: match[1], chapter, verse, endChapter, endVerse: match[5] ? Number(match[5]) : verse };
  });
}

/** The books of a passage, in order, each once. */
export const booksOf = (ref: string): string[] => [...new Set(parseRef(ref).map((range) => range.book))];

/** The site's verse ids (book × 1,000,000 + chapter × 1,000 + verse) of a one-range passage such as a key verse. */
export function verseIds(catalog: Catalog, ref: string): { from: number; to: number } | null {
  const [range] = parseRef(ref);
  const book = bookByCode(catalog, range.book);
  if (!book) return null;
  const base = book.num * 1_000_000;
  return { from: base + range.chapter * 1000 + range.verse, to: base + range.endChapter * 1000 + range.endVerse };
}

/** "Read the story": the passage start, with its verses highlighted when it is one range in one chapter. */
export function readHref(ref: string): string {
  const [first, ...rest] = parseRef(ref);
  const oneChapter = !rest.length && first.endChapter === first.chapter;
  const highlight = oneChapter && first.endVerse > first.verse ? `${first.verse}-${first.endVerse}` : String(first.verse);
  return `/read/bsb/${first.book}/${first.chapter}?hl=${highlight}`;
}
