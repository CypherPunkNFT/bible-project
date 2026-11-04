// The one place a verse's wording comes from. Pages and data files hold verse ids (BBCCCVVV, scripts/bible/books.py),
// never wording; the words are looked up here, in the reader's current Bible, from data/plain/<slug>/<BOOK>.json.
// A verse that Bible does not number comes back with no text, and the page shows its reference with a short note.
import { useMemo } from "react";
import { loadPlain } from "./data";
import { siteLanguage, useSiteLanguage, type LanguageCode } from "./language";
import { useCatalog } from "./catalog";
import { bookByCode, bookByNum, formatRange, plainLookup, splitId } from "./refs";
import type { Catalog, Translation } from "./types";
import { useAsync, type AsyncState } from "./useAsync";

/** The Bible each language quotes unless the reader has chosen another. */
export const DEFAULT_BIBLE: Record<LanguageCode, string> = {
  en: "bsb",
  es: "rvr",
  "pt-BR": "bpm",
  "zh-Hans": "cuv",
  ar: "svd",
  hi: "irv",
  id: "ind",
};

/** Which Bible the site quotes now. A reader's own choice, when there is one, plugs in here and nowhere else. */
export function currentBibleSlug(language: LanguageCode = siteLanguage()): string {
  return DEFAULT_BIBLE[language];
}

/** The language's own Bible, when it has this chapter: where the reader opens. */
export function languageBible(catalog: Catalog, language: LanguageCode, code: string, chapter: string): string | null {
  const bible = catalog.translations.find((item) => item.slug === currentBibleSlug(language));
  return bible?.books[code]?.includes(chapter) ? bible.slug : null;
}

export function findBible(catalog: Catalog, slug: string): Translation {
  const bible = catalog.translations.find((translation) => translation.slug === slug);
  if (!bible) throw new Error(`verses: no Bible "${slug}" in the catalogue (${catalog.translations.length} listed)`);
  return bible;
}

/** The Bible's name as a caption reads it: "Reina-Valera 1909", not "Reina-Valera 1909 (Spanish)". */
export const bibleName = (bible: Translation): string => bible.name.replace(/\s*\([^)]*\)\s*$/, "");

export function verseIdOf(catalog: Catalog, code: string, chapter: number, verse: number): number {
  const book = bookByCode(catalog, code);
  if (!book) throw new Error(`verses: unknown book code "${code}" for ${chapter}:${verse}`);
  return book.num * 1_000_000 + chapter * 1000 + verse;
}

export interface ResolvedVerse {
  id: number;
  chapter: number;
  verse: number;
  /** null: this Bible does not number this verse, or numbers its verses differently. */
  text: string | null;
}

export interface ResolvedPassage {
  bible: Translation;
  verses: ResolvedVerse[];
  /** More verses follow than `max` allowed. */
  truncated: boolean;
}

const clean = (text: string): string => text.replace(/^¶\s*/, "").replace(/\s+/g, " ").trim();

/** A verse id means the English numbering, so a Bible numbered another way would answer with the wrong verse. */
const sameNumbering = (bible: Translation): boolean => bible.numbering === "english";

async function bookWords(bible: Translation, code: string): Promise<Record<string, string> | null> {
  if (!sameNumbering(bible) || !bible.books[code]) return null;
  return loadPlain(bible.slug, code);
}

async function wordsOf(catalog: Catalog, bible: Translation, id: number): Promise<ResolvedVerse> {
  const { num, chapter, verse } = splitId(id);
  const code = bookByNum(catalog, num)?.code;
  const plain = code ? await bookWords(bible, code) : null;
  const found = plain ? plainLookup(plain, chapter, verse) : undefined;
  return { id, chapter, verse, text: found === undefined ? null : clean(found) };
}

/** The verses of a list of ids, in the order given. */
export async function resolveVerses(catalog: Catalog, ids: readonly number[], slug = currentBibleSlug()): Promise<ResolvedPassage> {
  const bible = findBible(catalog, slug);
  return { bible, verses: await Promise.all(ids.map((id) => wordsOf(catalog, bible, id))), truncated: false };
}

/** The last verse number a Bible gives a chapter, from its plain book. */
function lastVerse(plain: Record<string, string>, chapter: number): number {
  const prefix = `${chapter}:`;
  let last = 0;
  for (const key of Object.keys(plain)) {
    if (!key.startsWith(prefix)) continue;
    const match = /(\d+)[a-z]?$/.exec(key.slice(prefix.length));
    if (match) last = Math.max(last, Number(match[1]));
  }
  return last;
}

/** The verses from `start` to `end` (ids), one book, across chapters if need be, stopping after `max`. */
export async function resolveRange(catalog: Catalog, start: number, end: number, slug = currentBibleSlug(), max = Infinity): Promise<ResolvedPassage> {
  const bible = findBible(catalog, slug);
  const a = splitId(start);
  const b = splitId(end || start);
  if (a.num !== b.num) throw new Error(`verses: a range must stay in one book, got ${start}–${end}`);
  const code = bookByNum(catalog, a.num)?.code;
  const plain = code ? await bookWords(bible, code) : null;
  const verses: ResolvedVerse[] = [];
  const add = (chapter: number, verse: number) => {
    const found = plain ? plainLookup(plain, chapter, verse) : undefined;
    verses.push({ id: a.num * 1_000_000 + chapter * 1000 + verse, chapter, verse, text: found === undefined ? null : clean(found) });
  };
  for (let chapter = a.chapter; chapter <= b.chapter; chapter++) {
    const from = chapter === a.chapter ? a.verse : 1;
    const to = chapter === b.chapter ? b.verse : plain ? lastVerse(plain, chapter) : from;
    for (let verse = from; verse <= to; verse++) {
      if (verses.length >= max) return { bible, verses, truncated: true };
      add(chapter, verse);
    }
  }
  return { bible, verses, truncated: false };
}

