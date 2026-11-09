// My verses' boxes and the streak (design §8.2, §8.4): up one box only when due and only at Hard, the three answer-style
// ceilings, staying on a partial answer, back to box 1 on a miss, Memorised set, renewed and lost.
import { addToMyVerses, afterAnswer, calendarDay, countDay, freshProgress, shownStreak, type Answered, type Progress } from "./boxes";

const TODAY = 20_000;
const inBox = (box: Progress["box"], extra: Partial<Progress> = {}): Progress => ({ ...freshProgress(), box, due: TODAY, ...extra });
const hard = (accuracy: number, style: Answered["style"] = "words"): Answered => ({ accuracy, style, hard: true, today: TODAY });

describe("verse completion boxes", () => {
  it("adds a passage to box 1, due tomorrow, without promoting it from the same answer", () => {
    expect(addToMyVerses(freshProgress(), TODAY)).toMatchObject({ box: 1, due: TODAY + 1 });
    expect(addToMyVerses(inBox(3), TODAY)).toMatchObject({ box: 3 });
  });

  it("records play outside My verses without a box change", () => {
    const { progress, change } = afterAnswer(freshProgress(), hard(95));
    expect(progress).toMatchObject({ played: 1, best: 95, last: TODAY, box: 0 });
    expect(change).toBeNull();
  });

  it("moves a due passage up one box on a Hard pass, with that box's gap", () => {
    const steps = [[1, 2, 3], [2, 3, 7], [3, 4, 14], [4, 5, 30]] as const;
    for (const [from, to, days] of steps) {
      expect(afterAnswer(inBox(from), hard(92))).toMatchObject({ progress: { box: to, due: TODAY + days }, change: { kind: "up", box: to, days } });
    }
  });

  it("keeps box and due date on an early pass or an Easy or Medium pass", () => {
    expect(afterAnswer(inBox(2, { due: TODAY + 2 }), hard(100))).toMatchObject({ progress: { box: 2, due: TODAY + 2 }, change: { kind: "early" } });
    expect(afterAnswer(inBox(2), { ...hard(100), hard: false })).toMatchObject({ progress: { box: 2, due: TODAY }, change: { kind: "not-hard" } });
  });

  it("stops Pick at box 2 and First letters at box 4, never demoting higher progress", () => {
    expect(afterAnswer(inBox(1), hard(100, "pick")).progress.box).toBe(2);
    expect(afterAnswer(inBox(2), hard(100, "pick"))).toMatchObject({ progress: { box: 2, due: TODAY }, change: { kind: "ceiling", style: "pick" } });
    expect(afterAnswer(inBox(4), hard(100, "pick")).progress.box).toBe(4);
    expect(afterAnswer(inBox(3), hard(100, "letters")).progress.box).toBe(4);
    expect(afterAnswer(inBox(4), hard(100, "letters"))).toMatchObject({ progress: { box: 4 }, change: { kind: "ceiling", style: "letters" } });
  });

  it("memorises a due box-5 passage on a whole-words pass, renews it, and loses the badge on a partial answer", () => {
    const memorised = afterAnswer(inBox(5), hard(90));
    expect(memorised).toMatchObject({ progress: { box: 5, memorised: true, due: TODAY + 60 }, change: { kind: "memorised" } });
    const renewed = afterAnswer({ ...memorised.progress, due: TODAY }, hard(100));
    expect(renewed).toMatchObject({ progress: { memorised: true, due: TODAY + 60 }, change: { kind: "renewed" } });
    expect(afterAnswer({ ...memorised.progress, due: TODAY }, hard(100, "letters")).change).toMatchObject({ kind: "ceiling" });
    expect(afterAnswer(memorised.progress, hard(80))).toMatchObject({ progress: { box: 5, memorised: false, due: TODAY + 30 }, change: { kind: "stay" } });
  });

  it("keeps the box on 70–89% and sends a miss back to box 1 at any difficulty", () => {
    expect(afterAnswer(inBox(3), hard(70))).toMatchObject({ progress: { box: 3, due: TODAY + 7 } });
    expect(afterAnswer(inBox(4), { ...hard(69.9), hard: false })).toMatchObject({ progress: { box: 1, due: TODAY + 1 }, change: { kind: "reset" } });
    expect(afterAnswer(inBox(5, { memorised: true }), hard(0)).progress).toMatchObject({ box: 1, memorised: false });
  });
});

describe("verse completion day streak", () => {
  it("adds a day after the last, restarts after a gap, and counts a day once", () => {
    let days = { streak: 0, best: 0, last: 0 };
    days = countDay(days, TODAY);
    days = countDay(days, TODAY);
    days = countDay(days, TODAY + 1);
    expect(days).toEqual({ streak: 2, best: 2, last: TODAY + 1 });
    expect(countDay(days, TODAY + 3)).toEqual({ streak: 1, best: 2, last: TODAY + 3 });
  });

  it("shows the streak until a whole day is missed; today does not break it", () => {
    const days = { streak: 4, best: 4, last: TODAY };
    expect(shownStreak(days, TODAY)).toBe(4);
    expect(shownStreak(days, TODAY + 1)).toBe(4);
    expect(shownStreak(days, TODAY + 2)).toBe(0);
  });

  it("counts calendar days across a daylight-saving change", () => {
    const before = calendarDay(new Date(2026, 2, 7, 23, 30));
    const after = calendarDay(new Date(2026, 2, 8, 23, 30));
    expect(after - before).toBe(1);
    const autumn = calendarDay(new Date(2026, 10, 1, 0, 30)) - calendarDay(new Date(2026, 9, 31, 23, 30));
    expect(autumn).toBe(1);
  });
});
