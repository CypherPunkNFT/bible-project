import { describe, expect, it } from "vitest";
import { markByForm, markExact, queryWords, versesWithWords } from "./search-words";

describe("queryWords", () => {
  it("keeps the words that count and lists the common ones it skips", () => {
    expect(queryWords("grief and sorrow over the cross")).toEqual({ words: ["grief", "sorrow", "cross"], skipped: ["and", "over", "the"] });
  });
  it("drops punctuation and repeated word forms", () => {
    expect(queryWords("Why forgive? Forgiveness, forgive!").words).toEqual(["forgive"]);
  });
});

describe("marking", () => {
  it("marks word forms by their search word", () => {
    expect(markByForm("Christ's Cross", ["grief", "cross"]).filter((p) => p.word !== null)).toEqual([{ text: "Cross", word: 1 }]);
  });
  it("marks exact words, each with its own index", () => {
    expect(markExact("much grief; increaseth sorrow.", ["grief", "sorrow"], true).filter((p) => p.word !== null)).toEqual([{ text: "grief", word: 0 }, { text: "sorrow", word: 1 }]);
  });
});

describe("versesWithWords", () => {
  const books = [{ code: "ECC", plain: { "1:18": "much grief and sorrow", "2:1": "only grief" } }];
  it("keeps only the verses with the most of the words", () => {
    const { hits, most } = versesWithWords(books, ["grief", "sorrow", "cross"], true);
    expect(most).toBe(2);
    expect(hits.map((h) => `${h.chapter}:${h.verse}`)).toEqual(["1:18"]);
  });
});
