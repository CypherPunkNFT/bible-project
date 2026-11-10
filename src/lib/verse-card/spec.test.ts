import { describe, expect, it, vi } from "vitest";
import { BUILT_IN_LOOKS, type Look } from "./looks";
import { cardProblems, cleanLine, closeNoteGaps, isSiteLink, resolveCard, type CardSpec } from "./spec";

const base: CardSpec = { passage: { text: "Words of a verse.", reference: "John 3:16", book: 43 }, link: "https://bibleguide.io/verse-cards/john-3-16", look: "paper" };
const lily: Look = { id: "lily", name: "Lily", background: "#FBF7F2", text: "#2B2A33", accent: "#5E4B6E", ornament: { path: "M10 10 L90 90", viewBox: 100 } };

describe("the card description", () => {
  it("accepts a plain card", () => {
    expect(cardProblems(base)).toEqual([]);
  });

  it("refuses empty or overlong words with a sentence that says what to do", () => {
    expect(cardProblems({ ...base, passage: { text: " ", reference: "" } })).toEqual(["The card has no verse text.", "The card has no reference."]);
    expect(cardProblems({ ...base, passage: { ...base.passage, text: "a".repeat(601) } })[0]).toMatch(/too long for a card .*choose fewer verses/);
    expect(cardProblems({ ...base, passage: { ...base.passage, text: "a".repeat(600) } })).toEqual([]);
    expect(cardProblems({ ...base, heading: "h".repeat(41) })).toEqual(["The heading is longer than 40 characters."]);
    expect(cardProblems({ ...base, lines: ["x".repeat(61)] })).toEqual(["Line 1 is longer than 60 characters."]);
    expect(cardProblems({ ...base, lines: ["a", "b", "c"] })).toEqual(["A card holds at most 2 lines of your own, not 3."]);
  });

  it("counts an emoji as one character and removes control and direction characters", () => {
    expect(cardProblems({ ...base, lines: ["👨‍👩‍👧".repeat(60)] })).toEqual([]);
    const [nul, reversed, zeroWidth] = [0, 0x202e, 0x200b].map((code) => String.fromCharCode(code));
    expect(cleanLine(`  Praying${nul} for${reversed} you,\n Sam${zeroWidth}  `)).toBe("Praying for you, Sam");
    expect(resolveCard({ ...base, heading: "\u0007Happy birthday", lines: ["  ", "Dear Anna\u0008"] }).lines).toEqual(["Dear Anna"]);
  });

  it("refuses a link that is not on the site, including look-alike addresses", () => {
    expect(isSiteLink("https://bibleguide.io")).toBe(true);
    expect(isSiteLink("https://bibleguide.io/birthday-verses/3-14")).toBe(true);
    for (const link of ["https://bibleguide.io.example.com/x", "https://bibleguide.io@evil.example/", "http://bibleguide.io/", "https://evil.example/https://bibleguide.io/",
      "https://bibleguide.io/a b", "https://bibleguide.io/\nx", "javascript:alert(1)", ""]) {
      expect(isSiteLink(link), link).toBe(false);
      expect(cardProblems({ ...base, link })[0]).toMatch(/must be on https:\/\/bibleguide\.io/);
    }
  });

  it("falls back to Paper, with a warning, for an unknown design or the Book colour design without a book", () => {
    const warn = vi.fn();
    expect(resolveCard({ ...base, look: "neon" as CardSpec["look"] }, warn).look).toBe(BUILT_IN_LOOKS.paper);
    expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('no design called "neon"'));
    expect(resolveCard({ ...base, passage: { text: "x", reference: "y" }, look: "book" }, warn).look).toBe(BUILT_IN_LOOKS.paper);
    expect(warn).toHaveBeenLastCalledWith(expect.stringContaining("Book colour design needs a book"));
    expect(resolveCard({ ...base, passage: { ...base.passage, book: 67 }, look: "book" }, warn).look.id).toBe("paper");
    expect(resolveCard({ ...base, look: "book" }, warn).look.background).toBe("#6b38a3");
  });

  it("takes a feature's own design when it passes the contrast check, and refuses one that fails or shadows a built-in id", () => {
    expect(resolveCard({ ...base, look: lily }).look).toBe(lily);
    const faint = { ...lily, accent: "#D8D0E0" };
    expect(cardProblems({ ...base, look: faint })[0]).toMatch(/Lily design's reference and footer colour #D8D0E0 on #FBF7F2 is .*under 4.5:1/);
    expect(cardProblems({ ...base, look: { ...lily, id: "paper" } })).toEqual(['A feature\'s design may not use the built-in id "paper".']);
    expect(() => resolveCard({ ...base, look: faint })).toThrow(/verse card: The Lily design/);
  });

  it("lets a card override or remove its design's ornament", () => {
    expect(resolveCard({ ...base, look: "night" }).ornament).toBe("star");
    expect(resolveCard({ ...base, look: "night", ornament: "none" }).ornament).toBe("none");
    const warn = vi.fn();
    expect(resolveCard({ ...base, look: "night", ornament: "glow" as CardSpec["ornament"] }, warn).ornament).toBe("star");
    expect(warn).toHaveBeenCalled();
  });
});

describe("the Berean's words on a card", () => {
  it("closes the gap a removed footnote mark leaves before punctuation, and leaves a spaced dash alone", () => {
    expect(closeNoteGaps("the month of Sivan ), they recorded")).toBe("the month of Sivan), they recorded");
    expect(closeNoteGaps("from India to Cush —writing to each")).toBe("from India to Cush—writing to each");
    expect(closeNoteGaps("The Gershomites , according to")).toBe("The Gershomites, according to");
    expect(closeNoteGaps("a covenant of salt ?")).toBe("a covenant of salt?");
    expect(closeNoteGaps("and then — after that")).toBe("and then — after that");
  });
});
