import { readFileSync } from "node:fs";
import type { Catalog, Translation } from "@/lib/types";
import { normalizeName, parseReference, type Passage } from "./parse";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const version = (slug: string) => catalog.translations.find((t) => t.slug === slug) as Translation;
const bsb = version("bsb");

const parse = (text: string, slug = "bsb") => parseReference(text, version(slug), catalog.books, catalog.equivalent);
const passages = (text: string, slug = "bsb") => {
  const result = parse(text, slug);
  if (!result.ok) throw new Error(`${text}: ${result.error}`);
  return result.reference;
};
const error = (text: string, slug = "bsb") => {
  const result = parse(text, slug);
  if (result.ok) throw new Error(`${text}: expected an error`);
  return result.error;
};
const p = (chapter: number, verse: number | null, endChapter = chapter, endVerse = verse): Passage => ({ chapter, verse, endChapter, endVerse });

describe("reading a reference", () => {
  it("reads full names, the styles' abbreviations and common short forms", () => {
    expect(bsb).toBeDefined();
    for (const [text, code] of [["John 3:16", "JHN"], ["jn 3:16", "JHN"], ["Jhn 3:16", "JHN"], ["1 Cor 13:4", "1CO"], ["1Cor 13:4", "1CO"],
      ["I Corinthians 13:4", "1CO"], ["First John 1:9", "1JN"], ["Song of Songs 2:1", "SNG"], ["Song of Sol. 2:1", "SNG"], ["Eccles. 3:1", "ECC"],
      ["Qoh 3:1", "ECC"], ["Phlm 4", "PHM"], ["Philem. 4", "PHM"], ["Phil 4:13", "PHP"], ["1 Kgs 3:9", "1KI"], ["2 Kings 2:11", "2KI"],
      ["Jon 1:17", "JON"], ["Rev. 21:4", "REV"], ["Revelations 21:4", "REV"], ["Psalm 23", "PSA"], ["Pss 23", "PSA"], ["Deut 6:4", "DEU"],
      ["genesis 1:1", "GEN"], ["Hab 2:4", "HAB"]] as const) {
      expect(passages(text).code, text).toBe(code);
    }
  });

  it("refuses a short name that fits several books, and names them", () => {
    expect(error("Ez 1:1")).toMatch(/Ezra, Ezekiel/);
    expect(error("Ph 1:1")).toMatch(/Philippians, Philemon/);
    expect(error("Ju 1")).toMatch(/Judges/);
    expect(error("Hezekiah 1:1")).toMatch(/No book of the Bible is called “Hezekiah”/);
  });

  it("reads verses, ranges, ranges across chapters and whole chapters", () => {
    expect(passages("John 3:16").passages).toEqual([p(3, 16)]);
    expect(passages("John 3:16-18").passages).toEqual([p(3, 16, 3, 18)]);
    expect(passages("John 3:16–18").passages).toEqual([p(3, 16, 3, 18)]);
    expect(passages("John 3:16 to 18").passages).toEqual([p(3, 16, 3, 18)]);
    expect(passages("Gen 1:1-2:3").passages).toEqual([p(1, 1, 2, 3)]);
    expect(passages("Psalm 23").passages).toEqual([p(23, null)]);
    expect(passages("Gen 1-3").passages).toEqual([p(1, null, 3, null)]);
    expect(passages("John 3.16").passages).toEqual([p(3, 16)]);
  });

  it("goes on in the same chapter after a comma and starts a new one after a semicolon", () => {
    expect(passages("1 Cor 13:4-7, 13").passages).toEqual([p(13, 4, 13, 7), p(13, 13)]);
    expect(passages("Ps 23; 91:1-4").passages).toEqual([p(23, null), p(91, 1, 91, 4)]);
    expect(passages("Ps 23, 24").passages).toEqual([p(23, null), p(24, null)]);
    expect(passages("Rom 8:28, 9:1").passages).toEqual([p(8, 28), p(9, 1)]);
  });

  it("reads every number in a one-chapter book as a verse", () => {
    for (const text of ["Jude 3", "Jude 1:3"]) expect(passages(text).passages, text).toEqual([p(1, 3)]);
    expect(passages("Jude 1-3").passages).toEqual([p(1, 1, 1, 3)]);
    expect(passages("Jude 24-25").passages).toEqual([p(1, 24, 1, 25)]);
    expect(passages("Obadiah").passages).toEqual([p(1, null)]);
    expect(passages("Jude 3").singleChapter).toBe(true);
  });

  it("sends Psalm 151 to its own book where a version has it, and says so where it does not", () => {
    const reference = passages("Ps 151:1-5", "webc");
    expect(reference.code).toBe("PS2");
    expect(reference.passages).toEqual([p(1, 1, 1, 5)]);
    expect(error("Psalm 151")).toMatch(/Psalm 151 is not in the Berean Standard Bible/);
  });

  it("checks the book and chapter against the version", () => {
    expect(error("Tobit 1:1")).toBe("The Berean Standard Bible does not have Tobit.");
    expect(passages("Tobit 1:1", "kjv").code).toBe("TOB");
    expect(error("John 22:1")).toBe("John has 21 chapters in the Berean Standard Bible, so there is no chapter 22.");
    expect(error("Mal 4:1", "wlc")).toMatch(/Malachi has 3 chapters/);
  });

  it("refuses ranges that run backwards, verse 0 and a missing chapter", () => {
    expect(error("John 3:18-16")).toMatch(/runs backwards/);
    expect(error("John 4-3")).toMatch(/runs backwards/);
    expect(error("John 3:0")).toBe("Chapters and verses start at 1.");
    expect(error("John")).toMatch(/Add a chapter/);
    expect(error("John 3:16,,17")).toMatch(/empty place/);
    expect(error("John 3:x")).toMatch(/Write the chapter and verse like/);
    expect(error("")).toMatch(/Type a reference/);
  });

  it("normalizes names the way people type them", () => {
    expect(normalizeName("I Cor.")).toBe("1 cor");
    expect(normalizeName("1Cor")).toBe("1 cor");
    expect(normalizeName("  Song  of Sol. ")).toBe("song of sol");
  });
});
