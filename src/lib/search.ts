export interface Hit {
  code: string;
  chapter: string;
  verse: string;
  text: string;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ARABIC = /\p{Script=Arabic}/u;
/** Chinese and Japanese: Han plus kana, by script extension so the long-vowel mark ー counts too. */
const NO_SPACES = /[\p{Script=Han}\p{scx=Hira}\p{scx=Kana}]/u;
const DEVANAGARI = /\p{Script=Devanagari}/u;
/** Invisible characters inside Persian and Hindi words: zero-width non-joiner and joiner, right-to-left mark, tatweel. */
const INVISIBLE = /\u200c|\u200d|\u200f|\u0640/gu;
/** Every form of alif the Van Dyck text uses (plain, wasla, hamza above/below, madda). */
const ALIF = "[\u0627\u0671\u0623\u0625\u0622]";
/** Arabic and Persian yeh and kaf, which the Persian text mixes. Alef maksura stays apart (Arabic "upon" is not "Ali"). */
const YEH = "[\u064a\u06cc]";
const KAF = "[\u0643\u06a9]";

function arabicLetter(ch: string): string {
  if (/[\u0627\u0671\u0623\u0625\u0622]/u.test(ch)) return ALIF;
  if (/[\u064a\u06cc]/u.test(ch)) return YEH;
  if (/[\u0643\u06a9]/u.test(ch)) return KAF;
  return escapeRegExp(ch);
}

/**
 * A case-insensitive matcher for the phrase; whole-word mode respects letters in any script.
 * Arabic and Persian: vowel marks and invisible joiners are ignored (the Van Dyck text is fully pointed; Persian
 * writes some words with a zero-width non-joiner, some with a space), any alif matches any alif, and the Arabic and
 * Persian forms of yeh and kaf match each other.
 * Chinese and Japanese: no word spaces, so never "whole words", and the respectful space the Union Version puts
 * before 神 is skipped.
 * Hindi: a zero-width joiner inside a word is optional.
 */
export function makeMatcher(query: string, wholeWords: boolean): RegExp | null {
  // The Bible data is NFC; a query typed in decomposed form (NFD) must match it too.
  const phrase = query.normalize("NFC").replace(INVISIBLE, "").trim().replace(/\s+/g, " ");
  const noSpaces = NO_SPACES.test(phrase);
  if (phrase.length < (noSpaces ? 1 : 2)) return null;
  let body: string;
  if (ARABIC.test(phrase)) {
    body = [...phrase.replace(/\p{M}/gu, "")]
      .map((ch) => (ch === " " ? "[\\s\\u200c]+" : `${arabicLetter(ch)}[\\p{M}\\u200c\\u200d\\u200f\\u0640]*`))
      .join("");
  } else if (noSpaces) {
    body = [...phrase.replace(/\s+/g, "")].map(escapeRegExp).join("\\s*");
  } else if (DEVANAGARI.test(phrase)) {
    body = [...phrase].map((ch) => (ch === " " ? "\\s+" : escapeRegExp(ch))).join("[\\u200c\\u200d]?");
  } else {
    body = escapeRegExp(phrase).replace(/ /g, "\\s+");
  }
  const whole = wholeWords && !noSpaces;
  const letter = "[\\p{L}\\p{M}\\u200c\\u200d]";
  return new RegExp(whole ? `(?<!${letter})${body}(?!${letter})` : body, "giu");
}

/** Every verse whose plain text matches, in the order the books are given. */
export function searchBooks(books: { code: string; plain: Record<string, string> }[], matcher: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const { code, plain } of books) {
    for (const [key, text] of Object.entries(plain)) {
      matcher.lastIndex = 0;
      if (matcher.test(text)) {
        const [chapter, verse] = key.split(":");
        hits.push({ code, chapter, verse, text });
      }
    }
  }
  return hits;
}

/** Split text into plain and matched parts for highlighting — React text, never HTML. */
export function highlightParts(text: string, matcher: RegExp): { text: string; match: boolean }[] {
  const parts: { text: string; match: boolean }[] = [];
  let last = 0;
  matcher.lastIndex = 0;
  for (const found of text.matchAll(matcher)) {
    const start = found.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), match: false });
    parts.push({ text: found[0], match: true });
    last = start + found[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false });
  return parts;
}
