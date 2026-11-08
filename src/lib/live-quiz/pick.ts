// Which questions go into a live quiz (design.md 2.1), chosen in the leader's browser from the question bank: the pool
// the leader's filters leave, less the questions that cannot stand on a projector, drawn at random, mixed levels warming
// up from easy to hard, each with its options shuffled. Browser-only (the room never sees the bank).
import type { BankQuestion } from "../data";
import { LIMITS, type QuizQuestion } from "./protocol";

export type Level = "easy" | "medium" | "hard" | "mixed";
export const COUNTS = [10, 15, 20, 30] as const;
export const DEFAULT_COUNT = 15;
export const MIN_GAME = 3;
/** Catechism is opt-in: its answers belong to one tradition, and a mixed youth group may not share it. */
export const DEFAULT_KINDS = ["trivia", "lesson"];

export interface PickFilters {
  kinds: string[];
  level: Level;
  children: boolean;
  testament: "" | "OT" | "NT";
  book: string;
}

export const DEFAULT_FILTERS: PickFilters = { kinds: DEFAULT_KINDS, level: "mixed", children: false, testament: "", book: "" };

/** Wording that points outside the question itself; a fixed list, kept small on purpose. */
const POINTS_ELSEWHERE = [/\bthis passage\b/i, /\bthe following\b/i, /\bin this story\b/i];
const ALL_OR_NONE = /\b(all|none) of the above\b/i;

type Source = BankQuestion & { child?: BankQuestion["child"] };

const rightOf = (q: BankQuestion) => q.answer_choice ?? q.answer;

/** The question as a game shows it: the children's wording when asked for and the question has it. */
function wordingOf(q: Source, children: boolean): { text: string; options: string[]; answer: string } | null {
  if (children && q.child && q.child.options.length === 4 && q.child.options.includes(q.child.answer)) {
    return { text: q.child.question, options: q.child.options, answer: q.child.answer };
  }
  if (!q.options || q.options.length !== 4 || !q.options.includes(rightOf(q))) return null;
  return { text: q.question, options: q.options, answer: rightOf(q) };
}

/** Whether a question can go on a projector at all, whatever the filters. */
export function isPlayable(q: Source, children = false): boolean {
  if (!q.standalone && !q.lead_in) return false;
  const wording = wordingOf(q, children);
  if (!wording) return false;
  if (POINTS_ELSEWHERE.some((pattern) => pattern.test(wording.text))) return false;
  if (wording.options.some((option) => ALL_OR_NONE.test(option))) return false;
  if (wording.text.length > LIMITS.question || wording.options.some((option) => option.length > LIMITS.option)) return false;
  return !(q.lead_in && q.lead_in.question.length + q.lead_in.answer.length > LIMITS.leadIn);
}

/** The questions the leader's choices leave. `extra`: a further test, such as a theme from the test page. */
export function poolOf(questions: Source[], filters: PickFilters, extra?: (q: Source) => boolean): Source[] {
  return questions.filter((q) => filters.kinds.includes(q.kind)
    && (filters.level === "mixed" || q.level === filters.level)
    && (!filters.children || q.children === true)
    && (!filters.testament || q.testament === filters.testament)
    && (!filters.book || q.books.includes(filters.book))
    && isPlayable(q, filters.children)
    && (!extra || extra(q)));
}

/** A stable 16-character id from collection, question and answer (the bank has no id; all three together are unique). */
export function questionId(q: Pick<BankQuestion, "collection" | "question" | "answer">): string {
  const text = `${q.collection}\u0001${q.question}\u0001${q.answer}`;
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
    b ^= b >>> 15;
  }
  return a.toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}

/** References are mostly short, but a few list dozens of verses: cut at 160 characters. */
export function trimReference(reference: string | null): string | null {
  if (!reference) return null;
  const clean = reference.trim();
  return clean.length <= LIMITS.reference ? clean : `${clean.slice(0, LIMITS.reference - 1).trimEnd()}…`;
}

function cleanLink(link: BankQuestion["link"]): QuizQuestion["link"] {
  if (!link || link.book.length > LIMITS.book || !Number.isInteger(link.chapter) || link.chapter < 1) return null;
  const verse = link.verse !== null && Number.isInteger(link.verse) && link.verse >= 1 ? link.verse : null;
  return { book: link.book, chapter: link.chapter, verse };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** One bank question as the room keeps it: options shuffled, the right one's new place recorded. */
export function toQuizQuestion(q: Source, children: boolean, random: () => number = Math.random): QuizQuestion {
  const wording = wordingOf(q, children);
  if (!wording) throw new Error(`live-quiz: question "${q.question.slice(0, 60)}" has no four options with its answer among them`);
  const options = shuffled(wording.options, random);
  return {
    id: questionId(q), text: wording.text, leadIn: q.lead_in ? { question: q.lead_in.question, answer: q.lead_in.answer } : null,
    options, correct: options.indexOf(wording.answer), reference: trimReference(q.reference), link: cleanLink(q.link),
  };
}

const LEVEL_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

/** `count` questions from the pool at random, never one whose id is in `used` (an earlier game in the same room).
 * A mixed-level game runs easy, then medium, then hard, so it warms up. */
export function drawGame(pool: Source[], count: number, filters: Pick<PickFilters, "level" | "children">, used: readonly string[] = [], random: () => number = Math.random): QuizQuestion[] {
  const seen = new Set(used);
  const fresh = pool.filter((q) => !seen.has(questionId(q)));
  let picked = shuffled(fresh, random).slice(0, count);
  if (filters.level === "mixed") {
    picked = picked.map((q, i) => ({ q, i })).sort((x, y) => (LEVEL_ORDER[x.q.level ?? "medium"] - LEVEL_ORDER[y.q.level ?? "medium"]) || x.i - y.i).map((x) => x.q);
  }
  return picked.map((q) => toQuizQuestion(q, filters.children, random));
}

/** How many questions the pool can still give, after those already used in this room. */
export const freshCount = (pool: Source[], used: readonly string[]) => {
  const seen = new Set(used);
  return pool.filter((q) => !seen.has(questionId(q))).length;
};
