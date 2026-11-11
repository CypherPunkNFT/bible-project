// Checking a guess (design §3): the tile colours by Wordle's two-pass rule, the keyboard's best colour per letter,
// hard mode's rule and the refusals that never use up a try.

export const WORD_LENGTH = 5;
export const MAX_TRIES = 6;

/** correct: right letter, right spot. present: in the word, elsewhere. absent: not in the word (or no copy left). */
export type Mark = "correct" | "present" | "absent";

/** The colours of one guess (both five lower-case letters): greens first, then yellows left to right while copies last. */
export function evaluate(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array.from({ length: WORD_LENGTH }, () => "absent");
  const left = new Map<string, number>();
  for (const letter of answer) left.set(letter, (left.get(letter) ?? 0) + 1);
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) { marks[i] = "correct"; left.set(guess[i], left.get(guess[i])! - 1); }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    const count = left.get(guess[i]) ?? 0;
    if (marks[i] !== "correct" && count > 0) { marks[i] = "present"; left.set(guess[i], count - 1); }
  }
  return marks;
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

/** Each guessed letter's best colour so far: green beats yellow, yellow beats grey. */
export function keyMarks(guesses: readonly string[], answer: string): Map<string, Mark> {
  const best = new Map<string, Mark>();
  for (const guess of guesses) {
    evaluate(guess, answer).forEach((mark, i) => {
      const old = best.get(guess[i]);
      if (!old || RANK[mark] > RANK[old]) best.set(guess[i], mark);
    });
  }
  return best;
}

/** Why a guess breaks hard mode: a green letter moved, or a revealed letter left out. Positions count from 1. */
export type HardProblem = { kind: "position"; position: number; letter: string } | { kind: "include"; letter: string };

/**
 * Hard mode (§3.3): every green letter stays in its place, and each letter appears at least as many times as it was
 * green or yellow within any single earlier guess. Grey tiles never restrict a guess.
 */
export function hardModeProblem(guess: string, previous: readonly string[], answer: string): HardProblem | null {
  const needed = new Map<string, number>();
  for (const earlier of previous) {
    const marks = evaluate(earlier, answer);
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (marks[i] === "correct" && guess[i] !== earlier[i]) return { kind: "position", position: i + 1, letter: earlier[i] };
    }
    const shown = new Map<string, number>();
    marks.forEach((mark, i) => { if (mark !== "absent") shown.set(earlier[i], (shown.get(earlier[i]) ?? 0) + 1); });
    for (const [letter, count] of shown) needed.set(letter, Math.max(needed.get(letter) ?? 0, count));
  }
  for (const [letter, count] of needed) {
    if ([...guess].filter((l) => l === letter).length < count) return { kind: "include", letter };
  }
  return null;
}

export type Refusal = { kind: "short" } | { kind: "unknown" } | { kind: "repeat" } | HardProblem;

/** The reason a typed row is refused before it is checked (§3.1), or null when it may be played. */
export function refusalFor(typed: string, guesses: readonly string[], answer: string, allowed: ReadonlySet<string>, hard: boolean): Refusal | null {
  if (typed.length < WORD_LENGTH) return { kind: "short" };
  if (!allowed.has(typed)) return { kind: "unknown" };
  if (guesses.includes(typed)) return { kind: "repeat" };
  return hard ? hardModeProblem(typed, guesses, answer) : null;
}

/** The allowed-guess list from guesses.json's single string of five-letter words. */
export function guessSet(words: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i + WORD_LENGTH <= words.length; i += WORD_LENGTH) set.add(words.slice(i, i + WORD_LENGTH));
  return set;
}

export type Outcome = "playing" | "won" | "lost";

export function outcomeOf(guesses: readonly string[], answer: string): Outcome {
  if (guesses.includes(answer)) return "won";
  return guesses.length >= MAX_TRIES ? "lost" : "playing";
}
