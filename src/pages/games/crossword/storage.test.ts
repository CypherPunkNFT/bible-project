// Bible crossword's saved game: it comes back as it was, and anything stale, corrupt or out of shape is dropped.
import clues from "@/data/crossword/clues.json";
import { emptyLetters, makeLayout, toPuzzle, type CluesFile, type Layout } from "./game";
import { DEFAULT_SPEC, readSaved, writeSaved, type Saved, type Store } from "./storage";

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
const saved: Saved = { spec, game: { stamp: data.stamp, spec, layout, letters, revealed: [puzzle.words[0].cells[1]], wrong: [], checks: 2 }, solved: 3 };

describe("crossword storage", () => {
  it("brings back the game, choices and solved count", () => {
    const store = memory();
    writeSaved(store, saved);
    expect(readSaved(store, data, puzzleOf)).toEqual(saved);
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
    expect(readSaved(store, data, puzzleOf)).toEqual({ spec: DEFAULT_SPEC, game: null, solved: 0 });
    expect(readSaved(null, data, puzzleOf)).toEqual({ spec: DEFAULT_SPEC, game: null, solved: 0 });
    const full: Store = { getItem: () => null, setItem: () => { throw new Error("full"); } };
    expect(() => writeSaved(full, saved)).not.toThrow();
  });
});
