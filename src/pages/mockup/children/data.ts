// The children's lessons, built from the question bank as it stands: Hurlbut's 88 Bible lessons for boys and girls
// (1903) in their own order, from the garden to Paul at Rome, and A Catechism for Young Children in sets of eight as
// the "What we believe" track. Each lesson is a fixed set of questions (owner, 2026-10-23: predetermined tests). Parts
// group the lessons by where they are in the Bible, each with one of the site's line drawings and a book-map colour.
import type { CSSProperties } from "react";
import type { QuestionBank } from "@/lib/data";
import type { Scene } from "../quiz-data";
import type { TestQuestion } from "../questions/test/engine";
import type { Progress } from "./progress";

export interface Part { id: string; title: string; line: string; tone: string; scene: Scene; track: "stories" | "belief" }
/** The chapters to read before the questions: `from` to `to` of one book. */
export interface Passage { book: string; from: number; to: number }
export interface Lesson { id: string; n: number; title: string; part: Part; questions: TestQuestion[]; passage: Passage | null }
export interface PartLessons { part: Part; lessons: Lesson[] }

export const PARTS: Part[] = [
  { id: "beginnings", title: "Beginnings", line: "The garden, Abraham, Jacob and Joseph", tone: "history", scene: "tents", track: "stories" },
  { id: "egypt", title: "Out of Egypt", line: "Moses, the sea and the long walk home", tone: "history", scene: "whirlwind", track: "stories" },
  { id: "kings", title: "Judges and kings", line: "Gideon, Samuel, David and Solomon", tone: "history", scene: "crown", track: "stories" },
  { id: "prophets", title: "Prophets and exile", line: "Elijah, Daniel and the way back", tone: "prophets", scene: "scroll", track: "stories" },
  { id: "jesus", title: "Jesus", line: "His birth, his miracles and his stories", tone: "gospels", scene: "loaves", track: "stories" },
  { id: "cross", title: "The cross and the empty tomb", line: "The last supper to the risen Lord", tone: "gospels", scene: "tomb", track: "stories" },
  { id: "church", title: "The church", line: "Pentecost, Peter and Paul", tone: "acts", scene: "letters", track: "stories" },
  { id: "belief", title: "What we believe", line: "First questions about God, from A Catechism for Young Children", tone: "epistles", scene: "lamp", track: "belief" },
];
const partById = (id: string) => PARTS.find((p) => p.id === id)!;

const HURLBUT = "Hurlbut's Bible Lessons for Boys and Girls (1903)";
const CATECHISM = "A Catechism for Young Children";
const CATECHISM_SET = 8;
const EGYPT = new Set(["EXO", "LEV", "NUM", "DEU", "JOS"]);
const KINGS = new Set(["JDG", "RUT", "1SA", "2SA", "1KI", "1CH", "2CH"]);
const GOSPELS = new Set(["MAT", "MRK", "LUK", "JHN"]);
const CROSS = /supper|garden|trial|cross|crucif|died|death of jesus|risen|rose|tomb|easter|resurrection/i;

/** The book most of a lesson's questions point to. */
function mainBook(questions: TestQuestion[]): string | null {
  const counts = new Map<string, number>();
  for (const q of questions) if (q.link) counts.set(q.link.book, (counts.get(q.link.book) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function partOf(title: string, book: string | null, testament: "OT" | "NT"): Part {
  if (testament === "OT") {
    if (book === "GEN") return partById("beginnings");
    if (book && EGYPT.has(book)) return partById("egypt");
    if (book && KINGS.has(book)) return partById("kings");
    return partById("prophets");
  }
  if (book && GOSPELS.has(book)) return partById(CROSS.test(title) ? "cross" : "jesus");
  return partById("church");
}

/** The passage to read first: the lesson's main book, from its first to its last chapter asked about. */
function passageOf(questions: TestQuestion[], book: string | null): Passage | null {
  const chapters = questions.filter((q) => q.link?.book === book).map((q) => q.link!.chapter);
  if (!book || !chapters.length) return null;
  return { book, from: Math.min(...chapters), to: Math.max(...chapters) };
}

/** The question in its children's wording, where it has one (scripts/question_children_wording.py). */
const forChildren = (q: TestQuestion): TestQuestion => (q.child
  ? { ...q, question: q.child.question, answer: q.child.answer, answer_choice: q.child.answer, options: q.child.options, lead_in: null }
  : q);

export function buildLessons(bank: QuestionBank): Lesson[] {
  const questions = (bank.questions as TestQuestion[]).map(forChildren);
  const byLesson = new Map<string, TestQuestion[]>();
  for (const q of questions) if (q.collection === HURLBUT && q.lesson) byLesson.set(q.lesson, [...(byLesson.get(q.lesson) ?? []), q]);
  let testament: "OT" | "NT" = "OT";
  const stories = [...byLesson].map(([name, qs], index): Lesson => {
    const title = name.replace(/^Lesson\s+[IVXLC]+\.?\s*/i, "").replace(/\.$/, "");
    const book = mainBook(qs);
    if (book && GOSPELS.has(book)) testament = "NT";
    return { id: `hurlbut-${index + 1}`, n: index + 1, title, part: partOf(title, book, testament), questions: qs, passage: passageOf(qs, book) };
  });
  const catechism = questions.filter((q) => q.collection === CATECHISM);
  // Sets of about eight, the remainder spread over them, so none is left with one or two questions.
  const sets = Math.max(1, Math.floor(catechism.length / CATECHISM_SET));
  const belief = Array.from({ length: sets }, (_, i): Lesson => {
    const qs = catechism.slice(Math.round((i * catechism.length) / sets), Math.round(((i + 1) * catechism.length) / sets));
    return { id: `catechism-${i + 1}`, n: i + 1, title: qs[0].question, part: partById("belief"), questions: qs, passage: null };
  });
  return [...stories, ...belief];
}

/** The lessons of each part, in the parts' order, leaving out a part with none. */
export function byPart(lessons: Lesson[], track?: Part["track"]): PartLessons[] {
  return PARTS.filter((p) => !track || p.track === track)
    .map((part) => ({ part, lessons: lessons.filter((l) => l.part.id === part.id) }))
    .filter((g) => g.lessons.length);
}

/** "Genesis 1–3" for a lesson's passage. */
export function passageLabel({ book, from, to }: Passage, bookNames: Record<string, string>): string {
  return `${bookNames[book] ?? book} ${from}${to !== from ? `–${to}` : ""}`;
}

export const readerUrl = (book: string, chapter: number, verse?: number | null) => `/read/bsb/${book}/${chapter}${verse ? `?v=${verse}` : ""}`;

/** The part's colour from the book map, for a lesson, a tile or a part. */
export const toneStyle = (tone: string) => ({ "--tone": `var(--${tone})` }) as CSSProperties;

/** The first lesson not yet done, in course order; the first lesson once all are done. */
export const nextLesson = (lessons: Lesson[], progress: Progress) => lessons.find((l) => !progress[l.id]) ?? lessons[0];
