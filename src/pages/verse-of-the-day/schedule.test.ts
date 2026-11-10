// The schedule's rules (docs/features/verse-widget/design.md 4.3, 4.4): frozen days never change on a rebuild, new
// entries join the end of the rotation, a schedule that ran out is continued as browsers worked it out, and the
// fallback rule never gives a negative position.
import { describe, expect, it } from "vitest";
import { fallbackPosition, keyOfDay, dayOfKey } from "@/data/verse-of-the-day/keys";
import { activeKeys, bookOfKey, buildSchedule, FROZEN_DAYS, PAST_DAYS, rotationOrder, separateBooks, type Schedule } from "./schedule";

const built = buildSchedule(null, "2026-11-09");

describe("verse of the day: building the schedule", () => {
  it("runs from 30 days before the build to three years after it, frozen 14 days ahead", () => {
    expect(built.epoch).toBe(keyOfDay(dayOfKey("2026-11-09") - PAST_DAYS));
    expect(built.lastDate).toBe("2029-11-09");
    expect(built.frozenThrough).toBe(keyOfDay(dayOfKey("2026-11-09") + FROZEN_DAYS));
    expect(Object.keys(built.days)).toHaveLength(dayOfKey("2029-11-09") - dayOfKey(built.epoch) + 1);
  });

  it("gives the same schedule from the same inputs", () => {
    expect(buildSchedule(null, "2026-11-09")).toEqual(built);
  });

  it("changes no day up to the frozen margin when rebuilt a week later, even after the pool is reshuffled", () => {
    const later = buildSchedule({ ...built, poolOrder: [...built.poolOrder].reverse() }, "2026-11-16");
    for (let n = dayOfKey("2026-11-16") - PAST_DAYS; n <= dayOfKey(built.frozenThrough); n++) {
      expect(later.days[keyOfDay(n)], keyOfDay(n)).toEqual(built.days[keyOfDay(n)]);
    }
  });

  it("puts new entries at the end of the rotation, leaving the old order alone", () => {
    const shortened: Schedule = { ...built, poolOrder: built.poolOrder.slice(0, -5) };
    const order = rotationOrder(shortened, activeKeys());
    expect(order.slice(0, shortened.poolOrder.length)).toEqual(shortened.poolOrder);
    expect([...order.slice(shortened.poolOrder.length)].sort()).toEqual([...built.poolOrder.slice(-5)].sort());
  });

  it("continues a schedule that ran out with the fallback rule, as browsers showed those days", () => {
    const ended: Schedule = { ...built, lastDate: "2026-11-12", days: Object.fromEntries(Object.entries(built.days).filter(([date]) => date <= "2026-11-12")) };
    const rotation = ended.poolOrder;
    const later = buildSchedule(ended, "2026-11-12");
    for (let n = dayOfKey("2026-11-13"); n <= dayOfKey("2026-11-26"); n++) {
      expect(later.days[keyOfDay(n)], keyOfDay(n)).toBe(rotation[fallbackPosition(ended.next, dayOfKey("2026-11-12"), n, rotation.length)]);
    }
  });
});

describe("verse of the day: the rotation", () => {
  it("keeps verses from one book apart, the last and first included", () => {
    const order = separateBooks(["GEN.1.1", "GEN.1.2", "JHN.1.1", "JHN.1.2", "ROM.1.1", "GEN.2.1"]);
    for (let i = 1; i < order.length; i++) expect(bookOfKey(order[i]) === bookOfKey(order[i - 1]), order.join(" ")).toBe(false);
    expect(bookOfKey(order[0]) === bookOfKey(order[order.length - 1])).toBe(false);
    expect([...order].sort()).toEqual(["GEN.1.1", "GEN.1.2", "GEN.2.1", "JHN.1.1", "JHN.1.2", "ROM.1.1"]);
  });

  it("refuses a pool too lopsided to rotate", () => {
    expect(() => separateBooks(["GEN.1.1", "GEN.1.2", "GEN.1.3", "JHN.1.1"])).toThrow(/cannot keep/);
  });
});

describe("verse of the day: the fallback position", () => {
  it("carries on after the last day and wraps before the first, never negative", () => {
    expect(fallbackPosition(2, 100, 101, 4)).toBe(2);
    expect(fallbackPosition(2, 100, 104, 4)).toBe(1);
    expect(fallbackPosition(2, 100, -996, 4)).toBe(1);
    for (let n = -50; n < 50; n++) expect(fallbackPosition(0, 0, n, 7)).toBeGreaterThanOrEqual(0);
  });
});
