import { BANNER_VERSES, BannerVerseName, RING_VERSES, verseWords } from "./banner-verses.shared";
// The home page's verses (the banners, the emblems' rings, the blessing at the foot) are the site's own short wording,
// cut by hand, so they are not verse ids. Each is an ordinary page string: a language's phrase list (ui.json) holds its
// wording, cut the same way from that language's Bible. Those cuts live in content/translation/seed/bible/<folder>.json,
// which apply.py writes over anything a translator wrote, and banner-verses.test.ts checks every piece against the Bible.
// A language that quotes the English Bible (a made-up test language), or has no wording for a verse yet, shows the English.
import { useSiteLanguage } from "@/lib/language";
import { SOURCE_LANGUAGE } from "@/lib/site-languages";
import { useCurrentBible } from "@/lib/verses";

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
