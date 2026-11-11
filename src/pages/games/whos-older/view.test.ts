// Who's older?: the redesigned view's pure rules (view.ts): the strip's bars, years and bracket; who stayed; the
// result's title; the sample pair; the qualifier line; and the gap label's words.
import data from "@/data/whos-older/whos-older.json";
import { gapLabel, yearSpan } from "./explain";
import { buildPool, pairOf, type WhosOlderData } from "./game";
import { qualifier, reachedTitle, samplePair, stayedFrom, strip } from "./view";

const pool = buildPool(data as unknown as WhosOlderData);
const pair = (a: string, b: string) => pairOf(pool, { left: a, right: b })!;

describe("the timeline strip", () => {
  it("draws two bars with years at their ends and a bracket for the least gap between them", () => {
    const s = strip(pair("moses-exo-2-10", "david-rut-4-17"));
    expect(s.years).toBe(true);
    expect(s.bars[0].left).toBe(0);
    expect(s.bars[0].start).toMatch(/BC$/);
    expect(s.bars[0].end).toMatch(/BC$/);
    expect(s.bars[1].left + s.bars[1].width).toBeCloseTo(100, 5);
    expect(s.gap).toBeDefined();
    expect(s.gap!.label).toMatch(/^at least [\d,]+ years$/);
    expect(s.gap!.left).toBeCloseTo(s.bars[0].left + s.bars[0].width, 5);
  });

  it("gives a narrow window one label instead of one at each end, and never a bar thinner than it can be seen", () => {
    const s = strip(pair("samson-jdg-13-24", "herod-mat-2-1"));
    const herod = s.bars[1];
    expect(herod.width).toBeGreaterThanOrEqual(1.5);
    expect(herod.end).toBeUndefined();
    expect(herod.start).toBe("76–70 BC");
  });

  it("prints no years and no bracket for an early-Genesis pair, only earlier and later", () => {
    const s = strip(pair("eve-gen-3-20", "adam-gen-2-19"));
    expect(s.years).toBe(false);
    expect(s.gap).toBeUndefined();
    expect(s.bars.map((b) => b.start)).toEqual(["earlier", "later"]);
  });

  it("keeps an open edge open, with the word earlier at its start", () => {
    const s = strip(pair("job-job-1-1", "esther-est-2-7"));
    expect(s.bars[0].open).toBe(true);
    expect(s.bars[0].start).toMatch(/^earlier/);
  });

  it("brackets no fact pair, whose windows may overlap", () => {
    expect(strip(pair("aaron-exo-4-14", "moses-exo-2-10")).gap).toBeUndefined();
  });
});

describe("the words", () => {
  it("rounds a gap over a thousand down to the hundred, like the sentence", () => {
    expect(gapLabel(558)).toBe("at least 558 years");
    expect(gapLabel(1)).toBe("at least 1 year");
    expect(gapLabel(1234)).toBe("at least 1,200 years");
  });
  it("writes a year span the way the window text does", () => {
    expect(yearSpan(-1090, -1030)).toBe("1090–1030 BC");
    expect(yearSpan(55, 60)).toBe("AD 55–60");
    expect(yearSpan(-55, 20)).toBe("55 BC – AD 20");
  });
  it("splits a qualified label into its name and its qualifier", () => {
    expect(qualifier("Mary (mother of Jesus)")).toBe("mother of Jesus");
    expect(qualifier("Moses")).toBe("");
  });
});

describe("the round's motion and the ending", () => {
  it("knows whether the left card slid over from the right, held on, or is fresh", () => {
    const a = { left: "x", right: "y", pick: "y" };
    expect(stayedFrom([a])).toBeNull();
    expect(stayedFrom([a, { left: "y", right: "z", pick: null }])).toBe("right");
    expect(stayedFrom([a, { left: "x", right: "z", pick: null }])).toBe("left");
    expect(stayedFrom([a, { left: "p", right: "q", pick: null }])).toBeNull();
  });
  it("titles the result with the highest milestone reached", () => {
    expect(reachedTitle(4)).toBeUndefined();
    expect(reachedTitle(5)).toMatch(/^5 in a row/);
    expect(reachedTitle(14)).toMatch(/^10 in a row/);
    expect(reachedTitle(60)).toMatch(/^50 in a row/);
  });
  it("shows Moses and Paul on the start screen", () => {
    expect(samplePair(pool).map((p) => p.label)).toEqual(["Moses", "Paul"]);
  });
});
