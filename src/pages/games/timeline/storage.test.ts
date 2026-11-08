import { fixtureIndex } from "./fixture";
import { trueOrder } from "./order";
import { canSave, distribution, emptySaved, readSaved, recordPractice, recordTry, streakOn, writeSaved, type Store } from "./storage";

const index = fixtureIndex();
const DAY = ["crucifixion", "abram-called", "david-king-hebron", "exodus", "samaria-falls", "jesus-born"];
const truth = trueOrder(index, DAY);
const wrong = [...truth].reverse();

function memoryStore(): Store & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } };
}

describe("saved in the browser (§11.1)", () => {
  it("brings back the same cards in the same order after a reload mid-round", () => {
    const store = memoryStore();
    const saved = { ...emptySaved("s1"), round: { mode: "practice" as const, level: "easy" as const, era: "all" as const, dealt: DAY.slice(0, 4), order: DAY.slice(0, 4).reverse(), checked: false, widened: false } };
    writeSaved(store, saved);
    expect(readSaved(store, index, "s1").round).toEqual(saved.round);
  });

  it("keeps every Daily try, so a reload cannot undo one", () => {
    const store = memoryStore();
    let saved = recordTry(emptySaved("s1"), 5, wrong, truth);
    saved = { ...saved, round: { mode: "daily", n: 5, order: truth } };
    writeSaved(store, saved);
    const back = readSaved(store, index, "s1");
    expect(back.daily.results["5"].tries).toEqual([wrong]);
    expect(back.round).toEqual({ mode: "daily", n: 5, order: truth });
  });

  it("drops a Practice round made from older data but keeps stats and Daily results", () => {
    const store = memoryStore();
    let saved = recordTry(emptySaved("old"), 5, truth, truth);
    saved = recordPractice(saved, "medium", DAY.slice(0, 5), true);
    saved = { ...saved, round: { mode: "practice", level: "medium", era: "all", dealt: DAY.slice(0, 5), order: DAY.slice(0, 5), checked: false, widened: false } };
    writeSaved(store, saved);
    const back = readSaved(store, index, "new");
    expect(back.round).toBeUndefined();
    expect(back.daily.results["5"].solved).toBe(true);
    expect(back.practice.bestPerfect.medium).toBe(1);
  });

  it("plays on without saving when storage is missing, blocked or corrupt", () => {
    expect(canSave(null)).toBe(false);
    const blocked: Store = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
    expect(canSave(blocked)).toBe(false);
    expect(readSaved(blocked, index, "s1")).toEqual(emptySaved("s1"));
    expect(() => writeSaved(blocked, emptySaved("s1"))).not.toThrow();
    const corrupt = memoryStore();
    corrupt.setItem("bp-timeline", "{not json");
    expect(readSaved(corrupt, index, "s1")).toEqual(emptySaved("s1"));
  });

  it("refuses saved ids that are not in the data", () => {
    const store = memoryStore();
    store.setItem("bp-timeline", JSON.stringify({ ...emptySaved("s1"), round: { mode: "daily", n: 2, order: ["exodus", "no-such-event"] } }));
    expect(readSaved(store, index, "s1").round).toBeUndefined();
  });
});

describe("Daily streaks (§7.1)", () => {
  it("counts consecutive days solved and resets on a miss", () => {
    let saved = recordTry(emptySaved("s"), 1, truth, truth);
    saved = recordTry(saved, 2, truth, truth);
    expect(saved.daily.streak).toBe(2);
    for (let i = 0; i < 4; i++) saved = recordTry(saved, 3, i % 2 ? wrong : [...wrong.slice(1), wrong[0]], truth);
    expect(saved.daily.results["3"].tries).toHaveLength(4);
    expect(saved.daily).toMatchObject({ streak: 0, best: 2 });
    expect(recordTry(saved, 3, truth, truth)).toBe(saved); // a finished day takes no more tries
    saved = recordTry(saved, 5, truth, truth);
    expect(saved.daily.streak).toBe(1); // day 4 was skipped
    expect(streakOn(saved, 5)).toBe(1);
    expect(streakOn(saved, 7)).toBe(0);
    expect(distribution(saved)).toEqual({ solvedIn: [3, 0, 0, 0], missed: 1 });
  });
});
