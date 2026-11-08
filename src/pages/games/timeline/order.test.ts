import { buildOrderIndex, explain, joinIsClose, link, trueOrder, validRound, windowGap, type TimelineEvent } from "./order";
import { CONTESTED, EVENTS, FACTS, fixtureIndex } from "./fixture";

const index = fixtureIndex();
const ev = (id: string) => index.byId.get(id)!;
const why = (a: string, b: string) => explain(index, ev(a), ev(b));
const synthetic = (id: string, lo: number | null, hi: number | null, shown = true, rank = 0): TimelineEvent => ({ id, label: id, era: "kingdom", tier: 1, lo, hi, shown, rank });

describe("the design's worked examples (§5.3)", () => {
  it("proves far-apart events by their windows, with the smallest gap any system allows", () => {
    expect(why("jericho-falls", "david-king-hebron")).toEqual([{ from: "jericho-falls", to: "david-king-hebron", link: { kind: "windows", gap: 113 } }]);
    expect(why("exodus", "solomon-temple")?.[0].link).toEqual({ kind: "windows", gap: 196 });
    expect(why("esther-queen", "ezra-arrives")?.[0].link).toEqual({ kind: "windows", gap: 20 });
    expect(why("crucifixion", "patmos-vision")?.[0].link).toEqual({ kind: "windows", gap: 31 });
  });

  it("proves close events by a verse", () => {
    const steps = why("exodus", "sinai-commandments")!;
    expect(steps).toHaveLength(1);
    expect(steps[0].link.kind).toBe("fact");
  });

  it("explains Jericho to Gideon in two steps through Joshua's death", () => {
    const steps = why("jericho-falls", "gideon-midian")!;
    expect(steps.map((step) => step.to)).toEqual(["joshua-dies", "gideon-midian"]);
    expect(steps.every((step) => step.link.kind === "fact")).toBe(true);
  });

  it("chains Holy Week by its facts", () => {
    expect(why("entry-jerusalem", "last-supper")?.[0].link.kind).toBe("fact");
    expect(why("entry-jerusalem", "crucifixion")?.map((step) => step.to)).toEqual(["last-supper", "crucifixion"]);
  });

  it("never orders the pairs the design rules out", () => {
    for (const [a, b] of [["ezra-arrives", "nehemiah-walls"], ["daniel-lions", "cyrus-decree"], ["job-trials", "exodus"], ["feeding-5000", "sermon-mount"]]) {
      expect(why(a, b)).toBeNull();
      expect(why(b, a)).toBeNull();
    }
  });

  it("never claims the reverse of a certain order", () => {
    expect(why("david-king-hebron", "jericho-falls")).toBeNull();
    expect(why("sinai-commandments", "exodus")).toBeNull();
  });
});

describe("the ordering rule (§5.1)", () => {
  it("does not count windows that touch", () => {
    expect(windowGap(synthetic("a", -1000, -900), synthetic("b", -900, -800))).toBeNull();
    expect(windowGap(synthetic("a", -1000, -901), synthetic("b", -900, -800))).toBe(1);
  });

  it("never proves anything from an open edge", () => {
    expect(windowGap(synthetic("a", -1000, null), synthetic("b", 30, 33))).toBeNull();
    expect(windowGap(synthetic("a", -1000, -900), synthetic("b", null, 33))).toBeNull();
  });

  it("counts across the BC/AD line without a year 0", () => {
    expect(windowGap(synthetic("a", -20, -10), synthetic("b", 15, 20))).toBe(24);
  });

  it("never orders two early-Genesis events by their invented windows, only by a fact", () => {
    expect(windowGap(ev("flood"), ev("babel"))).toBeNull();
    expect(why("flood", "babel")).toBeNull();
    expect(why("creation", "flood")?.[0].link.kind).toBe("fact");
    expect(why("babel", "abram-called")?.[0].link.kind).toBe("windows");
  });

  it("lets a contested pair beat a fact", () => {
    const withFact = buildOrderIndex(EVENTS, [...FACTS, { first: "ezra-arrives", second: "nehemiah-walls", refs: [[16002001, 16002001]], why: "x", close: false }], CONTESTED);
    expect(link(withFact, withFact.byId.get("ezra-arrives")!, withFact.byId.get("nehemiah-walls")!)).toBeNull();
    expect(explain(withFact, withFact.byId.get("ezra-arrives")!, withFact.byId.get("nehemiah-walls")!)).toBeNull();
  });

  it("prefers facts in a two-step reason", () => {
    // Two routes from a to b: windows then a fact through m3, or two facts through m1. The facts win.
    const events = [synthetic("a", -1000, -900, true, 0), synthetic("m1", -980, -700, true, 1), synthetic("m3", -800, -700, true, 2), synthetic("b", -950, -600, true, 3)];
    const fact = (first: string, second: string) => ({ first, second, refs: [[1001001, 1001001]] as [number, number][], why: `${first} then ${second}`, close: false });
    const small = buildOrderIndex(events, [fact("a", "m1"), fact("m1", "b"), fact("m3", "b")], []);
    expect(link(small, events[0], events[3])).toBeNull();
    expect(link(small, events[0], events[2])?.kind).toBe("windows");
    expect(explain(small, events[0], events[3])?.map((step) => step.to)).toEqual(["m1", "b"]);
  });

  it("accepts a certain chain and rejects a set with one uncertain join", () => {
    expect(validRound(index, ["crucifixion", "abram-called", "david-king-hebron", "exodus"])).toBe(true);
    expect(trueOrder(index, ["crucifixion", "abram-called", "david-king-hebron", "exodus"])).toEqual(["abram-called", "exodus", "david-king-hebron", "crucifixion"]);
    expect(validRound(index, ["feeding-5000", "sermon-mount", "patmos-vision"])).toBe(false);
    expect(validRound(index, ["ezra-arrives", "jesus-born", "nehemiah-walls"])).toBe(false); // contested even when not neighbours
    expect(validRound(index, ["exodus", "exodus"])).toBe(false);
  });

  it("marks close joins: a close fact, or dated windows under 40 years", () => {
    expect(joinIsClose(index, why("exodus", "sinai-commandments")!)).toBe(true);
    expect(joinIsClose(index, why("esther-queen", "ezra-arrives")!)).toBe(true);
    expect(joinIsClose(index, why("jericho-falls", "david-king-hebron")!)).toBe(false);
    expect(joinIsClose(index, why("joshua-dies", "gideon-midian")!)).toBe(false);
  });
});
