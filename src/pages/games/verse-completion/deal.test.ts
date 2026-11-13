// Dealing rounds and reviews (design §7.3, §8.3) over a made-up pool of ids: ten passages, none retired or due, none
// recent unless the filter leaves too few, at most two per book, unplayed first, tiers in proportion, seeded.
import { freshProgress, type Progress } from "./boxes";
import { dealReview, dealRound, dueQueue } from "./deal";
import type { Passage, Tier } from "./model";

const TODAY = 20_000;

/** 30 books × 8 passages; books 1–15 Old Testament. Tier by position: 3 Famous, 3 Well known, 2 Deeper per book. */
function fixturePool(): Passage[] {
  const pool: Passage[] = [];
  for (let book = 1; book <= 30; book++) {
    for (let n = 1; n <= 8; n++) {
      const num = book <= 15 ? book : book + 24;
      const tier: Tier = n <= 3 ? 1 : n <= 6 ? 2 : 3;
      const from = num * 1e6 + 1000 + n;
      pool.push({ id: `b${num}-${n}`, from, to: from, tier, testament: num < 40 ? "ot" : "nt", words: 20,
        split: { easy: 13, medium: 9, hard: 4 }, decoys: { easy: ["x", "y"], medium: ["x", "y"] } });
    }
  }
  return pool;
}

const pool = fixturePool();
const byId = new Map(pool.map((passage) => [passage.id, passage]));
const bookOf = (id: string) => Math.floor(byId.get(id)!.from / 1e6);
const all = { level: "hard" as const, testament: "all" as const };

