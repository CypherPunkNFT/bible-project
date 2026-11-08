import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { bsbWords } from "@/lib/bsb-for-tests";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { bereanVerse, D, findKind, findOpened, findPoem, findTest, findTool, findWord, P, readerHref, refByKey, versesOf } from "./model";
import PoetryPage from "./PoetryPage";
import { path } from "./route";

const RECORD = "content/academic-research/13-hebrew-poetry-and-biblical-narrative.json";
const HOSTILE = ["__proto__", "constructor", "toString", "", "<script>", "ref:", "source:", "ref:__proto__", "source:constructor", "ref:Psalm 999:1", "0", "12", "-1", "1e9", "7.5"];
const normal = (text: string) => text.replace(/[“”"‘’']/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const held = new Map<string, Record<string, string>>();
/** The site's Leningrad Hebrew for a verse, without the marks the page does not show: the paragraph signs (a lone פ or ס) and the inverted nun (׆) of Psalm 107. */
function wlcWords(code: string, chapter: number, verse: number): string {
  if (!held.has(code)) held.set(code, JSON.parse(readFileSync(`data/plain/wlc/${code}.json`, "utf8")) as Record<string, string>);
  return (held.get(code)![`${chapter}:${verse}`] ?? "").split(" ").filter((word) => !["פ", "ס", "׆"].includes(word)).join(" ");
}

describe("Hebrew poetry and biblical narrative: its data", () => {
  it("is routed at its own address", () => {
    expect(path).toBe("/study/hebrew-poetry-and-biblical-narrative");
  });
  it("was built from the research record as it stands", () => {
    const raw = readFileSync(RECORD, "utf8").replace(/\r\n/g, "\n");
    expect(P.recordHash).toBe(createHash("sha256").update(raw, "utf8").digest("hex"));
  });
  it("carries every verse in the Berean's own words and, in the Old Testament, the Leningrad Hebrew's", () => {
    const verses = Object.values(P.verses);
    expect(verses.length).toBeGreaterThan(100);
    let hebrew = 0;
    for (const v of verses) {
      const where = `${v.code} ${v.chapter}:${v.verse}`;
      expect(normal(v.lines.join(" ")), where).toBe(normal(bsbWords(v)));
      if (v.hebrew) {
        hebrew++;
        expect(v.hebrew, where).toBe(wlcWords(v.code, v.chapter, v.hebrewVerse ?? v.verse));
      }
    }
    expect(hebrew).toBeGreaterThan(100);
  });
  it("divides each paired verse so that its lines put back together are the whole verse in both languages", () => {
    const keys = Object.keys(P.pairs);
    expect(keys.length).toBeGreaterThanOrEqual(20);
    for (const key of keys) {
      const { rows, title } = P.pairs[key];
      const verse = P.verses[key];
      expect([title?.he, ...rows.map((r) => r.he)].filter(Boolean).join(" "), key).toBe(verse.hebrew);
      const english = rows.map((r) => r.en).join(" ");
      expect([english, `${title?.en} ${english}`], key).toContain(verse.lines.join(" "));
      expect(rows.length, key).toBeGreaterThanOrEqual(2);
    }
    expect(P.pairs["PSA 145:13"].rows.filter((r) => r.he === null)).toHaveLength(2);
  });
  it("supplies every verse label the page uses", () => {
    const used = [...D.stance.verses, ...D.claims.flatMap((c) => c.verses), ...D.parallelism.kinds.flatMap((k) => k.examples),
      ...D.patterns.items.flatMap((k) => k.examples), ...D.keyWords.items.flatMap((k) => k.examples), ...D.storyteller.tools.flatMap((k) => k.examples)];
    for (const label of used) expect(versesOf(label).length, label).toBeGreaterThan(0);
  });
  it("draws each alphabet column with twenty-two letters in order, its gaps as gaps", () => {
    expect(P.acrostics.columns.length).toBeGreaterThanOrEqual(5);
    for (const column of P.acrostics.columns) {
      // Lamentations 2, 3 and 4 put pe before ayin; every other column keeps the order of the alphabet.
      const order = /^Lamentations [234]$/.test(column.label) ? "אבגדהוזחטיכלמנספעצקרשת" : "אבגדהוזחטיכלמנסעפצקרשת";
      expect(column.letters.map((l) => l.letter).join(""), column.label).toBe(order);
      for (const slot of column.letters) if (slot.verse !== null) expect(bereanVerse(column, slot.verse), column.label).toBeGreaterThan(0);
    }
    const psalm145 = P.acrostics.columns.find((c) => c.label === "Psalm 145")!;
    expect(psalm145.letters.filter((l) => l.verse === null).map((l) => l.name)).toEqual(["nun"]);
    expect(P.acrostics.psalm119).toBe(176);
    expect(P.acrostics.lamentations3).toBe(66);
  });
  it("finds Genesis 1's seven verdicts and the Judges refrains in the held text", () => {
    expect(P.threads.verdicts).toBe(7);
    expect(P.threads.rows.good.map((r) => r.ref)).toEqual(["Genesis 1:4", "Genesis 1:10", "Genesis 1:12", "Genesis 1:18", "Genesis 1:21", "Genesis 1:25", "Genesis 1:31"]);
    expect(P.threads.judgesKing).toEqual(["17:6", "18:1", "19:1", "21:25"]);
    for (const row of Object.values(P.threads.rows).flat()) {
      const verse = P.verses[row.key];
      const words = verse.hebrew!.split(" ");
      for (const at of row.he) expect(words[at], row.ref).toBeTruthy();
    }
  });
  it("falls back when the address asks for something unknown", () => {
    for (const bad of HOSTILE) {
      expect(findKind(bad)).toBe("restate");
      expect(findWord(bad)).toBe("recognize");
      expect(findTool(bad)).toBe("gaps");
      expect(findPoem(bad)).toBe(7);
      expect(findTest(bad)).toBeNull();
      expect(findOpened(bad)).toBeNull();
    }
    expect(findOpened("ref:Psalm 19:1")?.kind).toBe("ref");
    expect(findOpened(`source:${D.sources[0].id}`)?.kind).toBe("source");
    expect(findPoem("1")).toBe(0);
    expect(findTest("5")).toBe(5);
  });
  it("opens verses in the Berean and links only inside the site", () => {
    expect(readerHref("PSA", 145, 13)).toBe("/read/bsb/PSA/145?hl=13-13");
    for (const link of [...Object.values(P.links.pages), ...Object.values(P.links.studies)]) expect(link).toMatch(/^\/study\/[a-z0-9-]+$/);
    expect(JSON.stringify(P)).not.toContain("://");
    expect(refByKey.has("Psalm 145:13")).toBe(true);
  });
});

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const page = (at = path) => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[at]}><Routes><Route path={path} element={<PoetryPage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>,
);

describe("Hebrew poetry and biblical narrative: the page", () => {
  afterEach(cleanup);
  it("draws its heading and every section", () => {
    const { container } = page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/poetry/i);
    for (const id of ["landing", "lines", "folds", "letters", "words", "story", "greek", "claims", "stops"]) {
      expect(container.querySelector(`#${id}`), id).not.toBeNull();
      expect(container.querySelector(`#${id} .hpn-failed`), id).toBeNull();
    }
  });
  it("sets the Hebrew right to left beside the Berean, line by line", () => {
    const { container } = page();
    const rows = container.querySelectorAll("#lines .hpn-row");
    expect(rows.length).toBeGreaterThan(1);
    const hebrew = rows[0].querySelector(".hpn-he")!;
    expect(hebrew.getAttribute("dir")).toBe("rtl");
    expect(hebrew.getAttribute("lang")).toBe("he");
    expect(rows[0].querySelector(".hpn-en")).not.toBeNull();
  });
  it("draws Psalm 145 by default with its missing nun, and another poem from the address", () => {
    const { container } = page();
    expect(container.querySelector(".hpn-poem[aria-pressed='true']")?.textContent).toContain("Psalm 145");
    expect(container.querySelectorAll("#letters .hpn-column .hpn-gap")).toHaveLength(1);
    cleanup();
    const again = page(`${path}?poem=1&kind=__proto__&tool=<script>`);
    expect(again.container.querySelector(".hpn-poem[aria-pressed='true']")?.textContent).toContain(D.acrostics.poems[0].ref);
    expect(again.container.querySelector(".hpn-kind[aria-pressed='true']")?.textContent).toContain(D.parallelism.kinds.find((k) => k.id === "restate")!.name.replace(/\*/g, "").slice(0, 8));
    expect(again.container.querySelector(".hpn-strip-frame[aria-pressed='true']")?.textContent).toContain(D.storyteller.tools.find((t) => t.id === "gaps")!.name.slice(0, 8));
  });
  it("opens a reference's Hebrew and Berean in the sheet and closes on Escape", () => {
    const { container } = page();
    fireEvent.click(within(container.querySelector("#lines")!).getAllByRole("button", { name: /^Psalm|^Genesis|^Isaiah|^Proverbs/ })[0]);
    const sheet = container.querySelector(".ms-sheet.open:not(.chk-panel)")!;
    expect(sheet).not.toBeNull();
    expect(sheet.querySelector(".hpn-he[dir='rtl']")).not.toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
  });
  it("opens a check note, closes the verse sheet for it, and closes on Escape", () => {
    const { container } = page(`${path}?open=ref:Psalm 19:1`);
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).not.toBeNull();
    fireEvent.click(container.querySelector(".chk-mark")!);
    expect(container.querySelector(".chk-panel.open")).not.toBeNull();
    expect(container.querySelector(".ms-sheet.open:not(.chk-panel)")).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".chk-panel.open")).toBeNull();
  });
  it("opens nothing from a hostile address", () => {
    const { container } = page(`${path}?open=source:__proto__&poem=__proto__&test=constructor`);
    expect(container.querySelector(".ms-sheet.open")).toBeNull();
    expect(container.querySelector(".hpn-poem[aria-pressed='true']")?.textContent).toContain("Psalm 145");
  });
});
