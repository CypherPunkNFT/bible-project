import { describe, expect, it } from "vitest";
import { canvasMeasure } from "./draw";
import { layoutSlide, LINE_HEIGHT, type LayoutSettings } from "./layout";
import type { Slide } from "./slides";
import { byId, FONTS } from "./templates";

// Without a canvas every letter is half the font's size wide: enough to check the sums.
const measure = canvasMeasure(null);
const settings: LayoutSettings = { layout: "centre", font: byId(FONTS, "serif"), width: 1920, height: 1080, size: 78, numbers: true, footer: true };
const verses = (text: string, mark: string | null = "16"): Slide => ({ kind: "verses", reference: "John 3:16", pieces: [{ mark, text, chapter: 3, verse: 16, part: 0 }] });
const JOHN = "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.";

describe("laying out a slide", () => {
  it("wraps every line inside the text box and centres it", () => {
    const layout = layoutSlide(verses(JOHN), settings, measure);
    expect(layout.lines.length).toBeGreaterThan(1);
    for (const line of layout.lines) {
      expect(line.width).toBeLessThanOrEqual(layout.box.w + 0.01);
      const left = line.words[0].x;
      expect(left - layout.box.x).toBeCloseTo(layout.box.x + layout.box.w - (left + line.width), 5);
    }
    expect(layout.lines.map((line) => line.words.filter((word) => !word.mark).map((word) => word.text).join(" ")).join(" ")).toBe(JOHN);
  });

  it("shrinks long text to fit the box's height, and keeps it whole", () => {
    const long = `${JOHN} ${JOHN} ${JOHN}`;
    const layout = layoutSlide(verses(long), settings, measure);
    expect(layout.size).toBeLessThan(78);
    expect(layout.lines.length * layout.size * LINE_HEIGHT).toBeLessThanOrEqual(layout.box.h + 0.01);
  });

  it("never leaves a verse number at the end of a line", () => {
    const slide: Slide = { kind: "verses", reference: "Psalm 23:1–6", pieces: Array.from({ length: 6 }, (_, i) => ({ mark: String(i + 1), text: "The LORD is my shepherd; I shall not want.", chapter: 23, verse: i + 1, part: 0 })) };
    const layout = layoutSlide(slide, { ...settings, size: 52 }, measure);
    for (const line of layout.lines) expect(line.words[line.words.length - 1].mark).toBe(false);
    expect(layout.lines.flatMap((line) => line.words).filter((word) => word.mark).map((word) => word.text)).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("leaves verse numbers out when they are switched off, and the reference when it is", () => {
    const layout = layoutSlide(verses(JOHN), { ...settings, numbers: false, footer: false }, measure);
    expect(layout.lines.flatMap((line) => line.words).some((word) => word.mark)).toBe(false);
    expect(layout.note).toBeNull();
  });

  it("puts the lower third's words inside its band, and the left layout's against the margin", () => {
    const lower = layoutSlide(verses(JOHN), { ...settings, layout: "lower-third" }, measure);
    expect(lower.band).not.toBeNull();
    expect(lower.box.y).toBeGreaterThanOrEqual(lower.band!.y);
    expect(lower.box.y + lower.box.h).toBeLessThanOrEqual(lower.band!.y + lower.band!.h);
    expect(lower.note!.y).toBeLessThanOrEqual(lower.band!.y + lower.band!.h);
    const left = layoutSlide(verses(JOHN), { ...settings, layout: "left" }, measure);
    expect(left.align).toBe("left");
    expect(left.lines.every((line) => line.words[0].x === left.box.x)).toBe(true);
    expect(left.rule).not.toBeNull();
  });

  it("sets a title larger, with the Bible's name beneath it", () => {
    const layout = layoutSlide({ kind: "title", heading: "Psalm 23", subtitle: "Berean Standard Bible" }, settings, measure);
    expect(layout.size).toBeCloseTo(78 * 1.25, 5);
    expect(layout.note?.text).toBe("Berean Standard Bible");
    expect(layout.note!.y).toBeGreaterThan(layout.lines[0].y);
  });

  it("fits a 4:3 slide too", () => {
    const layout = layoutSlide(verses(JOHN), { ...settings, width: 1440 }, measure);
    expect(layout.box.x + layout.box.w).toBeLessThanOrEqual(1440);
    for (const line of layout.lines) expect(line.width).toBeLessThanOrEqual(layout.box.w + 0.01);
  });
});
