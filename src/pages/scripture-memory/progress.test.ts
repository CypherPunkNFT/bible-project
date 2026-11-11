// Scripture memory: one step per calendar day, step back, start over, known by heart (design §4 and §9).
import { afterEach, describe, expect, it, vi } from "vitest";
import { doneToday, furtherAlong, isKnown, newVerse, practise, startOver, stepBack, today } from "./progress";

const DAY = 20_400;

afterEach(() => { vi.useRealTimers(); });

describe("a step a day", () => {
  it("moves on once a day and not twice", () => {
    const first = practise(newVerse(43003016, 43003016, DAY), DAY);
    expect(first.outcome).toBe("stepped");
    expect(first.verse).toMatchObject({ stage: 1, last: DAY });
    const again = practise(first.verse, DAY);
    expect(again.outcome).toBe("already");
    expect(again.verse).toBe(first.verse);
    expect(practise(first.verse, DAY + 1).verse.stage).toBe(2);
  });

  it("counts calendar days: 23:59 and 00:01 are two days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 9, 23, 59));
    const late = today();
    vi.setSystemTime(new Date(2026, 10, 10, 0, 1));
    expect(today()).toBe(late + 1);
  });

  it("is known by heart after six days, and stays known", () => {
    let verse = newVerse(1, 1, DAY);
    const outcomes: string[] = [];
    for (let day = DAY; day < DAY + 6; day++) {
      const result = practise(verse, day);
      outcomes.push(result.outcome);
      verse = result.verse;
    }
    expect(outcomes).toEqual(["stepped", "stepped", "stepped", "stepped", "stepped", "known"]);
    expect(isKnown(verse)).toBe(true);
    const kept = practise(verse, DAY + 9);
    expect(kept.outcome).toBe("kept");
    expect(kept.verse).toMatchObject({ stage: 6, last: DAY + 9 });
  });

  it("does not punish missed days", () => {
    const verse = { ...newVerse(1, 1, DAY), stage: 3, last: DAY };
    expect(practise(verse, DAY + 30).verse.stage).toBe(4);
  });
});

describe("step back and start over", () => {
  it("steps back without touching the day, so a same-day step back waits for tomorrow", () => {
    const verse = { ...newVerse(1, 1, DAY), stage: 3, last: DAY };
    const back = stepBack(verse);
    expect(back).toMatchObject({ stage: 2, last: DAY });
    expect(doneToday(back, DAY)).toBe(true);
    expect(stepBack({ ...verse, stage: 0 }).stage).toBe(0);
  });

  it("starts over from step 1, ready today", () => {
    const over = startOver({ ...newVerse(1, 1, DAY), stage: 6, last: DAY });
    expect(over).toMatchObject({ stage: 0, last: 0 });
    expect(doneToday(over, DAY)).toBe(false);
  });

  it("knows which copy is further along", () => {
    const a = { ...newVerse(1, 1, DAY), stage: 3, last: DAY };
    expect(furtherAlong({ ...a, stage: 4 }, a)).toBe(true);
    expect(furtherAlong({ ...a, last: DAY + 1 }, a)).toBe(true);
    expect(furtherAlong(a, a)).toBe(false);
  });
});
