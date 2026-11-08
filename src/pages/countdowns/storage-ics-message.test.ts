// Saving read marks, the calendar file and the shared message (design 8.3 "Storage", "Calendar file", "Message").
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCalendar, escapeText, foldLine } from "./ics";
import { buildDayMessage, countdownUrl, mailtoHref, smsBodyHref } from "./message";
import { emptyRecord, loadRecord, putMine, rebuildRecord, saveRecord, STORAGE_KEY, tidyRecord, toggleRunRead, useCountdownProgress } from "./storage";
import { dayNumber } from "./calendar";

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
const today = dayNumber({ year: 2026, month: 12, day: 12 });

describe("countdowns: saving read marks", () => {
  it("gives an empty record, with a warning, for damaged JSON", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadRecord()).toEqual(emptyRecord());
    expect(warn).toHaveBeenCalled();
  });

  it("gives an empty record and a refused save when the browser blocks site storage outright", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("blocked", "SecurityError"); } });
    try {
      expect(loadRecord()).toEqual(emptyRecord());
      expect(saveRecord(emptyRecord(), today)).toBe(false);
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });

  it("rebuilds the record field by field, dropping what does not fit", () => {
    const record = rebuildRecord({
      v: 9, extra: true,
      runs: { "advent:2026-12-25": { read: ["dec-01", "dec-01", "BAD KEY", 7, "x".repeat(30)], note: "dropped" }, "advent:2026-02-30": { read: ["dec-01"] }, "<script>": { read: [] } },
      mine: [
        { id: "abc", occasion: "wedding", date: "2027-06-12", name: "A".repeat(80), read: ["d-30"], secret: 1 },
        { id: "abc", occasion: "wedding", date: "2027-06-12", name: "", read: [] },
        { id: "def", occasion: "wedding", date: "2027-02-30", name: "", read: [] },
        "nonsense",
      ],
    });
    expect(record.runs).toEqual({ "advent:2026-12-25": { read: ["dec-01"] } });
    expect(record.mine).toHaveLength(1);
    expect(record.mine[0].name).toHaveLength(60);
    expect(record.mine[0]).not.toHaveProperty("secret");
  });

  it("holds at most 60 keys a run and 10 personal countdowns", () => {
    const record = rebuildRecord({
      runs: { "lent:2027-03-28": { read: Array.from({ length: 80 }, (_, index) => `day-${index}`) } },
      mine: Array.from({ length: 14 }, (_, index) => ({ id: `id${index}`, occasion: "wedding", date: "2027-06-12", name: "", read: [] })),
    });
    expect(record.runs["lent:2027-03-28"].read).toHaveLength(60);
    expect(record.mine).toHaveLength(10);
    expect(putMine(record, { id: "new1", occasion: "wedding", date: "2027-06-12", name: "" })).toBeNull();
  });

  it("tidies away runs more than 400 days past", () => {
    const record = { ...emptyRecord(), runs: { "advent:2024-12-25": { read: ["dec-01"] }, "advent:2025-12-25": { read: ["dec-02"] } } };
    expect(Object.keys(tidyRecord(record, today).runs)).toEqual(["advent:2025-12-25"]);
  });

  it("toggles a mark on and off and saves it", () => {
    let record = toggleRunRead(emptyRecord(), "advent:2026-12-25", "dec-12");
    expect(record.runs["advent:2026-12-25"].read).toEqual(["dec-12"]);
    expect(saveRecord(record, today)).toBe(true);
    expect(loadRecord().runs["advent:2026-12-25"].read).toEqual(["dec-12"]);
    record = toggleRunRead(record, "advent:2026-12-25", "dec-12");
    expect(record.runs["advent:2026-12-25"].read).toEqual([]);
  });

  it("reports when the browser refuses to save, and keeps the marks for this visit", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    const { result } = renderHook(() => useCountdownProgress(today));
    act(() => result.current.update((record) => toggleRunRead(record, "advent:2026-12-25", "dec-12")));
    expect(result.current.saving).toBe(false);
    expect(result.current.record.runs["advent:2026-12-25"].read).toEqual(["dec-12"]);
    act(() => result.current.update((record) => toggleRunRead(record, "advent:2026-12-25", "dec-13")));
    expect(result.current.record.runs["advent:2026-12-25"].read).toEqual(["dec-12", "dec-13"]);
  });

  it("picks up a change made in another tab", () => {
    const { result } = renderHook(() => useCountdownProgress(today));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, runs: { "advent:2026-12-25": { read: ["dec-03"] } }, mine: [] }));
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY })); });
    expect(result.current.record.runs["advent:2026-12-25"].read).toEqual(["dec-03"]);
  });
});

