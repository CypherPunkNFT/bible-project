import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { bsbWords } from "@/lib/bsb-for-tests";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { plainText } from "@/pages/study/check-notes/checked";
import { climbLine, D, DEFAULT_POINT, findLayer, findOpened, findPoint, LD, linkFor, phraseByLabel, rainSpan, readerHref, safeUrl, STRETCH, verseByLabel } from "./model";
import * as route from "./route";
import LandPage from "./LandPage";

const RECORD = "content/academic-research/40-the-land-of-the-bible.json";
const FOLDER = "src/pages/study/land";
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
// The verse words come from the reader's Bible (data/plain/<bible>/<book>.json), read here from disk.
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());

const BAD = ["__proto__", "constructor", "toString", "region:", "region:nope", "verse:", "verse:Luke 99:1", "verse:__proto__", "", "<script>", "verse"];

function allVerseLabels(node: unknown, found: Set<string>): Set<string> {
  if (Array.isArray(node)) node.forEach((n) => allVerseLabels(n, found));
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "verses" && Array.isArray(value) && value.every((v) => typeof v === "string")) value.forEach((v) => found.add(v as string));
      else if (key === "verses" && Array.isArray(value)) value.forEach((v) => found.add((v as { label: string }).label));
      else allVerseLabels(value, found);
    }
  }
  return found;
}

describe("The land of the Bible: its data", () => {
  it("was built from this record: the generated data is not stale (record hash only; the Berean, places and coast are covered by the build's --check)", () => {
    const raw = readFileSync(resolve(RECORD));
    expect(LD.recordHash).toBe(createHash("sha256").update(raw).digest("hex"));
  });
  it("has a place for every verse the record names, anywhere in it, and the Berean has words there; the data holds no words", () => {
    const labels = allVerseLabels(D, new Set());
    expect(labels.size).toBeGreaterThan(100);
    for (const label of labels) {
      const verse = verseByLabel.get(label);
      expect(verse, label).toBeDefined();
      expect(Object.keys(verse!).sort(), label).toEqual(["chapter", "code", "verse"]);
      expect(bsbWords(verse!), label).toBeTruthy();
    }
  });
  it("quotes only words that stand in the Berean verse, and each 'up' or 'down' line says so", () => {
    const even = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
    for (const [label, p] of phraseByLabel) {
      expect(even(bsbWords(verseByLabel.get(label)!)), label).toContain(p.phrase);
      if (p.way) expect(p.phrase, label).toMatch(new RegExp(`\\b${p.way}\\b`));
    }
  });
  it("prints figures that follow from the record's own numbers", () => {
    const point = new Map(D.transect.points.map((p) => [p.id, p]));
    expect(LD.figures.drop.exact).toBe(point.get("ridge")!.elevation - point.get("deadsea")!.elevation);
    expect(LD.figures.drop.km).toBeLessThan(40);
    expect(LD.figures.regions).toBe(D.regions.length);
    expect(LD.figures.battles).toBe(D.battles.items.length);
    const gradient = plainText(D.climate.gradient.evidence);
    for (const r of LD.figures.rain) expect(gradient, r.place).toContain(r.words.replace(" or more", ""));
  });
  it("states the stretch of the slice and draws the climb at true scale", () => {
    expect(STRETCH).toBeGreaterThan(5);
    const from = findPoint("ridge"), to = findPoint("jericho");
    const flat = climbLine(600, 1, from, to);
    expect(flat.y2).toBeCloseTo(((from.elevation - to.elevation) * 600) / ((to.km - from.km) * 1000), 1);
  });
  it("never draws a proposed site as a point", () => {
    const proposed = D.disputedSites.items.flatMap((s) => [s.name, ...s.placements.map((p) => plainText(p.site).split(",")[0])]).map((n) => n.toLowerCase());
    for (const p of Object.values(LD.map.points)) expect(proposed).not.toContain(p.name.toLowerCase());
    for (const s of D.disputedSites.items) expect(LD.map.rings.filter((r) => r.site === s.id).length).toBeGreaterThanOrEqual(2);
  });
  it("links only inside the site, and only where the build settled a route", () => {
    for (const path of Object.values(LD.links)) expect(path).toMatch(/^\/[a-z0-9/-]+$/);
    expect(linkFor("The peoples around Israel (35)")).toBeNull();
    for (const s of D.sources) expect(safeUrl(s.url)).toBeNull();
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("https://example.org/x")).toBe("https://example.org/x");
  });
  it("reads each rain's months", () => {
    for (const r of D.climate.rains) expect(rainSpan(r.months), r.months).not.toBeNull();
    expect(rainSpan("Smarch to May")).toBeNull();
  });
});

