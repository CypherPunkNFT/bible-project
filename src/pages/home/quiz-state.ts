// Homepage (live; first tried on quiz_mockup): the state the four versions of the quiz share: the answer picked for each of the twelve
// questions, which question is open (VERDICT once all are answered and the reader asks how they did), and the score.
import { useState } from "react";
import { QUESTIONS, VERDICTS } from "../quiz-data";

export type Picked = (number | null)[];
export type Answer = "right" | "wrong" | undefined;
export const VERDICT = -1;
export const LETTERS = ["A", "B", "C", "D"];
export const pad = (n: number) => String(n).padStart(2, "0");
export const chapterOf = (ref: string) => ref.replace(/:\d+$/, "");

export function useQuiz() {
  const [picked, setPicked] = useState<Picked>(() => QUESTIONS.map(() => null));
  const [current, setCurrent] = useState(0);
  const answered = picked.filter((choice) => choice !== null).length;
  const right = picked.filter((choice, i) => choice === QUESTIONS[i].answer).length;
  const finished = answered === QUESTIONS.length;
  const later = picked.findIndex((value, i) => value === null && i > current);
  const nextOpen = later >= 0 ? later : picked.findIndex((value) => value === null);
  const question = current === VERDICT ? null : QUESTIONS[current];
  const choice = current === VERDICT ? null : picked[current];
  return {
    current, answered, right, finished, question, choice,
    verdict: VERDICTS.find((item) => right >= item.least)!,
    stateOf: (i: number): Answer => (picked[i] === null ? undefined : picked[i] === QUESTIONS[i].answer ? "right" : "wrong"),
    optionState: (j: number) => (choice === null || !question ? undefined : j === question.answer ? "right" : j === choice ? "wrong" : "other"),
    choose: (j: number) => setPicked((now) => now.map((value, i) => (i === current ? j : value))),
    next: () => setCurrent(finished ? VERDICT : nextOpen),
    open: setCurrent,
    restart: () => { setPicked(QUESTIONS.map(() => null)); setCurrent(0); },
  };
}

export type Quiz = ReturnType<typeof useQuiz>;
