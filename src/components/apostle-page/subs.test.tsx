import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { plural } from "./data";
import { GridSub, RingSub } from "./Record";
import type { Apostle } from "./types";
import { WithSub } from "./With";

// The three section leads were one template string each, too long and with too many values for the page translator
// (stage 5 job 13). Split into one text per sentence, they must still read exactly as the old English did.
const text = (node: JSX.Element) => render(node).container.textContent;
const rows = (n: number) => Array.from({ length: n }) as Apostle["rows"];

describe("apostle section leads, one sentence per text", () => {
  it.each([["paul", 12], ["peter", 1]])("With: the same words as before (%s)", (key, count) => {
    const d = { key, short: "Simon", rows: rows(count) };
    expect(text(<WithSub d={d} />)).toBe(`Every record of ${d.short} in Scripture, in story order${d.key === "paul" ? " (Acts as told, with the Lord's words to him where Acts or his letter sets them)" : " (the Gospels in the order of Robertson's harmony, then Acts and the letters)"}. A person counts as "with him" only where a verse of that record names them both. ${plural(d.rows.length, "person", "people")} in all.`);
  });

  it.each([["The rock.", 40], ["", 1]])("Ring: the same words as before (%j)", (tagline, told) => {
    expect(text(<RingSub tagline={tagline} told={told} />)).toBe(`${tagline} Scripture gives no years for his life, so the ring is divided by how much is recorded: ${plural(told, "record")} of what he did or what was said to him, one bead each. The last part is tradition and is drawn dashed. Choose a part to read it.`);
  });

  it.each([["Bartholomew", "Nathanael"], ["Peter", undefined]])("Grid: the same words as before (%s, %s)", (short, alt) => {
    const verses = 57, chapters = 9;
    expect(text(<GridSub short={short} verses={verses} chapters={chapters} alt={alt} />)).toBe(`One square for each chapter of the books that name ${short}: ${plural(verses, "verse")} in ${plural(chapters, "chapter")}. The darker the square, the more verses in it name him.${alt ? ` Squares with a dashed edge name ${alt}, who is ${short} only if the two are one man (see the questions below).` : ""} Choose a chapter to read what happens there.`);
  });
});
