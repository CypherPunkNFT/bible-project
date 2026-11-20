// The arc chart's source cut from a whole xref-arcs.json in memory (the fallback where the split is missing) must give
// what the split gives: each book's chapters, its references, its references with each later book, and its own arcs.
import { describe, expect, it, vi } from "vitest";

vi.mock("./data", () => ({ loadArcs: vi.fn(), loadSplitManifest: vi.fn(), loadSplitPart: vi.fn() }));
const { arcSourceOf } = await import("./arc-source");

describe("arcSourceOf", () => {
  const data = { chapters: ["GEN 1", "GEN 2", "EXO 1", "LEV 1"], arcs: [[0, 1, 5], [0, 2, 3], [1, 3, 1], [2, 3, 7]] as [number, number, number][] };
  const source = arcSourceOf(data);

  it("keeps the chapters and the totals the pre-drawn picture is matched by", () => {
    expect(source.chapters).toEqual(data.chapters);
    expect(source.arcs).toBe(4);
    expect(source.references).toBe(16);
  });

  it("counts every arc touching a book once, and links each book to the later books it shares references with", () => {
    expect(source.books).toEqual([
      { code: "GEN", chapters: ["GEN 1", "GEN 2"], count: 9, links: { EXO: 3, LEV: 1 } },
      { code: "EXO", chapters: ["EXO 1"], count: 10, links: { LEV: 7 } },
      { code: "LEV", chapters: ["LEV 1"], count: 8, links: {} },
    ]);
  });

  it("gives a book's own arcs weakest first, and none for an unknown book", async () => {
    expect(await source.bookArcs("GEN")).toEqual([[1, 3, 1], [0, 2, 3], [0, 1, 5]]);
    expect(await source.bookArcs("REV")).toEqual([]);
  });
});
