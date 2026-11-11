// The schedule (daily.json) and the fallback past its end, against every rule of design §6.2.
import answersFile from "@/data/wordle/answers.json";
import curationFile from "@/data/wordle/curation.json";
import scheduleFile from "@/data/wordle/daily.json";
import { createDaily, parseDateKey, type Answers } from "./daily";
import { REPEAT_DAYS, easterDate, extendPlan, makePlan, poolOf, scheduleProblems, type PoolWord, type WordleSchedule } from "./daily-rules";

const answers = answersFile as unknown as Answers;
const schedule = scheduleFile as unknown as WordleSchedule;
const curation = curationFile as unknown as { pins: Record<string, string>; easter?: string };
const all: PoolWord[] = Object.entries(answers).map(([word, entry]) => ({ word, category: entry.c, tier: entry.t }));
const byWord = new Map(all.map((word) => [word.word, word]));
const pool = poolOf(all.filter((word) => !answers[word.word].r));
const { year, month, day } = parseDateKey(schedule.epoch);
const indexOf = (date: string) => { const d = parseDateKey(date); return (Date.UTC(d.year, d.month - 1, d.day) - Date.UTC(year, month - 1, day)) / 86_400_000; };

/** The first days as they were at implementation (2026-11-07): frozen, so no rebuild may change them. */
const FROZEN_AT_LAUNCH = ["abhor", "thorn", "beach", "bribe", "knife", "surge", "viper", "chant", "curse", "chest", "exile", "juice", "sober", "bless", "night"];

describe("bible wordle schedule", () => {
  it("covers about three years from its first puzzle", () => {
    expect(schedule.epoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(schedule.days.length).toBeGreaterThanOrEqual(3 * 365);
  });

  it("keeps every rule on every day: no repeat within 300 days, names and tier-3 words spaced out, pins included", () => {
    expect(scheduleProblems(schedule.days, byWord)).toEqual([]);
  });

  it("puts each pin on its date (Christmas and every Easter Sunday inside the file)", () => {
    const pins = Object.entries(curation.pins).filter(([date]) => indexOf(date) >= schedule.frozenThrough && indexOf(date) < schedule.days.length);
    expect(pins.length).toBeGreaterThan(0);
    for (const [date, word] of pins) expect(schedule.days[indexOf(date)], date).toBe(word);
    for (const year of [2027, 2028, 2029]) expect(schedule.days[indexOf(easterDate(year))], `Easter ${year}`).toBe(curation.easter);
  });

  it("keeps the frozen first days exactly as they were at launch", () => {
    expect(schedule.days.slice(0, FROZEN_AT_LAUNCH.length)).toEqual(FROZEN_AT_LAUNCH);
  });

  it("carries on past the end of the file with the same rules for 400 more days, the same way every time", () => {
    const daily = createDaily(schedule, answers);
    const again = createDaily(schedule, answers);
    const end = schedule.days.length;
    const extended = [...schedule.days];
    for (let n = end + 1; n <= end + 400; n++) extended.push(daily.wordFor(n)!);
    expect(scheduleProblems(extended, byWord, end - REPEAT_DAYS)).toEqual([]);
    expect(again.wordFor(end + 400)).toBe(extended[end + 399]);
  });

  it("rebuilds a schedule cut short with exactly the days a browser would have worked out past its end", () => {
    const short = { ...schedule, days: schedule.days.slice(0, 500) };
    const browser = createDaily(short, answers);
    const shown = Array.from({ length: 60 }, (_, i) => browser.wordFor(501 + i));
    const plan = makePlan(short.days); // what scripts/build-wordle.ts does before freezing
    extendPlan(pool, plan, 560, short.days.length, byWord);
    expect(plan.days.slice(500, 560)).toEqual(shown);
  });

  it("finds Easter Sunday by the Gregorian computus", () => {
    expect([2026, 2027, 2028, 2029].map(easterDate)).toEqual(["2026-04-05", "2027-03-28", "2028-04-16", "2029-04-01"]);
  });

  it("numbers puzzles by calendar day from the epoch, and has none before #1", () => {
    const daily = createDaily({ epoch: "2026-11-07", builtOn: "2026-11-07", frozenThrough: 0, days: ["faith"] }, answers);
    expect(daily.numberOn(new Date(2026, 10, 7, 0, 0, 1))).toBe(1);
    expect(daily.numberOn(new Date(2026, 10, 7, 23, 59, 59))).toBe(1);
    expect(daily.numberOn(new Date(2026, 10, 8, 0, 0, 0))).toBe(2);
    expect(daily.numberOn(new Date(2026, 10, 6, 12))).toBe(0);
    expect(daily.dateOf(2).getDate()).toBe(8);
    expect(daily.wordFor(0)).toBeNull();
    expect(daily.wordFor(1)).toBe("faith");
  });
});
