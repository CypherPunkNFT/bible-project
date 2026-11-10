// The permanent address of a verse card (docs/features/verse-cards/design.md 5.1): https://bibleguide.io/verse-cards/
// john-3-16, with ?look=<id> when the design is not the default. The key is the sympathy feature's permanent passage
// key, computed from verse ids through its fixed table, so a link in someone's messages keeps working for years. Only
// the verses and the design ever go in a link: never a size, a name or anything a visitor typed.
import { BOOK_NUMBERS } from "../../data/life-events/types";
import { KEY_BOOKS, passageKey } from "../../data/sympathy/card-keys";
import { SITE_ORIGIN } from "../page-head";
import { BUILT_IN_LOOKS, DEFAULT_LOOK, RETIRED_LOOKS, hasOwn, type LookId } from "./looks";

/** A run of whole verses inside one chapter of one of the 66 books. */
export interface CardRef { book: number; chapter: number; first: number; last: number }

export const CARD_PATH = "/verse-cards";
const MAX_CHAPTER = 150;
const MAX_VERSE = 176;
const MAX_KEY = 64;
const NUMBER = "([1-9]\\d{0,2})";
const NUMBERS = new RegExp(`^${NUMBER}-${NUMBER}(?:-${NUMBER})?$`);

const BOOK_CODES: readonly string[] = Object.entries(BOOK_NUMBERS).sort((a, b) => a[1] - b[1]).map(([code]) => code);

/** The verse id the site uses everywhere: book × 1,000,000 + chapter × 1,000 + verse. */
export const verseId = (book: number, chapter: number, verse: number) => book * 1_000_000 + chapter * 1000 + verse;

/** The reader's book code ("JHN") of a book number. */
export const bookCode = (book: number): string => {
  const code = BOOK_CODES[book - 1];
  if (!code) throw new Error(`verse card: no book code for book ${book} (expected 1 to 66)`);
  return code;
};

/** True when the numbers make a card reference: one of the 66 books, a real-looking chapter, a forward range. */
export function isCardRef(ref: CardRef): boolean {
  const whole = [ref.book, ref.chapter, ref.first, ref.last].every(Number.isInteger);
  return whole && ref.book >= 1 && ref.book <= 66 && ref.chapter >= 1 && ref.chapter <= MAX_CHAPTER
    && ref.first >= 1 && ref.last >= ref.first && ref.last <= MAX_VERSE;
}

/** "john-3-16", "proverbs-3-5-6". Throws for anything that is not a forward run of verses inside one chapter. */
export function cardKey(ref: CardRef): string {
  if (!isCardRef(ref)) throw new Error(`verse card: ${JSON.stringify(ref)} is not a run of verses inside one chapter of the 66 books`);
  const from = verseId(ref.book, ref.chapter, ref.first);
  return passageKey({ from, to: ref.last > ref.first ? verseId(ref.book, ref.chapter, ref.last) : undefined });
}

/** The reference a key names, or null for anything else: an unknown book, the Apocrypha, a backward or cross-chapter
 *  range, verse 0, leading zeros, or the "a"/"b" part mark sympathy keys may carry (a card always shows whole verses). */
export function refFromKey(key: string): CardRef | null {
  if (typeof key !== "string" || key.length > MAX_KEY) return null;
  for (let index = 0; index < KEY_BOOKS.length; index++) {
    const word = KEY_BOOKS[index];
    if (!key.startsWith(`${word}-`)) continue;
    const match = NUMBERS.exec(key.slice(word.length + 1));
    if (!match) continue;
    const first = Number(match[2]);
    const last = match[3] ? Number(match[3]) : first;
    if (match[3] && last <= first) return null;
    const ref = { book: index + 1, chapter: Number(match[1]), first, last };
    return isCardRef(ref) ? ref : null;
  }
  return null;
}

/** A built-in design id from a link's ?look=, a retired id mapped to its replacement, or the default. */
export function lookFromQuery(value: string | null | undefined): LookId {
  if (!value) return DEFAULT_LOOK;
  if (hasOwn(BUILT_IN_LOOKS, value)) return value as LookId;
  if (hasOwn(RETIRED_LOOKS, value)) return RETIRED_LOOKS[value];
  return DEFAULT_LOOK;
}

/** The card page's path inside the site: "/verse-cards/john-3-16?look=night". */
export function cardPagePath(key: string, look: string = DEFAULT_LOOK): string {
  if (!refFromKey(key)) throw new Error(`verse card: "${key}" is not a card key`);
  const id = lookFromQuery(look);
  return `${CARD_PATH}/${key}${id === DEFAULT_LOOK ? "" : `?look=${id}`}`;
}

/** The card page of verses the reader shows, or null where they are not a card (the Apocrypha, a verse label that is
 *  not a number). */
export function verseCardPath(book: number, chapter: number, first: number, last: number = first): string | null {
  const ref = { book, chapter, first, last: Math.max(first, last) };
  return isCardRef(ref) ? cardPagePath(cardKey(ref)) : null;
}

/** The card page's full address, for the share text and Copy link. */
export const cardPageUrl = (key: string, look: string = DEFAULT_LOOK): string => `${SITE_ORIGIN}${cardPagePath(key, look)}`;

/** The reader at these verses, shaded: "/read/bsb/JHN/3?hl=16" or "?hl=5-6". */
export function readerPath(ref: CardRef): string {
  return `/read/bsb/${bookCode(ref.book)}/${ref.chapter}?hl=${ref.first}${ref.last > ref.first ? `-${ref.last}` : ""}`;
}

const READ_PATH = /^\/read\/bsb\/([1-3]?[A-Z]{2,3})\/([1-9]\d{0,2})\?hl=([1-9]\d{0,2})(?:-([1-9]\d{0,2}))?$/;

/** The card key of a reader address as the verse-of-the-day files write it ("/read/bsb/HEB/4?hl=12"), or null. */
export function keyFromReadPath(path: string): string | null {
  const match = READ_PATH.exec(typeof path === "string" ? path : "");
  const book = match && hasOwn(BOOK_NUMBERS, match[1]) ? BOOK_NUMBERS[match[1]] : undefined;
  if (!match || !book) return null;
  const first = Number(match[3]);
  const ref = { book, chapter: Number(match[2]), first, last: match[4] ? Number(match[4]) : first };
  return isCardRef(ref) ? cardKey(ref) : null;
}
