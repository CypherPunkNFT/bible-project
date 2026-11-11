// Memory card match on the page: keyboard play from deal to summary, live messages, hidden face-down text, reduced
// motion, the summary's verses and links, and the hub serving it at /games/memory-match (design section 14).
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import rawData from "@/data/memory-match/pairs.json";
import GamesPage from "../GamesPage";
import type { Card, PairsFile } from "./deal";
import { SOFT_HYPHEN } from "./game";
import MemoryMatchGame from "./MemoryMatchGame";

// The verse lookup needs the site's catalogue; here it answers from a table the test controls (src/lib/verses.ts).
const verseTable = vi.hoisted(() => ({ value: null as Record<number, string | null> | null }));
vi.mock("@/lib/verses", () => ({
  useVerseTable: () => (verseTable.value ? { bible: { slug: "bsb", name: "Berean Standard Bible" }, table: verseTable.value } : null),
}));

const data = rawData as unknown as PairsFile;
const byId = new Map(data.pairs.map((pair) => [pair.id, pair]));
const plain = (text: string) => text.split(SOFT_HYPHEN).join("").replace(/[“”]/g, "");
const textOf = (card: Card) => {
  const pair = byId.get(card.pair)!;
  return card.kind === "who" ? data.characters[pair.who].label : pair.story;
};

const renderGame = () => render(<MemoryRouter><MemoryMatchGame /></MemoryRouter>);
const savedCards = (): Card[] => JSON.parse(sessionStorage.getItem("bp-memory-match-game")!).cards;
const grid = () => screen.getByRole("group", { name: /^Cards, \d columns by \d rows$/ });
const cards = () => within(grid()).getAllByRole("button");
/** Past the 300ms in which taps on a turning card are ignored. */
const later = () => vi.setSystemTime(Date.now() + 1000);

async function deal(study = false) {
  renderGame();
  fireEvent.click(await screen.findByRole("button", { name: study ? "See the pairs first" : "Deal the cards" }));
}

/** Moves keyboard focus to card `to` with arrow keys only, then turns it with Enter. */
function keyTo(from: number, to: number, columns: number) {
  let at = from;
  const press = (key: string) => { fireEvent.keyDown(cards()[at], { key }); at = cards().indexOf(document.activeElement as HTMLButtonElement); };
  while (Math.floor(at / columns) < Math.floor(to / columns)) press("ArrowDown");
  while (Math.floor(at / columns) > Math.floor(to / columns)) press("ArrowUp");
  while (at < to) press("ArrowRight");
  while (at > to) press("ArrowLeft");
  expect(document.activeElement).toBe(cards()[to]);
  fireEvent.keyDown(cards()[to], { key: "Enter" });
  later();
  return to;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  verseTable.value = null;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 7, 10));
});
afterEach(() => { vi.useRealTimers(); });

