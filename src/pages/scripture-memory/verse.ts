// Scripture memory: turning what the visitor typed into a passage it can learn, and loading its Berean words (design §2
// and §9). References are read by the citation generator's parser against the Berean's books; this tool accepts one
// passage in one chapter, with verses, at most MAX_VERSES verses and MAX_WORDS words. Always the English Berean.
import { buildNameIndex, parseReference } from "@/pages/citation-generator/parse";
import { bookByCode, bookByNum, splitId } from "@/lib/refs";
import type { Catalog, Translation } from "@/lib/types";
import { resolveRange } from "@/lib/verses";
import { passageWords } from "./fade";

export const BIBLE = "bsb";
export const MAX_VERSES = 8;
export const MAX_WORDS = 150;

export const berean = (catalog: Catalog): Translation | undefined => catalog.translations.find((translation) => translation.slug === BIBLE);

const lastChapter = (labels: readonly string[]) => labels.reduce((max, label) => Math.max(max, parseInt(label, 10) || 0), 0);

/** Whether stored or imported ids make a passage this tool can hold: whole safe numbers, one book of the Berean, one
 * chapter it has, verses 1–999 running forwards, at most MAX_VERSES of them. */
export function passageAllowed(catalog: Catalog, from: unknown, to: unknown): boolean {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) return false;
  const a = splitId(from as number);
  const b = splitId(to as number);
  if (a.num !== b.num || a.chapter !== b.chapter || a.verse < 1 || b.verse < a.verse || b.verse - a.verse >= MAX_VERSES) return false;
  const code = bookByNum(catalog, a.num)?.code;
  const labels = code ? berean(catalog)?.books[code] : undefined;
  return Boolean(labels) && a.chapter >= 1 && a.chapter <= lastChapter(labels!);
}

export type Chosen = { ok: true; from: number; to: number } | { ok: false; error: string };

/** What was typed, as first and last verse ids, or the sentence that says why it cannot be learned here. */
export function choosePassage(catalog: Catalog, typed: string, index = buildNameIndex(catalog.books)): Chosen {
  const bible = berean(catalog);
  if (!bible) return { ok: false, error: "The Berean Standard Bible is missing from this copy of the site." };
  const parsed = parseReference(typed, bible, catalog.books, catalog.equivalent, index);
  if (!parsed.ok) return parsed;
  const { code, passages } = parsed.reference;
  const one = passages.length === 1 ? passages[0] : null;
  if (!one || one.verse === null || one.endVerse === null || one.endChapter !== one.chapter) {
    return { ok: false, error: "Choose one verse, or a few verses in one chapter, such as Psalm 23:1-3." };
  }
  if (one.endVerse - one.verse >= MAX_VERSES) return { ok: false, error: "Choose at most 8 verses at a time, such as Psalm 23:1-6." };
  const num = bookByCode(catalog, code)?.num;
  if (!num) return { ok: false, error: "The Berean Standard Bible is missing from this copy of the site." };
  const base = num * 1_000_000 + one.chapter * 1000;
  return { ok: true, from: base + one.verse, to: base + one.endVerse };
}

export type Loaded = { ok: true; text: string } | { ok: false; error: string };

/** The passage's Berean words, joined. Refused, with a sentence, when the Berean lacks a verse of it or it is longer
 * than MAX_WORDS. A file that cannot be fetched throws: the page then offers Try again, never "no such verse". */
export async function loadPassage(catalog: Catalog, from: number, to: number): Promise<Loaded> {
  const { verses } = await resolveRange(catalog, from, to, BIBLE);
  const missing = verses.find((verse) => verse.text === null);
  if (missing) {
    const book = bookByNum(catalog, splitId(from).num)?.name ?? "";
    return { ok: false, error: `The Berean Standard Bible has no verse ${book} ${missing.chapter}:${missing.verse}.` };
  }
  // A verse label covering two verses ("15-16") gives the same words for each: show them once.
  const texts = verses.map((verse) => verse.text!).filter((text, i, all) => i === 0 || text !== all[i - 1]);
  const text = texts.join(" ");
  if (passageWords(text).length > MAX_WORDS) return { ok: false, error: "That passage has more than 150 words. Choose fewer verses to learn at a time." };
  return { ok: true, text };
}

/** The reader at that chapter with the verses lit, in the Berean. */
export function readerHref(catalog: Catalog, from: number, to: number): string {
  const start = splitId(from);
  const code = bookByNum(catalog, start.num)?.code ?? "GEN";
  return `/read/bsb/${code}/${start.chapter}?hl=${start.verse}-${splitId(to).verse}`;
}