describe("verse completion: dealing a round", () => {
  it("deals ten distinct passages, at most two per book, and the same seed deals the same round", () => {
    const ids = dealRound(pool, all, {}, [], TODAY, 42);
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    const perBook = new Map<number, number>();
    ids.forEach((id) => perBook.set(bookOf(id), (perBook.get(bookOf(id)) ?? 0) + 1));
    expect(Math.max(...perBook.values())).toBeLessThanOrEqual(2);
    expect(dealRound(pool, all, {}, [], TODAY, 42)).toEqual(ids);
    expect(dealRound(pool, all, {}, [], TODAY, 43)).not.toEqual(ids);
  });

  it("never deals a retired passage or one due in My verses", () => {
    const retired = pool.map((passage) => (passage.tier === 1 && bookOf(passage.id) < 10 ? { ...passage, retired: true as const } : passage));
    const due: Record<string, Progress> = { "b10-1": { ...freshProgress(), box: 2, due: TODAY } };
    for (let seed = 0; seed < 50; seed++) {
      const ids = dealRound(retired, { level: "easy", testament: "all" }, due, [], TODAY, seed);
      expect(ids.some((id) => bookOf(id) < 10 && byId.get(id)!.tier === 1)).toBe(false);
      expect(ids).not.toContain("b10-1");
    }
  });

  it("keeps the level's tiers in proportion and fills Easy from Famous only when it can", () => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (let seed = 0; seed < 40; seed++) for (const id of dealRound(pool, all, {}, [], TODAY, seed)) counts[byId.get(id)!.tier]++;
    expect(counts).toEqual({ 1: 120, 2: 160, 3: 120 });
    const easy = dealRound(pool, { level: "easy", testament: "all" }, {}, [], TODAY, 1);
    expect(easy.every((id) => byId.get(id)!.tier === 1)).toBe(true);
  });

  it("deals from a group of books, taking more from each book when the group has few (owner, 2026-11-13)", () => {
    const gospels = dealRound(pool, { level: "hard", testament: "gospels" }, {}, [], TODAY, 4);
    expect(gospels).toHaveLength(10);
    expect(gospels.every((id) => bookOf(id) >= 40 && bookOf(id) <= 43)).toBe(true);
    const perBook = new Map<number, number>();
    for (const id of gospels) perBook.set(bookOf(id), (perBook.get(bookOf(id)) ?? 0) + 1);
    expect(Math.max(...perBook.values())).toBeLessThanOrEqual(3); // four books share ten
    const psalms = Array.from({ length: 12 }, (_, n): Passage => ({ ...pool[0], id: `ps-${n}`, from: 19e6 + 1000 + n, to: 19e6 + 1000 + n }));
    expect(dealRound([...pool, ...psalms], { level: "easy", testament: "psalms" }, {}, [], TODAY, 4)).toHaveLength(10); // one book gives a full round
    const law = dealRound(pool, { level: "easy", testament: "law" }, {}, [], TODAY, 2);
    expect(law.every((id) => bookOf(id) <= 5)).toBe(true);
  });

  it("respects the testament filter and fills a short tier from the next one", () => {
    const small = pool.filter((passage) => passage.testament === "nt" || passage.tier > 1 || bookOf(passage.id) <= 2);
    const ids = dealRound(small, { level: "easy", testament: "ot" }, {}, [], TODAY, 5);
    expect(ids).toHaveLength(10);
    expect(ids.every((id) => byId.get(id)!.testament === "ot")).toBe(true);
    expect(ids.filter((id) => byId.get(id)!.tier === 1)).toHaveLength(4); // books 1 and 2 give two each
  });

  it("deals unplayed passages first and leaves out the last 60 dealt unless the filter leaves too few", () => {
    const played: Record<string, Progress> = Object.fromEntries(pool.filter((passage) => passage.tier === 1 && bookOf(passage.id) > 5)
      .map((passage) => [passage.id, { ...freshProgress(), played: 1 }]));
    const ids = dealRound(pool, { level: "easy", testament: "all" }, played, [], TODAY, 9);
    expect(ids.every((id) => !played[id])).toBe(true);
    const recent = pool.filter((passage) => passage.tier === 1).slice(0, 60).map((passage) => passage.id);
    const fresh = dealRound(pool, { level: "easy", testament: "all" }, {}, recent, TODAY, 3);
    expect(fresh.filter((id) => recent.includes(id))).toEqual([]);
    const tight = dealRound(pool.filter((passage) => bookOf(passage.id) <= 21), { level: "easy", testament: "all" }, {}, recent, TODAY, 3);
    expect(tight).toHaveLength(10);
    const back = tight.filter((id) => recent.includes(id));
    expect(back.length).toBeGreaterThan(0);
    expect(Math.max(...back.map((id) => recent.indexOf(id)))).toBeLessThan(recent.length - 40); // the oldest come back first
  });

  it("deals what fits when fewer than ten can be dealt, and nothing when none can", () => {
    const tiny = pool.filter((passage) => bookOf(passage.id) <= 2);
    expect(dealRound(tiny, all, {}, [], TODAY, 1)).toHaveLength(4);
    expect(dealRound([], all, {}, [], TODAY, 1)).toEqual([]);
  });
});

describe("verse completion: reviews", () => {
  it("plays the most overdue first, at most ten, ignoring tier, testament and the book cap", () => {
    const progress: Record<string, Progress> = {};
    pool.filter((passage) => bookOf(passage.id) === 1).forEach((passage, i) => { progress[passage.id] = { ...freshProgress(), box: 1, due: TODAY - i }; });
    pool.filter((passage) => bookOf(passage.id) === 2).forEach((passage, i) => { progress[passage.id] = { ...freshProgress(), box: 3, due: TODAY - 20 + i }; });
    progress["b3-1"] = { ...freshProgress(), box: 2, due: TODAY + 1 };
    const review = dealReview(pool, progress, TODAY);
    expect(review).toHaveLength(10);
    expect(review.slice(0, 8).every((id) => bookOf(id) === 2)).toBe(true);
    expect(review[0]).toBe("b2-1");
    expect(dueQueue(pool, progress, TODAY)).toHaveLength(16);
    expect(review).not.toContain("b3-1");
  });
});
