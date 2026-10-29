import { describe, expect, it } from "vitest";
import { EMPTY_WINDOW, ROW_BUFFER, gridRows, rowOffsets, rowWindow, trackCount } from "./row-window";

const even = (n: number, h = 100) => Array.from({ length: n }, () => h);

describe("rowOffsets", () => {
  it("adds one gap after each row", () => {
    expect([...rowOffsets([10, 20, 30], 5)]).toEqual([0, 15, 40, 75]);
  });
});

describe("rowWindow", () => {
  it("is empty for an empty list", () => {
    expect(rowWindow([], rowOffsets([], 0), 0, 0, 500)).toEqual(EMPTY_WINDOW);
  });

  it("draws the visible rows plus 50 below at the top of a long list", () => {
    const heights = even(1000), offsets = rowOffsets(heights, 0);
    const w = rowWindow(heights, offsets, 0, 0, 450);
    expect([w.first, w.last, w.start, w.end]).toEqual([0, 4, 0, 4 + ROW_BUFFER]);
    expect(w.before).toBe(0);
    expect(w.after).toBe((1000 - (5 + ROW_BUFFER)) * 100);
  });

  it("keeps 50 rows above and 50 below in the middle, and spacers make up the rest", () => {
    const heights = even(1000), gap = 16, offsets = rowOffsets(heights, gap);
    const top = offsets[400] + 10;
    const w = rowWindow(heights, offsets, gap, top, top + 800);
    expect(w.first).toBe(400);
    expect(w.start).toBe(350);
    expect(w.end).toBe(w.last + 50);
    expect(w.before).toBe(offsets[350]);
    const drawn = offsets[w.end] + heights[w.end] - offsets[w.start];
    expect(w.before + drawn + w.after).toBeCloseTo(offsets[1000] - gap);
  });

  it("clamps at the end of the list", () => {
    const heights = even(120), offsets = rowOffsets(heights, 0);
    const w = rowWindow(heights, offsets, 0, 119 * 100, 119 * 100 + 500);
    expect([w.first, w.last, w.start, w.end, w.after]).toEqual([119, 119, 69, 119, 0]);
  });

  it("handles rows of different heights and a view past the end", () => {
    const heights = [50, 300, 20, 20, 400], offsets = rowOffsets(heights, 0);
    const w = rowWindow(heights, offsets, 0, 60, 200, 1);
    expect([w.first, w.last, w.start, w.end]).toEqual([1, 1, 0, 2]);
    const past = rowWindow(heights, offsets, 0, 5000, 5500, 1);
    expect([past.first, past.last]).toEqual([4, 4]);
  });
});

describe("gridRows", () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);
  it("fills rows of the column count", () => {
    expect(gridRows(ids(7), 3, () => false)).toEqual([["p0", "p1", "p2"], ["p3", "p4", "p5"], ["p6"]]);
    expect(gridRows(ids(3), 1, () => false)).toEqual([["p0"], ["p1"], ["p2"]]);
  });
  it("gives an opened shelf a row of its own, ending the row before it", () => {
    expect(gridRows(ids(7), 3, id => id === "p4")).toEqual([["p0", "p1", "p2"], ["p3"], ["p4"], ["p5", "p6"]]);
    expect(gridRows(ids(4), 3, id => id === "p0")).toEqual([["p0"], ["p1", "p2", "p3"]]);
    expect(gridRows(ids(4), 2, id => id === "p3")).toEqual([["p0", "p1"], ["p2"], ["p3"]]);
  });
  it("treats a nonsense column count as one column", () => {
    expect(gridRows(ids(2), 0, () => false)).toEqual([["p0"], ["p1"]]);
  });
});

describe("trackCount", () => {
  it("counts resolved tracks and falls back to one", () => {
    expect(trackCount("240px 240px 240.5px")).toBe(3);
    expect(trackCount("repeat(auto-fill, minmax(15rem, 1fr))")).toBe(1);
    expect(trackCount("")).toBe(1);
  });
});
