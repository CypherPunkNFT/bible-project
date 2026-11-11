// Building a reading plan (docs/features/reading-planner/design.md, section 3). Pure functions, no React: the chosen
// chapters, the reading dates and the split of whole chapters into days. Dates are whole day numbers (countdowns'
// calendar.ts), so daylight saving, month ends and 29 February cannot move a day.
import { dayNumber, fromDayNumber, LAST_YEAR, parseDateKey, weekday } from "@/pages/countdowns/calendar";

/** About one page of a printed Bible (design 2): an estimate, said so on the page. */
export const WORDS_PER_PAGE = 500;
/** Reading speeds offered, in words a minute; 200 is the default (design 2). */
export const SPEEDS = [150, 200, 250, 300] as const;
export type Speed = typeof SPEEDS[number];
export const DEFAULT_SPEED: Speed = 200;
/** The longest plan, in calendar days from start to finish: ten years. */
export const MAX_SPAN_DAYS = 3660;
export const MAX_PACE = 999;
/** The last day a plan may reach (the calendar module's range). */
const LAST_DAY = dayNumber({ year: LAST_YEAR, month: 12, day: 31 });

export type Mode = "finish" | "pace";
export type PaceUnit = "chapters" | "minutes" | "pages";
export const PACE_UNITS: readonly PaceUnit[] = ["chapters", "minutes", "pages"];

export interface PlanSettings {
  /** Book codes; the plan reads them in Bible order whatever order they were ticked in. */
  books: string[];
  mode: Mode;
  /** "YYYY-MM-DD". */
  start: string;
  /** "YYYY-MM-DD"; used when mode is "finish". */
  finish: string;
  /** A whole number from 1 to 999; used when mode is "pace". */
  pace: number;
  unit: PaceUnit;
  /** Weekdays read on, 0 for Sunday to 6 for Saturday. */
  weekdays: number[];
  speed: Speed;
}

/** Words in each chapter, by book code, in Bible order (src/data/reading-planner/chapter-words.json). */
export type ChapterWords = Readonly<Record<string, readonly number[]>>;

export interface Chapter { book: string; chapter: number; words: number; /** Its place among all 1,189 chapters. */ index: number }

export interface PlanDay {
  /** 1 for the first reading day. */
  n: number;
  /** Its date as a day number. */
  date: number;
  /** The day's chapters: positions in Plan.chapters, first to last inclusive. */
  first: number;
  last: number;
  words: number;
}

export interface Plan { chapters: Chapter[]; days: PlanDay[]; totalWords: number }

export type PlanError =
  | "no-books" | "bad-start" | "bad-finish" | "finish-before-start" | "no-weekdays" | "no-days-in-span" | "bad-pace" | "too-long";

export type PlanResult = { ok: true; plan: Plan } | { ok: false; error: PlanError };

/** The chosen books' chapters in Bible order, each with its words. Unknown codes are ignored. */
export function chosenChapters(books: readonly string[], words: ChapterWords): Chapter[] {
  const chosen = new Set(books);
  const chapters: Chapter[] = [];
  let index = 0;
  for (const [book, counts] of Object.entries(words)) {
    counts.forEach((count, i) => {
      if (chosen.has(book)) chapters.push({ book, chapter: i + 1, words: count, index });
      index++;
    });
  }
  return chapters;
}

/** How many reading days a pace needs (design 3, step 2), before the cap at one chapter a day. */
export function daysForPace(chapters: readonly Chapter[], pace: number, unit: PaceUnit, speed: number): number {
  const total = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
  if (unit === "chapters") return Math.ceil(chapters.length / pace);
  return Math.max(1, Math.ceil(total / (pace * (unit === "minutes" ? speed : WORDS_PER_PAGE))));
}

/** Each chapter's day (0-based), in order: exactly `days` days, none empty, every day a run of whole chapters, the
 *  reading balanced by words (design 3, step 3). `days` must be from 1 to chapters.length. Integer arithmetic only, so a
 *  chapter sitting exactly on a boundary always falls the same way. */
