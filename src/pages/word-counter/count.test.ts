import { existsSync, readFileSync } from "node:fs";
import { buildMatcher, countBible, countIn, markMatches, MAX_QUERY, searchWords, type BookText, type CountOptions } from "./count";

const WHOLE: CountOptions = { wordStarts: false, matchCase: false };
const STARTS: CountOptions = { wordStarts: true, matchCase: false };
const CASE: CountOptions = { wordStarts: false, matchCase: true };
const count = (query: string, text: string, options = WHOLE) => countIn(text, buildMatcher(query, options)!);
const book = (code: string): BookText => ({ code, plain: JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as Record<string, string> });

describe("reading a search", () => {
  it("finds nothing to look for in an empty or wordless search", () => {
    for (const query of ["", "   ", "!!!", "“”", "-- ,"]) expect(buildMatcher(query, WHOLE)).toBeNull();
  });

  it("splits a phrase into its words, keeping apostrophes inside a word", () => {
    expect(searchWords("  fear   not ")).toEqual(["fear", "not"]);
    expect(searchWords("“Truly, truly”")).toEqual(["Truly", "truly"]);
    expect(searchWords("the Lord's")).toEqual(["the", "Lord's"]);
    expect(searchWords("well-pleased")).toEqual(["well", "pleased"]);
  });

  it("reads at most MAX_QUERY characters", () => {
    expect(searchWords("a".repeat(MAX_QUERY + 40)).join("")).toHaveLength(MAX_QUERY);
  });

  it("treats regular-expression signs as plain text", () => {
    expect(() => buildMatcher("a+b(c)[d]*?{2}\\", WHOLE)).not.toThrow();
    expect(count("c++", "learn c++ now")).toBe(1);
    expect(count("c++", "learn c and more")).toBe(0);
  });
});

describe("counting in a verse", () => {
  it("counts whole words only by default, ignoring capitals", () => {
    expect(count("love", "Love is patient, love is kind. My beloved loved the glove.")).toBe(2);
  });

  it("counts words that begin with the search when asked", () => {
    expect(count("love", "Love, loved, lovely, beloved, glove.", STARTS)).toBe(3);
  });

  it("tells LORD from Lord when capitals must match", () => {
    const text = "The LORD said to my Lord, “Sit at My right hand”; the lord of the house.";
    expect(count("LORD", text)).toBe(3);
    expect(count("LORD", text, CASE)).toBe(1);
    expect(count("Lord", text, CASE)).toBe(1);
  });

  it("matches the Bible's curly apostrophe from a straight one, and counts a word before an apostrophe", () => {
    expect(count("Lord's", "the Lord’s Supper")).toBe(1);
    expect(count("God", "God’s grace and God")).toBe(2);
    expect(count("God", "the gods’ altars")).toBe(0);
    expect(count("brothers", "his brothers’ sheep")).toBe(1);
  });

  it("does not count part of a contraction, or a possessive “s”, as a word", () => {
    expect(count("don", "Don’t be afraid; don’t you see?")).toBe(0);
    expect(count("s", "God’s word and the Lord’s")).toBe(0);
    expect(count("t", "don’t")).toBe(0);
    expect(count("don", "Don’t and don", STARTS)).toBe(2);
  });

  it("finds a phrase across spaces, commas, dashes and quotation marks, but not across a full stop", () => {
    expect(count("fear not", "And he said, “Fear not, for I am with you.”")).toBe(1);
    expect(count("truly truly", "Truly, truly, I tell you")).toBe(1);
    expect(count("well pleased", "in whom I am well-pleased")).toBe(1);
    expect(count("the end the", "This is the end. The next")).toBe(0);
  });

  it("marks every match, keeping the verse's own words", () => {
    const text = "Love is patient, love is kind.";
    const parts = markMatches(text, buildMatcher("love", WHOLE)!);
    expect(parts.map((part) => part.text).join("")).toBe(text);
    expect(parts.filter((part) => part.hit).map((part) => part.text)).toEqual(["Love", "love"]);
  });
});

// The Bible files are built, not kept in git (data/ is ignored): on a fresh copy these wait for the build.
describe.skipIf(!existsSync("data/plain/bsb/JHN.json"))("counting in the Berean Standard Bible", () => {
  it("finds “Jesus wept” once, in John 11:35", () => {
    const result = countBible([book("JHN")], buildMatcher("Jesus wept", WHOLE)!);
    expect(result.total).toBe(1);
    expect(result.verses.map(({ code, chapter, verse }) => [code, chapter, verse])).toEqual([["JHN", 11, 35]]);
  });

  it("finds no “God” in Esther", () => {
    expect(countBible([book("EST")], buildMatcher("God", WHOLE)!).total).toBe(0);
  });

  it("adds up: books to the whole, verses in Bible order, a verse with it twice counted twice", () => {
    const books = [book("GEN"), book("RUT"), book("1JN")];
    const result = countBible(books, buildMatcher("love", WHOLE)!);
    expect(result.total).toBe([...result.byBook.values()].reduce((a, b) => a + b, 0));
    expect(result.total).toBe(result.verses.reduce((n, verse) => n + verse.count, 0));
    expect(result.verses.length).toBe([...result.versesByBook.values()].reduce((a, b) => a + b, 0));
    expect(result.verses.some((verse) => verse.count > 1)).toBe(true);
    const order = result.verses.map((verse) => ["GEN", "RUT", "1JN"].indexOf(verse.code) * 1e6 + verse.chapter * 1e3 + verse.verse);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (const verse of result.verses) expect(count("love", verse.text)).toBe(verse.count);
  });
});
