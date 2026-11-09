// Verse completion: judging a typed answer against the hidden words (design §6.3–§6.4). Forgive slips, never forgive a
// different word: typos within an allowance count, a different real word never does, and the words are lined up first
// so one missed word does not mark everything after it wrong.
import { equivalent, typedTokens } from "./equivalents.ts";
import { MAX_CHARS } from "./passage.ts";
import type { Word } from "./words.ts";

export type Verdict = "exact" | "typo" | "near" | "wrong" | "missing";

/** One hidden word's result. `typed` is what the player wrote against it, when anything, and `at` its place in `typed`. */
export interface Mark { verdict: Verdict; credit: number; typed?: string; at?: number }

/** `typed` is the answer's words as lined up: reference and any retyped opening already removed. */
export interface Result { marks: Mark[]; extras: string[]; accuracy: number; perfect: boolean; typed: string[] }

const CREDIT: Record<Verdict, number> = { exact: 1, typo: 1, near: 0.5, wrong: 0, missing: 0 };
const PAIR_COST: Record<Verdict, number> = { exact: 0, typo: 0.1, near: 0.5, wrong: 1, missing: 1 };
const ENDINGS = ["s", "es", "ed", "d", "ing", "eth", "th", "ly"];

/** Damerau–Levenshtein distance (optimal string alignment): letters added, removed, changed or swapped with a neighbour. */
export function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  }
  return rows[a.length][b.length];
}

/** The two words differ only by a common ending: "believe" and "believes" (§6.3 "near"). */
export const differsByEnding = (a: string, b: string): boolean => a !== b && ENDINGS.some((ending) => a + ending === b || b + ending === a);

/** The typo allowance for a passage word's length: 0 for 1–3 letters, 1 for 4–6, 2 for 7 or more. */
export const allowance = (length: number): number => (length <= 3 ? 0 : length <= 6 ? 1 : 2);

/** One typed word against one passage word (§6.3). Both are already in comparison form. */
export function judge(target: string, typed: string, vocabulary: ReadonlySet<string>): Verdict {
  if (target === typed) return "exact";
  const sameStart = target[0] === typed[0] || (target[0] === typed[1] && target[1] === typed[0]);
  if (sameStart && !vocabulary.has(typed) && distance(target, typed) <= allowance(target.length)) return "typo";
  if (differsByEnding(target, typed)) return "near";
  return "wrong";
}

interface Cell { cost: number; credit: number; step: "pair" | "missing" | "extra" }

/** Better: lower cost, then more credit for the player, then pairing over skipping (§6.4). */
function better(a: Cell, b: Cell): boolean {
  if (Math.abs(a.cost - b.cost) > 1e-9) return a.cost < b.cost;
  if (Math.abs(a.credit - b.credit) > 1e-9) return a.credit > b.credit;
  return a.step === "pair" && b.step !== "pair";
}

/** Needleman–Wunsch alignment of typed words to target words, then accuracy with extra words costing half (§6.4). */
export function align(targets: readonly string[], typed: readonly string[], vocabulary: ReadonlySet<string>, hinted: ReadonlySet<number> = new Set()): Result {
  const compared = typed.map(equivalent);
  const verdict = (i: number, j: number) => judge(targets[i], compared[j], vocabulary);
  const table: Cell[][] = Array.from({ length: targets.length + 1 }, (_, i) =>
    Array.from({ length: typed.length + 1 }, (_, j): Cell => ({ cost: i + j, credit: 0, step: i === 0 ? "extra" : "missing" })));
  for (let i = 1; i <= targets.length; i++) {
    for (let j = 1; j <= typed.length; j++) {
      const v = verdict(i - 1, j - 1);
      const credit = hinted.has(i - 1) ? 0 : CREDIT[v];
      let best: Cell = { cost: table[i - 1][j - 1].cost + PAIR_COST[v], credit: table[i - 1][j - 1].credit + credit, step: "pair" };
      for (const other of [{ ...table[i - 1][j], cost: table[i - 1][j].cost + 1, step: "missing" as const }, { ...table[i][j - 1], cost: table[i][j - 1].cost + 1, step: "extra" as const }]) {
        if (better(other, best)) best = other;
      }
      table[i][j] = best;
    }
  }
  const marks: Mark[] = targets.map(() => ({ verdict: "missing", credit: 0 }));
  const extras: string[] = [];
  for (let i = targets.length, j = typed.length; i > 0 || j > 0;) {
    const step = i === 0 ? "extra" : j === 0 ? "missing" : table[i][j].step;
    if (step === "pair") {
      const v = verdict(i - 1, j - 1);
      const typedWord = { typed: typed[j - 1], at: j - 1 };
      marks[i - 1] = hinted.has(i - 1) ? { verdict: "wrong", credit: 0, ...typedWord } : { verdict: v, credit: CREDIT[v], ...typedWord };
      i--; j--;
    } else if (step === "missing") i--;
    else extras.unshift(typed[--j]);
  }
  const credit = marks.reduce((sum, mark) => sum + mark.credit, 0);
  const accuracy = targets.length ? Math.min(100, Math.max(0, (100 * credit) / (targets.length + extras.length * 0.5))) : 0;
  const perfect = targets.length > 0 && extras.length === 0 && hinted.size === 0 && marks.every((mark) => mark.verdict === "exact");
  return { marks, extras, accuracy, perfect, typed: [...typed] };
}

