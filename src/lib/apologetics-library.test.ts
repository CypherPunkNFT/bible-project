import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEBATES, PATHS, PRACTICE, SOURCES, STUDIES, TOPICS, WORLDVIEWS } from "@/data/apologetics-library";
import type { Catalog, Chapter } from "./types";

describe("the connected apologetics library", () => {
  it("has unique destinations and resolves every collection, related study and source", () => {
    const studies = new Set(STUDIES.map((item) => item.id));
    const sources = new Set(SOURCES.map((item) => item.id));
    const topics = new Set<string>(TOPICS.map((item) => item.id));
    for (const collection of [STUDIES, SOURCES, TOPICS, PATHS, WORLDVIEWS, DEBATES, PRACTICE]) {
      expect(new Set(collection.map((item) => item.id)).size).toBe(collection.length);
      for (const item of collection) expect(item.id).toMatch(/^[a-z0-9-]+$/);
    }
    for (const study of STUDIES) {
      expect(topics.has(study.topic), study.id).toBe(true);
      expect(study.refs.length, study.id).toBeGreaterThan(0);
      expect(study.reasoning.length, study.id).toBeGreaterThan(1);
      expect(study.related.includes(study.id), study.id).toBe(false);
      for (const id of study.related) expect(studies.has(id), study.id + " → " + id).toBe(true);
      for (const id of study.sources) expect(sources.has(id), study.id + " → " + id).toBe(true);
    }
    for (const collection of [...PATHS, ...WORLDVIEWS, ...DEBATES]) {
      expect(collection.studies.length).toBeGreaterThan(0);
      for (const id of collection.studies) expect(studies.has(id), collection.id + " → " + id).toBe(true);
    }
    for (const worldview of WORLDVIEWS) {
      for (const row of worldview.rows) expect(studies.has(row.study)).toBe(true);
      for (const source of worldview.sources) expect(sources.has(source)).toBe(true);
    }
    for (const debate of DEBATES) expect(sources.has(debate.source)).toBe(true);
    for (const scenario of PRACTICE) {
      expect(studies.has(scenario.study)).toBe(true);
      expect(scenario.options[scenario.best]).toBeTruthy();
    }
    for (const source of SOURCES) expect(new URL(source.url).protocol).toBe("https:");
    for (const topic of TOPICS) expect(STUDIES.some((study) => study.topic === topic.id)).toBe(true);
  });

  it("every Scripture span opens real KJV verses with ordered same-book endpoints", () => {
    const catalog: Catalog = JSON.parse(readFileSync("data/catalog.json", "utf8"));
    const kjv = catalog.translations.find((item) => item.slug === "kjv")!;
    for (const study of STUDIES) for (const { span } of study.refs) {
      expect(span[1], study.id).toBeGreaterThanOrEqual(span[0]);
      expect(Math.floor(span[1] / 1e6), study.id).toBe(Math.floor(span[0] / 1e6));
      for (const id of span) {
        const book = catalog.books.find((item) => item.num === Math.floor(id / 1e6))!;
        const chapter = String(Math.floor(id / 1000) % 1000);
        const index = kjv.books[book.code].indexOf(chapter);
        expect(index, study.id + ": " + id).toBeGreaterThanOrEqual(0);
        const chunk: Record<string, Chapter> = JSON.parse(readFileSync(`data/text/kjv/${book.code}/${Math.floor(index / 5)}.json`, "utf8"));
        expect(chunk[chapter].v.some((verse) => Number(verse.n) === id % 1000), study.id + ": " + id).toBe(true);
      }
    }
  });
});
