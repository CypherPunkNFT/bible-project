// The good news page draws, every verse link it can show has its text, a verse opens in the sheet and closes again, and
// the home page's first start choice leads here.
import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { HomeGuide } from "@/pages/home/HomeGuide";
import GoodNewsPage from "./GoodNewsPage";
import { D, passageIds, type Block, type Run } from "./model";

afterEach(cleanup);

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
// The verse words come from the reader's Bible (data/plain/<bible>/<book>.json), read here from disk.
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());

const open = (path = "/study/the-good-news") => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[path]}><Routes><Route path="/study/the-good-news" element={<GoodNewsPage />} /></Routes></MemoryRouter>
  </CatalogContext.Provider>,
);

const runsOf = (blocks: Block[]): Run[] => blocks.flatMap((b) => ("runs" in b ? b.runs : []));

describe("the good news data", () => {
  it("has the text of every passage the page links", () => {
    const { study } = D;
    const runs = [...study.lead, ...study.frame, ...study.selection, ...study.close.way, ...study.close.invite,
      ...study.parts.flatMap((p) => [...runsOf(p.blocks), ...p.consider, ...p.reflect]), ...study.questions.flatMap((q) => runsOf(q.blocks))];
    const ids = [...runs.flatMap((r) => (typeof r === "object" && "r" in r ? [r.r] : [])), ...D.news.flatMap((n) => [n.r, n.then]),
      ...D.lost.flatMap((l) => [l.r, l.sr, l.er]), ...study.parts.flatMap((p) => p.readings), study.close.passage];
    expect(ids.length).toBeGreaterThan(50);
    for (const id of ids) expect(D.passages[id]?.verses.length, id).toBeGreaterThan(0);
  });
  it("holds verse numbers only, each a real verse, never a verse's words", () => {
    for (const [id, passage] of Object.entries(D.passages)) {
      for (const cv of passage.verses) expect(cv, id).toMatch(/^\d+:\d+$/);
      for (const verseId of passageIds(catalog, id)) expect(Number.isInteger(verseId) && verseId > 1000000, id).toBe(true);
    }
  });
  it("links no mock-up and no outside site", () => {
    const text = JSON.stringify(D.study);
    expect(text).not.toMatch(/"a":"(?!\/)/);
    for (const part of D.study.parts) for (const run of runsOf(part.blocks)) if (typeof run === "object" && "a" in run) expect(run.a.startsWith("/mockups")).toBe(false);
  });
});

describe("the good news page", () => {
  it("draws the heading, the ledger, six parts and six questions", () => {
    const screen = open();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("The good news");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(D.news.length + 1);
    expect(screen.container.querySelectorAll(".gn-part")).toHaveLength(6);
    expect(screen.container.querySelectorAll("details.gn-q")).toHaveLength(6);
  });
  it("opens a verse in the sheet, in the reader's Bible, and closes it", async () => {
    const screen = open();
    const sheet = screen.container.querySelector(".ms-sheet")!;
    expect(sheet.classList.contains("open")).toBe(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Luke 15:20" })[0]);
    expect(sheet.classList.contains("open")).toBe(true);
    await waitFor(() => expect(sheet.textContent).toContain("He ran to his son"));
    expect(sheet.textContent).toContain("Berean Standard Bible");
    fireEvent.click(within(sheet as HTMLElement).getByRole("button", { name: "Close this passage" }));
    expect(sheet.classList.contains("open")).toBe(false);
  });
  it("opens the verse named in the address and ignores an unknown one", async () => {
    const screen = open("/study/the-good-news?ref=JHN.3.16");
    await waitFor(() => expect(screen.container.querySelector(".ms-sheet.open")?.textContent).toContain("For God so loved the world"));
    cleanup();
    expect(open("/study/the-good-news?ref=NOPE.1.1").container.querySelector(".ms-sheet.open")).toBeNull();
  });
});

describe("the home page's start box", () => {
  it("opens with the choice that leads to the good news, numbered 01", () => {
    const screen = render(<MemoryRouter><HomeGuide onChoose={() => undefined} layout="side" /></MemoryRouter>);
    const link = screen.getByRole("link", { name: /I'm not a Christian, or I'm not sure/ });
    expect(link.getAttribute("href")).toBe("/study/the-good-news");
    const choices = [...screen.container.querySelectorAll(".home-guide-path")];
    expect(choices[0]).toBe(link);
    expect(choices.map((c) => c.querySelector(".home-guide-number")?.textContent)).toEqual(["01", "02", "03", "04", "05"]);
    expect(screen.getAllByRole("button").filter((b) => b.classList.contains("home-guide-path"))).toHaveLength(4);
  });
});
