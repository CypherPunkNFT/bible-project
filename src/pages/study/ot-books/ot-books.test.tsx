import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { plainText } from "@/pages/study/check-notes/checked";
import {
  bareBook, booksCovered, CRITERION_AT, DANIEL_SELF, DATA, DEFAULT_BOOK, findOpened, findOrder, findReferences, findRow, findRuler, HEBREW_ORDER,
  OPENABLE, orderedRows, R, readerHref, REFS, RULERS, rowSlug,
} from "./model";
import { MemoryRouter } from "react-router-dom";
import OtBooksPage from "./OtBooksPage";
import { path as routePath } from "./route";

const RECORD = "content/academic-research/41-how-the-old-testament-books-were-written.json";
const DATA_FILE = "src/pages/study/ot-books/ot-books-data.json";
const BAD = ["__proto__", "constructor", "toString", "v:", "v:Genesis 99:1", "", "<script>", "later:", "self:99"];
const NOT_READING_TEXT = new Set(["checkNotes", "openQuestions"]);

/** Every string the page shows as reading text, with its place in the record: the same walk as the build script's. */
function readingStrings(node: unknown, path = ""): [string, string][] {
  if (typeof node === "string") return [[path, plainText(node)]];
  if (Array.isArray(node)) return node.flatMap((item, i) => readingStrings(item, `${path}[${i}]`));
  if (node && typeof node === "object") {
    return Object.entries(node).filter(([key]) => !(path === "" && NOT_READING_TEXT.has(key))).flatMap(([key, value]) => readingStrings(value, `${path}.${key}`));
  }
  return [];
}

describe("How the Old Testament books were written: its data", () => {
  it("was built from this record: the generated data is not stale", () => {
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), RECORD))).digest("hex")).toBe(DATA.recordHash);
  });
  it("finds exactly the references the build script found, so every reference on the page has its verses", () => {
    const found = new Set(readingStrings(R).flatMap(([path, text]) => findReferences(text, bareBook(path)).map((f) => f.key)));
    expect([...found].sort()).toEqual([...REFS.keys()].sort());
  });
  it("keeps names that are not references as plain words", () => {
    expect(findReferences("John J. Collins (1993) and Bava Batra 14b–15a, Antiquities 10.11.7, Sirach 48:22–25")).toEqual([]);
    expect(findReferences("1 John 2:1").map((f) => f.key)).toEqual(["1 John 2:1"]);
    expect(findReferences("(Genesis 12:10–20; 20; 26:1–11)").map((f) => f.key)).toEqual(["Genesis 12:10–20"]);
    expect(findReferences("Isaiah 53:1 and 6:10").map((f) => f.key)).toEqual(["Isaiah 53:1", "Isaiah 6:10"]);
    expect(findReferences("Isaiah 40–55 and Deuteronomy 34").map((f) => f.key)).toEqual(["Isaiah 40–55", "Deuteronomy 34"]);
    expect(findReferences("(7:2; 8:1)", "Daniel").map((f) => f.key)).toEqual(["Daniel 7:2", "Daniel 8:1"]);
    expect(findReferences("(7:2; 8:1)")).toEqual([]);
  });
  it("gives every reference its Berean words, and opens every one in the Berean reader", () => {
    for (const [key, ref] of REFS) {
      if (ref.verse > 0) expect(ref.lines.length, key).toBeGreaterThan(0);
      for (const [, , text] of ref.lines) expect(text.length, key).toBeGreaterThan(3);
      expect(readerHref(ref), key).toMatch(/^\/read\/bsb\/[A-Z0-9]{3}\/\d+(\?hl=\d+-\d+)?$/);
    }
    expect(readerHref(REFS.get("Exodus 17:14")!)).toBe("/read/bsb/EXO/17?hl=14-14");
    expect(readerHref(REFS.get("Deuteronomy 34")!)).toBe("/read/bsb/DEU/34");
  });
  it("links only inside the site, to studies that exist", () => {
    for (const path of Object.values(DATA.neighbours)) expect(path).toMatch(/^\/study\/[a-z0-9-]+$/);
    for (const source of R.sources) if (source.url) expect(source.url).toMatch(/^https:\/\//);
    expect(routePath).toBe("/study/how-the-old-testament-books-were-written");
  });
  it("stays within its data budget", () => {
    expect(statSync(resolve(process.cwd(), DATA_FILE)).size).toBeLessThanOrEqual(90_000);
  });
});

