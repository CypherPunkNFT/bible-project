// The one place a verse's wording comes from. Pages and data files hold verse ids (BBCCCVVV, scripts/bible/books.py),
// never wording; the words are looked up here, in the reader's current Bible, from the reader's chapter files
// (data/text/<slug>/<BOOK>/, the same words as data/plain word for word: checked over all 160 Bibles on 2026-11-19), so
// a page downloads the chapters it quotes, not whole books (owner, 2026-11-19). A batch that needs most of a book's
// chapter files reads the book's plain file instead (WHOLE_BOOK_SHARE).
// A verse that Bible does not number comes back with no text, and the page shows its reference with a short note.
import { useMemo } from "react";
import { loadChapterPlain, loadPlain, textChunkPath } from "./data";
import { siteLanguage, useSiteLanguage, type LanguageCode } from "./language";
import { siteLanguageBible } from "./site-languages";
import { useCatalog } from "./catalog";
import { bookByCode, bookByNum, formatRange, plainLookup, splitId } from "./refs";
import type { Catalog, Translation } from "./types";
import { useAsync, type AsyncState } from "./useAsync";

/** Which Bible the site quotes now: the language's own (its `bible` in site-languages.json), or English's for a language
 * with none. A reader's own choice, when there is one, plugs in here and nowhere else. */
export function currentBibleSlug(language: LanguageCode = siteLanguage()): string {
  return siteLanguageBible(language);
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

/** A chapter file holds the verses with their notes and headings, about 1.4 times the plain words; past this share of a
 * book's chapter files, its one plain file is the smaller download. */
const WHOLE_BOOK_SHARE = 0.6;
/** Books (codes) a batch reads whole. */
type WholeBooks = ReadonlySet<string>;

/** The books of which a batch of chapters needs more than WHOLE_BOOK_SHARE of the chapter files. */
function wholeBooks(catalog: Catalog, bible: Translation, chapters: Iterable<[number, number]>): WholeBooks {
  const files = new Map<string, Set<string>>();
  for (const [num, chapter] of chapters) {
    const code = bookByNum(catalog, num)?.code;
    const labels = code ? bible.books[code] : undefined;
    const index = labels?.indexOf(String(chapter)) ?? -1;
    if (!code || !labels || index < 0) continue;
    if (!files.has(code)) files.set(code, new Set());
    files.get(code)!.add(textChunkPath(bible.slug, code, index));
  }
  const whole = new Set<string>();
  for (const [code, needed] of files) {
    const all = new Set(bible.books[code].map((_, index) => textChunkPath(bible.slug, code, index)));
    if (needed.size > all.size * WHOLE_BOOK_SHARE) whole.add(code);
  }
  return whole;
}

/** The chapters a span covers, as [book number, chapter]; a span across books is refused later by rangeVerses. */
function spanChapters(start: number, end: number): [number, number][] {
  const a = splitId(start), b = splitId(end || start), out: [number, number][] = [];
  if (a.num !== b.num) return [[a.num, a.chapter]];
  for (let chapter = a.chapter; chapter <= b.chapter; chapter++) out.push([a.num, chapter]);
  return out;
}

/** One chapter's words in this Bible ("chapter:verse" -> text), from its chapter file or, for a book read whole, the
 * book's plain file; null where the Bible lacks the book or chapter, or numbers its verses differently. */
async function chapterWords(bible: Translation, code: string, chapter: number, whole: WholeBooks): Promise<Record<string, string> | null> {
  const labels = bible.books[code];
  if (!sameNumbering(bible) || !labels) return null;
  if (whole.has(code)) return loadPlain(bible.slug, code);
  return labels.includes(String(chapter)) ? loadChapterPlain(bible.slug, code, labels, String(chapter)) : null;
}

async function wordsOf(catalog: Catalog, bible: Translation, id: number, whole: WholeBooks): Promise<ResolvedVerse> {
  const { num, chapter, verse } = splitId(id);
  const code = bookByNum(catalog, num)?.code;
  const plain = code ? await chapterWords(bible, code, chapter, whole) : null;
  const found = plain ? plainLookup(plain, chapter, verse) : undefined;
  return { id, chapter, verse, text: found === undefined ? null : clean(found) };
}

/** The verses of a list of ids, in the order given. */
export async function resolveVerses(catalog: Catalog, ids: readonly number[], slug = currentBibleSlug()): Promise<ResolvedPassage> {
  const bible = findBible(catalog, slug);
  const whole = wholeBooks(catalog, bible, ids.map((id): [number, number] => [splitId(id).num, splitId(id).chapter]));
  return { bible, verses: await Promise.all(ids.map((id) => wordsOf(catalog, bible, id, whole))), truncated: false };
}

/** The last verse number a Bible gives a chapter, from its plain words (the chapter's, or the whole book's). */
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
  return rangeVerses(catalog, bible, start, end, max, wholeBooks(catalog, bible, spanChapters(start, end)));
}

