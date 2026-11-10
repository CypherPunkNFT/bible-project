// A date's verse (design 5.2, 6.3): which passage it is, how it belongs to the date, and the page's fixed lines. The
// choices are read from the occasion picker's one list (BIRTHDAY_BY_DATE); nothing here stores a verse's words.
import { BIRTHDAY_BY_DATE } from "@/data/occasion-verses";
import type { LifeEventPassage } from "@/data/life-events/types";
import { formatRange } from "@/lib/refs";
import type { Catalog } from "@/lib/types";
import { ordinal } from "@/lib/site-format";
import type { CardRef } from "@/lib/verse-card/links";
import { dayOf, matchKind, monthOf } from "./dates";
import { dateName } from "./format";

/** The date's passage; every one of the 366 dates has one. */
export const birthdayPassage = (date: string): LifeEventPassage | undefined =>
  Object.prototype.hasOwnProperty.call(BIRTHDAY_BY_DATE, date) ? BIRTHDAY_BY_DATE[date] : undefined;

/** The passage as book, chapter and its first and last verse. */
export function passageRef(passage: LifeEventPassage): CardRef {
  const last = passage.to ?? passage.from;
  return { book: Math.floor(passage.from / 1_000_000), chapter: Math.floor(passage.from / 1000) % 1000, first: passage.from % 1000, last: last % 1000 };
}

/** "John 3:16" or "1 Peter 1:8–9", as the rest of the site writes it. */
export const passageReference = (catalog: Catalog, passage: LifeEventPassage): string => formatRange(catalog, passage.from, passage.to ?? passage.from);

/** The date page's heading, with no year so it is right every year: "Bible Verse for a March 16 Birthday". */
export function dateHeading(date: string): string {
  const name = dateName(date);
  return /^[AEIOU]/.test(name) ? `Bible Verse for an ${name} Birthday` : `Bible Verse for a ${name} Birthday`;
}

/** The page's lead line (design 6.3 item 3), the note exactly as stored: "March 16 · John 3:16: The heart of the gospel…". */
export const leadLine = (date: string, reference: string, note: string): string => `${dateName(date)} · ${reference}: ${note}`;

/** Where the number comes from (design 6.3 item 5), computed from the reference so it can never disagree with it. */
export function kindLine(date: string, passage: LifeEventPassage): string {
  const { chapter, first } = passageRef(passage);
  switch (matchKind(date, passage)) {
    case "date": return `Chapter ${chapter}, verse ${first}: the ${ordinal(monthOf(date))} month and the ${ordinal(dayOf(date))} day.`;
    case "flipped": return `Chapter ${chapter}, verse ${first}: the day and the month of ${dateName(date)}.`;
    default: return "No verse numbered for this date fits a birthday card well, so this one was chosen for it.";
  }
}

/** The honest line on every date page and the hub. */
export const HONEST_LINE = "The Bible gives no verse to any date. These are chosen as gifts to read and pray for someone, not as signs.";
