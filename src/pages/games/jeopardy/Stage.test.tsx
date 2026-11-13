// Bible Jeopardy's stage, the slips a host could see (review of 2026-11-13): the score box never restores an old number,
// a flash never replays after Undo, the results or a tie-breaker, the spoken line never re-reads an old change, the
// answer line says when nobody got it, Esc closes the menu rather than the clue, the podium honours a tie-breaker,
// the team that answers first is marked, Shift + a number-pad key never marks a team right, and names are unique.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useRef, useState, type ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { handBoard, settings } from "./bank.test.fixture";
import type { Settings } from "./model";
import { Results } from "./Results";
import { newGame, reduce, tiedForFirst, type Action, type Game } from "./rules";
import { Stage } from "./Stage";
import { teamNameProblem } from "./display";
import { keyCommand } from "./keys";

vi.mock("@/lib/data", async (importOriginal) => {
  const verses = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`1:${i}`, `Verse words ${i}.`]));
  return { ...await importOriginal<typeof import("@/lib/data")>(), loadChapterPlain: async () => verses };
});
const catalog = { stamp: "test", sections: [], books: [], equivalent: {}, translations: [{ slug: "bsb", books: { GEN: ["1"] } }] } as unknown as Catalog;
const wrap = (el: ReactElement) => render(<CatalogContext.Provider value={catalog}><MemoryRouter>{el}</MemoryRouter></CatalogContext.Provider>);
const start = (over: Partial<Settings> = {}, board = handBoard(3, null)) => newGame("g1", settings(over), board);
const run = (game: Game, ...actions: Action[]) => actions.reduce(reduce, game);

function Harness({ initial }: { initial: Game }) {
  const [game, setGame] = useState(initial);
  const ref = useRef(game);
  const dispatch = (action: Action) => { const next = reduce(ref.current, action); ref.current = next; setGame(next); };
  return <Stage game={game} dispatch={dispatch} autoFullscreen={false} keysPaused={false} canTieBreak={tiedForFirst(game.play).length > 1}
    onTieBreak={() => dispatch({ type: "tie-break", clue: game.board.final! })} onPlayAgain={() => {}} onNewGame={() => {}} onPrintSheet={() => {}} onHelp={() => {}} store={null} />;
}

const key = (k: string, code: string, shiftKey = false) => fireEvent.keyDown(window, { key: k, code, shiftKey });
const scoreLi = (name: string) => screen.getByRole("button", { name: new RegExp(`^Score of ${name}:`) }).closest("li")!;
const scoreLabel = (name: string) => screen.getByRole("button", { name: new RegExp(`^Score of ${name}:`) }).getAttribute("aria-label");
const live = () => document.querySelector('[aria-live="polite"]')!.textContent;

