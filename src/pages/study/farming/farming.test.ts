import { bsbWords } from "@/lib/bsb-for-tests";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PARABLES } from "@/data/parables";
import { arcPath, D, DEFAULT_PASSAGE, DEFAULT_SEASON, findOpened, findPassage, findSeason, FY, monthBars, monthSpan, pictureById, readerHref, readingTag, seasonById, sourceById, verseByLabel, wheelPoint } from "./model";

const IMAGE_BUDGET = 150_000;
const SET_BUDGET = 1_000_000;
const RECORD_BUDGET = 90_000;
const EXTERNAL = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i;
const allHearerItems = D.hearers.flatMap((g) => g.items);

describe("The farming year study: its rules", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref("RUT", 1, 22)).toBe("/read/bsb/RUT/1?hl=22-22");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of ["__proto__", "constructor", "job:__proto__", "job:nope", "job:", "", "<script>"]) {
      expect(findOpened(bad)).toBeNull();
      expect(findSeason(bad).id).toBe(DEFAULT_SEASON);
      expect(findPassage(bad).id).toBe(DEFAULT_PASSAGE);
    }
    expect(findOpened(null)).toBeNull();
  });
  it("opens each job only by its own key", () => {
    for (const job of D.jobs) expect(findOpened(`job:${job.id}`)).toEqual(job);
    expect(findOpened("plough")).toBeNull();
  });
  it("says what was read of every status it uses", () => {
    expect(new Set(D.sources.map((s) => readingTag(s.status)))).toEqual(new Set(["read", "part read", "reported second-hand", "located, not read"]));
  });
  it("draws the year clockwise from the top, and closes the last season at the first", () => {
    const [topX, topY] = wheelPoint(0, 100), [rightX, rightY] = wheelPoint(3, 100);
    expect(topX).toBeCloseTo(200);
    expect(topY).toBeCloseTo(100);
    expect(rightX).toBeCloseTo(300);
    expect(rightY).toBeCloseTo(200);
    expect(monthSpan(seasonById.get("summer")!)).toBe("mid-Aug to mid-Sep");
    for (const s of D.seasons) expect(arcPath(s.start, s.months, 164, 106), s.id).not.toContain("NaN");
  });
  it("merges touching seasons into one bar and keeps apart seasons that do not touch", () => {
    expect(monthBars(["barley", "harvest"])).toEqual([{ start: 7, months: 2 }]);
    expect(monthBars(["ingather", "barley", "harvest"])).toEqual([{ start: 0, months: 2 }, { start: 7, months: 2 }]);
    expect(monthBars(["nope"])).toEqual([]);
  });
});

