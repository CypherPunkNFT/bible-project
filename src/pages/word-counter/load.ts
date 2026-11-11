// Reading the whole Berean Standard Bible for the counter: every book's plain words, the same files the site's search
// reads (data/plain/bsb/<BOOK>.json, about 4 MB in all). Each file is fetched once per visit (src/lib/data.ts keeps
// it) and the browser keeps it after that. Nothing is sent anywhere but the request for the file itself.
import { loadPlain } from "@/lib/data";
import type { BookInfo, Catalog } from "@/lib/types";
import type { BookText } from "./count";

export const BIBLE = "bsb";

/** The BSB's books, Genesis to Revelation, as the catalogue lists them. */
export function bibleBooks(catalog: Catalog): BookInfo[] {
  const bsb = catalog.translations.find((translation) => translation.slug === BIBLE);
  return bsb ? catalog.books.filter((book) => bsb.books[book.code]) : [];
}

export interface LoadedBible {
  books: BookText[];
  /** Books whose file could not be read: their verses are not counted, and the page says so. */
  missing: string[];
}

/** Every book's words, in Bible order. `onBook` hears how many books have been tried so far, read or not. */
export async function loadBible(books: readonly BookInfo[], onBook: (settled: number) => void): Promise<LoadedBible> {
  let settled = 0;
  const missing: string[] = [];
  const texts = await Promise.all(books.map((book) => loadPlain(BIBLE, book.code).then(
    (plain) => ({ code: book.code, plain }),
    (error: unknown) => {
      console.error(`word counter: the words of ${BIBLE}/${book.code} could not be loaded`, error);
      missing.push(book.code);
      return null;
    },
  ).finally(() => onBook(++settled))));
  return { books: texts.filter((text): text is BookText => text !== null), missing };
}
