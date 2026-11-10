import { describe, expect, it } from "vitest";
import { KEY_BOOKS, passageKey } from "@/data/sympathy/card-keys";
import { cardKey, cardPagePath, cardPageUrl, keyFromReadPath, lookFromQuery, readerPath, refFromKey, verseId } from "./links";

describe("card keys", () => {
  it("pins the 66 key words, so a card link in someone's messages keeps working", () => {
    expect(KEY_BOOKS).toEqual([
      "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth", "1-samuel", "2-samuel",
      "1-kings", "2-kings", "1-chronicles", "2-chronicles", "ezra", "nehemiah", "esther", "job", "psalm", "proverbs",
      "ecclesiastes", "song-of-songs", "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel",
      "amos", "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah", "malachi", "matthew",
      "mark", "luke", "john", "acts", "romans", "1-corinthians", "2-corinthians", "galatians", "ephesians",
      "philippians", "colossians", "1-thessalonians", "2-thessalonians", "1-timothy", "2-timothy", "titus", "philemon",
      "hebrews", "james", "1-peter", "2-peter", "1-john", "2-john", "3-john", "jude", "revelation",
    ]);
  });

  it("round-trips every one of the 66 books, single verses and ranges", () => {
    for (let book = 1; book <= 66; book++) {
      for (const ref of [{ book, chapter: 1, first: 1, last: 1 }, { book, chapter: 1, first: 2, last: 5 }]) {
        expect(refFromKey(cardKey(ref))).toEqual(ref);
      }
    }
  });

  it("writes the keys sympathy writes for the same passage", () => {
    expect(cardKey({ book: 43, chapter: 3, first: 16, last: 16 })).toBe("john-3-16");
    expect(cardKey({ book: 20, chapter: 3, first: 5, last: 6 })).toBe("proverbs-3-5-6");
    expect(cardKey({ book: 46, chapter: 13, first: 4, last: 7 })).toBe("1-corinthians-13-4-7");
    expect(cardKey({ book: 19, chapter: 23, first: 1, last: 6 })).toBe(passageKey({ from: verseId(19, 23, 1), to: verseId(19, 23, 6) }));
  });

  it("refuses anything that is not a forward run of whole verses in one chapter of the 66 books", () => {
    for (const key of ["", "john-3-16-15", "john-3-16-16", "john-3-0", "john-0-1", "john-03-16", "john-3-016", "tobit-1-1", "john-3-16a",
      "2-samuel-1-26a", "john-3", "john", "constructor-1-1", "__proto__-1-1", "john-3-16-", "john-151-1", "psalm-119-177", "JOHN-3-16", "john-3-16?x"]) {
      expect(refFromKey(key), key).toBeNull();
    }
    expect(() => cardKey({ book: 1, chapter: 11, first: 32, last: 31 })).toThrow(/one chapter/);
    expect(() => cardKey({ book: 67, chapter: 1, first: 1, last: 1 })).toThrow();
  });

  it("puts only the verses and a built-in design in the address", () => {
    expect(cardPageUrl("john-3-16")).toBe("https://bibleguide.io/verse-cards/john-3-16");
    expect(cardPageUrl("john-3-16", "paper")).toBe("https://bibleguide.io/verse-cards/john-3-16");
    expect(cardPageUrl("john-3-16", "night")).toBe("https://bibleguide.io/verse-cards/john-3-16?look=night");
    expect(cardPagePath("proverbs-3-5-6", "lily")).toBe("/verse-cards/proverbs-3-5-6");
    expect(() => cardPagePath("../etc/passwd")).toThrow(/not a card key/);
  });

  it("opens an unknown or hostile design name in Paper", () => {
    for (const value of [null, "", "lily", "__proto__", "constructor", "toString", "NIGHT"]) expect(lookFromQuery(value)).toBe("paper");
    for (const value of ["paper", "night", "dawn", "olive", "book", "bold"]) expect(lookFromQuery(value)).toBe(value);
  });

  it("reads the verse-of-the-day files' reader addresses, and nothing else", () => {
    expect(keyFromReadPath("/read/bsb/HEB/4?hl=12")).toBe("hebrews-4-12");
    expect(keyFromReadPath("/read/bsb/LAM/3?hl=22-23")).toBe("lamentations-3-22-23");
    expect(keyFromReadPath("/read/bsb/1CO/13?hl=4-7")).toBe("1-corinthians-13-4-7");
    for (const path of ["/countdowns/advent/1", "/read/kjv/HEB/4?hl=12", "/read/bsb/TOB/1?hl=1", "/read/bsb/HEB/4", "/read/bsb/HEB/4?hl=12-3", "/read/bsb/HEB/4?hl=12&x=1", "https://evil.example/read/bsb/HEB/4?hl=12"]) {
      expect(keyFromReadPath(path), path).toBeNull();
    }
  });

  it("opens the reader at the verses, shaded", () => {
    expect(readerPath({ book: 43, chapter: 3, first: 16, last: 16 })).toBe("/read/bsb/JHN/3?hl=16");
    expect(readerPath({ book: 20, chapter: 3, first: 5, last: 6 })).toBe("/read/bsb/PRO/3?hl=5-6");
  });
});
