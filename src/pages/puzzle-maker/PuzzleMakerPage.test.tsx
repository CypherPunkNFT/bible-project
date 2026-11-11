// The puzzle maker's page (design §9): arriving, the form and the address, theme puzzles, answers, printing and the
// tools hub entry. The passages are read from the real Berean files, the themes from the real clue file.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { TOOLS, isLive } from "@/pages/tools/registry";
import { PUZZLE_MAKER_PATH } from "./PuzzleMakerPage";
import { readSettings } from "./settings";
import { addressParams, renderAt, serveBerean } from "./test-kit";

const SLOW = 20000;
const sheet = () => document.querySelector(".pm-preview .pm-sheet") as HTMLElement;
const findSheet = async (kind: "search" | "cross") => {
  await waitFor(() => expect(document.querySelector(`.pm-preview .pm-${kind}`)).not.toBeNull(), { timeout: 15000 });
  await waitFor(() => expect(document.querySelector(".pm-stale")).toBeNull());
  return sheet();
};

afterEach(() => vi.unstubAllGlobals());

describe("Puzzle maker", () => {
  it("arrives with a Psalm 23 word search and writes its seed into the address", async () => {
    serveBerean();
    renderAt(PUZZLE_MAKER_PATH);
    const made = await findSheet("search");
    expect(within(made).getByRole("heading", { name: "Psalm 23" })).toBeInTheDocument();
    expect(within(made).getAllByRole("cell")).toHaveLength(13 * 13);
    expect(within(made).getByRole("list").textContent).toContain("shepherd");
    const params = addressParams();
    expect(params.get("kind")).toBe("search");
    expect(params.get("ref")).toBe("Psalm 23");
    expect(params.get("seed")).toMatch(/^\d+$/);
  }, SLOW);

  it("makes the same sheet again from the same address, and a new one with New puzzle", async () => {
    serveBerean();
    const first = renderAt(`${PUZZLE_MAKER_PATH}?kind=search&from=passage&ref=John+3&size=small&level=hard&seed=42`);
    const grid = (await findSheet("search")).querySelector(".pm-grid")!.textContent;
    first.unmount();
    renderAt(`${PUZZLE_MAKER_PATH}?kind=search&from=passage&ref=John+3&size=small&level=hard&seed=42`);
    expect((await findSheet("search")).querySelector(".pm-grid")!.textContent).toBe(grid);
    fireEvent.click(screen.getByRole("button", { name: "New puzzle" }));
    await waitFor(() => expect(addressParams().get("seed")).not.toBe("42"));
    await waitFor(() => expect(sheet().querySelector(".pm-grid")!.textContent).not.toBe(grid));
  }, SLOW);

  it("makes a crossword from a typed passage, with verse clues and, on Easy, a word bank", async () => {
    serveBerean();
    renderAt(`${PUZZLE_MAKER_PATH}?kind=cross&from=passage&ref=Psalm+23&size=small&level=easy&seed=3`);
    await findSheet("cross");
    fireEvent.change(screen.getByRole("textbox", { name: "Passage" }), { target: { value: "John 3" } });
    fireEvent.click(screen.getByRole("button", { name: "Make puzzle" }));
    await waitFor(() => expect(addressParams().get("ref")).toBe("John 3"));
    const made = await findSheet("cross");
    expect(within(made).getByRole("heading", { name: "John 3" })).toBeInTheDocument();
    const clues = made.querySelectorAll(".pm-clue");
    expect(clues.length).toBeGreaterThanOrEqual(5);
    for (const clue of clues) expect(clue.textContent).toMatch(/____.*\(John 3:\d+\)/);
    expect(within(made).getByRole("region", { name: "Word bank" })).toBeInTheDocument();
  }, SLOW);

  it("says what is wrong with a reference, a missing verse or a passage too long", async () => {
    serveBerean();
    renderAt(`${PUZZLE_MAKER_PATH}?ref=Hezekiah+3&seed=1`);
    expect(await screen.findByText(/No book of the Bible is called/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "John 3" }));
    await findSheet("search");
    fireEvent.change(screen.getByRole("textbox", { name: "Passage" }), { target: { value: "John 3:99" } });
    fireEvent.click(screen.getByRole("button", { name: "Make puzzle" }));
    expect(await screen.findByText(/There are no such verses/, {}, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your puzzle" })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Passage" }), { target: { value: "Psalm 1-30" } });
    fireEvent.click(screen.getByRole("button", { name: "Make puzzle" }));
    expect(await screen.findByText(/Choose a shorter passage/, {}, { timeout: 15000 })).toBeInTheDocument();
  }, SLOW);

  it("makes a theme crossword from the crossword game's clues and shows its answers", async () => {
    serveBerean();
    renderAt(`${PUZZLE_MAKER_PATH}?kind=cross&from=theme&theme=exodus&size=small&level=medium&seed=9`);
    const made = await findSheet("cross");
    expect(within(made).getByRole("heading", { name: "Moses & the Exodus" })).toBeInTheDocument();
    expect(made.querySelector(".pm-answer")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Show answers" }));
    expect(sheet().querySelectorAll(".pm-answer").length).toBe(made.querySelectorAll(".pm-clue").length);
    expect(sheet().querySelectorAll(".pm-letter").length).toBeGreaterThan(10);
    fireEvent.change(screen.getByRole("combobox", { name: "Theme" }), { target: { value: "jesus" } });
    await waitFor(() => expect(addressParams().get("theme")).toBe("jesus"));
    expect(within(await findSheet("cross")).getByRole("heading", { name: "Jesus & the Gospels" })).toBeInTheDocument();
  }, SLOW);

  it("keeps a title the visitor gives without making a new puzzle, and only valid choices from a link", async () => {
    serveBerean();
    renderAt(`${PUZZLE_MAKER_PATH}?kind=bogus&size=huge&level=%3Cb%3E&seed=abc&ref=Psalm+23`);
    const grid = (await findSheet("search")).querySelector(".pm-grid")!.textContent;
    expect(readSettings(addressParams())).toMatchObject({ kind: "search", size: "medium", level: "easy" });
    const field = screen.getByRole("textbox", { name: "Title on the sheet (optional)" });
    fireEvent.change(field, { target: { value: "Sunday class\u202e: week 3" } });
    fireEvent.blur(field);
    await waitFor(() => expect(addressParams().get("title")).toBe("Sunday class: week 3"));
    expect(within(sheet()).getByRole("heading", { name: "Sunday class: week 3" })).toBeInTheDocument();
    expect(sheet().querySelector(".pm-grid")!.textContent).toBe(grid);
  }, SLOW);

  it("prints the sheet and, after a page break, its answer key", async () => {
    serveBerean();
    let printed: string[] = [];
    vi.stubGlobal("print", vi.fn(() => { printed = [...document.querySelectorAll(".print-sheet-portal .pm-sheet")].map((s) => s.className); }));
    renderAt(`${PUZZLE_MAKER_PATH}?kind=search&ref=Ruth+1&seed=5`);
    await findSheet("search");
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(window.print).toHaveBeenCalledTimes(1);
    expect(printed).toHaveLength(2);
    expect(printed[1]).toContain("pm-answers");
    expect(printed[1]).toContain("pm-key-page");
    fireEvent.click(screen.getByRole("checkbox", { name: "Add the answer key on a second page" }));
    expect(document.querySelectorAll(".print-sheet-portal .pm-sheet")).toHaveLength(1);
  }, SLOW);

  it("is live on the tools hub at its own address", () => {
    const entry = TOOLS.find((tool) => tool.slug === "puzzle-maker");
    expect(entry && isLive(entry) && entry.path).toBe(PUZZLE_MAKER_PATH);
  });
});
