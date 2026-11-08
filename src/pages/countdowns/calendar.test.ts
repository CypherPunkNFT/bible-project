// The church-calendar module (design 2.6, 8.3 "Calendar"): the verified dates, agreement with Bible Wordle's Easter for
// every year 1900–2200, strict date reading, and day arithmetic across month ends, year ends and 29 February.
import { describe, expect, it } from "vitest";
import { easterDate } from "@/pages/games/wordle/daily-rules";
import { dateKey, dayNumber, easterSunday, fromDayNumber, nthWeekday, parseDateKey, sundayOnOrAfter, weekday } from "./calendar";

const key = (date: { year: number; month: number; day: number }) => dateKey(date);
const plus = (text: string, days: number) => key(fromDayNumber(dayNumber(parseDateKey(text)!) + days));

describe("countdowns: the calendar", () => {
  it("finds Easter on the dates verified in the design", () => {
    const expected: Record<number, string> = {
      2008: "2008-03-23", 2019: "2019-04-21", 2024: "2024-03-31", 2025: "2025-04-20", 2026: "2026-04-05", 2027: "2027-03-28",
      2028: "2028-04-16", 2029: "2029-04-01", 2030: "2030-04-21", 2038: "2038-04-25", 2285: "2285-03-22",
    };
    for (const [year, date] of Object.entries(expected)) expect(key(easterSunday(Number(year))), year).toBe(date);
  });

  it("agrees with Bible Wordle's Easter for every year 1900–2200", () => {
    for (let year = 1900; year <= 2200; year++) expect(key(easterSunday(year)), String(year)).toBe(easterDate(year));
  });

  it("keeps Easter between March 22 and April 25 and on a Sunday", () => {
    for (let year = 1900; year <= 2200; year++) {
      const easter = easterSunday(year);
      expect(weekday(easter)).toBe(0);
      const md = easter.month * 100 + easter.day;
      expect(md >= 322 && md <= 425, String(year)).toBe(true);
    }
  });

  it("finds Advent Sunday, Ash Wednesday, Ascension, Pentecost and Thanksgiving", () => {
    expect(key(sundayOnOrAfter(2022, 11, 27))).toBe("2022-11-27");
    expect(key(sundayOnOrAfter(2025, 11, 27))).toBe("2025-11-30");
    expect(key(sundayOnOrAfter(2026, 11, 27))).toBe("2026-11-29");
    expect(key(sundayOnOrAfter(2027, 11, 27))).toBe("2027-11-28");
    expect(key(sundayOnOrAfter(2028, 11, 27))).toBe("2028-12-03");
    expect(plus(key(easterSunday(2096)), -46)).toBe("2096-02-29");
    expect(plus(key(easterSunday(2027)), -46)).toBe("2027-02-10");
    expect(plus(key(easterSunday(2027)), 39)).toBe("2027-05-06");
    expect(plus(key(easterSunday(2027)), 49)).toBe("2027-05-16");
    expect(key(nthWeekday(2026, 11, 4, 4))).toBe("2026-11-26");
  });

  it("reads dates strictly, as calendar dates between 1900 and 2200", () => {
    expect(parseDateKey("2027-06-12")).toEqual({ year: 2027, month: 6, day: 12 });
    expect(parseDateKey("2028-02-29")).toEqual({ year: 2028, month: 2, day: 29 });
    for (const bad of ["2027-02-30", "2027-2-3", "2201-01-01", "1899-12-31", "2027-13-01", "2027-00-10", "2027-06-12T00:00", "soon", "", "2027-02-29"]) {
      expect(parseDateKey(bad), bad).toBeNull();
    }
  });

  it("adds days across month ends, year ends and 29 February", () => {
    expect(plus("2026-01-31", 1)).toBe("2026-02-01");
    expect(plus("2026-12-31", 1)).toBe("2027-01-01");
    expect(plus("2028-02-28", 1)).toBe("2028-02-29");
    expect(plus("2028-02-29", 1)).toBe("2028-03-01");
    expect(plus("2027-02-28", 1)).toBe("2027-03-01");
    expect(plus("2027-03-01", -1)).toBe("2027-02-28");
    expect(weekday({ year: 2026, month: 12, day: 25 })).toBe(5);
  });
});
