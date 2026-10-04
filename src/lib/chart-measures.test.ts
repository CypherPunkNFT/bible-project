import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PROPHECY_PASSAGES, SECTION_INSIGHTS, TEACHINGS } from "@/data/chart-insights";
import { APOLOGETICS_ANCHOR, CONVERSATION_STEPS, FOUNDATIONS } from "@/data/apologetics";
import { buildStudyMeasures, entriesBySection } from "./chart-measures";
import type { BookInfo, Catalog, Chapter } from "./types";
import type { Harmony, Miracles, NamesOfGod, Span } from "./study";

const read = <T,>(path: string): T => JSON.parse(readFileSync("data/" + path, "utf8")) as T;

describe("section study measures", () => {
  it("counts a shared event once per section, across parallel accounts and repeated references", () => {
    const books = [{ num: 40, section: "gospels" }, { num: 42, section: "gospels" }, { num: 19, section: "poetry" }] as BookInfo[];
    const entry = { title: "One event", refs: [[40001001, 40001002], [42001001, 42001002], [19001001, 19001002], [19001001, 19001002]] as Span[] };
    const grouped = entriesBySection([entry], books);
    expect(grouped.get("gospels")).toEqual([entry]);
    expect(grouped.get("poetry")).toEqual([entry]);
    expect(grouped.size).toBe(2);
  });

  it("preserves the source lists, excludes evil agents and resolves every miracle to a passage", () => {
    const harmony = read<Harmony>("study/harmony.json");
    const miracles = read<Miracles>("study/miracles.json");
    const names = read<NamesOfGod>("study/names.json");
    const result = buildStudyMeasures(harmony, miracles, names);
    expect(result.miracles.length).toBe(35 + miracles.servants.reduce((n, g) => n + g.items.length, 0));
    expect(result.miracles.every((m) => m.refs.length > 0)).toBe(true);
    expect(result.episodes.length).toBe(harmony.parts.reduce((n, p) => n + p.sections.length, 0));
    expect(result.names.length).toBe(names.groups.reduce((n, g) => n + g.names.length, 0));
    expect(result.prophecies).toHaveLength(21);
  });

  it("every editorial passage has valid KJV endpoints and an ordered same-book range", () => {
    const catalog = read<Catalog>("catalog.json");
    const kjv = catalog.translations.find((t) => t.slug === "kjv")!;
    const spans = [...PROPHECY_PASSAGES.flatMap((p) => p.refs), ...TEACHINGS.flatMap((p) => p.refs), ...Object.values(SECTION_INSIGHTS).map((s) => s.ref), APOLOGETICS_ANCHOR, ...CONVERSATION_STEPS.map((s) => s.span), ...FOUNDATIONS.flatMap((f) => f.refs.map((r) => r.span))];
    for (const span of spans) {
      expect(span[1], String(span)).toBeGreaterThanOrEqual(span[0]);
      expect(Math.floor(span[1] / 1e6), String(span)).toBe(Math.floor(span[0] / 1e6));
      for (const id of span) {
        const book = catalog.books.find((b) => b.num === Math.floor(id / 1e6))!;
        const chapter = String(Math.floor(id / 1000) % 1000);
        const index = kjv.books[book.code].indexOf(chapter);
        expect(index, String(id)).toBeGreaterThanOrEqual(0);
        const chunk = read<Record<string, Chapter>>("text/kjv/" + book.code + "/" + Math.floor(index / 5) + ".json");
        expect(chunk[chapter].v.some((v) => Number(v.n) === id % 1000), String(id)).toBe(true);
      }
    }
  });
});
