// The hand check (design 3.3 and 3.4: the theme keywords are "tested name by name for the 150 checked names"):
// theme-review.json records the headline, label and themes that the 150 most-mentioned names and every name with a
// hand-checked override were reviewed with. A data or keyword change that alters any of them fails here until the
// changed names are checked again by hand.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { NamesIndex } from "@/data/baby-names";
import review from "./theme-review.json";

const index = JSON.parse(readFileSync("data/baby-names/index.json", "utf8")) as NamesIndex;
const reviewed = review.names as Record<string, { m: string; l: string; th: string[] }>;
const bySlug = new Map(index.names.map((row) => [row.s, row]));
// Code-point order on the slug breaks ties, the same order the Python review script used.
const mostMentioned = [...index.names].sort((a, b) => b.c - a.c || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0)).slice(0, 150);
const HINT = "re-check these names by hand, then update src/data/baby-names/theme-review.json";

describe("baby names: the hand-checked names", () => {
  it("include the 150 names the Bible mentions most", () => {
    expect(mostMentioned.filter((row) => !reviewed[row.s]).map((row) => `${row.s} (${row.c} verses) is now in the top 150`), HINT).toEqual([]);
  });

  it("keep the headline, label and themes they were reviewed with", () => {
    const changed = Object.entries(reviewed).flatMap(([slug, was]) => {
      const row = bySlug.get(slug);
      if (!row) return [`${slug}: no longer has a page`];
      const same = was.m === row.m && was.l === row.l && was.th.join() === row.th.join();
      return same ? [] : [`${slug}: now ${JSON.stringify({ m: row.m, l: row.l, th: row.th })}, reviewed ${JSON.stringify(was)}`];
    });
    expect(changed, HINT).toEqual([]);
  });

  it("include the cases the review settled", () => {
    expect(reviewed.samson).toEqual({ m: "sunlight", l: "probable", th: ["light"] });
    expect(reviewed.zion).toEqual({ m: "monumental or guiding pillar", l: "probable", th: [] });
    expect(reviewed.azariah.th).toEqual(["god", "help"]);
    expect(Object.keys(reviewed).length).toBeGreaterThan(300);
  });
});
