// The test page's engine, shared by all four looks: which questions a test can draw from, how each one is answered
// (choose an option, true or false, or think of the answer and mark yourself), and the run of one test.
import { useState } from "react";
import { rightChoice, type BankQuestion } from "@/lib/data";

/** A tagged passage (scripts/question_model_tags.py); "matched" means the answer's words are within two verses. */
export interface TaggedPassage { book: string; chapter: number; verse: number | null; verse_end: number | null; check: string }
export type TestQuestion = BankQuestion & { passages?: TaggedPassage[] };

export type Format = "choice" | "truefalse" | "open";
export interface Item { q: TestQuestion; format: Format; prompt: string; choices: string[] | null }
/** `given` is the option chosen; null when the question was open and you marked yourself. */
export interface Result { right: boolean; given: string | null }

export const LENGTHS = [10, 25, 50] as const;
export const DEFAULT_LENGTH = 10;

const TRUE_FALSE = /^\s*true\s+or\s+false\s*[:?.-]?\s*/i;

export function itemOf(q: TestQuestion): Item {
  if (q.options?.length) return { q, format: "choice", prompt: q.question, choices: q.options };
  if (q.answer === "True" || q.answer === "False") return { q, format: "truefalse", prompt: q.question.replace(TRUE_FALSE, ""), choices: ["True", "False"] };
  return { q, format: "open", prompt: q.question, choices: null };
}

/** `count` questions drawn at random from `rows` (indexes into `questions`), in random order. */
export function drawTest(questions: TestQuestion[], rows: number[], count: number): Item[] {
  const picked = [...rows];
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked.slice(0, count).map((row) => itemOf(questions[row]));
}

/** The verse a question points to: its own reference first, then the first tagged passage whose words match. */
export interface VerseRef { book: string; chapter: number; verse: number | null; verseEnd: number | null }
export function verseOf(q: TestQuestion): VerseRef | null {
  if (q.link) return { book: q.link.book, chapter: q.link.chapter, verse: q.link.verse, verseEnd: null };
  const passage = q.passages?.find((p) => p.check === "matched");
  return passage ? { book: passage.book, chapter: passage.chapter, verse: passage.verse, verseEnd: passage.verse_end } : null;
}

export interface Run {
  items: Item[];
  index: number;
  item: Item;
  results: (Result | undefined)[];
  /** The current question's result, once it is answered. */
  answered: Result | undefined;
  /** For an open question: the answer is showing and waits for you to mark yourself. */
  revealed: boolean;
  choose: (option: string) => void;
  reveal: () => void;
  mark: (right: boolean) => void;
  next: () => void;
}

export function useRun(items: Item[], onFinish: (results: Result[]) => void): Run {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(Result | undefined)[]>(() => items.map(() => undefined));
  const [revealed, setRevealed] = useState(false);
  const item = items[Math.min(index, items.length - 1)];
  const answered = results[index];
  const record = (result: Result) => {
    if (answered) return;
    setResults((all) => all.map((r, i) => (i === index ? result : r)));
  };
  return {
    items, index, item, results, answered, revealed,
    choose: (option) => record({ right: option === rightChoice(item.q), given: option }),
    reveal: () => setRevealed(true),
    mark: (right) => record({ right, given: null }),
    next: () => {
      if (!answered) return;
      setRevealed(false);
      if (index + 1 >= items.length) onFinish(results.map((r) => r ?? { right: false, given: null }));
      else setIndex(index + 1);
    },
  };
}

export const scoreOf = (results: (Result | undefined)[]) => results.filter((r) => r?.right).length;
