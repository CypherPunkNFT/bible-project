import { existsSync, readFileSync } from "node:fs";
import { plainWords } from "./data";
import type { Chapter } from "./types";

// The preview text is made in the browser from chapter text; it must equal the build's plain text word for word.
const built = existsSync("data/catalog.json");

describe.skipIf(!built)("plainWords matches the build's plain text", () => {
  it.each([["kjv", "JHN"], ["kjv", "PSA"], ["wlc", "GEN"], ["cuv", "GEN"], ["irv", "GEN"], ["opv", "MAT"]])("%s %s", (slug, code) => {
    const plain: Record<string, string> = JSON.parse(readFileSync(`data/plain/${slug}/${code}.json`, "utf8"));
    const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8"));
    const chapters: string[] = catalog.translations.find((t: { slug: string }) => t.slug === slug).books[code];
    const mine: Record<string, string> = {};
    for (let k = 0; k * 5 < chapters.length; k++) {
      const chunk: Record<string, Chapter> = JSON.parse(readFileSync(`data/text/${slug}/${code}/${k}.json`, "utf8"));
      for (const c of Object.values(chunk)) for (const v of c.v) mine[`${c.c}:${v.n}`] = plainWords(v.r);
    }
    expect(mine).toEqual(plain);
  });
});
