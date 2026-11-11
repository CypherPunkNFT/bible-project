// The crossword generator shared by the crossword game (/games/crossword) and the printable puzzle maker on the Tools
// page (docs/features/bible-crossword/design.md §3 and §8). A freeform, American-style layout: words cross at shared
// letters and nowhere else. It knows nothing about clues: it takes grid letters and gives back where each one went,
// by its place in the list, so the caller keeps its own clue, enumeration or link beside each answer.
import { shuffled } from "./random";

export type Direction = "across" | "down";

export interface CrosswordWord {
  /** Where the answer was in the list handed in. */
  index: number;
  answer: string;
  row: number;
  col: number;
  direction: Direction;
  /** The clue number printed in its first square. */
  number: number;
}

export interface Crossword {
  width: number;
  height: number;
  /** Row by row, `width` per row: the letter in each square, or null for a square no word uses. */
  cells: (string | null)[];
  words: CrosswordWord[];
  /** The list positions of answers that did not fit. */
  unplaced: number[];
}

export interface CrosswordOptions {
  /** The widest and tallest the finished grid may be (the height defaults to the width). */
  maxWidth: number;
  maxHeight?: number;
  /** Stop adding words once this many are placed. */
  target: number;
  random: () => number;
  /** Fewer placed words than this gives null. Default 3. */
  minWords?: number;
  /** Separate tries with different word orders; the best is kept. Default 12. */
  attempts?: number;
  /** Stop starting new tries after this many milliseconds. Default 120. */
  timeBudgetMs?: number;
  now?: () => number;
}

/** How many candidates are weighed for each next word: enough for good crossings, few enough to stay quick. */
const LOOKAHEAD = 30;

interface Square { letter: string; across: number; down: number }
interface Placement { index: number; row: number; col: number; direction: Direction; crossings: number }

const keyOf = (row: number, col: number) => `${row},${col}`;
const step = (direction: Direction): [number, number] => (direction === "across" ? [0, 1] : [1, 0]);

/** One try: words placed on an unbounded board whose used rectangle may not outgrow the limits. */
class Board {
  readonly squares = new Map<string, Square>();
  readonly placed: Placement[] = [];
  private top = 0; private bottom = -1; private left = 0; private right = -1;

  constructor(private readonly answers: readonly string[], private readonly maxWidth: number, private readonly maxHeight: number) {}

  get crossings(): number { return this.placed.reduce((sum, p) => sum + p.crossings, 0); }

  private fits(row: number, col: number, length: number, direction: Direction): boolean {
    if (this.placed.length === 0) return direction === "across" ? length <= this.maxWidth : length <= this.maxHeight;
    const [dr, dc] = step(direction);
    const top = Math.min(this.top, row), left = Math.min(this.left, col);
    const bottom = Math.max(this.bottom, row + dr * (length - 1)), right = Math.max(this.right, col + dc * (length - 1));
    return bottom - top + 1 <= this.maxHeight && right - left + 1 <= this.maxWidth;
  }

  /** The number of crossings if the answer can go here, else -1 (the rules: design §8). */
  check(answer: string, row: number, col: number, direction: Direction): number {
    if (!this.fits(row, col, answer.length, direction)) return -1;
    const [dr, dc] = step(direction);
    if (this.squares.has(keyOf(row - dr, col - dc)) || this.squares.has(keyOf(row + dr * answer.length, col + dc * answer.length))) return -1;
    let crossings = 0;
    for (let i = 0; i < answer.length; i++) {
      const r = row + dr * i, c = col + dc * i;
      const square = this.squares.get(keyOf(r, c));
      if (square) {
        if (square.letter !== answer[i] || square[direction] !== -1) return -1;
        crossings++;
      } else if (this.squares.has(keyOf(r + dc, c + dr)) || this.squares.has(keyOf(r - dc, c - dr))) {
        return -1; // a new letter may not sit beside another word's letter
      }
    }
    return this.placed.length > 0 && crossings === 0 ? -1 : crossings;
  }

  /** Every legal spot for an answer that crosses the board, best first: most crossings, then nearest the middle. */
  best(index: number): Placement | null {
    const answer = this.answers[index];
    const middleRow = (this.top + this.bottom) / 2, middleCol = (this.left + this.right) / 2;
    let found: Placement | null = null, foundDistance = Infinity;
    for (const [key, square] of this.squares) {
      const [r, c] = key.split(",").map(Number);
      for (let i = 0; i < answer.length; i++) {
        if (answer[i] !== square.letter) continue;
        const direction: Direction = square.across === -1 ? "across" : "down";
        if (square.across !== -1 && square.down !== -1) continue;
        const [dr, dc] = step(direction);
        const row = r - dr * i, col = c - dc * i;
        const crossings = this.check(answer, row, col, direction);
        if (crossings < 0) continue;
        const distance = Math.abs(row + (dr * answer.length) / 2 - middleRow) + Math.abs(col + (dc * answer.length) / 2 - middleCol);
        if (!found || crossings > found.crossings || (crossings === found.crossings && distance < foundDistance)) {
          found = { index, row, col, direction, crossings };
          foundDistance = distance;
        }
      }
    }
    return found;
  }

