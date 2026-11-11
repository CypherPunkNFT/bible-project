// Bible crossword: what the game keeps on this device, in local storage under bp-crossword (design §4, §8). The last
// choices, the puzzle in play (its layout, never just a seed, so a changed generator cannot move saved letters) and
// how many puzzles were solved. Nothing leaves the browser. Storage that is missing, full or corrupt never stops
// the game: it just keeps nothing, and anything that does not match the clue file or the grid is dropped.
import { LEVELS, SIZES, THEMES, type Level, type Size, type Source } from "./themes";
import type { CluesFile, Layout, Puzzle, Spec } from "./game";

const KEY = "bp-crossword";

export type Store = Pick<Storage, "getItem" | "setItem">;

export interface PlayState {
  stamp: string;
  spec: Spec;
  layout: Layout;
  /** One per square, "" or A–Z. */
  letters: string[];
  revealed: number[];
  wrong: number[];
  checks: number;
}

export interface Saved { spec: Spec; game: PlayState | null; solved: number }

export const DEFAULT_SPEC: Spec = { source: { theme: "whole" }, level: "easy", size: "small" };

/** The browser's local storage, or null where the browser refuses it (private modes can throw on access). */
export function browserStore(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isIndexList = (value: unknown, below: number): value is number[] =>
  Array.isArray(value) && value.every((n) => Number.isInteger(n) && n >= 0 && n < below);

function readSource(value: unknown): Source | null {
  if (!isRecord(value)) return null;
  if (typeof value.theme === "string" && THEMES.some((t) => t.id === value.theme)) return { theme: value.theme };
  if (Number.isInteger(value.book) && (value.book as number) >= 1 && (value.book as number) <= 66) return { book: value.book as number };
  return null;
}

export function readSpec(value: unknown): Spec | null {
  if (!isRecord(value)) return null;
  const source = readSource(value.source);
  const level = LEVELS.find((l) => l === value.level) as Level | undefined;
  const size = SIZES.find((s) => s === value.size) as Size | undefined;
  return source && level && size ? { source, level, size } : null;
}

function readLayout(value: unknown): Layout | null {
  if (!isRecord(value) || !Number.isInteger(value.width) || !Number.isInteger(value.height) || !Array.isArray(value.words)) return null;
  const words = value.words.filter((w): w is Layout["words"][number] => isRecord(w) && Number.isInteger(w.e) && Number.isInteger(w.row)
    && Number.isInteger(w.col) && (w.d === "across" || w.d === "down"));
  return words.length === value.words.length ? { width: value.width as number, height: value.height as number, words } : null;
}

/** The saved game when it belongs to this clue file and its grid, else null. `toPuzzle` checks the layout itself. */
export function readGame(value: unknown, data: CluesFile, toPuzzle: (layout: Layout) => Puzzle | null): PlayState | null {
  if (!isRecord(value) || value.stamp !== data.stamp) return null;
  const spec = readSpec(value.spec);
  const layout = readLayout(value.layout);
  const puzzle = layout && toPuzzle(layout);
  if (!spec || !layout || !puzzle) return null;
  const squares = puzzle.cells.length;
  const letters = value.letters;
  if (!Array.isArray(letters) || letters.length !== squares || !letters.every((l, i) => (l === "" || /^[A-Z]$/.test(l as string)) && (l === "" || puzzle.cells[i] !== null))) return null;
  if (!isIndexList(value.revealed, squares) || !isIndexList(value.wrong, squares) || !Number.isInteger(value.checks) || (value.checks as number) < 0) return null;
  return { stamp: data.stamp, spec, layout, letters: letters as string[], revealed: value.revealed, wrong: value.wrong, checks: value.checks as number };
}

function readRaw(store: Store | null): Record<string, unknown> {
  try {
    const raw = store?.getItem(KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isRecord(value) ? value : {};
  } catch {
    return {}; // corrupt or unreadable: treated as nothing saved
  }
}

export function readSaved(store: Store | null, data: CluesFile, toPuzzle: (layout: Layout) => Puzzle | null): Saved {
  const raw = readRaw(store);
  return {
    spec: readSpec(raw.spec) ?? DEFAULT_SPEC,
    game: readGame(raw.game, data, toPuzzle),
    solved: Number.isInteger(raw.solved) && (raw.solved as number) >= 0 ? (raw.solved as number) : 0,
  };
}

export function writeSaved(store: Store | null, saved: Saved): void {
  try {
    store?.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Full or blocked storage: the game carries on without remembering.
  }
}
