// The holy days' dates against fixed reference dates from two independent libraries (pyluach 2.2.0 for the Hebrew
// calendar, python-dateutil 2.9 for both Easters), and the calendar's own rules checked for every year 1583–9999. The
// browser's own Hebrew calendar is not used: it is wrong in some years (1 Tishri 5462 is 3 October 1701, not the 4th).
import { describe, expect, it } from "vitest";
import { weekday, fromDayNumber } from "@/pages/countdowns/calendar";
import {
  comingUp, dayKey, FIRST_YEAR, holyDaysInYear, LAST_YEAR, orthodoxEaster, parseYear, TRADITIONS, westernEaster,
  type HolyDay, type HolyDayKey,
} from "./dates";
import { hebrewToDayNumber, isLeapYear, KISLEV, NISAN, purimMonth, SIVAN, TISHRI } from "./hebrew";

// pyluach: Purim, 15 Nisan, 6 Sivan, 1 Tishri, 10 Tishri, 15 Tishri, 25 Kislev (Kislev of the Hebrew year that starts that autumn).
const HEBREW_REFERENCE: Record<number, string[]> = {
  1583: ["1583-03-08", "1583-04-07", "1583-05-27", "1583-09-17", "1583-09-26", "1583-10-01", "1583-12-10"],
  1600: ["1600-02-29", "1600-03-30", "1600-05-19", "1600-09-09", "1600-09-18", "1600-09-23", "1600-12-01"],
  1700: ["1700-03-05", "1700-04-04", "1700-05-24", "1700-09-14", "1700-09-23", "1700-09-28", "1700-12-06"],
  1701: ["1701-03-24", "1701-04-23", "1701-06-12", "1701-10-03", "1701-10-12", "1701-10-17", "1701-12-26"],
  1799: ["1799-03-21", "1799-04-20", "1799-06-09", "1799-09-30", "1799-10-09", "1799-10-14", "1799-12-23"],
  1800: ["1800-03-11", "1800-04-10", "1800-05-30", "1800-09-20", "1800-09-29", "1800-10-04", "1800-12-12"],
  1900: ["1900-03-15", "1900-04-14", "1900-06-03", "1900-09-24", "1900-10-03", "1900-10-08", "1900-12-17"],
  1950: ["1950-03-03", "1950-04-02", "1950-05-22", "1950-09-12", "1950-09-21", "1950-09-26", "1950-12-04"],
  2000: ["2000-03-21", "2000-04-20", "2000-06-09", "2000-09-30", "2000-10-09", "2000-10-14", "2000-12-22"],
  2024: ["2024-03-24", "2024-04-23", "2024-06-12", "2024-10-03", "2024-10-12", "2024-10-17", "2024-12-26"],
  2025: ["2025-03-14", "2025-04-13", "2025-06-02", "2025-09-23", "2025-10-02", "2025-10-07", "2025-12-15"],
  2026: ["2026-03-03", "2026-04-02", "2026-05-22", "2026-09-12", "2026-09-21", "2026-09-26", "2026-12-05"],
  2027: ["2027-03-23", "2027-04-22", "2027-06-11", "2027-10-02", "2027-10-11", "2027-10-16", "2027-12-25"],
  2028: ["2028-03-12", "2028-04-11", "2028-05-31", "2028-09-21", "2028-09-30", "2028-10-05", "2028-12-13"],
  2050: ["2050-03-08", "2050-04-07", "2050-05-27", "2050-09-17", "2050-09-26", "2050-10-01", "2050-12-10"],
  2100: ["2100-03-25", "2100-04-24", "2100-06-13", "2100-10-04", "2100-10-13", "2100-10-18", "2100-12-27"],
  2200: ["2200-03-02", "2200-04-01", "2200-05-21", "2200-09-11", "2200-09-20", "2200-09-25", "2200-12-03"],
  2500: ["2500-03-16", "2500-04-15", "2500-06-04", "2500-09-25", "2500-10-04", "2500-10-09", "2500-12-18"],
  3000: ["3000-03-13", "3000-04-12", "3000-06-01", "3000-09-22", "3000-10-01", "3000-10-06", "3000-12-14"],
  4000: ["4000-04-02", "4000-05-02", "4000-06-21", "4000-10-12", "4000-10-21", "4000-10-26", "4001-01-03"],
};

// python-dateutil: [Western Easter, Orthodox Easter].
const EASTER_REFERENCE: Record<number, [string, string]> = {
  1583: ["1583-04-10", "1583-04-10"], 1700: ["1700-04-11", "1700-04-11"], 1800: ["1800-04-13", "1800-04-20"],
  1900: ["1900-04-15", "1900-04-22"], 2000: ["2000-04-23", "2000-04-30"], 2024: ["2024-03-31", "2024-05-05"],
  2025: ["2025-04-20", "2025-04-20"], 2026: ["2026-04-05", "2026-04-12"], 2027: ["2027-03-28", "2027-05-02"],
  2028: ["2028-04-16", "2028-04-16"], 2029: ["2029-04-01", "2029-04-08"], 2030: ["2030-04-21", "2030-04-28"],
  2050: ["2050-04-10", "2050-04-17"], 2100: ["2100-03-28", "2100-05-02"], 2101: ["2101-04-17", "2101-04-24"],
  2200: ["2200-04-06", "2200-04-06"], 2500: ["2500-04-18", "2500-04-25"], 3000: ["3000-04-13", "3000-04-20"],
  4099: ["4099-04-19", "4099-05-03"],
};

