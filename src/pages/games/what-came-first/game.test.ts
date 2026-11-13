// What came first?: dealing and the run (design §6): Who's older?'s rules in every pair category (the ramp, no repeats,
// "one stays", a left card that is right only about half the time, how each mode ends, the locked first tap), the
// general giveaway rule, Journeys' one-traveller pairs, Bible Firsts (each question once, a run that asks them all ends
// complete) and Mixed (never three of a kind running, Bible Firsts never twice running, nobody stays).
import { CATEGORY_KEYS } from "./categories";
import { answer, answersOf, askedAll, bandFor, current, drawCategory, endsRun, isPairRound, isRight, newRun, next, pairOf, questionOf, score,
  streakNow, whoStays, type Mode, type Difficulty, type PairRound, type Run } from "./game";
import { PAIR_CATEGORIES, pairKey, type PairCategory } from "./order";
import { englishPools } from "./test-pools";

const pools = englishPools();

/** The right answer for the round on screen, or a wrong one. */
function pickFor(run: Run, right: boolean): string | number {
  const round = current(run);
  if (isPairRound(round)) { const pair = pairOf(pools, round)!; return right ? pair.first.id : pair.second.id; }
  return right ? 0 : round.order.find((i) => i !== 0)!;
}

/** Plays `rounds` right answers (or until the run ends) and returns the run, its last round answered. */
function playRight(run: Run, rounds: number): Run {
  for (let n = 1; n < rounds && !run.over; n++) run = next(pools, answer(pools, run, pickFor(run, true)));
  return run.over ? run : answer(pools, run, pickFor(run, true));
}
const start = (choice: Parameters<typeof newRun>[1], mode: Mode, difficulty: Difficulty, seed: number) => newRun(pools, choice, mode, difficulty, seed)!;

describe("the ramp", () => {
  it("is Easy for rounds 1–5, Easy or Medium for 6–15, then Medium or Hard with Hard 40%", () => {
    for (const n of [1, 5]) expect(bandFor("streak", "mixed", n, 0.99)).toBe("easy");
    expect(bandFor("streak", "mixed", 6, 0.49)).toBe("easy");
    expect(bandFor("streak", "mixed", 15, 0.5)).toBe("medium");
    expect(bandFor("streak", "mixed", 16, 0.39)).toBe("hard");
    expect(bandFor("streak", "mixed", 16, 0.4)).toBe("medium");
    expect(bandFor("relaxed", "hard", 1, 0.99)).toBe("hard");
    expect(bandFor("relaxed", "easy", 40, 0.1)).toBe("easy");
  });

  it.each(PAIR_CATEGORIES)("deals Easy pairs for a Streak's first five rounds in %s", (key) => {
    const run = playRight(start(key, "streak", "mixed", 7), 5);
    expect(run.rounds.map((r) => pairOf(pools, r)!.band)).toEqual(["easy", "easy", "easy", "easy", "easy"]);
  });
});

describe.each(PAIR_CATEGORIES)("dealing in %s", (key: PairCategory) => {
  const pool = pools[key]!;
  const long = playRight(start(key, "streak", "mixed", 12345), 150);
  const rounds = long.rounds as PairRound[];

  it("deals only askable pairs of its own category, never the same pair twice", () => {
    for (const r of rounds) { expect(r.category).toBe(key); expect(pairOf(pools, r), `${r.left} / ${r.right}`).toBeDefined(); }
    const keys = rounds.map((r) => pairKey(r.left, r.right));
    expect(new Set(keys).size).toBe(keys.length);
    expect(long.stamps).toEqual({ [key]: pool.stamp });
  });

  it("keeps one card on, but never a giveaway (first or last in all its pairs), and nobody for three rounds", () => {
    for (let i = 1; i < rounds.length; i++) {
      const [before, now] = [rounds[i - 1], rounds[i]];
      if (now.left === before.right || now.left === before.left) expect(pool.giveaways.has(now.left), `${now.left} stayed at ${i + 1}`).toBe(false);
      if (i >= 2) for (const id of [now.left, now.right]) {
        expect([before.left, before.right].includes(id) && [rounds[i - 2].left, rounds[i - 2].right].includes(id), `${id} three rounds running`).toBe(false);
      }
    }
  });

  it("puts the answer on the left about half the time", () => {
    let left = 0, total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const run = playRight(start(key, "relaxed", "mixed", seed), 50);
      for (const r of run.rounds as PairRound[]) { total++; if (pairOf(pools, r)!.first.id === r.left) left++; }
    }
    expect(left / total).toBeGreaterThan(0.4);
    expect(left / total).toBeLessThan(0.6);
  });

  it("deals the same rounds again from the same seed, so a reload cannot reshuffle", () => {
    expect(playRight(start(key, "relaxed", "hard", 99), 20).rounds).toEqual(playRight(start(key, "relaxed", "hard", 99), 20).rounds);
  });
});

