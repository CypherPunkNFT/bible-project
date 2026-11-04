import { bsbWords } from "@/lib/bsb-for-tests";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { arcPath, D, DEFAULT_FORM, DEFAULT_LENS, DEFAULT_LINE, DEFAULT_NOUN, DEFAULT_ORDER, DEFAULT_VIEW, englishReads, findForm, findLens, findLine, findNoun, findOpened, findOrder, findView, G, moveToFront, percent, readerHref, readingTag, sourceById, unitsOf, unitText, verseByLabel } from "./model";

const EXTERNAL = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i;
const IMAGE_BUDGET = 150_000;
const word = (text: string) => text.normalize("NFC").replace(/[,.;:··]/g, "");

describe("How New Testament Greek works study: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("JHN", 3, 16)).toBe("/read/bsb/JHN/3?hl=16-16");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of ["__proto__", "constructor", "letter:__proto__", "word:nope:0", "cell:logos:XX", "", "<script>"]) {
      expect(findOpened(bad)).toBeNull();
      expect(findOrder(bad)).toBe(DEFAULT_ORDER);
      expect(findView(bad)).toBe(DEFAULT_VIEW);
      expect(findLens(bad)).toBe(DEFAULT_LENS);
      expect(findNoun(bad).id).toBe(DEFAULT_NOUN);
      expect(findLine(bad).id).toBe(DEFAULT_LINE);
      expect(findForm(bad).id).toBe(DEFAULT_FORM);
    }
    expect(findOpened(null)).toBeNull();
  });
  it("opens each letter, word, noun form and verb by its own key", () => {
    for (const letter of D.letters) expect(findOpened(`letter:${letter.id}`)).toEqual({ type: "letter", letter });
    expect(findOpened("word:rom5-8:8")?.type).toBe("word");
    expect(findOpened("cell:logos:NS")?.type).toBe("cell");
    expect(findOpened("cell:agape:NP")).toBeNull();
    for (const item of [...D.rail, ...D.aoristVerses]) expect(findOpened(`form:${item.id}`)?.type).toBe("form");
  });
  it("reaches all six orders by sending a word to the front", () => {
    const seen = new Set([DEFAULT_ORDER]);
    for (let round = 0; round < 4; round++) for (const order of [...seen]) for (const unit of unitsOf(order)) seen.add(moveToFront(order, unit));
    expect([...seen].sort()).toEqual(D.moved.orders.map((o) => o.id).sort());
    expect(moveToFront("vso", "o")).toBe("ovs");
  });
  it("says where English keeps the meaning, loses it or reverses it", () => {
    expect(englishReads("svo")).toBe("same");
    expect(englishReads("ovs")).toBe("opposite");
    for (const order of ["vso", "sov", "vos", "osv"]) expect(englishReads(order)).toBe("broken");
  });
  it("gives the doer and the receiver their real endings, and swaps only those", () => {
    expect(unitText("s", false).greek).toBe("ὁ θεὸς");
    expect(unitText("o", false).greek).toBe("τὸν κόσμον");
    expect(unitText("s", true).greek).toBe("ὁ κόσμος");
    expect(unitText("o", true).greek).toBe("τὸν θεόν");
    expect(unitText("v", true)).toEqual(unitText("v", false));
  });
  it("draws an arc within the room it has", () => {
    expect(arcPath(0, 900, 26, 22)).toBe("M0 26C0 4 900 4 900 26");
    expect(arcPath(0, 10, 26, 22)).toContain("C0 15.2 10 15.2");
  });
  it("says what was read of every status it uses", () => {
    expect(new Set(D.sources.map((s) => readingTag(s.status)))).toEqual(new Set(["read", "part read", "reported second-hand", "located, not read"]));
  });
  it("computes a share without dividing by nothing", () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(1, 0)).toBe(0);
  });
});

