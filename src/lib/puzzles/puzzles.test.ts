// The shared puzzle generators (README.md beside this file). The crossword rules are checked independently of the
// generator: every run of two or more letters is exactly one placed word, and the grid is connected.
import { describe, expect, it } from "vitest";
import { BLOCKED, blockedSquares, cellNumbers, generateCrossword, generateWordSearch, gridLetters, seedFromText, seededRandom,
  shuffled, wordCells, wordSearchCells, type Crossword } from ".";

const WORDS = ["MOSES", "AARON", "MIRIAM", "JERICHO", "JOSHUA", "EGYPT", "PHARAOH", "MANNA", "SINAI", "JORDAN", "CALEB", "TABERNACLE",
  "PASSOVER", "LAMB", "SEA", "LAW", "ARK", "ISRAEL", "GOSHEN", "BUSH", "STAFF", "PLAGUE", "QUAIL", "ROCK", "TABLETS"];

/** Every maximal run of 2+ letters across and down, as "row,col,direction". */
function runs(puzzle: Crossword): string[] {
  const out: string[] = [];
  const at = (r: number, c: number) => (r >= 0 && c >= 0 && r < puzzle.height && c < puzzle.width ? puzzle.cells[r * puzzle.width + c] : null);
  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      if (at(r, c) && !at(r, c - 1) && at(r, c + 1)) out.push(`${r},${c},across`);
      if (at(r, c) && !at(r - 1, c) && at(r + 1, c)) out.push(`${r},${c},down`);
    }
  }
  return out.sort();
}

function connected(puzzle: Crossword): boolean {
  const filled = puzzle.cells.flatMap((cell, i) => (cell ? [i] : []));
  const seen = new Set([filled[0]]);
  const queue = [filled[0]];
  while (queue.length) {
    const i = queue.pop()!;
    const r = Math.floor(i / puzzle.width), c = i % puzzle.width;
    for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      const n = nr * puzzle.width + nc;
      if (nr >= 0 && nc >= 0 && nr < puzzle.height && nc < puzzle.width && puzzle.cells[n] && !seen.has(n)) { seen.add(n); queue.push(n); }
    }
  }
  return seen.size === filled.length;
}

function expectValidCrossword(puzzle: Crossword, answers: readonly string[]): void {
  for (const word of puzzle.words) {
    expect(word.answer).toBe(answers[word.index]);
    expect(wordCells(puzzle, word).map((i) => puzzle.cells[i]).join("")).toBe(word.answer);
  }
  expect(runs(puzzle)).toEqual(puzzle.words.map((w) => `${w.row},${w.col},${w.direction}`).sort());
  expect(connected(puzzle)).toBe(true);
  expect(new Set(puzzle.words.map((w) => w.index)).size).toBe(puzzle.words.length);
  expect([...puzzle.words.map((w) => w.index), ...puzzle.unplaced].sort((a, b) => a - b)).toEqual(answers.map((_, i) => i));
  // Numbers run 1, 2, 3… in reading order of the starting squares.
  const starts = [...new Set(puzzle.words.map((w) => w.row * puzzle.width + w.col))].sort((a, b) => a - b);
  for (const word of puzzle.words) expect(word.number).toBe(starts.indexOf(word.row * puzzle.width + word.col) + 1);
  expect(cellNumbers(puzzle).filter(Boolean)).toEqual(starts.map((_, i) => i + 1));
}

describe("letters and randomness", () => {
  it("turns names into grid letters", () => {
    expect(gridLetters("Mary Magdalene")).toBe("MARYMAGDALENE");
    expect(gridLetters("Beth-shemesh")).toBe("BETHSHEMESH");
    expect(gridLetters("Zoë’s")).toBe("ZOES");
  });
  it("repeats itself from the same seed", () => {
    expect(shuffled(WORDS, seededRandom(5))).toEqual(shuffled(WORDS, seededRandom(5)));
    expect(shuffled(WORDS, seededRandom(5))).not.toEqual(shuffled(WORDS, seededRandom(6)));
    expect(seedFromText("crossword")).toBe(seedFromText("crossword"));
  });
});

