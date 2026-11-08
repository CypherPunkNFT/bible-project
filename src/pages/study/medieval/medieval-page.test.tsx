import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import MedievalPage from "./MedievalPage";
import { D } from "./model";

const HREF = "/study/the-medieval-church";
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const page = (at = HREF) => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[at]}><Routes><Route path={HREF} element={<MedievalPage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>,
);
const recordSheet = (container: HTMLElement) => container.querySelector(".ms-sheet.open:not(.chk-panel)");
const notePanel = (container: HTMLElement) => container.querySelector(".chk-panel.open");

describe("The medieval church: the page", () => {
  afterEach(cleanup);
  it("draws its heading and every section, the new ones in order", () => {
    const { container } = page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("The medieval church");
    const ids = [...container.querySelectorAll(".mv-sec")].map((s) => s.id);
    expect(ids).toEqual(["landing", "mirror", "mission", "powers", "split", "crusade", "school", "parish", "claims", "stops", "sheet"]);
    for (const id of ids) expect(container.querySelector(`#${id} .mv-failed`), id).toBeNull();
    const numbers = [...container.querySelectorAll(".mv-head .mv-kicker b")].map((b) => b.textContent);
    expect(numbers).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
  });
  it("shows no check-mark syntax anywhere, with a record sheet open", () => {
    const { container } = page(`${HREF}?open=pair:dictatus&step=lyon&event=gui`);
    expect(container.innerHTML).not.toContain("{{check");
    expect(container.innerHTML).not.toContain("{{/check");
  });
  it("chooses a step between East and West and an event of the crusades from the address and from the list", () => {
    const { container } = page(`${HREF}?step=florence&event=beziers`);
    expect(container.querySelector(".mv-steprecord h3")?.textContent).toBe(D.split.steps.find((s) => s.id === "florence")!.head);
    expect(container.querySelector(".mv-crurecord h3")?.textContent).toBe("The legate's own count.");
    fireEvent.click(screen.getByRole("button", { name: /Two sentences in one week/ }));
    expect(container.querySelector(".mv-steprecord h3")?.textContent).toBe("Two sentences in one week.");
    fireEvent.click(screen.getByRole("button", { name: /Up to their ankles/ }));
    expect(container.querySelector(".mv-crurecord")?.textContent).toContain("Ibn al-Athir");
  });
  it("gives the witness table its headers and words for every mark", () => {
    const { container } = page();
    const table = container.querySelector(".mv-crugrid")!;
    expect([...table.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["Event", "Latin", "Greek", "Jewish", "Muslim", "Accused"]);
    expect(table.querySelectorAll("tbody td").length).toBe(D.crusade.events.length * D.crusade.sides.length);
    for (const td of table.querySelectorAll("tbody td")) expect(td.querySelector(".mv-sr")?.textContent).toMatch(/witness survives|none used/);
  });
  it("opens a check note from a highlighted passage, and closes it on Escape", () => {
    const { container } = page(`${HREF}?step=chalcedon`);
    const mark = container.querySelector(".mv-steprecord .chk-mark")!;
    expect(mark.textContent).toContain("null and void");
    fireEvent.click(mark);
    expect(notePanel(container)?.textContent).toContain("Still open");
    expect(notePanel(container)?.textContent).toContain("Leo");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(notePanel(container)).toBeNull();
  });
  it("keeps one sheet open at a time: a note closes the record, and a record closes the note", () => {
    const { container } = page(`${HREF}?open=pair:dictatus&event=gui`);
    expect(recordSheet(container)).not.toBeNull();
    fireEvent.click(container.querySelector(".mv-crurecord .chk-mark")!);
    expect(notePanel(container)).not.toBeNull();
    expect(recordSheet(container)).toBeNull();
    fireEvent.click(container.querySelector("[data-opener='pair:dictatus']")!);
    expect(recordSheet(container)).not.toBeNull();
    expect(notePanel(container)).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(recordSheet(container)).toBeNull();
  });
  it("links outside the site only by https", () => {
    const { container } = page();
    for (const a of container.querySelectorAll("a[href]")) expect(a.getAttribute("href"), a.textContent ?? "").toMatch(/^(\/(?![/\\])|#|https:\/\/)/);
  });
});
