// Bible crossword: making a puzzle from the clues and playing it (docs/features/bible-crossword/design.md §3–§4, §8).
// Everything here is pure, so the tests can run it without a page. The grid comes from the shared generator in
// src/lib/puzzles, the one the Tools page's printable puzzle maker uses too.
import { generateCrossword, seededRandom, shuffled, wordCells, type Direction } from "@/lib/puzzles";
import { LEVELS, MIN_SHARE, SIZES, SIZE_GRID, isOffered, poolOf, type ClueEntry, type Level, type Size, type Source } from "./themes";
import type { PlayState } from "./storage";

export interface CluesFile { stamp: string; books: [string, string][]; entries: ClueEntry[] }

export interface Spec { source: Source; level: Level; size: Size }

/** What a finished layout is saved as: each word's clue (its place in `entries`), start square and direction. */
export interface Layout { width: number; height: number; words: { e: number; row: number; col: number; d: Direction }[] }

export interface PuzzleWord { entry: ClueEntry; e: number; row: number; col: number; direction: Direction; number: number; cells: number[] }

export interface Puzzle { width: number; height: number; cells: (string | null)[]; numbers: number[]; words: PuzzleWord[] }

/** How many seeds are tried before saying no puzzle can be made at that size. */
const SEEDS = 6;
/** Candidates handed to the generator, per word aimed for. */
const CANDIDATES_PER_WORD = 8;

const startsWithAny = (clue: string, answers: Iterable<string>) => {
  const words = clue.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  for (const answer of answers) if (words.some((word) => word.startsWith(answer))) return true;
  return false;
};

/** The candidates for one seed: shuffled (harder clues first on Hard), one clue per answer, and no clue that gives
 *  away another candidate's answer (design §8). */
export function candidates(data: CluesFile, spec: Spec, random: () => number): number[] {
  const index = new Map(data.entries.map((entry, i) => [entry, i]));
  let pool = shuffled(poolOf(data.entries, spec.source, spec.level, spec.size), random);
  if (spec.level === "hard") pool = [...pool.filter((e) => e.t > 1), ...pool.filter((e) => e.t === 1)];
  const chosen: ClueEntry[] = [];
  const answers = new Set<string>();
  const limit = SIZE_GRID[spec.size].target * CANDIDATES_PER_WORD;
  for (const entry of pool) {
    if (chosen.length >= limit) break;
    if (answers.has(entry.a) || startsWithAny(entry.c, answers) || chosen.some((other) => startsWithAny(other.c, [entry.a]))) continue;
    chosen.push(entry);
    answers.add(entry.a);
  }
  return chosen.map((entry) => index.get(entry)!);
}

/** A new layout for the choices, or null when none with enough words can be made. */
export function makeLayout(data: CluesFile, spec: Spec, seed: number): Layout | null {
  const { max, target } = SIZE_GRID[spec.size];
  for (let attempt = 0; attempt < SEEDS; attempt++) {
    const random = seededRandom(seed + attempt * 7919);
    const picked = candidates(data, spec, random);
    const crossword = generateCrossword(picked.map((e) => data.entries[e].a), { maxWidth: max, target, random, minWords: Math.ceil(target * MIN_SHARE) });
    if (crossword) {
      return {
        width: crossword.width, height: crossword.height,
        words: crossword.words.map((w) => ({ e: picked[w.index], row: w.row, col: w.col, d: w.direction })),
      };
    }
  }
  return null;
}

/** The playable puzzle for a saved layout, or null when the layout does not fit this clue file (a saved game from
 *  another build): every word inside the grid, crossing words agreeing, numbers in reading order. */
export function toPuzzle(data: CluesFile, layout: Layout): Puzzle | null {
  const { width, height } = layout;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 || width > 30 || height > 30) return null;
  const cells: (string | null)[] = Array.from({ length: width * height }, () => null);
  const words: PuzzleWord[] = [];
  for (const w of layout.words) {
    const entry = data.entries[w.e];
    if (!entry || (w.d !== "across" && w.d !== "down")) return null;
    const endRow = w.row + (w.d === "down" ? entry.a.length - 1 : 0), endCol = w.col + (w.d === "across" ? entry.a.length - 1 : 0);
    if (w.row < 0 || w.col < 0 || endRow >= height || endCol >= width) return null;
    const squares = wordCells({ width }, { row: w.row, col: w.col, direction: w.d, answer: entry.a });
    for (const [i, square] of squares.entries()) {
      if (cells[square] !== null && cells[square] !== entry.a[i]) return null;
      cells[square] = entry.a[i];
    }
    words.push({ entry, e: w.e, row: w.row, col: w.col, direction: w.d, number: 0, cells: squares });
  }
  if (words.length === 0) return null;
  const starts = [...new Set(words.map((w) => w.cells[0]))].sort((a, b) => a - b);
  const numbers = cells.map(() => 0);
  for (const word of words) {
    word.number = starts.indexOf(word.cells[0]) + 1;
    numbers[word.cells[0]] = word.number;
  }
  words.sort((a, b) => a.number - b.number || (a.direction === "across" ? -1 : 1));
  return { width, height, cells, numbers, words };
}

