// Who's older? on the page: start, a scripted round from a fixed seed, the reveal in the band with Next in reach, the
// run-over card, sharing that falls back to the copy box, and the hub serving the game at /games/whos-older.
import { readFileSync } from "node:fs";
import { fireEvent, render as renderPlain, screen, within, type RenderOptions } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import data from "@/data/whos-older/whos-older.json";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import { buildPool, current, newRun, pairOf, whoStays, type Run, type WhosOlderData } from "./game";
import WhosOlderGame from "./WhosOlderGame";

// The deciding verse's words come from the reader's Bible (data/plain/<bible>/<book>.json), read here from disk.
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());
const render = (ui: ReactElement, options?: RenderOptions) => renderPlain(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>, options);

const pool = buildPool(data as unknown as WhosOlderData);
const renderGame = () => render(<MemoryRouter><WhosOlderGame /></MemoryRouter>);
const cards = () => within(screen.getByRole("group", { name: "The two people" })).getAllByRole("button");
const card = (label: string) => within(screen.getByRole("group", { name: "The two people" })).getByRole("button", { name: new RegExp(`^${label.replace(/[()]/g, "\\$&")},`) });

/** The round on screen, as the game saved it. */
const savedRound = () => current((JSON.parse(localStorage.getItem("bp-whos-older")!) as { run: Run }).run);

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("who's older page", () => {
  it("deals the seeded first pair, locks the first tap, explains the answer in the band and slides the stayer left", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // the run's seed
    const first = current(newRun(pool, "streak", "mixed", Math.floor(0.5 * 2 ** 31)));
    const pair = pairOf(pool, first)!;
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    expect(screen.getByRole("heading", { level: 1, name: "Who lived first?" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0 in a row" })).toBeInTheDocument(); // the scoreboard
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull(); // the band is closed
    fireEvent.click(card(pair.first.label));
    expect(await screen.findByRole("heading", { level: 2, name: /Right!/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus(); // Enter carries on
    expect(card(pair.first.label)).toHaveAttribute("data-state", "right");
    expect(card(pair.second.label)).toHaveAttribute("data-state", "faded");
    expect(card(pair.first.label)).toHaveTextContent("Came first");
    expect(document.querySelector(".wo-reason")).toHaveTextContent(/^Even on the dating systems that bring them closest/);
    expect(document.querySelector(".wo-gap-label")).toHaveTextContent(/^at least \d/); // the strip's bracket
    expect(screen.getByRole("link", { name: pair.first.label })).toHaveAttribute("href", pair.first.href);
    fireEvent.click(card(pair.second.label)); // the first tap is locked
    expect(screen.getByRole("heading", { level: 2, name: /Right!/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    const stayer = whoStays(pool, [first])!;
    expect(cards()[0]).toHaveAccessibleName(new RegExp(`^${pool.byId.get(stayer)!.label},`)); // one stays
    expect(cards()[0].className).toContain(stayer === first.right ? "is-slid" : "is-held");
    expect(cards()[1].className).toContain("is-arrived");
  });

  it("resumes a saved run and quotes the deciding verse with a link to the reader", async () => {
    const run = { ...newRun(pool, "streak", "mixed", 1), rounds: [{ left: "eve-gen-3-20", right: "adam-gen-2-19", pick: null }] };
    localStorage.setItem("bp-whos-older", JSON.stringify({ version: 1, best: { streak: 4, relaxed: 0 }, run }));
    renderGame();
    expect(await screen.findByRole("img", { name: "4 in a row" })).toBeInTheDocument(); // the best streak, with its flame
    fireEvent.click(screen.getByRole("button", { name: "Continue (streak 0)" }));
    fireEvent.click(card("Adam"));
    expect(await screen.findByText("Scripture says Adam was formed first, and Eve was made from his side.")).toBeInTheDocument();
    expect(await screen.findByText(/For Adam was formed first, and then Eve\./)).toBeInTheDocument(); // in the reader's Bible
    expect(screen.getByRole("link", { name: "1 Timothy 2:13" })).toHaveAttribute("href", "/read/bsb/1TI/2?hl=13");
    expect(document.querySelector(".wo-gap-label")).toBeNull(); // no invented years for early Genesis
    expect(document.querySelectorAll(".wo-year")[0]).toHaveTextContent("earlier");
  });

  it("keeps the streak reached on the scoreboard after a miss, and plays by keyboard", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = current(newRun(pool, "streak", "mixed", Math.floor(0.5 * 2 ** 31)));
    const pair = pairOf(pool, first)!;
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    fireEvent.keyDown(window, { key: first.left === pair.first.id ? "1" : "2" });
    expect(await screen.findByRole("heading", { level: 2, name: /Right!/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "1 in a row" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    const dealt = savedRound();
    const wrong = pairOf(pool, dealt)!.second;
    fireEvent.click(card(wrong.label));
    expect(await screen.findByRole("heading", { level: 2, name: /Not this time/ })).toBeInTheDocument();
    expect(screen.getByText("Run over — streak of 1")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "1 in a row" })).toBeInTheDocument(); // not "0 in a row" under "streak of 1"
    expect(card(wrong.label)).toHaveAttribute("data-state", "wrong");
    expect(card(wrong.label)).toHaveTextContent("Wrong");
  });

  it("ends a Streak on a miss, shows the result card, and offers the copy box when sharing is unavailable", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.25);
    const pair = pairOf(pool, current(newRun(pool, "streak", "mixed", Math.floor(0.25 * 2 ** 31))))!;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    fireEvent.click(card(pair.second.label));
    expect(await screen.findByRole("heading", { level: 2, name: /Not this time/ })).toBeInTheDocument();
    expect(screen.getByText(/Run over — streak of 0/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "See your result" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Your streak" })).toHaveFocus();
    expect(document.querySelector(".kit-score")).toHaveAttribute("data-value", "0");
    expect(screen.queryByText("New best!")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "The one you missed" })).toBeInTheDocument();
    expect(document.querySelector(".wo-missed .wo-timeline")).toBeInTheDocument(); // its strip already open
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("blocked")) } });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const box = await screen.findByRole("textbox", { name: "Text to copy" });
    expect(box).toHaveValue("Who's older? — streak of 0 🔥\nbibleguide.io/games/whos-older");
    expect((box as HTMLTextAreaElement).value).not.toContain(pair.first.label);
    fireEvent.click(screen.getByRole("button", { name: "Back to start" }));
    expect(screen.getByRole("heading", { level: 1, name: "Who's older?" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue/ })).not.toBeInTheDocument();
  });

  it("says New best once, and not again when the ended run is reopened after a reload", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = current(newRun(pool, "streak", "mixed", Math.floor(0.5 * 2 ** 31)));
    const pair = pairOf(pool, first)!;
    const { unmount } = renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    fireEvent.click(card(pair.first.label));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(card(pairOf(pool, savedRound())!.second.label));
    fireEvent.click(await screen.findByRole("button", { name: "See your result" }));
    expect(await screen.findByText("New best!")).toBeInTheDocument();
    expect(document.querySelector(".kit-score")).toHaveAttribute("data-value", "1");
    unmount();
    renderGame();
    expect(await screen.findByRole("heading", { level: 1, name: "Your streak" })).toBeInTheDocument();
    expect(screen.queryByText("New best!")).not.toBeInTheDocument();
  });

  it("is served by the games hub at its own address", async () => {
    render(<MemoryRouter initialEntries={["/games/whos-older"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 1, name: "Who's older?" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
