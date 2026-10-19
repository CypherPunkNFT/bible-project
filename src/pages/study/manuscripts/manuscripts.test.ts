import { existsSync, readFileSync } from "node:fs";
import type { ManuscriptCollection, MsRecord } from "@/lib/manuscripts";
import { fitAxis, hash, lanesData, LANES, type Lane } from "./lanes-layout";
import { booksText, buildIndex, byDate, holderText, KINDS, kindOf, ranges, sigla, yearText } from "./model";
import { SHELVES } from "./leads";
import { cityTable, holderKind } from "./places-model";

// The pure helpers are always tested. The data assertions need `bun run manuscripts`, whose output lives in the
// git-ignored data/ folder like all the site's data, so they are skipped where it is absent.
const built = existsSync("data/manuscripts/collection.json");
const record = (fields: Partial<MsRecord>): MsRecord => ({ i: "Q1", n: "Test", k: "papyrus", L: ["papyrus"], src: "wd", ...fields });

describe("words for dates, sigla and chapters", () => {
  it.each([[-249, "250 BC"], [-1, "2 BC"], [125, "AD 125"], [1008, "1008"]])("year %d reads %s", (year, text) => expect(yearText(year)).toBe(text));
  it("keeps a siglum only when the name does not already say it", () => {
    expect(sigla(record({ n: "Codex Sinaiticus", g: "01" }))).toBe("01");
    expect(sigla(record({ n: "Papyrus 52", g: "P52" }))).toBe("");
  });
  it("joins runs of chapters", () => expect(ranges([1, 2, 3, 5, 7, 8])).toBe("1–3, 5, 7–8"));
  it("puts undated records last, oldest first before them", () => {
    const list = [record({ i: "a", n: "B" }), record({ i: "b", n: "A", e: 300, l: 400 }), record({ i: "c", n: "C", e: 100, l: 200 })].sort(byDate);
    expect(list.map((r) => r.i)).toEqual(["c", "b", "a"]);
  });
  it("knows every lane's kind and fails loudly on an unknown one", () => {
    for (const [key] of LANES) expect(kindOf(key).key).toBe(key);
    expect(() => kindOf("klingon")).toThrow(/klingon/);
  });
});

describe("Through time", () => {
  it("hashes the same string to the same place", () => expect(hash("Q152962x")).toBe(hash("Q152962x")));
  it("cuts empty years out of an opened lane's axis", () => {
    const lane = { dots: [{ v: 100 }, { v: 110 }, { v: 900 }] } as unknown as Lane;
    const axis = fitAxis(lane, 800);
    expect(axis?.breaks.length).toBe(1);
    expect(axis!.map(100)).toBeLessThan(axis!.map(900));
  });
});

describe("holders", () => {
  it.each([["Saint Catherine's Monastery", "monastery"], ["Grottaferrata Abbey Library", "monastery"], ["Cambridge University Library", "library"],
    ["Qubbat al-Khazna", "treasury"], ["Harvard University", "university"], ["Berlin State Museums and Library", "museum"]])("%s is a %s", (name, kind) => {
    expect(holderKind(name)[0]).toBe(kind);
  });
});

describe.skipIf(!built)("the built collection", () => {
  const data = built ? JSON.parse(readFileSync("data/manuscripts/collection.json", "utf8")) as ManuscriptCollection : null;
  const index = data ? buildIndex(data) : null;
  it("files every record under a known kind, with unique ids", () => {
    const keys = new Set(KINDS.map((k) => k.key));
    expect(data!.records.every((r) => keys.has(r.k) && r.L.every((l) => keys.has(l)))).toBe(true);
    expect(new Set(data!.records.map((r) => r.i)).size).toBe(data!.records.length);
  });
  it("names a placed holder for every holder id, and a picture with a licence for every picture key", () => {
    for (const r of data!.records) {
      expect(() => holderText(index!, r)).not.toThrow();
      if (r.im) expect(data!.images[r.im]?.lic, r.i).toBeTruthy();
    }
  });
  it("holds every witness on the shelf, and every lane has its kind", () => {
    for (const [, , ids] of SHELVES) for (const id of ids) expect(index!.byId.has(id), id).toBe(true);
    expect(lanesData(data!.records)).toHaveLength(LANES.length);
  });
  it("shows the corrected contents of Codex Vaticanus", () => {
    expect(booksText(index!, index!.byId.get("Q209285")!)).not.toContain("whole New Testament");
  });
  it("places every holder in a city on the map", () => {
    const cities = cityTable(data!);
    expect(cities.reduce((n, c) => n + c.holders.length, 0)).toBe(data!.holders.length);
  });
});
