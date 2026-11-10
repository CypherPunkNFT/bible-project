// Bible Jeopardy's categories (design 3.2, 3.5): the test page's themes and the books of the Bible, the questions each
// can draw on with the board's settings, which ones are offered, and the "Surprise me" draw. Pure functions; the
// pool and theme tests are the live quiz's and the test page's own, imported, never copied.
import type { BankBook } from "@/lib/data";
import { DEFAULT_KINDS, poolOf, type PickFilters } from "@/lib/live-quiz/pick";
import type { TestQuestion } from "../../questions/test/engine";
import { SHELVES, inTheme, themeById } from "../../questions/test/themes";
import type { BoardSettings } from "./model";

export interface Category {
  /** `theme:<theme id>` or `book:<book code>`. */
  id: string;
  kind: "theme" | "book";
  title: string;
  line: string;
  /** The test page's shelf and group for a theme; "OT" / "NT" and the book code for a book. */
  shelf: string;
  group: string;
  testament: "OT" | "NT" | null;
}

/** A category is offered only with at least this many candidates, so a swap always has somewhere to go (3.2). */
export const MIN_CANDIDATES = 8;
export const ROWS = 5;

/** Clues that make no sense without their options: left out when choices are hidden (3.5). */
const NEEDS_OPTIONS = /\b(which|what|who) of (these|the following)\b|\bwhich one of\b/i;
const NOT = /\bNOT\b/;

export const THEME_CATEGORIES: Category[] = SHELVES.flatMap((shelf) => shelf.groups.flatMap((group) => group.themes.map((theme) => ({
  id: `theme:${theme.id}`, kind: "theme" as const, title: theme.title, line: theme.line, shelf: shelf.id, group: group.id, testament: null,
}))));

const THEME_OF = new Map(THEME_CATEGORIES.map((category) => [category.id, themeById(category.id.slice(6))!]));

export function bookCategories(books: readonly BankBook[]): Category[] {
  return books.map((book) => ({
    id: `book:${book.code}`, kind: "book" as const, title: book.name, line: `Questions from ${book.name}`,
    shelf: book.testament, group: book.code, testament: book.testament,
  }));
}

/** The wording a game shows: the children's when asked for and the question has a usable one (as pick.ts). */
export function shownText(q: TestQuestion, children: boolean): string {
  const child = q.child;
  if (children && child && child.options.length === 4 && child.options.includes(child.answer)) return child.question;
  return q.question;
}

/** The questions the board may use at all (3.5): the live quiz's pool, then the open-answer rule. */
export function poolFor(questions: readonly TestQuestion[], settings: BoardSettings): TestQuestion[] {
  const filters: PickFilters = {
    kinds: settings.catechism ? [...DEFAULT_KINDS, "catechism"] : DEFAULT_KINDS,
    level: "mixed", children: settings.children, testament: settings.testament, book: "",
  };
  const pool = poolOf(questions as TestQuestion[], filters) as TestQuestion[];
  if (settings.choices) return pool;
  return pool.filter((q) => {
    const text = shownText(q, settings.children);
    return !NEEDS_OPTIONS.test(text) && !NOT.test(text);
  });
}

/** Whether a question belongs to a category. */
export function belongs(category: Category, q: TestQuestion): boolean {
  if (category.kind === "book") return q.books.includes(category.id.slice(5));
  const theme = THEME_OF.get(category.id);
  return theme !== undefined && inTheme(theme, q);
}

/** Every category the board could show with these settings (books of the other testament hidden). */
export function visibleCategories(all: readonly Category[], settings: Pick<BoardSettings, "testament">): Category[] {
  return all.filter((category) => !settings.testament || category.testament === null || category.testament === settings.testament);
}

/** Each category's candidates in the pool. */
export function candidatesByCategory(categories: readonly Category[], pool: readonly TestQuestion[]): Map<string, TestQuestion[]> {
  const out = new Map<string, TestQuestion[]>(categories.map((category) => [category.id, []]));
  for (const q of pool) {
    for (const category of categories) if (belongs(category, q)) out.get(category.id)!.push(q);
  }
  return out;
}

export const isOffered = (candidates: readonly unknown[] | undefined) => (candidates?.length ?? 0) >= MIN_CANDIDATES;

export interface SurpriseLimits {
  /** Categories already on the board: never drawn again. */
  taken: ReadonlySet<string>;
  /** Groups already on the board: at most one theme per group. */
  groups: ReadonlySet<string>;
  /** Shelves already on the board, counted, for the spread of a five- or six-column board. */
  shelves: ReadonlyMap<string, number>;
  /** The board's column count (the shelf spread applies from five). */
  columns: number;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** "Surprise me" (3.2): up to `count` offered themes at random, at most one per group, and on a board of five or six
 * columns no more than two from one shelf. The shelf spread gives way before the board falls short; the one-per-group
 * rule does not. */
export function surprise(offered: readonly Category[], count: number, limits: SurpriseLimits, random: () => number): Category[] {
  const themes = shuffled(offered.filter((category) => category.kind === "theme" && !limits.taken.has(category.id)), random);
  const picked: Category[] = [];
  const groups = new Set(limits.groups);
  const shelves = new Map(limits.shelves);
  for (const spread of [true, false]) {
    for (const theme of themes) {
      if (picked.length >= count) return picked;
      if (picked.includes(theme) || groups.has(theme.group)) continue;
      if (spread && limits.columns >= 5 && (shelves.get(theme.shelf) ?? 0) >= 2) continue;
      picked.push(theme);
      groups.add(theme.group);
      shelves.set(theme.shelf, (shelves.get(theme.shelf) ?? 0) + 1);
    }
  }
  return picked;
}

/** The limits a board's present categories put on a draw. */
export function limitsOf(categories: readonly Category[], columns: number): SurpriseLimits {
  const shelves = new Map<string, number>();
  for (const category of categories) shelves.set(category.shelf, (shelves.get(category.shelf) ?? 0) + 1);
  return { taken: new Set(categories.map((category) => category.id)), groups: new Set(categories.map((category) => category.group)), shelves, columns };
}
