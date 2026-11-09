// Every holy day of a Gregorian year, worked out in code (design, "The days" and "Review"). Western dates hang on the
// Gregorian Easter the countdowns already compute; Orthodox ones on the Julian Easter, carried over to the Gregorian
// calendar through the Julian day number; the biblical feasts on the Hebrew calendar (hebrew.ts). Dates are whole day
// numbers (days since 1 January 1970), so no time zone or daylight-saving change can move one.
import { dayNumber, easterSunday, fromDayNumber, sundayOnOrAfter } from "@/pages/countdowns/calendar";
import { hebrewToDayNumber, KISLEV, NISAN, purimMonth, SIVAN, TISHRI } from "./hebrew";

/** The first full year of the Gregorian calendar, and the last four-digit year. */
export const FIRST_YEAR = 1583;
export const LAST_YEAR = 9999;

export type Tradition = "western" | "orthodox" | "feast";
export const TRADITIONS: readonly Tradition[] = ["western", "orthodox", "feast"];

export type HolyDayKey =
  | "epiphany" | "ash-wednesday" | "palm-sunday" | "maundy-thursday" | "good-friday" | "easter" | "ascension"
  | "pentecost" | "advent" | "christmas"
  | "orthodox-christmas" | "clean-monday" | "pascha" | "orthodox-pentecost"
  | "purim" | "passover" | "firstfruits" | "weeks" | "trumpets" | "atonement" | "tabernacles" | "dedication";

export interface HolyDay {
  key: HolyDayKey;
  tradition: Tradition;
  /** The day it falls on (or begins), as a day number. */
  start: number;
  /** Its last day, for a feast of several days; may be in the next year. */
  end?: number;
  /** Unique within any year, even when a feast begins twice in it: "dedication:9999-01-26". */
  id: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (n: number): string => {
  const date = fromDayNumber(n);
  return `${String(date.year).padStart(4, "0")}-${pad(date.month)}-${pad(date.day)}`;
};

/** Days 1970-01-01 is after the start of the Julian day count. */
const JDN_OF_DAY_ZERO = 2_440_588;

/** A Julian-calendar date as a day number (through its Julian day number). */
export function julianToDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32_083;
  return jdn - JDN_OF_DAY_ZERO;
}

/** Orthodox Easter (Pascha): the Meeus Julian calculation, then carried over to the Gregorian calendar. */
export function orthodoxEaster(year: number): number {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return julianToDayNumber(year, month, day);
}

export const westernEaster = (year: number): number => dayNumber(easterSunday(year));

const inYear = (n: number, year: number) => fromDayNumber(n).year === year;

/** A Hebrew feast: its month (by Hebrew year), day and length in days. */
const FEASTS: readonly { key: HolyDayKey; month: (hebrewYear: number) => number; day: number; days: number }[] = [
  { key: "purim", month: purimMonth, day: 14, days: 1 },
  { key: "passover", month: () => NISAN, day: 15, days: 7 },
  { key: "firstfruits", month: () => NISAN, day: 16, days: 1 },
  { key: "weeks", month: () => SIVAN, day: 6, days: 1 },
  { key: "trumpets", month: () => TISHRI, day: 1, days: 1 },
  { key: "atonement", month: () => TISHRI, day: 10, days: 1 },
  { key: "tabernacles", month: () => TISHRI, day: 15, days: 8 },
  { key: "dedication", month: () => KISLEV, day: 25, days: 8 },
];

type Draft = Omit<HolyDay, "id">;

function westernDays(year: number): Draft[] {
  const easter = westernEaster(year);
  const at = (key: HolyDayKey, start: number): Draft => ({ key, tradition: "western", start });
  return [
    at("epiphany", dayNumber({ year, month: 1, day: 6 })),
    at("ash-wednesday", easter - 46),
    at("palm-sunday", easter - 7),
    at("maundy-thursday", easter - 3),
    at("good-friday", easter - 2),
    at("easter", easter),
    at("ascension", easter + 39),
    at("pentecost", easter + 49),
    at("advent", dayNumber(sundayOnOrAfter(year, 11, 27))),
    at("christmas", dayNumber({ year, month: 12, day: 25 })),
  ];
}

function orthodoxDays(year: number): Draft[] {
  const pascha = orthodoxEaster(year);
  const at = (key: HolyDayKey, start: number): Draft => ({ key, tradition: "orthodox", start });
  // 25 December of the Julian calendar: last year's falls in this January (until the calendars drift further apart).
  const christmases = [year - 1, year].map((y) => julianToDayNumber(y, 12, 25)).filter((n) => inYear(n, year));
  return [
    ...christmases.map((n) => at("orthodox-christmas", n)),
    at("clean-monday", pascha - 48),
    at("pascha", pascha),
    at("orthodox-pentecost", pascha + 49),
  ];
}

function feastDays(year: number): Draft[] {
  const days: Draft[] = [];
  for (const hebrewYear of [year + 3760, year + 3761]) {
    for (const feast of FEASTS) {
      const start = hebrewToDayNumber(hebrewYear, feast.month(hebrewYear), feast.day);
      if (!inYear(start, year)) continue;
      days.push({ key: feast.key, tradition: "feast", start, ...(feast.days > 1 ? { end: start + feast.days - 1 } : {}) });
    }
  }
  return days;
}

/** A year's holy days in date order; days that fall together keep the order Western, Orthodox, feasts. */
export function holyDaysInYear(year: number): HolyDay[] {
  if (!Number.isInteger(year) || year < FIRST_YEAR || year > LAST_YEAR) {
    throw new Error(`holy-days: year ${year} is outside ${FIRST_YEAR}–${LAST_YEAR}`);
  }
  const all = [...westernDays(year), ...orthodoxDays(year), ...feastDays(year)].filter((day) => inYear(day.start, year));
  const order = (day: Draft) => TRADITIONS.indexOf(day.tradition);
  return all
    .map((day, index) => ({ day, index }))
    .sort((a, b) => a.day.start - b.day.start || order(a.day) - order(b.day) || a.index - b.index)
    .map(({ day }) => ({ ...day, id: `${day.key}:${dayKey(day.start)}` }));
}

/** "2027" as a year the page shows: exactly four digits within the range, or null. */
export function parseYear(text: string | null | undefined): number | null {
  if (!text || !/^\d{4}$/.test(text)) return null;
  const year = Number(text);
  return year >= FIRST_YEAR && year <= LAST_YEAR ? year : null;
}

/** Where a holy day stands on a given day: under way (with which day of how many), or ahead. */
export type Standing = { day: HolyDay; state: "today" } | { day: HolyDay; state: "under-way"; dayOf: number; days: number } | { day: HolyDay; state: "ahead"; inDays: number };

/** The first holy day (of the traditions shown) that is under way or still ahead on `today`, looking into next year. */
export function comingUp(today: number, shown: ReadonlySet<Tradition>): Standing | null {
  const year = fromDayNumber(today).year;
  const years = [year - 1, year, year + 1].filter((y) => y >= FIRST_YEAR && y <= LAST_YEAR);
  const days = years.flatMap(holyDaysInYear).filter((day) => shown.has(day.tradition) && (day.end ?? day.start) >= today);
  // A day that begins today comes before one already under way (Easter Sunday inside the week of Unleavened Bread).
  const startsToday = days.find((day) => day.start === today);
  if (startsToday) return { day: startsToday, state: "today" };
  const day = days[0];
  if (!day) return null;
  if (day.start < today) return { day, state: "under-way", dayOf: today - day.start + 1, days: (day.end ?? day.start) - day.start + 1 };
  return { day, state: "ahead", inDays: day.start - today };
}
