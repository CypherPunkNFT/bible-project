import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GOSPEL_PORTRAITS, PORTRAIT_GOSPELS } from "@/data/gospel-portraits";
import { gospelOrder, matchingPortraitEvents, passagePosition, passageVerseCount, portraitEvents } from "./gospel-portraits";
import { splitId } from "./refs";
import type { Harmony } from "./study";
import type { Stats } from "./types";

const harmony = JSON.parse(readFileSync("data/study/harmony.json", "utf8")) as Harmony;
const stats = JSON.parse(readFileSync("data/stats.json", "utf8")) as Stats;
const events = portraitEvents(harmony);
const book = (code: string) => stats.books.find((b) => b.code === code)!;

describe("Gospel portraits use the actual text and preserve narrative order", () => {
  it("provides eight distinct guides attached to real passages", () => {
    expect(GOSPEL_PORTRAITS).toHaveLength(8);
    expect(new Set(GOSPEL_PORTRAITS.map((g) => g.event)).size).toBe(8);
    for (const guide of GOSPEL_PORTRAITS) {
      const event = events.find((e) => e.n === guide.event)!;
      expect(event).toBeDefined();
      expect(Object.keys(guide.observations).sort()).toEqual(Object.keys(event.refs).filter((key) => key !== "also").sort());
    }
  });
  it("places all harmony passage endpoints within their Gospel", () => {
    for (const gospel of PORTRAIT_GOSPELS) {
      const text = JSON.parse(readFileSync(`data/plain/kjv/${gospel.key}.json`, "utf8")) as Record<string, string>;
      for (const event of gospelOrder(events, gospel.key)) for (const span of event.refs[gospel.key]!) {
        for (const id of span) {
          const ref = splitId(id);
          expect(text[`${ref.chapter}:${ref.verse}`], `${event.n}: ${gospel.key} ${ref.chapter}:${ref.verse}`).toBeDefined();
        }
        const position = passagePosition(span, book(gospel.key));
        expect(position.start).toBeGreaterThanOrEqual(0);
        expect(position.end).toBeLessThanOrEqual(1);
        expect(position.count).toBeGreaterThan(0);
      }
    }
  });
  it("uses real chapter lengths across chapter boundaries and deduplicates overlaps", () => {
    expect(passageVerseCount([[40005001, 40007029]], book("MAT"))).toBe(111);
    expect(passageVerseCount([[40003013, 40003017], [40003015, 40003017]], book("MAT"))).toBe(5);
    expect(passagePosition([40001001, 40028020], book("MAT"))).toEqual({ start: 0, end: 1, count: book("MAT").verses });
  });
  it("retains John's different narrative placement of the anointing", () => {
    for (const code of ["MAT", "MRK"] as const) {
      const ordered = gospelOrder(events, code);
      expect(ordered.findIndex((e) => e.n === "141")).toBeGreaterThan(ordered.findIndex((e) => e.n === "128b"));
    }
    const john = gospelOrder(events, "JHN");
    expect(john.findIndex((e) => e.n === "141")).toBeLessThan(john.findIndex((e) => e.n === "128b"));
  });
  it("filters by recorded coverage without counting non-Gospel references", () => {
    expect(matchingPortraitEvents(events, "five thousand", "four").map((e) => e.n)).toEqual(["72"]);
    expect(matchingPortraitEvents(events, "five thousand", "one")).toEqual([]);
    expect(matchingPortraitEvents(events, "31", "one").some((e) => e.n === "31")).toBe(true);
  });
});
