// Bible crossword's saved game: it comes back as it was, and anything stale, corrupt or out of shape is dropped.
import clues from "@/data/crossword/clues.json";
import { emptyLetters, makeLayout, toPuzzle, type CluesFile, type Layout } from "./game";
import { DEFAULT_SPEC, SHELF_MAX, readSaved, shelve, writeSaved, type PlayState, type Saved, type Store } from "./storage";

const data = clues as unknown as CluesFile;
const puzzleOf = (layout: Layout) => toPuzzle(data, layout);
const memory = (): Store & { raw: Map<string, string> } => {
  const raw = new Map<string, string>();
  return { raw, getItem: (key) => raw.get(key) ?? null, setItem: (key, value) => { raw.set(key, value); } };
};
const spec = { source: { theme: "exodus" }, level: "medium", size: "small" } as const;
const layout = makeLayout(data, spec, 4)!;
const puzzle = toPuzzle(data, layout)!;
const letters = emptyLetters(puzzle);
letters[puzzle.words[0].cells[0]] = puzzle.words[0].entry.a[0];
const saved: Saved = {
  spec, game: { stamp: data.stamp, spec, layout, letters, revealed: [puzzle.words[0].cells[1]], wrong: [], checks: 2, right: [puzzle.words[0].cells[0]], seconds: 95 },
  shelf: [], solved: 3, best: { small: 80 },
};

describe("crossword storage", () => {
  it("brings back the game, choices and solved count", () => {
    const store = memory();
    writeSaved(store, saved);
    expect(readSaved(store, data, puzzleOf)).toEqual(saved);
  });

  it("loads a save from before the redesign: no confirmed squares, an unknown time, no best times", () => {
    const store = memory();
    const old: Record<string, unknown> = { ...saved.game! };
    delete old.right;
    delete old.seconds;
    store.raw.set("bp-crossword", JSON.stringify({ spec, game: old, solved: 3 }));
    expect(readSaved(store, data, puzzleOf)).toEqual({ spec, game: { ...old, right: [], seconds: null }, shelf: [], solved: 3, best: {} });
  });

  it("keeps only confirmed squares whose letter is still the answer's, and only sound best times", () => {
    const store = memory();
    const wrongLetter = puzzle.words[0].cells[0];
    const game = { ...saved.game!, letters: letters.map((l, i) => (i === wrongLetter ? (l === "Z" ? "Q" : "Z") : l)), seconds: -4 };
    store.raw.set("bp-crossword", JSON.stringify({ spec, game, solved: 3, best: { small: 0, medium: "9", large: 12.5, huge: 3 } }));
    const read = readSaved(store, data, puzzleOf);
    expect(read.game?.right).toEqual([]);
    expect(read.game?.seconds).toBeNull();
    expect(read.best).toEqual({});
    store.raw.set("bp-crossword", JSON.stringify({ spec, solved: 0, best: null }));
    expect(readSaved(store, data, puzzleOf).best).toEqual({});
  });

  it("drops a game from another build of the clues", () => {
    const store = memory();
    writeSaved(store, { ...saved, game: { ...saved.game!, stamp: "0000000000000000" } });
    expect(readSaved(store, data, puzzleOf)).toEqual({ ...saved, game: null });
  });

  it("drops letters that do not fit the grid, and bad marks", () => {
    for (const game of [
      { ...saved.game!, letters: letters.slice(1) },
      { ...saved.game!, letters: letters.map((l, i) => (i === 0 ? "ab" : l)) },
      { ...saved.game!, revealed: [999] },
      { ...saved.game!, checks: -1 },
    ]) {
      const store = memory();
      writeSaved(store, { ...saved, game });
      expect(readSaved(store, data, puzzleOf).game).toBeNull();
    }
  });

  it("ignores corrupt or missing storage", () => {
    const store = memory();
    store.raw.set("bp-crossword", "{not json");
    expect(readSaved(store, data, puzzleOf)).toEqual({ spec: DEFAULT_SPEC, game: null, shelf: [], solved: 0, best: {} });
    expect(readSaved(null, data, puzzleOf)).toEqual({ spec: DEFAULT_SPEC, game: null, shelf: [], solved: 0, best: {} });
    const full: Store = { getItem: () => null, setItem: () => { throw new Error("full"); } };
    expect(() => writeSaved(full, saved)).not.toThrow();
  });

  it("keeps unfinished puzzles on the shelf, newest first, and drops ones that no longer fit", () => {
    const other = makeLayout(data, spec, 99)!;
    const otherPuzzle = toPuzzle(data, other)!;
    const second: PlayState = { ...saved.game!, layout: other, letters: emptyLetters(otherPuzzle).map((l, i) => (i === otherPuzzle.words[0].cells[0] ? otherPuzzle.words[0].entry.a[0] : l)), revealed: [], right: [] };
    const store = memory();
    writeSaved(store, { ...saved, shelf: [second, saved.game!, { ...second, stamp: "0000000000000000" }] });
    expect(readSaved(store, data, puzzleOf).shelf).toEqual([second, saved.game]);
  });

  it("puts a puzzle aside only when it has letters and is not finished, once, and keeps at most six", () => {
    const game = saved.game!;
    expect(shelve([], game, false)).toEqual([game]);
    expect(shelve([], game, true)).toEqual([]);
    expect(shelve([], { ...game, letters: game.letters.map(() => "") }, false)).toEqual([]);
    expect(shelve([], null, false)).toEqual([]);
    expect(shelve([game], { ...game, letters: [...game.letters] }, false)).toHaveLength(1);
    const many = Array.from({ length: 9 }, (_, i) => ({ ...game, layout: { ...game.layout, width: game.layout.width + i + 1 } }));
    const shelf = many.reduce<PlayState[]>((kept, next) => shelve(kept, next, false), []);
    expect(shelf).toHaveLength(SHELF_MAX);
    expect(shelf[0]).toBe(many[8]);
  });
});
