import { readFileSync } from "node:fs";
import { join } from "node:path";
import progress from "../../../../content/studies/progress.json";
import { parseDraft, readingBooks, type Block, type DraftDoc } from "./draft-parse";
import numbers from "./draft-numbers.json";

const root = join(__dirname, "../../../../content/studies");
const values = numbers as Record<string, Record<string, string>>;
const slugOf = (path: string) => path.split("/")[1];
const drafts = progress.items.map(item => ({ item, doc: parseDraft(readFileSync(join(root, item.contentPath), "utf-8"), item.title, values[slugOf(item.contentPath)]) }));
const allBlocks = (doc: DraftDoc): Block[] => [...doc.intro, ...doc.sections.flatMap(section => section.blocks)];

describe("every draft reads as a study page", () => {
  it.each(drafts.map(d => [d.item.number, d.item.title, d.doc] as const))("draft %i %s", (_n, _title, doc) => {
    expect(doc.title.length).toBeGreaterThan(2);
    expect(doc.lead?.length ?? 0).toBeGreaterThan(20);
    const readings = doc.sections.filter(section => section.kind === "reading");
    expect(readings.length).toBeGreaterThanOrEqual(5);
    for (const section of readings) {
      const exercise = section.blocks.some(block => block.kind === "prompt" && block.label === "Reading exercise");
      expect((section.readings?.length ?? 0) > 0 || exercise, `section ${section.number} has its readings`).toBe(true);
      expect(section.blocks.length, `section ${section.number} has text`).toBeGreaterThan(2);
    }
    expect(doc.sections.filter(section => section.kind === "close").length).toBeLessThanOrEqual(1);
    expect(new Set(doc.sections.map(section => section.id)).size).toBe(doc.sections.length);
    // No status line, slug or raw markup left in the text a reader sees.
    for (const block of allBlocks(doc)) {
      const text = "text" in block ? block.text : "";
      expect(text, "status line removed").not.toMatch(/(First content draft|Owner review pending)/);
      expect(text, "no raw tags").not.toMatch(/^\[[a-z]+(:[^\]]*)?\]/);
      expect(JSON.stringify(block), "every {{placeholder}} filled (scripts/build-draft-numbers.py)").not.toMatch(/\{\{\w+\}\}/);
      if (block.kind === "field") expect(["Slug", "Ask", "Hook", "Read", "Consider", "Reflect", "Concepts", "Motto"]).not.toContain(block.label);
    }
    expect(doc.concepts.length > 0 || readingBooks(doc).length > 0, "a line of page words").toBe(true);
    expect(`${doc.title} ${doc.motto ?? ""} ${doc.lead} ${doc.selection ?? ""}`, "heading placeholders filled").not.toMatch(/\{\{/);
  });

  it("reads the opening tagline of the plain drafts as their motto", () => {
    const mottos = drafts.filter(d => d.doc.concepts.length === 0 && d.doc.motto).map(d => d.item.number);
    expect(mottos).toEqual(expect.arrayContaining([2, 8, 12, 13]));
    expect(drafts.find(d => d.item.number === 2)?.doc.motto).toBe("Receiving one another. Caring for one another. Growing together in Christ.");
  });

  it("keeps the motto, questions and close of the rewritten drafts", () => {
    const rewritten = drafts.filter(d => d.doc.concepts.length > 0);
    expect(rewritten).toHaveLength(17);
    for (const { doc } of rewritten) {
      expect(doc.motto, doc.title).toBeTruthy();
      expect(doc.sections.some(section => section.kind === "question" || section.kind === "close"), doc.title).toBe(true);
    }
  });
});
