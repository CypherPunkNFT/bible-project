// The word counter's sums, kept apart from the page so they can be tested on the real Bible files: how a typed word or
// phrase becomes a search pattern, and how often it occurs in each verse and book. Nothing here fetches or stores.

/** How a search is read: whole words only (default), or words that begin with it; capitals ignored unless asked. */
export interface CountOptions {
  /** "love" also counts "loved", "loves" and "lovely". */
  wordStarts: boolean;
  /** "LORD" counts only "LORD", not "Lord" or "lord". */
  matchCase: boolean;
}

/** A book's plain verses, "chapter:verse" -> words, as data/plain/bsb/<BOOK>.json holds them. */
export interface BookText { code: string; plain: Record<string, string> }

/** One verse with the search in it, and how many times. */
export interface VerseCount { code: string; chapter: number; verse: number; text: string; count: number }

export interface CountResult {
  /** Every time it occurs, a verse with it twice counted twice. */
  total: number;
  /** Every verse holding it, in Bible order. */
  verses: VerseCount[];
  /** Times per book code (only books where it occurs). */
  byBook: Map<string, number>;
  /** Verses per book code (only books where it occurs). */
  versesByBook: Map<string, number>;
}

/** The longest search read, in characters: longer is not a word or phrase anyone counts. */
export const MAX_QUERY = 80;

const LETTER = "[\\p{L}\\p{M}\\p{N}]";
/** What may stand between the words of a phrase: spaces, commas, colons, dashes and quotation marks, not a full stop. */
const BETWEEN = "[\\s,;:\\u201C\\u201D\\u2018\"()\\[\\]\\u2014\\u2013-]+";
const SPLIT = /[\s,;:“”‘"()[\]—–.!?-]+/u;
const APOSTROPHE = /['’]/g;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The words of a search as they will be looked for, or [] when there is nothing to look for. */
export function searchWords(query: string): string[] {
  const text = query.normalize("NFC").slice(0, MAX_QUERY);
  return text.split(SPLIT)
    .map((word) => word.replace(/^['’]+|['’]+$/g, ""))
    .filter((word) => new RegExp(LETTER, "u").test(word));
}

/** The pattern for a search, or null when it holds no word. A straight apostrophe matches the Bible's curly one. */
export function buildMatcher(query: string, options: CountOptions): RegExp | null {
  const words = searchWords(query);
  if (!words.length) return null;
  const body = words.map((word) => escapeRegExp(word).replace(APOSTROPHE, "['\\u2019]")).join(BETWEEN);
  // A word ends where no letter follows, nor an apostrophe and more letters ("don" is not in "don’t"), except a
  // possessive "’s" ("God" counts "God’s"). A word starts where no letter, or letter and apostrophe, comes before
  // ("s" is not the end of "God’s").
  const end = options.wordStarts ? "" : `(?!${LETTER})(?!['’](?!s(?!${LETTER}))${LETTER})`;
  return new RegExp(`(?<!${LETTER}|${LETTER}['’])${body}${end}`, options.matchCase ? "gu" : "giu");
}

/** How many times the pattern occurs in a text (matches never overlap). */
export function countIn(text: string, matcher: RegExp): number {
  matcher.lastIndex = 0;
  let n = 0;
  while (matcher.exec(text)) n++;
  return n;
}

/** Every verse with the search in it, in the order the books are given, with totals per book. */
export function countBible(books: readonly BookText[], matcher: RegExp): CountResult {
  const verses: VerseCount[] = [];
  const byBook = new Map<string, number>();
  const versesByBook = new Map<string, number>();
  let total = 0;
  for (const { code, plain } of books) {
    for (const [key, text] of Object.entries(plain)) {
      const count = countIn(text, matcher);
      if (!count) continue;
      const [chapter, verse] = key.split(":").map((part) => Number.parseInt(part, 10));
      verses.push({ code, chapter, verse, text, count });
      total += count;
      byBook.set(code, (byBook.get(code) ?? 0) + count);
      versesByBook.set(code, (versesByBook.get(code) ?? 0) + 1);
    }
  }
  return { total, verses, byBook, versesByBook };
}

export interface MarkedText { text: string; hit: boolean }

/** A verse cut into plain text and the places the search matched, for marking them on screen. */
export function markMatches(text: string, matcher: RegExp): MarkedText[] {
  const parts: MarkedText[] = [];
  let at = 0;
  for (const match of text.matchAll(matcher)) {
    const start = match.index ?? 0;
    if (start > at) parts.push({ text: text.slice(at, start), hit: false });
    parts.push({ text: match[0], hit: true });
    at = start + match[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), hit: false });
  return parts;
}
