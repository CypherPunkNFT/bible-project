// Bible twenty questions: the engine on small hand-made files (design §7, §9.2, §15 "Engine" and "Reverse mode").
import { EXTRA_TURNS, TURNS, chooseTag, closedTags, field, missCounts, nextStep, pickSecret, prepare, reverseAnswer, seeded, simulate,
  softKey, stillPossible, type TqData, type TqTag, type Turn } from "./engine";
import { playEveryone, separations } from "./simulation";

const tag = (id: string, l = 0, more: Partial<TqTag> = {}): TqTag => ({ id, q: `Is your person ${id}?`, g: "who", l, ...more });
const person = (id: string, v: string, t = 1, f = 0) => ({ id, label: id, also: [], t, f, slug: "", b: "", s: "", v });
const q = (tagIndex: number, answer: "y" | "n" | "d"): Turn => ({ kind: "q", tag: tagIndex, answer });

// Four tags: a (everyday), b (everyday), c (detail), d (everyday, implies a).
const small: TqData = {
  version: "tq-test", tags: [tag("a"), tag("b"), tag("c", 1), tag("d", 0, { implies: ["a"] })],
  people: [person("p0", "yyyy", 1, 0), person("p1", "yn?n", 1, 1), person("p2", "nyNn", 1, 2), person("p3", "n-yn", 2, 3)],
};
const engine = prepare(small);

/** A fixture with 32 people, each a distinct 5-bit code, plus a 6th tag nobody splits on usefully. */
function binary(): TqData {
  const tags = [0, 1, 2, 3, 4].map((i) => tag(`bit${i}`)).concat(tag("detail", 1));
  const people = Array.from({ length: 32 }, (_, n) => person(`n${n}`, [0, 1, 2, 3, 4].map((i) => ((n >> i) & 1 ? "y" : "n")).join("") + (n % 2 ? "y" : "n"), n < 24 ? 1 : 2, n));
  return { version: "tq-binary", tags, people };
}

describe("misses and who is remaining (design §7.1–7.2)", () => {
  it("counts only real contradictions: Don't know, unsure, n/a and slip-marked values never count", () => {
    const misses = missCounts(engine, [q(0, "n"), q(1, "y"), q(2, "y"), q(3, "d")]);
    // p0 yyyy: a=n misses. p1 yn?n: a=n misses, b=y misses. p2 nyNn: c is slip-marked (N), so c=y does not count.
    // p3 n-yn: b is n/a, so b=y does not count.
    expect([...misses]).toEqual([1, 2, 0, 0]);
  });

  it("keeps everyone within one miss of the best, and leads with those at the best", () => {
    const f = field(engine, [q(0, "n"), q(1, "y")]);
    expect(f.best).toBe(0);
    expect(f.leading).toEqual([2, 3]);
    expect(f.remaining).toEqual([0, 2, 3]); // p0 has one miss: forgiven; p1 has two
  });

  it("rejects a wrongly guessed person and brings them back when the guess is undone", () => {
    const turns: Turn[] = [q(0, "n"), { kind: "g", person: 2, right: false }];
    expect(field(engine, turns).remaining).not.toContain(2);
    expect(field(engine, turns.slice(0, -1)).remaining).toContain(2);
  });

  it("does not count a value this device has softened, and only that person's", () => {
    const softened = new Set([softKey("p0", "a")]);
    expect([...missCounts(engine, [q(0, "n")], softened)]).toEqual([0, 1, 0, 0]);
  });
});

describe("choosing the next question (design §7.3)", () => {
  it("skips asked questions and those an answer already settled", () => {
    expect([...closedTags(engine, [q(3, "y")])].sort()).toEqual([0, 3]); // d implies a: a Yes to d settles a
    expect([...closedTags(engine, [q(0, "n")])].sort()).toEqual([0, 3]); // a No to a settles d
    expect([...closedTags(engine, [q(0, "d")])]).toEqual([0]);
  });

  it("picks the closest to half and half, and an everyday question before a detail one", () => {
    const data = binary(), e = prepare(data), everyone = data.people.map((_, i) => i);
    for (let seed = 0; seed < 20; seed++) expect(data.tags[chooseTag(e, [], everyone, seed)!].l).toBe(0);
  });

  it("never asks a question whose answer could change nothing", () => {
    const e = prepare(binary());
    expect(chooseTag(e, [], [0, 2], 1)).toBe(1); // n0 and n2 differ only on bit1 (and agree on the detail tag)
  });

  it("varies with the seed but gives the same question for the same seed and turn", () => {
    const e = prepare(binary()), everyone = e.data.people.map((_, i) => i);
    const picks = new Set(Array.from({ length: 30 }, (_, seed) => chooseTag(e, [], everyone, seed)));
    expect(picks.size).toBeGreaterThan(1);
    expect(chooseTag(e, [], everyone, 7)).toBe(chooseTag(e, [], everyone, 7));
    expect(seeded(5, 3)).toBe(seeded(5, 3));
  });
});

