import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bsbWords } from "@/lib/bsb-for-tests";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { hangOf, ladder, placeBars, relation, TRACK, weightOf, x } from "./geometry";
import ExodusSolomonPage from "./ExodusSolomonPage";
import { D, DEFAULT_STATION, findExodus, findOpened, findStation, findStay, readerHref, recordOf, versesOf, XS } from "./model";
import { path } from "./route";

const RECORD = "content/academic-research/38-israel-from-the-exodus-to-solomon.json";
const HOSTILE = ["__proto__", "constructor", "toString", "", "<script>", "ref:", "rec:__proto__", "rec:egypt.nothing", "ref:Exodus 99:1", "COUNT", "1e9"];
const normal = (text: string) => text.replace(/[“”"‘’']/g, "").replace(/\s+/g, " ").trim().toLowerCase();

describe("Israel from the exodus to Solomon: its data", () => {
  it("is routed at its own address", () => {
    expect(path).toBe("/study/israel-from-the-exodus-to-solomon");
  });
  it("was built from the research record as it stands", () => {
    const raw = readFileSync(RECORD).toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    expect(XS.recordHash).toBe(createHash("sha256").update(raw, "utf8").digest("hex"));
  });
  it("names every verse by its place, never its words, and each is in the Berean", () => {
    const verses = Object.values(XS.verses);
    expect(verses.length).toBeGreaterThan(40);
    for (const v of verses) {
      expect(Object.keys(v).sort()).toEqual(["chapter", "code", "notes", "verse"]);
      expect(normal(bsbWords(v)).length, `${v.code} ${v.chapter}:${v.verse}`).toBeGreaterThan(0);
    }
    expect(normal(bsbWords(XS.verses["1KI 6:1"]))).toContain("four hundred and eightieth");
  });
  it("supplies every verse label the page uses", () => {
    const used = [...D.stance.verses, ...D.stations.flatMap((s) => s.verses), "1 Kings 6:1", "Exodus 12:40", "Judges 11:26", "1 Kings 9:15", "Joshua 8:28"];
    for (const label of used) expect(versesOf(label).length, label).toBeGreaterThan(0);
  });
  it("hangs the cords at the record's numbers", () => {
    const { peg, exodus, lengths } = XS.cords;
    expect(peg).toBe(966);
    expect(exodus.count).toBe(peg + lengths["480count"]);
    expect(exodus).toEqual({ count: 1446, measure: 1260 });
    expect(lengths["215egypt"] * 2).toBe(lengths["430egypt"]);
    expect(hangOf("count", "egypt").egypt).toEqual([1876, 1446]);
    expect(hangOf("measure", "canaan")).toMatchObject({ egypt: [1475, 1260], canaan: [1690, 1475] });
    expect(XS.cords.generations).toBe(12);
  });
  it("keeps every bar inside the drawing and no two labels in one lane", () => {
    const { bars, nails, lanes } = placeBars();
    expect(bars).toHaveLength(D.timeline.ground.length);
    expect(nails).toHaveLength(2);
    for (const b of [...bars, ...nails]) for (const [start, end] of b.spans) {
      expect(start).toBeGreaterThanOrEqual(end);
      expect(x(start)).toBeGreaterThanOrEqual(TRACK.left);
      expect(x(end)).toBeLessThanOrEqual(TRACK.width - TRACK.right + 0.001);
    }
    expect(lanes).toBeLessThanOrEqual(4);
    expect(XS.bars.gates).toEqual([[970, 930], [900, 850]]);
  });
  it("says where a date falls by arithmetic only", () => {
    expect(relation(1446, [1425, 1375])).toBe("before");
    expect(relation(1400, [1425, 1375])).toBe("within");
    expect(relation(1260, [1425, 1375])).toBe("after");
    expect(weightOf("count", null)).toBe("open");
    expect(weightOf("count", "measure")).toBe("aside");
    expect(ladder(null, null).filter((r) => r.kind === "cord")).toHaveLength(6);
    expect(ladder("count", "egypt").filter((r) => r.kind === "cord")).toHaveLength(2);
  });
  it("chooses no reading until the reader does, and falls back from anything unknown", () => {
    for (const bad of HOSTILE) {
      expect(findExodus(bad)).toBeNull();
      expect(findStay(bad)).toBeNull();
      expect(findStation(bad).id).toBe(DEFAULT_STATION);
      expect(findOpened(bad)).toBeNull();
    }
    expect(findExodus(null)).toBeNull();
    expect(findOpened("ref:1 Kings 6:1")?.kind).toBe("ref");
    expect(findOpened("rec:conquest.ai")?.kind).toBe("record");
    expect(recordOf("egypt", "__proto__")).toBeUndefined();
  });
  it("opens verses in the Berean and links only inside the site", () => {
    expect(readerHref("1KI", 6, 1)).toBe("/read/bsb/1KI/6?hl=1-1");
    for (const link of [...Object.values(XS.links), ...XS.neighbours.map((n) => n.route).filter(Boolean)]) expect(link).toMatch(/^\/study\/[a-z0-9-]+$/);
    expect(JSON.stringify(XS)).not.toContain("://");
    expect(XS.neighbours).toHaveLength(D.neighbours.length);
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
const page = (at = "/study/israel-from-the-exodus-to-solomon") => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[at]}><Routes><Route path="/study/israel-from-the-exodus-to-solomon" element={<ExodusSolomonPage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>,
);

describe("Israel from the exodus to Solomon: the page", () => {
  afterEach(cleanup);
  it("draws its heading and every section", () => {
    const { container } = page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("to Solomon");
    for (const id of ["landing", "cords", "stations", "ai", "gates", "invented", "claims", "stops"]) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull();
      expect(container.querySelector(`#${id} .xs-failed`), id).toBeNull();
    }
    expect(container.querySelectorAll(".xs-strand.open").length).toBeGreaterThan(0);
    expect(container.querySelector(".xs-strand.chosen")).toBeNull();
  });
  it("opens a reference's words and the Berean's footnote in the sheet and closes on Escape", async () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector("#cords .xs-choices")!).getAllByRole("button", { name: "Exodus 12:40" })[0]);
    const sheet = container.querySelector(".ms-sheet.open:not(.chk-panel)")!;
    await waitFor(() => expect(sheet.textContent).toContain(bsbWords(XS.verses["EXO 12:40"]).slice(0, 30)));
    expect(sheet.textContent).toContain("Berean Standard Bible");
    expect(sheet.textContent).toContain("LXX in Egypt and Canaan");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
  });
  it("opens a check note, closes the record sheet for it, and closes on Escape", () => {
    const { container } = page("/study/israel-from-the-exodus-to-solomon?open=rec:egypt.jewish");
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).not.toBeNull();
    fireEvent.click(container.querySelector(".chk-mark")!);
    expect(container.querySelector(".chk-panel.open")).not.toBeNull();
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".chk-panel.open")).toBeNull();
  });
  it("draws a chosen reading and station from the address and falls back from bad ones", () => {
    const { container } = page("/study/israel-from-the-exodus-to-solomon?span480=measure&span430=canaan&station=solomon");
    expect(container.querySelector(".xs-choice button[aria-pressed='true']")?.textContent).toContain("generations");
    expect(container.querySelectorAll(".xs-strand.chosen").length).toBeGreaterThan(0);
    expect(container.querySelector(".xs-card[aria-pressed='true']")?.textContent).toContain("Solomon");
    cleanup();
    const again = page("/study/israel-from-the-exodus-to-solomon?span480=__proto__&station=<script>&open=<script>");
    expect(again.container.querySelector(".xs-choice button[aria-pressed='true']")).toBeNull();
    expect(again.container.querySelector(".xs-card[aria-pressed='true']")?.textContent).toContain("Egypt");
    expect(again.container.querySelector(".ms-sheet.open")).toBeNull();
  });
  it("chooses a station and opens one of its records", () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector("#stations .xs-cards")!).getByRole("button", { name: /Entering the land/ }));
    fireEvent.click(within(container.querySelector("#stations .xs-records")!).getByRole("button", { name: /Hazor/ }));
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel) h2")?.textContent).toContain("Hazor");
  });
});