const BOOK_NAME = (name: string) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
  return /s$/i.test(name) ? `${escaped}?` : escaped; // "Psalm 23:1" names Psalms too
};

/** The passage's own reference written at the start or end of the answer: "Proverbs 3:5", "John 3 16", "Psalm 23:1".
 * Parsed before punctuation is stripped; another passage's reference, or a bare number, is never removed (§6.4). */
export function stripReference(input: string, reference: { book: string; chapter: number; verse: number; last: number }): string {
  const range = `(?:\\s*[-–—]\\s*${reference.last})?`;
  const ref = `${BOOK_NAME(reference.book)}\\.?\\s*${reference.chapter}\\s*[:.\\s]\\s*${reference.verse}${reference.last > reference.verse ? range : ""}`;
  return input
    .replace(new RegExp(`^\\s*${ref}(?![\\d])[\\s,.;:–—-]*`, "i"), "")
    .replace(new RegExp(`[\\s,.;:–—(-]+${ref}\\)?[\\s.!]*$`, "i"), "");
}

export interface AnswerContext {
  hidden: readonly Word[];
  opening: readonly Word[];
  reference: { book: string; chapter: number; verse: number; last: number };
  vocabulary: ReadonlySet<string>;
  hinted?: ReadonlySet<number>;
}

/** A whole typed answer: reference removed, then the answer with and without a retyped opening; the better wins. */
export function matchAnswer(input: string, context: AnswerContext): Result {
  const targets = context.hidden.map((word) => equivalent(word.key));
  const typed = typedTokens(stripReference(input.slice(0, MAX_CHARS), context.reference));
  const plain = align(targets, typed, context.vocabulary, context.hinted);
  const opening = context.opening.map((word) => equivalent(word.key));
  if (opening.length > 0 && opening.every((word, i) => typed[i] !== undefined && equivalent(typed[i]) === word)) {
    const stripped = align(targets, typed.slice(opening.length), context.vocabulary, context.hinted);
    if (stripped.accuracy > plain.accuracy) return stripped;
  }
  return plain;
}

/** "Show next word" (§5.2): the answer with the earliest word still short of full credit put in its place, and that
 * word's index, which then always scores zero. Null when every word already has full credit. */
export function withNextWord(input: string, context: AnswerContext): { answer: string; index: number } | null {
  const result = matchAnswer(input, context);
  const index = result.marks.findIndex((mark, i) => mark.credit < 1 && !context.hinted?.has(i));
  if (index < 0) return null;
  const word = context.hidden[index].text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}’']+$/gu, "").replace(/[—–-]+$/, "");
  const typed = [...result.typed];
  const at = result.marks[index].at;
  if (at !== undefined) typed[at] = word;
  else {
    const before = result.marks.slice(0, index).reverse().find((mark) => mark.at !== undefined)?.at;
    typed.splice(before === undefined ? 0 : before + 1, 0, word);
  }
  return { answer: typed.join(" "), index };
}