async function rangeVerses(catalog: Catalog, bible: Translation, start: number, end: number, max: number, whole: WholeBooks): Promise<ResolvedPassage> {
  const a = splitId(start);
  const b = splitId(end || start);
  if (a.num !== b.num) throw new Error(`verses: a range must stay in one book, got ${start}–${end}`);
  const code = bookByNum(catalog, a.num)?.code;
  // Every chapter's words are asked for at once, so the files download side by side.
  const chapters = spanChapters(start, end).map(([, chapter]) => chapter);
  const words = await Promise.all(chapters.map((chapter) => code ? chapterWords(bible, code, chapter, whole) : null));
  const verses: ResolvedVerse[] = [];
  for (const [i, chapter] of chapters.entries()) {
    const plain = words[i];
    const from = chapter === a.chapter ? a.verse : 1;
    const to = chapter === b.chapter ? b.verse : plain ? lastVerse(plain, chapter) : from;
    for (let verse = from; verse <= to; verse++) {
      if (verses.length >= max) return { bible, verses, truncated: true };
      const found = plain ? plainLookup(plain, chapter, verse) : undefined;
      verses.push({ id: a.num * 1_000_000 + chapter * 1000 + verse, chapter, verse, text: found === undefined ? null : clean(found) });
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

async function passageText(catalog: Catalog, bible: Translation, start: number, end: number, whole: WholeBooks): Promise<string> {
  const { verses } = await rangeVerses(catalog, bible, start, end, Infinity, whole);
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
  // Every passage is found first, so the books it needs most of are read whole (wholeBooks) and the rest by chapter.
  const passages: { span: [number, number]; put: (text: string) => void }[] = [];
  walkQuotations(copy, (span, put) => passages.push({ span, put }));
  const whole = wholeBooks(catalog, bible, passages.flatMap(({ span }) => spanChapters(span[0], span[1])));
  await Promise.all(passages.map(({ span, put }) => passageText(catalog, bible, span[0], span[1], whole).then(put)));
  return copy;
}

/** A copy of the data with every quotation fillVerses would fill left empty ("" for each passage), for a page that draws
 * before its sections below ask for the words (the apostle pages, src/components/apostle-page/data.ts). Given
 * `placeholder`, each passage holds what it returns instead, as it is, without quotation marks (the Moses page puts an
 * invisible mark there and swaps in the words later, src/components/moses-page/quotations.ts); `marks` says whether
 * fillVerses would put that passage's words in quotation marks. */
export function emptyVerses<T>(data: T, placeholder?: (span: [number, number], marks: boolean) => string): T {
  const copy = structuredClone(data);
  walkQuotations(copy, (span, put, marks) => put(placeholder ? placeholder(span, marks) : "", true));
  return copy;
}

/** Calls `found` for every quotation and table entry in `node` (see fillVerses), with how to put its words in place
 * (in quotation marks where the quotation asks for them, unless `raw`) and whether it asks for them; a table of verses
 * becomes an object at once, and its entries are filled in place. */
type Put = (text: string, raw?: boolean) => void;
function walkQuotations(node: unknown, found: (span: [number, number], put: Put, marks: boolean) => void): void {
  if (Array.isArray(node)) { node.forEach((item) => walkQuotations(item, found)); return; }
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  if (record.quoted === true) {
    const span = (record.span ?? record.ref ?? [record.id, record.id]) as [number, number];
    const marks = Boolean(record.marks);
    found(span, (text, raw = false) => { record.text = marks && text && !raw ? `“${text}”` : text; }, marks);
  }
  for (const [key, value] of Object.entries(record)) {
    if ((key === "verses" || key === "kjv") && isVerseTable(value)) {
      const table: Record<string, string> = {};
      record[key] = table;
      for (const entry of value) {
        const [first, last = first] = entry.split("-").map(Number);
        found([first, last], (text) => { table[entry] = text; }, false);
      }
    } else walkQuotations(value, found);
  }
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
