import { describe, expect, it } from "vitest";
import { currentBibleSlug, fillVerses, firstWords } from "@/lib/verses";
import { SITE_LANGUAGES, SOURCE_LANGUAGE } from "@/lib/site-languages";
import type { Catalog } from "@/lib/types";

describe("the Bible for a language", () => {
  it("is the one site-languages.json gives it, or English's for a language with none or a code the site lacks", () => {
    for (const language of SITE_LANGUAGES) expect(currentBibleSlug(language.code), language.code).toBe(language.bible ?? SOURCE_LANGUAGE.bible);
    expect(currentBibleSlug("xx-made-up")).toBe(SOURCE_LANGUAGE.bible);
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
