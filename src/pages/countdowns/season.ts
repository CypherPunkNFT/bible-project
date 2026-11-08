// One year's run of an occasion and the state the page shows (design 6.2, 6.3). Pure functions of the data and a day
// number, so every rule is tested without a browser: the window, which year's run, the day line and the panels.
import type { CountdownDay, DayPanel, Occasion } from "../../data/countdowns/types";
import { dateKey, dayNumber, easterSunday, fromDayNumber, nthWeekday, sundayOnOrAfter, type CalendarDate } from "./calendar";
import { dayCount, monthDay } from "./format";

export interface RunEntry { day: CountdownDay; n: number; date: CalendarDate }

export interface Run {
  occasion: Occasion;
  /** "lent:2027-03-28": the occasion (or the one it borrows from) and its target date; read marks are kept under it. */
  id: string;
  target: CalendarDate;
  targetN: number;
  /** The countdown's start rule date (Advent Sunday), which candle weeks count from. */
  startN: number;
  /** The window's first and last day numbers (design 6.2). */
  first: number;
  last: number;
  /** One per date of the window, in order. */
  entries: RunEntry[];
}

export type RunState = "coming-up" | "counting" | "the-day" | "after" | "still-waiting" | "finished";

/** How far ahead a personal date may be (design 6.3: "more than two years ahead are refused"). */
export const MAX_AHEAD_DAYS = 731;

/** The target of an occasion with a calendar rule in a given year. A chosen-date occasion has no rule to follow. */
export function targetIn(occasion: Occasion, year: number): CalendarDate {
  const rule = occasion.target;
  if (rule.kind === "fixed") return { year, month: rule.month, day: rule.day };
  if (rule.kind === "easter") return fromDayNumber(dayNumber(easterSunday(year)) + rule.offset);
  if (rule.kind === "nth-weekday") return nthWeekday(year, rule.month, rule.weekday, rule.nth);
  throw new Error(`countdowns: "${occasion.slug}" has a chosen date, so it has no target in ${year} without one`);
}

/** The occasion's own days, or the days it borrows (Holy Week shows Lent's from Palm Sunday on). */
export function daysOf(occasion: Occasion, occasions: readonly Occasion[]): CountdownDay[] {
  if (Array.isArray(occasion.days)) return occasion.days;
  const { borrow, fromKey } = occasion.days;
  const lender = occasions.find((item) => item.slug === borrow);
  if (!lender || !Array.isArray(lender.days)) throw new Error(`countdowns: "${occasion.slug}" borrows from "${borrow}", which has no days of its own`);
  const from = lender.days.findIndex((day) => day.key === fromKey);
  if (from < 0) throw new Error(`countdowns: "${borrow}" has no day "${fromKey}" for "${occasion.slug}" to start from`);
  return lender.days.slice(from);
}

/** The slug whose days and read marks a page uses: Lent's for Holy Week. */
export const ownerSlug = (occasion: Occasion): string => (Array.isArray(occasion.days) ? occasion.slug : occasion.days.borrow);

const monthDayOf = (text: string) => {
  const [month, day] = text.split("-").map(Number);
  return { month, day };
};

/** The day number a day entry falls on, for a target day number in a target year. */
export function entryDay(day: CountdownDay, target: CalendarDate, targetN: number): number {
  if ("before" in day.at) return targetN - day.at.before;
  if ("after" in day.at) return targetN + day.at.after;
  const { month, day: date } = monthDayOf(day.at.date);
  return dayNumber({ year: target.year, month, day: date });
}

/** One year's run of an occasion, for its target date. */
export function buildRun(occasion: Occasion, target: CalendarDate, occasions: readonly Occasion[]): Run {
  const targetN = dayNumber(target);
  const start = occasion.start;
  const startN = start.kind === "before" ? targetN - start.days : dayNumber(sundayOnOrAfter(target.year, start.month, start.day));
  let first = startN;
  if (occasion.alwaysFrom) {
    const { month, day } = monthDayOf(occasion.alwaysFrom);
    first = Math.min(first, dayNumber({ year: target.year, month, day }));
  }
  const last = targetN + (occasion.maxAfter ?? 0);
  const entries = daysOf(occasion, occasions)
    .map((day) => ({ day, n: entryDay(day, target, targetN) }))
    .filter((entry) => entry.n >= first && entry.n <= last)
    .sort((a, b) => a.n - b.n)
    .map((entry) => ({ ...entry, date: fromDayNumber(entry.n) }));
  return { occasion, id: `${ownerSlug(occasion)}:${dateKey(target)}`, target, targetN, startN, first, last, entries };
}

/**
 * Which year's run a calendar occasion shows on a day (design 6.3): the first of last year's, this year's and next year's
 * runs whose last shown day (the target plus `afterDays`) is today or later.
 */
