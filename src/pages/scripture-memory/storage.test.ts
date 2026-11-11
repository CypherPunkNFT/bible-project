// Scripture memory: the stored list and its files, rebuilt from anything (design §5 and §9): damaged or hostile data,
// days from the future, newer versions, blocked storage, the export's shape and import's merge rules.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/lib/types";
import { newVerse } from "./progress";
import { FILE_KIND, MAX_LIST, STORAGE_KEY, exportName, exportText, mergeVerses, readImport, readStored, readVerses, writeStored } from "./storage";
import { passageAllowed } from "./verse";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const check = (from: unknown, to: unknown) => passageAllowed(catalog, from, to);
const DAY = 20_400;
const JOHN = 43003016;

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("reading entries", () => {
  it("keeps sound entries and drops the rest", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { verses, skipped } = readVerses([
      { from: JOHN, to: JOHN, stage: 2, added: DAY - 3, last: DAY - 1, extra: "dropped" },
      { from: "43003016", to: JOHN, stage: 1, added: DAY, last: 0 },
      { from: JSON.parse("1e400"), to: JOHN, stage: 1 },
      { from: 43003016, to: 43004001, stage: 1 }, // across chapters
      { from: 43003018, to: 43003016, stage: 1 }, // backwards
      { from: 19023001, to: 19023009, stage: 1 }, // nine verses
      { from: 43099001, to: 43099001, stage: 1 }, // no John 99
      { from: 19023001, to: 19023001, stage: 7 },
      { from: 19023001, to: 19023001, stage: 1.5 },
      null, [1, 2], "x",
    ], check, DAY);
    expect(verses).toEqual([{ from: JOHN, to: JOHN, stage: 2, added: DAY - 3, last: DAY - 1 }]);
    expect(skipped).toBe(11);
  });

  it("pulls days from the future back to today, and fills a missing day", () => {
    const { verses } = readVerses([{ from: JOHN, to: JOHN, stage: 2, added: DAY + 40, last: DAY + 40 }, { from: 19023001, to: 19023001, stage: 0 }], check, DAY);
    expect(verses[0]).toMatchObject({ added: DAY, last: DAY });
    expect(verses[1]).toMatchObject({ added: DAY, last: 0 });
  });

  it("keeps one copy of a passage, the one further along", () => {
    const { verses } = readVerses([
      { from: JOHN, to: JOHN, stage: 1, added: DAY, last: DAY },
      { from: JOHN, to: JOHN, stage: 4, added: DAY, last: DAY },
    ], check, DAY);
    expect(verses).toHaveLength(1);
    expect(verses[0].stage).toBe(4);
  });

  it("copies no key from the data into an object", () => {
    const { verses } = readVerses(JSON.parse(`[{"from":${JOHN},"to":${JOHN},"stage":1,"__proto__":{"polluted":true}}]`), check, DAY);
    expect(verses).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.keys(verses[0]).sort()).toEqual(["added", "from", "last", "stage", "to"]);
  });
});

describe("the browser's storage", () => {
  it("saves and reads back the list", () => {
    const verses = [newVerse(JOHN, JOHN, DAY)];
    expect(writeStored(localStorage, verses)).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ v: 1, verses });
    expect(readStored(localStorage, check, DAY)).toEqual({ verses, newer: false });
  });

  it("starts empty on damaged data and works with no storage at all", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readStored(localStorage, check, DAY)).toEqual({ verses: [], newer: false });
    expect(readStored(null, check, DAY)).toEqual({ verses: [], newer: false });
    expect(writeStored(null, [])).toBe(false);
  });

  it("says when the browser refuses to save", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const full = { setItem: () => { throw new Error("QuotaExceededError"); } } as unknown as Storage;
    expect(writeStored(full, [newVerse(JOHN, JOHN, DAY)])).toBe(false);
  });

  it("marks a list from a newer version, so the page never writes over it", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, verses: [newVerse(JOHN, JOHN, DAY)] }));
    const stored = readStored(localStorage, check, DAY);
    expect(stored.newer).toBe(true);
    expect(stored.verses).toHaveLength(1);
  });
});

describe("export and import", () => {
  const date = new Date(2026, 10, 9, 23, 30);

  it("exports ids, steps and days only, named by the local date", () => {
    const text = exportText([{ ...newVerse(JOHN, JOHN, DAY), stage: 3, last: DAY }], date);
    expect(JSON.parse(text)).toEqual({ kind: FILE_KIND, v: 1, exported: "2026-11-09",
      verses: [{ from: JOHN, to: JOHN, stage: 3, added: DAY, last: DAY }] });
    expect(exportName(date)).toBe("bible-guide-memory-verses-2026-11-09.json");
  });

  it("reads its own export back", () => {
    const verses = [{ ...newVerse(JOHN, JOHN, DAY), stage: 3, last: DAY }];
    expect(readImport(exportText(verses, date), check, DAY)).toEqual({ ok: true, verses, skipped: 0 });
  });

  it("refuses a file that is not an export, or from a newer version", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readImport("hello", check, DAY)).toEqual({ ok: false, reason: "not-export" });
    expect(readImport(JSON.stringify({ kind: "other", v: 1, verses: [] }), check, DAY)).toEqual({ ok: false, reason: "not-export" });
    expect(readImport(JSON.stringify([{ from: JOHN }]), check, DAY)).toEqual({ ok: false, reason: "not-export" });
    expect(readImport(JSON.stringify({ kind: FILE_KIND, v: 2, verses: [] }), check, DAY)).toEqual({ ok: false, reason: "newer" });
    expect(readImport("x".repeat(1_000_001), check, DAY)).toEqual({ ok: false, reason: "too-big" });
  });

  it("merges: adds new verses, keeps the copy further along, never grows past the cap", () => {
    const here = [{ ...newVerse(JOHN, JOHN, DAY), stage: 2, last: DAY - 1 }, { ...newVerse(19023001, 19023001, DAY), stage: 5, last: DAY }];
    const file = [{ ...newVerse(JOHN, JOHN, DAY), stage: 4, last: DAY - 1 }, { ...newVerse(19023001, 19023001, DAY), stage: 1, last: DAY }, newVerse(20003005, 20003006, DAY)];
    const merged = mergeVerses(here, file);
    expect(merged).toMatchObject({ added: 1, updated: 1, same: 1, full: 0 });
    expect(merged.verses.map((verse) => [verse.from, verse.stage])).toEqual([[JOHN, 4], [19023001, 5], [20003005, 0]]);

    const many = Array.from({ length: MAX_LIST }, (_, i) => newVerse(19000000 + (i + 1) * 1000 + 1, 19000000 + (i + 1) * 1000 + 1, DAY));
    const capped = mergeVerses(many, [newVerse(JOHN, JOHN, DAY)]);
    expect(capped.full).toBe(1);
    expect(capped.verses).toHaveLength(MAX_LIST);
  });
});
