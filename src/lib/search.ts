export interface Hit {
  code: string;
  chapter: string;
  verse: string;
  text: string;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ARABIC = /\p{Script=Arabic}/u;
const HAN = /\p{Script=Han}/u;
/** Every form of alif the Van Dyck text uses (plain, wasla, hamza above/below, madda). */
const ALIF = "[\u0627\u0671\u0623\u0625\u0622]";

/**
 * A case-insensitive matcher for the phrase; whole-word mode respects letters in any script.
 * Arabic: vowel marks are ignored (the Van Dyck text is fully pointed) and any alif matches any alif.
 * Chinese: no word spaces, so never "whole words", and the respectful space the Union Version puts before 神 is
 * skipped.
 */
export function makeMatcher(query: string, wholeWords: boolean): RegExp | null {
  // The Bible data is NFC; a query typed in decomposed form (NFD) must match it too.
  const phrase = query.normalize("NFC").trim().replace(/\s+/g, " ");
  const han = HAN.test(phrase);
  if (phrase.length < (han ? 1 : 2)) return null;
  let body: string;
  if (ARABIC.test(phrase)) {
    body = [...phrase.replace(/\p{M}/gu, "")]
      .map((ch) => (ch === " " ? "\\s+" : `${/[\u0627\u0671\u0623\u0625\u0622]/u.test(ch) ? ALIF : escapeRegExp(ch)}\\p{M}*`))
      .join("");
  } else if (han) {
    body = [...phrase.replace(/\s+/g, "")].map(escapeRegExp).join("\\s*");
  } else {
    body = escapeRegExp(phrase).replace(/ /g, "\\s+");
  }
  const whole = wholeWords && !han;
  return new RegExp(whole ? `(?<![\\p{L}\\p{M}])${body}(?![\\p{L}\\p{M}])` : body, "giu");
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
