// Windows, runs and states (design 6.2, 6.3, 8.3 "Coverage", "The engine on test data", "Which run is shown").
import { describe, expect, it } from "vitest";
import { OCCASIONS, occasionBySlug, type CountdownDay, type Occasion } from "@/data/countdowns";
import { p } from "@/data/countdowns/types";
import { dateKey, dayNumber, easterSunday, parseDateKey, weekday } from "./calendar";
import { buildRun, checkChosenDate, currentRun, dayHeading, dayLine, dayName, featuredEntry, panelDay, panelsOn, stateOf, targetIn } from "./season";
import { putMine, emptyRecord, toggleMineRead } from "./storage";

const advent = occasionBySlug("advent")!;
const lent = occasionBySlug("lent")!;
const holyWeek = occasionBySlug("holy-week")!;
const n = (text: string) => dayNumber(parseDateKey(text)!);

/** Every date of the window has exactly one entry, in order, and the target has one. */
function expectCovered(occasion: Occasion, year: number) {
  const run = buildRun(occasion, targetIn(occasion, year), OCCASIONS);
  const where = `${occasion.slug} ${year}`;
  expect(run.entries.map((entry) => entry.n), where).toEqual(Array.from({ length: run.last - run.first + 1 }, (_, index) => run.first + index));
  expect(run.entries.some((entry) => entry.n === run.targetN), where).toBe(true);
  return run;
}

describe("countdowns: every year's window, 1900–2200", () => {
  it("gives Advent one entry per date, 25 to 29 days, never starting after December 1, candles on Sundays or Christmas", () => {
    for (let year = 1900; year <= 2200; year++) {
      const run = expectCovered(advent, year);
      expect(run.entries.length, String(year)).toBeGreaterThanOrEqual(25);
      expect(run.entries.length, String(year)).toBeLessThanOrEqual(29);
      expect(run.first, String(year)).toBeLessThanOrEqual(n(`${year}-12-01`));
      for (const panel of advent.panels!) {
        const day = panelDay(run, panel);
        expect(day >= run.first && day <= run.last, `${panel.key} ${year}`).toBe(true);
        const date = run.entries.find((entry) => entry.n === day)!.date;
        expect(weekday(date) === 0 || dateKey(date) === `${year}-12-25`, `${panel.key} ${year}`).toBe(true);
      }
    }
  });

  it("gives Lent 47 entries from Ash Wednesday to Easter, with Sundays on Sundays", () => {
    for (let year = 1900; year <= 2200; year++) {
      const run = expectCovered(lent, year);
      expect(run.entries, String(year)).toHaveLength(47);
      expect(run.entries[0].day.key).toBe("day-1");
      expect(weekday(run.entries[0].date)).toBe(3);
      for (const entry of run.entries) expect(weekday(entry.date) === 0, `${entry.day.key} ${year}`).toBe(entry.day.key.startsWith("sunday") || entry.day.key === "easter");
    }
  });

  it("gives Holy Week Lent's last eight days in order, under Lent's run id", () => {
    for (let year = 1900; year <= 2200; year++) {
      const run = expectCovered(holyWeek, year);
      expect(run.entries.map((entry) => entry.day.key)).toEqual(["sunday-6", "day-35", "day-36", "day-37", "day-38", "day-39", "day-40", "easter"]);
      expect(run.id).toBe(`lent:${dateKey(easterSunday(year))}`);
    }
  });
});

describe("countdowns: Advent's changing length", () => {
  it("starts on November 27 with all four first days in 2022, and on December 1 in 2028 with the candle on the 3rd", () => {
    const early = buildRun(advent, targetIn(advent, 2022), OCCASIONS);
    expect(early.entries[0].day.key).toBe("nov-27");
    expect(early.entries).toHaveLength(29);
    const late = buildRun(advent, targetIn(advent, 2028), OCCASIONS);
    expect(late.entries[0].day.key).toBe("dec-01");
    expect(panelsOn(late, n("2028-12-03")).map((panel) => panel.key)).toEqual(["candle-1"]);
    // 2028: the fourth Sunday is Christmas Eve, which shows its reading and the candle of love together.
    expect(panelsOn(late, n("2028-12-24")).map((panel) => panel.key)).toEqual(["candle-4"]);
    expect(late.entries.find((entry) => entry.n === n("2028-12-24"))!.day.key).toBe("dec-24");
  });

  it("shows nov-29 and nov-30 but not nov-27 and nov-28 in 2026", () => {
    const keys = buildRun(advent, targetIn(advent, 2026), OCCASIONS).entries.map((entry) => entry.day.key);
    expect(keys.slice(0, 3)).toEqual(["nov-29", "nov-30", "dec-01"]);
  });
});

