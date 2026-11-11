// Scripture memory: reading a typed reference into a passage, and loading it from the real Berean files (design §2, §9).
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/lib/types";
import { verseReference } from "@/lib/verses";
import { serveBerean } from "@/pages/life-events/test-kit";
import { passageWords } from "./fade";
import { STARTERS } from "./starters";
import { MAX_WORDS, choosePassage, loadPassage, passageAllowed, readerHref } from "./verse";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;

describe("choosing a passage", () => {
  it("reads one verse or a few in one chapter", () => {
    expect(choosePassage(catalog, "jn 3:16")).toEqual({ ok: true, from: 43003016, to: 43003016 });
    expect(choosePassage(catalog, "Prov 3:5-6")).toEqual({ ok: true, from: 20003005, to: 20003006 });
    expect(choosePassage(catalog, "1 Cor 13:4–7")).toEqual({ ok: true, from: 46013004, to: 46013007 });
    expect(choosePassage(catalog, "Jude 24-25")).toEqual({ ok: true, from: 65001024, to: 65001025 });
  });

  it("refuses whole chapters, lists, ranges across chapters and long passages with a sentence", () => {
    const one = "Choose one verse, or a few verses in one chapter, such as Psalm 23:1-3.";
    expect(choosePassage(catalog, "Psalm 23")).toEqual({ ok: false, error: one });
    expect(choosePassage(catalog, "John 3:16, 18")).toEqual({ ok: false, error: one });
    expect(choosePassage(catalog, "Gen 1:31-2:3")).toEqual({ ok: false, error: one });
    expect(choosePassage(catalog, "Psalm 119:1-9")).toEqual({ ok: false, error: "Choose at most 8 verses at a time, such as Psalm 23:1-6." });
    expect(choosePassage(catalog, "")).toMatchObject({ ok: false });
    expect(choosePassage(catalog, "Hezekiah 3:1")).toMatchObject({ ok: false });
  });

  it("checks stored ids against the Berean's books and chapters", () => {
    expect(passageAllowed(catalog, 43003016, 43003016)).toBe(true);
    expect(passageAllowed(catalog, 43022001, 43022001)).toBe(false);
    expect(passageAllowed(catalog, 99001001, 99001001)).toBe(false);
    expect(passageAllowed(catalog, 43003000, 43003001)).toBe(false);
  });

  it("links to the reader with the verses lit", () => {
    expect(readerHref(catalog, 20003005, 20003006)).toBe("/read/bsb/PRO/3?hl=5-6");
  });
});

describe("loading from the Berean", () => {
  beforeEach(() => { serveBerean(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("loads every starter verse, each short enough to learn", async () => {
    for (const starter of STARTERS) {
      const loaded = await loadPassage(catalog, starter.from, starter.to);
      expect(loaded.ok, verseReference(catalog, starter.from, starter.to)).toBe(true);
      if (loaded.ok) expect(passageWords(loaded.text).length).toBeLessThanOrEqual(MAX_WORDS);
    }
    const john = await loadPassage(catalog, 43003016, 43003016);
    expect(john).toMatchObject({ ok: true, text: expect.stringMatching(/^For God so loved the world/) });
  });

  it("refuses a verse the Berean does not have", async () => {
    expect(await loadPassage(catalog, 43003099, 43003099)).toEqual({ ok: false, error: "The Berean Standard Bible has no verse John 3:99." });
    expect(await loadPassage(catalog, 40017021, 40017021)).toMatchObject({ ok: false });
  });

  it("throws, rather than calling it a missing verse, when the file cannot load", async () => {
    vi.unstubAllGlobals();
    serveBerean({ fail: true });
    await expect(loadPassage(catalog, 31001001, 31001001)).rejects.toThrow();
  });
});
