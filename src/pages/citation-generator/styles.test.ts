import { readFileSync } from "node:fs";
import type { Catalog, Translation } from "@/lib/types";
import { parseReference, type Reference } from "./parse";
import { mlaDate } from "./abbreviations";
import { citeIn, formatReference, htmlText, plainText, versionFacts, type PrintedBible, type StyleId } from "./styles";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const version = (slug: string) => catalog.translations.find((t) => t.slug === slug) as Translation;
const reference = (text: string, slug = "bsb"): Reference => {
  const result = parseReference(text, version(slug), catalog.books, catalog.equivalent);
  if (!result.ok) throw new Error(`${text}: ${result.error}`);
  return result.reference;
};
const TODAY = new Date(2026, 10, 9);
const NO_PRINT: PrintedBible = { publisher: "", place: "", year: "" };
/** Each entry of a style as "label: plain text", italics marked *like this*. */
const cite = (style: StyleId, text: string, slug = "bsb", printed = NO_PRINT) =>
  Object.fromEntries(citeIn(style, reference(text, slug), version(slug), printed, TODAY)
    .map((entry) => [entry.key, entry.runs.map((run) => (typeof run === "string" ? run : `*${run.italic}*`)).join("")]));

describe("writing the reference in each style", () => {
  it("abbreviates the book and joins chapter and verse each style's way", () => {
    const john = reference("John 3:16-18");
    expect(formatReference(john, "mla")).toBe("John 3.16-18");
    expect(formatReference(john, "apa")).toBe("John 3:16–18");
    expect(formatReference(reference("Gen 1:1-2:3"), "mla")).toBe("Gen. 1.1-2.3");
    expect(formatReference(reference("Gen 1:1-2:3"), "sbl")).toBe("Gen 1:1–2:3");
    expect(formatReference(reference("1 Kings 3:9"), "mla")).toBe("1 Kgs. 3.9");
    expect(formatReference(reference("1 Kings 3:9"), "chicago")).toBe("1 Kings 3:9");
    expect(formatReference(reference("1 Kings 3:9"), "sbl")).toBe("1 Kgs 3:9");
    expect(formatReference(reference("Song of Songs 2:1"), "mla")).toBe("Song of Sg. 2.1");
    expect(formatReference(reference("Song of Songs 2:1"), "turabian")).toBe("Song of Sol. 2:1");
    expect(formatReference(reference("Philemon 4"), "sbl")).toBe("Phlm 4");
  });

  it("writes lists in one chapter with commas and new chapters after semicolons", () => {
    expect(formatReference(reference("1 Cor 13:4-7, 13"), "chicago")).toBe("1 Cor. 13:4–7, 13");
    expect(formatReference(reference("Rom 8:28; 12:1-2"), "sbl")).toBe("Rom 8:28; 12:1–2");
    expect(formatReference(reference("Jude 24-25"), "mla")).toBe("Jude 24-25");
    expect(formatReference(reference("Obadiah"), "apa")).toBe("Obadiah");
  });

  it("names one psalm and several psalms each style's way", () => {
    expect(formatReference(reference("Psalm 23:1"), "apa")).toBe("Psalm 23:1");
    expect(formatReference(reference("Ps 23; 91:1-4"), "apa")).toBe("Psalms 23; 91:1–4");
    expect(formatReference(reference("Ps 23; 91:1-4"), "sbl")).toBe("Pss 23; 91:1–4");
    expect(formatReference(reference("Ps 23; 91:1-4"), "chicago")).toBe("Pss. 23; 91:1–4");
    expect(formatReference(reference("Ps 23; 91:1-4"), "mla")).toBe("Ps. 23; 91.1-4");
    expect(formatReference(reference("Ps 151:1-5", "webc"), "sbl")).toBe("Ps 151:1–5");
    expect(formatReference(reference("Ps 151:1-5", "webc"), "mla")).toBe("Ps. 151.1-5");
  });
});