describe("How New Testament Greek works study: its data", () => {
  it("stays within its budget", () => {
    expect(new TextEncoder().encode(JSON.stringify(G)).length).toBeLessThanOrEqual(60_000);
  });
  it("has all twenty-four letters, sorted into three groups, each with a verse", () => {
    expect(D.letters).toHaveLength(24);
    expect(new Set(D.letters.map((l) => l.group))).toEqual(new Set(D.letterGroups.map((g) => g.id)));
    expect(D.letters.filter((l) => l.group === "new")).toHaveLength(9);
    for (const letter of D.letters) {
      expect(G.counts.letters[letter.id], letter.id).toBeGreaterThan(100);
      expect(bsbWords(verseByLabel.get(G.letters[letter.id].label)!).length, letter.id).toBeGreaterThan(10);
    }
  });
  it("draws the letters' words from John or Romans", () => {
    for (const letter of D.letters) expect(["JHN", "ROM"], letter.id).toContain(letter.word.code);
  });
  it("keeps the counts the page leans on", () => {
    const c = G.counts;
    expect(c.words).toBeGreaterThan(135_000);
    expect(c.words).toBeLessThan(c.allRows);
    expect(c.cases.N + c.cases.A + c.cases.G + c.cases.D + c.cases.V).toBe(c.nouns);
    expect(c.gridTotal).toBe(c.verbs);
    expect(c.grid.AI).toBeGreaterThan(c.grid.PI);
    expect(percent(c.indicative, c.verbs)).toBe(56);
  });
  it("shows the verses in the shape the page says they have", () => {
    const line = (id: string) => G.lines[id].words.map((w) => word(w.g));
    expect(line("rom5-8")[8]).toBe("θεός");
    expect(line("rom5-8")[7]).toBe("ὁ");
    expect(line("jhn3-35").slice(0, 5)).toEqual(["ὁ", "πατὴρ", "ἀγαπᾷ", "τὸν", "υἱὸν"]);
    expect(line("jhn1-1").slice(-4)).toEqual(["θεὸς", "ἦν", "ὁ", "λόγος"]);
    expect(G.lines["rom5-8"].words[7].to).toBe(8);
  });
  it("finds the neuter's two jobs in one form, and the shape of each noun's endings", () => {
    const { cells } = G.nouns.ergon;
    expect(cells.NS.form).toBe(cells.AS.form);
    expect(cells.NP.form).toBe(cells.AP.form);
    expect(G.nouns.logos.cells.AS.end).toBe("ον");
    expect(G.nouns.pistis.cells.GS.end).toBe("εως");
    expect(G.nouns.agape.cells.NP).toBeUndefined();
    for (const noun of D.nouns) expect(G.nouns[noun.id].vocative, noun.id).toBe(0);
  });
  it("finds θεός without the article where John plainly means God", () => {
    const without = G.theos.filter((m) => !m.article).map((m) => m.verse);
    for (const verse of [1, 6, 12, 13, 18]) expect(without).toContain(verse);
    expect(G.theos.find((m) => m.verse === 1 && m.article)?.form).toBe("θεόν");
  });
  it("can open the verse of each word to say", () => {
    for (const item of D.practice) expect(verseByLabel.has(`${item.code === "JHN" ? "John" : "Romans"} ${item.chapter}:${item.verse}`), item.form).toBe(true);
  });
  it("quotes the Berean for every verse it opens", () => {
    for (const [label, verse] of verseByLabel) expect(bsbWords(verse).length, label).toBeGreaterThan(10);
  });
});

describe("How New Testament Greek works study: its research record", () => {
  it("gives each test exactly one right answer", () => {
    for (const claim of Object.values(D.claims)) expect(claim.options.filter((o) => o.right)).toHaveLength(1);
  });
  it("cites only sources that say what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(10);
  });
  it("links outside the site only by https, and inside only to a local path", () => {
    for (const s of D.sources) expect(s.url.startsWith("/") ? /^\/(?!\/)/.test(s.url) : EXTERNAL.test(s.url), s.id).toBe(true);
    for (const p of D.pictures) expect(EXTERNAL.test(p.href), p.id).toBe(true);
  });
  it("keeps unread works marked as unread, and credits STEP as its terms ask", () => {
    for (const id of ["aspectBooks", "wallace", "colwell"]) expect(sourceById.get(id)?.status, id).toBe("second-hand");
    for (const id of ["levinsohn", "allen"]) expect(sourceById.get(id)?.status, id).toBe("located");
    expect(D.credit.url).toBe("https://www.STEPBible.org");
    expect(D.credit.line).toContain("STEP Bible");
  });
  it("marks only John's own clause as Scripture in the table of what he could have written", () => {
    expect(D.harner.clauses.filter((c) => c.actual).map((c) => c.greek)).toEqual(["θεὸς ἦν ὁ λόγος"]);
  });
});

describe("How New Testament Greek works study: its picture", () => {
  it("credits it, and the file is here, small and sized as recorded", () => {
    for (const p of D.pictures) {
      for (const field of [p.credit, p.licence, p.href, p.retrieved, p.alt, p.caption]) expect(field.length, p.id).toBeGreaterThan(2);
      const path = resolve(process.cwd(), "public", p.src.replace(/^\//, ""));
      expect(existsSync(path), p.src).toBe(true);
      expect(statSync(path).size, p.src).toBeLessThanOrEqual(IMAGE_BUDGET);
    }
  });
});