describe("countdowns: which run a page shows", () => {
  const show = (occasion: Occasion, today: string) => {
    const run = currentRun(occasion, n(today), OCCASIONS);
    return { target: dateKey(run.target), state: stateOf(run, n(today)), run };
  };

  it("follows Advent through the year", () => {
    expect(show(advent, "2026-11-01")).toMatchObject({ target: "2026-12-25", state: "coming-up" });
    expect(show(advent, "2026-12-12")).toMatchObject({ target: "2026-12-25", state: "counting" });
    expect(show(advent, "2026-12-25")).toMatchObject({ target: "2026-12-25", state: "the-day" });
    expect(show(advent, "2027-01-05")).toMatchObject({ target: "2026-12-25", state: "after" });
    expect(show(advent, "2027-01-06")).toMatchObject({ target: "2027-12-25", state: "coming-up" });
    expect(show(advent, "2027-07-04")).toMatchObject({ target: "2027-12-25", state: "coming-up" });
  });

  it("keeps Lent through Easter week, then moves to next year's", () => {
    expect(show(lent, "2027-02-10")).toMatchObject({ target: "2027-03-28", state: "counting" });
    expect(show(lent, "2027-04-04")).toMatchObject({ target: "2027-03-28", state: "after" });
    expect(show(lent, "2027-04-05")).toMatchObject({ target: "2028-04-16", state: "coming-up" });
  });

  it("keeps Holy Week coming up until Palm Sunday while Lent is counting down", () => {
    expect(show(holyWeek, "2027-03-01").state).toBe("coming-up");
    expect(show(lent, "2027-03-01").state).toBe("counting");
    expect(show(holyWeek, "2027-03-21").state).toBe("counting");
  });

  it("features today's entry, the first before the window and the target's afterwards", () => {
    const { run } = show(advent, "2026-12-12");
    expect(featuredEntry(run, n("2026-12-12")).day.key).toBe("dec-12");
    expect(featuredEntry(run, n("2026-11-01")).day.key).toBe("nov-29");
    expect(featuredEntry(run, n("2026-12-30")).day.key).toBe("dec-25");
  });

  it("writes the day line and heading from the entry, true whatever today is", () => {
    const { run } = show(advent, "2026-11-01");
    const entry = (key: string) => run.entries.find((item) => item.day.key === key)!;
    expect(dayLine(run, entry("dec-12"))).toBe("13 days until Christmas");
    expect(dayLine(run, entry("dec-24"))).toBe("1 day until Christmas");
    expect(dayLine(run, entry("dec-25"))).toBe("Christmas Day");
    expect(dayHeading(advent, entry("dec-12").day)).toBe(`Advent, December 12: ${entry("dec-12").day.title}`);
    const lentRun = show(lent, "2027-02-01").run;
    const day12 = lentRun.entries.find((item) => item.day.key === "day-12")!;
    expect(dayLine(lentRun, day12)).toBe("Day 12 of 40 · 33 days until Easter");
    expect(dayHeading(lent, day12.day)).toBe(`Lent, Day 12: ${day12.day.title}`);
    expect(dayName(lent, lentRun.entries.find((item) => item.day.key === "day-39")!.day)).toBe("Good Friday");
  });
});