describe("How the Old Testament books were written: the rulers", () => {
  it("measures each ruler by the Berean's own chapters", () => {
    expect(RULERS.get("five")!.total).toBe(187);
    expect(RULERS.get("isaiah")!.total).toBe(66);
    expect(RULERS.get("daniel")!.total).toBe(12);
  });
  it("puts every mark inside its ruler and has it open a record", () => {
    for (const ruler of RULERS.values()) {
      for (const mark of ruler.marks) {
        expect(mark.chapter, mark.id).toBeGreaterThanOrEqual(1);
        expect(OPENABLE.has(mark.open), mark.id).toBe(true);
      }
      expect(new Set(ruler.marks.map((m) => m.id)).size).toBe(ruler.marks.length);
    }
    expect(RULERS.get("five")!.marks.filter((m) => m.kind === "self")).toHaveLength(R.pentateuch.selfWitness.length);
    expect(RULERS.get("five")!.marks.filter((m) => m.kind === "later")).toHaveLength(R.pentateuch.laterHand.length);
  });
  it("anchors a mark only where the record itself points", () => {
    for (const [id, at] of Object.entries(CRITERION_AT)) expect(plainText(R.documentary.criteria.find((c) => c.id === id)!.theyHold), id).toContain(at);
    for (const at of DANIEL_SELF) expect(R.daniel.lead).toContain(at.slice(7));
    const caseText = plainText(R.isaiah.evidence.find((e) => e.id === "case")!.evidence);
    expect(caseText).toContain("Chapters 40 to 66");
    expect(caseText).toContain("56 to 66");
  });
});

describe("How the Old Testament books were written: the address", () => {
  it("falls back when the address asks for something unknown", () => {
    for (const bad of BAD) {
      expect(findOpened(bad), bad).toBeNull();
      expect(findRuler(bad).id).toBe(DEFAULT_BOOK);
      expect(findRow(bad)).toBeNull();
      expect(findOrder(bad)).toBe("english");
    }
    expect(findOpened(null)).toBeNull();
    expect(findOpened("v:Exodus 17:14")?.kind).toBe("verse");
    expect(findRow("1-and-2-kings")?.book).toBe("1 and 2 Kings");
  });
  it("lists thirty-nine books in thirty-six rows, in both orders", () => {
    expect(R.table.rows).toHaveLength(36);
    expect(booksCovered(R.table.rows)).toBe(39);
    expect([...HEBREW_ORDER].sort()).toEqual(R.table.rows.map((r) => r.book).sort());
    const parts = ["Torah", "Former Prophets", "Latter Prophets", "The Twelve", "Writings"];
    const hebrew = orderedRows("hebrew").map((r) => parts.indexOf(r.part));
    expect(hebrew).toEqual([...hebrew].sort((a, b) => a - b));
    expect(new Set(R.table.rows.map((r) => rowSlug(r.book))).size).toBe(36);
  });
});

describe("How the Old Testament books were written: the page", () => {
  const page = (at = routePath) => render(<MemoryRouter initialEntries={[at]}><OtBooksPage /></MemoryRouter>);
  const openSheet = () => document.querySelector<HTMLElement>(".ob-root .ms-sheet.open:not(.chk-panel)");

  it("opens with the standard heading and every section", () => {
    page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(`${R.title}${R.turn}`);
    for (const id of ["five", "sources", "isaiah", "daniel", "darius", "every-book", "claims", "stops"]) expect(document.getElementById(id), id).not.toBeNull();
    expect(document.querySelectorAll(".ob-ruler")).toHaveLength(3);
    expect(document.querySelector(".ob-failed")).toBeNull();
  });
  it("opens a verse in the sheet in the Berean's words, and closes it on Escape", () => {
    page();
    fireEvent.click(screen.getAllByRole("button", { name: "Exodus 17:14" })[0]);
    const sheet = openSheet();
    expect(sheet).not.toBeNull();
    expect(within(sheet!).getAllByText(/Write this on a scroll as a reminder/)[0]).toBeTruthy();
    act(() => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(openSheet()).toBeNull();
  });
  it("opens a ruler mark's record from the list", () => {
    page();
    fireEvent.click(screen.getAllByRole("button", { name: "His death" })[0]);
    expect(within(openSheet()!).getByText("What the evidence says")).toBeTruthy();
  });
  it("opens a check note from a highlighted passage, one sheet at a time", () => {
    page("/study/how-the-old-testament-books-were-written?open=v:Exodus%2017:14");
    expect(openSheet()).not.toBeNull();
    const mark = document.querySelector<HTMLElement>(".ob-root .chk-mark");
    expect(mark).not.toBeNull();
    fireEvent.click(mark!);
    expect(document.querySelector(".chk-panel.open")).not.toBeNull();
    expect(openSheet()).toBeNull();
    act(() => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(document.querySelector(".chk-panel.open")).toBeNull();
  });
  it("shows the table in Hebrew order with a row opened from the address", () => {
    page("/study/how-the-old-testament-books-were-written?order=hebrew&row=job");
    expect(screen.getByRole("button", { name: /^Job/, expanded: true })).toBeTruthy();
    expect(document.querySelectorAll(".ob-part-head")).toHaveLength(5);
  });
  it("ignores a junk address", () => {
    page("/study/how-the-old-testament-books-were-written?open=__proto__&book=constructor&row=toString&order=<x>");
    expect(openSheet()).toBeNull();
    expect(document.querySelector(".ob-failed")).toBeNull();
  });
});
