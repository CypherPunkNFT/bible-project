// Reading a verse of the Berean Standard Bible: only the small file that holds its chapter (a few chapters to a file,
// src/lib/data.ts), read once per visit and kept by the browser after that. Nothing is sent anywhere but the request
// for the file itself.
import { loadChapterPlain } from "@/lib/data";
import type { Catalog } from "@/lib/types";
import type { ChapterDraw, VerseRef } from "./pick";

export const BIBLE = "bsb";

/** The chapter's verses as [verse number, words], in order. */
async function chapterVerses(catalog: Catalog, code: string, chapter: number): Promise<[number, string][]> {
  const labels = catalog.translations.find((translation) => translation.slug === BIBLE)?.books[code];
  if (!labels) throw new Error(`random verse: the catalogue has no ${BIBLE} book ${code}`);
  const plain = await loadChapterPlain(BIBLE, code, labels, String(chapter));
  const prefix = `${chapter}:`;
  return Object.entries(plain)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, text]): [number, string] => [Number(key.slice(prefix.length)), text])
    .sort((a, b) => a[0] - b[0]);
}

/** A verse's words, or undefined when the BSB has no such verse (Matthew 17:21, John 3:99). */
export async function readVerse(catalog: Catalog, ref: VerseRef): Promise<string | undefined> {
  const verses = await chapterVerses(catalog, ref.code, ref.chapter);
  return verses.find(([verse]) => verse === ref.verse)?.[1];
}

/** Which verse a chapter draw landed on. If the chapter turns out shorter than the counts said, its last verse. */
export async function settleDraw(catalog: Catalog, drawn: ChapterDraw): Promise<VerseRef> {
  const verses = await chapterVerses(catalog, drawn.code, drawn.chapter);
  if (!verses.length) throw new Error(`random verse: ${BIBLE} ${drawn.code} ${drawn.chapter} has no verses`);
  return { code: drawn.code, chapter: drawn.chapter, verse: verses[Math.min(drawn.nth, verses.length - 1)][0] };
}
