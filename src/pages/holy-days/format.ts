// Dates, years and counts as the site writes them (src/lib/site-format.ts), so the translation checks find no
// fixed-language format or hand-made plural. Day numbers are formatted at UTC midnight on the Gregorian calendar, so
// neither a time zone nor a language whose own calendar is another (Persian, Thai) can change the day shown.
import { dateFormat, formatNumber, plural } from "@/lib/site-format";
import { fromDayNumber } from "@/pages/countdowns/calendar";

const formatters = new Map<string, Intl.DateTimeFormat>();
function format(n: number, options: Intl.DateTimeFormatOptions): string {
  const key = JSON.stringify(options);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = dateFormat({ ...options, timeZone: "UTC", calendar: "gregory" });
    formatters.set(key, formatter);
  }
  return formatter.format(new Date(n * 86_400_000));
}

/** "Sunday, April 5". */
export const weekdayDate = (n: number): string => format(n, { weekday: "long", month: "long", day: "numeric" });
/** "Saturday, January 2, 2027": a last day that falls in the next year. */
export const longDate = (n: number): string => format(n, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
/** "April": a month heading. */
export const monthName = (n: number): string => format(n, { month: "long" });
/** "2027", never "2,027". */
export const yearText = (year: number): string => formatNumber(year, { useGrouping: false });

/** The last day of a feast: with its year when that is not the year it began in. */
export const lastDay = (start: number, end: number): string =>
  fromDayNumber(end).year === fromDayNumber(start).year ? weekdayDate(end) : longDate(end);

/** "Lasts 8 days, until Thursday, December 12". */
export const spanLine = (days: number, last: string): string => `Lasts ${plural(days, "{n} day", "{n} days")}, until ${last}`;
