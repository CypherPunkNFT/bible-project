// What came first?: the one rule that decides whether a pair may be asked (design §5), the bands (§4) and the judges'
// "before Saul" expansion (§4.3), on small made-up items so each case shows exactly one thing.
import { bandOf } from "./bands";
import { expandBeforeSaul } from "./categories/ruled";
import { RULES, allOrders, buildIndex, orderOf, type Fact, type Item, type Order } from "./order";

const item = (id: string, lo: number | null, hi: number | null, extra: Partial<Item> = {}): Item =>
  ({ id, label: id, tier: 1, lo, hi, shown: true, ...extra });
const fact = (first: string, second: string, extra: Partial<Fact> = {}): Fact =>
  ({ first, second, kind: "stated", refs: [[1_001_001, 1_001_001]], why: `${first} came before ${second}.`, ...extra });
const none = buildIndex([], []);

describe("orderOf", () => {
  it("orders two windows only when they share no year, and gives the smallest gap", () => {
    const early = item("early", -1000, -900);
    const late = item("late", -850, -800);
    const order = orderOf(late, early, none, RULES.happened)!;
    expect(order.first.id).toBe("early");
    expect(order.reason).toEqual({ kind: "windows", gap: 50 });
    expect(orderOf(early, item("touching", -900, -800), none, RULES.happened)).toBeNull();
  });

  it("counts across 1 BC to AD 1 with no year 0", () => {
    const order = orderOf(item("bc", -10, -1), item("ad", 1, 5), none, RULES.happened)!;
    expect(order.reason).toEqual({ kind: "windows", gap: 1 });
  });

  it("treats an open edge as proving nothing", () => {
    expect(orderOf(item("open", -1000, null), item("late", 500, 600), none, RULES.happened)).toBeNull();
    expect(orderOf(item("early", -1000, -900), item("open", null, 600), none, RULES.happened)).toBeNull();
  });

  it("lets a fact decide even when the windows overlap, and a hand fact beat a derived one", () => {
    const a = item("a", -1000, -900);
    const b = item("b", -950, -850);
    expect(orderOf(a, b, buildIndex([fact("b", "a")], []), RULES.happened)!.first.id).toBe("b");
    const index = buildIndex([fact("a", "b", { derived: true }), fact("b", "a")], []);
    expect(orderOf(a, b, index, RULES.happened)!.first.id).toBe("b");
  });

  it("never asks a blocked pair, even with a fact or disjoint windows", () => {
    const a = item("a", -1000, -900);
    const b = item("b", -500, -400);
    expect(orderOf(a, b, buildIndex([fact("a", "b")], [["b", "a"]]), RULES.happened)).toBeNull();
  });

  it("orders hidden early-Genesis windows only in Who lived first", () => {
    const adam = item("adam", -10000, -9990, { shown: false });
    const noah = item("noah", -8000, -7990, { shown: false });
    expect(orderOf(adam, noah, none, RULES.lived)).not.toBeNull();
    for (const category of ["happened", "ruled", "built", "died"] as const) expect(orderOf(adam, noah, none, RULES[category]), category).toBeNull();
    expect(orderOf(adam, noah, buildIndex([fact("adam", "noah")], []), RULES.died)!.first.id).toBe("adam");
  });

  it("pairs positions only inside one group, and refuses equal positions", () => {
    const a = item("a", null, null, { position: 1, group: "trip" });
    const b = item("b", null, null, { position: 4, group: "trip" });
    expect(orderOf(b, a, none, RULES.went)).toMatchObject({ first: { id: "a" }, reason: { kind: "position", apart: 3 } });
    expect(orderOf(a, item("c", null, null, { position: 4, group: "other" }), none, RULES.went)).toBeNull();
    expect(orderOf(a, item("d", null, null, { position: 1, group: "trip" }), none, RULES.went)).toBeNull();
  });

  it("refuses labels that could be misread as one person where the category asks it to", () => {
    const one = item("herod-1", -40, -37, { label: "Herod" });
    const two = item("herod-2", 41, 42, { label: "Herod Agrippa I" });
    expect(orderOf(one, two, none, RULES.ruled)).toBeNull();
    expect(orderOf(one, two, none, RULES.built)).not.toBeNull();
  });

  it("allOrders asks each pair once", () => {
    const items = [item("a", -300, -250), item("b", -200, -150), item("c", -100, -50)];
    expect(allOrders(items, none, RULES.happened).map((o) => `${o.first.id}<${o.second.id}`)).toEqual(["a<b", "a<c", "b<c"]);
  });
});

