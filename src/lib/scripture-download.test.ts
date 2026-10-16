import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Catalog, PlainBook } from "./types";
import { scriptureText } from "./scripture-download";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;

describe("scripture downloads", () => {
  for (const version of catalog.translations) {
    it(`exports every verse of ${version.abbr} in source order with its credits`, () => {
      const codes = Object.keys(version.books);
      const books = codes.map((code) => JSON.parse(readFileSync(`data/plain/${version.slug}/${code}.json`, "utf8")) as PlainBook);
      const text = scriptureText(catalog, version, books);
      expect(text).toContain(version.name);
      const verseLines = text.split("\r\n").filter((line) => /^[A-Z0-9]{3} \S+:\S+ /.test(line));
      const expected = books.flatMap((book, index) => Object.entries(book).map(([ref, words]) => `${codes[index]} ${ref} ${words}`));
      expect(verseLines).toEqual(expected);
      expect(verseLines).toHaveLength(version.verses);
      if (version.credit) {
        expect(text).toContain(version.credit.text);
        expect(text).toContain(version.credit.licenceUrl);
        expect(text).toContain(version.credit.changes);
      }
    });
  }

  it("refuses an incomplete edition rather than saving a partial file", () => {
    expect(() => scriptureText(catalog, catalog.translations[0], [])).toThrow("Incomplete edition");
  });
});
