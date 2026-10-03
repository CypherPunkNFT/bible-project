import type { BookInfo, Catalog, SectionId } from "./types";

/** Canonical verse id BBCCCVVV (scripts/bible/books.py) -> parts. */
export function splitId(id: number): { num: number; chapter: number; verse: number } {
  return { num: Math.floor(id / 1_000_000), chapter: Math.floor(id / 1000) % 1000, verse: id % 1000 };
}

export function bookByNum(catalog: Catalog, num: number): BookInfo | undefined {
  return catalog.books[num - 1]?.num === num ? catalog.books[num - 1] : catalog.books.find((b) => b.num === num);
}

export function bookByCode(catalog: Catalog, code: string): BookInfo | undefined {
  return catalog.books.find((b) => b.code === code);
}

/** "Matthew 21:42" or "Proverbs 8:22–30" or "Genesis 11:32–12:1". */
export function formatRange(catalog: Catalog, start: number, end: number): string {
  const a = splitId(start);
  const book = bookByNum(catalog, a.num)?.name ?? `Book ${a.num}`;
  const head = `${book} ${a.chapter}:${a.verse}`;
  if (!end || end === start) return head;
  const b = splitId(end);
  if (b.num !== a.num) return `${head} – ${bookByNum(catalog, b.num)?.name ?? b.num} ${b.chapter}:${b.verse}`;
  if (b.chapter !== a.chapter) return `${head}–${b.chapter}:${b.verse}`;
  return `${head}–${b.verse}`;
}

export function sectionOfNum(catalog: Catalog, num: number): SectionId {
  return bookByNum(catalog, num)?.section ?? "apocrypha";
}

/** "?hl=4-12" -> [4, 12]: a passage to shade in the reader (study links). Anything else -> null. */
export function parseHighlight(value: string | null): [number, number] | null {
  const match = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(value ?? "");
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  return start >= 1 && end >= start ? [start, end] : null;
}

/** Is a verse label ("12", "12a", "15-16") inside a highlighted passage? */
export function inHighlight(label: string, range: [number, number] | null): boolean {
  if (!range) return false;
  const match = /^(\d+)[a-z]?(?:-(\d+))?/.exec(label);
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  return start <= range[1] && end >= range[0];
}

/** Does a verse label like "12", "12a" or "15-16" cover verse number n? */
export function labelCovers(label: string, n: number): boolean {
  const range = /^(\d+)[a-z]?-(\d+)[a-z]?$/.exec(label);
  if (range) return n >= Number(range[1]) && n <= Number(range[2]);
  const single = /^(\d+)/.exec(label);
  return single ? Number(single[1]) === n : false;
}

/** Look a verse number up in a plain-text book: exact key first, then lettered or ranged labels. */
export function plainLookup(plain: Record<string, string>, chapter: number, verse: number): string | undefined {
  const exact = plain[`${chapter}:${verse}`];
  if (exact !== undefined) return exact;
  const prefix = `${chapter}:`;
  const parts = Object.keys(plain)
    .filter((key) => key.startsWith(prefix) && labelCovers(key.slice(prefix.length), verse))
    .map((key) => plain[key]);
  return parts.length ? parts.join(" ") : undefined;
}
