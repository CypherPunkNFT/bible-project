// The Resources data files load and have the shape the three section pages read (src/data/resources/index.ts).
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { FellowshipsData, Help, LearningData, LifeData, UsStates } from "./index";

const DIR = path.resolve(__dirname);
const PUBLIC = path.resolve(__dirname, "../../../public");
const read = <T,>(name: string): T | null => { const file = path.join(DIR, `${name}.json`); return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) as T : null; };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\/\S+$/;

function expectHelp(e: Help, where: string) {
  expect(e.id, where).toBeTruthy();
  expect(e.name, `${where} name`).toBeTruthy();
  expect(e.summary, `${e.id} summary`).toBeTruthy();
  expect(e.source, `${e.id} source`).toMatch(URL_RE);
  expect(e.checked, `${e.id} checked`).toMatch(DATE);
  expect(Array.isArray(e.contact), `${e.id} contact`).toBe(true);
  expect([true, false, null, undefined], `${e.id} faith`).toContain(e.faith);
  for (const c of e.contact) { expect(c.kind, `${e.id} contact kind`).toBeTruthy(); expect(c.value, `${e.id} contact value`).toBeTruthy(); }
}

describe("learning.json", () => {
  const data = read<LearningData>("learning");
  it("lists workbooks whose PDFs and covers exist in public/", () => {
    expect(data?.items.length).toBeGreaterThan(0);
    for (const w of data!.items) {
      expect(w.sessions).toBeGreaterThan(0);
      expect(w.pages).toBeGreaterThan(0);
      expect(w.checked).toMatch(DATE);
      for (const file of [w.pdf.a4, w.pdf.letter, w.cover]) expect(fs.existsSync(path.join(PUBLIC, file)), `${w.id}: ${file}`).toBe(true);
      for (const address of w.builtFrom) expect(address).toMatch(/^\/people\/[a-z0-9-]+(\/(rule|mission|word))?$/);
    }
  });
});

describe("fellowships.json", () => {
  const data = read<FellowshipsData>("fellowships");
  it.skipIf(!data)("has groups of fellowships, each with who it is for, how it meets and its source", () => {
    expect(data!.checked).toMatch(DATE);
    expect(data!.groups.length).toBeGreaterThan(0);
    const ids = new Set<string>();
    for (const g of data!.groups) {
      expect(g.title).toBeTruthy();
      expect(g.entries.length, g.id).toBeGreaterThan(0);
      for (const f of g.entries) {
        expect(ids.has(f.id), `duplicate ${f.id}`).toBe(false); ids.add(f.id);
        expect(f.name && f.summary, f.id).toBeTruthy();
        expect(f.for.length, `${f.id} for`).toBeGreaterThan(0);
        expect(f.meets.length, `${f.id} meets`).toBeGreaterThan(0);
        expect(f.source, f.id).toMatch(URL_RE);
        expect(f.checked, f.id).toMatch(DATE);
        for (const link of [f.locator, f.faith]) if (link) expect(link, f.id).toMatch(URL_RE);
      }
    }
  });
});

describe("life.json", () => {
  const data = read<LifeData>("life");
  it.skipIf(!data)("has national groups and cities whose places carry an address and a location", () => {
    expect(data!.checked).toMatch(DATE);
    expect(data!.groups.length).toBeGreaterThan(0);
    for (const g of data!.groups) for (const e of g.entries) expectHelp(e, g.id);
    for (const c of data!.cities) {
      expect(c.name, c.id).toBeTruthy();
      expect([true, false, undefined], `${c.id} verified`).toContain(c.verified);
      expect(Math.abs(c.lat), c.id).toBeLessThanOrEqual(90);
      for (const e of c.entries) {
        expectHelp(e, c.id);
        expect(e.category && e.address, e.id).toBeTruthy();
        expect(Number.isFinite(e.lat) && Number.isFinite(e.lon), `${e.id} lat/lon`).toBe(true);
      }
      for (const line of c.lines ?? []) { expectHelp(line, c.id); expect(line.contact.length, line.id).toBeGreaterThan(0); }
    }
  });
});

describe("us-states.json", () => {
  it("holds the fifty states and DC as drawn paths with the projection's numbers", () => {
    const data = read<UsStates>("us-states")!;
    expect(data.states).toHaveLength(51);
    expect(data.scale).toBeGreaterThan(0);
    expect(data.translate).toHaveLength(2);
    for (const s of data.states) expect(s.d, s.id).toMatch(/^M/);
  });
});
