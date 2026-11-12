// /games/quiz, the pure rules the page builds on (REDESIGN-BRIEF section 4: the questions, the verdicts and the
// scoring are the homepage quiz's, read from src/pages/quiz-data.ts and never changed here). This file adds only what
// the games page shows on top: the order the questions were answered in (for the streak), the twelve marks of the
// trail and the share grid, the rank titles and the share text.
import { QUESTIONS, VERDICTS } from "@/pages/quiz-data";
import type { Rank, TrailMark } from "../kit";

export const TOTAL = QUESTIONS.length;
export const NONE = -1;
export const VERDICT = -1;

/** The answer picked for each question, by the question's index; null while unanswered. */
export type Picked = (number | null)[];
export type Outcome = "right" | "wrong";

export const freshPicked = (): Picked => QUESTIONS.map(() => null);

export const outcomeOf = (picked: Picked, i: number): Outcome | undefined =>
  picked[i] === null ? undefined : picked[i] === QUESTIONS[i].answer ? "right" : "wrong";

export const rightCount = (picked: Picked): number => picked.filter((choice, i) => choice === QUESTIONS[i].answer).length;
export const answeredCount = (picked: Picked): number => picked.filter((choice) => choice !== null).length;

/** The verdict line the score earns: the homepage quiz's own table, unchanged. */
export const verdictFor = (right: number) => VERDICTS.find((item) => right >= item.least) ?? VERDICTS[VERDICTS.length - 1];

/** The titles the games page adds above the verdict (the audit's item 4), by share of twelve. */
export const RANKS: readonly Rank[] = [
  { from: 0, title: "Reader" },
  { from: 4 / 12, title: "Student" },
  { from: 8 / 12, title: "Scribe" },
  { from: 11 / 12, title: "Teacher of the Law" },
  { from: 1, title: "Berean" },
];

/** The trail's twelve marks in question order: the open one is "current" while the round is going. */
export function marksFor(picked: Picked, current: number): TrailMark[] {
  return picked.map((_, i) => outcomeOf(picked, i) ?? (i === current ? "current" : "empty"));
}

/** The run of right answers ending at the newest one, in the order the questions were answered (the audit's item 2). */
export function streakOf(picked: Picked, order: readonly number[]): number {
  let run = 0;
  for (let k = order.length - 1; k >= 0; k--) {
    if (outcomeOf(picked, order[k]) !== "right") break;
    run++;
  }
  return run;
}

/** The longest run of right answers anywhere in the order. */
export function bestStreakOf(picked: Picked, order: readonly number[]): number {
  let best = 0, run = 0;
  for (const i of order) {
    run = outcomeOf(picked, i) === "right" ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/** The question to open after the current one: the next unanswered after it, else the first unanswered, else the verdict. */
export function nextAfter(picked: Picked, current: number): number {
  if (answeredCount(picked) === TOTAL) return VERDICT;
  const later = picked.findIndex((value, i) => value === null && i > current);
  return later >= 0 ? later : picked.findIndex((value) => value === null);
}

/** The share squares: gold for right, red for missed, the game's own colours (the audit's item 4). */
export const SQUARES = { right: "🟨", wrong: "🟥" } as const;

/** The share text: the title, the score, the twelve squares in question order, the address. */
export function shareTextFor(picked: Picked): string {
  const squares = picked.map((_, i) => (outcomeOf(picked, i) === "right" ? SQUARES.right : SQUARES.wrong)).join("");
  return `How well do you know the Bible? ${rightCount(picked)}/${TOTAL}\n${squares}\nbibleguide.io/games/quiz`;
}
