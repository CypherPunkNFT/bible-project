// What came first?: what the browser keeps (design §7): bests per category and mode, a saved run that resumes only while
// its data is unchanged, the last pill chosen, storage that fails, and the one-time carry-over of Who's older?'s bests
// and saved run into Who lived first, tested with the old key set exactly as Who's older? wrote it.
import whosOlder from "@/data/whos-older/whos-older.json";
import { answer, current, newRun, next, pairOf, type Run } from "./game";
import { KEY, OLD_KEY, canSave, readSaved, runFits, saveBest, saveChoice, saveRun, type Store } from "./storage";
import { englishPools } from "./test-pools";

const pools = englishPools();
const memory = (): Store & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } };
};
const rightPick = (run: Run) => { const r = current(run); return r.category === "firsts" ? 0 : pairOf(pools, r)!.first.id; };

/** A Who's older? save as its own storage.ts wrote it: version 1, bests, and a run of {left, right, pick} rounds. */
function oldSave(): string {
  const pairs = pools.lived!.byBand.easy;
  return JSON.stringify({ version: 1, best: { streak: 14, relaxed: 9 }, run: {
    stamp: whosOlder.stamp, mode: "streak", difficulty: "mixed", seed: 777, hearts: 3, over: false,
    rounds: [{ left: pairs[0].first.id, right: pairs[0].second.id, pick: pairs[0].first.id }, { left: pairs[1].second.id, right: pairs[1].first.id, pick: null }],
  } });
}

describe("storage", () => {
  it("keeps the best of each category and mode apart, and only ever raises it", () => {
    const store = memory();
    saveBest(store, "ruled", "streak", 5);
    saveBest(store, "ruled", "streak", 3);
    saveBest(store, "mixed", "relaxed", 7);
    const { best } = readSaved(store);
    expect(best.ruled).toEqual({ streak: 5, relaxed: 0 });
    expect(best.mixed).toEqual({ streak: 0, relaxed: 7 });
    expect(best.lived).toBeUndefined();
  });

  it("brings back a Mixed run's unanswered round after a reload, and remembers the last pill", () => {
    const store = memory();
    let run = newRun(pools, "mixed", "streak", "mixed", 31)!;
    for (let i = 0; i < 6; i++) run = next(pools, answer(pools, run, rightPick(run)));
    saveRun(store, run);
    saveChoice(store, "books");
    const saved = readSaved(store);
    expect(saved.run).toEqual(run);
    expect(saved.choice).toBe("books");
    expect(runFits(saved.run!, pools)).toBe(true);
  });

  it("drops a saved run whose data changed in any category it dealt from, keeping the bests", () => {
    const store = memory();
    const run = newRun(pools, "built", "relaxed", "easy", 4)!;
    saveRun(store, run);
    saveBest(store, "built", "relaxed", 2);
    expect(runFits(readSaved(store).run!, { ...pools, built: { ...pools.built!, stamp: "changed" } })).toBe(false);
    expect(readSaved(store).best.built).toEqual({ streak: 0, relaxed: 2 });
  });

  it("refuses a saved run that is not the shape it should be", () => {
    const store = memory();
    const run = newRun(pools, "firsts", "streak", "mixed", 4)!;
    const bad = { ...run, rounds: [{ ...current(run), order: [0, 0, 1] }] };
    store.setItem(KEY, JSON.stringify({ version: 1, best: {}, run: bad }));
    expect(readSaved(store).run).toBeUndefined();
    store.setItem(KEY, JSON.stringify({ version: 1, best: {}, run: { ...run, choice: "ruled" } }));
    expect(readSaved(store).run).toBeUndefined(); // a Bible Firsts round in a Rulers run
  });

  it("plays on without saving when storage is missing, full or corrupt", () => {
    expect(canSave(null)).toBe(false);
    const full: Store = { getItem: () => null, setItem: () => { throw new Error("full"); } };
    expect(canSave(full)).toBe(false);
    expect(() => saveBest(full, "lived", "streak", 3)).not.toThrow();
    const corrupt = memory();
    corrupt.setItem(KEY, "{not json");
    expect(readSaved(corrupt).best).toEqual({});
  });
});

describe("carrying over Who's older?", () => {
  it("makes the old bests Who lived first's, resumes the old run on the same pair, and leaves the old key untouched", () => {
    const store = memory();
    const old = oldSave();
    store.setItem(OLD_KEY, old);
    const saved = readSaved(store);
    expect(saved.best.lived).toEqual({ streak: 14, relaxed: 9 });
    expect(saved.choice).toBe("lived");
    expect(saved.run!.choice).toBe("lived");
    expect(saved.run!.stamps).toEqual({ lived: whosOlder.stamp });
    const oldRun = JSON.parse(old).run;
    expect(saved.run!.rounds).toEqual(oldRun.rounds.map((r: object) => ({ category: "lived", ...r })));
    expect(saved.run!.seed).toBe(777);
    expect(runFits(saved.run!, pools)).toBe(true);
    expect(store.data.get(OLD_KEY)).toBe(old); // byte for byte
    expect(JSON.parse(store.data.get(KEY)!).best.lived).toEqual({ streak: 14, relaxed: 9 }); // written at once
  });

  it("runs only once: later scores are kept, never overwritten by the old ones", () => {
    const store = memory();
    store.setItem(OLD_KEY, oldSave());
    readSaved(store);
    saveBest(store, "lived", "streak", 20);
    expect(readSaved(store).best.lived).toEqual({ streak: 20, relaxed: 9 });
  });

  it("keeps the old bests even when the old run is broken, and migrates nothing from corrupt data", () => {
    const store = memory();
    store.setItem(OLD_KEY, JSON.stringify({ version: 1, best: { streak: 4, relaxed: 2 }, run: { stamp: 5 } }));
    const saved = readSaved(store);
    expect(saved.best.lived).toEqual({ streak: 4, relaxed: 2 });
    expect(saved.run).toBeUndefined();
    const corrupt = memory();
    corrupt.setItem(OLD_KEY, "{broken");
    expect(readSaved(corrupt)).toEqual({ version: 1, best: {} });
    expect(corrupt.data.has(KEY)).toBe(false); // a new player still opens on Mixed
  });
});
