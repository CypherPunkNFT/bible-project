// The home page's verses (the banners, the emblems' rings, the blessing at the foot) are the site's own short wording,
// cut by hand, so they are not verse ids. Each is an ordinary page string: a language's phrase list (ui.json) holds its
// wording, cut the same way from that language's Bible. Those cuts live in content/translation/seed/bible/<folder>.json,
// which apply.py writes over anything a translator wrote, and banner-verses.test.ts checks every piece against the Bible.
// A language that quotes the English Bible (a made-up test language), or has no wording for a verse yet, shows the English.
import { useCurrentBible } from "@/lib/verses";
import { useSiteLanguage, type LanguageCode } from "@/lib/language";
import { phrase } from "@/lib/page-translator";
import { SOURCE_LANGUAGE, scriptureLanguage } from "@/lib/site-languages";
import type { Translation } from "@/lib/types";

export type BannerVerseName = "isaiah" | "john" | "peter" | "galatians";

export const BANNER_VERSES: Record<BannerVerseName, string> = {
  isaiah: "The grass withers and the flowers fall, but the word of our God stands forever.",
  john: "You pore over the Scriptures… These are the very words that testify about Me.",
  peter: "Always be prepared to give a defense\nto everyone who asks you the reason\nfor the hope that is in you.",
  galatians: "Carry one another’s burdens,\nand in this way you will fulfill the law of Christ.",
};

/** The blessing at the foot of the home page: each verse's lead-in and its gold ending, cut the same way. */
export const BLESSING_VERSES: Record<"numbers" | "joshua", [string, string]> = {
  numbers: ["May the LORD bless you and keep you;", "may the LORD cause His face to shine upon you and be gracious to you."],
  joshua: ["Be strong and courageous. Do not be afraid; do not be discouraged,", "for the LORD your God is with you wherever you go."],
};

/** The emblem rings' words, by their English in emblem-designs.tsx, that each language shows in its own Bible; any other
 * design's ring shows its English. */
export const RING_VERSES: readonly string[] = [
  "the word of our God stands forever",
  "Open my eyes that I may see wondrous things",
  "my rock, my fortress, and my deliverer",
  "love your neighbor as yourself",
];

/** What these Bibles are called in their own language, for readers of that language. */
export const BIBLE_OWN_NAMES: Record<string, string> = {
  cuv: "和合本",
  svd: "ترجمة فان دايك",
  irv: "इंडियन रिवाइज्ड वर्जन",
  ind: "Alkitab Yang Terbuka",
};

/** Home-page verses in the site language's Bible (its phrase list's wording), with the language marks for the words
 * shown. All of them or none: a verse cut in two shows both parts in one language, the English when either has no
 * wording, marked as the source language's. */
export function verseWords(english: readonly string[], language: LanguageCode, bible: Translation): { words: string[]; lang: string; dir: "ltr" | "rtl" } {
  const own = scriptureLanguage(language) === SOURCE_LANGUAGE.code ? [] : english.map((text) => phrase(text, language));
  if (own.length && own.every((words) => words !== null)) return { words: own as string[], lang: bible.lang, dir: bible.dir };
  return { words: [...english], lang: SOURCE_LANGUAGE.code, dir: SOURCE_LANGUAGE.dir };
}

export function BannerVerse({ name }: { name: BannerVerseName }) {
  const { words: [words], ...marks } = verseWords([BANNER_VERSES[name]], useSiteLanguage(), useCurrentBible());
  return <span {...marks} translate="no">“{words}”</span>;
}

/** The words around an emblem's ring, by their English in emblem-designs.tsx, shown while it is hovered. */
export function RingVerseWords({ english }: { english: string }) {
  const own = verseWords([english], useSiteLanguage(), useCurrentBible());
  const { words: [words], ...marks } = RING_VERSES.includes(english) ? own : { words: [english], lang: SOURCE_LANGUAGE.code, dir: SOURCE_LANGUAGE.dir };
  return <span {...marks} translate="no">“{words[0].toUpperCase() + words.slice(1)}”</span>;
}
