// A passage's words from the Berean Standard Bible: the chapters it covers, read one at a time from the site's own files
// (src/lib/data.ts, a few chapters to a file), stopping once MAX_VERSES are in hand so "Psalms 1-150" never downloads
// the whole book. A range is cut to the verses the Berean really has: "John 3:99" finds nothing, and Matthew 17:21,
// which the Berean leaves out, is simply not there. Nothing is sent anywhere but the request for each file.
import { loadChapterPlain } from "@/lib/data";
import type { Catalog } from "@/lib/types";
import type { Reference } from "@/pages/citation-generator/parse";

export const BIBLE = "bsb";
export const MAX_VERSES = 250;

/** `part`: which of the reference's passages the verse belongs to ("Ps 23; 91:1-4" has two). */
export interface Verse { chapter: number; verse: number; text: string; part: number }

export interface LoadedPassage {
  verses: Verse[];
  /** True when the passage went on past MAX_VERSES and the rest was left out. */
  cut: boolean;
}

/** The book code the Berean holds a reference under (the catalogue maps the Greek forms of a book to its usual one). */
export function heldCode(catalog: Catalog, code: string): string | null {
  const labels = catalog.translations.find((translation) => translation.slug === BIBLE)?.books;
  if (!labels) return null;
  if (labels[code]) return code;
  const other = catalog.equivalent[code];
  return other && labels[other] ? other : null;
}

/** One chapter's verses as [verse number, words], in order. */
async function chapterVerses(catalog: Catalog, code: string, chapter: number): Promise<[number, string][]> {
  const labels = catalog.translations.find((translation) => translation.slug === BIBLE)?.books[code];
  if (!labels) throw new Error(`worship slides: the catalogue has no ${BIBLE} book ${code}`);
  const plain = await loadChapterPlain(BIBLE, code, labels, String(chapter));
  const prefix = `${chapter}:`;
  return Object.entries(plain)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, text]): [number, string] => [Number(key.slice(prefix.length)), text])
    .filter(([verse, text]) => Number.isInteger(verse) && text.length > 0)
    .sort((a, b) => a[0] - b[0]);
}

/** Every verse the reference covers, in the order typed, up to MAX_VERSES. */
export async function loadPassage(catalog: Catalog, reference: Reference, limit = MAX_VERSES): Promise<LoadedPassage> {
  const code = heldCode(catalog, reference.code);
  if (!code) throw new Error(`worship slides: the ${BIBLE} has no book ${reference.code}`);
  const verses: Verse[] = [];
  for (const [part, passage] of reference.passages.entries()) {
    for (let chapter = passage.chapter; chapter <= passage.endChapter; chapter++) {
      const from = chapter === passage.chapter && passage.verse !== null ? passage.verse : 1;
      const to = chapter === passage.endChapter && passage.endVerse !== null ? passage.endVerse : Infinity;
      for (const [verse, text] of await chapterVerses(catalog, code, chapter)) {
        if (verse < from || verse > to) continue;
        if (verses.length === limit) return { verses, cut: true };
        verses.push({ chapter, verse, text, part });
      }
    }
  }
  return { verses, cut: false };
}
