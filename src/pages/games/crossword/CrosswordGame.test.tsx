// Bible crossword on the page: choose, make, type, check, reveal and solve, and the hub serving it at /games/crossword.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GamesPage from "../GamesPage";
import CrosswordGame from "./CrosswordGame";

const renderGame = () => render(<MemoryRouter><CrosswordGame /></MemoryRouter>);
const squares = () => within(screen.getByRole("group", { name: "Crossword grid" })).getAllByRole("button");
const square = (cell: number) => squares().find((b) => b.dataset.cell === String(cell))!;
const press = (key: string) => act(() => { fireEvent.click(within(screen.getByRole("group", { name: "Keyboard" })).getByRole("button", { name: key })); });

beforeEach(() => localStorage.clear());

async function startSmall() {
  renderGame();
  fireEvent.click(await screen.findByRole("button", { name: "Jesus & the Gospels" }));
  fireEvent.click(screen.getByRole("button", { name: "Small" }));
  fireEvent.click(screen.getByRole("button", { name: "Make my crossword" }));
  return JSON.parse(localStorage.getItem("bp-crossword")!).game;
}

describe("crossword page", () => {
  it("makes a puzzle from the chosen theme and saves it in this browser", async () => {
    const game = await startSmall();
    expect(game.spec.source).toEqual({ theme: "jesus" });
    expect(squares().length).toBe(game.letters.length - document.querySelectorAll(".cw-block").length);
    expect(screen.getByRole("heading", { name: "Across" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Down" })).toBeInTheDocument();
    expect(document.querySelector(".cw-bar-name")?.textContent).toMatch(/^1 (Across|Down)$/);
  });

  it("types a letter, moves on, and Check marks it wrong", async () => {
    await startSmall();
    const selected = squares().find((b) => b.tabIndex === 0)!;
    const cell = Number(selected.dataset.cell);
    press("Q");
    expect(square(cell).querySelector(".cw-letter")?.textContent).toBe("Q");
    expect(squares().find((b) => b.tabIndex === 0)).not.toBe(square(cell));
    fireEvent.click(within(screen.getByRole("group", { name: "Check" })).getByRole("button", { name: "Puzzle" }));
    const saved = JSON.parse(localStorage.getItem("bp-crossword")!).game;
    expect(saved.checks).toBe(1);
    // Q is wrong unless the answer has a Q there; either way the mark agrees with the answer.
    expect(square(cell).classList.contains("is-wrong")).toBe(saved.wrong.includes(cell));
  });

  it("reveals a word, then the whole puzzle after a second tap, and says it is solved", async () => {
    await startSmall();
    const reveal = () => within(screen.getByRole("group", { name: "Reveal" }));
    fireEvent.click(reveal().getByRole("button", { name: "Word" }));
    expect(document.querySelectorAll(".cw-square.is-revealed").length).toBeGreaterThan(2);
    fireEvent.click(reveal().getByRole("button", { name: "Puzzle" }));
    expect(screen.queryByRole("heading", { name: "Solved!" })).toBeNull();
    fireEvent.click(reveal().getByRole("button", { name: "Yes, reveal all" }));
    expect(await screen.findByRole("heading", { name: "Solved!" })).toHaveFocus();
    expect(screen.getByText(/letters revealed\./)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("bp-crossword")!).solved).toBe(1);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href")?.startsWith("/read/bsb/"))).toBe(true);
  });

  it("comes back to the same puzzle after a reload", async () => {
    await startSmall();
    press("A");
    const before = squares().map((b) => b.textContent);
    cleanup();
    renderGame();
    await screen.findByRole("group", { name: "Crossword grid" });
    expect(squares().map((b) => b.textContent)).toEqual(before);
  });

  it("is a live game on the hub", async () => {
    render(<MemoryRouter initialEntries={["/games/crossword"]}><Suspense fallback={null}><Routes>
      <Route path="/games/*" element={<GamesPage />} />
    </Routes></Suspense></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Bible crossword", level: 1 }, { timeout: 5000 })).toBeInTheDocument();
  });
});