describe("generateCrossword", () => {
  it("lays out a valid grid within its limits", () => {
    const puzzle = generateCrossword(WORDS, { maxWidth: 13, target: 12, random: seededRandom(1) })!;
    expect(puzzle).not.toBeNull();
    expect(puzzle.width).toBeLessThanOrEqual(13);
    expect(puzzle.height).toBeLessThanOrEqual(13);
    expect(puzzle.words.length).toBeGreaterThanOrEqual(9);
    expectValidCrossword(puzzle, WORDS);
  });

  it("gives the same puzzle for the same seed", () => {
    const options = (seed: number) => ({ maxWidth: 11, target: 10, random: seededRandom(seed), timeBudgetMs: 10_000 });
    expect(generateCrossword(WORDS, options(9))).toEqual(generateCrossword(WORDS, options(9)));
  });

  it("never lets a word swallow another in the same direction (ELI inside BELIEF)", () => {
    for (let seed = 0; seed < 60; seed++) {
      const answers = ["ELI", "BELIEF", "EVE", "LOT", "IVY", "BEL", "LIE"];
      const puzzle = generateCrossword(answers, { maxWidth: 9, target: 7, random: seededRandom(seed) });
      if (puzzle) expectValidCrossword(puzzle, answers);
    }
  });

  it("keeps every rule over many random grids and sizes, quickly", () => {
    const started = performance.now();
    for (let seed = 0; seed < 150; seed++) {
      const random = seededRandom(seed);
      const size = [9, 13, 17][seed % 3];
      const answers = shuffled(WORDS, random).filter((w) => w.length <= size);
      const puzzle = generateCrossword(answers, { maxWidth: size, target: [7, 12, 18][seed % 3], random });
      expect(puzzle).not.toBeNull();
      expect(puzzle!.width).toBeLessThanOrEqual(size);
      expect(puzzle!.height).toBeLessThanOrEqual(size);
      expectValidCrossword(puzzle!, answers);
    }
    expect((performance.now() - started) / 150).toBeLessThan(200);
  });

  it("allows a wide, short grid", () => {
    const puzzle = generateCrossword(WORDS, { maxWidth: 15, maxHeight: 7, target: 10, random: seededRandom(3) })!;
    expect(puzzle.width).toBeLessThanOrEqual(15);
    expect(puzzle.height).toBeLessThanOrEqual(7);
    expectValidCrossword(puzzle, WORDS);
  });

  it("returns null when too few words fit, and refuses answers that are not grid letters", () => {
    expect(generateCrossword(["ABC", "XYZ", "QQQ"], { maxWidth: 9, target: 3, random: seededRandom(1) })).toBeNull();
    expect(() => generateCrossword(["Moses"], { maxWidth: 9, target: 3, random: seededRandom(1) })).toThrow(/A–Z/);
  });

  it("stops starting new tries when the time budget is spent", () => {
    let clock = 0;
    const puzzle = generateCrossword(WORDS, { maxWidth: 13, target: 99, random: seededRandom(2), attempts: 50, timeBudgetMs: 5, now: () => (clock += 10) });
    expect(puzzle).not.toBeNull();
  });
});

describe("generateWordSearch", () => {
  const find = (grid: readonly string[], width: number, w: { word: string; row: number; col: number; dRow: number; dCol: number }) =>
    Array.from(w.word, (_, i) => grid[(w.row + w.dRow * i) * width + w.col + w.dCol * i]).join("");

  it("places every word along its direction and fills the rest with A–Z", () => {
    for (const directions of ["forward", "diagonal", "all"] as const) {
      const sheet = generateWordSearch(WORDS.slice(0, 14), { width: 14, directions, random: seededRandom(4) });
      expect(sheet.grid).toHaveLength(14 * 14);
      expect(sheet.grid.every((letter) => /^[A-Z]$/.test(letter))).toBe(true);
      expect(sheet.placed.length + sheet.skipped.length).toBe(14);
      for (const w of sheet.placed) {
        expect(find(sheet.grid, 14, w)).toBe(w.word);
        if (directions === "forward") expect([[0, 1], [1, 0]]).toContainEqual([w.dRow, w.dCol]);
        if (directions === "diagonal") expect(w.dCol === 1 || (w.dRow === 1 && w.dCol === 0)).toBe(true);
      }
    }
  });

  it("gives each placed word's squares for an answer key", () => {
    const sheet = generateWordSearch(WORDS.slice(0, 12), { width: 13, directions: "all", random: seededRandom(11) });
    for (const w of sheet.placed) {
      const squares = wordSearchCells(sheet, w);
      expect(squares).toHaveLength(w.word.length);
      expect(squares.map((i) => sheet.grid[i]).join("")).toBe(w.word);
    }
  });

  it("skips a word that cannot fit instead of cutting it", () => {
    const sheet = generateWordSearch(["TABERNACLE", "SEA"], { width: 5, directions: "forward", random: seededRandom(1) });
    expect(sheet.skipped).toEqual([0]);
    expect(sheet.placed.map((w) => w.word)).toEqual(["SEA"]);
  });

  it("is the same from the same seed, and its filler spells no blocked word", () => {
    const make = (seed: number) => generateWordSearch(WORDS.slice(0, 10), { width: 12, directions: "all", random: seededRandom(seed) });
    expect(make(8)).toEqual(make(8));
    for (let seed = 0; seed < 40; seed++) {
      const sheet = make(seed);
      const words = new Set(sheet.placed.flatMap((w) => Array.from(w.word, (_, i) => (w.row + w.dRow * i) * 12 + w.col + w.dCol * i)));
      expect([...blockedSquares(sheet.grid, 12, 12)].filter((i) => !words.has(i))).toEqual([]);
    }
    expect(BLOCKED.every((word) => /^[A-Z]+$/.test(word))).toBe(true);
  });
});
