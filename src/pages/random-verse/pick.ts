// Picking the verse: which books a choice of "From" covers, the pool a theme leaves, and one draw from it, every verse in
// the pool equally likely. Pure, so the tests can hand it their own random numbers. The address (?v=JHN.3.16&from=nt
// &theme=hope) comes from links anyone can make, so everything read from it is checked here first.
import { isNewTestament } from "@/lib/sections";
import type { BookInfo } from "@/lib/types";
import { THEMES, type Theme } from "./themes";
import { VERSE_COUNTS } from "./verse-counts";

export interface VerseRef { code: string; chapter: number; verse: number }

/** A verse drawn before its chapter is read: the `nth` verse of the chapter (from 0), in order. Some chapters skip a
 * number (the BSB leaves Matthew 17:21 out), so only the chapter itself says which verse that is (load.ts). */
export interface ChapterDraw { code: string; chapter: number; nth: number }

/** Where the verse may come from: the whole Bible (""), one Testament, or one book (its code). */
export type From = "" | "ot" | "nt" | string;

/** A theme's verses, or every verse of the chosen books. */
export type Pool = { kind: "theme"; verses: readonly VerseRef[] } | { kind: "chapters"; books: readonly string[]; total: number };

const KEY = /^([1-3]?[A-Z]{2,3})\.(\d{1,3})\.(\d{1,3})$/;
const owns = (record: object, key: string) => Object.prototype.hasOwnProperty.call(record, key);

export const verseKey = (ref: VerseRef) => `${ref.code}.${ref.chapter}.${ref.verse}`;
export const sameVerse = (a: VerseRef | null, b: VerseRef | null) => !!a && !!b && verseKey(a) === verseKey(b);

/** "JHN.3.16" as a verse, or null unless its book and chapter are in the BSB. Whether the verse itself is there is
 * known only once its chapter is read. */
export function parseVerseKey(value: string | null): VerseRef | null {
  const match = KEY.exec((value ?? "").slice(0, 16));
  if (!match || !owns(VERSE_COUNTS, match[1])) return null;
  const chapter = Number(match[2]);
  const verse = Number(match[3]);
  if (chapter < 1 || chapter > VERSE_COUNTS[match[1]].length || verse < 1) return null;
  return { code: match[1], chapter, verse };
}

/** The "From" an address asks for, or the whole Bible when it names nothing the page offers. */
export function parseFrom(value: string | null): From {
  if (value === "ot" || value === "nt") return value;
  return value && owns(VERSE_COUNTS, value) ? value : "";
}

export const themeById = (id: string | null): Theme | undefined => THEMES.find((theme) => theme.id === id);

/** The books a "From" covers, in Bible order. */
export function booksFrom(from: From, books: readonly BookInfo[]): string[] {
  const bible = books.filter((book) => owns(VERSE_COUNTS, book.code));
  if (from === "") return bible.map((book) => book.code);
  if (from === "ot" || from === "nt") return bible.filter((book) => isNewTestament(book.section) === (from === "nt")).map((book) => book.code);
  return bible.some((book) => book.code === from) ? [from] : [];
}

export function makePool(codes: readonly string[], theme: Theme | undefined): Pool {
  if (theme) {
    const inScope = new Set(codes);
    return { kind: "theme", verses: theme.verses.map(parseVerseKey).filter((ref): ref is VerseRef => !!ref && inScope.has(ref.code)) };
  }
  const total = codes.reduce((sum, code) => sum + VERSE_COUNTS[code].reduce((n, count) => n + count, 0), 0);
  return { kind: "chapters", books: codes, total };
}

export const poolSize = (pool: Pool) => (pool.kind === "theme" ? pool.verses.length : pool.total);

/** One verse from the pool, each equally likely; null when the pool is empty. `random` gives a number in [0, 1). */
export function draw(pool: Pool, random: () => number = Math.random): VerseRef | ChapterDraw | null {
  const size = poolSize(pool);
  if (size === 0) return null;
  let index = Math.min(size - 1, Math.floor(random() * size));
  if (pool.kind === "theme") return pool.verses[index];
  for (const code of pool.books) {
    const chapters = VERSE_COUNTS[code];
    for (let i = 0; i < chapters.length; i++) {
      if (index < chapters[i]) return { code, chapter: i + 1, nth: index };
      index -= chapters[i];
    }
  }
  return null;
}
