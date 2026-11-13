// What came first?: the build's shared checks (scripts/what-came-first/common.ts) each refuse the mistake they exist
// for. The build writes nothing when any of them logs an error, so a check that stays quiet would let a bad pair ship.
import { Log, checkBandMinimum, checkBlocked, checkFactAgreement, checkHandFacts, checkMatch, checkSpans, checkUniqueLabels,
  checkWindow, independentCheck, settlePool } from "../../../../scripts/what-came-first/common.ts";
import type { Fact, Item, Order, Span } from "./order";

const GEN_1_1: Span = [1_001_001, 1_001_001];
const item = (id: string, lo: number | null, hi: number | null, extra: Partial<Item> = {}): Item =>
  ({ id, label: id, tier: 1, lo, hi, shown: true, ...extra });
const fact = (first: string, second: string, refs: Span[] = [GEN_1_1]): Fact => ({ first, second, kind: "stated", refs, why: "Because." });
const errorsOf = (run: (log: Log) => unknown) => { const log = new Log("test"); run(log); return log.errors; };

describe("verse checks", () => {
  it("accepts real Berean verses and refuses missing ones, reversed spans and empty lists", () => {
    expect(errorsOf((log) => checkSpans(log, "x", [GEN_1_1, [1_004_008, 1_004_010]]))).toEqual([]);
    expect(errorsOf((log) => checkSpans(log, "x", [[1_001_099, 1_001_099]]))).toHaveLength(1);
    expect(errorsOf((log) => checkSpans(log, "x", [[1_001_005, 1_001_001]]))).toHaveLength(1);
    expect(errorsOf((log) => checkSpans(log, "x", []))).toHaveLength(1);
  });

  it("refuses an item whose verse does not name it", () => {
    expect(errorsOf((log) => checkMatch(log, "x", [GEN_1_1], "beginning"))).toEqual([]);
    expect(errorsOf((log) => checkMatch(log, "x", [GEN_1_1], "Jerusalem"))).toHaveLength(1);
    expect(errorsOf((log) => checkMatch(log, "x", [GEN_1_1], ""))).toHaveLength(1);
  });

  it("refuses a fact whose quoted span is longer than three verses", () => {
    const byId = new Map([["a", item("a", null, null)], ["b", item("b", null, null)]]);
    expect(errorsOf((log) => checkHandFacts(log, [fact("a", "b")], byId))).toEqual([]);
    expect(errorsOf((log) => checkHandFacts(log, [fact("a", "b", [[1_001_001, 1_001_005]])], byId))).toHaveLength(1);
    expect(errorsOf((log) => checkHandFacts(log, [fact("a", "missing")], byId))).toHaveLength(1);
  });
});

describe("item and fact checks", () => {
  it("refuses year 0 and a window that ends before it starts", () => {
    expect(errorsOf((log) => checkWindow(log, "x", -10, 5))).toEqual([]);
    expect(errorsOf((log) => checkWindow(log, "x", 0, 5))).toHaveLength(1);
    expect(errorsOf((log) => checkWindow(log, "x", 10, 5))).toHaveLength(1);
  });

  it("refuses two items with one label, and an empty label", () => {
    expect(errorsOf((log) => checkUniqueLabels(log, [item("a", 1, 2, { label: "Ur" }), item("b", 1, 2, { label: "ur" })]))).toHaveLength(1);
    expect(errorsOf((log) => checkUniqueLabels(log, [item("a", 1, 2, { label: " " })]))).toHaveLength(1);
    expect(errorsOf((log) => checkUniqueLabels(log, [item("a", 1, 2, { label: "Ur", group: "x" }), item("b", 1, 2, { label: "Ur", group: "y" })]))).toEqual([]);
  });

  it("refuses a fact against the windows or positions, and facts that make a loop", () => {
    const byId = new Map([["early", item("early", -1000, -900)], ["late", item("late", -500, -400)], ["mid", item("mid", -800, -700)]]);
    expect(errorsOf((log) => checkFactAgreement(log, [fact("early", "late")], byId))).toEqual([]);
    expect(errorsOf((log) => checkFactAgreement(log, [fact("late", "early")], byId)).join(" ")).toMatch(/contradicts the windows/);
    expect(errorsOf((log) => checkFactAgreement(log, [fact("early", "mid"), fact("mid", "late"), fact("late", "early")], byId)).length).toBeGreaterThan(0);
    const stops = new Map([["one", item("one", null, null, { position: 1 })], ["two", item("two", null, null, { position: 2 })]]);
    expect(errorsOf((log) => checkFactAgreement(log, [fact("two", "one")], stops))).toHaveLength(1);
  });

  it("refuses a blocked pair with no reason or an unknown item", () => {
    const known = (id: string) => id !== "ghost";
    expect(errorsOf((log) => checkBlocked(log, [{ a: "a", b: "b", reason: "Same day." }], known))).toEqual([]);
    expect(errorsOf((log) => checkBlocked(log, [{ a: "a", b: "b", reason: "" }], known))).toHaveLength(1);
    expect(errorsOf((log) => checkBlocked(log, [{ a: "a", b: "ghost", reason: "x" }], known))).toHaveLength(1);
  });
});

describe("pool checks", () => {
  it("leaves out items with too few partners, again and again until the pool is stable, and says so", () => {
    const items = [item("a", -900, -800), item("b", -700, -600), item("c", -500, -400), item("lonely", -2000, 2000)];
    const log = new Log("test");
    const pool = settlePool(log, "happened", items, [], [], 2);
    expect(pool.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(pool.dropped).toEqual(["lonely"]);
    expect(log.notices).toHaveLength(1);
    expect(pool.orders).toHaveLength(3);
  });

  it("refuses a band below its minimum", () => {
    expect(errorsOf((log) => checkBandMinimum(log, { easy: 300, medium: 300, hard: 300 }, 300))).toEqual([]);
    expect(errorsOf((log) => checkBandMinimum(log, { easy: 299, medium: 300, hard: 0 }, 300))).toHaveLength(2);
  });

  it("catches an asked pair that rests on nothing, or is blocked, whatever orderOf said", () => {
    const [a, b] = [item("a", -900, -800), item("b", -850, -700)];
    const forged: Order = { first: a, second: b, reason: { kind: "windows", gap: 1 } };
    expect(errorsOf((log) => independentCheck(log, [forged], [], []))).toHaveLength(1);
    expect(errorsOf((log) => independentCheck(log, [forged], [fact("a", "b")], []))).toEqual([]);
    expect(errorsOf((log) => independentCheck(log, [forged], [fact("b", "a")], []))).toHaveLength(1);
    expect(errorsOf((log) => independentCheck(log, [forged], [fact("a", "b")], [["b", "a"]]))).toHaveLength(1);
  });
});
