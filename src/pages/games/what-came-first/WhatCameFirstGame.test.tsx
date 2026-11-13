// What came first? on the page: the nine pills (no dropdown) with Mixed chosen for a new player, a played round and its
// reveal in every category, Mixed's changing heading, Who's older? players' bests and saved run carried over, the result
// card with its share text, and the old address forwarding here with Who lived first chosen.
import { readFileSync } from "node:fs";
import { fireEvent, render as renderPlain, screen, waitFor, within, type RenderOptions } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { MemoryRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import { CATEGORIES, categoryInfo } from "./categories";
import { answersOf, current, isPairRound, pairOf, questionOf, type Run } from "./game";
import type { CategoryKey } from "./order";
import { englishPools } from "./test-pools";
import WhatCameFirstGame from "./WhatCameFirstGame";

// The deciding verse's words come from the reader's Bible (data/plain/<bible>/<book>.json), read here from disk.
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());
const render = (ui: ReactElement, options?: RenderOptions) => renderPlain(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>, options);

const pools = englishPools();
let where = "";
function Where() { const location = useLocation(); where = location.pathname + location.search; return null; }
const renderGame = (at = "/games/what-came-first") => render(<MemoryRouter initialEntries={[at]}><Where /><WhatCameFirstGame /></MemoryRouter>);
const savedRun = () => (JSON.parse(localStorage.getItem("bp-what-came-first")!) as { run: Run }).run;
const pill = (name: string) => within(screen.getByRole("group", { name: "What to play" })).getByRole("button", { name });

/** Taps the right (or a wrong) answer of the round on screen. */
function tap(right: boolean) {
  const round = current(savedRun());
  if (isPairRound(round)) {
    const pair = pairOf(pools, round)!;
    const label = (right ? pair.first : pair.second).label;
    fireEvent.click(within(screen.getByRole("group", { name: "The two cards" })).getByRole("button", { name: new RegExp(`^${label.replace(/[()?.*+]/g, "\\$&")}(,|$)`) }));
    return pair.first.label;
  }
  const answers = answersOf(questionOf(pools, round)!);
  const index = right ? 0 : round.order.find((i) => i !== 0)!;
  fireEvent.click(within(screen.getByRole("group", { name: "The answers" })).getByRole("button", { name: answers[index] }));
  return answers[0];
}

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("what came first page", () => {
  it("shows all nine pills at once, never a dropdown, with Mixed chosen for a new player", async () => {
    renderGame();
    expect(await screen.findByRole("heading", { level: 1, name: "What came first?" })).toBeInTheDocument();
    const pills = within(screen.getByRole("group", { name: "What to play" })).getAllByRole("button");
    expect(pills.map((p) => p.textContent)).toEqual(CATEGORIES.map((c) => c.label));
    expect(pill("Mixed")).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("select, [role=combobox], [role=listbox]")).toBeNull();
    fireEvent.click(pill("Rulers"));
    expect(pill("Rulers")).toHaveAttribute("aria-pressed", "true");
    expect(where).toBe("/games/what-came-first?c=ruled");
    expect(screen.getByText("Who ruled first?")).toBeInTheDocument();
  });

  it.each(CATEGORIES.filter((c) => c.key !== "mixed").map((c) => c.key as CategoryKey))("plays a round of %s with its question, reveal and reason", async (key) => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    renderGame(`/games/what-came-first?c=${key}`);
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    const round = current(savedRun());
    expect(round.category).toBe(key);
    const heading = screen.getByRole("heading", { level: 1 });
    if (key === "firsts") expect(heading).toHaveTextContent(questionOf(pools, round)!.question);
    else if (key === "went") expect(heading).toHaveTextContent(/^Where did .+ go first\?$/);
    else expect(heading).toHaveTextContent(categoryInfo(key).heading);
    const answer = tap(true);
    expect(await screen.findByRole("heading", { level: 2, name: /Right!/ })).toBeInTheDocument();
    expect(document.querySelector(".wo-verdict-who")).toHaveTextContent(answer);
    expect(document.querySelector(".wo-reason")!.textContent!.length).toBeGreaterThan(10);
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    if (key === "firsts" || key === "went") expect(document.querySelector(".wo-quote a")).toHaveAttribute("href", expect.stringMatching(/^\/read\/bsb\//));
    expect(!!document.querySelector(".wo-timeline")).toBe(key !== "firsts" && key !== "went" && key !== "books");
  });

  it("changes the heading with each round's kind in Mixed, with the kind's chip above it", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.3);
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Relaxed" }));
    fireEvent.click(screen.getByRole("button", { name: "Easy" }));
    const kinds = new Set<string>();
    for (let n = 0; n < 12; n++) {
      const round = current(savedRun());
      kinds.add(round.category);
      expect(document.querySelector(".wcf-chip")).toHaveTextContent(categoryInfo(round.category).label);
      tap(true);
      fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    }
    expect(kinds.size).toBeGreaterThan(3);
  });

  it("carries a Who's older? player's bests and saved run into Who lived first", async () => {
    const pair = pools.lived!.byBand.easy[3];
    const old = JSON.stringify({ version: 1, best: { streak: 4, relaxed: 6 }, run: { stamp: pools.lived!.stamp, mode: "streak", difficulty: "mixed",
      seed: 1, hearts: 3, over: false, rounds: [{ left: pair.second.id, right: pair.first.id, pick: null }] } });
    localStorage.setItem("bp-whos-older", old);
    renderGame();
    expect(await screen.findByRole("img", { name: "4 in a row" })).toBeInTheDocument(); // the old best streak
    expect(pill("People")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Continue \(streak 0\)/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Who lived first?" })).toBeInTheDocument();
    expect(current(savedRun())).toMatchObject({ category: "lived", left: pair.second.id, right: pair.first.id });
    expect(localStorage.getItem("bp-whos-older")).toBe(old);
  });

  it("ends a Streak on a miss, shows the result card titled with the kind, and shares without naming anything", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.25);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderGame("/games/what-came-first?c=built");
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    const answer = tap(false);
    expect(await screen.findByText(/Run over — streak of 0/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "See your result" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Your streak" })).toHaveFocus();
    expect(document.querySelector(".wcf-over-kind")).toHaveTextContent("What was built first?");
    expect(screen.getByRole("heading", { level: 2, name: "The one you missed" })).toBeInTheDocument();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("blocked")) } });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const box = await screen.findByRole("textbox", { name: "Text to copy" });
    expect(box).toHaveValue("What came first? · What was built first? — streak of 0 🔥\nbibleguide.io/games/what-came-first?c=built");
    expect((box as HTMLTextAreaElement).value).not.toContain(answer);
  });
});

describe("the addresses", () => {
  it("forwards the old Who's older? address in the site's routes", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app).toContain('<Route path="/games/whos-older" element={<Navigate to="/games/what-came-first?c=lived" replace />} />');
  });

  it("opens the game from the old address with Who lived first chosen, and serves it from the hub", async () => {
    render(<MemoryRouter initialEntries={["/games/whos-older"]}><Where /><Suspense fallback="Loading…">
      <Routes>
        <Route path="/games/whos-older" element={<Navigate to="/games/what-came-first?c=lived" replace />} />
        <Route path="/games/*" element={<GamesPage />} />
      </Routes>
    </Suspense></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 1, name: "What came first?" }, { timeout: 5000 })).toBeInTheDocument();
    await waitFor(() => expect(pill("People")).toHaveAttribute("aria-pressed", "true"));
    expect(where).toBe("/games/what-came-first?c=lived");
  });
});