export function currentRun(occasion: Occasion, todayN: number, occasions: readonly Occasion[]): Run {
  const year = fromDayNumber(todayN).year;
  for (const candidate of [year - 1, year, year + 1]) {
    const run = buildRun(occasion, targetIn(occasion, candidate), occasions);
    if (run.targetN + occasion.afterDays >= todayN) return run;
  }
  throw new Error(`countdowns: no run of "${occasion.slug}" covers day ${todayN}`);
}

/** The state a run is in on a day. */
export function stateOf(run: Run, todayN: number): RunState {
  if (todayN < run.first) return "coming-up";
  if (todayN < run.targetN) return "counting";
  if (todayN === run.targetN) return "the-day";
  if (run.occasion.maxAfter) return "still-waiting";
  return todayN <= run.targetN + run.occasion.afterDays ? "after" : "finished";
}

/** The entry to feature on a day: today's; the first as a preview before the window; the target's afterwards; and past
 *  a "still waiting" run's last day, its last entry for every day until the visitor ends it (design 6.2). */
export function featuredEntry(run: Run, todayN: number): RunEntry {
  const exact = run.entries.find((entry) => entry.n === todayN);
  if (exact) return exact;
  if (todayN < run.first) return run.entries[0];
  if (run.occasion.maxAfter) return run.entries[run.entries.length - 1];
  return run.entries.find((entry) => entry.n === run.targetN) ?? run.entries[run.entries.length - 1];
}

/** The panels (Advent candles) that fall on a day number in this run. */
export function panelsOn(run: Run, n: number): DayPanel[] {
  return (run.occasion.panels ?? []).filter((panel) => panelDay(run, panel) === n);
}

/** The day number a panel falls on: the start rule's date + 7 × week, or a number of days before the target. */
export const panelDay = (run: Run, panel: DayPanel): number =>
  "week" in panel.on ? run.startN + 7 * panel.on.week : run.targetN - panel.on.before;

const NUMBERED = /^day-(\d+)$/;

/** "Day 12" for a numbered day, or null. */
export function dayNumberLabel(occasion: Occasion, day: CountdownDay): string | null {
  const match = NUMBERED.exec(day.key);
  return occasion.numberedOf && match ? `Day ${match[1]}` : null;
}

/** The short name of a day in the plan: its label, "Day 12", "December 12", "30 days to go" or "2 days after". */
export function dayName(occasion: Occasion, day: CountdownDay): string {
  if (day.label) return day.label;
  const numbered = dayNumberLabel(occasion, day);
  if (numbered) return numbered;
  if ("date" in day.at) {
    const { month, day: date } = monthDayOf(day.at.date);
    return monthDay({ year: 2000, month, day: date });
  }
  if ("after" in day.at) return `${dayCount(day.at.after)} after`;
  return day.at.before === 0 ? occasion.targetName : `${dayCount(day.at.before)} to go`;
}

/** A day page's heading and its shared title (design 7.3): "Advent, December 12: The shoot from Jesse's stump",
 *  "Lent, Day 12: Take up your cross", "Good Friday: It is finished". Stored titles are used exactly as written. */
export function dayHeading(occasion: Occasion, day: CountdownDay): string {
  if (day.label) return `${day.label}: ${day.title}`;
  return `${occasion.name}, ${dayName(occasion, day)}: ${day.title}`;
}

/** "13 days until Christmas". */
export const until = (count: number, targetName: string): string => `${dayCount(count)} until ${targetName}`;

/** The day card's line, true for that day whatever the date today (design 7.5): "13 days until Christmas",
 *  "Day 12 of 40 · 33 days until Easter", "Christmas Day", "2 days after the due date". */
export function dayLine(run: Run, entry: RunEntry): string {
  const { occasion, day } = { occasion: run.occasion, day: entry.day };
  const left = run.targetN - entry.n;
  if (left === 0) return day.label ?? occasion.targetName;
  if (left < 0) return `${dayCount(-left)} after ${occasion.targetName}`;
  const numbered = dayNumberLabel(occasion, day);
  return numbered && occasion.numberedOf ? `${numbered} of ${occasion.numberedOf} · ${until(left, occasion.targetName)}` : until(left, occasion.targetName);
}

/** How a personal date from a link or the date form is checked (design 6.3, 9). */
export type DateCheck = { ok: true; target: CalendarDate } | { ok: false; reason: string };

export function checkChosenDate(target: CalendarDate | null, todayN: number): DateCheck {
  if (!target) return { ok: false, reason: "That date doesn't exist. Choose a real date, written as year, month and day." };
  if (dayNumber(target) - todayN > MAX_AHEAD_DAYS) return { ok: false, reason: "Choose a date within the next two years." };
  return { ok: true, target };
}