/** The word through a square in a direction, if any. */
export const wordAt = (puzzle: Puzzle, cell: number, direction: Direction): PuzzleWord | null =>
  puzzle.words.find((w) => w.direction === direction && w.cells.includes(cell)) ?? null;

/** The word to highlight for a square: the one in the wanted direction, else the other. */
export function activeWord(puzzle: Puzzle, cell: number, direction: Direction): PuzzleWord | null {
  return wordAt(puzzle, cell, direction) ?? wordAt(puzzle, cell, direction === "across" ? "down" : "across");
}

/** The nearest letter square from `cell` going one step at a time by (dRow, dCol), or `cell` at the edge. */
export function stepFrom(puzzle: Puzzle, cell: number, dRow: number, dCol: number): number {
  let row = Math.floor(cell / puzzle.width) + dRow, col = (cell % puzzle.width) + dCol;
  while (row >= 0 && col >= 0 && row < puzzle.height && col < puzzle.width) {
    if (puzzle.cells[row * puzzle.width + col] !== null) return row * puzzle.width + col;
    row += dRow; col += dCol;
  }
  return cell;
}

/** Squares whose typed letter is not the answer's (empty squares are not wrong). */
export const wrongIn = (puzzle: Puzzle, letters: readonly string[], squares: readonly number[]): number[] =>
  squares.filter((i) => letters[i] !== "" && letters[i] !== puzzle.cells[i]);

export const isSolved = (puzzle: Puzzle, letters: readonly string[]): boolean =>
  puzzle.cells.every((answer, i) => answer === null || letters[i] === answer);

/** Every letter square, in reading order. */
export const letterSquares = (puzzle: Puzzle): number[] => puzzle.cells.flatMap((answer, i) => (answer === null ? [] : [i]));

export const emptyLetters = (puzzle: Puzzle): string[] => puzzle.cells.map(() => "");

const splitRef = (ref: number) => ({ book: Math.floor(ref / 1_000_000), chapter: Math.floor(ref / 1000) % 1000, verse: ref % 1000 });

/** "John 6:59" for a verse id. */
export function verseLabel(data: CluesFile, ref: number): string {
  const { book, chapter, verse } = splitRef(ref);
  return `${data.books[book - 1]?.[1] ?? ""} ${chapter}:${verse}`;
}

/** The verse in the site's reader. */
export function verseHref(data: CluesFile, ref: number): string {
  const { book, chapter, verse } = splitRef(ref);
  return `/read/bsb/${data.books[book - 1]?.[0] ?? "GEN"}/${chapter}?hl=${verse}`;
}

export const personHref = (id: string): string => `/people/${encodeURIComponent(id)}`;

export const sameSource = (a: Source, b: Source) => ("book" in a && "book" in b ? a.book === b.book : "theme" in a && "theme" in b && a.theme === b.theme);

/** The choice itself when it is offered, else the nearest that is: same source and level at another size (smaller
 *  first), then another level. */
export function fitSpec(data: CluesFile, spec: Spec): Spec {
  if (isOffered(data.entries, spec.source, spec.level, spec.size)) return spec;
  const sizes = [...SIZES].sort((a, b) => Math.abs(SIZES.indexOf(a) - SIZES.indexOf(spec.size)) - Math.abs(SIZES.indexOf(b) - SIZES.indexOf(spec.size)) || SIZES.indexOf(a) - SIZES.indexOf(b));
  const levels = [spec.level, ...LEVELS.filter((l) => l !== spec.level)];
  for (const level of levels) {
    for (const size of sizes) if (isOffered(data.entries, spec.source, level, size)) return { ...spec, level, size };
  }
  return spec;
}

/** Books with clues enough for at least the smallest, hardest puzzle. */
export const offeredBooks = (data: CluesFile) =>
  data.books.map(([, name], i) => ({ num: i + 1, name })).filter((book) => isOffered(data.entries, { book: book.num }, "hard", "small"));

/** A seed for a new puzzle. */
export const freshSeed = (): number => Math.floor(Math.random() * 2 ** 31);

// ---- Play helpers added by the redesign (docs/visual-audits/crossword-redesign.md) ---------------------------------

/** The letters after a change, with every square that changed dropped from the wrong and the confirmed lists, so a
 *  tick never outlives the letter that earned it. */
export function applyLetters(game: PlayState, letters: readonly string[]): PlayState {
  const changed = new Set(letters.flatMap((letter, cell) => (letter !== game.letters[cell] ? [cell] : [])));
  return { ...game, letters: [...letters], wrong: game.wrong.filter((cell) => !changed.has(cell)), right: game.right.filter((cell) => !changed.has(cell)) };
}

/** A word with a letter in every square. */
export const isFilled = (word: PuzzleWord, letters: readonly string[]): boolean => word.cells.every((cell) => letters[cell] !== "");

/** A word every square of which a check confirmed or a reveal showed: the one that earns a tick. */
export const isConfirmed = (word: PuzzleWord, right: ReadonlySet<number>, revealed: ReadonlySet<number>): boolean =>
  word.cells.every((cell) => right.has(cell) || revealed.has(cell));

/** Minutes and seconds as a clock reads them: 4:07, 12:30. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
