// Dates and addresses for the birthday pages (docs/features/birthday-verses/design.md 3): the conversions live in the
// feature's data index, which the sitemap and release scripts read outside Vite; this adds what needs the site itself.
// A date is a month and a day ("03-16"), never a moment.
import { SITE_ORIGIN } from "@/lib/page-head";
import { dateKey, datePath } from "@/data/birthday-verses";

export {
  allBirthdayDates, dateFromSlug, dateKey, datePath, dayOf, daysIn, HUB_PATH, isBirthdayDate, matchKind, monthDates, monthFromSlug,
  monthOf, monthPath, MONTH_SLUGS, neighbours, type MatchKind,
} from "@/data/birthday-verses";

/** "https://bibleguide.io/birthday-verses/march-16", whatever address the page happens to be open at. */
export const birthdayUrl = (date: string): string => `${SITE_ORIGIN}${datePath(date)}`;

/** The visitor's own calendar date as "MM-DD", read from their device's clock (design 3.1). */
export const todayOf = (now: Date): string => dateKey(now.getMonth() + 1, now.getDate());

/** The occasion verse picker's Birthday occasion. */
export const PICKER_BIRTHDAY_PATH = "/occasion-verses?o=birthday";
