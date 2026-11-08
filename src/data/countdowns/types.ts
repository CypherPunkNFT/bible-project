// Countdowns (docs/features/countdowns/design.md 6.2): an occasion is a run of days leading up to a date, and every
// detail of it is data. Imports nothing through "@/", so tests and build scripts outside Vite can read the occasions.
// Verse wording is never stored: passages are verse ids made with the life-event packs' p() helper.
import type { LifeEventPassage } from "../life-events/types";

export { p } from "../life-events/types";
export type { LifeEventPassage } from "../life-events/types";

/** When the occasion's own day ("the target") falls in a given year. */
export type DateRule =
  | { kind: "fixed"; month: number; day: number }                       // Christmas: 12-25
  | { kind: "easter"; offset: number }                                   // Easter 0, Pentecost 49
  | { kind: "nth-weekday"; month: number; weekday: number; nth: number } // Thanksgiving (later); weekday 0 is Sunday
  | { kind: "chosen" };                                                  // the visitor's own date

/** When the countdown starts. */
export type StartRule =
  | { kind: "before"; days: number }                                     // Lent: 46 days before Easter
  | { kind: "sunday-on-or-after"; month: number; day: number };          // Advent Sunday: first Sunday on/after 11-27

/** Which date a day entry belongs to, measured from the target. */
export type DayAt =
  | { before: number }   // n days before the target; 0 is the target day itself
  | { date: string }     // "12-17": a fixed calendar date in the target's year (Advent)
  | { after: number };   // n days after the target ("still waiting", the baby occasion)

export interface CountdownDay {
  /** Permanent, used in links (design 6.5): lowercase letters, digits and hyphens. */
  key: string;
  at: DayAt;
  /** The day's name in the calendar: "Good Friday", "Christmas Eve". */
  label?: string;
  /** 50 characters at most, used exactly as written in headings. */
  title: string;
  /** Role "reading"; one or two, each inside one chapter. */
  readings: LifeEventPassage[];
  /** Role "card"; 240 characters or fewer after tidying. */
  card: LifeEventPassage;
  /** 60–110 words; its first sentence is the day page's search description. */
  reflection: string;
  /** 45 words at most, addressed to God, ending "Amen." */
  prayer: string;
  /** One open line for a family table or small group, 120 characters at most. */
  question?: string;
  /** An id in data/hymns/collection.json. */
  hymn?: string;
}

/**
 * An extra panel on a day, such as an Advent candle. `week` n is the date of the occasion's `start` rule (Advent Sunday
 * itself, never the earlier `alwaysFrom` date) + 7n days, counting from 0. `before` counts back from the target.
 */
export interface DayPanel {
  key: string;
  on: { week: number } | { before: number };
  /** "Second Sunday of Advent: the candle of peace". */
  heading: string;
  passage: LifeEventPassage;
  /** One sentence to read while lighting the candle. */
  line: string;
  hymn?: string;
}

/** Holy Week shows Lent's days from `fromKey` to the end, under its own window. */
export interface BorrowedDays { borrow: string; fromKey: string }

export interface Occasion {
  slug: string;
  name: string;
  /** The h1, with no year in it. */
  heading: string;
  /** One line for the hub: what it is and when it runs. */
  summary: string;
  /** 60–160 words; its first sentence is the search description. */
  intro: string;
  /** "Christmas", as in "13 days until Christmas". */
  targetName: string;
  target: DateRule;
  start: StartRule;
  /** "12-01": days from this date are in the window even before the start (Advent). */
  alwaysFrom?: string;
  /** How long the page stays on this year's run after the target (design 6.3). */
  afterDays: number;
  days: CountdownDay[] | BorrowedDays;
  panels?: DayPanel[];
  /** "Still waiting" days after the target (the baby occasion: 14). */
  maxAfter?: number;
  /** Numbered days ("day-12") read as "Day 12 of {total}" (Lent: 40). */
  numberedOf?: number;
  /** How the calendar is drawn: doors by date (Advent) or a week grid (Lent). */
  calendar: "doors" | "weeks";
  /** The card's look (design 7.5). */
  style: "advent" | "lent" | "plain";
  /** One line shown under the plan, such as Lent's note on Orthodox dates. */
  note?: string;
  /** A short closing line for the "afterwards" state. */
  closing: string;
  /** A chosen-date occasion's button that ends it happily ("Our baby is here"); "Stop this countdown" is always offered. */
  finishLabel?: string;
  /** A quiet link in small type at the foot of every page of the occasion (the baby occasion's link to the loss page). */
  footLink?: { href: string; text: string };
  topics: { slug: string; title: string }[];
  /** Hymn ids for "Explore more"; each needs a title in HYMN_TITLES. */
  hymns?: string[];
  related: string[];
  elsewhere?: { href: string; title: string }[];
}