describe("countdowns: the calendar file", () => {
  const events = [
    { uid: "advent-2026-dec-12@bibleguide.io", date: { year: 2026, month: 12, day: 12 }, summary: "Advent · Dec 12: Isaiah 11:1–10", url: "https://bibleguide.io/countdowns/advent/dec-12" },
    { uid: "advent-2026-dec-31@bibleguide.io", date: { year: 2026, month: 12, day: 31 }, summary: "A, B; C\\D and a very long title that goes on and on well past the seventy-five byte limit of a line", url: "https://bibleguide.io/countdowns/advent/dec-31" },
  ];
  const file = buildCalendar("Advent 2026 · Bible Guide", events, new Date(Date.UTC(2026, 10, 7, 12, 30, 0)));
  const lines = file.split("\r\n");

  it("uses CRLF line ends and folds every line to 75 bytes", () => {
    expect(file.endsWith("\r\n")).toBe(true);
    expect(file.replace(/\r\n/g, "").includes("\n")).toBe(false);
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(foldLine("é".repeat(80)).split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
  });

  it("escapes commas, semicolons and backslashes", () => {
    expect(escapeText("A, B; C\\D")).toBe("A\\, B\\; C\\\\D");
  });

  it("has a header, one all-day event per day with an end one day later, a stamp and unique ids", () => {
    const unfolded = file.replace(/\r\n /g, "");
    expect(unfolded).toContain("VERSION:2.0");
    expect(unfolded).toContain("PRODID:-//Bible Guide//Countdowns//EN");
    expect(unfolded.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(unfolded).toContain("DTSTART;VALUE=DATE:20261212\r\nDTEND;VALUE=DATE:20261213");
    expect(unfolded).toContain("DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101");
    expect(unfolded.match(/DTSTAMP:20261107T123000Z/g)).toHaveLength(2);
    const uids = unfolded.match(/UID:[^\r]+/g)!;
    expect(new Set(uids).size).toBe(2);
    expect(unfolded).not.toContain("VALARM");
  });
});

describe("countdowns: the shared message", () => {
  it("builds the link from the site's public address, with only ?date= for a personal occasion", () => {
    expect(countdownUrl("advent", "dec-12")).toBe("https://bibleguide.io/countdowns/advent/dec-12");
    expect(countdownUrl("wedding", "d-30", "2027-06-12")).toBe("https://bibleguide.io/countdowns/wedding/d-30?date=2027-06-12");
  });

  it("puts the verse, its reference with (BSB), the heading and the link in the text", () => {
    const text = buildDayMessage({ verse: "Then a shoot will spring up from the stump of Jesse.", reference: "Isaiah 11:1", heading: "Advent, December 12: The shoot from Jesse's stump", url: "https://bibleguide.io/countdowns/advent/dec-12" });
    expect(text).toBe("“Then a shoot will spring up from the stump of Jesse.” — Isaiah 11:1 (BSB)\n\nAdvent, December 12: The shoot from Jesse's stump\nhttps://bibleguide.io/countdowns/advent/dec-12");
    expect(mailtoHref("Advent", text)).toBe(`mailto:?subject=Advent&body=${encodeURIComponent(text)}`);
    expect(smsBodyHref(text)).toBe(`sms:?&body=${encodeURIComponent(text)}`);
  });
});
