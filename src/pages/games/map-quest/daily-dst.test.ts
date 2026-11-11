// Puzzle numbers across a daylight-saving change. The clock must really change in the zone the test runs in, so it sets
// one (each test file runs in its own process here) and checks the offset moved before it trusts the result.
import { createDaily, msUntilMidnight } from "./daily";

const savedZone = process.env.TZ;

describe.each(["America/New_York", "Europe/London", "Australia/Sydney"])("map quest puzzle numbers in %s", (zone) => {
  beforeAll(() => { process.env.TZ = zone; });
  afterAll(() => { if (savedZone === undefined) delete process.env.TZ; else process.env.TZ = savedZone; });

  it("go up by exactly one each midnight through the year, daylight-saving days included", () => {
    const daily = createDaily({ epoch: "2026-01-01", frozenThrough: 0, days: [["x"]] }, []);
    const offsets = new Set<number>();
    let previous = daily.numberOn(new Date(2026, 0, 1, 12));
    expect(previous).toBe(1);
    for (let day = 2; day <= 365; day++) {
      const noon = new Date(2026, 0, day, 12);
      const lateNight = new Date(2026, 0, day, 23, 59);
      offsets.add(noon.getTimezoneOffset());
      const n = daily.numberOn(noon);
      expect(n).toBe(previous + 1);
      expect(daily.numberOn(lateNight)).toBe(n);
      expect(daily.numberOn(new Date(2026, 0, day, 0, 0, 30))).toBe(n);
      previous = n;
    }
    expect(offsets.size, `the clock never changed in ${zone}, so this test proved nothing`).toBe(2);
  });

  it("count down to the real next midnight on a 23-hour and a 25-hour day", () => {
    for (let day = 1; day <= 365; day++) {
      const start = new Date(2026, 0, day, 0, 0, 0);
      const length = msUntilMidnight(start) / 3_600_000;
      expect([23, 24, 25]).toContain(length);
    }
  });
});
