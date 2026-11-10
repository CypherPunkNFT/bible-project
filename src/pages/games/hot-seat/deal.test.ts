// Hot seat's drawing (design §3.3–3.4, §11), with a seeded random function: no repeats in a session, the opening-words
// and topic rules, the Teens and adults warm-up, two choices, the seen list and what happens when a pool runs dry.
import { SEEN_FLOOR, SEEN_MAX, addSeen, available, drawNext, freeze, type FrozenQuestion } from "./deal";
import { firstWords } from "./words";
import { bankQuestion, fixtureQuestions, seeded } from "./hot-seat.test.fixture";
import { GROUP_KEYS, eligibleQuestions, poolFor, poolsOf, type PoolEntry } from "./pool";

const pools = poolsOf(fixtureQuestions(7800)); // Little ones get a sixth: 1,300, enough for 1,200 draws

/** Simulates `turns` turns of `draws` questions each for one pool, as the page does. */
function simulate(pool: PoolEntry[], turns: number, draws: number, random: () => number, warmUp = false) {
  const asked: string[] = [];
  const allTurns: FrozenQuestion[][] = [];
  for (let t = 0; t < turns; t++) {
    const turn: FrozenQuestion[] = [];
    for (let d = 0; d < draws; d++) {
      const q = drawNext({ pool, asked, seen: [], turn, warmUp: warmUp && turn.length < 2, twoChoices: false, random });
      if (!q) throw new Error("the pool ran out");
      turn.push(q);
      asked.push(q.id);
    }
    allTurns.push(turn);
  }
  return { asked, allTurns };
}

describe("hot seat drawing", () => {
  it("never repeats a question in a session: 60 turns of 20 draws for every group", () => {
    for (const group of GROUP_KEYS) {
      const { asked } = simulate(poolFor(pools, group, ""), 60, 20, seeded(7));
      expect(new Set(asked).size, group).toBe(asked.length);
    }
  });

  it("varies the opening words within a turn and avoids the same topic twice running", () => {
    const { allTurns } = simulate(poolFor(pools, "adults", ""), 30, 10, seeded(11));
    let sameTopic = 0;
    for (const turn of allTurns) {
      const openings = turn.map((q) => firstWords(q.text));
      expect(new Set(openings).size).toBe(openings.length);
      for (let i = 1; i < turn.length; i++) if (turn[i].topic === turn[i - 1].topic) sameTopic++;
    }
    expect(sameTopic).toBeLessThan(5); // six topics and six tries: a repeat is rare
  });

  it("opens every Teens and adults turn with two easy questions", () => {
    const { allTurns } = simulate(poolFor(pools, "adults", ""), 40, 6, seeded(3), true);
    for (const turn of allTurns) expect(turn.slice(0, 2).map((q) => q.level)).toEqual(["easy", "easy"]);
    expect(allTurns.flatMap((t) => t.slice(2)).some((q) => q.level !== "easy")).toBe(true);
  });

  it("reads two choices: the right one and one of that question's own wrong options, in both orders", () => {
    const [entry] = eligibleQuestions([bankQuestion(5)], false);
    const random = seeded(5);
    const firsts = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const q = freeze(entry, true, random);
      expect(q.choices).toHaveLength(2);
      expect(q.choices).toContain("Answer 5");
      expect(q.choices!.filter((c) => c !== "Answer 5").every((c) => ["Wrong 5a", "Wrong 5b", "Wrong 5c"].includes(c))).toBe(true);
      firsts.add(q.choices![0]);
    }
    expect(firsts.has("Answer 5")).toBe(true);
    expect(firsts.size).toBeGreaterThan(1);
    expect(freeze(entry, false, random).choices).toBeNull();
  });

  it("skips the seen list, letting its oldest entries back only when fewer than 200 unseen remain", () => {
    const pool = poolFor(pools, "experts", "");
    const ids = pool.map((e) => e.frozen.id);
    const seenSome = ids.slice(0, 100);
    expect(available(pool, new Set(), seenSome).some((e) => seenSome.includes(e.frozen.id))).toBe(false);
    const seenMost = ids.slice(0, ids.length - 50); // only 50 unseen left
    const open = available(pool, new Set(), seenMost).map((e) => e.frozen.id);
    expect(open).toHaveLength(SEEN_FLOOR);
    expect(new Set(open)).toEqual(new Set([...ids.slice(ids.length - 50), ...seenMost.slice(0, SEEN_FLOOR - 50)]));
  });

  it("asks again, oldest first and never twice in one turn, once a whole pool has been asked (§12)", () => {
    const pool = eligibleQuestions(fixtureQuestions(3), false);
    const random = seeded(1);
    const asked = pool.map((e) => e.frozen.id);
    const turn: FrozenQuestion[] = [];
    const first = drawNext({ pool, asked, seen: [], turn, warmUp: false, twoChoices: false, random })!;
    expect(first.earlier).toBe(true);
    expect(first.id).toBe(asked[0]);
    turn.push(first);
    asked.push(first.id);
    const second = drawNext({ pool, asked, seen: [], turn, warmUp: false, twoChoices: false, random })!;
    expect(second.id).toBe(pool[1].frozen.id);
    expect(drawNext({ pool: [], asked: [], seen: [], turn: [], warmUp: false, twoChoices: false, random })).toBeNull();
  });

  it("keeps the seen list newest last, without duplicates, at most 2,000 long", () => {
    expect(addSeen(["a", "b", "c"], ["b", "d"])).toEqual(["a", "c", "b", "d"]);
    const long = addSeen(Array.from({ length: SEEN_MAX }, (_, i) => `id${i}`), ["new"]);
    expect(long).toHaveLength(SEEN_MAX);
    expect(long.at(-1)).toBe("new");
    expect(long[0]).toBe("id1");
  });
});