/** The reference a page shows beside a verse, or instead of a verse this Bible does not number. */
export const verseReference = (catalog: Catalog, start: number, end = start): string => formatRange(catalog, start, end);

export type VerseSpec = { id: number } | { ids: readonly number[] } | { from: number; to: number };

function specKey(spec: VerseSpec): string {
  if ("id" in spec) return String(spec.id);
  if ("ids" in spec) return spec.ids.join(",");
  return `${spec.from}-${spec.to}`;
}

/** The current Bible, following the reader's language. */
export function useCurrentBible(): Translation {
  const catalog = useCatalog();
  const language = useSiteLanguage();
  return useMemo(() => findBible(catalog, currentBibleSlug(language)), [catalog, language]);
}

/** A passage in the current Bible, or in `bible` where a page is about one version's own wording. */
export function useVerses(spec: VerseSpec, options: { bible?: string; max?: number } = {}): AsyncState<ResolvedPassage> {
  const catalog = useCatalog();
  const current = useCurrentBible();
  const slug = options.bible ?? current.slug;
  const max = options.max ?? Infinity;
  return useAsync(() => {
    if ("id" in spec) return resolveVerses(catalog, [spec.id], slug);
    if ("ids" in spec) return resolveVerses(catalog, spec.ids, slug);
    return resolveRange(catalog, spec.from, spec.to, slug, max);
  }, `verses:${slug}:${specKey(spec)}:${max}`);
}

/**
 * A verse's first words for a label or a short mark. Cut at a word where the language has spaces; Chinese has none, so
 * there it is cut by characters.
 */
export function firstWords(text: string, limit = 60): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const space = cut.lastIndexOf(" ");
  return `${(space > limit / 2 ? cut.slice(0, space) : cut).replace(/[,;:—–-]+$/, "")} …`;
}

/** What stands in for a verse's words in text a page cannot put a component into. */
const missingText = (catalog: Catalog, bible: Translation, start: number, end: number): string =>
  `${verseReference(catalog, start, end)}: ${sameNumbering(bible) ? "not in this Bible" : "numbered differently in this Bible"}`;

async function passageText(catalog: Catalog, bible: Translation, start: number, end: number): Promise<string> {
  const { verses } = await resolveRange(catalog, start, end, bible.slug);
  const words = verses.flatMap((verse) => (verse.text === null ? [] : [verse.text]));
  return words.length ? words.join(" ") : missingText(catalog, bible, start, end);
}

const TABLE_KEY = /^\d+(-\d+)?$/;
const isVerseTable = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((key) => typeof key === "string" && TABLE_KEY.test(key));

/**
 * For pages drawn from a data file in one piece (the Moses page, the people and apostle pages): a copy of the data with
 * the current Bible's words filled in. Files mark a quotation `{ span | ref: [first, last], quoted: true }` and a table
 * of verses `verses | kjv: ["2002003", "2002005-2002006"]`; scripts/bible/verse_wording.py writes both.
 */
export async function fillVerses<T>(data: T, catalog: Catalog, slug = currentBibleSlug()): Promise<T> {
  const bible = findBible(catalog, slug);
  const copy = structuredClone(data);
  const pending: Promise<void>[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (record.quoted === true) {
      const span = (record.span ?? record.ref ?? [record.id, record.id]) as [number, number];
      pending.push(passageText(catalog, bible, span[0], span[1]).then((text) => { record.text = record.marks ? `“${text}”` : text; }));
    }
    for (const [key, value] of Object.entries(record)) {
      if ((key === "verses" || key === "kjv") && isVerseTable(value)) {
        const table: Record<string, string> = {};
        record[key] = table;
        for (const entry of value) {
          const [first, last = first] = entry.split("-").map(Number);
          pending.push(passageText(catalog, bible, first, last).then((text) => { table[entry] = text; }));
        }
      } else walk(value);
    }
  };
  walk(copy);
  await Promise.all(pending);
  return copy;
}

/** Many verses at once for a page that handles the words as data (word marks, comparisons). `null` until they are in. */
export function useVerseTable(ids: readonly number[], bible?: string): { bible: Translation; table: Record<number, string | null> } | null {
  const catalog = useCatalog();
  const current = useCurrentBible();
  const slug = bible ?? current.slug;
  const state = useAsync(() => resolveVerses(catalog, ids, slug), `verse-table:${slug}:${ids.join(",")}`);
  return useMemo(() => {
    if (state.status !== "ready") return null;
    return { bible: state.value.bible, table: Object.fromEntries(state.value.verses.map((verse) => [verse.id, verse.text])) };
  }, [state]);
}