describe("the five styles", () => {
  it("MLA: a works-cited entry with the site and the date read, the version named the first time only", () => {
    expect(cite("mla", "John 3:16")).toEqual({
      works: "*Berean Standard Bible*. 2023. *Bible Guide*, bibleguide.io/read. Accessed 9 Nov. 2026.",
      first: "(*Berean Standard Bible*, John 3.16)",
      later: "(John 3.16)",
    });
  });

  it("APA: the year, the site and its address, and the version in every citation", () => {
    expect(cite("apa", "John 3:16")).toEqual({
      reference: "*Berean Standard Bible*. (2023). Bible Guide. https://bibleguide.io/read",
      "in-text": "(*Berean Standard Bible*, 2023, John 3:16)",
    });
  });

  it("APA: an older version is undated on the site and keeps its first year as the original", () => {
    expect(cite("apa", "Song of Solomon 8:6", "kjv")).toEqual({
      reference: "*King James Version*. (n.d.). Bible Guide. https://bibleguide.io/read (Original work published 1611)",
      "in-text": "(*King James Version*, 1611/n.d., Song of Songs 8:6)",
    });
  });

  it("Chicago: the version's short name in the first note, none after, and a bibliography line", () => {
    expect(cite("chicago", "1 Thess 4:11")).toEqual({
      "first-note": "1 Thess. 4:11 (BSB).",
      "later-notes": "1 Thess. 4:11.",
      "in-text": "(1 Thess. 4:11 BSB)",
      bibliography: "*Berean Standard Bible*. 2023. Bible Guide. https://bibleguide.io/read.",
    });
  });

  it("Turabian: the version spelled out in the first note", () => {
    expect(cite("turabian", "2 Kings 11:8")["first-note"]).toBe("2 Kings 11:8 (Berean Standard Bible).");
    expect(cite("turabian", "2 Kings 11:8")["later-notes"]).toBe("2 Kings 11:8.");
  });

  it("SBL: the version said once, bare references after, and its short name only beside another version", () => {
    expect(cite("sbl", "Gen 1:1")).toEqual({
      statement: "Unless otherwise noted, Scripture quotations are from the Berean Standard Bible (BSB).",
      note: "Gen 1:1.",
      "in-text": "(Gen 1:1)",
      "other-version": "(Gen 1:1 BSB)",
    });
  });

  it("cites a printed Bible from its publisher and year instead of the site", () => {
    const printed = { publisher: "Crossway", place: "Wheaton, IL", year: "2016" };
    expect(cite("mla", "John 3:16", "bsb", printed).works).toBe("*Berean Standard Bible*. Crossway, 2016.");
    expect(cite("apa", "John 3:16", "bsb", printed).reference).toBe("*Berean Standard Bible*. (2016). Crossway.");
    expect(cite("apa", "John 3:16", "bsb", printed)["in-text"]).toBe("(*Berean Standard Bible*, 2016, John 3:16)");
    expect(cite("chicago", "John 3:16", "bsb", printed).bibliography).toBe("*Berean Standard Bible*. Wheaton, IL: Crossway, 2016.");
    expect(cite("apa", "John 3:16", "kjv", { ...printed, publisher: "Cambridge University Press" })["in-text"]).toBe("(*King James Version*, 1611/2016, John 3:16)");
  });

  it("names a version in another language by its own title, in full", () => {
    expect(versionFacts(version("rvr"))).toMatchObject({ title: "Reina-Valera 1909", short: "Reina-Valera 1909", language: "Spanish" });
    expect(cite("apa", "John 3:16", "rvr").reference).toBe("*Reina-Valera 1909* [Spanish Bible]. (n.d.). Bible Guide. https://bibleguide.io/read (Original work published 1909)");
    expect(cite("chicago", "John 3:16", "rvr")["first-note"]).toBe("John 3:16 (Reina-Valera 1909).");
    expect(cite("sbl", "John 3:16", "rvr").statement).toBe("Unless otherwise noted, Scripture quotations are from the Reina-Valera 1909.");
  });

  it("works for every version the site serves", () => {
    for (const translation of catalog.translations) {
      const book = translation.books.JHN ? "John 1:1" : translation.books.GEN ? "Genesis 1:1" : null;
      if (!book) continue;
      for (const style of ["mla", "apa", "chicago", "turabian", "sbl"] as const) {
        const entries = citeIn(style, reference(book, translation.slug), translation, NO_PRINT, TODAY);
        for (const entry of entries) expect(plainText(entry.runs), `${translation.slug} ${style}`).not.toMatch(/undefined|NaN|\(\)/);
      }
    }
  });

  it("copies italics as HTML and escapes what HTML would read", () => {
    expect(htmlText([{ italic: "A & B" }, " <c>"])).toBe("<i>A &amp; B</i> &lt;c&gt;");
    expect(plainText([{ italic: "A" }, " b"])).toBe("A b");
    expect(mlaDate(new Date(2026, 8, 1))).toBe("1 Sept. 2026");
  });
});
