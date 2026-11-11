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
/** Opens the Check or Reveal menu and picks an item. */
const pick = (menu: "Check" | "Reveal", item: string) => {
  fireEvent.click(screen.getByRole("button", { name: menu }));
  fireEvent.click(within(screen.getByRole("group", { name: menu })).getByRole("button", { name: item }));
};

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
    pick("Check", "Puzzle");
    expect(screen.queryByRole("group", { name: "Check" })).toBeNull(); // the menu closes on a pick
    const saved = JSON.parse(localStorage.getItem("bp-crossword")!).game;
    expect(saved.checks).toBe(1);
    // Q is wrong unless the answer has a Q there; either way the mark agrees with the answer, and a right letter is confirmed.
    expect(square(cell).classList.contains("is-wrong")).toBe(saved.wrong.includes(cell));
    expect(square(cell).classList.contains("is-right")).toBe(saved.right.includes(cell));
    expect(saved.wrong.includes(cell) || saved.right.includes(cell)).toBe(true);
    // Retyping the square drops its mark either way.
    fireEvent.click(square(cell));
    press("Backspace");
    const after = JSON.parse(localStorage.getItem("bp-crossword")!).game;
    expect(after.wrong).not.toContain(cell);
    expect(after.right).not.toContain(cell);
  });

  it("asks before New puzzle throws away typed letters, and keeps the grid on Cancel", async () => {
    const before = await startSmall();
    press("A");
    fireEvent.click(screen.getByRole("button", { name: "New puzzle" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Throw away this puzzle?" })).toBeInTheDocument();
    // Letters typed while the dialog is open never reach the grid.
    fireEvent.keyDown(window, { key: "b" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    const kept = JSON.parse(localStorage.getItem("bp-crossword")!).game;
    expect(kept.layout).toEqual(before.layout);
    expect(kept.letters.filter((l: string) => l !== "")).toEqual(["A"]);
    fireEvent.click(screen.getByRole("button", { name: "New puzzle" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "New puzzle" }));
    expect(JSON.parse(localStorage.getItem("bp-crossword")!).game.layout).not.toEqual(before.layout);
  });

  it("shows the words filled and the clock, and keeps the time in the save", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"] });
    try {
      renderGame();
      await act(async () => { await new Promise((resolve) => setImmediate(resolve)); }); // the clues' dynamic import settles
      fireEvent.click(screen.getByRole("button", { name: "Jesus & the Gospels" }));
      fireEvent.click(screen.getByRole("button", { name: "Small" }));
      fireEvent.click(screen.getByRole("button", { name: "Make my crossword" }));
      expect(screen.getByRole("img", { name: "0 words filled" })).toBeInTheDocument();
      expect(screen.getByText("0:00")).toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(2100); });
      expect(screen.getByText("0:02")).toBeInTheDocument();
      press("A");
      expect(JSON.parse(localStorage.getItem("bp-crossword")!).game.seconds).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reveals a word, then the whole puzzle after a second tap, and says it is solved", async () => {
    await startSmall();
    pick("Reveal", "Word");
    expect(document.querySelectorAll(".cw-square.is-revealed").length).toBeGreaterThan(2);
    expect(document.querySelectorAll(".cw-list button.is-confirmed").length).toBe(1); // the revealed word earns its tick
    pick("Reveal", "Puzzle");
    expect(screen.queryByRole("heading", { name: "Solved!" })).toBeNull();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Yes, reveal all" }));
    expect(await screen.findByRole("heading", { name: "Solved!" })).toHaveFocus();
    expect(screen.getByText(/letters revealed\./)).toBeInTheDocument();
    expect(screen.getByText("Words")).toBeInTheDocument();
    expect(screen.queryByText("New best")).toBeNull(); // a revealed solve never sets a best time
    const stored = JSON.parse(localStorage.getItem("bp-crossword")!);
    expect(stored.solved).toBe(1);
    expect(stored.best).toEqual({});
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
