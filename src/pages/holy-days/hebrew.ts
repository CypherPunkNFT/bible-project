// The Hebrew calendar as Jewish communities keep it today, fixed in the fourth century (design, "The days"): the
// arithmetic of Reingold and Dershowitz, Calendrical Calculations (the molad, the postponements, the month lengths). No
// imports, and whole numbers only: part counts pass 32 bits, so there are no bitwise operators here.
// Months are numbered from Nisan as the Bible counts them: 1 Nisan, 3 Sivan, 7 Tishri, 9 Kislev, 12 Adar (Adar I in a
// leap year), 13 Adar II.

export const NISAN = 1;
export const SIVAN = 3;
export const TISHRI = 7;
export const KISLEV = 9;
export const ADAR = 12;
export const ADAR_II = 13;

/** Fixed day 1 (Monday, 1 January of year 1) is this many days before 1 January 1970, the site's day 0. */
const FIXED_TO_DAY_NUMBER = 719_163;
/** The first day of the Hebrew calendar (Monday, 7 October 3761 BC, Julian) as a fixed day. */
const EPOCH = -1_373_427;

const mod = (a: number, b: number): number => ((a % b) + b) % b;

/** Seven leap years (with Adar II) in every nineteen. */
export const isLeapYear = (year: number): boolean => mod(7 * year + 1, 19) < 7;

/** Days from the epoch to the molad of Tishri, moved a day when Rosh Hashanah would fall on a Sunday, Wednesday or Friday. */
function elapsedDays(year: number): number {
  const monthsElapsed = Math.floor((235 * year - 234) / 19);
  const partsElapsed = 12_084 + 13_753 * monthsElapsed;
  const days = 29 * monthsElapsed + Math.floor(partsElapsed / 25_920);
  return mod(3 * (days + 1), 7) < 3 ? days + 1 : days;
}

/** The other postponements: a year may not be 356 days long, nor the one before it 382. */
function yearLengthCorrection(year: number): number {
  const before = elapsedDays(year - 1);
  const now = elapsedDays(year);
  const after = elapsedDays(year + 1);
  if (after - now === 356) return 2;
  if (now - before === 382) return 1;
  return 0;
}

/** 1 Tishri of the year, as a fixed day. */
const newYear = (year: number): number => EPOCH + elapsedDays(year) + yearLengthCorrection(year);

const daysInYear = (year: number): number => newYear(year + 1) - newYear(year);

/** 29 or 30: Heshvan and Kislev vary with the length of the year, Adar with leap years. */
export function daysInMonth(month: number, year: number): number {
  const length = daysInYear(year);
  if ([2, 4, 6, 10, 13].includes(month)) return 29;
  if (month === ADAR && !isLeapYear(year)) return 29;
  if (month === 8 && length % 10 !== 5) return 29;
  if (month === KISLEV && length % 10 === 3) return 29;
  return 30;
}

/**
 * A Hebrew date as the site's day number (days since 1 January 1970). The year starts at Tishri, so months 7 to the
 * last are counted first, then Nisan onward.
 */
export function hebrewToDayNumber(year: number, month: number, day: number): number {
  const lastMonth = isLeapYear(year) ? ADAR_II : ADAR;
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > lastMonth || day < 1 || day > 30) {
    throw new Error(`hebrew: no such date, year ${year} month ${month} day ${day} (months 1 to ${lastMonth})`);
  }
  let fixed = newYear(year) + day - 1;
  if (month < TISHRI) {
    for (let m = TISHRI; m <= lastMonth; m++) fixed += daysInMonth(m, year);
    for (let m = NISAN; m < month; m++) fixed += daysInMonth(m, year);
  } else {
    for (let m = TISHRI; m < month; m++) fixed += daysInMonth(m, year);
  }
  return fixed - FIXED_TO_DAY_NUMBER;
}

/** Purim's month: Adar, or Adar II in a leap year. */
export const purimMonth = (year: number): number => (isLeapYear(year) ? ADAR_II : ADAR);
