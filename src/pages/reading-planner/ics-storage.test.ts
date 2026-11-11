// The calendar file (design 6) and the progress kept in this browser (design 4).
import { planCalendar, type PlanEvent } from "./plan-ics";
import type { PlanSettings } from "./planner";
import { loadKept, rebuildKept, rebuildSettings, saveKept, STORAGE_KEY, toggleDay, type KeptPlan } from "./storage";

const events: PlanEvent[] = [
  { n: 1, date: 20819, summary: "Genesis 1–3", time: "12 min", path: "/read/bsb/GEN/1" },
  { n: 2, date: 20820, summary: "Genesis 4–6; Matthew 1, the long reading of a day with a summary that runs past the fold", time: "14 min", path: "/read/bsb/GEN/4" },
];

describe("the calendar file", () => {
  const file = planCalendar("Bible reading plan", "abcd1234", events, new Date(Date.UTC(2026, 10, 9, 12, 0, 0)));
  const unfolded = file.replace(/\r\n /g, "");

  it("uses CRLF line ends and folds no line past 75 bytes", () => {
    expect(file.endsWith("\r\n")).toBe(true);
    expect(file.replace(/\r\n/g, "")).not.toMatch(/\n/);
    for (const line of file.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it("has one all-day event a day, ending the next day, with a stable id, the chapters, the time and the link", () => {
    expect(unfolded.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    // Day 20819 is 1 January 2027.
    expect(unfolded).toContain("DTSTART;VALUE=DATE:20270101\r\nDTEND;VALUE=DATE:20270102");
    expect(unfolded).toContain("UID:reading-plan-abcd1234-1@bibleguide.io");
    expect(unfolded).toContain("SUMMARY:Genesis 1–3");
    expect(unfolded).toContain("URL:https://bibleguide.io/read/bsb/GEN/1");
    expect(unfolded).toContain("DESCRIPTION:12 min\\nhttps://bibleguide.io/read/bsb/GEN/1");
    expect(unfolded).toContain("SUMMARY:Genesis 4–6\\; Matthew 1\\, the long reading");
    expect(unfolded).toContain("DTSTAMP:20261109T120000Z");
    expect(unfolded).toContain("PRODID:-//Bible Guide//Reading planner//EN");
    expect(unfolded).not.toContain("VALARM");
  });
});

const codes = new Set(["GEN", "EXO", "MAT"]);
const settings: PlanSettings = { books: ["GEN", "MAT"], mode: "pace", start: "2027-01-01", finish: "2027-12-31", pace: 3, unit: "chapters", weekdays: [1, 3, 5], speed: 200 };
const kept: KeptPlan = { v: 1, settings, signature: "0a1b2c3d", read: [1, 2, 5] };

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    data,
  };
}

describe("progress kept in this browser", () => {
  it("round-trips a kept plan", () => {
    const storage = memoryStorage();
    expect(saveKept(kept, storage)).toBe(true);
    expect(loadKept(codes, storage)).toEqual(kept);
    expect(saveKept(null, storage)).toBe(true);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("drops a damaged plan whole rather than drawing a broken one", () => {
    for (const change of [{ mode: "fast" }, { start: "2027-02-30" }, { pace: 1.5 }, { pace: "3" }, { unit: "verses" }, { speed: 999 }, { books: ["XYZ"] }, { weekdays: [9] }]) {
      expect(rebuildSettings({ ...settings, ...change }, codes)).toBeNull();
    }
    expect(rebuildKept({ ...kept, signature: "<script>" }, codes)).toBeNull();
    expect(rebuildKept({ ...kept, v: 2 }, codes)).toBeNull();
    expect(loadKept(codes, memoryStorage({ [STORAGE_KEY]: "{not json" }))).toBeNull();
  });

  it("tidies ticks and books: whole numbers once each, known books once each", () => {
    const rebuilt = rebuildKept({ ...kept, read: [5, 1, 1, 2.5, -3, "4", 2], settings: { ...settings, books: ["GEN", "GEN", "XYZ", "MAT"] } }, codes);
    expect(rebuilt?.read).toEqual([1, 2, 5]);
    expect(rebuilt?.settings.books).toEqual(["GEN", "MAT"]);
  });

  it("keeps working when the browser refuses storage", () => {
    const refusing = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(loadKept(codes, refusing)).toBeNull();
    expect(saveKept(kept, refusing)).toBe(false);
    warn.mockRestore();
  });

  it("ticks and unticks a day; ticking a different plan starts its ticks afresh", () => {
    expect(toggleDay(kept, settings, kept.signature, 3).read).toEqual([1, 2, 3, 5]);
    expect(toggleDay(kept, settings, kept.signature, 2).read).toEqual([1, 5]);
    expect(toggleDay(kept, settings, "ffffffff", 7)).toEqual({ v: 1, settings, signature: "ffffffff", read: [7] });
    expect(toggleDay(null, settings, "ffffffff", 1).read).toEqual([1]);
  });
});