describe("The farming year study: its research record", () => {
  it("adds up: seven lines, eight seasons, twelve months", () => {
    expect(D.lines).toHaveLength(7);
    expect(D.seasons).toHaveLength(8);
    expect(D.seasons.reduce((sum, s) => sum + s.months, 0)).toBe(12);
    expect(D.jobs).toHaveLength(10);
    expect(D.clock).toHaveLength(8);
    expect(allHearerItems).toHaveLength(14);
    expect(D.reach[0]).toContain("ten jobs, eight passages");
    expect(D.reach[0]).toContain("fourteen passages");
  });
  it("names only seasons it has", () => {
    const named = [...D.lines.flatMap((l) => l.seasons), ...D.clock.flatMap((c) => [...c.seasons, ...(c.chords ?? []).flat()]), ...D.jobs.flatMap((j) => j.seasons), ...allHearerItems.flatMap((i) => i.seasons)];
    for (const id of named) expect(seasonById.has(id), id).toBe(true);
  });
  it("cites only sources it lists, each saying what was read", () => {
    for (const s of D.sources) expect(s.read.length, s.id).toBeGreaterThan(10);
    const cited = [...D.seasons.flatMap((s) => s.sources), ...D.placing.sources, ...D.jobs.flatMap((j) => j.sources), ...D.claims.flatMap((c) => c.sources), ...allHearerItems.flatMap((i) => i.sources)];
    for (const id of cited) expect(sourceById.has(id), id).toBe(true);
  });
  it("links outside the site only by https, and inside the site only to a local path", () => {
    for (const s of D.sources) expect(s.url.startsWith("/") ? /^\/(?!\/)/.test(s.url) : EXTERNAL.test(s.url), s.id).toBe(true);
    for (const p of D.pictures) {
      expect(EXTERNAL.test(p.href), p.id).toBe(true);
      expect(EXTERNAL.test(p.licenceUrl), p.id).toBe(true);
    }
    for (const g of D.hearers) expect(/^\/(?!\/)/.test(g.link.href), g.id).toBe(true);
  });
  it("uses every verse it lists, and has a Berean text for every verse it uses", () => {
    const used = new Set([...D.seasons.map((s) => s.sameWord.verse), ...D.clock.flatMap((c) => c.verses), ...D.jobs.flatMap((j) => j.verses), ...allHearerItems.map((i) => i.verse), ...D.claims.flatMap((c) => c.verses)]);
    for (const label of used) expect(bsbWords(verseByLabel.get(label)!).length, label).toBeGreaterThan(10);
    for (const { label } of D.verses) expect(used.has(label), label).toBe(true);
  });
  it("gives each evidence mark a kind it knows, and explains every use of the ground", () => {
    const kinds = new Set(D.evidenceKinds.map((k) => k.id));
    for (const job of D.jobs) {
      for (const kind of job.witness) expect(kinds.has(kind), job.id).toBe(true);
      expect(Boolean(job.groundNote), job.id).toBe(job.witness.includes("ground"));
    }
  });
  it("gives each test exactly one supported answer", () => {
    expect(D.claims).toHaveLength(3);
    for (const claim of D.claims) expect(claim.test.options.filter((o) => o.right), claim.id).toHaveLength(1);
  });
  it("links each farm scene to a parable that exists, and interprets none itself", () => {
    const parables = new Set(PARABLES.map((p) => p.id));
    const scenes = D.hearers.find((g) => g.id === "parables")!.items;
    expect(scenes).toHaveLength(6);
    for (const item of scenes) {
      expect(parables.has(item.parable!), item.id).toBe(true);
      expect(item.knew, item.id).not.toMatch(/\b(kingdom|teaches|means that|represents|symboli[sz]es)\b/i);
    }
  });
  it("keeps the facts the page leans on", () => {
    expect(FY.harvestTags).toBeGreaterThan(40);
    expect(FY.threshingFloorTags).toBeGreaterThan(20);
    expect(bsbWords(verseByLabel.get("Ruth 1:22")!)).toContain("barley");
    expect(bsbWords(verseByLabel.get("Amos 8:2")!)).toContain("summer fruit");
    expect(bsbWords(verseByLabel.get("Isaiah 28:25")!)).toContain("barley");
  });
  it("names the works it could not open as located, not read", () => {
    for (const id of ["borowski", "gezer-plants", "atiqot", "peq-oil", "koller"]) expect(sourceById.get(id)?.status, id).toBe("located");
  });
  it("stays within the record's budget", () => {
    expect(statSync(resolve(process.cwd(), "content/academic-research/29-the-farming-year.json")).size).toBeLessThanOrEqual(RECORD_BUDGET);
  });
});

describe("The farming year study: its pictures", () => {
  it("credits each one with a licence and a link", () => {
    for (const p of D.pictures) {
      for (const field of [p.credit, p.licence, p.licenceUrl, p.href, p.retrieved, p.alt]) expect(field.length, p.id).toBeGreaterThan(2);
      expect(["CC0", "Public domain"], p.id).toContain(p.licence);
      expect(p.width, p.id).toBeGreaterThan(0);
    }
    for (const job of D.jobs) for (const id of [job.picture, job.picture2]) if (id) expect(pictureById.has(id), job.id).toBe(true);
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
