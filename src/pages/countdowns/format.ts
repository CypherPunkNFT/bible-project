// Dates and counts as the site writes them (design 7.3), through the site's own helpers (src/lib/site-format.ts), so the
// translation checks find no fixed-language formats or hand-made plurals. In English that is month first: "December 12",
// "Saturday, December 12, 2026". Calendar dates are formatted at UTC midnight, so no time zone can move them a day.
import { dateFormat, plural } from "@/lib/site-format";
import { dayNumber, type CalendarDate } from "./calendar";

const formatters = new Map<string, Intl.DateTimeFormat>();
function format(date: CalendarDate, options: Intl.DateTimeFormatOptions): string {
  const key = JSON.stringify(options);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = dateFormat({ ...options, timeZone: "UTC" });
    formatters.set(key, formatter);
  }
  return formatter.format(new Date(dayNumber(date) * 86_400_000));
}

/** "Saturday, December 12, 2026". */
export const longDate = (date: CalendarDate): string => format(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
/** "Saturday, December 12". */
export const weekdayDate = (date: CalendarDate): string => format(date, { weekday: "long", month: "long", day: "numeric" });
/** "December 12": fixed text in headings and messages. */
export const monthDay = (date: CalendarDate): string => format(date, { month: "long", day: "numeric" });
/** "Dec 12". */
export const shortDate = (date: CalendarDate): string => format(date, { month: "short", day: "numeric" });
/** "Sat". */
export const shortWeekday = (date: CalendarDate): string => format(date, { weekday: "short" });

/** "1 day", "13 days". */
export const dayCount = (count: number): string => plural(count, "{n} day", "{n} days");
/** "tomorrow", "in 22 days". */
export const inDays = (count: number): string => plural(count, "tomorrow", "in {n} days");