describe("when to guess and running out (design §7.4–7.5)", () => {
  it("guesses when one person leads after at least three answers, choosing the most famous leader", () => {
    const e = prepare(binary());
    const turns = [q(0, "y"), q(1, "n"), q(2, "y")];
    expect(nextStep(e, turns, 1).kind).toBe("ask"); // four people still lead
    const all = [...turns, q(3, "n"), q(4, "y")]; // n21 = 10101
    expect(nextStep(e, all, 1)).toEqual({ kind: "guess", person: 21 });
  });

  it("guesses on the last turn and is out after it", () => {
    const e = prepare(binary());
    const filler = Array.from({ length: TURNS - 1 }, () => q(5, "d"));
    expect(nextStep(e, filler, 1).kind).toBe("guess");
    const spent: Turn[] = [...filler, { kind: "g", person: 0, right: false }];
    expect(nextStep(e, spent, 1)).toEqual({ kind: "out" });
    expect(nextStep(e, spent, 1, TURNS + EXTRA_TURNS).kind).not.toBe("out");
    expect(nextStep(e, [...spent, ...Array.from({ length: EXTRA_TURNS }, () => q(5, "d"))], 1, TURNS + EXTRA_TURNS)).toEqual({ kind: "out" });
  });

  it("finds every person of a cleanly coded file with truthful answers, with Don't know on details, and after one slip", () => {
    const data = binary(), report = playEveryone(data);
    expect(report.rates.truthfulPool).toBe(1);
    expect(report.rates.dontKnowTier1).toBe(1);
    expect(report.rates.oneSlipTier1).toBeGreaterThan(0.5);
    expect(simulate(prepare(data), 21, 3)).toBeLessThanOrEqual(TURNS);
  });

  it("counts the tags that separate two people, ignoring unsure values", () => {
    expect(separations(engine, 0, 1)).toBe(2); // b and d
    expect(separations(engine, 2, 3)).toBe(0); // b is n/a for p3, c is slip-marked for p2
  });
});

describe("reverse mode (design §9)", () => {
  it("answers yes, no, unknown and n/a, reading slip marks as their true value", () => {
    expect(reverseAnswer(engine, 0, 0)).toBe("yes");
    expect(reverseAnswer(engine, 1, 1)).toBe("no");
    expect(reverseAnswer(engine, 1, 2)).toBe("unknown");
    expect(reverseAnswer(engine, 3, 1)).toBe("na");
    expect(reverseAnswer(engine, 2, 2)).toBe("no"); // N: slip-marked no
  });

  it("treats n/a exactly like unsure in guess mode", () => {
    const withNa = prepare({ ...small, people: [person("x", "n-yn")] }), withUnsure = prepare({ ...small, people: [person("x", "n?yn")] });
    expect([...withNa.guess]).toEqual([...withUnsure.guess]);
  });

  it("keeps as possible only people the site's answers allow, slip marks read as true, wrong guesses removed", () => {
    // Secret p2 (nyNn). Asking c: p2's true value is no, so p3 (c yes) is ruled out even though guess mode reads N as unsure.
    expect(stillPossible(engine, [2], 2)).toEqual([1, 2]); // p0 has c yes; p1 is unsure on c
    expect(stillPossible(engine, [2], 2, [1])).toEqual([2]);
  });

  it("picks secrets from tier 1 on easy, from everyone on hard, avoiding the recent ones", () => {
    const e = prepare(binary());
    for (let r = 0; r < 1; r += 0.05) {
      expect(e.data.people[pickSecret(e, "easy", [], r)].t).toBe(1);
      expect(pickSecret(e, "hard", [], r)).toBeLessThan(32);
    }
    const recent = e.data.people.slice(0, 30).map((p) => p.id);
    for (let r = 0; r < 1; r += 0.1) expect(pickSecret(e, "hard", recent, r)).toBeGreaterThanOrEqual(30);
  });
});
