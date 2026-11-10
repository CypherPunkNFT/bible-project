import { describe, expect, it } from "vitest";
import { FOOTER, balancedWrap, fitSizes, layoutCard, measureWords, printQuotes, smallCapPieces, type CardLayout } from "./layout";
import { LOOK_IDS } from "./looks";
import { SIZES, SIZE_IDS } from "./sizes";
import type { CardSpec } from "./spec";
import { bereanVerse, fixedMeasure } from "./test-kit";

const link = "https://bibleguide.io/verse-cards/x";
const card = (text: string, reference: string, extra: Partial<CardSpec> = {}): CardSpec => ({ passage: { text, reference, book: 43 }, link, look: "paper", ...extra });
const words = (layout: CardLayout, role: string) => layout.lines.filter((line) => line.role === role).map((line) => line.runs.map((run) => run.text).join(" ")).join(" ");
const px = (font: string) => Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1]);
const john316 = bereanVerse("JHN", 3, 16)!;
const esther89 = bereanVerse("EST", 8, 9)!;

describe("laying out a card", () => {
  it("reads its verses from the Berean files", () => {
    expect(john316.length).toBeGreaterThan(100);
    expect(esther89.length).toBeGreaterThan(370);
  });

  it("fits John 3:16 at every size at a large letter size", () => {
    for (const size of SIZE_IDS) {
      const layout = layoutCard(card(john316, "John 3:16"), size, fixedMeasure);
      expect(layout.fits, size).toBe(true);
      expect(layout.verseSize, size).toBeGreaterThanOrEqual(SIZES[size].start - 12);
    }
  });

  it("fits Esther 8:9, the longest verse, smaller but readable in square, portrait and story", () => {
    for (const size of ["square", "portrait", "story"] as const) {
      const layout = layoutCard(card(esther89, "Esther 8:9"), size, fixedMeasure);
      expect(layout.fits, size).toBe(true);
      expect(layout.verseSize).toBeGreaterThanOrEqual(SIZES[size].min);
      expect(layout.verseSize).toBeLessThan(SIZES[size].start);
    }
  });

  it("reports a 600-character passage as too long for the wide card rather than cutting it or going under 36 px", () => {
    const long = `${esther89} ${esther89}`.slice(0, 600);
    const wide = layoutCard(card(long, "Esther 8:9–10"), "wide", fixedMeasure);
    expect(wide.fits).toBe(false);
    expect(wide.verseSize).toBe(36);
    expect(words(wide, "verse")).toBe("");
    const fit = fitSizes(card(long, "Esther 8:9–10"), fixedMeasure);
    expect(fit.fits.find((entry) => entry.id === "wide")?.fits).toBe(false);
    expect(["portrait", "story", "square"]).toContain(fit.best);
    for (const size of ["square", "portrait", "story"] as const) expect(layoutCard(card(long, "x"), size, fixedMeasure).fits, size).toBe(true);
  });

  it("keeps every line inside the safe area and draws the footer, at every size and in every design", () => {
    for (const size of SIZE_IDS) {
      for (const look of LOOK_IDS) {
        const layout = layoutCard(card(esther89.slice(0, 300), "Esther 8:9", { heading: "Happy birthday", lines: ["Praying for you, Sam"], look }), size, fixedMeasure);
        const { safe } = SIZES[size];
        for (const line of layout.lines) {
          expect(line.width, `${size} ${look} ${line.role}`).toBeLessThanOrEqual(safe.w + 0.01);
          expect(line.runs[0].x).toBeGreaterThanOrEqual(safe.x - 0.01);
          expect(line.y).toBeLessThanOrEqual(safe.y + safe.h);
          expect(line.y).toBeGreaterThan(safe.y);
        }
        expect(words(layout, "footer")).toBe(FOOTER);
        expect(layout.lines[layout.lines.length - 1].role).toBe("footer");
      }
    }
  });

  it("orders heading, verse, reference, the visitor's line, then the footer, top to bottom", () => {
    const layout = layoutCard(card(john316, "John 3:16", { heading: "Happy birthday", lines: ["Dear Anna"], look: "night" }), "story", fixedMeasure);
    const roles = layout.lines.map((line) => line.role).filter((role, index, all) => role !== all[index - 1]);
    expect(roles).toEqual(["heading", "verse", "reference", "line", "footer"]);
    const ys = layout.lines.map((line) => line.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    expect(layout.ornament?.kind).toBe("drawing");
  });

  it("draws LORD and GOD in made-up small capitals, measured", () => {
    expect(smallCapPieces("LORD’s,").map((piece) => [piece.text, piece.small])).toEqual([["L", false], ["ORD", true], ["’s,", false]]);
    expect(smallCapPieces("GOD.").map((piece) => piece.text)).toEqual(["G", "OD", "."]);
    expect(smallCapPieces("LORDS")).toEqual([{ text: "LORDS", small: false }]);
    expect(smallCapPieces("Lord")).toEqual([{ text: "Lord", small: false }]);
    const layout = layoutCard(card("The LORD is my strength.", "Exodus 15:2"), "square", fixedMeasure);
    const runs = layout.lines.filter((line) => line.role === "verse").flatMap((line) => line.runs);
    const big = runs.find((run) => run.text === "L")!;
    const small = runs.find((run) => run.text === "ORD")!;
    expect(px(small.font)).toBeCloseTo(px(big.font) * 0.78, 1);
    expect(small.x).toBeCloseTo(big.x + fixedMeasure("L", big.font), 5);
  });

  it("prints curly quotes and keeps the verse's own punctuation", () => {
    expect(printQuotes(`He said, "Come." It's 'here'.`)).toBe("He said, “Come.” It’s ‘here’.");
    expect(printQuotes("“Already curly.”")).toBe("“Already curly.”");
  });

  it("avoids a lone last word where moving one up fixes it", () => {
    const measured = measureWords("one two three four five six seven", () => "400 10px serif", fixedMeasure, false);
    const lines = balancedWrap(measured, 5, 130)!;
    expect(lines.length).toBe(2);
    expect(lines[lines.length - 1].length).toBeGreaterThan(1);
  });

  it("refuses to lay out a card with problems, naming them", () => {
    expect(() => layoutCard(card("", "John 3:16"), "square", fixedMeasure)).toThrow(/no verse text/);
  });

  it("does not break on emoji or another script in the visitor's line", () => {
    const layout = layoutCard(card(john316, "John 3:16", { lines: ["🙏 Für dich, 安娜 ❤️"] }), "portrait", fixedMeasure);
    expect(layout.fits).toBe(true);
    expect(words(layout, "line")).toContain("安娜");
  });
});
