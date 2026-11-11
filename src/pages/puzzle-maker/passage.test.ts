// The puzzle maker's passage words, on the real Berean Standard Bible files (design §2.1, §9, §10).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { clueProblem } from "@/pages/games/crossword/themes";
import type { PlainBook } from "@/lib/types";
import { MAX_VERSES, passageWords, searchWords, selectVerses, verseClue } from "./passage";

const book = (code: string) => JSON.parse(readFileSync(`data/plain/bsb/${code}.json`, "utf8")) as PlainBook;
const whole = (chapter: number, endChapter = chapter) => ({ chapter, verse: null, endChapter, endVerse: null });

describe("passage verses", () => {
  it("takes a chapter, a verse range and overlapping passages once each, in order", () => {
    expect(selectVerses(book("PSA"), [whole(23)])).toHaveLength(6);
    const john = selectVerses(book("JHN"), [{ chapter: 3, verse: 16, endChapter: 3, endVerse: 18 }, { chapter: 3, verse: 17, endChapter: 3, endVerse: 17 }]);
    expect(john.map((v) => v.verse)).toEqual([16, 17, 18]);
    expect(john[0].text).toMatch(/^For God so loved the world/);
  });

  it("finds no verses past a chapter's end, and counts a long passage so it can be refused", () => {
    expect(selectVerses(book("JHN"), [{ chapter: 3, verse: 99, endChapter: 3, endVerse: 99 }])).toEqual([]);
    expect(selectVerses(book("PSA"), [whole(1, 150)]).length).toBeGreaterThan(MAX_VERSES);
  });
});

describe("passage words", () => {
  const psalm23 = selectVerses(book("PSA"), [whole(23)]);

  it("ranks the passage's own words, without the common ones", () => {
    const words = passageWords(psalm23, 13).map((w) => w.grid);
    for (const word of ["SHEPHERD", "PASTURES", "WATERS", "LORD", "GOODNESS"]) expect(words).toContain(word);
    for (const word of ["THE", "AND", "SHALL", "YOUR", "WILL", "NOT"]) expect(words).not.toContain(word);
    expect(words.every((w) => /^[A-Z]{3,13}$/.test(w))).toBe(true);
    expect(passageWords(psalm23, 13)).toEqual(passageWords(psalm23, 13));
  });

  it("merges a word with its possessive, keeps hyphenated names whole, and never offers a sensitive word", () => {
    const verses = [{ chapter: 1, verse: 1, text: "God’s people went to Beth-shemesh, and God was with them." },
      { chapter: 1, verse: 2, text: "The prostitute and the people of Beth-shemesh." }];
    const words = passageWords(verses, 15);
    expect(words.find((w) => w.grid === "GOD")).toMatchObject({ written: "God", count: 2 });
    expect(words.find((w) => w.grid === "BETHSHEMESH")).toMatchObject({ written: "Beth-shemesh", count: 2, verses: [0, 1] });
    expect(words.map((w) => w.grid)).not.toContain("PROSTITUTE");
  });

  it("leaves out a word hidden inside another for a word search", () => {
    const words = [{ grid: "SHEPHERD", written: "shepherd", count: 3, verses: [0] }, { grid: "HERD", written: "herd", count: 2, verses: [0] },
      { grid: "LAMB", written: "lamb", count: 1, verses: [0] }];
    expect(searchWords(words, 3).map((w) => w.grid)).toEqual(["SHEPHERD", "LAMB"]);
  });
});

describe("verse clues", () => {
  const verse = { chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." };

  it("blanks every use of the word and adds the reference", () => {
    expect(verseClue(verse, "SHEPHERD", "Psalm 23:1")).toBe("The LORD is my ____; I shall not want. (Psalm 23:1)");
    expect(verseClue({ chapter: 1, verse: 1, text: "God’s love; God is love." }, "GOD", null)).toBe("____’s love; ____ is love.");
  });

  it("refuses a clue that still gives the answer away, the reference included", () => {
    expect(verseClue({ chapter: 1, verse: 4, text: "One was named Orpah and the other Ruth." }, "RUTH", "Ruth 1:4")).toBeNull();
    expect(verseClue({ chapter: 1, verse: 1, text: "The shepherd and his shepherds." }, "SHEPHERD", null)).toBeNull();
    expect(verseClue(verse, "MOSES", null)).toBeNull();
  });

  it("cuts a long verse around its blank to a clue of at most 160 characters", () => {
    const [long] = selectVerses(book("EST"), [{ chapter: 8, verse: 9, endChapter: 8, endVerse: 9 }]);
    const clue = verseClue(long, "MORDECAI", "Esther 8:9")!;
    expect(clue.length).toBeLessThanOrEqual(160);
    expect(clue).toContain("____");
    expect(clue).toMatch(/…/);
    expect(clueProblem("MORDECAI", clue)).toBeNull();
  });
});
