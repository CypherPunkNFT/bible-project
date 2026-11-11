// Bible twenty questions on the page (design §15 "UI" and "Learning"): a whole guess-mode game played from the notes,
// the report held until the player leaves the won screen, "Actually, that wasn't my person", a lost game's lesson, a
// whole reverse-mode game, keyboard controls, resuming after a reload, and the hub serving the game as live.
import { readFileSync } from "node:fs";
import { act, fireEvent, render as renderPlain, screen, within, type RenderOptions } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import data from "@/data/twenty-questions/twenty-questions.json";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import { GAMES, isLive } from "../registry";
import { pickSecret, prepare, simulate, type TqData } from "./engine";
import { REPORT_URL } from "./report";
import TwentyQuestionsGame from "./TwentyQuestionsGame";

const engine = prepare(data as unknown as TqData);
const SEED = Math.floor(0.5 * 2 ** 31); // Math.random is held at 0.5 below
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const reports: unknown[] = [];

beforeAll(() => vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
  if (url === REPORT_URL) { reports.push(JSON.parse(String(init?.body))); return new Response("{}", { status: 201 }); }
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => { localStorage.clear(); reports.length = 0; vi.spyOn(Math, "random").mockReturnValue(0.5); });
afterEach(() => { vi.restoreAllMocks(); });

const render = (ui: ReactElement, options?: RenderOptions) => renderPlain(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>, options);
const renderGame = () => render(<MemoryRouter><TwentyQuestionsGame /></MemoryRouter>);
const button = (name: string | RegExp) => screen.getByRole("button", { name });
const tagOfQuestion = (text: string) => engine.data.tags.findIndex((t) => t.q === text);

/** Answers every question truthfully from the guess-mode notes, says No to wrong guesses; returns at the result. */
function playAs(person: number, answerWith: (word: "Yes" | "No" | "Don't know") => void = (word) => fireEvent.click(button(word))) {
  for (let turn = 0; turn < 30; turn++) {
    const heading = screen.getByRole("heading", { level: 1 });
    if (/^Got it|^You win/.test(heading.textContent ?? "")) return heading.textContent;
    if (screen.queryByText("Are you thinking of…")) {
      fireEvent.click(button(heading.textContent === `${engine.data.people[person].label}?` ? "Yes, that's them!" : "No"));
      continue;
    }
    if (screen.queryByRole("button", { name: /I give up/ })) { fireEvent.click(button(/I give up/)); continue; }
    const letter = engine.data.people[person].v[tagOfQuestion(heading.textContent ?? "")];
    answerWith(letter === "y" ? "Yes" : letter === "n" ? "No" : "Don't know");
  }
  throw new Error("the game did not end in 30 turns");
}

const findable = engine.data.people.findIndex((p, i) => p.t === 1 && simulate(engine, i, SEED) !== null);

