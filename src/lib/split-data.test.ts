import { describe, expect, it } from "vitest";
import { assembleRows, expandRow, isSplitPart, mergeDeep, parseSplitManifest, shardOf, SPLIT_LAYOUT } from "./split-data";

const manifest = (over: Record<string, unknown> = {}) => ({
  layout: SPLIT_LAYOUT, dataset: "scholars", builtAt: "x", rows: 3, head: "head.0123456789ab.json", first: 1,
  layers: { list: { files: [{ file: "list-0.0123456789ab.json", rows: 2 }, { file: "list-1.0123456789ab.json", rows: 1 }] } },
  extra: null, details: { shards: 2, files: ["details-0.0123456789ab.json", "details-1.0123456789ab.json"] }, ...over,
});

describe("split data manifest", () => {
  it("reads a sound manifest", () => {
    const m = parseSplitManifest(manifest(), "scholars");
    expect(m.layers.list.files).toHaveLength(2);
    expect(m.details?.shards).toBe(2);
  });
  it.each([
    ["a part name with a folder", { head: "../head.0123456789ab.json" }],
    ["a part name without its hash", { head: "head.json" }],
    ["another data set's manifest", { dataset: "people" }],
    ["a layer that does not cover every row", { rows: 4 }],
    ["first beyond the list files", { first: 3 }],
    ["details whose files do not match the shards", { details: { shards: 3, files: ["details-0.0123456789ab.json"] } }],
    ["an unknown layout", { layout: 2 }],
  ])("refuses %s", (_, over) => {
    expect(() => parseSplitManifest(manifest(over), "scholars")).toThrow(/manifest\.json/);
  });
  it("tells split parts from other data paths", () => {
    expect(isSplitPart("split/scholars/list-0.0123456789ab.json")).toBe(true);
    expect(isSplitPart("split/scholars/manifest.json")).toBe(false);
    expect(isSplitPart("study/people.json")).toBe(false);
    expect(isSplitPart("split/scholars/../x.0123456789ab.json")).toBe(false);
  });
});

describe("split data rows", () => {
  it("shards an id the same way every time, non-ASCII ids by their UTF-8 bytes", () => {
    expect(shardOf("fausset", 64)).toBe(shardOf("fausset", 64));
    // FNV-1a 32 over the UTF-8 bytes of "é" (0xc3 0xa9), worked out apart from this code with Node's Buffer: 0x1e9de8c1.
    expect(shardOf("é", 1 << 30)).toBe(0x1e9de8c1 % (1 << 30));
  });
  it("puts short keys back and merges later layers in", () => {
    // Every key is written short, a field's name too.
    const keys = ["id", "fields", "count", "example", "title", "theology"];
    const list = expandRow({ 0: "a", 1: { 5: { 2: 3 } } }, keys);
    const titles = expandRow({ 1: { 5: { 3: { 4: "Bible" } } } }, keys);
    expect(mergeDeep(list, titles)).toEqual({ id: "a", fields: { theology: { count: 3, example: { title: "Bible" } } } });
    expect(() => expandRow({ z: 1 }, keys)).toThrow(/short key/);
  });
  it("returns rows to their original order", () => {
    const head = { keys: ["id"], order: [2, 0, 1], data: {} };
    expect(assembleRows([[{ 0: "c" }, { 0: "a" }], [{ 0: "b" }]], head, 3)).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    expect(() => assembleRows([[{ 0: "c" }]], head, 3)).toThrow(/1 rows read, 3 expected/);
  });
});
