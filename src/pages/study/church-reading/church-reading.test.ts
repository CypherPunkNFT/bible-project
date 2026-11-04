import { bsbWords } from "@/lib/bsb-for-tests";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STUDY_BRANCHES } from "@/pages/study/hub/collections";
import { barPlace, CR, D, DEFAULT_QUESTION, DEFAULT_READER, DEFAULT_SENSE, findOpened, findQuestion, findReader, findSense, longestGap, PASSAGE, pictureById, readerById, readerHref, readersOnVerse, readingTag, segmentVerse, sourceById, sourceCounts, TIME_END, verseByLabel } from "./model";

const IMAGE_BUDGET = 150_000;
const SET_BUDGET = 1_000_000;
const RECORD_BUDGET = 90_000;
const EXTERNAL = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i;
const HREF = "/study/how-the-church-has-read-the-bible";
const internal = (href: string) => /^\/(?!\/)/.test(href);
const scripture = (label: string) => bsbWords(verseByLabel.get(label)!);

describe("How the church has read the Bible: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("GAL", 4, 24)).toBe("/read/bsb/GAL/4?hl=24-24");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of ["__proto__", "constructor", "reader:__proto__", "reader:nope", "reader:", "", "<script>"]) {
      expect(findOpened(bad)).toBeNull();
      expect(findReader(bad).id).toBe(DEFAULT_READER);
      expect(findQuestion(bad).id).toBe(DEFAULT_QUESTION);
      expect(findSense(bad).id).toBe(DEFAULT_SENSE);
    }
    expect(findOpened(null)).toBeNull();
  });
  it("opens each record only by its own key", () => {
    for (const reader of D.readers) expect(findOpened(`reader:${reader.id}`)).toEqual(reader);
    expect(findOpened("origen")).toBeNull();
  });
  it("says what was read of every status it uses", () => {
    expect(new Set(D.sources.map((s) => readingTag(s.status)))).toEqual(new Set(["read", "part read", "reported second-hand", "located, not read"]));
  });
  it("gives readers who share a phrase one segment, and keeps phrases that nearly touch apart", () => {
    const verse24 = segmentVerse(scripture("Galatians 4:24"), readersOnVerse("Galatians 4:24"));
    expect(verse24.map((s) => s.text).join("")).toBe(scripture("Galatians 4:24"));
    expect(verse24.find((s) => s.text === "serve as illustrations")?.readers.map((r) => r.id)).toEqual(["chrysostom", "luther"]);
    expect(verse24.find((s) => s.text === "the women represent")?.readers.map((r) => r.id)).toEqual(["tertullian"]);
    expect(verse24.find((s) => s.text === "two covenants")?.readers.map((r) => r.id)).toEqual(["gill"]);
    const verse25 = segmentVerse(scripture("Galatians 4:25"), readersOnVerse("Galatians 4:25"));
    expect(verse25.map((s) => s.text).join("")).toBe(scripture("Galatians 4:25"));
    expect(verse25.filter((s) => s.readers.length).map((s) => s.text)).toEqual(["corresponds to", "the present-day Jerusalem"]);
  });
  it("never throws on a verse that does not hold a phrase, and keeps the whole text", () => {
    const stray = { ...readerById.get("origen")!, fasten: { verse: "x", phrase: "not in this verse" } };
    expect(segmentVerse("A verse.", [stray])).toEqual([{ text: "A verse.", readers: [] }]);
    expect(segmentVerse("", [])).toEqual([]);
  });
  it("draws a range as a range, and holds a thin bar on the track at the far end", () => {
    expect(barPlace(200, 200).left).toBe(0);
    const last = barPlace(TIME_END, TIME_END);
    expect(last.left + last.width).toBeLessThanOrEqual(100);
    for (const r of D.readers) {
      const { left, width } = barPlace(r.from, r.to);
      expect(left, r.id).toBeGreaterThanOrEqual(0);
      expect(left + width, r.id).toBeLessThanOrEqual(100);
    }
    expect(barPlace(1000, 1400).width).toBeGreaterThan(barPlace(1000, 1010).width);
  });
});

