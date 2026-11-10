// Bible Jeopardy: a small question bank for the tests (design 13). Each question names one person, so it falls in that
// person's theme on the test page (Moses in "Moses", Ruth in "Ruth and Naomi"…). Used only by the *.test.ts(x) files.
import type { BankBook, QuestionBank } from "@/lib/data";
import type { QuizQuestion } from "@/lib/live-quiz/protocol";
import type { TestQuestion } from "../../questions/test/engine";
import { DEFAULT_SETTINGS, VALUES, type Board, type BoardSettings, type Level, type Settings } from "./model";

export interface Spec { person: string; book: string; testament: "OT" | "NT"; easy?: number; medium?: number; hard?: number; extra?: Partial<TestQuestion> }

export const PEOPLE: Spec[] = [
  { person: "Abraham", book: "GEN", testament: "OT" },
  { person: "Moses", book: "EXO", testament: "OT" },
  { person: "David", book: "1SA", testament: "OT" },
  { person: "Elijah", book: "1KI", testament: "OT" },
  { person: "Ruth", book: "RUT", testament: "OT" },
  { person: "Peter", book: "MAT", testament: "NT" },
  { person: "Noah", book: "GEN", testament: "OT" },
  { person: "Paul", book: "ACT", testament: "NT" },
];

export const BOOKS: BankBook[] = [
  { code: "GEN", name: "Genesis", short: "Gen", section: "law", testament: "OT" },
  { code: "EXO", name: "Exodus", short: "Exod", section: "law", testament: "OT" },
  { code: "RUT", name: "Ruth", short: "Ruth", section: "history", testament: "OT" },
  { code: "1SA", name: "1 Samuel", short: "1 Sam", section: "history", testament: "OT" },
  { code: "1KI", name: "1 Kings", short: "1 Kgs", section: "history", testament: "OT" },
  { code: "MAT", name: "Matthew", short: "Matt", section: "gospels", testament: "NT" },
  { code: "ACT", name: "Acts", short: "Acts", section: "acts", testament: "NT" },
];

let serial = 0;
export function question(person: string, level: Level, book: string, testament: "OT" | "NT", extra: Partial<TestQuestion> = {}): TestQuestion {
  serial++;
  const answer = `${person} answer ${serial}`;
  return {
    question: `Fixture clue ${serial} about ${person} (${level})?`, answer, options: [answer, `Wrong A ${serial}`, `Wrong B ${serial}`, `Wrong C ${serial}`],
    reference: `${book} 1:${(serial % 20) + 1}`, kind: "trivia", tradition: null, collection: "fixture", lesson: null, books: [book], testament,
    topic: null, link: { book, chapter: 1, verse: (serial % 20) + 1 }, standalone: true, people: [person], places: [], level, children: true, child: null,
    ...extra,
  };
}

/** Questions for each spec: four of each level unless the spec says otherwise. */
export function questionsFor(specs: readonly Spec[] = PEOPLE): TestQuestion[] {
  return specs.flatMap((spec) => (["easy", "medium", "hard"] as const).flatMap((level) =>
    Array.from({ length: spec[level] ?? 4 }, () => question(spec.person, level, spec.book, spec.testament, spec.extra))));
}

export function fixtureBank(specs: readonly Spec[] = PEOPLE): QuestionBank {
  return { kinds: { trivia: "Bible quiz" }, topics: [], books: BOOKS, collections: [], questions: questionsFor(specs) };
}

export const boardSettings = (over: Partial<BoardSettings> = {}): BoardSettings => {
  const { columns, difficulty, choices, children, catechism, testament, dailyDouble, final } = DEFAULT_SETTINGS;
  return { columns, difficulty, choices, children, catechism, testament, dailyDouble, final, ...over };
};

export const settings = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...over });

/** A hand-made QuizQuestion, for boards built without a bank. */
export function quiz(id: string): QuizQuestion {
  return { id, text: `Clue ${id}?`, leadIn: null, options: [`Right ${id}`, "B", "C", "D"], correct: 0, reference: "Genesis 1:1", link: { book: "GEN", chapter: 1, verse: 1 } };
}

const hex = (n: number) => n.toString(16).padStart(16, "0");

/** A board of `columns` columns with ids 0000…0001 upward, the Daily Double where asked, and a Final. */
export function handBoard(columns = 3, dailyDouble: { col: number; row: number } | null = { col: 1, row: 3 }, final = true): Board {
  let n = 0;
  return {
    settings: boardSettings({ columns, dailyDouble: dailyDouble !== null, final }),
    columns: Array.from({ length: columns }, (_, c) => ({
      category: `theme:t${c}`, title: `Category ${c}`, line: `Line ${c}`,
      tiles: VALUES.map((value) => ({ q: quiz(hex(++n)), level: "easy" as const, value })),
    })),
    dailyDouble, notices: [],
    final: final ? { category: "theme:final", title: "Final category", line: "Final line", q: quiz(hex(999)), level: "hard" } : null,
  };
}
