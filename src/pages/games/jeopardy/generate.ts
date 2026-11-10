// Bible Jeopardy's board (design 3.3–3.7): five rows per category climbing the difficulty ladder, filled scarcest
// column first so a small category keeps its questions, avoiding recently played ones; the Daily Double and the Final;
// swaps and redraws on the preview. Pure functions with a seedable random function, so a test can repeat a board.
import { questionId, toQuizQuestion } from "@/lib/live-quiz/pick";
import { plural } from "@/lib/site-format";
import type { TestQuestion } from "../../questions/test/engine";
import {
  candidatesByCategory, isOffered, limitsOf, poolFor, surprise, visibleCategories, type Category,
} from "./categories";
import { VALUES, ladderOf, type Board, type BoardSettings, type Column, type FinalClue, type Level, type Spot, type Tile } from "./model";

/** A small seedable random function (mulberry32): the same seed gives the same board. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ids = new WeakMap<object, string>();
/** A bank question's 16-character id (the live quiz's), worked out once per question. */
export function idOf(q: TestQuestion): string {
  let id = ids.get(q);
  if (!id) { id = questionId(q); ids.set(q, id); }
  return id;
}

export const levelOf = (q: TestQuestion): Level => q.level ?? "medium";
const RANK: Record<Level, number> = { easy: 0, medium: 1, hard: 2 };
/** The nearest level when a target has run out (3.4 step 2). */
export const NEAREST: Record<Level, Level[]> = { easy: ["easy", "medium", "hard"], medium: ["medium", "easy", "hard"], hard: ["hard", "medium", "easy"] };

/** Everything a board is drawn from with one set of settings. */
export interface Deck {
  settings: BoardSettings;
  byId: Map<string, Category>;
  candidates: Map<string, TestQuestion[]>;
  /** Categories with enough candidates, in list order. */
  offered: Category[];
  /** Recently played ids, oldest first, with their place in that list. */
  seen: Map<string, number>;
}

export function makeDeck(questions: readonly TestQuestion[], all: readonly Category[], settings: BoardSettings, seenList: readonly string[] = []): Deck {
  const categories = visibleCategories(all, settings);
  const candidates = candidatesByCategory(categories, poolFor(questions, settings));
  return {
    settings, byId: new Map(categories.map((category) => [category.id, category])), candidates,
    offered: categories.filter((category) => isOffered(candidates.get(category.id))),
    seen: new Map(seenList.map((id, index) => [id, index])),
  };
}

/** One question for a row: a fresh one at the target level, else at the nearest level; if every one left was played
 * recently, the one played longest ago. */
export function pickOne(candidates: readonly TestQuestion[], target: Level, used: ReadonlySet<string>, seen: ReadonlyMap<string, number>, random: () => number): TestQuestion | null {
  const free = candidates.filter((q) => !used.has(idOf(q)));
  if (free.length === 0) return null;
  for (const level of NEAREST[target]) {
    const fresh = free.filter((q) => levelOf(q) === level && !seen.has(idOf(q)));
    if (fresh.length) return fresh[Math.floor(random() * fresh.length)];
  }
  let best: TestQuestion | null = null;
  for (const level of NEAREST[target]) {
    for (const q of free) if (levelOf(q) === level && (best === null || seen.get(idOf(q))! < seen.get(idOf(best))!)) best = q;
  }
  return best;
}

/** A column's five questions, sorted so a lower value is never harder than a higher one; null if it cannot reach five. */
export function fillColumn(candidates: readonly TestQuestion[], rows: readonly Level[], used: Set<string>, seen: ReadonlyMap<string, number>, random: () => number): { picked: TestQuestion[]; fellBack: number } | null {
  const picked: TestQuestion[] = [];
  const mine = new Set(used);
  let fellBack = 0;
  for (const target of rows) {
    const q = pickOne(candidates, target, mine, seen, random);
    if (!q) return null;
    if (levelOf(q) !== target) fellBack++;
    mine.add(idOf(q));
    picked.push(q);
  }
  for (const q of picked) used.add(idOf(q));
  const sorted = picked.map((q, order) => ({ q, order })).sort((a, b) => RANK[levelOf(a.q)] - RANK[levelOf(b.q)] || a.order - b.order);
  return { picked: sorted.map((entry) => entry.q), fellBack };
}

