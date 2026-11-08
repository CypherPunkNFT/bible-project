// Who's older?: the pairing rule (design §5) and the bands (§6.3), on the worked examples of §5.2.
import { bandOf, buildIndex, checkYear, labelsClash, orderOf, yearsBetween, type Fact, type Person, type Tier } from "./pairing";

const person = (id: string, lo: number | null, hi: number | null, tier: Tier = 1, shown = true, label = id): Person => ({ id, label, tier, lo, hi, shown });

// The worked-example windows of §5.2.
const abraham = person("abraham", -2215, -1750);
const moses = person("moses", -1575, -1330);
const joshua = person("joshua", -1535, -1260);
const aaron = person("aaron", -1578, -1291);
const david = person("david", -1090, -1030);
const elijah = person("elijah", -1000, -865);
const elisha = person("elisha", -900, -830);
const isaiah = person("isaiah", -840, -755);
const daniel = person("daniel", -640, -615);
const ezekiel = person("ezekiel", -630, -600);
const esther = person("esther", -510, -490);
const job = person("job", null, -650, 2);
const joel = person("joel", -900, -400, 2, true, "Joel (prophet)");
const peter = person("peter", -55, 20);
const paul = person("paul", -10, 15);
const adam = person("adam", -10000, -9990, 1, false);
const eve = person("eve", -9989, -9980, 1, false);
const noah = person("noah", -8000, -7990, 1, false);
const perez = person("perez", -1900, -1850, 3);
const zerah = person("zerah", -1900, -1850, 3);

const fact = (first: string, second: string, kind: Fact["kind"], extra: Partial<Fact> = {}): Fact =>
  ({ first, second, kind, refs: [[2_007_007, 2_007_007]], why: `${first} before ${second}`, ...extra });
const facts = [fact("moses", "joshua", "generation-gap"), fact("aaron", "moses", "stated-age"), fact("adam", "eve", "created-first")];
const index = buildIndex(facts, [["perez", "zerah"]]);

const verdict = (a: Person, b: Person) => {
  const order = orderOf(a, b, index);
  return order && { first: order.first.id, band: bandOf(order), reason: order.reason.kind, gap: order.reason.kind === "windows" ? order.reason.gap : undefined };
};

describe("the verdict table (design §5.2)", () => {
  it.each([
    [abraham, david, "abraham", "easy", 660],
    [elijah, isaiah, "elijah", "hard", 25],
    [daniel, esther, "daniel", "medium", 105],
    [job, esther, "job", "medium", 140],
    [joel, david, "david", "medium", 130],
  ])("%s / %s is decided by the windows", (a, b, first, band, gap) => {
    expect(verdict(a, b)).toEqual({ first, band, reason: "windows", gap });
    expect(verdict(b, a)).toEqual({ first, band, reason: "windows", gap }); // the side it is asked from changes nothing
  });

  it.each([
    [moses, joshua, "moses", "hard"],
    [aaron, moses, "aaron", "hard"],
    [adam, eve, "adam", "medium"],
  ])("%s / %s is decided by its fact", (a, b, first, band) => {
    expect(verdict(b, a)).toEqual({ first, band, reason: "fact", gap: undefined });
  });

  it.each([
    ["Peter / Paul: windows overlap", peter, paul],
    ["Job / Moses: Job's window is open at the early end", job, moses],
    ["Joel / Isaiah: windows overlap", joel, isaiah],
    ["Elijah / Elisha: overlap, and no verse says", elijah, elisha],
    ["Daniel / Ezekiel: taken young within a few years", daniel, ezekiel],
    ["Perez / Zerah: blocked", perez, zerah],
  ])("%s is never asked", (_, a, b) => {
    expect(orderOf(a, b, index)).toBeNull();
    expect(orderOf(b, a, index)).toBeNull();
  });
});

