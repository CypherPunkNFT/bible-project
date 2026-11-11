import { describe, expect, it } from "vitest";
import type { Verse } from "./load";
import { cutVerse, makeSlides, passageTitle, spanReference, type Slide } from "./slides";

const verse = (chapter: number, n: number, text: string, part = 0): Verse => ({ chapter, verse: n, text, part });
const PSALM = { bookName: "Psalms", wholeChapters: [true], singleChapterBook: false };
const words = (slide: Slide) => (slide.kind === "verses" ? slide.pieces.map((piece) => piece.text).join(" ") : slide.heading);

describe("references", () => {
  it("names one verse, a run and a run across chapters", () => {
    expect(spanReference("John", verse(3, 16, ""), verse(3, 16, ""), false)).toBe("John 3:16");
    expect(spanReference("John", verse(3, 16, ""), verse(3, 18, ""), false)).toBe("John 3:16–18");
    expect(spanReference("Genesis", verse(1, 31, ""), verse(2, 2, ""), false)).toBe("Genesis 1:31–2:2");
    expect(spanReference("Psalms", verse(23, 1, ""), verse(23, 3, ""), false)).toBe("Psalm 23:1–3");
    expect(spanReference("Jude", verse(1, 3, ""), verse(1, 5, ""), true)).toBe("Jude 3–5");
  });

  it("titles whole chapters, verse runs and several passages", () => {
    expect(passageTitle("Psalms", [verse(23, 1, ""), verse(23, 6, "")], [true], false)).toBe("Psalm 23");
    expect(passageTitle("Psalms", [verse(1, 1, ""), verse(2, 12, "")], [true], false)).toBe("Psalms 1–2");
    expect(passageTitle("Psalms", [verse(23, 1, ""), verse(91, 1, "", 1), verse(91, 4, "", 1)], [true, false], false)).toBe("Psalms 23; 91:1–4");
    expect(passageTitle("John", [verse(3, 16, ""), verse(3, 18, "")], [false], false)).toBe("John 3:16–18");
    expect(passageTitle("Jude", [verse(1, 1, ""), verse(1, 25, "")], [true], true)).toBe("Jude");
  });
});

describe("cutting a long verse", () => {
  it("keeps a short verse whole", () => {
    expect(cutVerse("Jesus wept.", 100)).toEqual(["Jesus wept."]);
  });

  it("cuts at sentence ends first, then clauses, then words, never over budget", () => {
    expect(cutVerse("One two three. Four five six. Seven eight.", 30)).toEqual(["One two three. Four five six.", "Seven eight."]);
    expect(cutVerse("One two three, four five six, seven eight nine", 30)).toEqual(["One two three, four five six,", "seven eight nine"]);
    const parts = cutVerse("a ".repeat(60).trim(), 25);
    expect(parts.every((part) => part.length <= 25)).toBe(true);
    expect(parts.join(" ")).toBe("a ".repeat(60).trim());
  });

  it("keeps closing quotation marks with their sentence", () => {
    expect(cutVerse("He said, “Come and see.” They went with Him and stayed.", 30)).toEqual(["He said, “Come and see.”", "They went with Him and stayed."]);
  });
});

describe("sharing verses between slides", () => {
  const verses = [verse(23, 1, "The LORD is my shepherd; I shall not want."), verse(23, 2, "He makes me lie down in green pastures;"), verse(23, 3, "He restores my soul.")];

  it("gives each verse its own slide, after a title slide", () => {
    const slides = makeSlides(verses, PSALM, { per: "verse", budget: 150, title: true });
    expect(slides.map((slide) => (slide.kind === "title" ? slide.heading : slide.reference))).toEqual(["Psalm 23", "Psalm 23:1", "Psalm 23:2", "Psalm 23:3"]);
    expect(slides[0]).toMatchObject({ kind: "title", subtitle: "Berean Standard Bible" });
  });

  it("fills a slide up to the budget, and leaves the title out when asked", () => {
    const slides = makeSlides(verses, PSALM, { per: "fill", budget: 90, title: false });
    expect(slides.map((slide) => slide.kind === "verses" && slide.reference)).toEqual(["Psalm 23:1–2", "Psalm 23:3"]);
    expect(words(slides[0])).toBe("The LORD is my shepherd; I shall not want. He makes me lie down in green pastures;");
  });

  it("never puts two passages of the reference on one slide", () => {
    const two = [verse(23, 6, "Surely goodness and mercy will follow me."), verse(91, 1, "He who dwells in the shelter of the Most High", 1)];
    const slides = makeSlides(two, { ...PSALM, wholeChapters: [false, false] }, { per: "fill", budget: 500, title: false });
    expect(slides.map((slide) => slide.kind === "verses" && slide.reference)).toEqual(["Psalm 23:6", "Psalm 91:1"]);
  });

  it("puts each part of a cut verse on its own slide, the number only on the first", () => {
    const long = verse(1, 1, `${"word ".repeat(40).trim()}. ${"more ".repeat(40).trim()}.`);
    const slides = makeSlides([long], { bookName: "Esther", wholeChapters: [false], singleChapterBook: false }, { per: "verse", budget: 150, title: false });
    expect(slides).toHaveLength(2);
    const marks = slides.map((slide) => slide.kind === "verses" && slide.pieces[0].mark);
    expect(marks).toEqual(["1", null]);
    expect(slides.map((slide) => slide.kind === "verses" && slide.reference)).toEqual(["Esther 1:1", "Esther 1:1"]);
  });

  it("marks a new chapter's first verse with its chapter", () => {
    const slides = makeSlides([verse(1, 31, "It was very good."), verse(2, 1, "Thus the heavens were completed.")], { bookName: "Genesis", wholeChapters: [false], singleChapterBook: false }, { per: "fill", budget: 200, title: true });
    expect(slides[1]).toMatchObject({ reference: "Genesis 1:31–2:1" });
    expect(slides[1].kind === "verses" && slides[1].pieces.map((piece) => piece.mark)).toEqual(["31", "2:1"]);
    expect(slides[0]).toMatchObject({ heading: "Genesis 1:31–2:1" });
  });

  it("makes nothing from no verses", () => {
    expect(makeSlides([], PSALM, { per: "verse", budget: 150, title: true })).toEqual([]);
  });
});
