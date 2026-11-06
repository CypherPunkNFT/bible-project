import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { siteLanguageProblems } from "./site-languages-check";
import { SITE_LANGUAGES, SOURCE_LANGUAGE } from "./site-languages";

// The one language file (translation system, stage 3, job 1; the site moved onto it in job 2).
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

  it("with a fault in the source language, the browser still quotes the English Bible and reads left to right", async () => {
    vi.resetModules();
    vi.doMock("./site-languages.json", () => ({ default: withChange(0, { bible: null }) }));
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const fresh = await import("./site-languages");
      // English stays first in the menu, so a reader in another language can always switch back.
      expect(fresh.SITE_LANGUAGES.map((language) => language.code)).toEqual(codes);
      expect([fresh.SOURCE_LANGUAGE.code, fresh.SOURCE_LANGUAGE.bible, fresh.SOURCE_LANGUAGE.dir]).toEqual(["en", "bsb", "ltr"]);
      expect(fresh.siteLanguageBible("made-up")).toBe("bsb");
    } finally {
      report.mockRestore();
      vi.doUnmock("./site-languages.json");
      vi.resetModules();
    }
  });

  const brokenFiles: [string, unknown, string[]][] = [
    ["no languages list: English alone, not a blank site", { about: [] }, ["en"]],
    ["a second entry with no folder: one English, the other dropped", withChange(1, { folder: null }), codes.filter((_, at) => at !== 1)],
    ["English's folder broken: English still offered once", withChange(0, { folder: "../x" }), codes],
  ];
  it.each(brokenFiles)("in the browser, with %s", async (_name, file, expected) => {
    vi.resetModules();
    vi.doMock("./site-languages.json", () => ({ default: file }));
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const fresh = await import("./site-languages");
      expect(fresh.SITE_LANGUAGES.map((language) => language.code)).toEqual(expected);
      expect(fresh.SITE_LANGUAGES.filter((language) => language.folder === null)).toHaveLength(1);
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
    ["a source language with no Bible", withChange(0, { bible: null }), /source language \(folder null\) needs a Bible/],
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

// What job 2 moved onto the one file (translation system, stage 3). The private lists that stay are written exemptions
// in SiteTranslation/system/HANDOFF.md; these keep each of them true to the file, by rule rather than by a list of codes.
describe("the site reads its languages from the one file", () => {
  const source = SOURCE_LANGUAGE;
  const read = (file: string) => readFileSync(file, "utf8");
  const quoted = (code: string) => new RegExp(`["'\`]${code.replace(/-/g, "\\-")}["'\`]`);

  it("index.html names no language but the source one, and leaves the reading direction to the page translator", () => {
    const html = read("index.html");
    for (const language of SITE_LANGUAGES.filter((entry) => entry !== source)) expect(html, language.code).not.toMatch(quoted(language.code));
    expect(html).not.toMatch(/\.dir\s*=/);
  });

  // index.css stays the authority for fonts: a font belongs to a script, and its rules are shared with the Bible
  // languages (Persian, Urdu, Marathi...). The file's `font` must be exactly the rule a site language's text gets, and
  // that rule must stop at <html>, or every label on the site would take the verse typeface in that language.
  it("each language's font is the one index.css gives its text below <html>, and a language with none has no font rule", () => {
    const css = read("src/index.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const squeeze = (text: string) => text.replace(/\s+/g, " ").trim();
    const fontRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .map(([, selector, body]) => ({ selector: squeeze(selector), font: body.match(/font-family:\s*([^;]+);/)?.[1] }))
      .filter((rule): rule is { selector: string; font: string } => rule.font !== undefined);
    expect(fontRules.length, "index.css: no font rules read").toBeGreaterThan(5);
    for (const language of SITE_LANGUAGES) {
      const name = language.code.replace(/-/g, "\\-");
      const naming = fontRules.filter((rule) => new RegExp(`\\[lang="${name}"\\]|:lang\\(${name}\\)`).test(rule.selector));
      expect(naming.map((rule) => squeeze(rule.font)), language.code).toEqual(language.font === null ? [] : [squeeze(language.font)]);
      for (const rule of naming) {
        expect(rule.selector, `${language.code}: a font rule must not match <html>`).not.toMatch(new RegExp(`:lang\\(${name}\\)`));
        expect(rule.selector, `${language.code}: a font rule must not match <html>`).not.toMatch(new RegExp(`\\[lang="${name}"\\](?!:not\\(html\\))`));
      }
    }
  });

  it("every language with its own Bible quotes one the catalogue has, written in that language", () => {
    const catalog = JSON.parse(read("data/catalog.json")) as { translations: { slug: string; lang: string }[] };
    const primary = (tag: string) => tag.split("-")[0];
    for (const language of [source, ...SITE_LANGUAGES.filter((entry) => entry.bible !== null)]) {
      const bible = catalog.translations.find((translation) => translation.slug === language.bible);
      expect(bible, `${language.code}: Bible "${language.bible}" is not in data/catalog.json`).toBeDefined();
      // page-translator.ts waits on a reader page for verses marked :lang(<first part of the code>).
      expect(primary(bible!.lang), language.code).toBe(primary(language.code));
    }
  });

  it("the reader's \"Marked read\" mark has each released language's own wording, seeded until the translators' arrives", () => {
    for (const language of SITE_LANGUAGES.filter((entry) => entry.released && entry.folder !== null)) {
      const seed = JSON.parse(read(`content/translation/seed/${language.folder}.json`)) as Record<string, string>;
      expect(seed["Marked read"], language.code).toBeTypeOf("string");
    }
  });
});
