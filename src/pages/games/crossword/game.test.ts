// Bible crossword's rules on the real clue file: every offered choice makes a valid puzzle, the same seed makes the
// same one, and check, reveal and the moves behave as the design says (design §4, §8).
import clues from "@/data/crossword/clues.json";
import { activeWord, applyLetters, candidates, clock, fitSpec, isConfirmed, isFilled, isSolved, offeredBooks, makeLayout, stepFrom, toPuzzle, verseHref, verseLabel, wordAt, wrongIn, type CluesFile,
  type Puzzle } from "./game";
import { LEVELS, SIZES, SIZE_GRID, THEMES, isOffered, poolOf } from "./themes";
import { seededRandom } from "@/lib/puzzles";

const data = clues as unknown as CluesFile;

/** Independent of the generator: each run of 2+ letters across or down is exactly one word of the puzzle. */
function expectSound(puzzle: Puzzle) {
  const at = (r: number, c: number) => (r >= 0 && c >= 0 && r < puzzle.height && c < puzzle.width ? puzzle.cells[r * puzzle.width + c] : null);
  const runs: string[] = [];
  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      if (at(r, c) && !at(r, c - 1) && at(r, c + 1)) runs.push(`${r},${c},across`);
      if (at(r, c) && !at(r - 1, c) && at(r + 1, c)) runs.push(`${r},${c},down`);
    }
  }
  expect(runs.sort()).toEqual(puzzle.words.map((w) => `${w.row},${w.col},${w.direction}`).sort());
  for (const word of puzzle.words) expect(word.cells.map((cell) => puzzle.cells[cell]).join("")).toBe(word.entry.a);
  expect(new Set(puzzle.words.map((w) => w.entry.a)).size).toBe(puzzle.words.length);
}

describe("making a puzzle", () => {
  it("makes a sound puzzle for every theme, level and size it offers", () => {
    let made = 0;
    for (const theme of THEMES) {
      for (const level of LEVELS) {
        for (const size of SIZES) {
          const spec = { source: { theme: theme.id }, level, size };
          if (!isOffered(data.entries, spec.source, level, size)) continue;
          const layout = makeLayout(data, spec, 11);
          expect(layout, `${theme.id} ${level} ${size}`).not.toBeNull();
          const puzzle = toPuzzle(data, layout!)!;
          expect(puzzle.width).toBeLessThanOrEqual(SIZE_GRID[size].max);
          expect(puzzle.height).toBeLessThanOrEqual(SIZE_GRID[size].max);
          expect(puzzle.words.length).toBeGreaterThanOrEqual(Math.ceil(SIZE_GRID[size].target * 0.75));
          const pool = new Set(poolOf(data.entries, spec.source, level, size));
          expect(puzzle.words.every((w) => pool.has(w.entry))).toBe(true);
          expectSound(puzzle);
          made++;
        }
      }
    }
    expect(made).toBeGreaterThan(80);
  });

  it("makes puzzles from single books", () => {
    const books = offeredBooks(data);
    expect(books.length).toBeGreaterThan(20);
    for (const book of books.slice(0, 12)) {
      const spec = fitSpec(data, { source: { book: book.num }, level: "hard", size: "small" });
      const puzzle = toPuzzle(data, makeLayout(data, spec, 3)!)!;
      expect(puzzle.words.every((w) => w.entry.b.includes(book.num))).toBe(true);
      expectSound(puzzle);
    }
  });

  it("is the same from the same seed, and differs with another", () => {
    const spec = { source: { theme: "jesus" }, level: "medium", size: "medium" } as const;
    expect(makeLayout(data, spec, 42)).toEqual(makeLayout(data, spec, 42));
    expect(makeLayout(data, spec, 42)).not.toEqual(makeLayout(data, spec, 43));
  });

  it("never offers a clue that gives away another candidate's answer", () => {
    const picked = candidates(data, { source: { theme: "whole" }, level: "hard", size: "large" }, seededRandom(5)).map((e) => data.entries[e]);
    for (const entry of picked) {
      const words = entry.c.normalize("NFD").toUpperCase().split(/[^A-Z]+/);
      for (const other of picked) if (other !== entry) expect(words.some((w) => w.startsWith(other.a)), `${entry.a} gives away ${other.a}`).toBe(false);
    }
  });

  it("refuses a saved layout that does not fit the clue file", () => {
    const layout = makeLayout(data, { source: { theme: "whole" }, level: "easy", size: "small" }, 1)!;
    expect(toPuzzle(data, { ...layout, words: layout.words.map((w, i) => (i === 0 ? { ...w, row: 50 } : w)) })).toBeNull();
    expect(toPuzzle(data, { ...layout, words: layout.words.map((w, i) => (i === 0 ? { ...w, e: data.entries.length + 9 } : w)) })).toBeNull();
    expect(toPuzzle(data, { ...layout, width: 0 })).toBeNull();
  });
});