describe("Bible Jeopardy stage", () => {
  it("Undo from the results brings the scoreboard back without replaying the Final's +N", () => {
    const g = run(start({ final: true }, handBoard(3, null, true)),
      { type: "adjust", team: 0, delta: 500 }, { type: "adjust", team: 1, delta: 300 }, { type: "adjust", team: 2, delta: 100 },
      { type: "end" }, { type: "final-clue" }, { type: "final-reveal" },
      { type: "final-mark", team: 2, bet: 0, right: true }, { type: "final-mark", team: 1, bet: 0, right: true });
    wrap(<Harness initial={g} />);
    fireEvent.change(screen.getByLabelText(/Bet of Team 1/), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Right" }));
    expect(screen.queryByRole("list", { name: "Scores" })).toBeNull();
    key("z", "KeyZ");
    expect(scoreLabel("Team 1")).toBe("Score of Team 1: 500. Adjust");
    const float = scoreLi("Team 1").querySelector(".jp-delta");
    expect(float).toBeNull();
    expect(live()).toBe("");
  });

  it("starting a tie-breaker does not replay the last Final change", () => {
    const g = run(start({ final: true }, handBoard(3, null, true)),
      { type: "adjust", team: 0, delta: 500 }, { type: "adjust", team: 1, delta: 300 },
      { type: "end" }, { type: "final-clue" }, { type: "final-reveal" },
      { type: "final-mark", team: 2, bet: 0, right: true });
    wrap(<Harness initial={g} />);
    fireEvent.change(screen.getByLabelText(/Bet of Team 2/), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Right" }));
    fireEvent.change(screen.getByLabelText(/Bet of Team 1/), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Wrong" }));
    fireEvent.click(screen.getByRole("button", { name: "Tie-breaker" }));
    const float = scoreLi("Team 2").querySelector(".jp-delta");
    expect(float).toBeNull();
  });

  it("after Undo the spoken line does not re-read an older change", () => {
    wrap(<Harness initial={start()} />);
    fireEvent.click(screen.getByRole("button", { name: "Category 0, 100, open" }));
    key("1", "Digit1");
    key("Enter", "Enter");
    fireEvent.click(screen.getByRole("button", { name: "Category 0, 200, open" }));
    key("2", "Digit2");
    expect(live()).toBe("Team 2, plus 200, now 200");
    key("z", "KeyZ");
    expect(live()).toBe("");
  });

  it("every team wrong says Nobody got it right, not No points yet", () => {
    wrap(<Harness initial={start({ penalty: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "Category 0, 100, open" }));
    key("!", "Digit1", true); key("@", "Digit2", true); key("#", "Digit3", true);
    expect(scoreLabel("Team 1")).toBe("Score of Team 1: minus 100. Adjust");
    expect(screen.getByRole("status").textContent).toBe("Nobody got it right");
  });

  it("Esc closes the game menu and leaves the clue open; number keys wait while it is open", () => {
    wrap(<Harness initial={start()} />);
    fireEvent.click(screen.getByRole("button", { name: "Category 0, 100, open" }));
    fireEvent.click(screen.getByRole("button", { name: "Game menu" }));
    key("1", "Digit1");
    expect(scoreLabel("Team 1")).toBe("Score of Team 1: 0. Adjust");
    key("Escape", "Escape");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument();
  });

  it("a score panel open while its team scores follows the new score, so Set keeps the points", () => {
    wrap(<Harness initial={start()} />);
    fireEvent.click(screen.getByRole("button", { name: "Category 0, 300, open" }));
    fireEvent.click(screen.getByRole("button", { name: /^Score of Team 1:/ }));
    fireEvent.click(screen.getByRole("button", { name: "Team 1: right" }));
    expect(scoreLabel("Team 1")).toBe("Score of Team 1: 300. Adjust");
    const box = screen.getByLabelText("Exact score for Team 1") as HTMLInputElement;
    expect(box.value).toBe("300");
    fireEvent.click(screen.getByRole("button", { name: "Set" }));
    expect(scoreLabel("Team 1")).toBe("Score of Team 1: 300. Adjust");
  });

  it("the podium puts the tie-breaker's winner alone on first", () => {
    const g = run(start({ final: false }, handBoard(3, null, false)),
      { type: "adjust", team: 0, delta: 500 }, { type: "adjust", team: 1, delta: 500 }, { type: "end" },
      { type: "tie-break", clue: handBoard(3, null, true).final! }, { type: "mark", team: 1, right: true }, { type: "back" });
    expect(g.play.screen).toBe("results");
    expect(g.play.tie?.winner).toBe(1);
    const { container } = wrap(<Results play={g.play} teams={g.play.teams} canTieBreak={false} onTieBreak={() => {}} onPlayAgain={() => {}} onNewGame={() => {}} />);
    const first = container.querySelector('[data-place="1"]')!;
    const second = container.querySelector('[data-place="2"]')!;
    expect(within(first as HTMLElement).queryByText("Team 2")).not.toBeNull();
    expect(within(first as HTMLElement).queryByText("Team 1")).toBeNull();
    expect(within(second as HTMLElement).queryByText("Team 1")).not.toBeNull();
  });
  it("marks the team that answers first in Take turns, on its own row in team order", () => {
    wrap(<Harness initial={run(start(), { type: "choose", team: 1 })} />);
    fireEvent.click(screen.getByRole("button", { name: "Category 0, 100, open" }));
    const rows = within(screen.getByRole("list", { name: "Mark a team" })).getAllByRole("listitem");
    expect(rows.map((row) => /Team \d/.exec(row.textContent ?? "")?.[0])).toEqual(["Team 1", "Team 2", "Team 3"]);
    expect(within(rows[1]).getByText("Answers first")).toBeInTheDocument();
    expect(screen.getAllByText("Answers first")).toHaveLength(1);
  });

  it("Shift + a number-pad key (reported as End with Shift let go) marks nobody; a plain number-pad digit still marks", () => {
    const context = { screen: "clue" as const, fullscreen: false, typing: false };
    const press = (key: string, code: string, shiftKey = false) => keyCommand({ key, code, shiftKey, ctrlKey: false, altKey: false, metaKey: false }, context);
    expect(press("End", "Numpad1")).toBeNull();
    expect(press("1", "Numpad1")).toEqual({ type: "mark", team: 0, right: true });
    expect(press("!", "Digit1", true)).toEqual({ type: "mark", team: 0, right: false });
  });

  it("two teams may not share a name", () => {
    expect(teamNameProblem(["Lions", "lions "], 1)).toBe("Another team already has this name.");
    expect(teamNameProblem(["Lions", "lions "], 0)).toBeNull();
    expect(teamNameProblem(["Lions", "Bears"], 1)).toBeNull();
  });
});
