// The data behind "The whole Bible": every chapter in canon order with who took it as a main text, every titled work
// filed by chapter, and the chips (Everyone, Without Spurgeon, then each teacher with Bible texts).
import type { Book, PassageWork, PeopleData, Person } from "@/data/teachers/pages-types";
import { familyOf } from "../../shared/people";

export const SPURGEON = "author-charles-spurgeon";
export const SECTION_LABEL: Record<string, string> = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };
export const GENRE_WORD: Record<string, string> = { sermon: "sermon", commentary: "commentary", treatise: "treatise", lecture: "lecture" };
/** How many titles a chapter shows before "Show all". */
export const SHOWN_TITLES = 6;

export interface Cell { i: number; b: number; c: number; key: string; verses: number; counts: Record<string, number>; total: number; voices: number }
export interface TitledWork { person: Person; work: PassageWork }
export interface ChipView { id: string; label: string; chapters: number; tone: string; person?: Person }
export interface BibleModel {
  books: Book[];
  cells: Cell[];
  titles: Map<string, TitledWork[]>;
  /** person id → (url → how many of their works point at it): more than one means the link opens a whole volume. */
  sharedUrl: Map<string, Map<string, number>>;
  people: Map<string, Person>;
  teacherCount: number;
  totalWorks: number;
  spurgeonWorks: number;
  views: ChipView[];
}

const keyOfVerse = (v: number) => `${Math.floor(v / 1e6)}:${Math.floor(v / 1e3) % 1000}`;

function buildCells(data: PeopleData): Cell[] {
  const cells: Cell[] = [];
  data.books.forEach((book, b) => book.chapters.forEach((verses, c) => {
    const key = `${b + 1}:${c + 1}`;
    const counts = data.chapters[key] ?? {};
    const total = Object.values(counts).reduce((n, v) => n + v, 0);
    cells.push({ i: cells.length, b, c: c + 1, key, verses, counts, total, voices: Object.keys(counts).length });
  }));
  return cells;
}

function fileTitles(people: Person[]) {
  const titles = new Map<string, TitledWork[]>();
  const sharedUrl = new Map<string, Map<string, number>>();
  for (const person of people) {
    const urls = new Map<string, number>();
    for (const work of person.passages) if (work.u) urls.set(work.u, (urls.get(work.u) ?? 0) + 1);
    sharedUrl.set(person.id, urls);
    for (const work of person.passages) {
      const key = keyOfVerse(work.v);
      const list = titles.get(key) ?? [];
      list.push({ person, work });
      titles.set(key, list);
    }
  }
  for (const list of titles.values()) list.sort((a, b) => a.work.v - b.work.v || a.person.born - b.person.born);
  return { titles, sharedUrl };
}

/** How many works by the chip's teacher(s) take this chapter as their main text. */
export function valueOf(cell: Cell, view: string): number {
  if (view === "all") return cell.total;
  if (view === "others") return cell.total - (cell.counts[SPURGEON] ?? 0);
  return cell.counts[view] ?? 0;
}

/** Whether a person's works count under the chosen chip. */
export const relevant = (view: string, personId: string) => view === "all" || (view === "others" ? personId !== SPURGEON : personId === view);

export function buildBibleModel(data: PeopleData): BibleModel {
  const cells = buildCells(data);
  const { titles, sharedUrl } = fileTitles(data.people);
  const teachers = data.people
    .map((person) => ({ person, chapters: cells.filter((cell) => cell.counts[person.id]).length }))
    .filter((t) => t.chapters)
    .sort((a, b) => b.chapters - a.chapters);
  const views: ChipView[] = [
    { id: "all", label: "Everyone", chapters: cells.filter((c) => c.total).length, tone: "--accent" },
    { id: "others", label: "Without Spurgeon", chapters: cells.filter((c) => valueOf(c, "others")).length, tone: "--muted" },
    ...teachers.map((t) => ({ id: t.person.id, label: t.person.short, chapters: t.chapters, tone: familyOf(t.person).tone, person: t.person })),
  ];
  return {
    books: data.books,
    cells,
    titles,
    sharedUrl,
    people: new Map(data.people.map((p) => [p.id, p])),
    teacherCount: teachers.length,
    totalWorks: cells.reduce((n, cell) => n + cell.total, 0),
    spurgeonWorks: cells.reduce((n, cell) => n + (cell.counts[SPURGEON] ?? 0), 0),
    views,
  };
}

/** Brightness of every square for a chip, 0 (no work) or 0.42–1 on a log scale. */
export function targetsFor(cells: Cell[], view: string): Float32Array {
  let max = 0;
  for (const cell of cells) max = Math.max(max, valueOf(cell, view));
  const scale = Math.log(1 + max);
  const out = new Float32Array(cells.length);
  cells.forEach((cell, i) => {
    const v = valueOf(cell, view);
    out[i] = v ? 0.42 + 0.58 * (Math.log(1 + v) / scale) : 0;
  });
  return out;
}

export const chapterName = (books: Book[], cell: Cell) => `${books[cell.b].name === "Psalms" ? "Psalm" : books[cell.b].name} ${cell.c}`;
export const readHref = (books: Book[], cell: Cell) => `/read/kjv/${books[cell.b].code}/${cell.c}`;
