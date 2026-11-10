// Reading a card's verses from the Berean Standard Bible: only the small file that holds the chapter (src/lib/data.ts),
// read once per visit. A chapter or verse the Berean does not have is "missing", told apart from a failed download.
import { loadChapterPlain } from "@/lib/data";
import { bookByNum, formatRange } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { bookCode, verseId, type CardRef } from "@/lib/verse-card/links";
import { closeNoteGaps, MAX_TEXT } from "@/lib/verse-card/spec";

export const BIBLE = "bsb";

export interface Passage {
  ref: CardRef;
  /** The verses' words joined with a space, without verse numbers (design 4.4). */
  text: string;
  /** "Proverbs 3:5–6", as the rest of the site writes it. */
  reference: string;
  /** The chapter's verse numbers, for Add the verse before and after. */
  verses: Map<number, string>;
}

export type PassageState = { status: "loading" } | { status: "ready"; passage: Passage; trimmed: boolean } | { status: "missing"; reference: string } | { status: "error" };

/** "John 3:16" or "Proverbs 3:5–6" from the catalogue's book names. */
export const referenceOf = (catalog: Catalog, ref: CardRef) => formatRange(catalog, verseId(ref.book, ref.chapter, ref.first), verseId(ref.book, ref.chapter, ref.last));

/** The words of verses `first` to `last` that the chapter has, with footnote gaps closed in each verse (never across a join), joined. */
export const joinVerses = (verses: Map<number, string>, first: number, last: number) => {
  const words: string[] = [];
  for (let verse = first; verse <= last; verse++) { const text = verses.get(verse); if (text) words.push(closeNoteGaps(text)); }
  return words.join(" ");
};

/** The chapter's verses, or null when the Berean has no such chapter. Throws when the file could not be read. */
export async function chapterVerses(catalog: Catalog, book: number, chapter: number): Promise<Map<number, string> | null> {
  const code = bookCode(book);
  const labels = catalog.translations.find((translation) => translation.slug === BIBLE)?.books[code];
  if (!labels) throw new Error(`verse cards: the catalogue has no ${BIBLE} book ${code}`);
  if (!labels.includes(String(chapter))) return null;
  const plain = await loadChapterPlain(BIBLE, code, labels, String(chapter));
  const prefix = `${chapter}:`;
  return new Map(Object.entries(plain).filter(([key]) => key.startsWith(prefix)).map(([key, text]): [number, string] => [Number(key.slice(prefix.length)), text]));
}

/** The passage a card shows. A run over the card's limit opens its first verse alone (`trimmed`); a first verse the Berean
 *  does not have (Matthew 17:21) is "missing". */
export async function loadPassage(catalog: Catalog, ref: CardRef): Promise<PassageState> {
  const missing = { status: "missing" as const, reference: referenceOf(catalog, ref) };
  if (!bookByNum(catalog, ref.book)) return missing;
  const verses = await chapterVerses(catalog, ref.book, ref.chapter);
  if (!verses || !verses.has(ref.first)) return missing;
  let shown = { ...ref, last: Math.min(ref.last, Math.max(...verses.keys())) }; // a range past the chapter's end stops there
  let text = joinVerses(verses, shown.first, shown.last);
  const trimmed = text.length > MAX_TEXT;
  if (trimmed) { shown = { ...ref, last: ref.first }; text = joinVerses(verses, ref.first, ref.first); }
  return { status: "ready", trimmed, passage: { ref: shown, text, reference: referenceOf(catalog, shown), verses } };
}
