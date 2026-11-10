// Bible Jeopardy's page (design 13): set up three teams, build and preview a board, start, play a right answer, a wrong
// answer and a steal, a Daily Double (marked by key) with one undo, reload mid-game and carry on, end into the Final and
// reach Results with the right ranking. The bank is the fixture bank and the verse loading is stubbed.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import JeopardyGame from "./JeopardyGame";
import type { SavedGame } from "./storage";
import { GAME_KEY, SEEN_KEY } from "./storage";

vi.mock("@/lib/data", async (importOriginal) => {
  const { fixtureBank } = await import("./bank.test.fixture");
  const bank = fixtureBank();
  const verses = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`1:${i}`, `Verse words ${i}.`]));
  return {
    ...await importOriginal<typeof import("@/lib/data")>(),
    loadQuestionBank: async () => bank,
    loadChapterPlain: async () => verses,
  };
});

const catalog = { stamp: "test", sections: [], books: [], equivalent: {}, translations: [{ slug: "bsb", books: { GEN: ["1"], EXO: ["1"], RUT: ["1"], "1SA": ["1"], "1KI": ["1"], MAT: ["1"], ACT: ["1"] } }] } as unknown as Catalog;
const renderPage = () => render(<CatalogContext.Provider value={catalog}><MemoryRouter initialEntries={["/games/jeopardy"]}>
  <Routes><Route path="/games/jeopardy" element={<JeopardyGame />} /></Routes>
</MemoryRouter></CatalogContext.Provider>);

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const saved = () => JSON.parse(localStorage.getItem(GAME_KEY)!) as SavedGame;
const scoreOf = (team: string) => within(screen.getByRole("list", { name: "Scores" })).getByRole("button", { name: new RegExp(`^Score of ${team}:`) }).textContent;
const tile = (col: number, row: number) => {
  const { board } = saved().game;
  return screen.getByRole("button", { name: `${board.columns[col].title}, ${board.columns[col].tiles[row].value}, open` });
};

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => vi.restoreAllMocks());

describe("Bible Jeopardy page", () => {
  it("plays a whole night: board, steal, Daily Double, undo, reload, Final and Results", async () => {
    const view = renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: "Build board" })).toBeEnabled(), { timeout: 5000 });
    expect(document.title).toBe("Bible Jeopardy · Games · Bible Guide");
    fireEvent.click(within(screen.getByRole("group", { name: "Columns" })).getByLabelText("3"));
    click("Build board");
    expect(await screen.findByRole("heading", { name: "Your board" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "New questions" })).toHaveLength(3);
    expect(screen.queryByText(/Fixture clue/)).toBeNull();
    click("Start game");

    // Team 1 chooses and is right.
    expect(await screen.findByRole("grid", { name: "Board" })).toBeInTheDocument();
    const dd = saved().game.board.dailyDouble!;
    expect(dd.row).toBeGreaterThanOrEqual(2);
    fireEvent.click(tile(0, 0));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/Fixture clue/);
    click("Team 1: right");
    expect(await screen.findByText("Team 1 +100")).toBeInTheDocument();
    expect(await screen.findByText(/Verse words/)).toBeInTheDocument();
    click("Back to board");
    expect(scoreOf("Team 1")).toBe("100");

    // Team 2 chooses, is wrong, and Team 3 steals.
    fireEvent.click(tile(1, 0));
    click("Team 2: wrong");
    click("Team 3: right");
    click("Back to board");
    expect(scoreOf("Team 2")).toBe("0");
    expect(scoreOf("Team 3")).toBe("100");

    // Team 3 finds the Daily Double, bets 200, is marked right by key, undone with Z, and marked again.
    fireEvent.click(tile(dd.col, dd.row));
    expect(screen.getByRole("heading", { name: "Daily Double" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Bet from 0 to 500"), { target: { value: "200" } });
    click("Show clue");
    fireEvent.keyDown(window, { key: "3", code: "Digit3" });
    await waitFor(() => expect(scoreOf("Team 3")).toBe("300"));
    fireEvent.keyDown(window, { key: "z", code: "KeyZ" });
    await waitFor(() => expect(scoreOf("Team 3")).toBe("100"));
    expect(screen.queryByRole("button", { name: "Team 1: right" })).toBeNull();
    click("Team 3: right");
    click("Back to board");
    expect(scoreOf("Team 3")).toBe("300");

    // A reload mid-game offers Carry on with everything.
    view.unmount();
    renderPage();
    click("Carry on");
    expect(scoreOf("Team 3")).toBe("300");
    expect(screen.getByRole("button", { name: /^Team 1, to choose$/ })).toBeInTheDocument();

    // How to play opens inside the stage, so it shows in full screen too.
    click("Game menu");
    fireEvent.click(screen.getByRole("menuitem", { name: "How to play" }));
    expect(screen.getByRole("dialog", { name: "How to play" }).closest(".jp-stage")).not.toBeNull();
    click("Close");

    // End early into the Final: bets lowest score first.
    click("Game menu");
    fireEvent.click(screen.getByRole("menuitem", { name: "End game" }));
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "End game" }));
    expect(screen.getByText("Every team writes its bet on paper: from 0 up to its score. Teams at zero or below write 0 and still play.")).toBeInTheDocument();
    click("Show the clue");
    click("Show answer");
    const bet = (value: string, right: boolean) => {
      fireEvent.change(screen.getByRole("spinbutton"), { target: { value } });
      click(right ? "Right" : "Wrong");
    };
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
    bet("0", true);
    bet("100", true);
    bet("0", false);

    expect(await screen.findByRole("heading", { name: "Results" })).toBeInTheDocument();
    const rows = Array.from(document.querySelectorAll(".jp-place")).map((row) => row.textContent);
    expect(rows).toEqual(["1stTeam 3300", "2ndTeam 1200", "3rdTeam 20"]);
    expect((JSON.parse(localStorage.getItem(SEEN_KEY)!) as string[]).length).toBe(4);
  }, 20_000);
});
