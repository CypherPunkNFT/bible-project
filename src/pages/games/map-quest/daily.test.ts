// The Daily Five schedule (daily.json) and the fallback past its end, against every mixing rule of design §7.
import { createDaily } from "./daily";
import { checkDay, eligiblePool, nextDay, type DailyPlace } from "./daily-rules";
import { PLACES, SCHEDULE } from "./data";

const pool = eligiblePool(PLACES);
const byId = new Map<string, DailyPlace>(pool.map((place) => [place.id, place]));
const history = (days: readonly (readonly string[])[], index: number) => days.slice(Math.max(0, index - 90), index);

describe("map quest daily schedule", () => {
  it("covers at least two years from its first puzzle", () => {
    expect(SCHEDULE.epoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(SCHEDULE.days.length).toBeGreaterThanOrEqual(730);
  });

  it("keeps every rule on every day the builder chose (tiers, 15 km, both scopes, 30 and 90 day no-repeat)", () => {
    const problems: string[] = [];
    for (let index = SCHEDULE.frozenThrough; index < SCHEDULE.days.length; index++) {
      for (const problem of checkDay(SCHEDULE.days[index], byId, history(SCHEDULE.days, index))) problems.push(`#${index + 1}: ${problem}`);
    }
    expect(problems).toEqual([]);
  });

  it("names only playable places from today onward", () => {
    const daily = createDaily(SCHEDULE, PLACES);
    const from = Math.max(1, daily.numberOn(new Date()));
    const unknown = SCHEDULE.days.slice(from - 1).flat().filter((id) => !byId.has(id));
    expect(unknown).toEqual([]);
  });

  it("is exactly what the game's own rules give (so the file and the fallback cannot disagree)", () => {
    const sample = [SCHEDULE.frozenThrough, SCHEDULE.frozenThrough + 1, 200, 500, SCHEDULE.days.length - 1].filter((i) => i >= SCHEDULE.frozenThrough && i < SCHEDULE.days.length);
    for (const index of sample) expect(nextDay(pool, SCHEDULE.days, index), `#${index + 1}`).toEqual(SCHEDULE.days[index]);
  });

  it("carries on past the end of the file with the same rules, the same way every time", () => {
    const daily = createDaily(SCHEDULE, PLACES);
    const again = createDaily(SCHEDULE, PLACES);
    const end = SCHEDULE.days.length;
    const extended: string[][] = [...SCHEDULE.days];
    for (let n = end + 1; n <= end + 200; n++) {
      const day = daily.placesFor(n)!;
      expect(checkDay(day, byId, history(extended, n - 1)), `#${n}`).toEqual([]);
      extended.push(day);
    }
    expect(again.placesFor(end + 200)).toEqual(extended[end + 199]);
  });

  it("has no puzzle before #1", () => {
    const daily = createDaily(SCHEDULE, PLACES);
    expect(daily.placesFor(0)).toBeNull();
    expect(daily.placesFor(-3)).toBeNull();
    expect(daily.placesFor(1)).toEqual(SCHEDULE.days[0]);
  });

  it("numbers puzzles by calendar day from the epoch", () => {
    const daily = createDaily({ epoch: "2026-11-07", frozenThrough: 0, days: [["x"]] }, []);
    expect(daily.numberOn(new Date(2026, 10, 7, 0, 0, 1))).toBe(1);
    expect(daily.numberOn(new Date(2026, 10, 7, 23, 59, 59))).toBe(1);
    expect(daily.numberOn(new Date(2026, 10, 8, 0, 0, 0))).toBe(2);
    expect(daily.numberOn(new Date(2026, 10, 6, 12))).toBe(0);
    expect(daily.dateOf(2).getDate()).toBe(8);
  });
});