const date = (text: string) => {
  const [year, month, day] = text.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};
const years = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, index) => FIRST_YEAR + index);
const first = (days: HolyDay[], key: HolyDayKey) => days.find((day) => day.key === key);

describe("the Hebrew calendar", () => {
  it("matches the reference dates, including years the browser's own Hebrew calendar gets wrong", () => {
    const wrong: string[] = [];
    for (const [yearText, expected] of Object.entries(HEBREW_REFERENCE)) {
      const year = Number(yearText);
      const spring = year + 3760, autumn = year + 3761;
      const got = [
        hebrewToDayNumber(spring, purimMonth(spring), 14), hebrewToDayNumber(spring, NISAN, 15), hebrewToDayNumber(spring, SIVAN, 6),
        hebrewToDayNumber(autumn, TISHRI, 1), hebrewToDayNumber(autumn, TISHRI, 10), hebrewToDayNumber(autumn, TISHRI, 15),
        hebrewToDayNumber(autumn, KISLEV, 25),
      ].map(dayKey);
      if (got.join() !== expected.join()) wrong.push(`${year}: ${got.join()} expected ${expected.join()}`);
    }
    expect(wrong).toEqual([]);
  });

  it("keeps the weekday rules in every year 1583–9999", () => {
    const wrong: string[] = [];
    const allowed = (n: number, days: number[], what: string) => {
      const day = weekday(fromDayNumber(n));
      if (!days.includes(day)) wrong.push(`${what} on weekday ${day} (${dayKey(n)})`);
    };
    for (const year of years) {
      allowed(hebrewToDayNumber(year + 3761, TISHRI, 1), [1, 2, 4, 6], "Rosh Hashanah");
      allowed(hebrewToDayNumber(year + 3761, TISHRI, 10), [1, 3, 4, 6], "Yom Kippur");
      allowed(hebrewToDayNumber(year + 3760, NISAN, 15), [0, 2, 4, 6], "Passover");
      const length = hebrewToDayNumber(year + 3761, TISHRI, 1) - hebrewToDayNumber(year + 3760, TISHRI, 1);
      const valid = isLeapYear(year + 3760) ? [383, 384, 385] : [353, 354, 355];
      if (!valid.includes(length)) wrong.push(`Hebrew year ${year + 3760} is ${length} days long`);
    }
    expect(wrong).toEqual([]);
  });

  it("refuses a month the year does not have", () => {
    expect(() => hebrewToDayNumber(5785, 13, 1)).toThrow(/no such date/);
    expect(hebrewToDayNumber(5784, 13, 14)).toBe(date("2024-03-24"));
  });
});

describe("Easter, Western and Orthodox", () => {
  it("matches the reference dates", () => {
    for (const [year, [western, orthodox]] of Object.entries(EASTER_REFERENCE)) {
      expect(dayKey(westernEaster(Number(year))), `Western ${year}`).toBe(western);
      expect(dayKey(orthodoxEaster(Number(year))), `Orthodox ${year}`).toBe(orthodox);
    }
  });

  it("is always a Sunday, the Orthodox never before the Western, in every year", () => {
    const wrong: string[] = [];
    for (const year of years) {
      const western = westernEaster(year), orthodox = orthodoxEaster(year);
      if (weekday(fromDayNumber(western)) !== 0 || weekday(fromDayNumber(orthodox)) !== 0) wrong.push(`${year}: not a Sunday`);
      if (orthodox < western) wrong.push(`${year}: Orthodox before Western`);
      const { month, day } = fromDayNumber(western);
      if (month * 100 + day < 322 || month * 100 + day > 425) wrong.push(`${year}: Western Easter ${dayKey(western)}`);
    }
    expect(wrong).toEqual([]);
  });
});

