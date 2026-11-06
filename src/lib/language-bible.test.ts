import { describe, expect, it } from "vitest";
import { languageBible } from "./verses";
import { SITE_LANGUAGES, SOURCE_LANGUAGE } from "./site-languages";
import type { Catalog } from "./types";

// The source language and any other language with a Bible of its own, from site-languages.json.
const source = SOURCE_LANGUAGE;
const other = SITE_LANGUAGES.find((language) => language !== source && language.bible !== null)!;
const catalog = {
  translations: [{ slug: source.bible, books: { ROM: ["1"] } }, { slug: other.bible, books: { ROM: ["1"], TOB: ["1"] } }],
} as unknown as Catalog;

describe("the Bible the reader opens", () => {
  it("is the source language's Bible in English and each language's own elsewhere", () => {
    expect(other, "site-languages.json: no language with a Bible of its own").toBeDefined();
    expect(languageBible(catalog, source.code, "ROM", "1")).toBe(source.bible);
    expect(languageBible(catalog, other.code, "ROM", "1")).toBe(other.bible);
  });

  it("has no answer when that Bible lacks the chapter, so the link's own edition stands", () => {
    expect(languageBible(catalog, source.code, "TOB", "1")).toBeNull();
    expect(languageBible(catalog, other.code, "ROM", "99")).toBeNull();
  });
});
