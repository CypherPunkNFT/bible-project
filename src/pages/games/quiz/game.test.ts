// The games-page quiz's own rules (game.ts, storage.ts): the streak, the marks, the ranks, the share text, the saved round.
import { QUESTIONS, VERDICTS } from "@/pages/quiz-data";
import { rankFor } from "../kit";
import { RANKS, TOTAL, VERDICT, bestStreakOf, freshPicked, marksFor, nextAfter, outcomeOf, rightCount, shareTextFor, streakOf, verdictFor, type Picked } from "./game";
import { freshRound, readBest, readRound, saveRound, writeBest, type Store } from "./storage";

const rightFor = (i: number) => QUESTIONS[i].answer;
const wrongFor = (i: number) => (QUESTIONS[i].answer + 1) % 4;
const withAnswers = (entries: [index: number, choice: number][]): Picked => {
  const picked = freshPicked();
  for (const [i, j] of entries) picked[i] = j;
  return picked;
};

describe("the quiz rules", () => {
  it("has twelve questions and marks each as right or wrong by the homepage's answers", () => {
    expect(TOTAL).toBe(12);
    const picked = withAnswers([[0, rightFor(0)], [1, wrongFor(1)]]);
    expect(outcomeOf(picked, 0)).toBe("right");
    expect(outcomeOf(picked, 1)).toBe("wrong");
    expect(outcomeOf(picked, 2)).toBeUndefined();
    expect(rightCount(picked)).toBe(1);
  });

  it("uses the homepage's verdict table unchanged", () => {
    expect(verdictFor(12)).toBe(VERDICTS[0]);
    expect(verdictFor(8)).toBe(VERDICTS[1]);
    expect(verdictFor(4)).toBe(VERDICTS[2]);
    expect(verdictFor(0)).toBe(VERDICTS[3]);
  });

  it("counts the streak in the order answered, not in question order", () => {
    const picked = withAnswers([[5, rightFor(5)], [2, rightFor(2)], [9, wrongFor(9)], [0, rightFor(0)], [1, rightFor(1)]]);
    expect(streakOf(picked, [5, 2, 9, 0, 1])).toBe(2);
    expect(bestStreakOf(picked, [5, 2, 9, 0, 1])).toBe(2);
    expect(streakOf(picked, [5, 2, 0, 1, 9])).toBe(0);
    expect(bestStreakOf(picked, [5, 2, 0, 1, 9])).toBe(4);
    expect(streakOf(freshPicked(), [])).toBe(0);
  });

  it("marks the trail in question order with the open one as current", () => {
    const picked = withAnswers([[0, rightFor(0)], [3, wrongFor(3)]]);
    const marks = marksFor(picked, 1);
    expect(marks[0]).toBe("right");
    expect(marks[1]).toBe("current");
    expect(marks[2]).toBe("empty");
    expect(marks[3]).toBe("wrong");
    expect(marksFor(picked, VERDICT).filter((m) => m === "current")).toHaveLength(0);
  });

  it("opens the next unanswered question after the current one, wraps round, and ends on the verdict", () => {
    expect(nextAfter(freshPicked(), 0)).toBe(1);
    expect(nextAfter(withAnswers([[1, 0], [2, 0]]), 0)).toBe(3);
    expect(nextAfter(withAnswers([[11, 0], [10, 0]]), 10)).toBe(0);
    expect(nextAfter(freshPicked(), VERDICT)).toBe(0);
    const all = QUESTIONS.map((_, i) => [i, 0] as [number, number]);
    expect(nextAfter(withAnswers(all), 11)).toBe(VERDICT);
  });

  it("gives rank titles that rise with the score", () => {
    expect(rankFor(0, 12, RANKS)?.title).toBe("Reader");
    expect(rankFor(4, 12, RANKS)?.title).toBe("Student");
    expect(rankFor(8, 12, RANKS)?.title).toBe("Scribe");
    expect(rankFor(11, 12, RANKS)?.title).toBe("Teacher of the Law");
    expect(rankFor(12, 12, RANKS)?.title).toBe("Berean");
  });

  it("writes the share text as the title, the score, twelve squares and the address", () => {
    const picked = QUESTIONS.map((q, i) => (i % 3 === 0 ? wrongFor(i) : q.answer));
    const text = shareTextFor(picked);
    expect(text.split("\n")).toEqual(["How well do you know the Bible? 8/12", "🟥🟨🟨🟥🟨🟨🟥🟨🟨🟥🟨🟨", "bibleguide.io/games/quiz"]);
  });
});

function memoryStore(): Store & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: (k) => { data.delete(k); } };
}

describe("what the quiz keeps", () => {
  it("saves the round for the tab and reads it back", () => {
    const store = memoryStore();
    const round = { ...freshRound(), picked: withAnswers([[2, 1]]), order: [2], current: 3, board: false };
    saveRound(store, round);
    expect(readRound(store)).toEqual(round);
    saveRound(store, null);
    expect(readRound(store)).toBeNull();
  });

  it("ignores a saved round that is not this game's shape", () => {
    const store = memoryStore();
    store.setItem("bp-quiz-round", "not json");
    expect(readRound(store)).toBeNull();
    store.setItem("bp-quiz-round", JSON.stringify({ picked: [1, 2], order: [], current: 0 }));
    expect(readRound(store)).toBeNull();
    store.setItem("bp-quiz-round", JSON.stringify({ picked: freshPicked(), order: [40], current: 0 }));
    expect(readRound(store)).toBeNull();
    store.setItem("bp-quiz-round", JSON.stringify({ picked: freshPicked(), order: [], current: 99 }));
    expect(readRound(store)).toBeNull();
  });

  it("keeps the best on the device and treats a bad value as none", () => {
    const store = memoryStore();
    expect(readBest(store)).toBe(0);
    writeBest(store, 9);
    expect(readBest(store)).toBe(9);
    store.setItem("bp-quiz-best", "40");
    expect(readBest(store)).toBe(0);
    expect(readBest(null)).toBe(0);
  });

  it("never throws when storage refuses", () => {
    const broken: Store = { getItem: () => { throw new Error("no"); }, setItem: () => { throw new Error("no"); }, removeItem: () => { throw new Error("no"); } };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readRound(broken)).toBeNull();
    expect(() => saveRound(broken, freshRound())).not.toThrow();
    expect(() => saveRound(broken, null)).not.toThrow();
    expect(() => writeBest(broken, 3)).not.toThrow();
    warn.mockRestore();
  });
});
