import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { siteLanguageProblems } from "./site-languages-check";

// The translation system's stage 3, job 2: a made-up language added to the one file needs no other edit. Two are added
// here, one each way, under the standard codes for test languages: no Bible of their own, no folder on disk yet, and
// not released. Should the file already hold languages under these codes or folders (the real test languages), they are
// replaced by these.
const real = JSON.parse(readFileSync("src/lib/site-languages.json", "utf8")) as { about: string[]; languages: { code: string; folder: string | null }[] };
const madeUp = (code: string, folder: string, dir: "ltr" | "rtl", plurals: string[]) => ({
  code, folder, bible: null, name: `[${code} ~~~]`, englishName: `Test language (${dir})`, dir, script: "Latn", plurals,
  digits: "latn", font: null, released: false, pseudo: true,
});
const MADE_UP = ["en-XA", "ar-XB"];
const others = real.languages.filter((language) => !MADE_UP.includes(language.code) && !["xa", "xb"].includes(language.folder ?? ""));
const withMadeUp = {
  ...real,
  languages: [...others, madeUp("en-XA", "xa", "ltr", ["one", "other"]), madeUp("ar-XB", "xb", "rtl", ["zero", "one", "two", "few", "many", "other"])],
};

/** The site's language modules, loaded afresh with the made-up languages in the file. */
async function siteWithMadeUp() {
  vi.resetModules();
  vi.doMock("./site-languages.json", () => ({ default: withMadeUp }));
  return {
    languages: await import("./site-languages"),
    language: await import("./language"),
    verses: await import("./verses"),
    banner: await import("@/components/home/banner-verses"),
  };
}

afterEach(() => {
  vi.doUnmock("./site-languages.json");
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("a made-up language added to the one file", () => {
  it("is sound, and the site takes it in", async () => {
    expect(siteLanguageProblems(withMadeUp)).toEqual([]);
    const { languages } = await siteWithMadeUp();
    expect(languages.SITE_LANGUAGES.map((language) => language.code)).toEqual(expect.arrayContaining(MADE_UP));
  });

  it("quotes the English Bible and shows the English home-page verses, marked as English", async () => {
    const { languages, verses, banner } = await siteWithMadeUp();
    const source = languages.SOURCE_LANGUAGE;
    for (const code of MADE_UP) {
      expect(verses.currentBibleSlug(code), code).toBe(source.bible);
      expect(languages.scriptureLanguage(code), code).toBe(source.code);
      expect(banner.homeWording(banner.BANNER_VERSES, code), code).toEqual({ words: banner.BANNER_VERSES[source.code], language: source.code });
      expect(banner.homeWording(banner.BLESSING_VERSES, code), code).toEqual({ words: banner.BLESSING_VERSES[source.code], language: source.code });
    }
    const bible = { lang: "ar", dir: "rtl" } as Parameters<typeof banner.wordingMarks>[1];
    expect(banner.wordingMarks(false, bible)).toEqual({ lang: source.code, dir: source.dir });
  });

  it("is in the menu on this computer's preview only, and never in a release", async () => {
    const { languages, language } = await siteWithMadeUp();
    const offered = (host: string) => language.menuLanguages(languages.SITE_LANGUAGES, host).map((entry) => entry.code);
    expect(offered("127.0.0.1")).toEqual(expect.arrayContaining(MADE_UP));
    for (const host of ["bibleguide.io", "bible-project-4af.pages.dev"]) for (const code of MADE_UP) expect(offered(host), host).not.toContain(code);
    expect(languages.releasedFolders()).not.toEqual(expect.arrayContaining(["xa"]));
    expect(languages.releasedFolders()).not.toEqual(expect.arrayContaining(["xb"]));
  });

  it("turns the page right to left when it reads that way, and holds verse ranges together only then", async () => {
    const [isolate, pop] = [String.fromCodePoint(0x2066), String.fromCodePoint(0x2069)];
    const words: Record<string, Record<string, string>> = {
      xa: { "Numbers 6:24–25": "[Ñûɱƀéŕš 6:24–25 ~~~]" },
      xb: { "Numbers 6:24–25": "[Ñûɱƀéŕš 6:24–25 ~~~]" },
    };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({ ok: true, json: async () => words[url.split("/")[3]] ?? {} })));
    await siteWithMadeUp();
    const { chooseSiteLanguage } = await import("./page-translator");
    document.body.innerHTML = "";
    const range = Object.assign(document.body.appendChild(document.createElement("p")), { textContent: "Numbers 6:24–25" });
    await chooseSiteLanguage("en-XA");
    expect([document.documentElement.lang, document.documentElement.dir]).toEqual(["en-XA", "ltr"]);
    expect(range.textContent).toBe("[Ñûɱƀéŕš 6:24–25 ~~~]");
    await chooseSiteLanguage("ar-XB");
    expect([document.documentElement.lang, document.documentElement.dir]).toEqual(["ar-XB", "rtl"]);
    expect(range.textContent).toBe(`[Ñûɱƀéŕš ${isolate}6:24–25${pop} ~~~]`);
    await chooseSiteLanguage("en");
    expect([document.documentElement.dir, range.textContent]).toEqual(["ltr", "Numbers 6:24–25"]);
  });
});
