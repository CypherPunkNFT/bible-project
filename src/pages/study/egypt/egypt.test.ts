import { bsbWords } from "@/lib/bsb-for-tests";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cityRadius, D, DEFAULT_CITY, DEFAULT_EXPLANATION, DEFAULT_JUDGE, DEFAULT_LETTER, DEFAULT_THEME, EG, findCity, findExplanation, findJudge, findOpened, findPassage, findTheme, hymnX, mapPoint, MAP, papyrusY, proverbsY, psalmX, readerHref, readingTag, SEAM, signParts, sourceById, STAVES, threadPath, timeShare, verseByLabel } from "./model";

const IMAGE_BUDGET = 150_000;
const SET_BUDGET = 1_000_000;
const RECORD_BUDGET = 90_000;
const DATA_BUDGET = 40_000;
const RECORD = "content/academic-research/32-egypt-beside-israel.json";
const EXTERNAL = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i;
const countedBy = (judge: string) => D.parallels.filter((p) => p.judges.includes(judge)).map((p) => p.prov);

describe("Egypt beside Israel: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("PRO", 23, 10)).toBe("/read/bsb/PRO/23?hl=10-10");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of ["__proto__", "constructor", "par:__proto__", "par:nope", "par:", "", "<script>"]) {
      expect(findOpened(bad)).toBeNull();
      expect(findJudge(bad).id).toBe(DEFAULT_JUDGE);
      expect(findTheme(bad).id).toBe(DEFAULT_THEME);
      expect(findCity(bad).id).toBe(DEFAULT_CITY);
      expect(findPassage(bad).id).toBe(DEFAULT_LETTER);
      expect(findExplanation(bad).id).toBe(DEFAULT_EXPLANATION);
    }
    expect(findOpened(null)).toBeNull();
  });
  it("opens each passage only by its own key", () => {
    for (const p of D.parallels) expect(findOpened(`par:${p.id}`)).toEqual(p);
    expect(findOpened("wings")).toBeNull();
  });
  it("says what was read of every status it uses", () => {
    expect(new Set(D.sources.map((s) => readingTag(s.status)))).toEqual(new Set(["read", "part read", "reported second-hand", "located, not read"]));
  });
  it("sets determinatives and sign numbers as real raised and lowered text", () => {
    expect(signParts("{uru}u₂-ru-ša₁₀-lim{ki}")).toEqual([
      { kind: "sup", value: "uru" }, { kind: "text", value: "u" }, { kind: "sub", value: "2" }, { kind: "text", value: "-ru-ša" }, { kind: "sub", value: "10" }, { kind: "text", value: "-lim" }, { kind: "sup", value: "ki" },
    ]);
    expect(signParts("7ta-a-an")).toEqual([{ kind: "text", value: "7ta-a-an" }]);
  });
  it("gives a town four times the letters twice the extra radius", () => {
    expect(cityRadius(36) - 3).toBeCloseTo((cityRadius(9) - 3) * 2);
  });
});

describe("Egypt beside Israel: the seam's counts", () => {
  it("keeps the three judges' lists, in their own units", () => {
    expect(D.parallels).toHaveLength(11);
    expect(countedBy("usual")).toHaveLength(11);
    expect(countedBy("ruffle")).toEqual(["Proverbs 22:17-18", "Proverbs 22:20", "Proverbs 22:22", "Proverbs 22:29", "Proverbs 23:1-3", "Proverbs 23:4-5", "Proverbs 23:10-11"]);
    expect(countedBy("brunet")).toEqual(["Proverbs 22:17-18", "Proverbs 22:20", "Proverbs 22:22", "Proverbs 22:24-25", "Proverbs 22:29"]);
  });
  it("does not nest Brunet inside Ruffle: he keeps a passage Ruffle drops", () => {
    expect(countedBy("brunet").filter((p) => !countedBy("ruffle").includes(p))).toEqual(["Proverbs 22:24-25"]);
  });
  it("names only judges it has, and says that seven is this study's count", () => {
    const judges = new Set(D.judges.map((j) => j.id));
    for (const p of D.parallels) for (const id of p.judges) expect(judges.has(id), p.id).toBe(true);
    expect(D.judges.find((j) => j.id === "ruffle")?.note).toContain("this study's count");
    expect(D.judges.find((j) => j.id === "ruffle")?.note).toContain("11 verses of Hebrew out of 24");
  });
  it("draws every thread inside both rulers, and stops them all by Proverbs 23:11", () => {
    for (const p of D.parallels) {
      expect(threadPath(p), p.id).not.toContain("NaN");
      const fromY = papyrusY(p.column, p.line), toY = proverbsY((p.firstVerse + p.lastVerse) / 2);
      for (const y of [fromY, toY]) { expect(y, p.id).toBeGreaterThanOrEqual(SEAM.top); expect(y, p.id).toBeLessThanOrEqual(SEAM.bottom); }
      expect(p.lastVerse, p.id).toBeLessThanOrEqual(23);
    }
  });
  it("keeps the thread ends far enough apart to tell apart at phone width", () => {
    const ends = D.parallels.map((p) => proverbsY((p.firstVerse + p.lastVerse) / 2)).sort((a, b) => a - b);
    for (let i = 1; i < ends.length; i++) expect(ends[i] - ends[i - 1]).toBeGreaterThanOrEqual(6);
  });
  it("places each passage in the chapter it names, from the chapter table", () => {
    const chapterOf = (column: number, line: number) => D.papyrus.chapters.filter(([c, l]) => c < column || (c === column && l <= line)).length;
    for (const p of D.parallels) expect(chapterOf(p.column, p.line), p.id).toBe(p.chapter);
  });
});

