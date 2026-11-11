// The plan itself (design 3 and 10): reading dates, day counts for each kind of pace, the balanced split, labels, times,
// and the words file it all rests on.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dayNumber, parseDateKey, weekday, fromDayNumber } from "@/pages/countdowns/calendar";
import type { Catalog } from "@/lib/types";
import WORDS from "@/data/reading-planner/chapter-words.json";
import { balancedSplit, buildPlan, chosenChapters, evenSplit, MAX_SPAN_DAYS, planSignature, readingSignature, WORDS_PER_PAGE, type ChapterWords, type Plan, type PlanSettings } from "./planner";
import { dayLabel, duration } from "./text";

const words = WORDS as ChapterWords;
const ALL = Object.keys(words);
const day = (key: string) => dayNumber(parseDateKey(key)!);
const base: PlanSettings = {
  books: ALL, mode: "finish", start: "2027-01-01", finish: "2027-12-31", pace: 3, unit: "chapters", weekdays: [0, 1, 2, 3, 4, 5, 6], speed: 200,
};
function planOf(change: Partial<PlanSettings>): Plan {
  const result = buildPlan({ ...base, ...change }, words);
  if (!result.ok) throw new Error(`expected a plan, got ${result.error}`);
  return result.plan;
}
const errorOf = (change: Partial<PlanSettings>) => {
  const result = buildPlan({ ...base, ...change }, words);
  return result.ok ? null : result.error;
};

/** Every chapter once, in order, each day a non-empty run, days numbered from 1 on rising dates. */
function expectSound(plan: Plan) {
  let next = 0;
  plan.days.forEach((d, i) => {
    expect(d.n).toBe(i + 1);
    expect(d.first).toBe(next);
    expect(d.last).toBeGreaterThanOrEqual(d.first);
    if (i > 0) expect(d.date).toBeGreaterThan(plan.days[i - 1].date);
    let sum = 0;
    for (let c = d.first; c <= d.last; c++) sum += plan.chapters[c].words;
    expect(d.words).toBe(sum);
    next = d.last + 1;
  });
  expect(next).toBe(plan.chapters.length);
}

