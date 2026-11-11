// The player's record (design §8): rebuilt safely from anything stored, guesses saved once, each puzzle counted once.
import { RECENT_KEPT, STORAGE_KEY, currentStreak, emptyRecord, finishToday, parseRecord, readRecord, recordGuess, setHard, startToday, withHint, writeRecord, type WordleRecord } from "./storage";

const play = (record: WordleRecord, n: number, guesses: string[], answer: string): WordleRecord => {
  let next = startToday(record, n);
  guesses.forEach((guess, i) => { next = recordGuess(next, n, i, guess, answer); });
  return finishToday(next, n, answer);
};

describe("bible wordle record", () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("rebuilds anything stored into a sound record", () => {
    for (const raw of [null, 7, "text", [], { played: -3, won: "x", dist: [1, 2] }]) expect(parseRecord(raw)).toEqual(emptyRecord());
    const parsed = parseRecord({ played: 2, won: 5, streak: 3, bestStreak: 1, today: { n: 4, guesses: ["faith", "BAD", 9, "grace"], hard: true }, settings: { contrast: true } });
    expect(parsed.won).toBe(2); // never more wins than games
    expect(parsed.bestStreak).toBe(3);
    expect(parsed.today).toEqual({ n: 4, guesses: ["faith", "grace"], hard: true, hint: false });
    expect(parsed.settings).toEqual({ hard: false, contrast: true });
  });

  it("keeps the last few finished days, each once, oldest first, and ignores nonsense", () => {
    const won = play(emptyRecord(), 3, ["faith"], "faith");
    const lost = play(won, 4, ["bread", "water", "light", "stone", "grace", "peace"], "thorn");
    expect(lost.recent).toEqual([{ n: 3, won: true }, { n: 4, won: false }]);
    expect(finishToday(lost, 4, "thorn").recent).toHaveLength(2); // a day counted once
    const parsed = parseRecord({ recent: [{ n: 9, won: true }, { n: 2, won: false }, { n: 9, won: false }, { n: "x", won: true }, { n: 5, won: 1 }, 7] });
    expect(parsed.recent).toEqual([{ n: 2, won: false }, { n: 9, won: false }]);
    expect(parseRecord({ recent: "none" }).recent).toEqual([]);
    const many = parseRecord({ recent: Array.from({ length: 40 }, (_, i) => ({ n: i + 1, won: i % 2 === 0 })) });
    expect(many.recent).toHaveLength(RECENT_KEPT);
    expect(many.recent[0].n).toBe(40 - RECENT_KEPT + 1);
  });

  it("starts afresh from damaged storage, and says so when the browser blocks it", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(readRecord()).toEqual({ record: emptyRecord(), available: true });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readRecord().available).toBe(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    expect(writeRecord(emptyRecord())).toBe(false);
  });

  it("saves and reads back the same record", () => {
    const record = play(emptyRecord(), 1, ["bread", "faith"], "faith");
    expect(writeRecord(record)).toBe(true);
    expect(readRecord().record).toEqual(record);
  });

  it("adds a guess only once, in order, and none after the game is over", () => {
    let record = startToday(emptyRecord(), 5);
    record = recordGuess(record, 5, 0, "bread", "faith");
    expect(recordGuess(record, 5, 0, "stone", "faith")).toBe(record); // a double tap
    expect(recordGuess(record, 4, 1, "stone", "faith")).toBe(record); // another day
    record = recordGuess(record, 5, 1, "faith", "faith");
    expect(recordGuess(record, 5, 2, "grace", "faith")).toBe(record);
    expect(record.today?.guesses).toEqual(["bread", "faith"]);
  });

  it("keeps a puzzle under way when it is opened again, and drops yesterday's", () => {
    const record = recordGuess(startToday(emptyRecord(), 5), 5, 0, "bread", "faith");
    expect(startToday(record, 5)).toBe(record);
    expect(startToday(record, 6).today).toEqual({ n: 6, guesses: [], hard: false, hint: false });
  });

  it("counts each finished puzzle once, with streaks and the tries a win took", () => {
    let record = play(emptyRecord(), 1, ["bread", "faith"], "faith");
    record = play(record, 2, ["grace"], "grace");
    expect(finishToday(record, 2, "grace")).toBe(record); // counted already
    expect(record).toMatchObject({ played: 2, won: 2, streak: 2, bestStreak: 2, lastWon: 2, lastDone: 2 });
    expect(record.dist).toEqual([1, 1, 0, 0, 0, 0]);
    record = play(record, 4, ["water"], "light"); // a missed day, then still playing
    expect(record.played).toBe(2);
    record = play(record, 4, ["water", "stone", "bread", "faith", "grace", "peace"], "light");
    expect(record).toMatchObject({ played: 3, won: 2, streak: 0, bestStreak: 2 });
    expect(play(record, 3, ["faith"], "faith").played).toBe(3); // a clock set back counts nothing
  });

  it("breaks the streak only once a day has been missed", () => {
    const record = play(emptyRecord(), 1, ["faith"], "faith");
    expect(currentStreak(record, 1)).toBe(1);
    expect(currentStreak(record, 2)).toBe(1);
    expect(currentStreak(record, 3)).toBe(0);
  });

  it("lets hard mode change only before the first guess, and remembers it", () => {
    let record = setHard(startToday(emptyRecord(), 1), 1, true);
    expect(record.today?.hard).toBe(true);
    expect(record.settings.hard).toBe(true);
    record = recordGuess(record, 1, 0, "bread", "faith");
    expect(setHard(record, 1, false)).toBe(record);
    expect(startToday(record, 2).today?.hard).toBe(true);
  });

  it("marks a hint as used once", () => {
    const record = withHint(startToday(emptyRecord(), 1), 1);
    expect(record.today?.hint).toBe(true);
    expect(withHint(record, 1)).toBe(record);
  });
});