describe("bandOf", () => {
  const windows = (first: Item, second: Item, gap: number): Order => ({ first, second, reason: { kind: "windows", gap } });
  const famous = (id: string) => item(id, null, null);
  const obscure = (id: string) => item(id, null, null, { tier: 3 });

  it("bands events by fame and gap, and a close fact Hard", () => {
    expect(bandOf("happened", windows(famous("a"), famous("b"), 400))).toBe("easy");
    expect(bandOf("happened", windows(famous("a"), item("b", null, null, { tier: 2 }), 400))).toBe("medium");
    expect(bandOf("happened", windows(famous("a"), obscure("b"), 900))).toBe("hard");
    const close: Order = { first: famous("a"), second: famous("b"), reason: { kind: "fact", fact: fact("a", "b", { close: true }) } };
    expect(bandOf("happened", close)).toBe("hard");
  });

  it("bands a before-Saul fact by fame alone", () => {
    const expanded = (first: Item, second: Item): Order => ({ first, second, reason: { kind: "fact", fact: fact(first.id, second.id, { kind: "expanded" }) } });
    expect(bandOf("ruled", expanded(famous("gideon"), famous("pilate")))).toBe("easy");
    expect(bandOf("ruled", expanded(famous("gideon"), item("felix", null, null, { tier: 2 })))).toBe("medium");
    expect(bandOf("ruled", expanded(obscure("ibzan"), famous("pilate")))).toBe("hard");
  });

  it("bands journey stops and books by how far apart they are", () => {
    const stop = (id: string, position: number) => item(id, null, null, { position, group: "trip" });
    expect(bandOf("went", { first: stop("a", 1), second: stop("b", 7), reason: { kind: "position", apart: 6 } })).toBe("easy");
    expect(bandOf("went", { first: stop("a", 1), second: stop("b", 3), reason: { kind: "position", apart: 2 } })).toBe("hard");
    const book = (id: string, position: number, testament: "old" | "new") => item(id, null, null, { position, testament });
    expect(bandOf("books", { first: book("MAL", 39, "old"), second: book("MAT", 40, "new"), reason: { kind: "position", apart: 1 } })).toBe("easy");
    expect(bandOf("books", { first: book("GEN", 1, "old"), second: book("LEV", 3, "old"), reason: { kind: "position", apart: 2 } })).toBe("hard");
  });
});

describe("expandBeforeSaul", () => {
  const rule = { ids: ["gideon", "eli"], saul: "saul", refs: [[44_013_019, 44_013_021]] as [number, number][], why: "Judges, then a king." };
  const items = [item("gideon", null, null), item("eli", null, null), item("saul", -1050, -1010), item("david", -1010, -970),
    item("ish-bosheth", -1012, -1005), item("pilate", 26, 26), item("moses", -1450, -1230)];

  it("puts each judge before Saul and every ruler who certainly began after him, and no one else", () => {
    const facts = expandBeforeSaul(items, [fact("saul", "ish-bosheth")], rule);
    const pairs = facts.map((f) => `${f.first}<${f.second}`).sort();
    expect(pairs).toEqual(["eli<ish-bosheth", "eli<pilate", "eli<saul", "gideon<ish-bosheth", "gideon<pilate", "gideon<saul"]);
    expect(facts.every((f) => f.kind === "expanded" && f.derived)).toBe(true);
  });

  it("leaves out a judge who is not in the pool, and does nothing without Saul", () => {
    expect(expandBeforeSaul(items.filter((i) => i.id !== "eli"), [], rule).some((f) => f.first === "eli")).toBe(false);
    expect(expandBeforeSaul(items.filter((i) => i.id !== "saul"), [], rule)).toEqual([]);
  });
});