describe("playing", () => {
  const puzzle = toPuzzle(data, makeLayout(data, { source: { theme: "whole" }, level: "easy", size: "small" }, 7)!)!;
  const first = puzzle.words[0];

  it("finds wrong letters, ignores empty squares, and knows when it is solved", () => {
    const letters = puzzle.cells.map(() => "");
    letters[first.cells[0]] = first.entry.a[0] === "Z" ? "Y" : "Z";
    letters[first.cells[1]] = first.entry.a[1];
    expect(wrongIn(puzzle, letters, first.cells)).toEqual([first.cells[0]]);
    expect(isSolved(puzzle, letters)).toBe(false);
    expect(isSolved(puzzle, puzzle.cells.map((a) => a ?? ""))).toBe(true);
  });

  it("chooses the word under a square and steps over gaps", () => {
    expect(activeWord(puzzle, first.cells[0], first.direction)).toBe(first);
    const across = puzzle.words.find((w) => w.direction === "across")!;
    expect(wordAt(puzzle, across.cells[1], "across")).toBe(across);
    expect(stepFrom(puzzle, across.cells[0], 0, 1)).toBe(across.cells[1]);
    expect(stepFrom(puzzle, across.cells[0], 0, -1 * puzzle.width * 2)).toBe(across.cells[0]); // off the grid: stays
  });

  it("links a clue's verse into the reader", () => {
    expect(verseLabel(data, 43006059)).toBe("John 6:59");
    expect(verseHref(data, 43006059)).toBe("/read/bsb/JHN/6?hl=59");
  });
});

describe("the play helpers added by the redesign", () => {
  const layout = makeLayout(data, { source: { theme: "whole" }, level: "easy", size: "small" }, 11)!;
  const puzzle = toPuzzle(data, layout)!;
  const word = puzzle.words[0];
  const base = { stamp: data.stamp, spec: { source: { theme: "whole" as const }, level: "easy" as const, size: "small" as const }, layout,
    letters: puzzle.cells.map(() => ""), revealed: [], wrong: [], checks: 0, right: [], seconds: 0 };

  it("drops a square from the wrong and confirmed lists when its letter changes, and keeps the rest", () => {
    const [a, b] = word.cells;
    const game = { ...base, letters: base.letters.map((l, i) => (i === a || i === b ? "X" : l)), wrong: [a], right: [b] };
    const letters = [...game.letters];
    letters[a] = "";
    const next = applyLetters(game, letters);
    expect(next.wrong).toEqual([]);
    expect(next.right).toEqual([b]);
    expect(next.letters[a]).toBe("");
    expect(applyLetters(game, game.letters)).toEqual({ ...game, letters: game.letters });
  });

  it("knows a filled word and a confirmed one", () => {
    const letters = base.letters.map((l, i) => (word.cells.includes(i) ? "A" : l));
    expect(isFilled(word, base.letters)).toBe(false);
    expect(isFilled(word, letters)).toBe(true);
    expect(isConfirmed(word, new Set(word.cells.slice(1)), new Set())).toBe(false);
    expect(isConfirmed(word, new Set(word.cells.slice(1)), new Set([word.cells[0]]))).toBe(true);
  });

  it("reads the clock in minutes and seconds", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(65)).toBe("1:05");
    expect(clock(754.9)).toBe("12:34");
    expect(clock(-3)).toBe("0:00");
  });
});