describe("Egypt beside Israel: the two songs", () => {
  it("puts the eight themes on both staves, in a different order", () => {
    expect(D.themes).toHaveLength(8);
    expect(new Set(D.themes.map((t) => t.strophe)).size).toBe(8);
    const byHymn = [...D.themes].sort((a, b) => a.strophe - b.strophe).map((t) => t.id);
    const byPsalm = [...D.themes].sort((a, b) => a.psalmAt - b.psalmAt).map((t) => t.id);
    expect(byHymn).not.toEqual(byPsalm);
    for (const t of D.themes) {
      expect(t.strophe, t.id).toBeLessThan(D.strophes.length);
      expect(hymnX(t.strophe)).toBeLessThanOrEqual(STAVES.right);
      expect(psalmX(t.psalmAt)).toBeLessThanOrEqual(STAVES.right);
      expect(t.verses[0], t.id).toBe(`Psalm 104:${t.psalmAt}`);
    }
  });
  it("keeps the numbered marks on the psalm's stave from overlapping", () => {
    const xs = D.themes.map((t) => psalmX(t.psalmAt)).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(9);
  });
});

describe("Egypt beside Israel: the letters", () => {
  it("counts the word Habiru as the edition's dictionary marks it", () => {
    const { habiru } = EG.letters;
    expect(habiru.letters).toBe(65);
    expect(habiru.spelled).toEqual(["EA 286", "EA 287", "EA 288", "EA 289", "EA 290"]);
    expect(habiru.spelledFrom).toEqual(["Jerusalem"]);
    expect(habiru.signsOnly).toBe(60);
    expect(habiru.fromByblos).toBe(32);
    const claim = D.claims.find((c) => c.id === "habiru")!.evidence;
    for (const figure of ["65", "32"]) expect(claim).toContain(figure);
  });
  it("shows the base it counted from", () => {
    expect(EG.letters.catalogue).toBe(379);
    expect(EG.letters.withText).toBe(305);
    expect(D.reach.join(" ")).toContain("305 letters with text, of 379");
    expect(EG.letters.canaanite).toEqual({ words: 200, letters: 102, egyptianWords: 16 });
  });
  it("has a count for every place, and places every place inside the map", () => {
    expect(D.letters.cities).toHaveLength(12);
    for (const c of D.letters.cities) {
      expect(EG.letters.cities[c.id]?.letters, c.id).toBeGreaterThan(0);
      const [x, y] = mapPoint(c.lon, c.lat);
      expect(x, c.id).toBeGreaterThan(0); expect(x, c.id).toBeLessThan(MAP.width);
      expect(y, c.id).toBeGreaterThan(0); expect(y, c.id).toBeLessThan(MAP.height);
      expect(bsbWords(verseByLabel.get(c.verse)!), c.id).toContain(c.biblical);
      if (c.letter) expect(findPassage(c.letter).id).toBe(c.letter);
    }
  });
  it("holds real words for each reader passage, including the ones the plain rendering turns on", () => {
    for (const p of D.letters.passages) {
      const words = EG.passages[p.id].flatMap((line) => line.words);
      expect(EG.passages[p.id].map((line) => line.label), p.id).toEqual(p.lines);
      for (const expected of p.expect) expect(words.map((w) => w.t).join(" "), `${p.id} ${expected}`).toContain(expected);
      for (const w of words) expect(w.t + w.g, p.id).not.toMatch(/[⸢⸣[\]]|\{\{|\}\}/);
    }
    expect(EG.passages.ea147.flatMap((l) => l.words).filter((w) => w.l).map((w) => w.l)).toEqual(["c", "e"]);
  });
  it("names the edition's licence and editors where the reader is shared", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/study/egypt/Letters.tsx"), "utf-8");
    expect(source).toContain("Jacob Lauinger and Tyler Yoder");
    expect(source).toContain("by-sa/3.0");
  });
});

