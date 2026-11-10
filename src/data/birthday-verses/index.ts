// Birthday verses (docs/features/birthday-verses/design.md): the dates, their addresses and the choosing rules.
// The 366 choices live in the occasion picker's slot (../occasion-verses/birthday-by-date.ts), never here. Imports
// nothing through "@/", so the sitemap and the release and shortlist scripts (outside Vite) can read it.
import { allBirthdayDates } from "../occasion-verses/birthday-by-date";
import type { LifeEventPassage } from "../life-events/types";

export { allBirthdayDates };

/** Month words in addresses: English, lower case, fixed forever (design 3.2). */
export const MONTH_SLUGS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;
const MONTH_SHORT = MONTH_SLUGS.map((month) => month.slice(0, 3));
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const HUB_PATH = "/birthday-verses";

/** Verses the site has ruled out as birthday verses, as taken beyond what they say (design 4.2.3). BBCCCVVV ids. */
export const EXCLUDED_VERSES: readonly number[] = [
  24001005, // Jeremiah 1:5
  24029011, // Jeremiah 29:11
  19020004, // Psalm 20:4
  64001002, // 3 John 1:2
  36003017, // Zephaniah 3:17
  24033003, // Jeremiah 33:3
  23043002, // Isaiah 43:2
];

/** The rules a choice keeps (design 4.2). */
export const LIMITS = { maxText: 300, maxVerses: 3, noteMin: 40, noteMax: 140, contextMax: 200, maxChosen: 24, maxPsalmsProverbs: 122, minNewTestament: 122, maxPerBook: 40 } as const;

const pad = (value: number) => String(value).padStart(2, "0");
export const dateKey = (month: number, day: number) => `${pad(month)}-${pad(day)}`;
export const monthOf = (date: string) => Number(date.slice(0, 2));
export const dayOf = (date: string) => Number(date.slice(3, 5));
export const daysIn = (month: number) => DAYS_IN_MONTH[month - 1] ?? 0;
export const isBirthdayDate = (date: string) => /^\d{2}-\d{2}$/.test(date) && dayOf(date) >= 1 && dayOf(date) <= daysIn(monthOf(date));

/** "/birthday-verses/march-16". */
export const datePath = (date: string) => `${HUB_PATH}/${MONTH_SLUGS[monthOf(date) - 1]}-${dayOf(date)}`;
/** "/birthday-verses/march". */
export const monthPath = (month: number) => `${HUB_PATH}/${MONTH_SLUGS[month - 1]}`;

const monthFromWord = (word: string): number | null => {
  const lower = word.toLowerCase();
  if (/^\d{1,2}$/.test(lower)) return Number(lower) >= 1 && Number(lower) <= 12 ? Number(lower) : null;
  const full = MONTH_SLUGS.indexOf(lower as (typeof MONTH_SLUGS)[number]);
  if (full >= 0) return full + 1;
  const short = MONTH_SHORT.indexOf(lower);
  return short >= 0 ? short + 1 : null;
};

/** The month of "march" (also "mar", "3"), or null. */
export const monthFromSlug = (slug: string): number | null => (/^[a-z0-9]{1,9}$/i.test(slug) ? monthFromWord(slug) : null);

/** The "MM-DD" of a date address, official ("march-16") or forgiving ("mar-16", "03-16", "3-16", "16-march", "march16"). */
export function dateFromSlug(slug: string): string | null {
  const forms = [/^([a-z]{3,9}|\d{1,2})-?(\d{1,2})$/i, /^(\d{1,2})-([a-z]{3,9})$/i];
  for (const [index, form] of forms.entries()) {
    const match = form.exec(slug);
    if (!match) continue;
    const [monthWord, dayWord] = index === 0 ? [match[1], match[2]] : [match[2], match[1]];
    if (index === 0 && /^\d+$/.test(monthWord) && !slug.includes("-")) continue; // "316" names no date
    const month = monthFromWord(monthWord);
    const day = Number(dayWord);
    if (month && day >= 1 && day <= daysIn(month)) return dateKey(month, day);
  }
  return null;
}

/** The previous and next date in the 366-date calendar, December 31 wrapping to January 1 (design 5.2). */
export function neighbours(date: string): { previous: string; next: string } {
  const dates = allBirthdayDates();
  const index = dates.indexOf(date);
  return { previous: dates[(index + dates.length - 1) % dates.length], next: dates[(index + 1) % dates.length] };
}

/** A month's dates in order. */
export const monthDates = (month: number) => allBirthdayDates().filter((date) => monthOf(date) === month);

export type MatchKind = "date" | "flipped" | "chosen";

/** Which way a passage belongs to its date (design 4.1), computed so the page can never disagree with the verse. */
export function matchKind(date: string, passage: Pick<LifeEventPassage, "from">): MatchKind {
  const chapter = Math.floor(passage.from / 1000) % 1000;
  const verse = passage.from % 1000;
  const month = monthOf(date);
  const day = dayOf(date);
  if (chapter === month && verse === day) return "date";
  if (day >= 13 && chapter === day && verse === month) return "flipped";
  return "chosen";
}

/** Every address of the feature for the sitemap: the hub, 12 months, 366 dates. */
export const birthdayVersePaths = (): string[] => [HUB_PATH, ...MONTH_SLUGS.map((_, index) => monthPath(index + 1)), ...allBirthdayDates().map(datePath)];