  place(placement: Placement): void {
    const answer = this.answers[placement.index];
    const [dr, dc] = step(placement.direction);
    const id = this.placed.length;
    for (let i = 0; i < answer.length; i++) {
      const r = placement.row + dr * i, c = placement.col + dc * i;
      const key = keyOf(r, c);
      const square = this.squares.get(key) ?? { letter: answer[i], across: -1, down: -1 };
      square[placement.direction] = id;
      this.squares.set(key, square);
    }
    const end = [placement.row + dr * (answer.length - 1), placement.col + dc * (answer.length - 1)];
    if (this.placed.length === 0) {
      [this.top, this.left, this.bottom, this.right] = [placement.row, placement.col, end[0], end[1]];
    } else {
      this.top = Math.min(this.top, placement.row); this.left = Math.min(this.left, placement.col);
      this.bottom = Math.max(this.bottom, end[0]); this.right = Math.max(this.right, end[1]);
    }
    this.placed.push(placement);
  }

  /** The used rectangle, cropped and numbered in reading order. */
  finish(): Crossword {
    const width = this.right - this.left + 1, height = this.bottom - this.top + 1;
    const cells: (string | null)[] = Array.from({ length: width * height }, () => null);
    for (const [key, square] of this.squares) {
      const [r, c] = key.split(",").map(Number);
      cells[(r - this.top) * width + (c - this.left)] = square.letter;
    }
    const words = this.placed.map((p) => ({
      index: p.index, answer: this.answers[p.index], row: p.row - this.top, col: p.col - this.left, direction: p.direction, number: 0,
    }));
    const starts = [...new Set(words.map((w) => w.row * width + w.col))].sort((a, b) => a - b);
    for (const word of words) word.number = starts.indexOf(word.row * width + word.col) + 1;
    words.sort((a, b) => a.number - b.number || (a.direction === "across" ? -1 : 1));
    const used = new Set(words.map((w) => w.index));
    return { width, height, cells, words, unplaced: this.answers.map((_, i) => i).filter((i) => !used.has(i)) };
  }
}

function oneTry(answers: readonly string[], order: readonly number[], options: CrosswordOptions): Board {
  const board = new Board(answers, options.maxWidth, options.maxHeight ?? options.maxWidth);
  // Open with the longest of the first few, across the middle.
  const opener = order.slice(0, 6).reduce((a, b) => (answers[b].length > answers[a].length ? b : a), order[0]);
  if (board.check(answers[opener], 0, 0, "across") < 0) return board;
  board.place({ index: opener, row: 0, col: 0, direction: "across", crossings: 0 });
  let waiting = order.filter((i) => i !== opener);
  while (board.placed.length < options.target && waiting.length > 0) {
    let chosen: Placement | null = null;
    const tried: number[] = [];
    for (const index of waiting.slice(0, LOOKAHEAD)) {
      const placement = board.best(index);
      if (!placement) { tried.push(index); continue; }
      if (!chosen || placement.crossings > chosen.crossings) chosen = placement;
    }
    // Words that fit nowhere now are set aside for good; words that only lost to a better one wait their turn.
    waiting = waiting.filter((i) => !tried.includes(i) && i !== chosen?.index);
    if (chosen) board.place(chosen);
    else if (waiting.length === 0) break;
  }
  return board;
}

/** Lays out as many answers as fit, up to `target`; null when fewer than `minWords` fit. Answers are grid letters
 *  (letters.ts gridLetters); duplicates should be removed by the caller. The same answers, options and random
 *  sequence always give the same crossword. */
export function generateCrossword(answers: readonly string[], options: CrosswordOptions): Crossword | null {
  if (answers.some((a) => !/^[A-Z]{2,}$/.test(a))) throw new Error(`crossword: answers must be two or more letters A–Z, got ${JSON.stringify(answers.find((a) => !/^[A-Z]{2,}$/.test(a)))}`);
  const now = options.now ?? (() => Date.now());
  const started = now();
  const attempts = options.attempts ?? 12;
  const budget = options.timeBudgetMs ?? 120;
  const indexes = answers.map((_, i) => i);
  let best: Board | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0 && now() - started > budget) break;
    const board = oneTry(answers, shuffled(indexes, options.random), options);
    if (!best || board.placed.length > best.placed.length
      || (board.placed.length === best.placed.length && board.crossings > best.crossings)) best = board;
    if (best.placed.length >= options.target && attempt >= 2) break;
  }
  if (!best || best.placed.length < (options.minWords ?? 3)) return null;
  return best.finish();
}

/** The squares (row-major positions) a word fills, first letter first. */
export function wordCells(puzzle: Pick<Crossword, "width">, word: Pick<CrosswordWord, "row" | "col" | "direction" | "answer">): number[] {
  const [dr, dc] = step(word.direction);
  return Array.from(word.answer, (_, i) => (word.row + dr * i) * puzzle.width + word.col + dc * i);
}

/** The clue number printed in each square, or 0. */
export function cellNumbers(puzzle: Pick<Crossword, "width" | "height" | "words">): number[] {
  const numbers = Array.from({ length: puzzle.width * puzzle.height }, () => 0);
  for (const word of puzzle.words) numbers[word.row * puzzle.width + word.col] = word.number;
  return numbers;
}