describe("a year's holy days", () => {
  it("dates 2026 as the churches and the Jewish calendar do", () => {
    const days = holyDaysInYear(2026);
    const at = (key: HolyDayKey) => dayKey(first(days, key)!.start);
    expect(at("ash-wednesday")).toBe("2026-02-18");
    expect(at("palm-sunday")).toBe("2026-03-29");
    expect(at("good-friday")).toBe("2026-04-03");
    expect(at("easter")).toBe("2026-04-05");
    expect(at("ascension")).toBe("2026-05-14");
    expect(at("pentecost")).toBe("2026-05-24");
    expect(at("advent")).toBe("2026-11-29");
    expect(at("clean-monday")).toBe("2026-02-23");
    expect(at("pascha")).toBe("2026-04-12");
    expect(at("orthodox-pentecost")).toBe("2026-05-31");
    expect(at("orthodox-christmas")).toBe("2026-01-07");
    expect(at("firstfruits")).toBe("2026-04-03");
    expect(dayKey(first(days, "tabernacles")!.end!)).toBe("2026-10-03");
  });

  it("dates Christmas in the Julian-calendar churches from the year before", () => {
    const christmas = (year: number) => holyDaysInYear(year).filter((day) => day.key === "orthodox-christmas").map((day) => dayKey(day.start));
    expect(christmas(1583)).toEqual(["1583-01-04"]);
    expect(christmas(1700)).toEqual(["1700-01-04"]);
    expect(christmas(2099)).toEqual(["2099-01-07"]);
    expect(christmas(2100)).toEqual(["2100-01-07"]);
    expect(christmas(2101)).toEqual(["2101-01-08"]);
    expect(christmas(9999)).toEqual(["9999-03-08"]);
  });

  it("keeps a feast that runs into January in the year it begins", () => {
    const dedication = first(holyDaysInYear(2024), "dedication")!;
    expect(dayKey(dedication.start)).toBe("2024-12-26");
    expect(dayKey(dedication.end!)).toBe("2025-01-02");
    expect(holyDaysInYear(2025).filter((day) => day.key === "dedication").map((day) => dayKey(day.start))).toEqual(["2025-12-15"]);
  });

  it("gives every day once, sorted, inside its year, with unique ids, in every year 1583–9999", () => {
    const wrong: string[] = [];
    const once: HolyDayKey[] = ["epiphany", "easter", "pentecost", "advent", "christmas", "pascha", "clean-monday", "passover", "weeks", "trumpets", "atonement", "tabernacles", "purim"];
    let twice = 0;
    for (const year of years) {
      const days = holyDaysInYear(year);
      for (const key of once) if (days.filter((day) => day.key === key).length !== 1) wrong.push(`${year}: ${key}`);
      const dedications = days.filter((day) => day.key === "dedication").length;
      if (dedications === 2) twice++;
      // From about 3030 the drift can carry one Hanukkah past 31 December and leave a year with none (it begins on 13 December 3030, then on 1 January 3032, so none in 3031).
      if (dedications < 1 && year < 3000) wrong.push(`${year}: no Hanukkah`);
      if (new Set(days.map((day) => day.id)).size !== days.length) wrong.push(`${year}: repeated id`);
      days.forEach((day, index) => {
        if (fromDayNumber(day.start).year !== year) wrong.push(`${year}: ${day.id} outside the year`);
        const before = days[index - 1];
        if (before && (before.start > day.start || (before.start === day.start && TRADITIONS.indexOf(before.tradition) > TRADITIONS.indexOf(day.tradition)))) wrong.push(`${year}: order at ${day.id}`);
      });
    }
    expect(wrong.slice(0, 10)).toEqual([]);
    expect(twice).toBeGreaterThan(0);
  });

  it("keeps the two Easters in a fixed order when they fall together", () => {
    const days = holyDaysInYear(2025);
    const index = (key: HolyDayKey) => days.findIndex((day) => day.key === key);
    expect(days[index("easter")].start).toBe(days[index("pascha")].start);
    expect(index("easter")).toBeLessThan(index("pascha"));
  });

  it("refuses a year outside the range", () => {
    expect(() => holyDaysInYear(1582)).toThrow(/outside/);
    expect(() => holyDaysInYear(10000)).toThrow(/outside/);
  });
});

describe("reading the year from the address", () => {
  it("takes exactly four digits within 1583–9999", () => {
    expect(parseYear("2027")).toBe(2027);
    expect(parseYear("1583")).toBe(1583);
    expect(parseYear("9999")).toBe(9999);
    for (const bad of [null, "", "1582", "0999", "2027abc", " 2027", "2e3", "0x7EB", "2027.5", "-2027", "20270"]) expect(parseYear(bad)).toBeNull();
  });
});

describe("what is coming up", () => {
  const all = new Set(TRADITIONS);
  it("says today, under way or ahead, and looks into next year", () => {
    expect(comingUp(date("2026-04-05"), all)).toMatchObject({ state: "today", day: { key: "easter" } });
    expect(comingUp(date("2025-01-01"), new Set(["feast"]))).toMatchObject({ state: "under-way", dayOf: 7, days: 8, day: { key: "dedication" } });
    expect(comingUp(date("2026-12-27"), new Set(["western"]))).toMatchObject({ state: "ahead", inDays: 10, day: { key: "epiphany" } });
  });

  it("follows the traditions shown", () => {
    expect(comingUp(date("2026-04-06"), new Set(["orthodox"]))).toMatchObject({ state: "ahead", inDays: 6, day: { key: "pascha" } });
  });
});