describe("How the church has read the Bible: its research record", () => {
  it("adds up: eleven verses, twelve readers, six to a margin, four questions, five kinds", () => {
    expect(PASSAGE).toHaveLength(11);
    expect(D.readers).toHaveLength(12);
    expect(D.readers.filter((r) => r.side === "left")).toHaveLength(6);
    expect(D.questions).toHaveLength(4);
    expect(D.lanes).toHaveLength(5);
    expect(D.senses.items).toHaveLength(4);
    expect(D.reach[0]).toContain("twelve readers");
  });
  it("keeps the readers in date order with their letters in order, and each range forward", () => {
    expect(D.readers.map((r) => r.mark).join("")).toBe("abcdefghijkl");
    const starts = D.readers.map((r) => r.from);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    for (const r of D.readers) expect(r.from, r.id).toBeLessThanOrEqual(r.to);
  });
  it("states the gap in the selection the figures and the chart both show", () => {
    expect(longestGap(D.readers)).toEqual({ from: 430, to: 1260, years: 830 });
  });
  it("gives each reader every answer, a verse in the passage, and all three parts", () => {
    for (const r of D.readers) {
      for (const q of D.questions) expect(r.answers[q.id].length, `${r.id} ${q.id}`).toBeGreaterThan(3);
      expect(PASSAGE, r.id).toContain(r.fasten.verse);
      for (const field of [r.evidence, r.inference, r.limit, r.looking, r.quote, r.gloss]) expect(field.length, r.id).toBeGreaterThan(10);
      expect(D.lanes.map((l) => l.id), r.id).toContain(r.lane);
    }
  });
  it("cites only sources it lists, each saying what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(5);
    const cited = [...D.readers.flatMap((r) => r.sources), ...D.claims.flatMap((c) => c.sources), ...D.targets.map((t) => t.source), ...D.targetsNote.sources, ...D.senses.sets.map((s) => s.source), D.senses.rhyme.source, D.senses.tyndale.source];
    for (const id of cited) expect(sourceById.has(id), id).toBe(true);
  });
  it("links outside the site only by https, and inside the site only to a local path", () => {
    for (const s of D.sources) expect(internal(s.url) || EXTERNAL.test(s.url), s.id).toBe(true);
    for (const p of D.pictures) for (const link of [p.href, p.licenceUrl, p.record?.href ?? p.href]) expect(EXTERNAL.test(link), p.id).toBe(true);
    for (const r of D.readers) if (r.profile) expect(internal(r.profile.href), r.id).toBe(true);
    expect(internal(D.baptist.confession.href)).toBe(true);
  });
  it("has a Berean text for every verse it lists", () => {
    for (const { label } of D.verses) expect(scripture(label).length, label).toBeGreaterThan(10);
    for (const label of PASSAGE) expect(verseByLabel.has(label), label).toBe(true);
  });
  it("gives each test exactly one supported answer", () => {
    expect(D.claims).toHaveLength(4);
    for (const claim of D.claims) expect(claim.test.options.filter((o) => o.right), claim.id).toHaveLength(1);
    expect(D.senses.test.options.filter((o) => o.right)).toHaveLength(1);
  });
  it("keeps the facts the page leans on", () => {
    expect(CR.word).toEqual({ tag: "G238", times: 1, kingJames: "allegory", greek: "ἀλληγορούμενα" });
    expect(scripture("Galatians 4:24")).toContain("serve as illustrations");
    expect(scripture("Galatians 4:30")).toContain("Expel the slave woman");
    expect(scripture("Psalm 147:12")).toContain("Exalt the LORD, O Jerusalem");
    expect(sourceCounts(D.sources).whole).toBe(1);
  });
  it("names the works it could not open as located or second-hand, and Russell as reported", () => {
    for (const id of ["located-betz", "located-hays", "located-lubac"]) expect(sourceById.get(id)?.status, id).toBe("located");
    for (const id of ["located-russell", "located-clark"]) expect(sourceById.get(id)?.status, id).toBe("second-hand");
    expect(readerById.get("russell")!.work).toContain("second-hand");
  });
  it("stays within the record's budget", () => {
    expect(statSync(resolve(process.cwd(), "content/academic-research/30-how-the-church-has-read-the-bible.json")).size).toBeLessThanOrEqual(RECORD_BUDGET);
  });
});

describe("How the church has read the Bible: its pictures", () => {
  it("credits each one with a licence and a link", () => {
    for (const p of D.pictures) {
      for (const field of [p.credit, p.licence, p.licenceUrl, p.href, p.retrieved, p.alt]) expect(field.length, p.id).toBeGreaterThan(2);
      expect(["CC0", "Public domain"], p.id).toContain(p.licence);
      expect(p.width, p.id).toBeGreaterThan(0);
    }
    for (const claim of D.claims) if (claim.picture) expect(pictureById.has(claim.picture), claim.id).toBe(true);
  });
  it("names the catalogue number and the keeper of each real object", () => {
    expect(pictureById.get("leaf")!.credit).toContain("Latin 312");
    expect(pictureById.get("leaf")!.record!.href).toContain("gallica.bnf.fr");
    expect(pictureById.get("lyra")!.credit).toContain("2011.20.4");
    expect(pictureById.get("lyra")!.href).toContain("metmuseum.org");
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

describe("How the church has read the Bible: its place on the site", () => {
  it("has a card in Christian thought & church history, drawn as a full study", () => {
    const area = STUDY_BRANCHES.academic.areas.find((a) => a.id === "church")!;
    expect(area.items.find((i) => i.href === HREF)?.kind).toBe("Study");
    const cards = readFileSync(resolve(process.cwd(), "src/pages/study/hub/AcademicCards.tsx"), "utf-8");
    expect(cards).toContain(`'${HREF}'`);
    expect(cards).toContain(`href==='${HREF}'`);
  });
  it("has its route", () => {
    expect(readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf-8")).toContain(`path="${HREF}"`);
  });
});
