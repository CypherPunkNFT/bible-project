import { describe, expect, it } from "vitest";
import { currentBibleSlug, DEFAULT_BIBLE, fillVerses, firstWords } from "@/lib/verses";
import type { Catalog } from "@/lib/types";

describe("the Bible for a language", () => {
  it("gives each language its own Bible, all numbered as in English", () => {
    expect(DEFAULT_BIBLE).toEqual({ en: "bsb", es: "rvr", "pt-BR": "bpm", "zh-Hans": "cuv", ar: "svd", hi: "irv" });
    expect(currentBibleSlug("es")).toBe("rvr");
    expect(currentBibleSlug("zh-Hans")).toBe("cuv");
  });
});

describe("firstWords", () => {
  it("cuts at a word and marks the cut", () => {
    expect(firstWords("In the beginning God created", 18)).toBe("In the beginning …");
    expect(firstWords("In the beginning", 18)).toBe("In the beginning");
  });
});

describe("fillVerses", () => {
  it("leaves a file with nothing to fill unchanged, and does not touch the original", async () => {
    const data = { title: "A title", items: [{ text: "Words of the site's own" }] };
    const filled = await fillVerses(data, { translations: [{ slug: "bsb" }], books: [] } as unknown as Catalog, "bsb");
    expect(filled).toEqual(data);
    expect(filled).not.toBe(data);
  });
});