describe("Egypt beside Israel: its research record", () => {
  it("was built from this record: the generated data is not stale", () => {
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), RECORD))).digest("hex")).toBe(EG.recordHash);
  });
  it("cites only sources it lists, each saying what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(10);
    const cited = [...D.judges.map((j) => j.source), ...D.claims.flatMap((c) => c.sources)];
    for (const id of cited) expect(sourceById.has(id), id).toBe(true);
  });
  it("links outside the site only by https", () => {
    for (const s of D.sources) expect(EXTERNAL.test(s.url), s.id).toBe(true);
    for (const p of D.pictures) {
      expect(EXTERNAL.test(p.href), p.id).toBe(true);
      expect(EXTERNAL.test(p.licenceUrl), p.id).toBe(true);
    }
  });
  it("uses every verse it lists, and has a Berean text for every verse it uses", () => {
    const used = new Set([...D.parallels.flatMap((p) => p.verses), ...D.themes.flatMap((t) => t.verses), ...D.partings.flatMap((p) => p.verses), ...D.letters.cities.map((c) => c.verse),
      ...D.letters.passages.flatMap((p) => p.beside.map((b) => b.verse)), ...D.letters.cognates.map((c) => c.verse), ...D.stance.verses, D.stance.scripture, ...D.claims.flatMap((c) => c.verses), "Proverbs 1:1"]);
    for (const label of used) expect(bsbWords(verseByLabel.get(label)!).length, label).toBeGreaterThan(10);
    for (const { label } of D.verses) expect(used.has(label), label).toBe(true);
  });
  it("gives each test exactly one supported answer", () => {
    expect(D.claims).toHaveLength(4);
    for (const claim of D.claims) expect(claim.test.options.filter((o) => o.right), claim.id).toHaveLength(1);
  });
  it("chooses no date for the exodus, and keeps its neighbours' subjects out", () => {
    const all = JSON.stringify(D).toLowerCase();
    expect(all).not.toMatch(/\b1446\b|\b1250\b|\b1270\b/);
    expect(D.boundaries.out.join(" ")).toContain("Elephantine");
    expect(D.boundaries.out.join(" ")).toContain("Merneptah");
    expect(D.boundaries.out.join(" ")).toContain("Ugarit");
  });
  it("leaves the two undated texts off the time chart", () => {
    const rows = D.timeline.rows.map((r) => r.name.toLowerCase()).join(" ");
    expect(rows).not.toContain("psalm");
    expect(rows).not.toContain("22:17");
    for (const r of D.timeline.rows) {
      expect(timeShare(r.start), r.id).toBeGreaterThanOrEqual(0);
      expect(timeShare(r.end), r.id).toBeLessThanOrEqual(1);
    }
  });
  it("stays within the budgets for the record and the generated data", () => {
    expect(statSync(resolve(process.cwd(), RECORD)).size).toBeLessThanOrEqual(RECORD_BUDGET);
    expect(statSync(resolve(process.cwd(), "src/pages/study/egypt/egypt-data.json")).size).toBeLessThanOrEqual(DATA_BUDGET);
  });
});

describe("Egypt beside Israel: its pictures", () => {
  it("credits each one with a licence and a link", () => {
    for (const p of D.pictures) {
      for (const field of [p.credit, p.licence, p.licenceUrl, p.href, p.retrieved, p.alt]) expect(field.length, p.id).toBeGreaterThan(2);
      expect(["CC0", "Public domain"], p.id).toContain(p.licence);
      expect(p.width, p.id).toBeGreaterThan(0);
    }
  });
  it("uses no photograph from the British Museum, whose terms this study could not clear", () => {
    expect(JSON.stringify(D.pictures).toLowerCase()).not.toContain("britishmuseum");
  });
  it("keeps every file in the public folder, small, and within the set's budget", () => {
    let total = 0;
    for (const p of D.pictures) {
      const path = resolve(process.cwd(), "public", p.src.replace(/^\//, ""));
      expect(existsSync(path), p.src).toBe(true);
      const { size } = statSync(path);
      expect(size, p.src).toBeLessThanOrEqual(IMAGE_BUDGET);
      total += size;
    }
    expect(total).toBeLessThanOrEqual(SET_BUDGET);
  });
});