export function balancedSplit(weights: readonly number[], days: number): number[] {
  const n = weights.length;
  const total = weights.reduce((sum, w) => sum + w, 0);
  const weightOf = total > 0 ? (i: number) => weights[i] : () => 1;
  const sum = total > 0 ? total : n;
  const result: number[] = [];
  let before = 0;
  let previous = -1;
  for (let i = 0; i < n; i++) {
    const w = weightOf(i);
    const wanted = Math.min(days - 1, Math.floor(((2 * before + w) * days) / (2 * sum)));
    // At most one day on from the last chapter's, never before it, and late enough that the chapters left can still give
    // every remaining day at least one chapter.
    const day = Math.max(Math.min(wanted, previous + 1), previous, days - (n - i));
    result.push(day);
    previous = day;
    before += w;
  }
  return result;
}

/** `count` chapters a day, the last day taking what is left (pace in chapters: the pace is kept exactly). */
export const evenSplit = (n: number, count: number): number[] => Array.from({ length: n }, (_, i) => Math.floor(i / count));

/** The reading dates from `start`: every date whose weekday is ticked, `count` of them or up to `until` inclusive,
 *  stopping at the ten-year span. */
function readingDates(start: number, weekdays: ReadonlySet<number>, limit: { count?: number; until?: number }): number[] {
  const dates: number[] = [];
  const end = Math.min(limit.until ?? Infinity, start + MAX_SPAN_DAYS, LAST_DAY);
  for (let day = start; day <= end && (limit.count === undefined || dates.length < limit.count); day++) {
    if (weekdays.has(weekday(fromDayNumber(day)))) dates.push(day);
  }
  return dates;
}

/** The plan for these settings, or the reason there is none (design 3: every error in plain words, never a broken plan). */
export function buildPlan(settings: PlanSettings, words: ChapterWords): PlanResult {
  const chapters = chosenChapters(settings.books, words);
  if (chapters.length === 0) return { ok: false, error: "no-books" };
  const startDate = parseDateKey(settings.start);
  if (!startDate) return { ok: false, error: "bad-start" };
  const start = dayNumber(startDate);
  const weekdays = new Set(settings.weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6));
  if (weekdays.size === 0) return { ok: false, error: "no-weekdays" };

  let dates: number[];
  let split: number[];
  if (settings.mode === "finish") {
    const finishDate = parseDateKey(settings.finish);
    if (!finishDate) return { ok: false, error: "bad-finish" };
    const finish = dayNumber(finishDate);
    if (finish < start) return { ok: false, error: "finish-before-start" };
    if (finish - start > MAX_SPAN_DAYS) return { ok: false, error: "too-long" };
    dates = readingDates(start, weekdays, { until: finish });
    if (dates.length === 0) return { ok: false, error: "no-days-in-span" };
    dates = dates.slice(0, chapters.length);
    split = balancedSplit(chapters.map((chapter) => chapter.words), dates.length);
  } else {
    if (!Number.isInteger(settings.pace) || settings.pace < 1 || settings.pace > MAX_PACE) return { ok: false, error: "bad-pace" };
    const wanted = Math.min(chapters.length, daysForPace(chapters, settings.pace, settings.unit, settings.speed));
    dates = readingDates(start, weekdays, { count: wanted });
    if (dates.length < wanted) return { ok: false, error: "too-long" };
    split = settings.unit === "chapters"
      ? evenSplit(chapters.length, settings.pace)
      : balancedSplit(chapters.map((chapter) => chapter.words), wanted);
  }

  const days: PlanDay[] = dates.map((date, i) => ({ n: i + 1, date, first: -1, last: -1, words: 0 }));
  split.forEach((dayIndex, i) => {
    const day = days[dayIndex];
    if (day.first < 0) day.first = i;
    day.last = i;
    day.words += chapters[i].words;
  });
  const totalWords = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
  return { ok: true, plan: { chapters, days, totalWords } };
}

/** Minutes to read this many words at this speed. */
export const minutesFor = (words: number, speed: number): number => words / speed;

/** A short, stable fingerprint (FNV-1a, 8 hex digits) of a text: plan and calendar identities. */
export function fingerprint(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** The plan's identity: its days, dates and chapters. Ticks saved for one plan are shown only on the same plan. */
export const planSignature = (plan: Plan): string =>
  fingerprint(plan.days.map((day) => `${day.date}:${plan.chapters[day.first].index}-${plan.chapters[day.last].index}`).join(","));

/** What is read, for calendar identities: the same books from the same start keep their events' ids when the pace changes. */
export const readingSignature = (settings: Pick<PlanSettings, "books" | "start">): string =>
  fingerprint(`${[...settings.books].sort().join(",")}|${settings.start}`);
