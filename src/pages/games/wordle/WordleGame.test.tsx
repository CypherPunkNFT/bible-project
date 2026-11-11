// The page as the hub opens it, typed into with the physical keyboard and the on-screen one. The verse stands in for
// the real one (it would fetch the Bible), and so does the person record.
import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import GamesPage from "../GamesPage";
import { STORAGE_KEY } from "./storage";

vi.mock("@/components/Verse", () => ({ Verse: ({ id }: { id: number }) => <span>{`verse ${id}`}</span> }));
vi.mock("@/lib/study", async (original) => ({ ...(await original<typeof import("@/lib/study")>()), loadPersonDetail: () => Promise.resolve({ b: "Commander of Saul's army" }) }));

const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
const renderAt = (path: string) => render(
  <CatalogContext.Provider value={catalog}>
    <MemoryRouter initialEntries={[path]}>
      <Suspense fallback={<p>Loading</p>}><Routes><Route path="/games/*" element={<GamesPage />} /></Routes></Suspense>
    </MemoryRouter>
  </CatalogContext.Provider>,
);

/** Types a word on the physical keyboard and presses Enter. */
function play(word: string) {
  for (const key of word) fireEvent.keyDown(window, { key });
  fireEvent.keyDown(window, { key: "Enter" });
}

/** Opens the game on a date, past the How to play panel a first visit shows. */
async function open(date: Date) {
  vi.setSystemTime(date);
  const firstVisit = !JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").seenHelp;
  const page = renderAt("/games/wordle");
  await screen.findByRole("heading", { level: 1, name: "Bible Wordle" }, LOADED);
  if (firstVisit) {
    const help = await screen.findByRole("dialog", { name: "How to play" }, LOADED);
    fireEvent.click(within(help).getByRole("button", { name: "Close" }));
  }
  return page;
}

/** The puzzle data is loaded on demand; a busy test run can take a few seconds over it. */
const LOADED = { timeout: 10_000 };
const rowText = (row: number) => within(screen.getByRole("group", { name: `Row ${row}` })).getAllByRole("img").map((tile) => tile.getAttribute("aria-label")).join(", ");
const reducedMotion = (query: string) => ({ matches: query.includes("reduce"), media: query, addEventListener: () => {}, removeEventListener: () => {} });

