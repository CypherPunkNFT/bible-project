import { describe, expect, it } from "vitest";
import { menuLanguages } from "./language";
import { SITE_LANGUAGES, type SiteLanguage } from "./site-languages";

// A made-up list: Spanish released, "xa" still being made (translation system, stage 2).
// The fields the menu and the release do not look at.
const FIELDS = { bible: null, englishName: "Test", script: "Latn", plurals: ["one", "other"], digits: "latn", font: null, pseudo: false } as const;
const LANGUAGES: SiteLanguage[] = [
  { code: "en", name: "English", folder: null, dir: "ltr", released: true, ...FIELDS },
  { code: "es", name: "Español", folder: "es", dir: "ltr", released: true, ...FIELDS },
  { code: "xa", name: "Test", folder: "xa", dir: "ltr", released: false, ...FIELDS },
];
const codes = (list: SiteLanguage[]) => list.map((language) => language.code);

describe("the language menu", () => {
  it("offers only released languages on the live site", () => {
    expect(codes(menuLanguages(LANGUAGES, "bibleguide.io"))).toEqual(["en", "es"]);
    expect(codes(menuLanguages(LANGUAGES, "bible-project-4af.pages.dev"))).toEqual(["en", "es"]);
  });

  it("offers unreleased languages too on this computer's preview", () => {
    expect(codes(menuLanguages(LANGUAGES, "127.0.0.1"))).toEqual(["en", "es", "xa"]);
    expect(codes(menuLanguages(LANGUAGES, "localhost"))).toEqual(["en", "es", "xa"]);
  });

  it("offers every language the site has published today", () => {
    expect(codes(menuLanguages(SITE_LANGUAGES, "bibleguide.io"))).toEqual(["en", "es", "pt-BR", "zh-Hans", "ar", "hi", "id"]);
  });
});