const tileOf = (q: TestQuestion, row: number, children: boolean, random: () => number): Tile =>
  ({ q: toQuizQuestion(q, children, random), level: levelOf(q), value: VALUES[row] });

export const columnOf = (category: Category, picked: TestQuestion[], children: boolean, random: () => number): Column =>
  ({ category: category.id, title: category.title, line: category.line, tiles: picked.map((q, row) => tileOf(q, row, children, random)) });

/** The Daily Double's square: any column, rows 300–500 weighted 1 : 2 : 2 (3.6). */
export function placeDailyDouble(columns: number, random: () => number): Spot {
  const col = Math.min(columns - 1, Math.floor(random() * columns));
  const u = random();
  return { col, row: u < 0.2 ? 2 : u < 0.6 ? 3 : 4 };
}

interface Filled { columns: Column[]; notices: string[]; fellBack: number }

/** Fill the given categories, scarcest first; one that cannot reach five rows is replaced by the surprise rule. */
function fillAll(deck: Deck, categories: Category[], used: Set<string>, random: () => number): Filled {
  const rows = ladderOf(deck.settings).rows;
  const slots: (Column | null)[] = categories.map(() => null);
  const notices: string[] = [];
  let fellBack = 0;
  const order = categories.map((category, index) => ({ index, size: deck.candidates.get(category.id)?.length ?? 0 })).sort((a, b) => a.size - b.size || a.index - b.index);
  const failed: number[] = [];
  for (const { index } of order) {
    const result = fillColumn(deck.candidates.get(categories[index].id) ?? [], rows, used, deck.seen, random);
    if (result) { slots[index] = columnOf(categories[index], result.picked, deck.settings.children, random); fellBack += result.fellBack; } else failed.push(index);
  }
  const tried = new Set(categories.map((category) => category.id));
  for (const index of failed) {
    notices.push(`${categories[index].title} had too few questions left and was replaced.`);
    for (;;) {
      const present = slots.flatMap((column) => (column ? [deck.byId.get(column.category)!] : []));
      const [next] = surprise(deck.offered, 1, { ...limitsOf(present, deck.settings.columns), taken: tried }, random);
      if (!next) break;
      tried.add(next.id);
      const result = fillColumn(deck.candidates.get(next.id) ?? [], rows, used, deck.seen, random);
      if (result) { slots[index] = columnOf(next, result.picked, deck.settings.children, random); fellBack += result.fellBack; break; }
    }
  }
  return { columns: slots.filter((column): column is Column => column !== null), notices, fellBack };
}

/** The Final: a theme from a group not on the board, one question at the Final level not used anywhere (3.6). */
export function drawFinal(deck: Deck, columns: readonly Column[], used: ReadonlySet<string>, random: () => number, avoid: readonly string[] = []): FinalClue | null {
  const present = columns.flatMap((column) => deck.byId.get(column.category) ?? []);
  const limits = limitsOf(present, 0);
  const options = surprise(deck.offered, deck.offered.length, { ...limits, taken: new Set([...limits.taken, ...avoid]) }, random);
  const target = ladderOf(deck.settings).final;
  for (const category of options) {
    const q = pickOne(deck.candidates.get(category.id) ?? [], target, used, deck.seen, random);
    if (q) return { category: category.id, title: category.title, line: category.line, q: toQuizQuestion(q, deck.settings.children, random), level: levelOf(q) };
  }
  return null;
}

export const boardIds = (columns: readonly Column[]) => new Set(columns.flatMap((column) => column.tiles.map((tile) => tile.q.id)));

function noticesFor(filled: Filled, wanted: number): string[] {
  const notices = [...filled.notices];
  if (filled.columns.length < wanted) {
    notices.push(plural(filled.columns.length, "Only {n} category has enough questions with these settings.", "Only {n} categories have enough questions with these settings."));
  }
  if (filled.fellBack > 0) notices.push("A few tiles use a question one level easier or harder: there were too few at the exact level.");
  return notices;
}

/** A whole board: the chosen categories in their order, the rest by "Surprise me" (3.2, 3.4, 3.6). */
export function buildBoard(deck: Deck, chosen: readonly string[], random: () => number): Board {
  const picked = chosen.flatMap((id) => (isOffered(deck.candidates.get(id)) ? [deck.byId.get(id)!] : [])).slice(0, deck.settings.columns);
  const categories = [...picked, ...surprise(deck.offered, deck.settings.columns - picked.length, limitsOf(picked, deck.settings.columns), random)];
  const used = new Set<string>();
  const filled = fillAll(deck, categories, used, random);
  return finish(deck, filled, used, random, noticesFor(filled, deck.settings.columns));
}

