// The page itself (design §13): a Pick round and a Type round played to the summary, I don't know, adding a passage to
// My verses, a reload mid-round that resumes at the same card, and the first-visit help. The BSB is read from disk.
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import poolFile from "@/data/verse-completion/pool.json";
import { CatalogContext } from "@/lib/catalog";
import { formatRange } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import type { Passage, Pool } from "./model";
import { bareWord } from "./choices";
import { endingOf } from "./pool-rules";
import { words } from "./words";
import { STORAGE_KEY } from "./storage";
import VerseCompletionGame from "./VerseCompletionGame";

const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../../data/catalog.json"), "utf8")) as Catalog;
const readBook = (slug: string, code: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../../data/plain/${slug}/${code}.json`), "utf8"));
vi.mock("@/lib/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/data")>(),
  loadPlain: async (slug: string, code: string) => readBook(slug, code),
}));

const pool = poolFile as unknown as Pool;
const byReference = new Map(pool.passages.map((passage) => [formatRange(catalog, passage.from, passage.to), passage]));

/** The BSB words of a passage, as the page joins them. */
function textOf(passage: Passage): string {
  const code = catalog.books.find((book) => book.num === Math.floor(passage.from / 1e6))!.code;
  const plain = readBook("bsb", code) as Record<string, string>;
  const chapter = Math.floor(passage.from / 1000) % 1000;
  const verses: string[] = [];
  for (let id = passage.from; id <= passage.to; id++) verses.push(plain[`${chapter}:${id % 1000}`].replace(/^¶\s*/, "").replace(/\s+/g, " ").trim());
  return verses.join(" ");
}

const renderPage = () => render(
  <CatalogContext.Provider value={catalog}><MemoryRouter initialEntries={["/games/verse-completion"]}>
    <Routes><Route path="/games/verse-completion" element={<VerseCompletionGame />} /></Routes>
  </MemoryRouter></CatalogContext.Provider>,
);

/** The passage on the current card, from its reference heading. */
async function currentPassage(): Promise<Passage> {
  const heading = await screen.findByRole("heading", { level: 2 });
  const passage = byReference.get(heading.textContent!);
  if (!passage) throw new Error(`test: no passage for "${heading.textContent}"`);
  return passage;
}

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
const choose = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));

async function openGame() {
  const view = renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Got it" }, { timeout: 5000 }));
  return view;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockImplementation(() => true);
});
afterEach(() => { vi.restoreAllMocks(); });

describe("verse completion page", () => {
  it("plays a Pick round at Easy to the summary, with I don't know and Add to My verses on the way", async () => {
    await openGame();
    choose("Play");
    for (let card = 1; card <= 10; card++) {
      const passage = await currentPassage();
      expect(screen.getByText(new RegExp(`^Round · ${card} of 10$`))).toBeInTheDocument();
      if (card === 2) {
        await screen.findByRole("group", { name: "Choose the ending" }, { timeout: 5000 });
        choose("I don't know");
        expect(await screen.findByLabelText("No stars")).toBeInTheDocument();
        choose("Add to My verses");
        expect(screen.getByRole("button", { name: "In My verses" })).toHaveAttribute("aria-pressed", "true");
        expect(saved().passages[passage.id]).toMatchObject({ box: 1 });
      } else {
        const group = await screen.findByRole("group", { name: "Choose the ending" }, { timeout: 5000 });
        const right = endingOf(textOf(passage), passage.split.easy).text;
        fireEvent.click(within(group).getByRole("button", { name: new RegExp(`^${right.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }));
        expect(await screen.findByLabelText("Three stars")).toBeInTheDocument();
      }
      choose("Next");
    }
    expect(await screen.findByRole("heading", { name: "Round finished" })).toBeInTheDocument();
    expect(screen.getByText("Stars: 27 out of 30")).toBeInTheDocument();
    expect(saved().totals).toEqual({ rounds: 1, cards: 10, stars: 27 });
    expect(saved().days.streak).toBe(1);
  }, 60_000);

  it("plays a Type round with whole words, and a reload mid-round resumes at the same card", async () => {
    const view = await openGame();
    choose("Type");
    choose(/^Medium/);
    choose("Play");
    for (let card = 1; card <= 10; card++) {
      const passage = await currentPassage();
      if (card === 4) {
        const before = saved().round;
        expect(before.done).toHaveLength(3);
        view.unmount();
        renderPage();
        expect((await currentPassage()).id).toBe(passage.id);
        expect(screen.getByText(/^Round · 4 of 10$/)).toBeInTheDocument();
      }
      const box = await screen.findByLabelText("Type the rest of the verse", {}, { timeout: 5000 });
      const words = textOf(passage);
      const hidden = endingOf(words, passage.split.medium).text;
      fireEvent.change(box, { target: { value: hidden.toUpperCase().replace(/[,;:.!?]/g, "") } });
      choose("Check");
      expect(await screen.findByLabelText("Three stars")).toBeInTheDocument();
      expect(screen.getAllByText(/words right/).length).toBeGreaterThan(0);
      choose("Next");
    }
    expect(await screen.findByText("Stars: 30 out of 30")).toBeInTheDocument();
    expect(saved().settings).toMatchObject({ answer: "type", style: "words", level: "medium" });
  }, 60_000);

  it("plays First letters and Hard word-by-word picking for a card", async () => {
    await openGame();
    choose("Type");
    choose("First letters");
    choose(/^Hard/);
    choose("Play");
    let passage = await currentPassage();
    const input = await screen.findByLabelText("Type the first letter of the next word", {}, { timeout: 5000 });
    const keys = endingOf(textOf(passage), passage.split.hard).keys;
    fireEvent.input(input, { target: { value: keys.map((key) => key[0]).join("") } });
    expect(await screen.findByLabelText("Three stars")).toBeInTheDocument();
    choose("Leave round");
    await waitFor(() => expect(saved().round).toBeNull());

    choose("Pick");
    choose("Play");
    passage = await currentPassage();
    const hidden = endingOf(textOf(passage), passage.split.hard);
    const shown = words(textOf(passage)).slice(passage.split.hard);
    for (let i = 0; i < hidden.keys.length; i++) {
      const group = await screen.findByRole("group", { name: new RegExp(`^Word ${i + 1} of ${hidden.keys.length}`) }, { timeout: 5000 });
      const right = bareWord(shown[i]);
      const button = within(group).getAllByRole("button").find((item) => item.textContent === `${within(group).getAllByRole("button").indexOf(item) + 1}${right}`)!;
      fireEvent.click(button);
    }
    expect(await screen.findByLabelText("Three stars")).toBeInTheDocument();
  }, 60_000);
});