describe("words per chapter", () => {
  it("covers the 66 books and 1,189 chapters of the catalogue, in Bible order", () => {
    const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8")) as Catalog;
    expect(ALL).toEqual(catalog.books.filter((book) => book.num <= 66).sort((a, b) => a.num - b.num).map((book) => book.code));
    expect(Object.values(words).flat()).toHaveLength(1189);
    expect(words.PSA).toHaveLength(150);
    expect(words.OBA).toHaveLength(1);
    for (const count of Object.values(words).flat()) expect(count).toBeGreaterThan(0);
  });

  it.runIf(existsSync("data/plain/bsb/GEN.json"))("matches a fresh count of the Berean text", () => {
    expect(() => execFileSync(process.execPath, ["scripts/build-reading-planner-words.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
});

describe("a plan by finish date", () => {
  it("reads the whole Bible in a year, every chapter once, in order", () => {
    const plan = planOf({});
    expect(plan.days).toHaveLength(365);
    expect(plan.days[0].date).toBe(day("2027-01-01"));
    expect(plan.days[364].date).toBe(day("2027-12-31"));
    expectSound(plan);
  });

  it("balances the days by reading time: no day over twice the average unless it is one chapter", () => {
    const plan = planOf({});
    const average = plan.totalWords / plan.days.length;
    for (const d of plan.days) if (d.first !== d.last) expect(d.words).toBeLessThanOrEqual(2 * average);
  });

  it("reads only on the ticked weekdays", () => {
    const plan = planOf({ weekdays: [1, 3, 5] });
    for (const d of plan.days) expect([1, 3, 5]).toContain(weekday(fromDayNumber(d.date)));
    expect(plan.days.length).toBe(157); // 2027 has 52 Mondays, 52 Wednesdays and 53 Fridays (it starts on a Friday)
    expectSound(plan);
  });

  it("gives one chapter a day and finishes early when there are more days than chapters", () => {
    const plan = planOf({ books: ["JUD", "PHM", "OBA"], finish: "2027-01-31" });
    expect(plan.days.map((d) => d.last - d.first + 1)).toEqual([1, 1, 1]);
    expect(plan.days[2].date).toBe(day("2027-01-03"));
  });

  it("splits the Psalms over exactly 150 days, one psalm each, whatever their length", () => {
    const plan = planOf({ books: ["PSA"], finish: "2027-05-30" });
    expect(plan.days).toHaveLength(150);
    for (const d of plan.days) expect(d.first).toBe(d.last);
  });

  it("allows a plan of one day (finish on the start day)", () => {
    const plan = planOf({ books: ["RUT"], finish: "2027-01-01" });
    expect(plan.days).toHaveLength(1);
    expect(plan.days[0].last).toBe(3);
  });

  it("says why there is no plan", () => {
    expect(errorOf({ books: [] })).toBe("no-books");
    expect(errorOf({ books: ["XYZ"] })).toBe("no-books");
    expect(errorOf({ start: "" })).toBe("bad-start");
    expect(errorOf({ finish: "2027-02-30" })).toBe("bad-finish");
    expect(errorOf({ finish: "2026-12-31" })).toBe("finish-before-start");
    expect(errorOf({ weekdays: [] })).toBe("no-weekdays");
    // 1 January 2027 is a Friday: a one-day span with only Monday ticked has no reading day.
    expect(errorOf({ finish: "2027-01-01", weekdays: [1] })).toBe("no-days-in-span");
    expect(errorOf({ finish: "2040-01-02" })).toBe("too-long");
  });
});

describe("a plan at a pace", () => {
  it("keeps a chapter pace exactly, the last day taking what is left", () => {
    const plan = planOf({ mode: "pace", books: ["GEN"], pace: 4 });
    expect(plan.days).toHaveLength(13);
    expect(plan.days.map((d) => d.last - d.first + 1)).toEqual([...Array(12).fill(4), 2]);
    expectSound(plan);
  });

  it("works out the days from minutes at the reading speed", () => {
    const plan = planOf({ mode: "pace", unit: "minutes", pace: 15, speed: 200 });
    expect(plan.days).toHaveLength(Math.ceil(plan.totalWords / (15 * 200)));
    expectSound(plan);
    const slower = planOf({ mode: "pace", unit: "minutes", pace: 15, speed: 150 });
    expect(slower.days.length).toBeGreaterThan(plan.days.length);
  });

  it("works out the days from pages", () => {
    const plan = planOf({ mode: "pace", unit: "pages", pace: 4 });
    expect(plan.days).toHaveLength(Math.ceil(plan.totalWords / (4 * WORDS_PER_PAGE)));
    expectSound(plan);
  });

  it("fits a pace bigger than the whole selection into one day", () => {
    expect(planOf({ mode: "pace", books: ["JUD"], pace: 50 }).days).toHaveLength(1);
    expect(planOf({ mode: "pace", unit: "minutes", books: ["RUT"], pace: 999 }).days).toHaveLength(1);
  });

  it("refuses a pace that is not a whole number from 1 to 999, and a plan over ten years", () => {
    for (const pace of [0, -1, 1.5, 1000, NaN]) expect(errorOf({ mode: "pace", pace })).toBe("bad-pace");
    // One chapter on Sundays only: 1,189 weeks is about 23 years.
    expect(errorOf({ mode: "pace", pace: 1, weekdays: [0] })).toBe("too-long");
  });

  it("never runs a plan beyond ten years of calendar days", () => {
    const plan = planOf({ mode: "pace", pace: 1, weekdays: [0, 1, 2, 3, 4, 5, 6] });
    expect(plan.days).toHaveLength(1189);
    expect(plan.days[1188].date - plan.days[0].date).toBeLessThanOrEqual(MAX_SPAN_DAYS);
  });
});

describe("the split", () => {
  it("gives exactly the days asked for, none empty, even after a very long chapter", () => {
    const weights = [10, 10, 1000, 10, 10, 10, 10];
    const split = balancedSplit(weights, 5);
    expect(new Set(split).size).toBe(5);
    for (let i = 1; i < split.length; i++) expect(split[i] - split[i - 1]).toBeGreaterThanOrEqual(0);
    for (let i = 1; i < split.length; i++) expect(split[i] - split[i - 1]).toBeLessThanOrEqual(1);
  });

  it("gives one item a day when the days equal the items, and copes with no weight at all", () => {
    expect(balancedSplit([5, 1, 900, 2], 4)).toEqual([0, 1, 2, 3]);
    expect(balancedSplit([0, 0, 0, 0], 2)).toEqual([0, 0, 1, 1]);
    expect(evenSplit(5, 2)).toEqual([0, 0, 1, 1, 2]);
  });

  it("orders the chosen books as the Bible does, whatever order they were ticked in", () => {
    expect([...new Set(chosenChapters(["REV", "GEN", "RUT"], words).map((c) => c.book))]).toEqual(["GEN", "RUT", "REV"]);
  });
});

describe("identities", () => {
  it("names the same plan the same way, and a different split differently", () => {
    expect(planSignature(planOf({}))).toBe(planSignature(planOf({})));
    expect(planSignature(planOf({}))).not.toBe(planSignature(planOf({ finish: "2027-12-30" })));
    expect(planSignature(planOf({}))).toMatch(/^[0-9a-f]{8}$/);
  });

  it("keeps the calendar identity when only the pace changes", () => {
    const slow: PlanSettings = { ...base, mode: "pace", pace: 3 };
    const fast: PlanSettings = { ...base, mode: "pace", pace: 7, books: [...ALL].reverse() };
    expect(readingSignature(slow)).toBe(readingSignature(fast));
    expect(readingSignature(base)).not.toBe(readingSignature({ ...base, start: "2027-01-02" }));
  });
});

describe("labels and times", () => {
  const names: Record<string, string> = { GEN: "Genesis", EXO: "Exodus", MAT: "Matthew", JUD: "Jude", PSA: "Psalms" };
  const name = (code: string) => names[code] ?? code;
  const label = (books: string[], pace: number, n: number) => {
    const plan = planOf({ mode: "pace", books, pace });
    return dayLabel(plan, plan.days[n - 1], name, words);
  };

  it("writes a day's chapters within a book, across books, alone, and for a one-chapter book", () => {
    expect(label(["GEN"], 3, 1)).toBe("Genesis 1–3");
    expect(label(["GEN", "EXO"], 3, 17)).toBe("Genesis 49 – Exodus 1");
    expect(label(["GEN"], 1, 5)).toBe("Genesis 5");
    expect(label(["JUD"], 1, 1)).toBe("Jude");
  });

  it("never joins books that were not chosen in between", () => {
    expect(label(["GEN", "MAT"], 3, 17)).toBe("Genesis 49–50; Matthew 1");
  });

  it("writes times short and long", () => {
    expect(duration(0.3)).toBe("Under a minute");
    expect(duration(12.4)).toBe("12 min");
    expect(duration(80)).toBe("1 hr 20 min");
    expect(duration(120)).toBe("2 hr");
    expect(duration(4356, "long")).toBe("72 hours, 36 minutes");
  });
});
