import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { bsbWords } from "@/lib/bsb-for-tests";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { plainText } from "@/pages/study/check-notes/checked";
import { axisYear, D, DEFAULT_FEAST, DEFAULT_HOUSE, findFeast, findFind, findHouse, findOpened, findScale, metres, readerHref, refByKey, TD, versesOf } from "./model";
import TemplePage from "./TemplePage";
import { path } from "./route";

const RECORD = "content/academic-research/44-the-temple-and-israels-worship.json";
const HOSTILE = ["__proto__", "constructor", "toString", "hasOwnProperty", "", "<script>", "ref:", "find:__proto__", "ref:Exodus 99:1", "site:nowhere", "1e9"];
const normal = (text: string) => text.replace(/[“”"‘’']/g, "").replace(/\s+/g, " ").trim().toLowerCase();

describe("The temple and Israel's worship: its data", () => {
  it("is routed at its own address", () => {
    expect(path).toBe("/study/the-temple-and-israels-worship");
    // The shape study-page-routes.ts accepts; other studies' route files are not imported here, so their state cannot fail this test.
    expect(path).toMatch(/^\/study\/[a-z0-9-]+$/);
  });
  it("was built from the research record as it stands", () => {
    const raw = readFileSync(RECORD, "utf8").replace(/\r\n/g, "\n");
    expect(TD.recordHash).toBe(createHash("sha256").update(raw, "utf8").digest("hex"));
  });
  it("carries every verse in the Berean's own words", () => {
    const verses = Object.values(TD.verses);
    expect(verses.length).toBeGreaterThan(150);
    for (const v of verses) expect(normal(v.text), `${v.code} ${v.chapter}:${v.verse}`).toBe(normal(bsbWords(v)));
  });
  it("supplies every verse label the page uses", () => {
    const used = [...D.stance.verses, ...D.houses.flatMap((h) => h.verses), ...D.priesthood.records.flatMap((r) => r.verses), ...D.feasts.list.flatMap((f) => f.nt),
      ...D.claims.flatMap((c) => c.verses), ...D.atonement.steps.map((s) => s.scripture), "1 Chronicles 24:7–18", "Luke 1:5", "Psalm 92:1", "Zechariah 7:1",
      ...TD.plans.flatMap((p) => (p.verse ? [p.verse] : [])), TD.decree.verse, TD.hall.verse];
    for (const label of used) expect(versesOf(label).length, label).toBeGreaterThan(0);
  });
  it("draws Scripture's numbers as Scripture gives them", () => {
    const shape = (id: string) => TD.plans.find((p) => p.id === id)!;
    expect([shape("sol-house").w, shape("sol-house").h]).toEqual([60, 20]);
    expect(normal(versesOf("1 Kings 6:2")[0].text)).toContain("sixty cubits long, twenty cubits wide");
    expect([shape("sol-inner").w, shape("sol-inner").h]).toEqual([20, 20]);
    expect([shape("tab-court").w, shape("tab-court").h]).toEqual([100, 50]);
    expect(shape("tab-tent").kind).toBe("inferred");
    expect(shape("her-square").kind).toBe("mishnah");
    expect(TD.plans.some((p) => p.house === "second")).toBe(false);
    for (const p of TD.plans.filter((s) => s.kind !== "mishnah")) {
      expect(p.x).toBeGreaterThanOrEqual(-34);
      expect(p.x + p.w).toBeLessThanOrEqual(84);
    }
    expect(metres(60)).toBe(27);
  });
  it("lists the twenty-four divisions with Abijah eighth, from the Berean", () => {
    expect(TD.divisions).toHaveLength(24);
    expect(TD.divisions[7].name).toBe("Abijah");
    for (const d of TD.divisions) expect(versesOf("1 Chronicles 24:7–18").map((v) => v.text).join(" ")).toContain(d.name);
  });
  it("places only stated feasts, and marks the argued ones", () => {
    expect(TD.feasts.map((f) => f.id)).toEqual(D.feasts.list.map((f) => f.id));
    for (const f of TD.feasts) expect(plainText(D.feasts.list.find((x) => x.id === f.id)!.when)).toContain(f.words);
    expect(TD.feasts.filter((f) => f.argued).map((f) => f.id)).toEqual(["omer", "shavuot"]);
    expect(TD.psalms).toEqual([24, 48, 82, 94, 81, 93, 92]);
    expect(Object.values(TD.zones).filter((z) => z === "unstated")).toHaveLength(3);
  });
  it("keeps the two accounts of AD 70 apart, Josephus first", () => {
    expect(TD.accounts.map((a) => a.who)).toEqual(["Josephus", "Sulpicius Severus"]);
    expect(plainText(TD.accounts[1].text)).toContain("decided in council");
  });
  it("counts years with no year zero", () => {
    expect(axisYear(-1) + 1).toBe(axisYear(1));
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of HOSTILE) {
      expect(findHouse(bad).id).toBe(DEFAULT_HOUSE);
      expect(findFeast(bad).id).toBe(DEFAULT_FEAST);
      expect(findFind(bad)).toBeNull();
      expect(findOpened(bad)).toBeNull();
      expect(findScale(bad)).toBe("close");
    }
    expect(findOpened("ref:Luke 1:9")?.kind).toBe("ref");
    expect(findOpened("find:robinson")?.kind).toBe("record");
  });
  it("opens verses in the Berean and links only inside the site", () => {
    expect(readerHref("LUK", 1, 9)).toBe("/read/bsb/LUK/1?hl=9-9");
    for (const link of Object.values(TD.links)) expect(link).toMatch(/^\/study\/[a-z0-9-]+$/);
    expect(JSON.stringify(TD)).not.toMatch(/:\/\/|www\./);
    expect(refByKey.has("Exodus 26:22–23")).toBe(true);
  });
});

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const page = (at = "/study/the-temple-and-israels-worship") => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[at]}><Routes><Route path="/study/the-temple-and-israels-worship" element={<TemplePage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>,
);

