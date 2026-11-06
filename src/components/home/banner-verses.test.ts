import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { currentBibleSlug } from "@/lib/verses";
import type { LanguageCode } from "@/lib/language";
import { SITE_LANGUAGES, SOURCE_LANGUAGE, type SiteLanguage } from "@/lib/site-languages";
import { BANNER_VERSES, BLESSING_VERSES, RING_VERSES, type BannerVerseName } from "./banner-verses";

const SOURCE: Record<BannerVerseName, [string, string]> = { isaiah: ["ISA", "40:8"], john: ["JHN", "5:39"], peter: ["1PE", "3:15"], galatians: ["GAL", "6:2"] };
const RING: Record<string, [string, string]> = {
  "the word of our God stands forever": ["ISA", "40:8"],
  "Open my eyes that I may see wondrous things": ["PSA", "119:18"],
  "my rock, my fortress, and my deliverer": ["PSA", "18:2"],
  "love your neighbor as yourself": ["LEV", "19:18"],
};
/** Letters and marks only, so that a cut's own punctuation and line breaks do not count. */
const bare = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{M}]/gu, "");
const verse = (language: LanguageCode, [code, key]: [string, string]) =>
  bare((JSON.parse(readFileSync(`data/plain/${currentBibleSlug(language)}/${code}.json`, "utf8")) as Record<string, string>)[key]);
const pieces = (text: string) => text.split(/\n|…+/).map(bare).filter(Boolean);

/** Each language's cut of its own Bible for the home page's verses, {English: wording}: apply.py writes them into its
 * phrase list over anything a translator wrote, and banner-verses.tsx shows them (verseWords). */
const seed = (language: SiteLanguage): Record<string, string> =>
  JSON.parse(readFileSync(`content/translation/seed/bible/${language.folder}.json`, "utf8")) as Record<string, string>;
const withBibles = SITE_LANGUAGES.filter((language) => language.bible !== null && language !== SOURCE_LANGUAGE);

describe("the home page's verses in each language's own Bible", () => {
  for (const language of withBibles) {
    const own = (english: string) => {
      const words = seed(language)[english];
      expect(words, `${language.code}: no wording for "${english}"`).toBeTypeOf("string");
      return words;
    };
    it(`in ${language.code}, each banner is cut from that language's Bible`, () => {
      for (const name of Object.keys(SOURCE) as BannerVerseName[]) {
        const whole = verse(language.code, SOURCE[name]);
        for (const piece of pieces(own(BANNER_VERSES[name]))) expect(whole, `${name}: ${piece}`).toContain(piece);
      }
    });
    it(`in ${language.code}, the blessing at the foot of the page is that language's Bible`, () => {
      const [numbers, joshua] = [BLESSING_VERSES.numbers.map(own), BLESSING_VERSES.joshua.map(own)];
      expect(verse(language.code, ["NUM", "6:24"])).toContain(bare(numbers[0]));
      expect(verse(language.code, ["NUM", "6:25"])).toContain(bare(numbers[1]));
      expect(verse(language.code, ["JOS", "1:9"])).toContain(bare(joshua.join(" ")));
    });
    it(`in ${language.code}, each ring is cut from that language's Bible`, () => {
      for (const [english, source] of Object.entries(RING)) expect(verse(language.code, source), english).toContain(bare(own(english)));
    });
  }

  it("are for site languages with a Bible of their own, and for the English of the home page's verses only", () => {
    expect(Object.keys(RING)).toEqual([...RING_VERSES]);
    const english = new Set([...Object.values(BANNER_VERSES), ...Object.values(BLESSING_VERSES).flat(), ...RING_VERSES]);
    const files = readdirSync("content/translation/seed/bible").map((name) => name.replace(/\.json$/, "")).sort();
    expect(files).toEqual(withBibles.map((language) => language.folder).sort());
    for (const language of withBibles) expect(Object.keys(seed(language)).filter((key) => !english.has(key)), language.code).toEqual([]);
  });
});
