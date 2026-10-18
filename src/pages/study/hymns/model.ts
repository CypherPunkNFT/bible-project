// What every section of the Hymns collection page shares: the hymn books by id, chapter names, and the tone style.
import type { CSSProperties } from "react";
import type { HymnBook, HymnCollection, HymnEntry, HymnGroup } from "@/lib/hymns";
import { bookIndexOf, chapterOf } from "@/lib/hymns";

export const tone = (token: string) => ({ "--tone": `var(${token})` }) as CSSProperties;
export const groupsById = (collection: HymnCollection) => new Map<string, HymnGroup>(collection.groups.map((g) => [g.id, g]));

/** "Psalm 23" for a chapter of the Psalms, "Genesis 1" otherwise. */
export const chapterLabel = (book: HymnBook, chapter: number) => `${book.name === "Psalms" ? "Psalm" : book.name} ${chapter}`;

/** The hymn's main passage in the reader, with its first verse lit when it names one. */
export function passageHref(books: HymnBook[], hymn: HymnEntry) {
  const book = books[bookIndexOf(hymn.v)], verse = hymn.v % 1000;
  return `/read/kjv/${book.code}/${chapterOf(hymn.v)}${verse > 1 ? `?hl=${verse}` : ""}`;
}

/** A first line without the comma or colon it trails into the second. */
export const firstLine = (hymn: HymnEntry) => hymn.t.replace(/[,;:]$/, "");

/** "1,228" — the site's number format. */
export const formatNumber = (n: number) => n.toLocaleString("en-GB");
export const plural = (n: number, word: string, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
