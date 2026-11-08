// Church-calendar arithmetic for the countdowns (design 6.1). No imports, so tests and build scripts can load it as it
// is. Everything is a plain calendar date or a whole day number, never a time of day, so daylight-saving changes, month
// ends and 29 February cannot cause an off-by-one.

export interface CalendarDate { year: number; month: number; day: number }

const DAY_MS = 86_400_000;

/** A calendar date's place on the calendar, as a whole number of days (1970-01-01 is 0). */
export const dayNumber = (date: CalendarDate): number => Date.UTC(date.year, date.month - 1, date.day) / DAY_MS;

/** The calendar date of a day number. */
export function fromDayNumber(n: number): CalendarDate {
  const date = new Date(n * DAY_MS);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/** 0 for Sunday to 6 for Saturday. */
export const weekday = (date: CalendarDate): number => (((dayNumber(date) + 4) % 7) + 7) % 7;

/** The visitor's own date: the device's local year, month and day. */
export const today = (now: Date): CalendarDate => ({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });

export const FIRST_YEAR = 1900;
export const LAST_YEAR = 2200;

/** "2027-06-12" read strictly as a real calendar date between 1900 and 2200, or null. Never through new Date(text). */
export function parseDateKey(text: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (date.year < FIRST_YEAR || date.year > LAST_YEAR || date.month < 1 || date.month > 12 || date.day < 1) return null;
  const back = fromDayNumber(dayNumber(date));
  return back.month === date.month && back.day === date.day ? date : null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2027-06-12". */
export const dateKey = (date: CalendarDate): string => `${date.year}-${pad(date.month)}-${pad(date.day)}`;

/** Western (Gregorian) Easter Sunday: the Meeus/Jones/Butcher calculation, in integer arithmetic. */
export function easterSunday(year: number): CalendarDate {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

/** The first Sunday on or after a date (Advent Sunday: the first Sunday on or after 27 November). */
export function sundayOnOrAfter(year: number, month: number, day: number): CalendarDate {
  const date = { year, month, day };
  return fromDayNumber(dayNumber(date) + ((7 - weekday(date)) % 7));
}

/** The nth given weekday (0 Sunday) of a month: the fourth Thursday of November is nthWeekday(y, 11, 4, 4). */
export function nthWeekday(year: number, month: number, weekdayWanted: number, nth: number): CalendarDate {
  const first = { year, month, day: 1 };
  return fromDayNumber(dayNumber(first) + ((weekdayWanted - weekday(first) + 7) % 7) + 7 * (nth - 1));
}

/** Milliseconds from `now` to the next local midnight. */
export function msUntilMidnight(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
}