describe("bible wordle page", () => {
  const savedMatchMedia = window.matchMedia;
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    window.matchMedia = reducedMotion as unknown as typeof window.matchMedia; // rows colour at once, no turning to wait for
  });
  afterEach(() => { vi.useRealTimers(); window.matchMedia = savedMatchMedia; });

  it("opens from the hub's address with How to play on the first visit, and today's number and date", async () => {
    vi.setSystemTime(new Date(2026, 10, 8, 10));
    renderAt("/games/wordle");
    expect(await screen.findByRole("heading", { level: 1, name: "Bible Wordle" }, LOADED)).toBeInTheDocument();
    expect(await screen.findByRole("dialog", { name: "How to play" }, LOADED)).toBeVisible();
    expect(screen.getByText(/^#2 · Sunday, 8 November|^#2 · Sunday, November 8/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").seenHelp).toBe(true);
  });

  it("refuses a short row and an unknown word without using a try", async () => {
    await open(new Date(2026, 10, 8, 10));
    play("thor");
    expect(screen.getByText("Not enough letters")).toBeInTheDocument();
    for (let i = 0; i < 4; i++) fireEvent.keyDown(window, { key: "Backspace" });
    play("qqqqq");
    expect(screen.getByText("Not in the word list")).toBeInTheDocument();
    expect(rowText(1)).toBe("Q, Q, Q, Q, Q");
  });

  it("colours a guess, then wins with the on-screen keyboard and shows the verse, the link and the share button", async () => {
    await open(new Date(2026, 10, 8, 10)); // #2 is THORN
    play("north");
    expect(rowText(1)).toBe("N is in the word, wrong spot, O is in the word, wrong spot, R is in the word, wrong spot, T is in the word, wrong spot, H is in the word, wrong spot");
    const keyboard = screen.getByRole("group", { name: "Keyboard" });
    expect(within(keyboard).getByRole("button", { name: "N is in the word, wrong spot" })).toBeInTheDocument();
    for (const letter of "thorn") fireEvent.click(within(keyboard).getByRole("button", { name: new RegExp(`^${letter.toUpperCase()}\\b`) }));
    fireEvent.click(within(keyboard).getByRole("button", { name: "Enter" }));
    expect(screen.getByRole("heading", { level: 2, name: "THORN" })).toBeInTheDocument();
    expect(screen.getByText("verse 47012007")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read in context" })).toHaveAttribute("href", "/read/bsb/2CO/12?v=7");
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByText(/^Next puzzle in \d\d:\d\d:\d\d$/)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Keyboard" })).toBeNull();
    const record = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(record).toMatchObject({ played: 1, won: 1, streak: 1, today: { n: 2, guesses: ["north", "thorn"] } });
  });

  it("brings the same board back after a reload and counts the game only once", async () => {
    const first = await open(new Date(2026, 10, 8, 10));
    play("north");
    play("thorn");
    screen.getByRole("heading", { level: 2, name: "THORN" });
    const record = localStorage.getItem(STORAGE_KEY);
    first.unmount();
    await open(new Date(2026, 10, 8, 18));
    expect(screen.getByRole("heading", { level: 2, name: "THORN" })).toBeInTheDocument();
    expect(rowText(1)).toMatch(/^N is in the word, wrong spot/);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(record);
  });

  it("shows the answer after six misses, and offers a hint after three", async () => {
    await open(new Date(2026, 10, 8, 10));
    for (const word of ["bread", "water", "light"]) play(word);
    fireEvent.click(screen.getByRole("button", { name: "Show a hint" }));
    expect(screen.queryByRole("button", { name: "Show a hint" })).toBeNull();
    for (const word of ["stone", "grace", "peace"]) play(word);
    expect(screen.getByText("The word was")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "THORN" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({ played: 1, won: 0, streak: 0, today: { hint: true } });
  });

  it("holds a hard-mode guess to what earlier ones found, and locks the setting once a guess is played", async () => {
    await open(new Date(2026, 10, 8, 10));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const settings = screen.getByRole("dialog", { name: "Settings", hidden: true });
    fireEvent.click(within(settings).getByRole("switch", { name: /Hard mode/, hidden: true }));
    fireEvent.click(within(settings).getByRole("button", { name: "Close", hidden: true }));
    play("thick");
    play("bread");
    expect(screen.getByText("Letter 1 must be T")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(within(screen.getByRole("dialog", { name: "Settings", hidden: true })).getByRole("switch", { name: /Hard mode/, hidden: true })).toBeDisabled();
  });

  it("shows who a person is, with a link to their page", async () => {
    await open(new Date(2026, 11, 2, 10)); // #26 is ABNER
    for (const word of ["abner"]) play(word);
    expect(await screen.findByText("Commander of Saul's army")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "More about Abner" })).toHaveAttribute("href", "/people/abner-1sa-14-50");
  });

  it("keeps playing in memory when storage can be read but writes fail", async () => {
    await open(new Date(2026, 10, 8, 10));
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      play("north");
      play("thorn");
      expect(screen.getByRole("heading", { level: 2, name: "THORN" })).toBeInTheDocument();
      expect(rowText(1)).toMatch(/^N is in the word, wrong spot/);
      fireEvent.click(screen.getByRole("button", { name: "See all statistics" }));
      expect(screen.getByText("Your stats can't be saved in this browser.")).toBeInTheDocument();
    } finally {
      write.mockRestore();
      warning.mockRestore();
    }
  });

  it("says when the first puzzle is, before it", async () => {
    vi.setSystemTime(new Date(2026, 10, 6, 10));
    renderAt("/games/wordle");
    expect(await screen.findByText(/^Bible Wordle begins on/, {}, LOADED)).toBeInTheDocument();
  });

  it("keeps the day's puzzle after midnight, then offers the next one", async () => {
    await open(new Date(2026, 10, 8, 23, 59, 58));
    play("thorn");
    await act(async () => { vi.setSystemTime(new Date(2026, 10, 9, 0, 0, 5)); await new Promise((resolve) => setTimeout(resolve, 1100)); });
    expect(screen.getByRole("heading", { level: 2, name: "THORN" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Play #3" }));
    expect(screen.getByText(/^#3 · /)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "THORN" })).toBeNull();
  });
});
