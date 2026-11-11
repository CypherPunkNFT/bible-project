import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bsbWords } from "@/lib/bsb-for-tests";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { CHART, inOffice, lattice, touchedBy } from "./geometry";
import { anchorById, atPath, axisYear, D, DEFAULT_ANCHOR, findAnchor, findBirthView, findCrossView, findOpened, findRuler, NH, rangeWord, readerHref, refByKey, rowById, versesOf } from "./model";
import NtHistoryPage from "./NtHistoryPage";
import { path } from "./route";

const RECORD = "content/academic-research/43-new-testament-history.json";
const HOSTILE = ["__proto__", "constructor", "toString", "", "<script>", "ref:", "step:__proto__", "ref:Luke 99:1", "herod:nobody", "1e9"];

describe("New Testament history: its data", () => {
  it("is routed at its own address", () => {
    expect(path).toBe("/study/new-testament-history");
  });
  it("was built from the research record as it stands", () => {
    const raw = readFileSync(RECORD, "utf8").replace(/\r\n/g, "\n");
    expect(NH.recordHash).toBe(createHash("sha256").update(raw, "utf8").digest("hex"));
  });
  it("names every verse by its place, never its words, and the Berean has each one", () => {
    const verses = Object.values(NH.verses);
    expect(verses.length).toBeGreaterThan(50);
    for (const v of verses) {
      expect(Object.keys(v).sort()).toEqual(["chapter", "code", "verse"]);
      expect(bsbWords(v), `${v.code} ${v.chapter}:${v.verse}`).toBeTruthy();
    }
  });
  it("supplies every verse label the page uses", () => {
    const used = [...D.stance.verses, ...D.paul.verses, ...D.herods.rows.flatMap((h) => h.nt), ...D.eras.flatMap((e) => e.steps.flatMap((s) => s.verses ?? [])), ...NH.anchors.flatMap((a) => a.verses)];
    for (const label of used) expect(versesOf(label).length, label).toBeGreaterThan(0);
  });
  it("draws every disputed date twice and keeps each named ruler in office", () => {
    for (const id of ["birth", "luke3", "cross"]) expect(anchorById.get(id)!.years).toHaveLength(2);
    for (const anchor of NH.anchors) for (const span of anchor.years) for (const id of anchor.named) {
      for (let year = span.from; year <= span.to; year++) expect(inOffice(rowById.get(id)!, year, span.alt), `${anchor.id} ${id} ${year}`).toBe(true);
    }
    expect(touchedBy(anchorById.get("luke3")!).slice(0, 4).map((r) => r.id).sort()).toEqual(["antipas", "philip", "pilate", "tiberius"]);
  });
  it("measures the early birth by Herod's death in 4 BC and the late one by 1 BC", () => {
    const herod = rowById.get("herod")!;
    expect(inOffice(herod, -2)).toBe(false);
    expect(inOffice(herod, -2, true)).toBe(true);
  });
  it("finds the record's text for every anchor", () => {
    for (const anchor of NH.anchors) expect(atPath(anchor.textPath).length, anchor.id).toBeGreaterThan(20);
    expect(atPath(".__proto__")).toBe("");
    expect(atPath(".nothing[3]")).toBe("");
  });
  it("counts years with no year zero", () => {
    expect(axisYear(-1) + 1).toBe(axisYear(1));
    expect(axisYear(73) - axisYear(-63)).toBe(NH.counts.years);
    expect(NH.counts.years).toBe(135);
    expect(rangeWord(-6, -4)).toBe("6–4 BC");
    expect(rangeWord(-4, 6)).toBe("4 BC–AD 6");
    expect(rangeWord(30, 30)).toBe("AD 30");
  });
  it("places every bar inside the drawing", () => {
    const { placed } = lattice();
    expect(placed).toHaveLength(D.timeline.rows.length);
    for (const p of placed) expect(p.y).toBeGreaterThanOrEqual(CHART.top);
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of HOSTILE) {
      expect(findAnchor(bad).id).toBe(DEFAULT_ANCHOR);
      expect(findRuler(bad)).toBeNull();
      expect(findOpened(bad)).toBeNull();
      expect(findBirthView(bad)).toBeNull();
      expect(findCrossView(bad)).toBeNull();
    }
    expect(findOpened("ref:Luke 3:1")?.kind).toBe("ref");
    expect(findOpened("step:pompey")?.kind).toBe("record");
  });
  it("opens verses in the Berean and links only inside the site", () => {
    expect(readerHref("LUK", 3, 1)).toBe("/read/bsb/LUK/3?hl=1-1");
    for (const link of Object.values(NH.links)) expect(link).toMatch(/^\/study\/[a-z0-9-]+$/);
    expect(JSON.stringify(NH)).not.toContain("://");
    expect(refByKey.has("Acts 11:30; 12:25")).toBe(true);
  });
});

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
// The verse words come from the reader's Bible (data/plain/<bible>/<book>.json), read here from disk.
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());
const page = (at = "/study/new-testament-history") => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[at]}><Routes><Route path="/study/new-testament-history" element={<NtHistoryPage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>,
);

describe("New Testament history: the page", () => {
  afterEach(cleanup);
  it("draws its heading and every section", () => {
    const { container } = page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("from Herod to the fall of Jerusalem");
    for (const id of ["landing", "lattice", "herods", "rome", "witnesses", "years", "trial", "paul", "revolt", "claims", "stops"]) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull();
      expect(container.querySelector(`#${id} .nh-failed`), id).toBeNull();
    }
  });
  it("opens a reference's words in the sheet, in the reader's Bible, and closes on Escape", async () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector("#lattice")!).getAllByRole("button", { name: "Luke 3:1" })[0]);
    const sheet = container.querySelector(".ms-sheet.open:not(.chk-panel)")!;
    await waitFor(() => expect(sheet.textContent).toContain(bsbWords(NH.verses["LUK 3:1"]).slice(0, 30)));
    expect(sheet.textContent).toContain("Berean Standard Bible");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
  });
  it("opens a check note, closes the record sheet for it, and closes on Escape", () => {
    const { container } = page("/study/new-testament-history?open=step:pompey");
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).not.toBeNull();
    fireEvent.click(container.querySelector(".chk-mark")!);
    expect(container.querySelector(".chk-panel.open")).not.toBeNull();
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".chk-panel.open")).toBeNull();
  });
  it("draws a chosen anchor from the address and falls back from a bad one", () => {
    const { container } = page("/study/new-testament-history?anchor=gallio&ruler=claudius");
    expect(container.querySelector(".nh-anchor[aria-pressed='true']")?.textContent).toContain("Gallio");
    expect(container.querySelector(".nh-ruler-note")?.textContent).toContain("Claudius");
    cleanup();
    const again = page("/study/new-testament-history?anchor=__proto__&open=<script>");
    expect(again.container.querySelector(".nh-anchor[aria-pressed='true']")?.textContent).toContain("Luke 3:1");
    expect(again.container.querySelector(".ms-sheet.open")).toBeNull();
  });
});
