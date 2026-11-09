// The browser record (design §9) and the changes a round makes to it: a damaged or foreign record comes back sound,
// unknown ids are dropped and retired ones kept, a round from another pool is dropped, each card is saved once by the
// tab that owns the round, totals and the streak count once, and storage that throws leaves the game playable.
import { commitCard, finishRound, leaveRound, startRound, takeOver, addPassage } from "./progress";
import { browserStore, freshRecord, readRecord, rebuild, writeRecord, STORAGE_KEY, type VerseRecord } from "./storage";
import { DEFAULT_SETTINGS } from "./model";

const known = new Set(["jhn-3-16", "psa-23-1", "gen-1-1", "old-retired"]);
const STAMP = "stamp-a";
const TODAY = 20_000;

function withRound(record = freshRecord(), owner = "tab-a"): VerseRecord {
  return startRound(record, { id: "r1", seed: 9, review: false, settings: { ...DEFAULT_SETTINGS, level: "hard" }, ids: ["jhn-3-16", "psa-23-1"], stamp: STAMP, owner });
}

describe("verse completion record: reading", () => {
  it("rebuilds anything damaged into a sound record", () => {
    for (const bad of [null, 7, "x", [], { v: 9, settings: "no", passages: [], recent: {}, days: null, totals: [1] }]) {
      expect(rebuild(bad, known, STAMP)).toEqual(freshRecord());
    }
  });

  it("clamps numbers, keeps known and retired ids, drops unknown ones and caps the recent list", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const record = rebuild({
      settings: { answer: "type", style: "letters", level: "extreme", testament: "nt" },
      passages: { "jhn-3-16": { played: -4, best: 400, box: 9, due: 3.7, memorised: true }, "old-retired": { box: 2, due: 5 }, ghost: { box: 1 } },
      recent: [...Array.from({ length: 80 }, () => "gen-1-1"), "psa-23-1", "ghost", 5],
      days: { streak: 3, best: "x", last: 19_999 }, totals: { rounds: 2.9, cards: -1, stars: 12 },
    }, known, STAMP);
    expect(record.settings).toEqual({ answer: "type", style: "letters", level: "easy", testament: "nt" });
    expect(record.passages["jhn-3-16"]).toEqual({ played: 0, best: 100, last: 0, box: 5, due: 3, memorised: true });
    expect(record.passages["old-retired"]).toMatchObject({ box: 2, due: 5, memorised: false });
    expect(record.passages.ghost).toBeUndefined();
    expect(record.recent).toEqual(["gen-1-1", "psa-23-1"]);
    expect(record.days).toEqual({ streak: 3, best: 0, last: 19_999 });
    expect(record.totals).toEqual({ rounds: 2, cards: 0, stars: 12 });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("drops a round from another pool, a round with unknown ids, and keeps only an ordered prefix of done cards", () => {
    const round = withRound().round!;
    expect(rebuild({ round: { ...round, pool: "stamp-b" } }, known, STAMP).round).toBeNull();
    expect(rebuild({ round: { ...round, ids: ["jhn-3-16", "ghost"] } }, known, STAMP).round).toBeNull();
    const done = [{ id: "jhn-3-16", status: "answered", accuracy: 250, stars: 7 }, { id: "jhn-3-16", status: "answered", accuracy: 1, stars: 1 }];
    expect(rebuild({ round: { ...round, done } }, known, STAMP).round!.done).toEqual([{ id: "jhn-3-16", status: "answered", accuracy: 100, stars: 3 }]);
  });
});

describe("verse completion record: a round", () => {
  it("saves each card once, by its index, with its progress and the totals", () => {
    let record = addPassage(withRound(), "jhn-3-16", TODAY - 1);
    const first = commitCard(record, "r1", 0, "tab-a", { id: "jhn-3-16", status: "answered", accuracy: 95, stars: 3 }, TODAY);
    if (typeof first === "string") throw new Error(first);
    expect(first.change).toMatchObject({ kind: "up", box: 2 });
    record = first.record;
    expect(record.totals).toEqual({ rounds: 0, cards: 1, stars: 3 });
    expect(commitCard(record, "r1", 0, "tab-a", { id: "jhn-3-16", status: "answered", accuracy: 95, stars: 3 }, TODAY)).toBe("repeat");
    expect(commitCard(record, "r0", 1, "tab-a", { id: "psa-23-1", status: "answered", accuracy: 95, stars: 3 }, TODAY)).toBe("gone");
    expect(commitCard(record, "r1", 1, "tab-b", { id: "psa-23-1", status: "answered", accuracy: 95, stars: 3 }, TODAY)).toBe("elsewhere");
    const taken = takeOver(record, "tab-b");
    expect(typeof commitCard(taken, "r1", 1, "tab-b", { id: "psa-23-1", status: "skipped", accuracy: 0, stars: 0 }, TODAY)).toBe("object");
  });

  it("records a skip on the round only, and counts the round and the streak once", () => {
    let record = withRound();
    for (const [index, id] of ["jhn-3-16", "psa-23-1"].entries()) {
      const outcome = commitCard(record, "r1", index, "tab-a", { id, status: index ? "skipped" : "answered", accuracy: index ? 0 : 50, stars: index ? 0 : 1 }, TODAY);
      if (typeof outcome === "string") throw new Error(outcome);
      record = outcome.record;
    }
    expect(record.passages["psa-23-1"]).toBeUndefined();
    record = finishRound(record, "r1", TODAY);
    record = finishRound(record, "r1", TODAY);
    expect(record.totals.rounds).toBe(1);
    expect(record.days).toEqual({ streak: 1, best: 1, last: TODAY });
    expect(record.recent).toEqual(["jhn-3-16", "psa-23-1"]);
    expect(leaveRound(record).round).toBeNull();
  });

  it("gives an all-skipped round no streak day", () => {
    let record = withRound();
    for (const [index, id] of ["jhn-3-16", "psa-23-1"].entries()) {
      const outcome = commitCard(record, "r1", index, "tab-a", { id, status: "skipped", accuracy: 0, stars: 0 }, TODAY);
      if (typeof outcome === "string") throw new Error(outcome);
      record = outcome.record;
    }
    expect(finishRound(record, "r1", TODAY).days.streak).toBe(0);
  });
});

describe("verse completion record: storage", () => {
  it("writes and reads back through localStorage under bp-verse-completion", () => {
    localStorage.clear();
    const store = browserStore()!;
    const record = withRound();
    writeRecord(store, record);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).round.id).toBe("r1");
    expect(readRecord(store, known, STAMP)).toEqual(record);
    expect(readRecord(store, known, "stamp-new").round).toBeNull();
  });

  it("keeps the game playable when storage throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); }, removeItem: () => {} } as unknown as Storage;
    expect(readRecord(broken, known, STAMP)).toEqual(freshRecord());
    expect(() => writeRecord(broken, freshRecord())).not.toThrow();
    expect(readRecord(null, known, STAMP)).toEqual(freshRecord());
    warn.mockRestore();
  });
});