// A chosen-date occasion with days after the target, written here rather than in the site's data (design 8.3).
const reading = p("PSA 27:14", "reading", "Wait for the Lord.");
const card = p("PSA 27:14", "card", "Wait for the Lord.");
const testDay = (key: string, at: CountdownDay["at"]): CountdownDay => ({ key, at, title: key, readings: [reading], card, reflection: "x", prayer: "Amen." });
const BABY: Occasion = {
  slug: "test-baby", name: "Baby", heading: "Test", summary: "Test", intro: "Test", targetName: "the due date",
  target: { kind: "chosen" }, start: { kind: "before", days: 30 }, afterDays: 3, maxAfter: 14, calendar: "doors", style: "plain", closing: "Done.",
  days: [
    ...Array.from({ length: 30 }, (_, index) => testDay(`d-${30 - index}`, { before: 30 - index })),
    testDay("the-day", { before: 0 }),
    ...Array.from({ length: 14 }, (_, index) => testDay(`after-${index + 1}`, { after: index + 1 })),
  ],
  topics: [], related: [],
};
const WEDDING: Occasion = { ...BABY, slug: "test-wedding", targetName: "the wedding", maxAfter: undefined, days: (BABY.days as CountdownDay[]).slice(0, 31) };

describe("countdowns: the engine on a chosen date", () => {
  const all = [...OCCASIONS, BABY, WEDDING];
  const target = parseDateKey("2027-06-12")!;
  const run = buildRun(BABY, target, all);

  it("covers 30 days to go, the day and 14 still-waiting days", () => {
    expect(run.entries).toHaveLength(45);
    expect(run.entries.map((entry) => entry.n)).toEqual(Array.from({ length: 45 }, (_, index) => run.first + index));
    expect(run.id).toBe("test-baby:2027-06-12");
  });

  it("starts partway through when the date is close", () => {
    expect(stateOf(run, n("2027-06-02"))).toBe("counting");
    expect(featuredEntry(run, n("2027-06-02")).day.key).toBe("d-10");
    expect(stateOf(run, n("2027-04-01"))).toBe("coming-up");
    expect(featuredEntry(run, n("2027-04-01")).day.key).toBe("d-30");
  });

  it("moves to still-waiting days after the date and stays on the last one", () => {
    expect(stateOf(run, n("2027-06-15"))).toBe("still-waiting");
    expect(featuredEntry(run, n("2027-06-15")).day.key).toBe("after-3");
    expect(dayLine(run, featuredEntry(run, n("2027-06-15")))).toBe("3 days after the due date");
    expect(featuredEntry(run, n("2027-07-20")).day.key).toBe("after-14");
    expect(stateOf(run, n("2027-07-20"))).toBe("still-waiting");
  });

  it("finishes an ordinary personal countdown three days after its date", () => {
    const wedding = buildRun(WEDDING, target, all);
    expect(wedding.entries).toHaveLength(31);
    expect(stateOf(wedding, n("2027-06-12"))).toBe("the-day");
    expect(stateOf(wedding, n("2027-06-15"))).toBe("after");
    expect(stateOf(wedding, n("2027-06-16"))).toBe("finished");
    expect(featuredEntry(wedding, n("2027-06-14")).day.key).toBe("the-day");
  });

  it("refuses impossible dates and dates more than two years ahead, and accepts past ones", () => {
    const today = n("2026-11-07");
    expect(checkChosenDate(parseDateKey("2027-02-30"), today).ok).toBe(false);
    expect(checkChosenDate(parseDateKey("2029-06-12"), today)).toEqual({ ok: false, reason: "Choose a date within the next two years." });
    expect(checkChosenDate(parseDateKey("2028-06-12"), today).ok).toBe(true);
    expect(checkChosenDate(parseDateKey("2026-10-01"), today).ok).toBe(true);
  });

  it("keeps a personal countdown's ticks when its date moves", () => {
    let record = putMine(emptyRecord(), { id: "abc123", occasion: "test-wedding", date: "2027-06-12", name: "" })!;
    record = toggleMineRead(record, "abc123", "d-30");
    record = putMine(record, { id: "abc123", occasion: "test-wedding", date: "2027-07-10", name: "" })!;
    expect(record.mine).toEqual([{ id: "abc123", occasion: "test-wedding", date: "2027-07-10", name: "", read: ["d-30"] }]);
  });
});
