import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { BANNER_VERSES, BLESSING_VERSES, RING_VERSES } from "@/components/home/banner-verses";
import { DEFAULT_BIBLE } from "./verses";
import { siteLanguageProblems } from "./site-languages-check";
import { SITE_LANGUAGES } from "./site-languages";

// The one language file (translation system, stage 3, job 1).
const FILE = "src/lib/site-languages.json";
const raw = readFileSync(FILE, "utf8");
const data = JSON.parse(raw) as { languages: Record<string, unknown>[] };
const codes = SITE_LANGUAGES.map((language) => language.code);
const sorted = (list: string[]) => [...list].sort();

/** A copy of the file with one language changed, for planting a fault; a field set to undefined is taken out. */
function withChange(index: number, change: Record<string, unknown>): unknown {
  const changed = (entry: Record<string, unknown>) =>
    Object.fromEntries(Object.entries({ ...entry, ...change }).filter(([, value]) => value !== undefined));
  return { ...data, languages: data.languages.map((entry, at) => (at === index ? changed(entry) : entry)) };
}

describe("the one language file", () => {
  it("is sound, and the site reads every language in it", () => {
    expect(siteLanguageProblems(data)).toEqual([]);
    expect(codes).toEqual(data.languages.map((entry) => entry.code));
  });

  it("is UTF-8 with no byte-order mark, so the Python tools read it as written", () => {
    expect(readFileSync(FILE)[0]).not.toBe(0xef);
  });

  it("gives each language the plural categories its code has, and a canonical web standard code", () => {
    for (const language of SITE_LANGUAGES) {
      expect(sorted([...language.plurals]), language.code).toEqual(sorted(new Intl.PluralRules(language.code).resolvedOptions().pluralCategories));
      expect(Intl.getCanonicalLocales(language.code)[0]).toBe(language.code);
    }
  });

  it("cannot be changed while the site runs", () => {
    expect(Object.isFrozen(SITE_LANGUAGES) && SITE_LANGUAGES.every((language) => Object.isFrozen(language))).toBe(true);
  });

  it("with a fault, never blanks the page: the browser reports it and keeps only the entries that pass", async () => {
    vi.resetModules();
    vi.doMock("./site-languages.json", () => ({ default: withChange(1, { released: "false" }) }));
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { SITE_LANGUAGES: kept } = await import("./site-languages");
      expect(kept.map((language) => language.code)).toEqual(codes.filter((code) => code !== codes[1]));
      expect(report).toHaveBeenCalledOnce();
    } finally {
      report.mockRestore();
      vi.doUnmock("./site-languages.json");
      vi.resetModules();
    }
  });

  const faults: [string, unknown, RegExp][] = [
    ["a release flag written as a string", withChange(1, { released: "false" }), /released: expected true or false/],
    ["a folder that climbs out of data/i18n", withChange(1, { folder: "../es" }), /folder: expected/],
    ["a field no one knows", withChange(1, { colour: "red" }), /unknown field "colour"/],
    ["a missing field", withChange(1, { font: undefined }), /missing field "font"/],
    ["a test language marked released", withChange(1, { pseudo: true }), /can never be released/],
    ["a second language with no folder", withChange(1, { folder: null }), /exactly one source language/],
    ["the same code twice, in other letter case", withChange(2, { code: "ES" }), /code: expected|appears more than once/],
    ["the same folder twice", withChange(2, { folder: "es" }), /folder "es" appears more than once/],
    ["a direction that is not ltr or rtl", withChange(1, { dir: "up" }), /dir: expected/],
    ["a font that would close its CSS rule", withChange(1, { font: "serif} body {display:none" }), /font: expected/],
    ["plurals with no \"other\"", withChange(1, { plurals: ["one"] }), /plurals: expected/],
    ["a source language that is not English", withChange(0, { code: "fr" }), /must be "en"/],
    ["an unreleased source language", withChange(0, { released: false }), /must be "en" and released/],
    ["no list at all", { about: [] }, /expected an object with a "languages" list/],
  ];
  for (const [what, broken, message] of faults) {
    it(`is refused with ${what}`, () => {
      const problems = siteLanguageProblems(broken);
      expect(problems.length, what).toBeGreaterThan(0);
      expect(problems.join("\n")).toMatch(message);
    });
  }
});

// Until job 2 moves the site onto the one file, the old per-language lists still exist beside it. These keep the two the
// same, and stand in for the compile-time check "every code has an entry" that a plain-string LanguageCode gave up.
// Job 2 deletes this block when it removes those lists.
describe("bridge until job 2: the private lists agree with the one file", () => {
  const source = SITE_LANGUAGES.find((language) => language.folder === null)!;
  const keysOf = (table: object) => sorted(Object.keys(table));
  const read = (file: string) => readFileSync(file, "utf8");
  const found = (text: string, pattern: RegExp, what: string): RegExpMatchArray => {
    const match = text.match(pattern);
    if (!match) throw new Error(`${what}: the pattern ${pattern} no longer matches; update this bridge test (or job 2 has removed the list)`);
    return match;
  };

  it("each language's Bible is the one verses.ts quotes", () => {
    expect(keysOf(DEFAULT_BIBLE)).toEqual(sorted(codes));
    for (const language of SITE_LANGUAGES) expect(DEFAULT_BIBLE[language.code], language.code).toBe(language.bible ?? source.bible);
  });

  it("the home page's verse tables have an entry for every language", () => {
    expect(keysOf(BANNER_VERSES)).toEqual(sorted(codes));
    expect(keysOf(BLESSING_VERSES)).toEqual(sorted(codes));
    expect(keysOf(RING_VERSES)).toEqual(sorted(codes.filter((code) => code !== source.code)));
  });

  it("the reader's \"Read\" mark has an entry for every language", () => {
    const table = found(read("src/pages/ReaderPage.tsx"), /const CHAPTER_READ[^=]*=\s*\{([^}]*)\}/, "ReaderPage.tsx CHAPTER_READ")[1];
    const keys = [...table.matchAll(/(?:^|,)\s*"?([\w-]+)"?\s*:/g)].map((match) => match[1]);
    expect(sorted(keys)).toEqual(sorted(codes));
  });

  it("index.html turns the page right to left for exactly the right-to-left languages", () => {
    const html = read("index.html");
    found(html, /document\.documentElement\.dir = "rtl"/, "index.html's right-to-left line");
    const flipped = [...html.matchAll(/language === "([\w-]+)"\) document\.documentElement\.dir = "rtl"/g)].map((match) => match[1]);
    expect(flipped.length, "index.html: no language === \"..\" before its right-to-left line").toBeGreaterThan(0);
    expect(sorted(flipped)).toEqual(sorted(SITE_LANGUAGES.filter((language) => language.dir === "rtl").map((language) => language.code)));
  });

  it("each language's font is the one index.css gives its text, and a language with none has no rule", () => {
    const css = read("src/index.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const squeeze = (text: string) => text.replace(/\s+/g, " ").trim();
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({ selectors: selectors.split(",").map(squeeze), body }));
    expect(rules.length, "index.css: no rules read").toBeGreaterThan(20);
    for (const language of SITE_LANGUAGES) {
      const fonts = rules
        .filter((rule) => rule.selectors.some((selector) => selector.startsWith(`[lang="${language.code}"]`)))
        .map((rule) => rule.body.match(/font-family:\s*([^;]+);/)?.[1])
        .filter((font): font is string => font !== undefined)
        .map(squeeze);
      expect(fonts, language.code).toEqual(language.font === null ? [] : [squeeze(language.font)]);
    }
  });
});
