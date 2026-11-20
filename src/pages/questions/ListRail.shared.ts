// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import type { QuestionBank } from "@/lib/data";
import { facetsOf, type Filters } from "./model";
export const BOOK_SECTIONS = [
  { label: "Law", from: "GEN", to: "DEU" },
  { label: "History", from: "JOS", to: "EST" },
  { label: "Poetry & wisdom", from: "JOB", to: "SNG" },
  { label: "Prophets", from: "ISA", to: "MAL" },
  { label: "Gospels & Acts", from: "MAT", to: "ACT" },
  { label: "Epistles", from: "ROM", to: "JUD" },
  { label: "Revelation", from: "REV", to: "REV" },
];

export interface ListChoice { book: string; theme: string }

/** `withoutOptions`: the questions "multiple choice only" leaves out, given so the filter works on rows whose words (and
 *  options) have not come yet (question-store.ts); without it the filter reads each question's options. */
export function listFacets(bank: QuestionBank, haystacks: string[], filters: Filters, choice: ListChoice, members: Map<string, Set<number>>, withoutOptions?: Set<number>) {
  const inTheme = members.get(choice.theme);
  const left = filters.choices && withoutOptions ? withoutOptions : null;
  const keepTheme = inTheme || left ? (i: number) => (!inTheme || inTheme.has(i)) && !left?.has(i) : undefined;
  const keepAny = left ? (i: number) => !left.has(i) : undefined;
  const base: Filters = { ...filters, topic: "", testament: "", kind: "", choices: left ? false : filters.choices };
  const chosen = facetsOf(bank.questions, haystacks, { ...base, book: choice.book }, keepTheme);
  const anyBook = choice.book ? facetsOf(bank.questions, haystacks, { ...base, book: "" }, keepTheme).rows : chosen.rows;
  const anyTheme = inTheme ? facetsOf(bank.questions, haystacks, { ...base, book: choice.book }, keepAny).rows : chosen.rows;
  const themeCount = new Map<string, number>();
  for (const [id, set] of members) themeCount.set(id, anyTheme.reduce((n, i) => n + (set.has(i) ? 1 : 0), 0));
  return { rows: chosen.rows, bookCount: chosen.counts.book, collectionCount: chosen.counts.collection, difficultyCount: chosen.counts.difficulty, anyBook, anyTheme, themeCount };
}
