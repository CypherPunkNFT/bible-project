// Verse completion: how BSB text and typed answers become words (design §6.1). The page, the build and the tests all
// split with this file, so a passage's word count and split points always agree.
// Each word keeps its place in the original string: the page shows the Bible's own text, never a rebuilt one.

export interface Word {
  /** The word as shown: its own leading quotes, the word, then its trailing punctuation and space. */
  text: string;
  /** The word as compared: lower case, no apostrophes, accents or punctuation (§6.1). */
  key: string;
  start: number;
  end: number;
}

const APOSTROPHES = /['’‘ʼ]/g;
const DASHES = /[-‐‑‒–—―]/g;
const LETTERS = /[\p{L}\p{N}]+(?:['’‘ʼ][\p{L}\p{N}]+)*/gu;

/** Accents off Latin letters, as the site's search does ("naïve" is naive). */
const unaccent = (text: string) => text.normalize("NFKD").replace(/(\p{Script=Latin})\p{M}+/gu, "$1").normalize("NFC");

/** §6.1 in order: NFKC and lower case, apostrophes out, dashes to spaces, & to and, digit commas out, everything
 * else that is not a letter or digit to a space, accents off. Returns the words. */
export function normalize(text: string): string[] {
  const folded = text.normalize("NFKC").toLowerCase()
    .replace(APOSTROPHES, "")
    .replace(DASHES, " ")
    .replace(/&/g, " and ")
    .replace(/(?<=\d),(?=\d)/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ");
  return unaccent(folded).split(" ").filter(Boolean);
}

/** Where a word's shown form begins: after the last space before it, so an opening quote travels with its word and a
 * dash with no space ("salvation—whom") stays on the left. */
function shownStart(text: string, previousEnd: number, wordStart: number): number {
  const gap = text.slice(previousEnd, wordStart);
  const space = Math.max(gap.lastIndexOf(" "), gap.lastIndexOf("\n"));
  return space < 0 ? wordStart : previousEnd + space + 1;
}

/** The words of a passage. Joined back together, their `text` is the passage exactly. */
export function words(text: string): Word[] {
  const found = [...text.matchAll(LETTERS)];
  const starts = found.map((match, i) => i === 0 ? 0 : shownStart(text, found[i - 1].index! + found[i - 1][0].length, match.index!));
  return found.map((match, i) => {
    const start = starts[i];
    const end = i + 1 < found.length ? starts[i + 1] : text.length;
    return { text: text.slice(start, end), key: normalize(match[0]).join(""), start, end };
  });
}

/** The first letter or digit a First-letters player types for a word (§5.2): "LORD’s" is l, "‘Do" is d. */
export const firstLetter = (word: Word): string => word.key.charAt(0);
