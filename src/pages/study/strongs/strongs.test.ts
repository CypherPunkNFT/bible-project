import { bsbWords } from "@/lib/bsb-for-tests";
import { describe, expect, it } from "vitest";
import { bandOf, D, findBand, findOpened, parseAlphabet, parseNumber, readerHref, SN, sourceById, wordsById } from "./model";
import { runHasNumber } from "./useLetterLookup";

describe("Strong's numbers study: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("ROM", 1, 16)).toBe("/read/bsb/ROM/1?hl=16-16");
  });
  it.each([["G26", "G26"], ["g0026", "G26"], ["26", "G26"], [" G 26 ", "G26"], ["G5624", "G5624"]])("reads %s as a Greek number", (typed, id) => {
    expect(parseNumber(typed)).toEqual({ kind: "ok", id });
  });
  it("tells apart what it cannot look up", () => {
    expect(parseNumber("")).toEqual({ kind: "empty" });
    expect(parseNumber("H7307")).toEqual({ kind: "hebrew", id: "H7307" });
    expect(parseNumber("G5625")).toEqual({ kind: "range", n: 5625 });
    expect(parseNumber("0")).toEqual({ kind: "range", n: 0 });
    expect(parseNumber("G2717")).toEqual({ kind: "unused", id: "G2717" });
    expect(parseNumber("G3302")).toEqual({ kind: "unused", id: "G3302" });
    expect(parseNumber("<script>")).toEqual({ kind: "bad" });
    expect(parseNumber("G26;drop")).toEqual({ kind: "bad" });
  });
  it("falls back when the address asks for something unknown", () => {
    expect(parseAlphabet("__proto__")).toBe("greek");
    expect(findBand("greek", "__proto__")).toBeUndefined();
    expect(findOpened("__proto__", "constructor")).toBeNull();
    expect(findOpened("G3056", "nope")).toBeNull();
    expect(findOpened("G3056", "word")?.row.label).toBe("word");
  });
  it("matches a tag as the Letters study's lookup does", () => {
    expect(runHasNumber(["love", "", "G26"], "G26")).toBe(true);
    expect(runHasNumber(["love", "", "G26a G25"], "G26")).toBe(true);
    expect(runHasNumber(["love", "", "G261"], "G26")).toBe(false);
    expect(runHasNumber("love", "G26")).toBe(false);
  });
});

describe("Strong's numbers study: its generated data", () => {
  it("runs the letter ranges unbroken from the first number to the last", () => {
    for (const [alphabet, top] of [["greek", SN.counts.greekTop], ["hebrew", SN.counts.hebrewTop]] as const) {
      const bands = SN.bands[alphabet];
      expect(bands[0].from).toBe(1);
      expect(bands[bands.length - 1].to).toBe(top);
      bands.slice(1).forEach((b, i) => expect(b.from).toBe(bands[i].to + 1));
    }
    expect(SN.bands.greek).toHaveLength(24);
    expect(SN.bands.hebrew).toHaveLength(22);
  });
  it("places the words the page says it places", () => {
    expect(bandOf("greek", 25)?.name).toBe("Alpha");
    expect(bandOf("greek", 26)?.name).toBe("Alpha");
    expect(bandOf("greek", 5368)?.name).toBe("Phi");
    expect(bandOf("hebrew", 7307)?.name).toBe("Resh");
  });
  it("adds each word's bars up to its total", () => {
    expect(SN.words).toHaveLength(6);
    for (const word of SN.words) {
      expect(word.rows.reduce((sum, r) => sum + r.count, word.other), word.id).toBe(word.total);
      for (const row of word.rows) expect(bsbWords(row.sample).length, `${word.id} ${row.label}`).toBeGreaterThan(10);
    }
  });
  it("keeps the facts the text leans on", () => {
    expect(wordsById.get("G2424")?.rows.find((r) => r.label === "Joshua")?.count).toBe(2);
    expect(SN.love.john21.map((j) => j.numbers)).toEqual([["G25", "G5368"], ["G25", "G5368"], ["G5368", "G5368"]]);
    expect(SN.counts.greekUnused).toBe(101);
    expect(bsbWords(SN.samples.exodus10)).toContain("east wind");
    expect(SN.samples.exodus21.bsbWord).toBe("judges");
  });
  it("ships no long lexicon text", () => {
    expect(JSON.stringify(SN)).not.toContain("<BR");
    expect(JSON.stringify(SN).length).toBeLessThan(60_000);
  });
});

describe("Strong's numbers study: its research record", () => {
  it("cites only sources it lists, each saying what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(20);
    for (const item of [...D.records, ...D.mistakes]) for (const id of item.sources) expect(sourceById.has(id), id).toBe(true);
  });
  it("gives each test exactly one supported answer", () => {
    expect(D.mistakes).toHaveLength(3);
    for (const m of D.mistakes) expect(m.test.options.filter((o) => o.right)).toHaveLength(1);
  });
});
