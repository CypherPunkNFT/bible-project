import { describe, expect, it } from "vitest";
import { DEFAULT_BIBLE, languageBible } from "./verses";
import type { Catalog } from "./types";

const catalog = {
  translations: [{ slug: "bsb", books: { ROM: ["1"] } }, { slug: "rvr", books: { ROM: ["1"], TOB: ["1"] } }],
} as unknown as Catalog;

describe("the Bible the reader opens", () => {
  it("is the Berean in English and each language's own elsewhere", () => {
    expect(DEFAULT_BIBLE).toEqual({ en: "bsb", es: "rvr", "pt-BR": "bpm", "zh-Hans": "cuv", ar: "svd", hi: "irv", id: "ind" });
    expect(languageBible(catalog, "en", "ROM", "1")).toBe("bsb");
    expect(languageBible(catalog, "es", "ROM", "1")).toBe("rvr");
  });

  it("has no answer when that Bible lacks the chapter, so the link's own edition stands", () => {
    expect(languageBible(catalog, "en", "TOB", "1")).toBeNull();
    expect(languageBible(catalog, "es", "ROM", "99")).toBeNull();
  });
});
