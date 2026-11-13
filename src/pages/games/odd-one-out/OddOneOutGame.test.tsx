// Odd one out on the page: start, answer, reveal, the band, the summary, and the hub serving it at /games/odd-one-out.
import { readFileSync } from "node:fs";
import { fireEvent, render as renderPlain, screen, within, type RenderOptions } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import OddOneOutGame from "./OddOneOutGame";

// The key verse's words come from the reader's Bible (data/plain/<bible>/<book>.json), read here from disk.
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
beforeAll(() => vi.stubGlobal("fetch", async (url: string) => {
  const file = `data/${String(url).replace(/^\/data\//, "").replace(/\?.*$/, "")}`;
  try { return new Response(readFileSync(file, "utf8"), { headers: { "content-type": "application/json" } }); }
  catch { return new Response("missing", { status: 404 }); }
}));
afterAll(() => vi.unstubAllGlobals());
const render = (ui: ReactElement, options?: RenderOptions) => renderPlain(<CatalogContext.Provider value={catalog}>{ui}</CatalogContext.Provider>, options);
const renderGame = () => render(<MemoryRouter><OddOneOutGame /></MemoryRouter>);
const choices = () => within(screen.getByRole("group", { name: "The four choices" })).getAllByRole("button");
const choiceNamed = (name: string) => choices().find((b) => b.querySelector(".oo-choice-name")?.textContent === name)!;
const verdict = () => screen.getByRole("status");
const scoreShown = () => document.querySelector(".oo-score")?.getAttribute("data-value");

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe("odd one out page", () => {
  it("shows a sample deal on the start screen that gives nothing away", async () => {
    renderGame();
    await screen.findByRole("button", { name: "Play" });
    const sample = document.querySelector(".oo-sample")!;
    expect(sample.querySelectorAll(".oo-choice")).toHaveLength(4);
    expect(sample.querySelector(".is-right, .oo-stamp")).toBeNull();
    expect(sample.querySelector("button")).toBeNull();
  });

  it("opens a new player's first round with Peter, John, Paul, James and explains the answer", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    expect(choices().map((b) => b.querySelector(".oo-choice-name")?.textContent).sort()).toEqual(["James", "John", "Paul", "Peter"]);
    expect(screen.getByText("1 of 10")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0 of 10 answered" })).toBeInTheDocument();
    fireEvent.click(choiceNamed("Paul"));
    expect(within(verdict()).getByText("Right!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(choiceNamed("Paul")).toHaveAttribute("data-state", "right");
    expect(choiceNamed("Paul").querySelector(".oo-stamp.is-right")).not.toBeNull();
    expect(document.querySelector(".oo-ring")).toBeNull();
    expect(choiceNamed("Peter")).toHaveAttribute("data-state", "faded");
    expect(screen.getByRole("img", { name: "1 of 10 answered" })).toBeInTheDocument();
    expect(scoreShown()).toBe("1");
    expect(screen.getAllByText(/was not with Jesus during his ministry/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Why"));
    expect(screen.getByText(/Also true:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Matthew 4:18–19" })).toHaveAttribute("href", "/read/bsb/MAT/4?hl=18-19");
    expect(screen.getByRole("link", { name: "Paul" })).toHaveAttribute("href", "/people/paul");
    expect(await screen.findByText(/Come, follow Me/)).toBeInTheDocument(); // the key verse, Matthew 4:18–19
  });

  it("locks the first answer, marks the pick and the true odd one, and moves on with Next", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    fireEvent.click(choiceNamed("Peter"));
    expect(within(verdict()).getByText("Not quite")).toBeInTheDocument();
    expect(within(verdict()).getByText("was the odd one out").previousElementSibling).toHaveTextContent("Paul");
    expect(choiceNamed("Peter")).toHaveAttribute("data-state", "wrong");
    expect(choiceNamed("Paul")).toHaveAttribute("data-state", "right");
    expect(choiceNamed("Paul").className).toContain("is-late");
    fireEvent.click(choiceNamed("Paul"));
    expect(within(verdict()).getByText("Not quite")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("2 of 10")).toBeInTheDocument();
    expect(scoreShown()).toBe("0");
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("answers by number key and moves on by Enter, but not from a control or a form", async () => {
    render(<MemoryRouter><OddOneOutGame /><textarea aria-label="Correction" /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Correction" }), { key: "2" });
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: "2" });
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByText("Why"), { key: "Enter" }); // opens the fold; never Next
    expect(screen.getByText("1 of 10")).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(screen.getByText("2 of 10")).toBeInTheDocument();
  });

  it("can leave a round after a confirm, and keys do nothing while the dialog is open", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Leave round" }));
    fireEvent.keyDown(document.body, { key: "2" });
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep playing" }));
    expect(screen.getByText("1 of 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Leave round" }));
    fireEvent.click(document.querySelector(".kit-dialog .is-danger")!);
    expect(screen.getByRole("heading", { level: 1, name: "Odd one out" })).toHaveFocus();
    expect(sessionStorage.getItem("bp-odd-one-out-round")).toBe("null");
  });

  it("resumes the revealed answer after remount without moving focus, completes all ten, and keeps the best", async () => {
    const view = renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    fireEvent.click(choiceNamed("Paul"));
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    const saved = sessionStorage.getItem("bp-odd-one-out-round");
    view.unmount();
    renderGame();
    expect(within(await screen.findByRole("status")).getByText("Right!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).not.toHaveFocus();
    expect(sessionStorage.getItem("bp-odd-one-out-round")).toBe(saved);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    for (let n = 2; n <= 10; n += 1) {
      expect(screen.getByText(`${n} of 10`)).toBeInTheDocument();
      fireEvent.click(choices()[0]);
      expect(screen.getByRole("button", { name: n === 10 ? "See results" : "Next" })).toHaveFocus();
      fireEvent.click(screen.getByRole("button", { name: n === 10 ? "See results" : "Next" }));
    }
    const heading = screen.getByRole("heading", { level: 2, name: "Your round" });
    expect(heading).toHaveFocus();
    const best = JSON.parse(localStorage.getItem("bp-odd-one-out-best")!)["person:easy"];
    expect(document.querySelector(".kit-score")).toHaveAttribute("data-value", String(best));
    expect(document.querySelectorAll(".oo-summary-list > li")).toHaveLength(10);
    expect(document.querySelectorAll(".kit-trail__mark.is-right")).toHaveLength(best);
    if (best > 0) expect(screen.getByText("New best")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change game" }));
    expect(screen.getByText("Your best here").nextElementSibling).toHaveTextContent(`${best} / 10`);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByText("1 of 10")).toBeInTheDocument();
    expect(scoreShown()).toBe("0");
  });

  it("does not celebrate a new best again when a finished round is reopened", async () => {
    const view = renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    for (let n = 1; n <= 10; n += 1) {
      fireEvent.click(n === 1 ? choiceNamed("Paul") : choices()[0]);
      fireEvent.click(screen.getByRole("button", { name: n === 10 ? "See results" : "Next" }));
    }
    expect(screen.getByText("New best")).toBeInTheDocument();
    view.unmount();
    renderGame();
    expect(await screen.findByRole("heading", { level: 2, name: "Your round" })).toBeInTheDocument();
    expect(screen.queryByText("New best")).not.toBeInTheDocument();
    expect(document.querySelector(".kit-confetti")).toBeNull();
  });

  it("says why levels are greyed for Books, in words a phone can read", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Books" }));
    const hard = screen.getByRole("button", { name: /Hard/ });
    expect(hard).toBeDisabled();
    expect(hard).toHaveAccessibleDescription(/for now/);
    expect(screen.getByText(/for now/)).toBeInTheDocument();
  });

  it("is served by the games hub at its own address", async () => {
    render(<MemoryRouter initialEntries={["/games/odd-one-out"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>); // App's Suspense, as on the site
    expect(await screen.findByRole("heading", { level: 1, name: "Odd one out" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
