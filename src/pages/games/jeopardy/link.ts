// Bible Jeopardy's board link (design 7.2): a prepared board in the address, so it can be made at home and opened on
// the church laptop. /games/jeopardy?board=<version>.<language>.<settings>.<columns> — the settings in ten letters and
// digits, each column as its category and five question ids, then the Final. Teams are not in the link.
import { toQuizQuestion } from "@/lib/live-quiz/pick";
import { plural } from "@/lib/site-format";
import type { TestQuestion } from "../../questions/test/engine";
import { buildBoard, columnOf, drawFinal, fillColumn, idOf, levelOf, pickOne, placeDailyDouble, type Deck } from "./generate";
import { COLUMN_COUNTS, VALUES, ladderOf, type Board, type BoardSettings, type Column, type FinalClue, type Spot } from "./model";

export const LINK_VERSION = "1";
const DIFFICULTY_CODES = { gentle: "g", standard: "s", challenging: "c" } as const;
const TESTAMENT_CODES = { "": "b", OT: "o", NT: "n" } as const;
const ID = /^[0-9a-f]{16}$/;
const CATEGORY = /^(t[a-z0-9-]{1,40}|b[A-Z0-9]{3})$/;
const RANK = { easy: 0, medium: 1, hard: 2 } as const;
const LANGUAGE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;

export interface LinkBoard {
  language: string;
  settings: BoardSettings;
  columns: { category: string; ids: string[] }[];
  final: { category: string; id: string } | null;
  dailyDouble: Spot | null;
}

const categoryCode = (id: string) => (id.startsWith("theme:") ? `t${id.slice(6)}` : `b${id.slice(5)}`);
const categoryId = (code: string) => (code[0] === "t" ? `theme:${code.slice(1)}` : `book:${code.slice(1)}`);
const bit = (value: boolean) => (value ? "1" : "0");
const keyOf = <T extends string>(codes: Record<T, string>, code: string): T | undefined =>
  (Object.keys(codes) as T[]).find((key) => codes[key] === code);

/** The board's link value (what follows ?board=). */
export function encodeBoard(board: Board, language: string): string {
  const s = board.settings;
  const dd = board.dailyDouble ? `${board.dailyDouble.col}${board.dailyDouble.row}` : "--";
  const settings = `${board.columns.length}${DIFFICULTY_CODES[s.difficulty]}${bit(s.choices)}${bit(s.children)}${bit(s.catechism)}${TESTAMENT_CODES[s.testament]}${dd}${bit(board.final !== null)}`;
  const columns = board.columns.map((column) => [categoryCode(column.category), ...column.tiles.map((tile) => tile.q.id)].join("_"));
  if (board.final) columns.push(`f${categoryCode(board.final.category)}_${board.final.q.id}`);
  return [LINK_VERSION, language, settings, columns.join("~")].join(".");
}

/** A link value read back, or null when it is not one this version made. */
export function decodeBoard(text: string): LinkBoard | null {
  const parts = text.split(".");
  if (parts.length !== 4 || parts[0] !== LINK_VERSION || !LANGUAGE.test(parts[1])) return null;
  const s = parts[2];
  const match = /^([3-6])([gsc])([01])([01])([01])([bon])([0-5][0-4]|--)([01])$/.exec(s);
  if (!match) return null;
  const count = Number(match[1]);
  const groups = parts[3].split("~");
  const finalGroup = groups[groups.length - 1]?.startsWith("f") ? groups.pop()! : null;
  if (groups.length !== count || (match[8] === "1") !== (finalGroup !== null)) return null;
  const columns: LinkBoard["columns"] = [];
  for (const group of groups) {
    const [code, ...ids] = group.split("_");
    if (!CATEGORY.test(code) || ids.length !== VALUES.length || !ids.every((id) => ID.test(id))) return null;
    columns.push({ category: categoryId(code), ids });
  }
  let final: LinkBoard["final"] = null;
  if (finalGroup) {
    const [code, id, extra] = finalGroup.slice(1).split("_");
    if (!CATEGORY.test(code) || !ID.test(id ?? "") || extra !== undefined) return null;
    final = { category: categoryId(code), id };
  }
  const dd = match[7] === "--" ? null : { col: Number(match[7][0]), row: Number(match[7][1]) };
  if (dd && dd.col >= count) return null;
  if (!(COLUMN_COUNTS as readonly number[]).includes(count)) return null;
  const settings: BoardSettings = {
    columns: count, difficulty: keyOf(DIFFICULTY_CODES, match[2])!, choices: match[3] === "1", children: match[4] === "1",
    catechism: match[5] === "1", testament: keyOf(TESTAMENT_CODES, match[6])!, dailyDouble: dd !== null, final: final !== null,
  };
  return { language: parts[1], settings, columns, final, dailyDouble: dd };
}

