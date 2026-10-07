import { searchTerm } from "@/lib/apologetics-search";
import { makeMatcher, type Hit } from "@/lib/search";

/**
 * Breaking a search into its words: which ones are worth searching on, a colour for each, and how each one shows up
 * in a result ("grief and sorrow over the cross" → grief, sorrow, cross; "and", "over", "the" skipped).
 */

export interface QueryWords { words: string[]; skipped: string[] }

/** Joining words and old pronouns that say little on their own, on top of the study search's own list ("over", "unto", "thee"). */
const LITTLE_WORDS = new Set("about above after again against all also am among any around away back because been before being below between both down during each even ever every few further here him himself his her hers herself into itself just less more most much must myself near nor now off once only other ought ours out over own same she should some such through thus till too under unto upon very via while whom whose within without yet ye thee thou thy thine hath doth shall shalt".split(" "));

/** The words worth searching on, in the order typed and without repeats ("forgive" and "forgiveness" are one), and the common words skipped. */
export function queryWords(query: string): QueryWords {
  const words: string[] = [], skipped: string[] = [], seen = new Set<string>();
  for (const raw of query.split(/\s+/)) {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase();
    if (!word) continue;
    const term = searchTerm(word);
    if (!term || LITTLE_WORDS.has(word)) { if (!skipped.includes(word)) skipped.push(word); continue; }
    if (seen.has(term)) continue;
    seen.add(term);
    words.push(word);
  }
  return { words, skipped };
}

// The site's chart tones (src/index.css), so both themes work.
const TONES = ["gospels", "prophets", "poetry", "acts", "history", "epistles"];
export const wordColor = (index: number) => (index < 0 ? "var(--accent)" : `var(--${TONES[index % TONES.length]})`);

/** Which of the words a token is a form of ("cross" for "Cross", "forgive" for "forgiveness"), or -1. */
export function wordIndexOf(token: string, words: string[]): number {
  const term = searchTerm(token);
  return term === null ? -1 : words.findIndex((word) => searchTerm(word) === term);
}

export interface MarkedPart { text: string; word: number | null }

/** Text split into words, each tagged with the search word it is a form of (null = plain text). */
export function markByForm(text: string, words: string[]): MarkedPart[] {
  return text.split(/([\p{L}’']+)/u).filter(Boolean).map((part) => {
    if (!/\p{L}/u.test(part)) return { text: part, word: null };
    const index = wordIndexOf(part, words);
    return { text: part, word: index < 0 ? null : index };
  });
}

/** Verse text split by the exact words (as the exact-words search finds them), each tagged with its word. */
export function markExact(text: string, words: string[], wholeWords: boolean): MarkedPart[] {
  const found: { start: number; end: number; word: number }[] = [];
  words.forEach((word, index) => {
    const matcher = makeMatcher(word, wholeWords);
    if (matcher) for (const m of text.matchAll(matcher)) found.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, word: index });
  });
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const parts: MarkedPart[] = [];
  let at = 0;
  for (const f of found) {
    if (f.start < at) continue; // overlaps an earlier match
    if (f.start > at) parts.push({ text: text.slice(at, f.start), word: null });
    parts.push({ text: text.slice(f.start, f.end), word: f.word });
    at = f.end;
  }
  if (at < text.length) parts.push({ text: text.slice(at), word: null });
  return parts;
}

type Books = { code: string; plain: Record<string, string> }[];

/** Verses holding the most of the words: all of them where any verse does; otherwise as many as any verse has. */
export function versesWithWords(books: Books, words: string[], wholeWords: boolean): { hits: Hit[]; most: number } {
  const matchers = words.map((word) => makeMatcher(word, wholeWords)).filter((m): m is RegExp => m !== null);
  let most = 0;
  let hits: Hit[] = [];
  for (const { code, plain } of books) {
    for (const [key, text] of Object.entries(plain)) {
      const count = matchers.reduce((n, matcher) => { matcher.lastIndex = 0; return n + (matcher.test(text) ? 1 : 0); }, 0);
      if (!count || count < most) continue;
      if (count > most) { most = count; hits = []; }
      const [chapter, verse] = key.split(":");
      hits.push({ code, chapter, verse, text });
    }
  }
  return { hits, most };
}

/** How many verses hold each word. */
export function verseCounts(books: Books, words: string[], wholeWords: boolean): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of words) {
    const matcher = makeMatcher(word, wholeWords);
    let n = 0;
    if (matcher) for (const { plain } of books) for (const text of Object.values(plain)) { matcher.lastIndex = 0; if (matcher.test(text)) n++; }
    counts.set(word, n);
  }
  return counts;
}