describe("guess mode", () => {
  it("plays a whole game from the notes, reaches the person and sends the report only on leaving the won screen", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "I think, you guess" }));
    expect(screen.getByText("Turn 1 of 20")).toBeInTheDocument();
    playAs(findable);
    expect(screen.getByRole("heading", { level: 1, name: `Got it in ${simulate(engine, findable, SEED)}!` })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Read about ${engine.data.people[findable].label}` })).toBeInTheDocument();
    expect(reports).toHaveLength(0);
    fireEvent.click(button("Play again"));
    expect(reports).toEqual([expect.objectContaining({ who: engine.data.people[findable].id, inPool: true, result: "won", disputed: [] })]);
    expect(screen.getByText("Turn 1 of 20")).toBeInTheDocument();
  });

  it("takes a win back with \"Actually, that wasn't my person\", sending nothing", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "I think, you guess" }));
    playAs(findable);
    fireEvent.click(button("Actually, that wasn't my person"));
    expect(screen.queryByText(/^Got it/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "All games" }));
    expect(reports).toHaveLength(0);
  });

  it("after a loss, asks who it was, shows where the answers differed and softens a disputed note on this device", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "I think, you guess" }));
    // Think of Moses but answer every question with the opposite of the notes where they are sure.
    const moses = engine.personIndex.get("moses-exo-2-10")!;
    let flipped = 0;
    for (let turn = 0; turn < 30 && !screen.queryByRole("heading", { name: /You win/ }); turn++) {
      if (screen.queryByText("Are you thinking of…")) { fireEvent.click(button("No")); continue; }
      if (screen.queryByRole("button", { name: /I give up/ })) { fireEvent.click(button(/I give up/)); continue; }
      const letter = engine.data.people[moses].v[tagOfQuestion(screen.getByRole("heading", { level: 1 }).textContent ?? "")];
      if (flipped < 1 && (letter === "y" || letter === "n")) { flipped++; fireEvent.click(button(letter === "y" ? "No" : "Yes")); }
      else fireEvent.click(button("Don't know"));
    }
    fireEvent.change(screen.getByLabelText("Their name"), { target: { value: "Moses" } });
    fireEvent.click(within(screen.getByRole("list", { name: "People in the game" })).getAllByRole("button")[0]);
    expect(screen.getByRole("heading", { name: "It was Moses." })).toBeInTheDocument();
    const lesson = screen.getByRole("region", { name: "Where we disagreed" });
    expect(within(lesson).getByText("1 of 1")).toBeInTheDocument();
    fireEvent.click(within(lesson).getByRole("button", { name: "I still think your note is wrong" }));
    expect(within(lesson).getByRole("status")).toHaveTextContent("will not count it against you again");
    expect(within(lesson).queryByRole("button", { name: "Oh, I see" })).not.toBeInTheDocument();
    expect(within(lesson).getByText("Thanks: this helps the game get better.")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("bp-twenty-questions")!).softened[engine.data.version]).toHaveLength(1);
    fireEvent.click(button("Play again"));
    expect(reports).toEqual([expect.objectContaining({ who: "moses-exo-2-10", result: "lost", disputed: [expect.any(String)] })]);
  });

  it("answers with Y, N and D, and takes answers back with U", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "I think, you guess" }));
    fireEvent.keyDown(window, { key: "y" });
    fireEvent.keyDown(window, { key: "n" });
    fireEvent.keyDown(window, { key: "d" });
    expect(screen.getByText("Turn 4 of 20")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "u" });
    expect(screen.getByText("Turn 3 of 20")).toBeInTheDocument();
    fireEvent.click(button("Undo"));
    expect(screen.getByText("Turn 2 of 20")).toBeInTheDocument();
  });

  it("asks before quitting, in a dialog that keeps the letter keys quiet", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "I think, you guess" }));
    fireEvent.click(button("Quit"));
    fireEvent.keyDown(window, { key: "y" });
    expect(screen.getByText("Turn 1 of 20")).toBeInTheDocument();
    fireEvent.click(button("Keep playing"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "y" });
    expect(screen.getByText("Turn 2 of 20")).toBeInTheDocument();
    fireEvent.click(button("Quit"));
    fireEvent.click(button("Yes, quit"));
    expect(screen.getByRole("button", { name: "I think, you guess" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue your game" })).not.toBeInTheDocument();
  });

  it("resumes the game in progress after a reload", async () => {
    const first = renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "I think, you guess" }));
    fireEvent.click(button("Yes"));
    const question = screen.getByRole("heading", { level: 1 }).textContent;
    first.unmount();
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Continue your game" }));
    expect(screen.getByText("Turn 2 of 20")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(question!);
  });
});

describe("reverse mode", () => {
  it("answers questions from the notes, costs a turn for a wrong guess and ends on the right one, sending nothing", async () => {
    const secret = pickSecret(engine, "easy", [], 0.5);
    const name = engine.data.people[secret].label;
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "You ask the questions" }));
    const picker = screen.getByRole("region", { name: "Questions you can ask" });
    fireEvent.change(within(picker).getByPlaceholderText(/Find a question/), { target: { value: "woman" } });
    fireEvent.click(within(picker).getByRole("button", { name: /Is your person a woman\?/ }));
    const said = engine.data.people[secret].v[engine.tagIndex.get("woman")!] === "y" ? "Yes" : "No";
    expect(within(screen.getByRole("list", { name: "Answers so far" })).getByText(said)).toBeInTheDocument();
    expect(screen.getByText("Turn 2 of 20")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Show hints" }));
    expect(screen.getByText(/People still possible: \d+/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "People still possible" }).querySelectorAll(".tq-suspect").length).toBeGreaterThan(0);

    const wrong = engine.data.people.find((p, i) => i !== secret && p.t === 1 && !p.label.startsWith(name.slice(0, 3)))!;
    fireEvent.click(button("Make a guess"));
    fireEvent.change(screen.getByLabelText("Who is it?"), { target: { value: wrong.label } });
    fireEvent.click(within(screen.getByRole("list", { name: "People in the game" })).getByRole("button", { name: new RegExp(`^${wrong.label}`) }));
    expect(within(screen.getByRole("list", { name: "Answers so far" })).getByText(wrong.label, { selector: "s" })).toBeInTheDocument();
    expect(screen.getByText("Turn 3 of 20")).toBeInTheDocument();

    fireEvent.click(button("Make a guess"));
    fireEvent.change(screen.getByLabelText("Who is it?"), { target: { value: name } });
    const exact = within(screen.getByRole("list", { name: "People in the game" })).getAllByRole("button").find((b) => b.querySelector(".tq-result-name")?.textContent === name)!;
    fireEvent.click(exact);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(`Yes! It was ${name}. You got it in 3.`);
    expect(screen.getByText(/The site would have needed|This one is hard/)).toBeInTheDocument();
    await act(async () => { await Promise.resolve(); });
    expect(reports).toHaveLength(0);
  });
});

describe("the games hub", () => {
  it("lists the game as live and serves it at its own address", async () => {
    expect(isLive(GAMES.find((g) => g.slug === "twenty-questions")!)).toBe(true);
    render(<MemoryRouter initialEntries={["/games/twenty-questions"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>);
    expect(await screen.findByRole("heading", { level: 1, name: "Bible twenty questions" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
