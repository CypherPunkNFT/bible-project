// The quiz on the games page: the board with Play all twelve, a question card, right and wrong, the keys, the band,
// the ending with its share text, the saved round, and the homepage left as it was.
import { readFileSync } from "node:fs";
import { act, fireEvent, render as renderPlain, screen, within, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { QUESTIONS } from "@/pages/quiz-data";
import QuizGame from "./QuizGame";

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

const render = (ui: ReactElement, options?: RenderOptions) => renderPlain(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>, options);
const renderGame = () => render(<MemoryRouter><QuizGame /></MemoryRouter>);
const tiles = () => within(screen.getByRole("list", { name: "The twelve questions" })).getAllByRole("button");
const answers = () => within(screen.getByRole("group", { name: "The four answers" })).getAllByRole("button");
const answerRight = (i: number) => fireEvent.click(answers()[QUESTIONS[i].answer]);
const answerWrong = (i: number) => fireEvent.click(answers()[(QUESTIONS[i].answer + 1) % 4]);
const next = () => fireEvent.click(screen.getByRole("button", { name: /Next question|See how you did/ }));

describe("the quiz on the games page", () => {
  it("opens on the board with Play all twelve and every tile in the page, none answered", () => {
    renderGame();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How well do you know the Bible?");
    expect(screen.getByRole("button", { name: "Play all twelve" })).toBeInTheDocument();
    expect(tiles()).toHaveLength(12);
    expect(document.querySelector(".qz-seal, .qz-ribbon")).toBeNull();
    expect(screen.queryByRole("button", { name: "Start again" })).toBeNull();
  });

  it("deals the first question from Play all twelve, with four dealt answer cards and the trail", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Play all twelve" }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(QUESTIONS[0].ask);
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 2 }));
    expect(answers()).toHaveLength(4);
    expect(answers()[0]).toHaveTextContent("A");
    expect(screen.getByRole("img", { name: "0 of 12 answered" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next question/ })).toBeNull();
  });

  it("lands a right answer: gold card, +1, the score, the band with Next, the verse on the back", async () => {
    renderGame();
    fireEvent.click(tiles()[0]);
    answerRight(0);
    expect(answers()[QUESTIONS[0].answer]).toHaveClass("is-right", "is-landed");
    expect(document.querySelector(".qz-plus")).toHaveTextContent("+1");
    expect(screen.getByRole("status")).toHaveTextContent("Right.");
    expect(screen.getByRole("button", { name: /Next question/ })).toBeInTheDocument();
    expect(document.querySelector(".qz-score-n")).toHaveTextContent("1");
    expect(document.querySelector(".kit-flip")).toHaveAttribute("data-flipped", "true");
    expect(document.querySelector(".kit-flip__back")).toHaveClass("is-right");
    expect(await screen.findByText(QUESTIONS[0].ref)).toBeInTheDocument();
    expect(screen.getByText(QUESTIONS[0].why)).toBeInTheDocument();
  });

  it("marks a wrong answer: the pick shakes red, the right one pulses, the back edged for a miss, no +1", () => {
    renderGame();
    fireEvent.click(tiles()[1]);
    answerWrong(1);
    const wrong = answers()[(QUESTIONS[1].answer + 1) % 4];
    expect(wrong).toHaveClass("is-wrong");
    expect(answers()[QUESTIONS[1].answer]).toHaveClass("is-right");
    expect(answers()[QUESTIONS[1].answer]).not.toHaveClass("is-landed");
    expect(document.querySelector(".qz-plus")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Not quite:");
    expect(screen.getByRole("status")).toHaveTextContent("Light");
    expect(document.querySelector(".kit-flip__back")).toHaveClass("is-wrong");
    expect(document.querySelector(".qz-score-n")).toHaveTextContent("0");
  });

  it("answers from the keyboard with A to D and 1 to 4, once only", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Play all twelve" }));
    fireEvent.keyDown(window, { key: "b" });
    expect(answers()[1]).toHaveClass(QUESTIONS[0].answer === 1 ? "is-right" : "is-wrong");
    fireEvent.keyDown(window, { key: "3" });
    expect(answers()[2]).not.toHaveClass("is-wrong");
    next();
    fireEvent.keyDown(window, { key: "2" });
    expect(answers()[1]).toHaveClass(QUESTIONS[1].answer === 1 ? "is-right" : "is-wrong");
  });

  it("lights the streak from two in a row and resets it on a miss", () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Play all twelve" }));
    answerRight(0);
    expect(document.querySelector(".kit-streak")).not.toHaveClass("is-lit");
    next();
    answerRight(1);
    expect(document.querySelector(".kit-streak")).toHaveClass("is-lit");
    expect(screen.getByRole("img", { name: "2 in a row" })).toBeInTheDocument();
    next();
    answerWrong(2);
    expect(document.querySelector(".kit-streak")).not.toHaveClass("is-lit");
  });

  it("makes the board the scorecard: a gold seal for right, a Missed ribbon and a grey drawing for wrong", () => {
    renderGame();
    fireEvent.click(tiles()[0]);
    answerRight(0);
    fireEvent.click(screen.getByRole("button", { name: "Close, back to all twelve questions" }));
    fireEvent.click(tiles()[1]);
    answerWrong(1);
    fireEvent.click(screen.getByRole("button", { name: "Close, back to all twelve questions" }));
    expect(tiles()[0]).toHaveAttribute("data-state", "right");
    expect(tiles()[0].querySelector(".qz-seal")).not.toBeNull();
    expect(tiles()[1]).toHaveAttribute("data-state", "wrong");
    expect(tiles()[1].querySelector(".qz-ribbon")).toHaveTextContent("Missed");
    expect(screen.getByRole("button", { name: "Carry on" })).toBeInTheDocument();
    expect(screen.getByText("2 of 12 answered")).toBeInTheDocument();
  });

  it("asks before starting again and keeps the round when the player cancels", () => {
    renderGame();
    fireEvent.click(tiles()[0]);
    answerRight(0);
    fireEvent.click(screen.getByRole("button", { name: "Start again" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Start again?");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".qz-score-n")).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "Start again" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Start again" }));
    expect(screen.getByRole("button", { name: "Play all twelve" })).toBeInTheDocument();
    expect(sessionStorage.getItem("bp-quiz-round")).toBeNull();
  });

  it("ends on the score, a rank, the verdict verse, twelve marks and the share text; a perfect round is a Berean", async () => {
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Play all twelve" }));
    for (let i = 0; i < 12; i++) { answerRight(i); next(); }
    expect(screen.getByRole("img", { name: "12 of 12 right" })).toBeInTheDocument();
    expect(document.querySelector(".kit-score")).toHaveAttribute("data-value", "12");
    expect(document.querySelector(".kit-rank")).toHaveTextContent("Berean");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Every one. Like the Bereans.");
    expect(screen.getByText("New best")).toBeInTheDocument();
    expect(document.querySelector(".kit-hop")).not.toBeNull();
    expect(document.querySelector(".kit-share__preview")).toHaveTextContent("12/12");
    expect(document.querySelector(".kit-share__preview")?.textContent).toContain("🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨🟨");
    expect(localStorage.getItem("bp-quiz-best")).toBe("12");
    expect(await screen.findByText("Acts 17:11")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("button", { name: "Play all twelve" })).toBeInTheDocument();
  });

  it("gives a mixed round its rank and verdict and no ribbon when the best was higher", () => {
    localStorage.setItem("bp-quiz-best", "11");
    renderGame();
    fireEvent.click(screen.getByRole("button", { name: "Play all twelve" }));
    for (let i = 0; i < 12; i++) { if (i < 9) answerRight(i); else answerWrong(i); next(); }
    expect(document.querySelector(".kit-score")).toHaveAttribute("data-value", "9");
    expect(document.querySelector(".kit-rank")).toHaveTextContent("Scribe");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Well read, and worth reading on.");
    expect(screen.queryByText("New best")).toBeNull();
    expect(screen.getByRole("img", { name: "9 in a row" })).toBeInTheDocument();
    expect(localStorage.getItem("bp-quiz-best")).toBe("11");
  });

  it("keeps the round for the tab: a reload returns to the same card, already answered, without celebrating", () => {
    const first = renderGame();
    fireEvent.click(tiles()[4]);
    answerRight(4);
    first.unmount();
    renderGame();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(QUESTIONS[4].ask);
    expect(answers()[QUESTIONS[4].answer]).toHaveClass("is-right");
    expect(document.querySelector(".qz-plus")).toBeNull();
    expect(screen.getByRole("button", { name: /Next question/ })).toBeInTheDocument();
  });

  it("carries on from the board to the first unanswered question", () => {
    renderGame();
    fireEvent.click(tiles()[0]);
    answerRight(0);
    fireEvent.click(screen.getByRole("button", { name: "Close, back to all twelve questions" }));
    fireEvent.click(screen.getByRole("button", { name: "Carry on" }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(QUESTIONS[1].ask);
  });

  it("leaves the homepage quiz untouched: it still uses its own component, not the game's", async () => {
    const home = await import("@/pages/home/HomeQuiz");
    const source = readFileSync("src/pages/home/HomeQuiz.tsx", "utf8");
    expect(typeof home.HomeQuiz).toBe("function");
    expect(source).not.toMatch(/games\/quiz|qz-/);
    await act(async () => {});
  });
});
