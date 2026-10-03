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

  it("Chinese: one character is enough, whole-word mode is ignored, and the space before 神 is skipped", () => {
    const verse = "「 神爱世人，甚至将他的独生子赐给他们";
    expect(makeMatcher("神爱", true)!.test(verse)).toBe(true);
    expect(makeMatcher("神", true)!.test("我的 神")).toBe(true);
    expect(makeMatcher("的神", true)!.test("我的 神")).toBe(true);
  });

  it("Arabic: vowel marks are ignored and any alif matches", () => {
    const verse = "لِأَنَّهُ هَكَذَا أَحَبَّ ٱللهُ ٱلْعَالَمَ";
    expect(makeMatcher("الله", true)!.test(verse)).toBe(true);
    expect(makeMatcher("احب الله", true)!.test(verse)).toBe(true);
    const parts = highlightParts(verse, makeMatcher("الله", true)!);
    expect(parts.find((p) => p.match)?.text).toBe("ٱللهُ");
  });

  it("Persian: the zero-width non-joiner, a space or nothing between word parts all match, and both yehs match", () => {
    const verse = "تا هر‌که بر او ایمان آورد هلاک نگردد"; // "هر‌که" has a zero-width non-joiner, as in the OPV
    expect(makeMatcher("هرکه", true)!.test(verse)).toBe(true);
    expect(makeMatcher("هر که", true)!.test(verse)).toBe(true);
    expect(makeMatcher("ايمان", true)!.test(verse)).toBe(true); // typed with the Arabic yeh
    expect(makeMatcher("هر", true)!.test(verse)).toBe(false); // whole words: the non-joiner is inside the word
  });

  it("Arabic: alef maksura is not merged with yeh", () => {
    expect(makeMatcher("علي", true)!.test("عَلَى ٱلْأَرْضِ")).toBe(false);
  });

  it("Japanese: one kana is enough, whole-word mode is ignored, the long-vowel mark counts", () => {
    const verse = "神は世をこれほどまでに愛し、そのひとり子をお与えになりました。";
    expect(makeMatcher("ひとり子", true)!.test(verse)).toBe(true);
    expect(makeMatcher("を", true)!.test(verse)).toBe(true);
    expect(makeMatcher("ー", false)).not.toBeNull();
  });

  it("Hindi: a zero-width joiner inside a word is optional", () => {
    const verse = "परमेश्‍वर ने जगत से ऐसा प्रेम रखा"; // the source writes परमेश्‍वर with a zero-width joiner
    expect(makeMatcher("परमेश्वर", true)!.test(verse)).toBe(true);
    expect(makeMatcher("परमेश्‍वर ने", true)!.test(verse)).toBe(true);
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
