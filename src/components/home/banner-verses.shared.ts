export { BANNER_VERSES, BLESSING_VERSES, RING_VERSES } from "./banner-verses";
export type { BannerVerseName } from "./banner-verses";
// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { type LanguageCode } from "@/lib/language";
import { phrase } from "@/lib/page-translator";
import { SOURCE_LANGUAGE, scriptureLanguage } from "@/lib/site-languages";
import type { Translation } from "@/lib/types";

export const BIBLE_OWN_NAMES: Record<string, string> = {
  cuv: "和合本",
  svd: "ترجمة فان دايك",
  irv: "इंडियन रिवाइज्ड वर्जन",
  ind: "Alkitab Yang Terbuka",
};

export function verseWords(english: readonly string[], language: LanguageCode, bible: Translation): { words: string[]; lang: string; dir: "ltr" | "rtl" } {
  const own = scriptureLanguage(language) === SOURCE_LANGUAGE.code ? [] : english.map((text) => phrase(text, language));
  if (own.length && own.every((words) => words !== null)) return { words: own as string[], lang: bible.lang, dir: bible.dir };
  return { words: [...english], lang: SOURCE_LANGUAGE.code, dir: SOURCE_LANGUAGE.dir };
}