describe("The temple and Israel's worship: the page", () => {
  afterEach(cleanup);
  it("draws its heading and every section", () => {
    const { container } = page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("one holy room, four houses");
    for (const id of ["landing", "houses", "world", "platform", "priests", "calendar", "fall", "claims", "stops"]) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull();
      expect(container.querySelector(`#${id} .tw-failed`), id).toBeNull();
    }
    expect(container.querySelectorAll(".chk-mark").length).toBeGreaterThan(30);
    expect(container.querySelector("a[href^='http']")).toBeNull();
  });
  it("opens a reference's Berean words in the sheet and closes on Escape", () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector("#houses")!).getAllByRole("button", { name: "1 Kings 6:2" })[0]);
    const sheet = container.querySelector(".ms-sheet.open:not(.chk-panel)")!;
    expect(sheet.textContent).toContain(TD.verses["1KI 6:2"].text.slice(0, 30));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
  });
  it("opens a bare reference against the book named before it", () => {
    const { container } = page("/study/the-temple-and-israels-worship?house=tabernacle");
    fireEvent.click(within(container.querySelector(".tw-house-record")!).getByRole("button", { name: "26:22–23" }));
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")?.textContent).toContain("Exodus 26:22–23");
  });
  it("opens a check note, closes the record sheet for it, and closes on Escape", () => {
    const { container } = page("/study/the-temple-and-israels-worship?open=find:robinson");
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).not.toBeNull();
    fireEvent.click(container.querySelector(".tw-wrap .chk-mark")!);
    expect(container.querySelector(".chk-panel.open")).not.toBeNull();
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".chk-panel.open")).toBeNull();
  });
  it("draws the chosen house and feast from the address, and falls back from bad ones", () => {
    const { container } = page("/study/the-temple-and-israels-worship?house=herod&feast=sukkot&scale=wide");
    expect(container.querySelector(".tw-house[aria-pressed='true']")?.textContent).toContain("Herod");
    expect(container.querySelector(".tw-feast[aria-pressed='true']")?.textContent).toContain("Sukkot");
    expect(container.querySelector(".tw-plan")?.getAttribute("aria-label")).toContain("Mishnah");
    cleanup();
    const again = page("/study/the-temple-and-israels-worship?house=__proto__&feast=constructor&open=<script>&find=toString");
    expect(again.container.querySelector(".tw-house[aria-pressed='true']")?.textContent).toContain("Solomon");
    expect(again.container.querySelector(".tw-feast[aria-pressed='true']")?.textContent).toContain("Pesach");
    expect(again.container.querySelector(".ms-sheet.open")).toBeNull();
  });
  it("chooses a find and opens its record in one step", () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector(".tw-finds")!).getAllByRole("button")[1]);
    expect(container.querySelector(".tw-find[aria-pressed='true']")).not.toBeNull();
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")?.textContent).toContain("Robinson");
  });
});
