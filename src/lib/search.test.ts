import { highlightParts, makeMatcher, searchBooks } from "./search";

const books: { code: string; plain: Record<string, string> }[] = [
  { code: "DAN", plain: { "2:34": "Thou sawest till that a stone was cut out without hands", "2:35": "the stone that smote the image" } },
  { code: "MAT", plain: { "21:42": "The stone which the builders rejected", "21:43": "Stones and stoneware" } },
];

describe("search", () => {
  it("finds a phrase case-insensitively across books in order", () => {
    const hits = searchBooks(books, makeMatcher("THE STONE", false)!);
    expect(hits.map((h) => `${h.code} ${h.chapter}:${h.verse}`)).toEqual(["DAN 2:35", "MAT 21:42"]);
  });

  it("whole-word mode skips longer words", () => {
    const hits = searchBooks(books, makeMatcher("stone", true)!);
    expect(hits.map((h) => h.verse)).toEqual(["34", "35", "42"]);
  });

  it("refuses queries shorter than two characters", () => {
    expect(makeMatcher(" a ", false)).toBeNull();
  });

  it("treats regex characters literally", () => {
    expect(makeMatcher("a.b", false)!.test("axb")).toBe(false);
  });

  it("splits text for highlighting without losing any characters", () => {
    const text = "The stone which the builders rejected, the stone";
    const parts = highlightParts(text, makeMatcher("stone", true)!);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.match)).toHaveLength(2);
  });
});
