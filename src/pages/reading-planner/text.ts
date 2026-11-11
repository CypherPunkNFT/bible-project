// The planner's words for ranges, times and dates (design 3, step 4, and section 8), through the site's own formatters
// (src/lib/site-format.ts), so the translation checks find no fixed-language formats, hand-made plurals or sentences
// pieced around values.
import { dateFormat, formatList, formatNumber, siteLocale } from "@/lib/site-format";
import { fromDayNumber } from "@/pages/countdowns/calendar";
import { longDate } from "@/pages/countdowns/format";
import type { Chapter, ChapterWords, Plan, PlanDay } from "./planner";

/** A book's name for a code. */
export type BookName = (code: string) => string;

/** Every chapter in Bible order, so a run across a book boundary can be told from a gap (design review: a day holding
 *  Genesis 50 and Matthew 1 must not read "Genesis 50 – Matthew 1"). */
export const isNextChapter = (a: Chapter, b: Chapter): boolean => b.index === a.index + 1;

/** One run of consecutive chapters: "Genesis 1–3", "Genesis 50 – Exodus 2", "Psalms 23", or a one-chapter book on its
 *  own ("Jude"). */
function runLabel(from: Chapter, to: Chapter, name: BookName, words: ChapterWords): string {
  const single = (chapter: Chapter) => (words[chapter.book]?.length === 1 ? name(chapter.book) : `${name(chapter.book)} ${chapter.chapter}`);
  if (from.index === to.index) return single(from);
  if (from.book === to.book) return `${name(from.book)} ${from.chapter}–${to.chapter}`;
  return `${single(from)} – ${single(to)}`;
}

/** A day's chapters in words; separate runs (when books in between were not chosen) are joined with semicolons. */
export function dayLabel(plan: Plan, day: PlanDay, name: BookName, words: ChapterWords): string {
  const runs: string[] = [];
  let runStart = plan.chapters[day.first];
  for (let i = day.first; i <= day.last; i++) {
    const chapter = plan.chapters[i];
    const next = i < day.last ? plan.chapters[i + 1] : null;
    if (!next || !isNextChapter(chapter, next)) {
      runs.push(runLabel(runStart, chapter, name, words));
      if (next) runStart = next;
    }
  }
  return runs.join("; ");
}

const unit = (value: number, which: "hour" | "minute", display: "short" | "long") =>
  formatNumber(value, { style: "unit", unit: which, unitDisplay: display });

/** A reading time: "12 min", "1 hr, 20 min", or under a minute; `long` writes "72 hours, 36 minutes". */
export function duration(minutes: number, display: "short" | "long" = "short"): string {
  const rounded = Math.round(minutes);
  if (rounded < 1) return "Under a minute";
  if (rounded < 60) return unit(rounded, "minute", display);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  const parts = rest === 0 ? [unit(hours, "hour", display)] : [unit(hours, "hour", display), unit(rest, "minute", display)];
  return formatList(parts, { type: "unit", style: display === "long" ? "long" : "narrow" });
}

const DAY_MS = 86_400_000;
let rowFormat: Intl.DateTimeFormat | null = null;
let rowFormatLocale = "";

/** "Sat, Dec 12" for a row, in the site's language (a day number is a UTC date, so no time zone can move it). */
export function rowDate(date: number): string {
  const locale = siteLocale();
  if (!rowFormat || rowFormatLocale !== locale) {
    rowFormat = dateFormat({ weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
    rowFormatLocale = locale;
  }
  return rowFormat.format(new Date(date * DAY_MS));
}

/** "Saturday, December 12, 2026" for the summary. */
export const fullDate = (date: number): string => longDate(fromDayNumber(date));

/** One decimal place when under ten ("2.5"), whole numbers above. */
export const roughNumber = (value: number): string => formatNumber(value, { maximumFractionDigits: value < 10 ? 1 : 0 });
