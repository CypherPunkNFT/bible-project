export interface Hit {
  code: string;
  chapter: string;
  verse: string;
  text: string;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A case-insensitive matcher for the phrase; whole-word mode respects letters in any script. */
export function makeMatcher(query: string, wholeWords: boolean): RegExp | null {
  const phrase = query.trim().replace(/\s+/g, " ");
  if (phrase.length < 2) return null;
  const body = escapeRegExp(phrase).replace(/ /g, "\\s+");
  return new RegExp(wholeWords ? `(?<![\\p{L}\\p{M}])${body}(?![\\p{L}\\p{M}])` : body, "giu");
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
