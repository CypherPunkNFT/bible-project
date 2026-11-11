import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { bsbWords } from "@/lib/bsb-for-tests";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { plainText } from "@/pages/study/check-notes/checked";
import NtBooksPage from "./NtBooksPage";
import { path } from "./route";
import {
  AXIS, D, DEFAULT_CASE, DEFAULT_GOSPEL, DEFAULT_LAYER, DEFAULT_LETTER, DEFAULT_STAGE, LINK_HREF, MAPS, NB, SCRIBED, SIGNED, findCase, findClaim,
  WORD, findGospel, findLayer, findLetter, findOpened, findRow, findStage, findView, isLost, readerHref, refsIn, refsWritten, versesOf,
} from "./model";

const RECORD = "content/academic-research/42-how-the-new-testament-books-were-written.json";
const BAD = ["__proto__", "constructor", "toString", "", "nope", "<script>", "verse:", "witness:"];

/** Every reading string in the record, with the book it belongs to when it is a reference-table row's claim. */
function strings(node: unknown, at = ""): { at: string; text: string; book?: string }[] {
  if (typeof node === "string") return [{ at, text: node }];
  if (Array.isArray(node)) return node.flatMap((item, i) => strings(item, `${at}[${i}]`));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([key, value]) => (["checkNotes", "verses", "sources", "openQuestions"].includes(key) ? [] : strings(value, `${at}.${key}`)));
  }
  return [];
}

describe("How the New Testament books were written: its data", () => {
  it("was built from the record as it stands now", () => {
    const hash = createHash("sha256").update(readFileSync(resolve(RECORD))).digest("hex");
    expect(NB.recordHash).toBe(hash);
  });
  it("resolves every reference the page will link, in prose and in the table", () => {
    for (const { at, text } of strings(D)) {
      const book = /^\.referenceTable\[(\d+)\]\.claims$/.exec(at);
      const owner = book ? D.referenceTable[Number(book[1])].book : undefined;
      expect(refsIn(text, owner), at).toEqual(refsWritten(text, owner));
      for (const key of refsIn(text, owner)) expect(versesOf(key).length, key).toBeGreaterThan(0);
    }
  });
  it("names every verse by its place, never its words, and the Berean has each one", () => {
    for (const labels of Object.values(NB.refs)) for (const label of labels) expect(bsbWords(NB.verses[label]), label).toBeTruthy();
    for (const verse of Object.values(NB.verses)) expect(Object.keys(verse).sort()).toEqual(["chapter", "code", "verse"]);
    for (const v of D.verses) expect(NB.verses[v.label]?.code, v.label).toBe(v.code);
    expect(NB.refs["Luke 1:1–4"]).toEqual(D.synoptic.verses);
  });
  it("ties each synopsis case in every column", () => {
    for (const item of D.synoptic.cases) {
      const synopsis = NB.synopsis[item.id];
      expect(synopsis.columns.map((c) => c.ref)).toEqual(item.passages);
      for (const column of synopsis.columns) expect(column.verses.some((v) => v.tie.length > 0), column.ref).toBe(true);
    }
  });
  it("gives each synopsis verse one level for each of the Berean's words, and ties the tie's own words", () => {
    for (const item of D.synoptic.cases) {
      const { columns, tie } = NB.synopsis[item.id];
      for (const column of columns) for (const v of column.verses) {
        const words = bsbWords(NB.verses[v.label]).match(WORD) ?? [];
        expect(v.levels, v.label).toHaveLength(words.length);
        if (v.tie.length) expect(v.tie.map((i) => words[i]).join("").trim(), v.label).toContain(tie.words.split(" ")[1]);
      }
    }
  });
  it("draws every book once, in order, as ranges inside the axis", () => {
    expect(NB.table.map((r) => r.book)).toEqual(D.referenceTable.map((r) => r.book));
    expect(NB.table).toHaveLength(27);
    for (const row of NB.table) {
      expect(row.bars.length, row.book).toBeGreaterThan(0);
      for (const bar of row.bars) {
        expect(bar.from, row.book).toBeLessThanOrEqual(bar.to);
        expect(bar.from).toBeGreaterThanOrEqual(AXIS.from);
        expect(bar.to).toBeLessThanOrEqual(AXIS.to);
        expect(plainText(D.referenceTable.find((r) => r.book === row.book)!.date).includes(bar.words) || bar.words === "with Colossians", row.book).toBe(true);
      }
    }
  });
  it("links only inside the site, and only the record's own titles", () => {
    for (const [title, href] of LINK_HREF) {
      expect(D.links.some((l) => l.title === title)).toBe(true);
      expect(href).toMatch(/^\/[a-z0-9/-]+$/);
    }
  });
  it("reads Paul's signature and scribe from the lead, and the lost works from the record", () => {
    expect(SIGNED).toEqual(["1 Corinthians", "Galatians", "Colossians", "2 Thessalonians"]);
    expect(SCRIBED).toEqual(["Romans"]);
    expect(D.witnesses.records.filter(isLost).map((w) => w.id)).toEqual(["papias", "clement"]);
    // The witness sheet says the translations were located, not read: true while every source is only located.
    expect(D.sources.every((s) => s.status === "located")).toBe(true);
  });
  it("draws a map for every view, and every arrow joins two of its nodes", () => {
    for (const view of D.synoptic.views) {
      const map = MAPS[view.id];
      expect(map, view.id).toBeTruthy();
      const ids = new Set(map.nodes.map((n) => n.id));
      for (const a of map.arrows) expect((a.from === "band" || ids.has(a.from)) && ids.has(a.to), `${view.id} ${a.from}-${a.to}`).toBe(true);
    }
  });
});

