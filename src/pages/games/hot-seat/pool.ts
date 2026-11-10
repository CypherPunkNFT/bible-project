// Hot seat: which questions each age group can be asked (docs/features/hot-seat/design.md §3.1–3.2). The bank's Bible
// quiz and Sunday-school questions, less those that do not work read aloud at speed: two-part questions, questions
// that need their choices, and anything too long to fire or to judge at a glance. Each question is frozen once per
// loaded bank with the live quiz's own `toQuizQuestion`, so the pool tests exactly the wording the turn will show.
import type { BankQuestion } from "@/lib/data";
import { poolOf, toQuizQuestion } from "@/lib/live-quiz/pick";
import type { QuizQuestion } from "@/lib/live-quiz/protocol";
import { firstWords } from "./words";

export type Group = "little" | "kids" | "adults" | "experts";
export type Level = "easy" | "medium" | "hard";
export type Testament = "" | "OT" | "NT";

export interface GroupInfo { key: Group; label: string; note: string; children: boolean; levels: readonly Level[] }

export const GROUPS: readonly GroupInfo[] = [
  { key: "little", label: "Little ones", note: "Ages 4–7: easy questions, two choices read out", children: true, levels: ["easy"] },
  { key: "kids", label: "Kids", note: "Ages 8–12: easy and medium questions", children: true, levels: ["easy", "medium"] },
  { key: "adults", label: "Teens and adults", note: "Ages 13 and up: every level, starting easy", children: false, levels: ["easy", "medium", "hard"] },
  { key: "experts", label: "Bible experts", note: "Medium and hard questions only", children: false, levels: ["medium", "hard"] },
];
export const GROUP_KEYS: readonly Group[] = GROUPS.map((g) => g.key);
export const groupInfo = (group: Group): GroupInfo => GROUPS.find((g) => g.key === group) ?? GROUPS[2];

/** About five seconds read aloud; the median eligible question is about 80 characters (§3.2 rule 5). */
export const QUESTION_MAX = 140;
/** The answer the reader judges at a glance. */
export const ANSWER_MAX = 40;
/** Below this a group is not offered under the chosen testament (§6.1). */
export const MIN_POOL = 60;

// Copied from Bible Jeopardy (jeopardy/categories.ts keeps them private): wording that only makes sense with the
// choices in front of the player, and capital-letter NOT questions that trip people up when heard.
const NEEDS_CHOICES = /\b(which|what|who) of (these|the following)\b|\bwhich one of\b/i;
const NOT = /\bNOT\b/;

/** One eligible question, frozen as a turn will show it. */
export interface PoolEntry {
  frozen: QuizQuestion;
  /** The bank's full printed answer, when it says more than the option the reader judges. */
  full: string | null;
  level: Level;
  topic: string | null;
  testament: "OT" | "NT" | null;
  /** Its first four words (words.ts), worked out once so a draw never re-reads the whole pool's wording. */
  opening: string;
}

const LEVELS: readonly string[] = ["easy", "medium", "hard"];

/** Every question a hot seat may ask in one wording (children's or ordinary), frozen once. */
export function eligibleQuestions(questions: readonly BankQuestion[], children: boolean): PoolEntry[] {
  const entries: PoolEntry[] = [];
  const extra = (q: BankQuestion) => !q.lead_in && typeof q.level === "string" && LEVELS.includes(q.level);
  for (const q of poolOf(questions as BankQuestion[], { kinds: ["trivia", "lesson"], level: "mixed", children, testament: "", book: "" }, extra)) {
    const frozen = toQuizQuestion(q, children, () => 0);
    const answer = frozen.options[frozen.correct];
    if (NEEDS_CHOICES.test(frozen.text) || NOT.test(frozen.text)) continue;
    if (frozen.text.length > QUESTION_MAX || answer.length > ANSWER_MAX) continue;
    const printed = children && frozen.text !== q.question ? null : q.answer.trim();
    entries.push({ frozen, full: printed && printed !== answer ? printed : null, level: q.level as Level, topic: q.topic, testament: q.testament,
      opening: firstWords(frozen.text) });
  }
  return entries;
}

export interface Pools {
  /** The ordinary wording, for Teens and adults and Bible experts. */
  ordinary: PoolEntry[];
  /** The children's wording where the bank has one, children's questions only, for Little ones and Kids. */
  children: PoolEntry[];
}

const cache = new WeakMap<readonly BankQuestion[], Pools>();

/** Both frozen lists for a loaded bank, built once and kept for as long as the bank is. */
export function poolsOf(questions: readonly BankQuestion[]): Pools {
  let pools = cache.get(questions);
  if (!pools) {
    pools = { ordinary: eligibleQuestions(questions, false), children: eligibleQuestions(questions, true) };
    cache.set(questions, pools);
  }
  return pools;
}

/** A group's pool under a testament: a cheap filter over the frozen lists. */
export function poolFor(pools: Pools, group: Group, testament: Testament): PoolEntry[] {
  const info = groupInfo(group);
  const source = info.children ? pools.children : pools.ordinary;
  return source.filter((e) => info.levels.includes(e.level) && (!testament || e.testament === testament));
}

/** How many questions each group has under a testament, for the setup's "too few questions" check. */
export function poolSizes(pools: Pools, testament: Testament): Record<Group, number> {
  return Object.fromEntries(GROUP_KEYS.map((g) => [g, poolFor(pools, g, testament).length])) as Record<Group, number>;
}
