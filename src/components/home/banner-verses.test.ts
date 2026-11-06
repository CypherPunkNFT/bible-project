import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { currentBibleSlug } from "@/lib/verses";
import type { LanguageCode } from "@/lib/language";
import { SITE_LANGUAGES, SOURCE_LANGUAGE } from "@/lib/site-languages";
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

describe("the home page banners' own wording", () => {
  for (const language of Object.keys(BANNER_VERSES) as LanguageCode[]) {
    it(`in ${language}, each banner is cut from that language's Bible`, () => {
      for (const name of Object.keys(SOURCE) as BannerVerseName[]) {
        const whole = verse(language, SOURCE[name]);
        for (const piece of pieces(BANNER_VERSES[language]![name])) expect(whole, `${name}: ${piece}`).toContain(piece);
      }
    });
  }
  for (const language of Object.keys(BLESSING_VERSES) as LanguageCode[]) {
    it(`in ${language}, the blessing at the foot of the page is that language's Bible`, () => {
      const { numbers, joshua } = BLESSING_VERSES[language]!;
      expect(verse(language, ["NUM", "6:24"])).toContain(bare(numbers[0]));
      expect(verse(language, ["NUM", "6:25"])).toContain(bare(numbers[1]));
      expect(verse(language, ["JOS", "1:9"])).toContain(bare(joshua.join(" ")));
    });
  }
  for (const language of Object.keys(RING_VERSES) as LanguageCode[]) {
    it(`in ${language}, each ring is cut from that language's Bible`, () => {
      for (const [english, source] of Object.entries(RING)) expect(verse(language, source), english).toContain(bare(RING_VERSES[language]![english]));
    });
  }
});

// A language with no wording of its own shows the English (homeWording), which is right only beside the English Bible.
// So each language with a Bible of its own has its own wording, and a made-up one (no Bible) needs none.
describe("which languages have their own home-page verses", () => {
  const codes = SITE_LANGUAGES.map((language) => language.code);
  it("are site languages only", () => {
    for (const table of [BANNER_VERSES, BLESSING_VERSES]) for (const code of Object.keys(table)) expect(codes, code).toContain(code);
    for (const code of Object.keys(RING_VERSES)) expect(codes.filter((entry) => entry !== SOURCE_LANGUAGE.code), code).toContain(code);
  });

  it("include every language with a Bible of its own", () => {
    for (const language of SITE_LANGUAGES.filter((entry) => entry.bible !== null)) {
      expect(BANNER_VERSES[language.code], `${language.code}: banner`).toBeDefined();
      expect(BLESSING_VERSES[language.code], `${language.code}: blessing`).toBeDefined();
      if (language !== SOURCE_LANGUAGE) expect(RING_VERSES[language.code], `${language.code}: rings`).toBeDefined();
    }
  });
});
