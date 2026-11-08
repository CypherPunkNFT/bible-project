// Odd one out on the page: start, answer, reveal, and the hub serving it at /games/odd-one-out.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GamesPage from "../GamesPage";
import OddOneOutGame from "./OddOneOutGame";

const renderGame = () => render(<MemoryRouter><OddOneOutGame /></MemoryRouter>);

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe("odd one out page", () => {
  it("opens a new player's first round with Peter, John, Paul, James and explains the answer", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    const choices = within(screen.getByRole("group", { name: "The four choices" })).getAllByRole("button");
    expect(choices.map((b) => b.querySelector(".oo-choice-name")?.textContent).sort()).toEqual(["James", "John", "Paul", "Peter"]);
    expect(screen.getByText("1 of 10")).toBeInTheDocument();
    fireEvent.click(choices.find((b) => b.textContent?.includes("Paul"))!);
    expect(await screen.findByRole("heading", { level: 3, name: /Right!/ })).toHaveFocus();
    expect(screen.getAllByText(/was not with Jesus during his ministry/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Also true:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Matthew 4:18–19" })).toHaveAttribute("href", "/read/bsb/MAT/4?hl=18-19");
    expect(screen.getByRole("link", { name: "Paul" })).toHaveAttribute("href", "/people/paul");
  });

  it("locks the first answer and moves on with Next", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    const group = screen.getByRole("group", { name: "The four choices" });
    const peter = within(group).getAllByRole("button").find((b) => b.textContent?.includes("Peter"))!;
    fireEvent.click(peter);
    expect(await screen.findByRole("heading", { level: 3, name: /Not quite: the odd one out was Paul/ })).toBeInTheDocument();
    fireEvent.click(within(group).getAllByRole("button").find((b) => b.textContent?.includes("Paul"))!);
    expect(screen.getByRole("heading", { level: 3, name: /Not quite/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("2 of 10")).toBeInTheDocument();
    expect(screen.getByText("Score 0")).toBeInTheDocument();
  });

  it("ignores number keys typed into a form elsewhere on the page", async () => {
    render(<MemoryRouter><OddOneOutGame /><textarea aria-label="Correction" /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Play" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Correction" }), { key: "2" });
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: "2" });
    expect(await screen.findByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("is served by the games hub at its own address", async () => {
    render(<MemoryRouter initialEntries={["/games/odd-one-out"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>); // App's Suspense, as on the site
    expect(await screen.findByRole("heading", { level: 1, name: "Odd one out" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
