// The word-search generator for the printable puzzle maker on the Tools page (docs/features/bible-crossword/design.md
// §3). It lives beside the crossword generator so both puzzles come from one module. Words may cross where their
// letters agree; the empty squares are filled with random letters, refilled if they spell a word on BLOCKED.
import { shuffled } from "./random";

/** forward: left to right and top to bottom; diagonal: those and the two downward diagonals; all: every direction. */
export type WordSearchDirections = "forward" | "diagonal" | "all";

export interface WordSearchWord { index: number; word: string; row: number; col: number; dRow: number; dCol: number }

export interface WordSearch {
  width: number;
  height: number;
  /** Row by row, `width` per row, one letter A–Z each. */
  grid: string[];
  placed: WordSearchWord[];
  /** The list positions of words that did not fit. */
  skipped: number[];
}

export interface WordSearchOptions {
  width: number;
  height?: number;
  directions: WordSearchDirections;
  random: () => number;
  /** Random spots tried for each word before it is skipped. Default 300. */
  triesPerWord?: number;
}

const STEPS: Record<WordSearchDirections, readonly [number, number][]> = {
  forward: [[0, 1], [1, 0]],
  diagonal: [[0, 1], [1, 0], [1, 1], [-1, 1]],
  all: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]],
};
const ALL_STEPS = STEPS.all;

/** Words the random filler must not spell by chance in any direction (a sheet may go to a children's class). */
export const BLOCKED: readonly string[] = ["ASS", "CRAP", "CUNT", "DAMN", "DICK", "COCK", "FAG", "FUCK", "FUK", "KKK", "NAZI", "PISS", "SEX", "SHIT", "SLUT", "TIT", "WTF"];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function fits(grid: (string | null)[], width: number, height: number, word: string, row: number, col: number, [dr, dc]: readonly [number, number]): boolean {
  const endRow = row + dr * (word.length - 1), endCol = col + dc * (word.length - 1);
  if (endRow < 0 || endRow >= height || endCol < 0 || endCol >= width) return false;
  for (let i = 0; i < word.length; i++) {
    const at = grid[(row + dr * i) * width + col + dc * i];
    if (at !== null && at !== word[i]) return false;
  }
  return true;
}

/** The squares a placed word covers, first letter first (the answer key draws them; the crossword has `wordCells`). */
export function wordSearchCells(sheet: Pick<WordSearch, "width">, word: Pick<WordSearchWord, "word" | "row" | "col" | "dRow" | "dCol">): number[] {
  return Array.from(word.word, (_, i) => (word.row + word.dRow * i) * sheet.width + word.col + word.dCol * i);
}

/** Every square that is part of a BLOCKED word read in any direction. */
export function blockedSquares(grid: readonly string[], width: number, height: number): Set<number> {
  const found = new Set<number>();
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      for (const [dr, dc] of ALL_STEPS) {
        for (const word of BLOCKED) {
          if (!fits(grid as (string | null)[], width, height, word, row, col, [dr, dc])) continue;
          for (let i = 0; i < word.length; i++) found.add((row + dr * i) * width + col + dc * i);
        }
      }
    }
  }
  return found;
}

/** Places the words (longest first), skipping any that cannot fit, and fills the rest. Words are grid letters
 *  (letters.ts gridLetters). The same words, options and random sequence always give the same puzzle. */
export function generateWordSearch(words: readonly string[], options: WordSearchOptions): WordSearch {
  const width = options.width, height = options.height ?? options.width;
  if (words.some((w) => !/^[A-Z]{2,}$/.test(w))) throw new Error(`word search: words must be two or more letters A–Z, got ${JSON.stringify(words.find((w) => !/^[A-Z]{2,}$/.test(w)))}`);
  const random = options.random;
  const tries = options.triesPerWord ?? 300;
  const grid: (string | null)[] = Array.from({ length: width * height }, () => null);
  const placed: WordSearchWord[] = [];
  const skipped: number[] = [];
  const order = shuffled(words.map((_, i) => i), random).sort((a, b) => words[b].length - words[a].length);
  for (const index of order) {
    const word = words[index];
    let spot: WordSearchWord | null = null;
    for (let t = 0; t < tries && !spot; t++) {
      const [dRow, dCol] = STEPS[options.directions][Math.floor(random() * STEPS[options.directions].length)];
      const row = Math.floor(random() * height), col = Math.floor(random() * width);
      if (fits(grid, width, height, word, row, col, [dRow, dCol])) spot = { index, word, row, col, dRow, dCol };
    }
    if (!spot) { skipped.push(index); continue; }
    for (let i = 0; i < word.length; i++) grid[(spot.row + spot.dRow * i) * width + spot.col + spot.dCol * i] = word[i];
    placed.push(spot);
  }
  const fixed = grid.map((letter) => letter !== null);
  const filled = grid.map((letter) => letter ?? ALPHABET[Math.floor(random() * 26)]);
  for (let round = 0; round < 50; round++) {
    const bad = [...blockedSquares(filled, width, height)].filter((i) => !fixed[i]);
    if (bad.length === 0) break;
    for (const i of bad) filled[i] = ALPHABET[Math.floor(random() * 26)];
  }
  placed.sort((a, b) => a.index - b.index);
  return { width, height, grid: filled, placed, skipped: skipped.sort((a, b) => a - b) };
}
