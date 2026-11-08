// "Today" in four time zones (design 8.3 "Time zones"). The clock must really change in the zone the test runs in, so it
// sets one (each test file runs in its own process) and checks the offset moved before it trusts the result.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dayNumber, msUntilMidnight, today } from "./calendar";

const savedZone = process.env.TZ;

describe.each(["America/New_York", "Europe/London", "Australia/Sydney", "Pacific/Auckland"])("countdowns: today in %s", (zone) => {
  beforeAll(() => { process.env.TZ = zone; });
  afterAll(() => { if (savedZone === undefined) delete process.env.TZ; else process.env.TZ = savedZone; });

  it("changes exactly at local midnight and rises by one a day through both daylight-saving changes", () => {
    const offsets = new Set<number>();
    let previous = dayNumber(today(new Date(2026, 0, 1, 12)));
    for (let day = 2; day <= 365; day++) {
      const noon = new Date(2026, 0, day, 12);
      offsets.add(noon.getTimezoneOffset());
      const n = dayNumber(today(noon));
      expect(n).toBe(previous + 1);
      expect(dayNumber(today(new Date(2026, 0, day, 0, 0, 1)))).toBe(n);
      expect(dayNumber(today(new Date(2026, 0, day, 23, 59, 59)))).toBe(n);
      // One millisecond before local midnight is still the day before.
      expect(dayNumber(today(new Date(new Date(2026, 0, day).getTime() - 1)))).toBe(n - 1);
      previous = n;
    }
    expect(offsets.size, `the clock never changed in ${zone}, so this test proved nothing`).toBe(2);
  });

  it("counts down to the real next midnight on 23- and 25-hour days", () => {
    for (let day = 1; day <= 365; day++) expect([23, 24, 25]).toContain(msUntilMidnight(new Date(2026, 0, day, 0, 0, 0)) / 3_600_000);
  });
});