describe("the giveaway rule", () => {
  it("never keeps Genesis or Revelation on among the books, nor Adam among the people", () => {
    expect(pools.books!.giveaways.has("GEN")).toBe(true);
    expect(pools.books!.giveaways.has("REV")).toBe(true);
    expect(pools.lived!.giveaways.has("adam-gen-2-19")).toBe(true);
    expect(whoStays(pools.books!, [{ category: "books", left: "EXO", right: "REV", pick: "EXO" }])).toBe("EXO");
  });

  it("pairs journey stops only within one journey, so the challenger is always the same traveller's", () => {
    const run = playRight(start("went", "streak", "mixed", 3), 80);
    for (const r of run.rounds as PairRound[]) expect(pools.went!.byId.get(r.left)!.group).toBe(pools.went!.byId.get(r.right)!.group);
  });
});

describe("Bible Firsts", () => {
  const all = pools.firsts!.questions.length;

  it("asks each question once, its answers in a seeded order, and ends complete when all are asked", () => {
    const run = next(pools, playRight(start("firsts", "streak", "mixed", 5), all + 5));
    expect(run.over).toBe(true);
    expect(run.rounds).toHaveLength(all);
    expect(askedAll(pools, run)).toBe(true);
    expect(score(pools, run)).toBe(all);
    const ids = run.rounds.map((r) => (isPairRound(r) ? "" : r.question));
    expect(new Set(ids).size).toBe(all);
    for (const r of run.rounds) if (!isPairRound(r)) expect([...r.order].sort()).toEqual(answersOf(questionOf(pools, r)!).map((_, i) => i));
  });

  it("finds another band when its own runs out, in Relaxed on Hard and on Easy", () => {
    for (const difficulty of ["hard", "easy"] as const) {
      const run = next(pools, playRight(start("firsts", "relaxed", difficulty, 8), all + 5));
      expect(run.rounds).toHaveLength(all);
      expect(run.over).toBe(true);
    }
  });

  it("locks the first tap and marks only the answer right", () => {
    const run = start("firsts", "streak", "mixed", 2);
    const wrong = answer(pools, run, pickFor(run, false));
    expect(isRight(pools, current(wrong))).toBe(false);
    expect(answer(pools, wrong, 0)).toBe(wrong);
    expect(endsRun(pools, wrong)).toBe(true);
  });
});

describe("Mixed", () => {
  const long = playRight(start("mixed", "relaxed", "mixed", 4242), 400);

  it("deals from every category, never three of a kind running and never Bible Firsts twice running", () => {
    const kinds = long.rounds.map((r) => r.category);
    expect(new Set(kinds)).toEqual(new Set(CATEGORY_KEYS));
    for (let i = 2; i < kinds.length; i++) expect(kinds[i] === kinds[i - 1] && kinds[i] === kinds[i - 2], `three ${kinds[i]} at ${i + 1}`).toBe(false);
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === "firsts" && kinds[i - 1] === "firsts").toBe(false);
    for (const k of new Set(kinds)) expect(long.stamps[k]).toBe(k === "firsts" ? pools.firsts!.stamp : pools[k as PairCategory]!.stamp);
  });

  it("keeps nobody on: each pair round is a fresh pair", () => {
    for (let i = 1; i < long.rounds.length; i++) {
      const [before, now] = [long.rounds[i - 1], long.rounds[i]];
      if (isPairRound(before) && isPairRound(now) && before.category === now.category) {
        expect([now.left, now.right].some((id) => id === before.left || id === before.right), `round ${i + 1} kept a card`).toBe(false);
      }
    }
  });

  it("drops Bible Firsts from the draw once every question is asked", () => {
    const asked: Run = { ...long, rounds: pools.firsts!.questions.map((q) => ({ category: "firsts" as const, question: q.id, order: [0, 1, 2], pick: 0 })) };
    for (const roll of [0, 0.3, 0.6, 0.99]) expect(drawCategory(pools, asked, roll)).not.toBe("firsts");
  });
});

describe("how a run ends", () => {
  it("ends a Streak at the first miss, after its reveal", () => {
    let run = playRight(start("ruled", "streak", "mixed", 11), 3);
    run = next(pools, run);
    run = answer(pools, run, pickFor(run, false));
    expect(endsRun(pools, run)).toBe(true);
    expect(run.over).toBe(false);
    expect(next(pools, run).over).toBe(true);
    expect(score(pools, run)).toBe(3);
  });

  it("lets Relaxed play on after a miss and ends it at the third", () => {
    let run = start("built", "relaxed", "mixed", 21);
    for (let miss = 1; miss <= 3; miss++) {
      run = answer(pools, run, pickFor(run, false));
      expect(run.hearts).toBe(3 - miss);
      if (miss < 3) { expect(endsRun(pools, run)).toBe(false); run = next(pools, run); }
    }
    expect(next(pools, run).over).toBe(true);
  });

  it("ignores a second tap and a tap on a card not shown; counts the streak back from the latest answer", () => {
    const run = answer(pools, start("died", "streak", "mixed", 3), pickFor(start("died", "streak", "mixed", 3), true));
    expect(answer(pools, run, pickFor(run, false))).toBe(run);
    const fresh = start("died", "streak", "mixed", 3);
    expect(answer(pools, fresh, "nobody")).toBe(fresh);
    expect(streakNow(pools, playRight(start("books", "streak", "mixed", 1), 4))).toBe(4);
  });
});