/** The board a link names, found in the bank: a missing id is redrawn for the same category and row level, and a board
 * made in another site language is drawn again with the same categories (ids come from each question's own text). */
export function boardFromLink(deck: Deck, link: LinkBoard, language: string, random: () => number): Board {
  if (link.language !== language) {
    const board = buildBoard(deck, link.columns.map((column) => column.category), random);
    return { ...board, notices: ["This board was made in another site language, so its questions were drawn again for the same categories.", ...board.notices] };
  }
  const rows = ladderOf(deck.settings).rows;
  const used = new Set<string>();
  const notices: string[] = [];
  const noSeen = new Map<string, number>();
  let replaced = 0;
  const columns: Column[] = [];
  const kept: number[] = []; // the link's column number of each column kept, so the Daily Double follows its column
  // The link's own ids are kept out of every redraw, so a replacement never takes a question a later tile names.
  const reserved = new Set([...link.columns.flatMap((column) => column.ids), ...(link.final ? [link.final.id] : [])]);
  for (const [linkCol, entry] of link.columns.entries()) {
    const category = deck.byId.get(entry.category);
    const candidates = deck.candidates.get(entry.category) ?? [];
    if (!category || candidates.length === 0) { notices.push("A category from the link is not available with these settings, so it was left out."); continue; }
    const byId = new Map(candidates.map((q) => [idOf(q), q]));
    const picked: TestQuestion[] = [];
    for (let row = 0; row < rows.length; row++) {
      const found = byId.get(entry.ids[row]);
      const q = found && !used.has(entry.ids[row]) ? found : pickOne(candidates, rows[row], new Set([...reserved, ...used]), noSeen, random);
      if (!q) break;
      if (q !== found) replaced++;
      used.add(idOf(q));
      picked.push(q);
    }
    if (picked.length < rows.length) {
      const refill = fillColumn(candidates, rows, used, noSeen, random);
      if (!refill) { notices.push(`${category.title} has too few questions left, so it was left out.`); continue; }
      picked.splice(0, picked.length, ...refill.picked);
    }
    const sorted = picked.map((q, order) => ({ q, order })).sort((a, b) => RANK[levelOf(a.q)] - RANK[levelOf(b.q)] || a.order - b.order).map((item) => item.q);
    columns.push(columnOf(category, sorted, deck.settings.children, random));
    kept.push(linkCol);
  }
  let final: FinalClue | null = null;
  if (link.final) {
    const category = deck.byId.get(link.final.category);
    const candidates = deck.candidates.get(link.final.category) ?? [];
    const found = candidates.find((q) => idOf(q) === link.final!.id && !used.has(idOf(q)));
    const q = found ?? (category ? pickOne(candidates, ladderOf(deck.settings).final, used, noSeen, random) : null);
    if (q && category) {
      if (!found) replaced++;
      final = { category: category.id, title: category.title, line: category.line, q: toQuizQuestion(q, deck.settings.children, random), level: levelOf(q) };
    } else {
      final = drawFinal(deck, columns, used, random);
    }
  }
  if (replaced > 0) notices.push(plural(replaced, "{n} question is no longer in the bank and was replaced.", "{n} questions are no longer in the bank and were replaced."));
  const ddCol = link.dailyDouble ? kept.indexOf(link.dailyDouble.col) : -1;
  const dailyDouble = !link.dailyDouble || columns.length === 0 ? null
    : ddCol >= 0 ? { col: ddCol, row: link.dailyDouble.row } : placeDailyDouble(columns.length, random);
  return { settings: deck.settings, columns, final, dailyDouble, notices };
}
