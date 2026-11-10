import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sectionOfNum } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { lookFromQuery } from "./links";
import { BOOK_PARTS, BUILT_IN_LOOKS, LOOK_IDS, PART_COLOURS, RETIRED_LOOKS, bookLook, contrastRatio, lookProblems } from "./looks";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;

describe("the designs", () => {
  it("reads at 4.5:1 or better for text, reference and footer, against both ends of a gradient", () => {
    for (const look of Object.values(BUILT_IN_LOOKS)) expect(lookProblems(look), look.id).toEqual([]);
    for (let book = 1; book <= 66; book++) expect(lookProblems(bookLook(book)), `book ${book}`).toEqual([]);
  });

  it("matches the ratios the design records", () => {
    expect(contrastRatio("#2A2420", "#F6F1E7")).toBeCloseTo(13.6, 0);
    expect(contrastRatio("#7A5C2A", "#F6F1E7")).toBeGreaterThan(5.4);
    expect(contrastRatio("#FFDDB3", "#94502F")).toBeGreaterThan(4.6);
    expect(contrastRatio("#FFFFFF", PART_COLOURS.epistles)).toBeGreaterThan(5.5);
  });

  it("names a failing pair, and a colour that is not #rrggbb", () => {
    const pale = { id: "pale", name: "Pale", background: { from: "#FFFFFF", to: "#000000" }, text: "#777777", accent: "#000000" };
    const problems = lookProblems(pale);
    expect(problems.some((problem) => /Pale design's text colour #777777 on #FFFFFF/.test(problem))).toBe(true);
    expect(problems.some((problem) => /reference and footer colour #000000 on #000000 is 1.00:1/.test(problem))).toBe(true);
    expect(lookProblems({ ...pale, text: "red" })).toEqual(["The Pale design's text colour red is not a #rrggbb colour."]);
  });

  it("keeps the book-to-part table in step with the catalogue for all 66 books", () => {
    expect(BOOK_PARTS).toHaveLength(66);
    for (let book = 1; book <= 66; book++) expect(BOOK_PARTS[book - 1], `book ${book}`).toBe(sectionOfNum(catalog, book));
  });

  it("still opens every design id ever published", () => {
    const published = ["paper", "night", "dawn", "olive", "book", "bold"];
    expect(LOOK_IDS).toEqual(published.filter((id) => !(id in RETIRED_LOOKS)));
    for (const id of [...published, ...Object.keys(RETIRED_LOOKS)]) expect(LOOK_IDS).toContain(lookFromQuery(id));
  });
});
