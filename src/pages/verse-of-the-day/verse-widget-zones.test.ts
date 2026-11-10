// "Today" for the widget in four time zones (docs/features/verse-widget/design.md 10, "Time zones"): the script asks for
// the visitor's own date's file, across both daylight-saving changes and across midnight. The zone must really change
// in the process the test runs in (each test file has its own), so it checks the offset moved before trusting it.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { addDiv, fakeFetch, resetWidget, runWidget, setVisibility, settle } from "./widget-kit";

const savedZone = process.env.TZ;
const pad = (n: number) => String(n).padStart(2, "0");

/** The date key the script asks for at a moment. */
async function askedAt(moment: Date): Promise<string> {
  vi.setSystemTime(moment);
  const fetch = fakeFetch({});
  addDiv();
  runWidget();
  await settle();
  const url = String(fetch.mock.calls[0][0]);
  resetWidget();
  return /days\/(\d{4}-\d{2}-\d{2})\.json$/.exec(url)![1];
}

describe.each(["America/New_York", "Europe/London", "Australia/Sydney", "Pacific/Kiritimati"])("verse widget: today in %s", (zone) => {
  beforeAll(() => {
    process.env.TZ = zone;
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    setVisibility("visible");
  });
  afterEach(() => vi.unstubAllGlobals());
  afterAll(() => {
    vi.useRealTimers();
    if (savedZone === undefined) delete process.env.TZ;
    else process.env.TZ = savedZone;
  });

  it("asks for the local date's file at the start and end of every day of a year", async () => {
    const offsets = new Set<number>();
    for (let day = 1; day <= 365; day += 1) {
      const noon = new Date(2026, 0, day, 12);
      offsets.add(noon.getTimezoneOffset());
      const key = `${noon.getFullYear()}-${pad(noon.getMonth() + 1)}-${pad(noon.getDate())}`;
      expect(await askedAt(new Date(2026, 0, day, 0, 0, 1)), `${key} just after midnight`).toBe(key);
      expect(await askedAt(new Date(2026, 0, day, 23, 59, 59)), `${key} just before midnight`).toBe(key);
    }
    // Kiritimati keeps one offset all year; the others must have changed, or the zone was never applied.
    expect(offsets.size, `the clock never changed in ${zone}`).toBe(zone === "Pacific/Kiritimati" ? 1 : 2);
  });

  it("is a day ahead of London in Kiritimati at UTC+14, or the zone did not apply", async () => {
    const asked = await askedAt(new Date(Date.UTC(2026, 5, 15, 11, 0, 0)));
    const expected = { "America/New_York": "2026-06-15", "Europe/London": "2026-06-15", "Australia/Sydney": "2026-06-15", "Pacific/Kiritimati": "2026-06-16" }[zone];
    expect(asked).toBe(expected);
  });
});
