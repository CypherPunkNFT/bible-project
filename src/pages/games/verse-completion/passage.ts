// Verse completion: what makes a run of BSB verses a playable passage (design §4.1), shared by the page, the build and
// the tests so they judge the same text the same way.
import { words } from "./words.ts";
import { isContraction } from "./equivalents.ts";

export const MIN_WORDS = 8;
export const MAX_WORDS = 45;
/** The typed answer's cap, and so the longest passage allowed (§5.2). */
export const MAX_CHARS = 600;

/** A verse as the site's verse resolver gives it: no paragraph mark, single spaces. */
export const cleanVerse = (text: string): string => text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();

/** Verses of one passage, joined as the page shows them. */
export const joinVerses = (texts: readonly string[]): string => texts.join(" ");

/** "jhn-3-16", "pro-3-5-6": a passage's permanent id. */
export function passageId(code: string, from: number, to: number): string {
  const chapter = Math.floor(from / 1000) % 1000;
  return `${code.toLowerCase()}-${chapter}-${from % 1000}${to > from ? `-${to % 1000}` : ""}`;
}

/** The word count when `text` makes a passage: a whole sentence (capital start, full stop, question or exclamation mark
 * at the end), 8–45 words, no digits and no contraction. Otherwise null. */
export function eligibleText(text: string): number | null {
  const list = words(text);
  const sentence = /^[“‘"'([]*\p{Lu}/u.test(text) && /[.!?][”’"')\]]*$/.test(text);
  if (!sentence || /\d/.test(text) || text.length > MAX_CHARS) return null;
  if (list.length < MIN_WORDS || list.length > MAX_WORDS) return null;
  return list.some((word) => isContraction(word.text)) ? null : list.length;
}

/** The mark that ends the passage: full stop, question or exclamation mark (§5.1 rule 1). */
export const endMark = (text: string): string => /([.!?])[”’"')\]]*\s*$/.exec(text)?.[1] ?? "";
