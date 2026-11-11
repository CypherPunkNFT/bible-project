import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bsbWords } from "@/lib/bsb-for-tests";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import EarlyChurchPage from "./EarlyChurchPage";
import { barsOf, caseRows, CHART, x } from "./geometry";
import { beats, councilPart, D, DRAWERS, DEFAULT_COUNCIL, DEFAULT_DRAWER, EC, FIRST, findCouncil, findDrawer, findOpened, LAST, linkFor, noteByPath, readerHref, refByKey, versesOf } from "./model";
import { path } from "./route";

const RECORD = "content/academic-research/21-the-early-church.json";
const HOSTILE = ["__proto__", "constructor", "toString", "", "<script>", "rec:", "rec:__proto__", "ref:constructor", "ref:John 99:1", "council:nicaea", "x".repeat(5000)];
const normal = (text: string) => text.replace(/[“”"‘’']/g, "").replace(/\s+/g, " ").trim().toLowerCase();

describe("The early church: its data", () => {
  it("is routed at its own address", () => {
    expect(path).toBe("/study/the-early-church");
  });
  it("was built from the research record as it stands", () => {
    const raw = readFileSync(RECORD, "utf8").replace(/\r\n/g, "\n");
    expect(EC.recordHash).toBe(createHash("sha256").update(raw, "utf8").digest("hex"));
  });
  it("names every verse by its place, never its words, and each is in the Berean", () => {
    const verses = Object.values(EC.verses);
    expect(verses.length).toBeGreaterThanOrEqual(D.parts.length);
    for (const v of verses) {
      expect(Object.keys(v).sort()).toEqual(["chapter", "code", "verse"]);
      expect(normal(bsbWords(v)).length, `${v.code} ${v.chapter}:${v.verse}`).toBeGreaterThan(0);
    }
    expect(normal(bsbWords(EC.verses["JHN 1:14"]))).toContain("the word became flesh");
  });
  it("supplies every verse label the page uses", () => {
    const used = [...D.creedPath.steps.flatMap((s) => s.verses), ...D.parts.flatMap((p) => p.records.flatMap((r) => r.verses))];
    for (const label of used) expect(versesOf(label).length, label).toBeGreaterThan(0);
    for (const key of ["Acts 20:17, 28", "Matthew 19:21", "Romans 13:13", "1 Corinthians 15:3–4"]) expect(refByKey.has(key), key).toBe(true);
  });
  it("gives every record a date span inside the case, and draws no estimate as a point", () => {
    for (const part of D.parts) for (const r of part.records) {
      const span = EC.spans[r.id];
      expect(span, r.id).toBeDefined();
      for (const bar of barsOf(span)) {
        expect(bar.from).toBeGreaterThanOrEqual(FIRST);
        expect(bar.to).toBeLessThanOrEqual(LAST);
        if (bar.soft) expect(bar.to - bar.from, r.id).toBeGreaterThan(0);
      }
      if (span.from < 250 && !span.pieces) expect(["about", "argued", "unknown", "year"], r.id).toContain(span.kind);
    }
    for (const id of ["clement", "didache", "ignatius", "polycarp"]) expect(EC.alternatives[id]?.length, id).toBeGreaterThan(0);
  });
  it("lays the chart out row by row inside its frame", () => {
    const { rows, height } = caseRows(DEFAULT_DRAWER);
    expect(rows).toHaveLength(8);
    expect(rows.filter((r) => r.open)).toHaveLength(1);
    for (const r of rows) expect(r.y + r.height).toBeLessThanOrEqual(height - CHART.bottom);
    expect(x(FIRST)).toBe(CHART.left);
    expect(x(LAST)).toBe(CHART.width - CHART.right);
  });
  it("names each drawer's kind and a period the record has", () => {
    const periods = new Set(D.periods.map((p) => p.id));
    for (const part of D.parts) expect(periods.has(DRAWERS[part.id]?.period), part.id).toBe(true);
  });
  it("counts its figures from what they count", () => {
    expect(D.figures.map((f) => f.value)).toEqual([String(EC.counts.years), String(EC.counts.councils), String(EC.counts.ignatius), String(EC.counts.received)]);
    expect(EC.counts.years).toBe(LAST - FIRST);
    const oriental = EC.reception.find((row) => row.id === "oriental")!;
    expect(oriental.receives).toHaveLength(EC.counts.received);
    expect(EC.reception.find((row) => row.id === "east")!.receives).toEqual(["nicaea", "constantinople"]);
  });
  it("checks the Chalcedon and confession quotations against held texts, and not the Fathers", () => {
    expect(Object.values(EC.held).flat()).toHaveLength(EC.counts.held);
    expect(EC.held[".parts[6].records[3].quote.words"]?.[0]?.doc).toBe("chalcedonian-definition-451-schaff");
    expect(EC.held[".parts[6].records[0].quote.words"]).toBeUndefined();
    expect(EC.unchecked).toContain("tacitus");
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of HOSTILE) {
      expect(findDrawer(bad).id).toBe(DEFAULT_DRAWER);
      expect(findCouncil(bad).id).toBe(DEFAULT_COUNCIL);
      expect(findOpened(bad)).toBeNull();
    }
    expect(findOpened("ref:John 1:14")?.kind).toBe("ref");
    expect(findOpened("rec:ignatius")?.kind).toBe("record");
  });
  it("opens verses in the Berean and links only inside the site", () => {
    expect(readerHref("JHN", 1, 14)).toBe("/read/bsb/JHN/1?hl=14-14");
    for (const route of EC.routes) expect(route).toMatch(/^\/study\/[a-z0-9-]+(\/[a-z0-9-]+)*$/);
    expect(JSON.stringify(EC)).not.toContain("://");
    expect(linkFor("")).toBeNull();
    expect(linkFor("https://bfm.sbc.net/bfm2000/")).toBeNull();
    expect(linkFor("/study/theology-articles/the-trinity")).toBe("/study/theology-articles/the-trinity");
  });
  it("splits a headline into its two beats without its check marks", () => {
    expect(beats("The apostles die. Their letters stay.")).toEqual(["The apostles die.", "Their letters stay."]);
    expect(beats("{{check:c1}}One beat{{/check}}")).toEqual(["One beat", ""]);
  });
  it("finds a note for every empty route", () => {
    D.parts.forEach((part, p) => part.records.forEach((r, i) => r.links.forEach((l, k) => {
      if (!l.route) expect(noteByPath.has(`.parts[${p}].records[${i}].links[${k}].route`), `${r.id} ${l.title}`).toBe(true);
    })));
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
const page = (at = "/study/the-early-church") => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[at]}><Routes><Route path="/study/the-early-church" element={<EarlyChurchPage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>,
);
const recordSheet = (container: HTMLElement) => container.querySelector(".ms-sheet.open:not(.chk-panel)");

describe("The early church: the page", () => {
  afterEach(cleanup);
  it("draws its heading and every section", () => {
    const { container } = page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("from Nero to Chalcedon");
    for (const id of ["landing", "case", "councils", "creed", "claims", "stops"]) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull();
      expect(container.querySelector(`#${id} .ek-failed`), id).toBeNull();
    }
  });
  it("shows no check-mark syntax and links nowhere outside the site", () => {
    const { container } = page("/study/the-early-church?open=rec:chalcedon");
    expect(container.innerHTML).not.toContain("{{check");
    for (const a of container.querySelectorAll("a[href]")) expect(a.getAttribute("href"), a.textContent ?? "").toMatch(/^[/#]/);
    expect(container.querySelector(".ek-chart")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".ek-chart")?.getAttribute("focusable")).toBe("false");
  });
  it("opens a reference's words in the sheet and closes on Escape", async () => {
    const { container } = page("/study/the-early-church?drawer=councils");
    fireEvent.click(container.querySelector("[data-opener='rec:chalcedon']")!);
    const sheet = recordSheet(container)!;
    fireEvent.click(within(sheet as HTMLElement).getByRole("button", { name: "John 1:14" }));
    await waitFor(() => expect(recordSheet(container)!.textContent).toContain(bsbWords(EC.verses["JHN 1:14"]).slice(0, 30)));
    expect(recordSheet(container)!.textContent).toContain("Berean Standard Bible");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(recordSheet(container)).toBeNull();
  });
  it("opens a check note, closes the record sheet for it, and closes on Escape", () => {
    const { container } = page("/study/the-early-church?open=rec:clement");
    expect(recordSheet(container)).not.toBeNull();
    fireEvent.click(recordSheet(container)!.querySelector(".chk-mark")!);
    expect(container.querySelector(".chk-panel.open")).not.toBeNull();
    expect(recordSheet(container)).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".chk-panel.open")).toBeNull();
  });
  it("opens the note of an empty route from its dot", () => {
    const { container } = page("/study/the-early-church?open=rec:nero");
    const dot = recordSheet(container)!.querySelector(".ek-links .chk-dot")!;
    expect(dot.getAttribute("aria-label")).toContain("Still open");
    fireEvent.keyDown(dot, { key: "Enter" });
    expect(container.querySelector(".chk-panel.open")?.textContent).toContain("route");
    expect(recordSheet(container)).toBeNull();
  });
  it("chooses a drawer and a council from the address, and falls back from bad ones", () => {
    const { container } = page("/study/the-early-church?drawer=constantine&council=chalcedon");
    expect(container.querySelector(".ek-drawer-btn[aria-pressed='true']")?.textContent).toContain("05");
    expect(container.querySelector(".ek-accounts")?.textContent).toContain("Lactantius");
    expect(container.querySelector(".ek-markers [aria-pressed='true']")?.textContent).toContain("Chalcedon");
    expect(container.querySelector(".ek-place-on.ek-place-oriental")).not.toBeNull();
    cleanup();
    const again = page("/study/the-early-church?drawer=__proto__&council=constructor&open=<script>");
    expect(again.container.querySelector(".ek-drawer-btn[aria-pressed='true']")?.textContent).toContain("01");
    expect(again.container.querySelector(".ek-markers [aria-pressed='true']")?.textContent).toContain("Nicaea");
    expect(again.container.querySelector(".ms-sheet.open")).toBeNull();
  });
  it("switches drawers and councils with the buttons and says each family's count in words", () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector(".ek-drawers")!).getByRole("button", { name: /^08/ }));
    expect(container.querySelector(".ek-drawer h3")?.textContent).toContain("Command what you will.");
    fireEvent.click(within(container.querySelector(".ek-markers")!).getByRole("button", { name: /Ephesus/ }));
    expect(container.querySelector(".ek-place-on.ek-place-east")).not.toBeNull();
    const rows = container.querySelectorAll(".ek-band-row");
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain("Receives two of the four");
    expect(rows[1].textContent).toContain("Receives three of the four");
    expect(rows[2].textContent).toContain("Receives four of the four");
    expect(councilPart.records).toHaveLength(4);
  });
  it("answers a claim's test in a live line", () => {
    const { container } = page();
    const test = container.querySelector(".ek-test")!;
    fireEvent.click(within(test as HTMLElement).getAllByRole("button")[0]);
    expect(test.querySelector(".ek-why")?.getAttribute("aria-live")).toBe("polite");
    expect(test.querySelector(".ek-why")?.textContent).toContain("The source supports this.");
  });
});