describe("the rule's edges (design §5.1)", () => {
  it("does not treat touching windows as certain", () => {
    expect(orderOf(person("a", -100, -50), person("b", -50, -10), index)).toBeNull();
    expect(orderOf(person("a", -100, -51), person("b", -50, -10), index)?.first.id).toBe("a");
  });

  it("never proves an order with an open edge", () => {
    expect(orderOf(person("a", -100, null), person("b", -50, -10), index)).toBeNull();
    expect(orderOf(person("a", -100, -60), person("b", null, -10), index)).toBeNull();
    expect(orderOf(person("a", null, -60), person("b", -50, null), index)?.first.id).toBe("a");
  });

  it("lets a blocked pair beat a fact", () => {
    const blockedIndex = buildIndex([fact("perez", "zerah", "birth-order")], [["zerah", "perez"]]);
    expect(orderOf(perez, zerah, blockedIndex)).toBeNull();
  });

  it("lets a fact beat the windows, and a hand fact beat a derived one", () => {
    const backwards = buildIndex([fact("david", "abraham", "parent", { derived: true }), fact("abraham", "david", "generation-gap")], []);
    expect(orderOf(david, abraham, backwards)?.reason.kind).toBe("fact");
    expect(orderOf(david, abraham, backwards)?.first.id).toBe("abraham");
    expect(bandOf(orderOf(david, abraham, backwards)!)).toBe("hard"); // banded by the fact, not by the 660-year gap
  });

  it("never asks Jesus or Melchizedek, or a person against themselves", () => {
    expect(orderOf(person("jesus-isa-7-14", -6, -4), abraham, index)).toBeNull();
    expect(orderOf(abraham, person("melchizedek-gen-14-18", -2500, -2400), index)).toBeNull();
    expect(orderOf(abraham, abraham, index)).toBeNull();
  });

  it("never pairs two labels that could be misread as one person (§5.3)", () => {
    expect(labelsClash("James", "James (son of Alphaeus)")).toBe(true);
    expect(labelsClash("Herod the Great", "Herod Antipas")).toBe(false);
    expect(labelsClash("Joseph of Egypt", "Joseph of Nazareth")).toBe(false);
    expect(labelsClash("Joel (prophet)", "John the Baptist")).toBe(false);
    expect(orderOf(person("j1", -100, -90, 1, true, "James"), person("j2", -10, 5, 1, true, "James (brother of Jesus)"), index)).toBeNull();
  });
});

describe("years (design §4.2.2)", () => {
  it("counts across the BC/AD line with no year 0", () => {
    expect(yearsBetween(-10, 15)).toBe(24);
    expect(yearsBetween(-1, 1)).toBe(1);
    expect(yearsBetween(-1090, -1030)).toBe(60);
    expect(yearsBetween(20, 30)).toBe(10);
  });

  it("rejects a year 0", () => {
    expect(() => checkYear(0)).toThrow(/other than 0/);
    expect(() => yearsBetween(0, 10)).toThrow(/got 0/);
  });
});

describe("bands (design §6.3)", () => {
  it("makes two tier-1 people at least 400 years apart Easy", () => {
    expect(bandOf(orderOf(abraham, peter, index)!)).toBe("easy");
  });

  it("makes a tier-2 pair 1,000 years apart Medium, not Hard", () => {
    expect(bandOf(orderOf(person("a", -1500, -1400, 2), person("b", -300, -200, 2), index)!)).toBe("medium");
  });

  it("makes a tier-3 person or a gap under 100 years Hard", () => {
    expect(bandOf(orderOf(person("a", -1500, -1400, 3), person("b", -300, -200, 1), index)!)).toBe("hard");
    expect(bandOf(orderOf(person("a", -300, -250), person("b", -200, -150), index)!)).toBe("hard");
  });

  it("bands a pair of two early-Genesis people by tier, not by their internal gap", () => {
    expect(bandOf(orderOf(adam, noah, index)!)).toBe("medium");
    expect(bandOf(orderOf(person("seth", -9900, -9890, 2, false), noah, index)!)).toBe("hard");
    expect(bandOf(orderOf(noah, peter, index)!)).toBe("easy"); // the other has a real window, so the gap is a true minimum
  });

  it("makes a family fact between two tier-1 people Medium, and a stated-age fact Hard", () => {
    expect(bandOf(orderOf(adam, eve, index)!)).toBe("medium");
    expect(bandOf(orderOf(aaron, moses, index)!)).toBe("hard");
    const tier2 = buildIndex([fact("a", "b", "parent")], []);
    expect(bandOf(orderOf(person("a", -500, -400, 2), person("b", -480, -380, 1), tier2)!)).toBe("hard");
  });
});
