// Who's older?: dealing and the run (design §6): the ramp, no repeats, "one stays", the band fallbacks, how each mode
// ends, the locked first tap, and a left card that is right only about half the time.
import data from "@/data/whos-older/whos-older.json";
import { alwaysFirst, answer, bandFor, buildPool, current, endsRun, newRun, next, pairOf, score, streakNow, whoStays, type Character, type Pool, type Run, type WhosOlderData } from "./game";
import { pairKey } from "./pairing";

const pool = buildPool(data as unknown as WhosOlderData);

const rightPick = (p: Pool, run: Run) => pairOf(p, current(run))!.first.id;
const wrongPick = (p: Pool, run: Run) => pairOf(p, current(run))!.second.id;

/** Plays `rounds` right answers and returns the run. */
function playRight(p: Pool, run: Run, rounds: number): Run {
  for (let n = 1; n < rounds; n++) run = next(p, answer(p, run, rightPick(p, run)));
  return answer(p, run, rightPick(p, run));
}

describe("the ramp (design §6.3)", () => {
  it("is Easy for rounds 1–5, Easy or Medium for 6–15, then Medium or Hard with Hard 40%", () => {
    for (const n of [1, 5]) expect(bandFor("streak", "mixed", n, 0.99)).toBe("easy");
    expect(bandFor("streak", "mixed", 6, 0.49)).toBe("easy");
    expect(bandFor("streak", "mixed", 15, 0.5)).toBe("medium");
    expect(bandFor("streak", "mixed", 16, 0.39)).toBe("hard");
    expect(bandFor("streak", "mixed", 16, 0.4)).toBe("medium");
    expect(bandFor("relaxed", "mixed", 3, 0.1)).toBe("easy");
    expect(bandFor("relaxed", "hard", 1, 0.99)).toBe("hard");
    expect(bandFor("relaxed", "easy", 40, 0.1)).toBe("easy");
  });

  it("deals Easy pairs for a Streak's first five rounds", () => {
    const run = playRight(pool, newRun(pool, "streak", "mixed", 7), 5);
    expect(run.rounds.map((r) => pairOf(pool, r)!.band)).toEqual(["easy", "easy", "easy", "easy", "easy"]);
  });
});