function finish(deck: Deck, filled: Filled, used: Set<string>, random: () => number, notices: string[]): Board {
  const final = deck.settings.final ? drawFinal(deck, filled.columns, used, random) : null;
  if (deck.settings.final && !final) notices.push("No category was left for the Final question, so the game ends without one.");
  return {
    settings: deck.settings, columns: filled.columns, final, notices,
    dailyDouble: deck.settings.dailyDouble && filled.columns.length > 0 ? placeDailyDouble(filled.columns.length, random) : null,
  };
}

/** Swap one column for another category (chosen, or by the surprise rule), keeping every other tile (3.7). */
export function swapColumn(deck: Deck, board: Board, index: number, categoryId: string | null, random: () => number): Board {
  const others = board.columns.filter((_, i) => i !== index);
  const used = boardIds(others);
  if (board.final) used.add(board.final.q.id);
  const present = others.flatMap((column) => deck.byId.get(column.category) ?? []);
  const tried = new Set([...present.map((category) => category.id), board.columns[index].category]);
  if (board.final) tried.add(board.final.category);
  const rows = ladderOf(deck.settings).rows;
  const queue = categoryId ? [deck.byId.get(categoryId)].filter((category): category is Category => category !== undefined && isOffered(deck.candidates.get(category.id))) : [];
  for (;;) {
    const next = queue.shift() ?? surprise(deck.offered, 1, { ...limitsOf(present, deck.settings.columns), taken: tried }, random)[0];
    if (!next) return { ...board, notices: ["No other category has enough questions left with these settings."] };
    tried.add(next.id);
    const result = fillColumn(deck.candidates.get(next.id) ?? [], rows, used, deck.seen, random);
    if (result) return replaceColumn(board, index, columnOf(next, result.picked, deck.settings.children, random), random);
    if (categoryId) return { ...board, notices: [`${next.title} has too few questions left with these settings.`] };
  }
}

/** New questions for one column, same category: different ones where the category has them (3.7). */
export function redrawColumn(deck: Deck, board: Board, index: number, random: () => number): Board {
  const column = board.columns[index];
  const category = deck.byId.get(column.category);
  if (!category) return board;
  const others = boardIds(board.columns.filter((_, i) => i !== index));
  if (board.final) others.add(board.final.q.id);
  const rows = ladderOf(deck.settings).rows;
  const candidates = deck.candidates.get(category.id) ?? [];
  const result = fillColumn(candidates, rows, new Set([...others, ...column.tiles.map((tile) => tile.q.id)]), deck.seen, random)
    ?? fillColumn(candidates, rows, new Set(others), deck.seen, random);
  return result ? replaceColumn(board, index, columnOf(category, result.picked, deck.settings.children, random), random) : board;
}

function replaceColumn(board: Board, index: number, column: Column, random: () => number): Board {
  const columns = board.columns.map((existing, i) => (i === index ? column : existing));
  const dailyDouble = board.dailyDouble && board.dailyDouble.col === index ? { col: index, row: placeDailyDouble(1, random).row } : board.dailyDouble;
  return { ...board, columns, dailyDouble, notices: [] };
}

/** Another Final question, from another category. */
export function swapFinal(deck: Deck, board: Board, random: () => number): Board {
  if (!board.final) return board;
  const final = drawFinal(deck, board.columns, boardIds(board.columns), random, [board.final.category]);
  return final ? { ...board, final, notices: [] } : { ...board, notices: ["No other category has a Final question left with these settings."] };
}

/** One extra question for a tie at the end (6.6): hard (medium for children), from a category not used tonight and
 * never the question of an earlier tie-breaker in the same game. */
export function drawTieBreaker(deck: Deck, board: Board, random: () => number, earlier: FinalClue | null = null): FinalClue | null {
  const used = boardIds(board.columns);
  if (board.final) used.add(board.final.q.id);
  if (earlier) used.add(earlier.q.id);
  const avoid = board.final ? [board.final.category] : [];
  const children = deck.settings.children;
  const tieDeck: Deck = { ...deck, settings: { ...deck.settings, difficulty: children ? "gentle" : "challenging" } };
  return drawFinal(tieDeck, board.columns, used, random, avoid);
}

