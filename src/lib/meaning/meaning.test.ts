import { nearest } from "./engine";
import { preferMeaning } from "./store";

/** Unit vector `v` as the pack stores it: one signed byte per number (x 127). */
const int8 = (rows: number[][]) => Int8Array.from(rows.flat().map((x) => Math.round(x * 127)));

describe("meaning search: nearest fingerprints", () => {
  const stored = int8([[1, 0, 0], [0, 1, 0], [0.6, 0.8, 0], [0, 0, 1]]);

  it("ranks the closest stored fingerprints first, with cosine-like scores", () => {
    const hits = nearest(Float32Array.from([0.8, 0.6, 0]), stored, 3, 2);
    expect(hits.map((h) => h.index)).toEqual([2, 0]); // 0.96 then 0.8
    expect(hits[0].score).toBeCloseTo(0.96, 1);
  });

  it("returns at most k results, and all of them when k is larger", () => {
    expect(nearest(Float32Array.from([0, 0, 1]), stored, 3, 1)).toHaveLength(1);
    expect(nearest(Float32Array.from([0, 0, 1]), stored, 3, 10)).toHaveLength(4);
  });
});

describe("meaning search: which search leads", () => {
  it("lets meaning lead for real questions (3+ words)", () => {
    expect(preferMeaning("why do innocent children suffer")).toBe(true);
    expect(preferMeaning("who picked scripture")).toBe(true);
  });
  it("keeps keyword search for short exact terms", () => {
    expect(preferMeaning("Calvin")).toBe(false);
    expect(preferMeaning("free will")).toBe(false);
    expect(preferMeaning("  ")).toBe(false);
  });
});