describe("dealing", () => {
  const long = playRight(pool, newRun(pool, "streak", "mixed", 12345), 300);

  it("deals only askable pairs and never the same pair twice", () => {
    const keys = long.rounds.map((r) => pairKey(r.left, r.right));
    for (const r of long.rounds) expect(pairOf(pool, r), `${r.left} / ${r.right}`).toBeDefined();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("moves the right-hand person to the left, or deals a fresh pair, and lets nobody stay more than two rounds", () => {
    let stayed = 0;
    for (let i = 1; i < long.rounds.length; i++) {
      const [before, now] = [long.rounds[i - 1], long.rounds[i]];
      const giveaway = alwaysFirst(pool.byId.get(before.right)!);
      if (now.left === before.right || (giveaway && now.left === before.left)) stayed++;
      else expect([now.left, now.right], `round ${i + 1} is a fresh pair`).not.toContain(before.right); // no partner left for the stayer
      if (!giveaway) expect([now.left, now.right], `round ${i + 1}`).not.toContain(before.left);
      if (i >= 2) for (const id of [now.left, now.right]) expect([before.left, before.right].includes(id) && [long.rounds[i - 2].left, long.rounds[i - 2].right].includes(id), `${id} in three rounds running at ${i + 1}`).toBe(false);
    }
    expect(stayed / (long.rounds.length - 1)).toBeGreaterThan(0.75);
  });

  it("deals the same pairs again from the same seed, so a reload cannot reshuffle", () => {
    expect(playRight(pool, newRun(pool, "relaxed", "hard", 99), 30).rounds).toEqual(playRight(pool, newRun(pool, "relaxed", "hard", 99), 30).rounds);
  });

  it("puts the answer on the left about half the time, even when a stayer came before everyone", () => {
    let left = 0;
    let total = 0;
    const abraham = "abraham-gen-11-26";
    const count = (run: Run) => { for (const r of run.rounds) { total++; if (pairOf(pool, r)!.first.id === r.left) left++; } };
    for (const seed of [1, 2, 3, 4]) count(playRight(pool, newRun(pool, "streak", "mixed", seed), 200));
    for (const seed of [5, 6, 7, 8]) count(playRight(pool, newRun(pool, "relaxed", "hard", seed), 50));
    for (const seed of [9, 10, 11, 12]) { // Abraham, who comes before nearly everyone, as the stayer of round 2
      const partner = pool.partners.get(abraham)!.medium[seed]!;
      const other = partner.first.id === abraham ? partner.second.id : partner.first.id;
      let run: Run = { stamp: pool.data.stamp, mode: "streak", difficulty: "mixed", seed, rounds: [{ left: other, right: abraham, pick: abraham }], hearts: 3, over: false };
      run = next(pool, run);
      expect(current(run).left).toBe(abraham);
      count(playRight(pool, run, 50));
    }
    expect(total).toBeGreaterThanOrEqual(1000);
    expect(left / total).toBeGreaterThan(0.4);
    expect(left / total).toBeLessThan(0.6);
  });
});

describe("the giveaways (the audit's note)", () => {
  it("never keeps Adam, Eve or Job on as the left card: the other person stays instead", () => {
    for (const id of ["adam-gen-2-19", "eve-gen-3-20", "job-job-1-1"]) {
      expect(alwaysFirst(pool.byId.get(id)!), id).toBe(true);
      const partner = pool.partners.get(id)!.easy.concat(pool.partners.get(id)!.medium, pool.partners.get(id)!.hard).find((p) => !alwaysFirst(p.first.id === id ? p.second : p.first))!;
      const other = partner.first.id === id ? partner.second.id : partner.first.id;
      const run: Run = { stamp: pool.data.stamp, mode: "relaxed", difficulty: "hard", seed: 21, rounds: [{ left: other, right: id, pick: id }], hearts: 3, over: false };
      expect(whoStays(pool, run.rounds)).toBe(other);
      const dealt = current(next(pool, run));
      expect(dealt.left, id).toBe(other);
      expect(dealt.right, id).not.toBe(id);
    }
    expect(alwaysFirst(pool.byId.get("moses-exo-2-10")!)).toBe(false);
  });

  it("deals a fresh pair when the other person had already stayed, so nobody stays three rounds", () => {
    const rounds = [{ left: "moses-exo-2-10", right: "david-rut-4-17", pick: "moses-exo-2-10" }, { left: "david-rut-4-17", right: "adam-gen-2-19", pick: "adam-gen-2-19" }];
    expect(whoStays(pool, rounds)).toBeNull();
    const dealt = current(next(pool, { stamp: pool.data.stamp, mode: "streak", difficulty: "mixed", seed: 4, rounds, hearts: 3, over: false }));
    expect([dealt.left, dealt.right]).not.toContain("david-rut-4-17");
    expect([dealt.left, dealt.right]).not.toContain("adam-gen-2-19");
  });
});

describe("the fallbacks (design §6.1)", () => {
  // s pairs only with e1 and e2 (both Easy). h1 and h2 pair only Hard. s touches h1 and h2, so is never paired with them.
  const person = (id: string, lo: number, hi: number, tier: 1 | 3 = 1): Character =>
    ({ id, label: id, tier, lo, hi, shown: true, tag: "", when: "", brief: "", href: "" });
  const small = buildPool({ stamp: "test", sources: "", books: {}, facts: [], blocked: [], characters: [
    person("s", -3060, -2940), person("e1", -2000, -1950), person("e2", -1500, -1450), person("h1", -3100, -3060, 3), person("h2", -2940, -2900, 3),
  ] });
  const run = (rounds: Run["rounds"]): Run => ({ stamp: "test", mode: "relaxed", difficulty: "hard", seed: 3, rounds, hearts: 3, over: false });

  it("finds the stayer a partner in a lower band when none is left in the current one", () => {
    expect(current(next(small, run([{ left: "e1", right: "s", pick: "s" }])))).toEqual({ left: "s", right: "e2", pick: null });
  });

  it("starts a fresh pair when the stayer has no partner left at all", () => {
    const dealt = current(next(small, run([{ left: "s", right: "e2", pick: "s" }, { left: "e1", right: "s", pick: "s" }])));
    expect(pairKey(dealt.left, dealt.right)).toBe(pairKey("h1", "h2"));
  });
});

describe("how a run ends", () => {
  it("ends a Streak at the first miss, after its reveal", () => {
    let run = playRight(pool, newRun(pool, "streak", "mixed", 21), 3);
    run = next(pool, run);
    run = answer(pool, run, wrongPick(pool, run));
    expect(endsRun(pool, run)).toBe(true);
    expect(run.over).toBe(false); // the reveal still shows
    expect(score(pool, run)).toBe(3);
    run = next(pool, run);
    expect(run.over).toBe(true);
    expect(next(pool, run)).toBe(run);
    expect(answer(pool, run, current(run).left)).toBe(run);
  });

  it("lets Relaxed play on after a miss and ends it at the third", () => {
    let run = newRun(pool, "relaxed", "easy", 33);
    for (const hearts of [2, 1]) {
      run = answer(pool, run, wrongPick(pool, run));
      expect(run.hearts).toBe(hearts);
      expect(endsRun(pool, run)).toBe(false);
      run = next(pool, run);
      run = playRight(pool, run, 1);
      run = next(pool, run);
    }
    run = answer(pool, run, wrongPick(pool, run));
    expect(run.hearts).toBe(0);
    expect(endsRun(pool, run)).toBe(true);
    expect(score(pool, run)).toBe(2);
    expect(next(pool, run).over).toBe(true);
  });

  it("ignores a second tap on an answered pair, and a tap on someone not shown", () => {
    const run = newRun(pool, "streak", "mixed", 44);
    const answered = answer(pool, run, wrongPick(pool, run));
    expect(answer(pool, answered, rightPick(pool, run))).toBe(answered);
    expect(answer(pool, run, "nobody")).toBe(run);
  });

  it("counts the streak back from the latest answer", () => {
    let run = playRight(pool, newRun(pool, "relaxed", "medium", 55), 2);
    run = next(pool, run);
    run = answer(pool, run, wrongPick(pool, run));
    expect(streakNow(pool, run)).toBe(0);
    run = playRight(pool, next(pool, run), 3);
    expect(streakNow(pool, run)).toBe(3);
    expect(score(pool, run)).toBe(5);
  });
});
