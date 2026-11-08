// Who's older? on the page: start, a scripted round from a fixed seed, the reveal with its verse, the run-over screen,
// sharing that falls back to the copy box, and the hub serving the game at /games/whos-older.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import data from "@/data/whos-older/whos-older.json";
import GamesPage from "../GamesPage";
import { buildPool, current, newRun, pairOf, type WhosOlderData } from "./game";
import WhosOlderGame from "./WhosOlderGame";

const pool = buildPool(data as unknown as WhosOlderData);
const renderGame = () => render(<MemoryRouter><WhosOlderGame /></MemoryRouter>);
const card = (label: string) => within(screen.getByRole("group", { name: "The two people" })).getByRole("button", { name: new RegExp(`^${label},`) });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("who's older page", () => {
  it("deals the seeded first pair, locks the first tap and explains the answer", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // the run's seed
    const first = current(newRun(pool, "streak", "mixed", Math.floor(0.5 * 2 ** 31)));
    const pair = pairOf(pool, first)!;
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    expect(screen.getByRole("heading", { level: 1, name: "Who lived first?" })).toBeInTheDocument();
    fireEvent.click(card(pair.first.label));
    expect(await screen.findByRole("heading", { level: 2, name: /Right!/ })).toHaveFocus();
    expect(document.querySelector(".wo-reason")).toHaveTextContent(/^Even on the dating systems that bring them closest/);
    expect(screen.getByRole("link", { name: pair.first.label })).toHaveAttribute("href", pair.first.href);
    fireEvent.click(card(pair.second.label)); // the first tap is locked
    expect(screen.getByRole("heading", { level: 2, name: /Right!/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    const cards = within(screen.getByRole("group", { name: "The two people" })).getAllByRole("button");
    expect(cards[0]).toHaveAccessibleName(new RegExp(`^${pool.byId.get(first.right)!.label},`)); // one stays: the right-hand card moves left
  });

  it("resumes a saved run and quotes the deciding verse with a link to the reader", async () => {
    const run = { ...newRun(pool, "streak", "mixed", 1), rounds: [{ left: "eve-gen-3-20", right: "adam-gen-2-19", pick: null }] };
    localStorage.setItem("bp-whos-older", JSON.stringify({ version: 1, best: { streak: 4, relaxed: 0 }, run }));
    renderGame();
    expect(await screen.findByText("Best streak: 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue (streak 0)" }));
    fireEvent.click(card("Adam"));
    expect(await screen.findByText("Scripture says Adam was formed first, and Eve was made from his side.")).toBeInTheDocument();
    expect(screen.getByText(/For Adam was formed first, and then Eve\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1 Timothy 2:13" })).toHaveAttribute("href", "/read/bsb/1TI/2?hl=13");
  });

  it("ends a Streak on a miss, shows the run-over screen, and offers the copy box when sharing is unavailable", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.25);
    const pair = pairOf(pool, current(newRun(pool, "streak", "mixed", Math.floor(0.25 * 2 ** 31))))!;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Streak" }));
    fireEvent.click(card(pair.second.label));
    expect(await screen.findByRole("heading", { level: 2, name: /Not this time/ })).toBeInTheDocument();
    expect(screen.getByText(/Run over — streak of 0/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "See your result" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Streak of 0" })).toHaveFocus();
    expect(screen.getByRole("heading", { level: 2, name: "The one you missed" })).toBeInTheDocument();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("blocked")) } });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const box = await screen.findByRole("textbox", { name: /Copy your result/ });
    expect(box).toHaveValue("Who's older? — streak of 0 🔥\nbibleguide.io/games/whos-older");
    expect((box as HTMLTextAreaElement).value).not.toContain(pair.first.label);
    fireEvent.click(screen.getByRole("button", { name: "Back to start" }));
    expect(screen.getByRole("heading", { level: 1, name: "Who's older?" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue/ })).not.toBeInTheDocument();
  });

  it("is served by the games hub at its own address", async () => {
    render(<MemoryRouter initialEntries={["/games/whos-older"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 1, name: "Who's older?" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
