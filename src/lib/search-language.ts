import { useMemo } from "react";
import { languageFolder, useSiteLanguage, type LanguageCode } from "./language";
import { phrase, phraseListVersion } from "./page-translator";
import { siteLanguageBible } from "./site-languages";
import type { Translation } from "./types";

/**
 * The site search in the reader's language (translation system, stage 5 job 16). Studies and topics are searched in the
 * words the reader sees: each study's translation from the language's phrase list, the topic index's translated copy.
 * The rules go by script (Han has no spaces; Arabic has vowel marks and forms of alif), never by language code, so a new
 * language needs no edit here. English (no translated folder) keeps the English search exactly as it was.
 */

export interface SearchLanguage {
  /** The site language's code: the word breaker's locale and the `lang` of text drawn in it. */
  code: LanguageCode;
  /** The phrase list's read count this was made at (0: not read yet, so nothing built from it is kept). */
  version: number;
  /** The language's own wording of an English text, or null when it has none. */
  translate: (english: string) => string | null;
}

/** The search's language for a site language, or null for English, which keeps the English search. */
export function searchLanguage(code: LanguageCode, version = phraseListVersion(code)): SearchLanguage | null {
  if (!languageFolder(code)) return null;
  return { code, version, translate: (english) => phrase(english, code) };
}

/** The reader's search language; a new object only when the language or its phrase list changes. */
export function useSearchLanguage(): SearchLanguage | null {
  const code = useSiteLanguage();
  const version = phraseListVersion(code);
  return useMemo(() => searchLanguage(code, version), [code, version]);
}

const HAN = /\p{Script=Han}/u;
/** Arabic vowel marks (harakat, dagger alif) and the tatweel stretch: written or not, the word is the same. */
const ARABIC_MARKS = /[\u064B-\u0652\u0670\u0640]/g;
/** Every form of alif (hamza above or below, madda, wasla) is matched as plain alif, as the exact-words search does. */
const ALIF_FORMS = /[\u0623\u0625\u0622\u0671]/g;
/** "the" and "and the", "with the", "for the" written onto an Arabic word: الموت and موت are one word for search. */
const ARABIC_ARTICLE = /^[\u0648\u0641]?(?:\u0628\u0627\u0644|\u0643\u0627\u0644|\u0644\u0644|\u0627\u0644)(?=\p{L}{2})/u;
const INVISIBLE = /\u200c|\u200d|\u200f/g;

/** One word as the index keeps it: lower case; accents off Latin letters; Arabic marks, alif forms and the article
 * folded; joiners dropped. Devanagari vowel signs are letters of the word and stay. */
export function foldWord(word: string): string {
  return word.toLowerCase().normalize("NFKD").replace(/(\p{Script=Latin})\p{M}+/gu, "$1").normalize("NFC")
    .replace(ARABIC_MARKS, "").replace(ALIF_FORMS, "\u0627").replace(INVISIBLE, "").replace(ARABIC_ARTICLE, "");
}

export interface Segment { text: string; word: boolean }

/** Intl.Segmenter (the site's TypeScript library predates it); read each time, so a browser without one is handled. */
type WordBreaker = new (locale: string, options: { granularity: "word" }) => { segment(text: string): Iterable<{ segment: string; isWordLike?: boolean }> };
const wordBreaker = (): WordBreaker | undefined => (Intl as unknown as { Segmenter?: WordBreaker }).Segmenter;

/** Text cut into words and what lies between them, by the browser's word breaker for the language (Chinese has no
 * spaces). Without one, runs of letters, with a Han run kept whole. */
export function segmentsOf(text: string, code: string): Segment[] {
  const Breaker = wordBreaker();
  if (Breaker) return [...new Breaker(code, { granularity: "word" }).segment(text)].map((s) => ({ text: s.segment, word: !!s.isWordLike }));
  return (text.match(/[\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+/gu) ?? []).map((part) => ({ text: part, word: /[\p{L}\p{N}]/u.test(part) }));
}

/** The words of a text, folded. Without a word breaker a Han run is cut into overlapping pairs, so 为什么上帝允许苦难
 * still shares 苦难 with the studies. */
export function wordsOf(text: string, code: string): string[] {
  const words = segmentsOf(text, code).filter((s) => s.word).map((s) => foldWord(s.text)).filter(Boolean);
  if (wordBreaker()) return words;
  return words.flatMap((word) => (HAN.test(word) && word.length > 2 ? [...word].slice(1).map((ch, i) => word[i] + ch) : [word]));
}

/** A Chinese (Han) word: matched whole, never as the start of a longer word; elsewhere a word of four letters or more
 * also finds longer words it starts ("sufr" finds "sufrimiento", "fe" finds only "fe"). */
export const isHanWord = (word: string) => HAN.test(word);

/** The Bible the exact-words search reads, for a reader with no version in the address: the one they last read when
 * it is in the site's language, else the language's own (site-languages.json `bible`). */
export function searchBible(translations: readonly Translation[], language: SearchLanguage, lastRead: string | undefined): string {
  const primary = (tag: string) => tag.split("-")[0].toLowerCase();
  const last = translations.find((t) => t.slug === lastRead);
  if (last && primary(last.lang) === primary(language.code)) return last.slug;
  return siteLanguageBible(language.code);
}