describe("memory match page", () => {
  it("plays a first Easy board from deal to summary with only arrow keys and Enter", async () => {
    await deal();
    const dealt = savedCards();
    expect(dealt).toHaveLength(12);
    expect(dealt.some((c) => byId.get(c.pair)!.who === "daniel")).toBe(true); // the spec's pair opens a new device
    expect(grid()).toHaveAccessibleName("Cards, 4 columns by 3 rows");
    cards()[0].focus();
    let at = 0;
    for (const [n, card] of dealt.entries()) {
      if (card.kind !== "who") continue;
      at = keyTo(at, n, 4);
      at = keyTo(at, dealt.findIndex((c) => c.pair === card.pair && c.kind === "story"), 4);
    }
    const summary = await screen.findByRole("heading", { level: 2, name: /^All 6 pairs in 6 moves · \d+:\d\d$/ });
    expect(summary).toHaveFocus();
    expect(screen.getByText("3 stars")).toBeInTheDocument();
  });

  it("announces a pair and a non-pair", async () => {
    await deal();
    const dealt = savedCards();
    const who = dealt.findIndex((c) => c.kind === "who");
    const story = dealt.findIndex((c) => c.pair === dealt[who].pair && c.kind === "story");
    const wrong = dealt.findIndex((c) => c.kind === "story" && c.pair !== dealt[who].pair);
    const live = () => document.querySelector("[aria-live=polite]")!.textContent;
    fireEvent.click(cards()[who]);
    expect(live()).toBe(`${plain(textOf(dealt[who]))}.`);
    fireEvent.click(cards()[wrong]);
    expect(live()).toMatch(/\. Not a pair\.$/);
    expect(cards()[wrong]).toHaveAccessibleName(`${plain(textOf(dealt[wrong]))}, story card, face up`);
    later();
    fireEvent.click(cards()[story]); // a third tap turns the non-pair back and starts the next move
    expect(cards()[wrong]).toHaveAccessibleName(/face down/);
    later();
    fireEvent.click(cards()[who]);
    const pair = byId.get(dealt[who].pair)!;
    expect(live()).toContain(`A pair: ${plain(data.characters[pair.who].label)} and ${plain(pair.story)}. 1 of 6 pairs found.`);
    expect(cards()[who]).toHaveAccessibleName(`${plain(data.characters[pair.who].label)}, matched with ${plain(pair.story)}`);
    expect(screen.getByText("2 moves")).toBeInTheDocument();
  });

  it("keeps face-down words out of the page", async () => {
    await deal();
    const dealt = savedCards();
    const words = grid().textContent ?? "";
    for (const card of dealt) expect(words).not.toContain(plain(textOf(card)));
    expect(cards()[0]).toHaveAccessibleName(`Row 1, column 1, face down, ${dealt[0].kind} card`);
    fireEvent.click(cards()[0]);
    expect(grid().textContent).toContain(textOf(dealt[0]));
  });

  it("takes the reduced-motion path when the reader asks for less motion", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    try {
      await deal();
      expect(grid()).toHaveClass("is-reduced");
    } finally {
      window.matchMedia = original;
    }
  });

  it("lists every pair at the end with its verse, its passage and its person", async () => {
    await deal(true);
    expect(await screen.findByRole("heading", { name: "The pairs on this board" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
    const dealt = savedCards();
    const pairs = [...new Set(dealt.map((c) => c.pair))].map((id) => byId.get(id)!);
    verseTable.value = Object.fromEntries(pairs.map((pair, n) => [pair.keyVerseId, n === 0 ? null : `Verse text ${n}`]));
    for (const pair of pairs) {
      fireEvent.click(cards()[dealt.findIndex((c) => c.pair === pair.id && c.kind === "who")]);
      later();
      fireEvent.click(cards()[dealt.findIndex((c) => c.pair === pair.id && c.kind === "story")]);
      later();
    }
    await screen.findByRole("heading", { level: 2, name: /^All 6 pairs/ });
    const list = within(screen.getByRole("heading", { level: 3, name: "The stories" }).nextElementSibling as HTMLElement);
    for (const [n, pair] of pairs.entries()) {
      expect(list.getByRole("link", { name: `Read ${pair.ref}` })).toHaveAttribute("href", pair.readerHref);
      const href = data.characters[pair.who].href;
      if (href) expect(list.getByRole("link", { name: `About ${plain(data.characters[pair.who].label)}` })).toHaveAttribute("href", href);
      if (n > 0) expect(list.getByText(`“Verse text ${n}”`)).toBeInTheDocument();
    }
    expect(list.getAllByText(pairs[0].keyVerse).length).toBeGreaterThan(0); // no text: the reference alone
    fireEvent.click(screen.getByRole("button", { name: "Change game" }));
    expect(screen.getByRole("heading", { level: 1, name: "Memory card match" })).toBeInTheDocument();
  });

  it("returns to the same board after a reload", async () => {
    await deal();
    fireEvent.click(cards()[0]);
    const before = sessionStorage.getItem("bp-memory-match-game");
    cleanup();
    renderGame();
    await screen.findByRole("group", { name: /^Cards/ });
    expect(JSON.parse(sessionStorage.getItem("bp-memory-match-game")!).cards).toEqual(JSON.parse(before!).cards);
    expect(cards()[0]).toHaveAccessibleName(/face up$/);
  });

  // ---- The redesign (docs/visual-audits/memory-match-redesign.md) --------------------------------------------------

  it("marks a miss on both cards and turns them back on a tap on either card or on the board", async () => {
    await deal();
    const dealt = savedCards();
    const who = dealt.findIndex((c) => c.kind === "who");
    const wrong = dealt.findIndex((c) => c.kind === "story" && c.pair !== dealt[who].pair);
    fireEvent.click(cards()[who]);
    fireEvent.click(cards()[wrong]);
    expect(cards()[who]).toHaveClass("is-miss");
    expect(cards()[wrong]).toHaveClass("is-miss");
    expect(grid()).toHaveClass("is-holding");
    later();
    fireEvent.click(cards()[who]); // a tap on a card already up turns the non-pair back at once, costing nothing
    expect(cards()[who]).toHaveAccessibleName(/face down/);
    expect(cards()[wrong]).toHaveAccessibleName(/face down/);
    expect(screen.getByText("1 move")).toBeInTheDocument();
    fireEvent.click(cards()[who]);
    fireEvent.click(cards()[wrong]);
    later();
    fireEvent.click(grid()); // and so does a tap on the board between the cards
    expect(cards()[wrong]).toHaveAccessibleName(/face down/);
    expect(screen.getByText("2 moves")).toBeInTheDocument();
  });

  it("stamps a pair, then takes it off the board onto the shelf, leaving an empty slot", async () => {
    await deal();
    const dealt = savedCards();
    const who = dealt.findIndex((c) => c.kind === "who");
    const story = dealt.findIndex((c) => c.pair === dealt[who].pair && c.kind === "story");
    const shelf = () => screen.getByRole("button", { name: /pairs? found, read them$/ });
    expect(shelf()).toHaveAccessibleName("0 pairs found, read them");
    expect(document.querySelectorAll(".mm-shelf__slot")).toHaveLength(6); // one slot per pair from the deal
    expect(document.querySelectorAll(".mm-pips .kit-trail__mark")).toHaveLength(6);
    fireEvent.click(cards()[who]);
    fireEvent.click(cards()[story]);
    expect(cards()[who]).toHaveAttribute("data-face", "matched"); // still on the board, stamped
    expect(cards()[who].querySelector(".mm-card__stamp")).toBeInTheDocument();
    expect(document.querySelector(".mm-shelf__slot.is-arriving")).toBeInTheDocument();
    expect(document.querySelectorAll(".mm-pips .kit-trail__mark.is-right")).toHaveLength(1);
    await waitFor(() => expect(cards()[who]).toHaveAttribute("data-face", "taken"), { timeout: 4000 });
    expect(cards()[story]).toHaveAttribute("data-face", "taken");
    expect(cards()[who].querySelector(".mm-card__inner")).toBeNull(); // the slot is empty
    expect(cards()[who]).toHaveAccessibleName(/matched with/); // but still a place the arrow keys can rest on
    expect(document.querySelector(".mm-shelf__slot.is-filled")).toBeInTheDocument();
    expect(shelf()).toHaveAccessibleName("1 pair found, read them");
    fireEvent.click(shelf());
    const pair = byId.get(dealt[who].pair)!;
    expect(screen.getByText(pair.ref)).toBeInTheDocument();
    expect(cards()).toHaveLength(12); // the shelf's button is outside the grid
  });

  it("keeps three stars in hand until the move thresholds pass", async () => {
    await deal();
    const dealt = savedCards();
    const held = () => document.querySelectorAll(".mm-held svg.is-on").length;
    expect(held()).toBe(3);
    const who = dealt.findIndex((c) => c.kind === "who");
    const wrong = dealt.findIndex((c) => c.kind === "story" && c.pair !== dealt[who].pair);
    for (let n = 0; n < 12; n += 1) { // twelve misses: past 11 moves two stars remain
      fireEvent.click(cards()[who]);
      fireEvent.click(cards()[wrong]);
      later();
      fireEvent.click(grid());
    }
    expect(screen.getByText("12 moves")).toBeInTheDocument();
    expect(held()).toBe(2);
  });

  it("ends with the stars in a row, the buttons before the stories, and scrolls to the top on Play again", async () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    await deal();
    const dealt = savedCards();
    for (const [n, card] of dealt.entries()) {
      if (card.kind !== "who") continue;
      fireEvent.click(cards()[n]);
      later();
      fireEvent.click(cards()[dealt.findIndex((c) => c.pair === card.pair && c.kind === "story")]);
      later();
    }
    await screen.findByRole("heading", { level: 2, name: /^All 6 pairs/ });
    expect(document.querySelectorAll(".mm-stars__row svg")).toHaveLength(3);
    expect(getComputedStyle(document.querySelector(".mm-stars__row")!).display).not.toBe("block");
    const again = screen.getByRole("button", { name: "Play again" });
    const stories = screen.getByRole("heading", { level: 3, name: "The stories" });
    expect(again.compareDocumentPosition(stories) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    scrollTo.mockClear();
    fireEvent.click(again);
    await screen.findByRole("group", { name: /^Cards/ });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    expect(screen.getByText("0 moves")).toBeInTheDocument();
  });

  it("hands the turn over with a banner and each player's chip in pass and play", async () => {
    renderGame();
    fireEvent.click(await screen.findByRole("button", { name: "2" }));
    fireEvent.change(screen.getByPlaceholderText("Player 1"), { target: { value: "Theo" } });
    fireEvent.change(screen.getByPlaceholderText("Player 2"), { target: { value: "Mia" } });
    fireEvent.click(screen.getByRole("button", { name: "Deal the cards" }));
    const dealt = savedCards();
    const chips = within(screen.getByRole("list", { name: "Pairs per player" }));
    expect(chips.getByText("Theo").closest("li")).toHaveAttribute("aria-current", "true");
    const who = dealt.findIndex((c) => c.kind === "who");
    const wrong = dealt.findIndex((c) => c.kind === "story" && c.pair !== dealt[who].pair);
    fireEvent.click(cards()[who]);
    fireEvent.click(cards()[wrong]);
    expect(chips.getByText("Mia").closest("li")).toHaveAttribute("aria-current", "true");
    const banner = document.querySelector(".mm-handover")!;
    expect(banner).toHaveTextContent("You're up");
    expect(banner).toHaveTextContent("Mia");
    later();
    fireEvent.click(cards()[who]); // turns the non-pair back
    fireEvent.click(cards()[who]);
    fireEvent.click(cards()[dealt.findIndex((c) => c.pair === dealt[who].pair && c.kind === "story")]);
    expect(chips.getByText("Mia").closest("li")).toHaveAttribute("data-leading", "true");
  });

  it("is served by the games hub at its own address", async () => {
    vi.useRealTimers();
    render(<MemoryRouter initialEntries={["/games/memory-match"]}><Suspense fallback="Loading…">
      <Routes><Route path="/games/*" element={<GamesPage />} /></Routes>
    </Suspense></MemoryRouter>); // App's Suspense, as on the site
    expect(await screen.findByRole("heading", { level: 1, name: "Memory card match" }, { timeout: 5000 })).toBeInTheDocument();
  });
});

