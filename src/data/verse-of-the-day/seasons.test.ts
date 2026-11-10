// Advent and Lent in the widget agree with the Countdowns (docs/features/verse-widget/design.md 10, "Seasons agree with
// Countdowns"). The design named 2026–2029; a schedule runs only three years from its build date, so the test takes every
// Advent and Lent run that lies wholly inside the schedule, which always includes both a November and a 1 December
// Advent start somewhere in three years, and checks the fixed days of every year it reaches.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OCCASIONS } from "@/data/countdowns";
import { dayNumber, easterSunday, fromDayNumber } from "@/pages/countdowns/calendar";
import { buildRun, targetIn } from "@/pages/countdowns/season";
import { seasonLabel, type Schedule } from "@/pages/verse-of-the-day/schedule";
import { FIXED_DAYS } from "./curation";
import { dayOfKey, keyOfDay, passageKey } from "./keys";

const schedule = JSON.parse(readFileSync("src/data/verse-of-the-day/schedule.json", "utf8")) as Schedule;
const first = dayOfKey(schedule.epoch);
const last = dayOfKey(schedule.lastDate);
const frozenThrough = dayOfKey(schedule.frozenThrough);
const years = Array.from({ length: fromDayNumber(last).year - fromDayNumber(first).year + 2 }, (_, index) => fromDayNumber(first).year + index);

function runsInside(slug: string) {
  const occasion = OCCASIONS.find((item) => item.slug === slug)!;
  return years.map((year) => buildRun(occasion, targetIn(occasion, year), OCCASIONS))
    .filter((run) => run.entries[0].n > first && run.entries[run.entries.length - 1].n < last)
    .map((run) => ({ occasion, run }));
}

describe("verse of the day: the seasons follow the Countdowns", () => {
  for (const slug of ["advent", "lent"]) {
    it(`gives every ${slug} day that day's card verse, link and label, and not the days either side`, () => {
      const runs = runsInside(slug);
      expect(runs.length, `no whole ${slug} run inside the schedule`).toBeGreaterThanOrEqual(2);
      for (const { occasion, run } of runs) {
        for (const entry of run.entries) {
          const date = keyOfDay(entry.n);
          expect(schedule.days[date], date).toEqual({
            passage: passageKey(entry.day.card),
            season: { label: seasonLabel(occasion, entry.day), link: `/countdowns/${slug}/${entry.day.key}`, linkText: "Read today's reading" },
          });
        }
        for (const n of [run.entries[0].n - 1, run.entries[run.entries.length - 1].n + 1]) {
          expect(typeof schedule.days[keyOfDay(n)], `${keyOfDay(n)}, beside ${run.id}`).toBe("string");
        }
      }
    });
  }

  it("names days as the Countdowns pages do", () => {
    const labels = Object.values(schedule.days).flatMap((day) => (typeof day !== "string" && "season" in day ? [day.season.label] : []));
    for (const label of ["Advent, December 12", "Christmas Eve", "Christmas Day", "Ash Wednesday", "Good Friday", "Easter Day"]) expect(labels, label).toContain(label);
    expect(labels.some((label) => /^Lent, Day \d+$/.test(label))).toBe(true);
    expect(labels.some((label) => /Day \d+ of Advent/.test(label))).toBe(false);
  });

  it("covers an Advent that starts in November and one that starts on 1 December", () => {
    const starts = runsInside("advent").map(({ run }) => fromDayNumber(run.entries[0].n).month);
    expect(starts).toContain(11);
    expect(starts).toContain(12);
  });

  it("gives New Year's Day and Pentecost their fixed verses in every year the schedule reaches", () => {
    const passageOf = (key: string) => passageKey(FIXED_DAYS.find((day) => day.key === key)!.passage);
    for (const year of years) {
      const newYear = dayNumber({ year, month: 1, day: 1 });
      const pentecost = dayNumber(easterSunday(year)) + 49;
      // Days frozen from an earlier schedule keep what visitors saw, so only the days this build chose are checked.
      for (const [n, key] of [[newYear, "new-year"], [pentecost, "pentecost"]] as const) {
        if (n < first || n > last || n <= frozenThrough) continue;
        expect(schedule.days[keyOfDay(n)], `${key} ${keyOfDay(n)}`).toEqual({ passage: passageOf(key), fixed: key });
      }
    }
  });
});
