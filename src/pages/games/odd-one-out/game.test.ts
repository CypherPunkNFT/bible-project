// Odd one out: the game's logic and what it keeps on the device (design sections 9, 12 and 14).
import setsJson from "@/data/odd-one-out/sets.json";
import { ROUND_LENGTH, buildRound, headline, isAvailable, joinNames, playablePool, poolFor, scoreRound, seededRng,
  shuffle, verseHref, verseLabel, type SetsFile } from "./game";
import { readBest, readRound, readSeen, rememberSeen, saveBest, takeOpener, type RoundState, type Store } from "./storage";

const data = setsJson as unknown as SetsFile;

function memoryStore(initial: Record<string, string> = {}): Store {
  const values = new Map(Object.entries(initial));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}

describe("odd one out rounds", () => {
  it("draws ten distinct sets of the chosen kind and difficulty", () => {
    const ids = buildRound(data, "person", "easy", [], seededRng(1));
    expect(ids).toHaveLength(ROUND_LENGTH);
    expect(new Set(ids).size).toBe(ROUND_LENGTH);
    const byId = new Map(data.sets.map((s) => [s.id, s]));
    for (const id of ids) expect(byId.get(id)).toMatchObject({ kind: "person", difficulty: "easy" });
  });

  it("opens a new player's first Easy People round with the owner's example, and only that round", () => {
    expect(buildRound(data, "person", "easy", [], seededRng(2), true)[0]).toBe(data.first);
    const later = Array.from({ length: 20 }, (_, n) => buildRound(data, "person", "easy", [], seededRng(n + 10))[0]);
    expect(later.some((id) => id !== data.first)).toBe(true);
    expect(buildRound(data, "place", "easy", [], seededRng(3), true)).not.toContain(data.first);
  });

  it("skips sets seen lately, then brings back the oldest seen when the pool runs out", () => {
    const pool = poolFor(data, "person", "easy").map((s) => s.id);
    const seen = pool.slice(0, pool.length - 4);
    const ids = buildRound(data, "person", "easy", seen, seededRng(4));
    expect(ids.slice(0, 4).sort()).toEqual(pool.slice(-4).sort());
    expect(ids.slice(4)).toEqual(seen.slice(0, 6));
  });

  it("mixes only kinds that are offered on their own", () => {
    for (const set of playablePool(data, "mixed", "medium")) expect(isAvailable(data, set.kind, "medium")).toBe(true);
    expect(new Set(playablePool(data, "mixed", "easy").map((s) => s.kind)).size).toBeGreaterThan(1);
  });

  it("reports a combination with too few sets as unavailable", () => {
    const thin = { ...data, sets: data.sets.filter((s) => !(s.kind === "book" && s.difficulty === "hard")).concat(
      data.sets.filter((s) => s.kind === "book" && s.difficulty === "hard").slice(0, data.minSets - 1)) };
    expect(isAvailable(thin, "book", "hard")).toBe(false);
    expect(isAvailable({ ...data, sets: [] }, "mixed", "easy")).toBe(false);
  });
});

describe("odd one out shuffling and scoring", () => {
  it("shuffles into a permutation, with the odd one in each place about equally often", () => {
    const rng = seededRng(5);
    const places = [0, 0, 0, 0];
    const rounds = 4000;
    for (let n = 0; n < rounds; n += 1) {
      const order = shuffle(["a", "b", "c", "odd"], rng);
      expect([...order].sort()).toEqual(["a", "b", "c", "odd"]);
      places[order.indexOf("odd")] += 1;
    }
    for (const count of places) expect(Math.abs(count / rounds - 0.25)).toBeLessThan(0.03);
  });

  it("scores one point a right answer and keeps the best streak", () => {
    expect(scoreRound([true, true, false, true, true, true, false, false, true, false])).toEqual({ score: 6, bestStreak: 3 });
    expect(scoreRound([])).toEqual({ score: 0, bestStreak: 0 });
  });

  it("words the reason from the rule's phrases", () => {
    const first = data.sets.find((s) => s.id === data.first)!;
    const { odd, oddPhrase, rest } = headline(data, first);
    expect(`${odd} ${oddPhrase}. ${rest}`).toMatch(/^Paul was not with Jesus during his ministry\. (Peter|John|James), .+ and .+ followed Jesus during his ministry\.$/);
    expect(joinNames(["Peter", "John", "James"])).toBe("Peter, John and James");
  });

  it("names and links verses the way the reader expects", () => {
    expect(verseLabel(data, 40004018)).toBe("Matthew 4:18");
    expect(verseLabel(data, 40004018, 40004019)).toBe("Matthew 4:18–19");
    expect(verseHref(data, 40004018, 40004019)).toBe("/read/bsb/MAT/4?hl=18-19");
  });
});

describe("odd one out storage", () => {
  it("remembers seen sets, newest last, at most two hundred", () => {
    const store = memoryStore();
    rememberSeen(store, ["a", "b"]);
    rememberSeen(store, ["a"]);
    expect(readSeen(store)).toEqual(["b", "a"]);
    rememberSeen(store, Array.from({ length: 250 }, (_, n) => `x${n}`));
    expect(readSeen(store)).toHaveLength(200);
  });

  it("keeps the best score for each choice", () => {
    const store = memoryStore();
    expect(saveBest(store, "person", "easy", 6)).toBe(6);
    expect(saveBest(store, "person", "easy", 4)).toBe(6);
    expect(readBest(store)).toEqual({ "person:easy": 6 });
  });

  it("opens with the owner's example once per device, and never where storage can't remember it", () => {
    const store = memoryStore();
    expect(takeOpener(store)).toBe(true);
    expect(takeOpener(store)).toBe(false);
    const refusing: Store = { getItem: () => null, setItem: () => { throw new Error("blocked"); } };
    expect(takeOpener(refusing)).toBe(false);
    expect(takeOpener(null)).toBe(false);
  });

  it("ignores corrupt or refused storage", () => {
    const corrupt = memoryStore({ "bp-odd-one-out-seen": "{not json", "bp-odd-one-out-best": "[1,2]", "bp-odd-one-out-round": "7" });
    expect(readSeen(corrupt)).toEqual([]);
    expect(readBest(corrupt)).toEqual({});
    expect(readRound(corrupt, data)).toBeNull();
    const refusing: Store = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
    expect(readSeen(refusing)).toEqual([]);
    expect(() => rememberSeen(refusing, ["a"])).not.toThrow();
    expect(saveBest(null, "place", "hard", 3)).toBe(3);
  });

  it("resumes a saved round only while it still matches the sets file", () => {
    const set = data.sets[0];
    const round: RoundState = { stamp: data.stamp, choice: "person", difficulty: "easy", ids: [set.id],
      orders: [[...set.items].reverse()], picks: [null], index: 0 };
    const store = memoryStore({ "bp-odd-one-out-round": JSON.stringify(round) });
    expect(readRound(store, data)).toEqual(round);
    const stale = memoryStore({ "bp-odd-one-out-round": JSON.stringify({ ...round, stamp: "old" }) });
    expect(readRound(stale, data)).toBeNull();
    const tampered = memoryStore({ "bp-odd-one-out-round": JSON.stringify({ ...round, orders: [["x", "y", "z", "w"]] }) });
    expect(readRound(tampered, data)).toBeNull();
    const halfway = memoryStore({ "bp-odd-one-out-round": JSON.stringify({ ...round, index: 0.5 }) });
    expect(readRound(halfway, data)).toBeNull();
  });
});
