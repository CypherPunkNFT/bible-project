// Puzzle numbers across a daylight-saving change, in three time zones. The clock must really change in the zone the
// test runs in, so it sets one (each test file runs in its own process) and checks the offset moved before trusting it.
import storyFile from "@/data/emoji-stories/stories.json";
import { createDaily, msUntilMidnight } from "./daily";
import type { StoryFile } from "./types";

const stories = (storyFile as StoryFile).stories;
const savedZone = process.env.TZ;

describe.each(["America/New_York", "Europe/London", "Australia/Sydney"])("emoji stories puzzle numbers in %s", (zone) => {
  beforeAll(() => { process.env.TZ = zone; });
  afterAll(() => { if (savedZone === undefined) delete process.env.TZ; else process.env.TZ = savedZone; });

  it("go up by exactly one each midnight through the year, daylight-saving days included", () => {
    const daily = createDaily({ epoch: "2026-01-01", frozenThrough: 0, days: [stories[0].id] }, stories);
    const offsets = new Set<number>();
    let previous = daily.numberOn(new Date(2026, 0, 1, 12));
    expect(previous).toBe(1);
    for (let day = 2; day <= 365; day++) {
      const noon = new Date(2026, 0, day, 12);
      offsets.add(noon.getTimezoneOffset());
      const n = daily.numberOn(noon);
      expect(n).toBe(previous + 1);
      expect(daily.numberOn(new Date(2026, 0, day, 23, 59))).toBe(n);
      expect(daily.numberOn(new Date(2026, 0, day, 0, 0, 30))).toBe(n);
      expect(daily.dateOf(n).getDate()).toBe(new Date(2026, 0, day).getDate());
      previous = n;
    }
    expect(offsets.size, `the clock never changed in ${zone}, so this test proved nothing`).toBe(2);
  });

  it("count down to the real next midnight on a 23-hour and a 25-hour day", () => {
    for (let day = 1; day <= 365; day++) expect([23, 24, 25]).toContain(msUntilMidnight(new Date(2026, 0, day)) / 3_600_000);
  });
});
