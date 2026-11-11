// The Testimony builder's counted sentences (design §6 and §9), each one whole, the number placed by plural(): never a
// sentence pieced together from parts, which the build's language check refuses.
import { plural } from "@/lib/site-format";
import { COUNTER_FROM, QUESTION_COUNT, type Question } from "./questions";

if (QUESTION_COUNT !== 18) throw new Error(`Testimony builder: the progress sentences say 18 questions but there are ${QUESTION_COUNT}`);

/** "7 of 18 answered" (the same form for one and many). */
export const progressLine = (answered: number): string => plural(answered, "{n} of 18 answered", "{n} of 18 answered");

/** "Question 7 of 18", the open question's place. */
export const placeLine = (index: number): string => plural(index + 1, "Question {n} of 18", "Question {n} of 18");

/** "{n} characters left", shown once a long answer passes COUNTER_FROM, or a line comes within 40 of its limit. */
export function counterLine(value: string, question: Question): string | null {
  const from = question.kind === "long" ? COUNTER_FROM : question.limit - 40;
  if (value.length < from) return null;
  return plural(question.limit - value.length, "{n} character left", "{n} characters left");
}
