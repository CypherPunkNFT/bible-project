// What came first?: the view's pure rules (view.ts, Who's older?'s redesign): the strip's bars, years and bracket; who
// stayed; the result's title; the qualifier line; the gap label's words; each category's window words.
import { gapLabel, yearSpan } from "../whos-older/explain";
import { pairOf } from "./game";
import { englishPools } from "./test-pools";
import { hasStrip, qualifier, reachedTitle, stayedFrom, strip, windowNote } from "./view";

const pools = englishPools();
const pair = (a: string, b: string) => pairOf(pools, { category: "lived", left: a, right: b, pick: null })!;

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
    const a = { category: "lived" as const, left: "x", right: "y", pick: "y" };
    expect(stayedFrom([a])).toBeNull();
    expect(stayedFrom([a, { category: "lived" as const, left: "y", right: "z", pick: null }])).toBe("right");
    expect(stayedFrom([a, { category: "lived" as const, left: "x", right: "z", pick: null }])).toBe("left");
    expect(stayedFrom([a, { category: "lived" as const, left: "p", right: "q", pick: null }])).toBeNull();
  });
  it("titles the result with the highest milestone reached", () => {
    expect(reachedTitle(4)).toBeUndefined();
    expect(reachedTitle(5)).toMatch(/^5 in a row/);
    expect(reachedTitle(14)).toMatch(/^10 in a row/);
    expect(reachedTitle(60)).toMatch(/^50 in a row/);
  });
});

describe("each category's strip", () => {
  it("draws a strip only where the items have years, with each category's own words", () => {
    expect(["lived", "happened", "ruled", "built", "died"].every((k) => hasStrip(k as never))).toBe(true);
    expect(hasStrip("went") || hasStrip("books")).toBe(false);
    expect(windowNote("ruled", { lo: -971, hi: -930 })).toBe("began to reign about 971–930 BC");
    expect(windowNote("died", { lo: null, hi: -1000 })).toBe("died before about 1000 BC");
    expect(windowNote("built", { lo: 20, hi: 30 })).toBe("built about AD 20–30");
  });

});
