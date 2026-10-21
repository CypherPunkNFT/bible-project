import type { Stats } from "@/lib/types";
import { PARTS, type Part, type PartId } from "./part-content";

/** One chapter of the 66 books, in order: the unit the river draws and the panel shows. */
export interface Bar {
  code: string;
  name: string;
  section: PartId;
  chapter: number;
  verses: number;
  words: number;
  /** words of Jesus */
  red: number;
  /** index into Library.books */
  book: number;
  /** index into Library.bars */
  index: number;
}

export interface BookSpan {
  index: number;
  code: string;
  name: string;
  section: PartId;
  /** index of the book's first chapter in Library.bars */
  start: number;
  count: number;
  words: number;
}

export interface Library {
  bars: Bar[];
  books: BookSpan[];
}

export type Metric = "verses" | "words" | "red";

export const PART_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<PartId, Part>;

/** Reading time at 200 words a minute, never less than one minute. */
export const minutesToRead = (words: number) => Math.max(1, Math.round(words / 200));

export function buildLibrary(stats: Stats): Library {
  const bars: Bar[] = [];
  const books: BookSpan[] = [];
  for (const book of stats.books) {
    if (book.section === "apocrypha") continue;
    const section = book.section;
    books.push({ index: books.length, code: book.code, name: book.name, section, start: bars.length, count: book.chapters.length, words: book.words });
    book.chapters.forEach(([verses, words, red], i) =>
      bars.push({ code: book.code, name: book.name, section, chapter: i + 1, verses, words, red, book: books.length - 1, index: bars.length }),
    );
  }
  return { bars, books };
}

/** "ROM.8" (the address bar's ?c=) to a chapter index, or -1. */
export function findChapter(library: Library, address: string | null): number {
  const match = /^([0-9A-Z]{3})\.(\d{1,3})$/.exec(address ?? "");
  if (!match) return -1;
  const book = library.books.find((b) => b.code === match[1]);
  const chapter = Number(match[2]);
  return book && chapter >= 1 && chapter <= book.count ? book.start + chapter - 1 : -1;
}

export interface PartFigures {
  bars: Bar[];
  books: BookSpan[];
  verses: number;
  words: number;
  red: number;
  /** percentage of all the Bible's words */
  share: number;
  longest: Bar;
  shortest: Bar;
  biggestBook: BookSpan;
}

export function partFigures(library: Library, id: PartId): PartFigures {
  const bars = library.bars.filter((b) => b.section === id);
  const books = library.books.filter((b) => b.section === id);
  const sum = (key: Metric) => bars.reduce((total, bar) => total + bar[key], 0);
  const allWords = library.bars.reduce((total, bar) => total + bar.words, 0);
  return {
    bars,
    books,
    verses: sum("verses"),
    words: sum("words"),
    red: sum("red"),
    share: (sum("words") / allWords) * 100,
    longest: bars.reduce((a, b) => (b.verses > a.verses ? b : a)),
    shortest: bars.reduce((a, b) => (b.verses < a.verses ? b : a)),
    biggestBook: books.reduce((a, b) => (b.words > a.words ? b : a)),
  };
}
