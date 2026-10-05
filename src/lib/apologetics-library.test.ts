import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DEBATES, PATHS, PRACTICE, SOURCES, STUDIES, TOPICS, WORLDVIEWS } from "@/data/apologetics-library";
import type { Catalog, Chapter } from "./types";
import type { ApCitation } from "@/data/apologetics-types";

const studyBlocks = STUDIES.flatMap((study) => [
  { owner: study.id + "/answer", citations: study.support.answer },
  ...study.support.reasoning.map((citations, i) => ({ owner: study.id + "/reasoning/" + i, citations })),
  { owner: study.id + "/conclusion", citations: study.support.conclusion },
  ...study.support.sections.map((citations, i) => ({ owner: study.id + "/section/" + i, citations })),
  ...(["reply", "limit", "prompt"] as const).map((key) => ({ owner: study.id + "/" + key, citations: study.support[key] })),
]);
const supportedBlocks: { owner: string; citations: ApCitation[] }[] = [...studyBlocks,
  ...WORLDVIEWS.flatMap((item) => item.rows.flatMap((row) => [
    { owner: item.id + "/" + row.study + "/christian", citations: row.christianBasis },
    { owner: item.id + "/" + row.study + "/other", citations: row.otherBasis },
  ])),
  ...PRACTICE.map((item) => ({ owner: "practice/" + item.id, citations: item.basis })),
];

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

  it("requires traceable support for every substantive block and distinguishes authority from records", () => {
    for (const { owner, citations } of supportedBlocks) {
      expect(citations.length, owner).toBeGreaterThan(0);
      for (const citation of citations) if (citation.kind === "source") {
        expect(SOURCES.some((item) => item.id === citation.source), owner + ": " + citation.source).toBe(true);
        expect(citation.locator.trim().length, owner).toBeGreaterThan(0);
      }
    }
    for (const study of STUDIES) {
      expect(study.support.reasoning.length, study.id).toBe(study.reasoning.length);
      expect(study.support.sections.length, study.id).toBe(study.sections.length);
      expect(study.sources.some((id) => SOURCES.find((source) => source.id === id)?.role.startsWith("Reformed")), study.id).toBe(true);
      const sources = studyBlocks.filter((item) => item.owner.startsWith(study.id + "/")).flatMap((item) => item.citations).flatMap((item) => item.kind === "source" ? [item.source] : []);
      expect(new Set(sources), study.id).toEqual(new Set(study.sources));
    }
    for (const source of SOURCES) {
      expect(source.note.length, source.id).toBeGreaterThan(30);
      expect(source.role, source.id).toBeTruthy();
      if (source.id.startsWith("q") || source.id.startsWith("craig-") || source.id === "humanism") expect(source.role).toBe("Primary record · not a teaching authority");
    }
    expect(SOURCES.find((item) => item.id === "aquinas")?.role).toBe("Catholic contribution · limited scope");
  });

  it("every Scripture citation opens real KJV verses with ordered same-book endpoints", () => {
    const catalog: Catalog = JSON.parse(readFileSync("data/catalog.json", "utf8"));
    const kjv = catalog.translations.find((item) => item.slug === "kjv")!;
    const passages = [...STUDIES.flatMap((study) => study.refs.map(({ span }) => ({ owner: study.id, span }))), ...supportedBlocks.flatMap(({ owner, citations }) => citations.flatMap((citation) => citation.kind === "scripture" ? [{ owner, span: citation.span }] : []))];
    for (const { owner, span } of passages) {
      expect(span[1], owner).toBeGreaterThanOrEqual(span[0]);
      expect(Math.floor(span[1] / 1e6), owner).toBe(Math.floor(span[0] / 1e6));
      for (const id of span) {
        const book = catalog.books.find((item) => item.num === Math.floor(id / 1e6))!;
        const chapter = String(Math.floor(id / 1000) % 1000);
        const index = kjv.books[book.code].indexOf(chapter);
        expect(index, owner + ": " + id).toBeGreaterThanOrEqual(0);
        const chunk: Record<string, Chapter> = JSON.parse(readFileSync(`data/text/kjv/${book.code}/${Math.floor(index / 5)}.json`, "utf8"));
        expect(chunk[chapter].v.some((verse) => Number(verse.n) === id % 1000), owner + ": " + id).toBe(true);
      }
    }
  });
});