describe("The land of the Bible: its address", () => {
  it("opens every verse in the Berean", () => {
    expect(readerHref({ code: "LUK", chapter: 10, verse: 30 })).toBe("/read/bsb/LUK/10?hl=30-30");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of BAD) {
      expect(findOpened(bad), bad).toBeNull();
      expect(findPoint(bad).id).toBe(DEFAULT_POINT);
      expect(findLayer(bad)).toBe("rain");
    }
    expect(findOpened(null)).toBeNull();
  });
  it("opens a verse whose label holds a colon, and each record by its own key", () => {
    expect(findOpened("verse:Luke 10:30")).toMatchObject({ kind: "verse", label: "Luke 10:30" });
    expect(findOpened("region:coast")).toMatchObject({ kind: "region" });
    expect(findOpened("battle:elah")).toMatchObject({ kind: "battle" });
  });
  it("has its route", () => {
    expect(route.path).toBe("/study/the-land-of-the-bible");
    expect(readFileSync(resolve(FOLDER, "route.ts"), "utf-8").trim()).toBe('import { lazy } from "react"; export const path = "/study/the-land-of-the-bible"; export const Page = lazy(() => import("./LandPage"));');
  });
  it("sets no raw HTML anywhere in its folder", () => {
    for (const file of readdirSync(resolve(FOLDER)).filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.tsx"))) {
      expect(readFileSync(resolve(FOLDER, file), "utf-8"), file).not.toContain("dangerouslySetInnerHTML");
    }
  });
});

function page(at = "/study/the-land-of-the-bible") {
  return render(<CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[at]}><Suspense fallback={null}><LandPage /></Suspense></MemoryRouter>
  </CatalogContext.Provider>);
}

describe("The land of the Bible: the page", () => {
  it("draws the heading, every section, and no point for a disputed site", () => {
    const { container } = page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("The land of the Bible");
    for (const id of ["slice", "climb", "rain", "water", "roads", "places", "claims", "stops"]) expect(container.querySelector(`section#${id} h2`), id).not.toBeNull();
    expect(container.querySelector(".ls-failed")).toBeNull();
    expect(container.querySelector("[data-fixed='ai'], [data-fixed='sodom']")).toBeNull();
    expect(container.querySelectorAll("[data-proposed]").length).toBe(LD.map.rings.length);
    expect(container.textContent).not.toContain("{{check:");
  });
  it("opens a verse in the sheet, in the reader's Bible, and closes it on Escape", async () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector("#climb")!).getAllByRole("button", { name: "Luke 10:30" })[0]);
    const sheet = container.querySelector(".ls-sheet")!;
    expect(sheet.classList.contains("open")).toBe(true);
    await waitFor(() => expect(sheet.textContent).toContain(bsbWords(verseByLabel.get("Luke 10:30")!)));
    expect(sheet.textContent).toContain("Berean Standard Bible");
    act(() => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(container.querySelector(".ls-sheet")!.classList.contains("open")).toBe(false);
  });
  it("opens a check note, closes the record sheet when it does, and closes the note on Escape", () => {
    const { container } = page("/study/the-land-of-the-bible?open=region:coast");
    expect(container.querySelector(".ls-sheet")!.classList.contains("open")).toBe(true);
    const mark = container.querySelector<HTMLElement>("#rain .chk-mark")!;
    fireEvent.click(mark);
    expect(document.querySelector(".chk-panel")!.classList.contains("open")).toBe(true);
    expect(container.querySelector(".ls-sheet")!.classList.contains("open")).toBe(false);
    act(() => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(document.querySelector(".chk-panel")!.classList.contains("open")).toBe(false);
  });
  it("moves the chosen point from the address and by the list", () => {
    const { container } = page("/study/the-land-of-the-bible?at=jericho&layer=water");
    expect(container.querySelector(".ls-at h3")!.textContent).toBe(findPoint("jericho").name);
    fireEvent.click(within(container.querySelector(".ls-points")!).getByText(findPoint("plateau").name));
    expect(container.querySelector(".ls-at h3")!.textContent).toBe(findPoint("plateau").name);
  });
});
