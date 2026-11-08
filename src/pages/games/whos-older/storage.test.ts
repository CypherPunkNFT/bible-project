// Who's older?: what the browser keeps (design §6.4): best scores per mode, the run as dealt and as answered, a run
// from older data dropped, and storage that is missing, full or corrupt never stopping the game.
import data from "@/data/whos-older/whos-older.json";
import { answer, buildPool, current, newRun, next, pairOf, type WhosOlderData } from "./game";
import { canSave, readSaved, saveBest, saveRun, type Store } from "./storage";

const pool = buildPool(data as unknown as WhosOlderData);
const memoryStore = (): Store & { items: Map<string, string> } => {
  const items = new Map<string, string>();
  return { items, getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, value); } };
};

describe("storage", () => {
  it("keeps the best score of each mode apart, and only ever raises it", () => {
    const store = memoryStore();
    saveBest(store, pool, "streak", 5);
    saveBest(store, pool, "relaxed", 3);
    expect(saveBest(store, pool, "streak", 2)).toEqual({ streak: 5, relaxed: 3 });
    expect(readSaved(store, pool).best).toEqual({ streak: 5, relaxed: 3 });
  });

  it("brings back the same unanswered pair after a reload, so a reload cannot skip a question", () => {
    const store = memoryStore();
    const run = newRun(pool, "streak", "mixed", 8);
    saveRun(store, pool, run);
    const resumed = readSaved(store, pool).run!;
    expect(resumed).toEqual(run);
    expect(current(resumed).pick).toBeNull();
  });

  it("resumes an answered run as it was, and an ended run stays ended", () => {
    const store = memoryStore();
    let run = newRun(pool, "streak", "mixed", 9);
    run = answer(pool, run, pairOf(pool, current(run))!.second.id);
    saveRun(store, pool, run);
    expect(readSaved(store, pool).run).toEqual(run); // the miss cannot be undone
    run = next(pool, run);
    saveRun(store, pool, run);
    expect(readSaved(store, pool).run?.over).toBe(true);
  });

  it("drops a saved run made from older data but keeps the best scores", () => {
    const store = memoryStore();
    saveBest(store, pool, "streak", 12);
    saveRun(store, pool, { ...newRun(pool, "streak", "mixed", 10), stamp: "older-data" });
    expect(readSaved(store, pool)).toEqual({ version: 1, best: { streak: 12, relaxed: 0 } });
  });

  it("drops a saved run naming a pair that is no longer askable", () => {
    const store = memoryStore();
    store.setItem("bp-whos-older", JSON.stringify({ version: 1, best: { streak: 4, relaxed: 1 },
      run: { ...newRun(pool, "streak", "mixed", 11), rounds: [{ left: "peter-mat-4-18", right: "paul-act-7-58", pick: null }] } }));
    expect(readSaved(store, pool)).toEqual({ version: 1, best: { streak: 4, relaxed: 1 } });
  });

  it("plays on without saving when storage is missing, full or corrupt", () => {
    const run = newRun(pool, "relaxed", "easy", 12);
    expect(canSave(null)).toBe(false);
    expect(readSaved(null, pool)).toEqual({ version: 1, best: { streak: 0, relaxed: 0 } });
    expect(() => saveRun(null, pool, run)).not.toThrow();
    expect(saveBest(null, pool, "streak", 3)).toEqual({ streak: 3, relaxed: 0 });

    const full: Store = { getItem: () => null, setItem: () => { throw new DOMException("full", "QuotaExceededError"); } };
    expect(canSave(full)).toBe(false);
    expect(() => saveRun(full, pool, run)).not.toThrow();
    expect(() => saveBest(full, pool, "relaxed", 2)).not.toThrow();

    const corrupt = memoryStore();
    corrupt.setItem("bp-whos-older", "{not json");
    expect(readSaved(corrupt, pool)).toEqual({ version: 1, best: { streak: 0, relaxed: 0 } });
  });
});