describe("How the New Testament books were written: its address", () => {
  it("falls back when the address asks for something unknown", () => {
    for (const bad of BAD) {
      expect(findCase(bad).id).toBe(DEFAULT_CASE);
      expect(findLayer(bad).id).toBe(DEFAULT_LAYER);
      expect(findStage(bad).id).toBe(DEFAULT_STAGE);
      expect(findGospel(bad)).toBe(DEFAULT_GOSPEL);
      expect(findLetter(bad)).toBe(DEFAULT_LETTER);
      expect(findClaim(bad).id).toBe(D.claims[0].id);
      expect(findView(bad)).toBeNull();
      expect(findRow(bad)).toBeNull();
      expect(findOpened(bad)).toBeNull();
      expect(findOpened(`verse:${bad}`)).toBeNull();
      expect(findOpened(`witness:${bad}`)).toBeNull();
    }
    expect(findOpened("witness:papias")?.kind).toBe("witness");
    expect(findOpened("verse:Mark 2:10")?.kind).toBe("verse");
    expect(findView("farrer")?.id).toBe("farrer");
  });
  it("opens every reference in the Berean reader", () => {
    expect(readerHref("Luke 1:1–4")).toBe("/read/bsb/LUK/1?hl=1-4");
    expect(readerHref("Mark 2:10")).toBe("/read/bsb/MRK/2?hl=10-10");
    expect(readerHref("nope")).toBeNull();
  });
  it("registers its own address", () => {
    expect(path).toBe("/study/how-the-new-testament-books-were-written");
  });
});

describe("How the New Testament books were written: the page", () => {
  afterEach(cleanup);
  // The verse words come from the reader's Bible (data/plain/<bible>/<book>.json), read here from disk.
  const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
  beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
    const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
    try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
    catch { return new Response("missing", { status: 404 }); }
  }));
  afterAll(() => vi.unstubAllGlobals());
  const open = (search = "") => render(<CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[`${path}${search}`]}><Routes><Route path={path} element={<NtBooksPage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>);

  it("opens with the standard heading and every section", () => {
    const { container } = open();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("How the New Testament books were written");
    for (const id of ["landing", "tellings", "maps", "witnesses", "quest", "letters", "claims", "books"]) expect(container.querySelector(`#${id}`), id).toBeTruthy();
    expect(container.querySelector(".nb-failed")).toBeNull();
    expect(container.textContent).not.toContain("{{check");
  });
  it("shows the chosen case from the address, and no map until one is chosen", () => {
    const { container } = open("?case=baptist");
    expect(container.querySelector(".nb-cases [aria-pressed='true']")?.textContent).toContain("A sermon nearly word for word");
    expect(container.querySelectorAll(".nb-col")).toHaveLength(2);
    expect(container.querySelector(".nb-maps [aria-pressed='true']")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Mark first, without Q/ }));
    expect(container.querySelector(".nb-view")?.textContent).toContain("Austin Farrer");
  });
  it("marks the shared words of the synopsis on the Berean's own words", async () => {
    const { container } = open();
    await waitFor(() => expect(container.querySelector(".nb-tied [data-tie]")?.textContent).toBeTruthy());
    expect(container.querySelector(".nb-col-text")?.textContent).not.toBe("");
    expect([...container.querySelectorAll(".nb-tied [data-tie]")].map((el) => el.textContent).join(" ")).toContain("paralytic");
  });
  it("opens a reference's verses in the sheet, and Escape closes it", async () => {
    const { container } = open();
    fireEvent.click(container.querySelector<HTMLElement>(".nb-col-head .nb-ref")!);
    const sheet = () => container.querySelector(".ms-sheet.open:not(.chk-panel)");
    expect(sheet()?.textContent).toContain("Mark 2:1–12");
    await waitFor(() => expect(sheet()?.textContent).toContain("He said to the paralytic"));
    expect(sheet()?.textContent).toContain("Berean Standard Bible · 12 verses");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
  });
  it("opens a check note from a highlighted passage, closing its own sheet first", () => {
    const { container } = open("?open=witness:papias");
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")?.textContent).toContain("Papias");
    fireEvent.click(container.querySelector<HTMLElement>(".chk-mark")!);
    expect(container.querySelector(".ms-sheet.chk-panel.open")?.textContent).toContain("Editor's note");
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".ms-sheet.chk-panel.open")).toBeNull();
  });
});
