// Dates as the site writes them (design 3.1), through the site's own date format (src/lib/site-format.ts), as the
// countdowns do: at UTC midnight in 2024, a leap year, so 29 February exists and no time zone moves a day.
import { dateFormat } from "@/lib/site-format";
import { dayOf, monthOf } from "./dates";

const formatters = new Map<string, Intl.DateTimeFormat>();
function format(month: number, day: number, options: Intl.DateTimeFormatOptions): string {
  const key = JSON.stringify(options);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = dateFormat({ ...options, timeZone: "UTC" });
    formatters.set(key, formatter);
  }
  return formatter.format(new Date(Date.UTC(2024, month - 1, day)));
}

/** "March 16". */
export const dateName = (date: string): string => format(monthOf(date), dayOf(date), { month: "long", day: "numeric" });
/** "March". */
export const monthName = (month: number): string => format(month, 1, { month: "long" });
