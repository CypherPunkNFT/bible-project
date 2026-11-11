// The converter's numbers (design section 1 and its review): every size agrees with the Berean note it quotes, the
// ratios Scripture gives hold, the examples name real units, and the address and amount readers never crash it.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readChoice } from "./choice";
import { EXAMPLES } from "./examples";
import { DEFAULT_WAGE, MODERN_UNITS, formatAmount, parseAmount, writeDollars, writeToday, writeWorkTime } from "./modern";
import { BIBLE_UNITS, KINDS, NO_FIXED_SIZE, convert, findUnit, isKind, unitsOf, type Kind } from "./units";

const unit = (kind: Kind, id: string) => {
  const found = findUnit(kind, id);
  if (!found) throw new Error(`no ${kind} unit ${id}`);
  return found;
};
const near = (actual: number, expected: number, within = 0.02) => expect(Math.abs(actual - expected) / expected).toBeLessThanOrEqual(within);

describe("converter units", () => {
  it("gives every unit a unique id within its kind, a positive size, a name and both count forms", () => {
    for (const kind of KINDS) {
      const ids = unitsOf(kind.key).map((each) => each.id);
      expect(ids.length).toBeGreaterThan(2);
      expect(new Set(ids).size).toBe(ids.length);
    }
    for (const each of BIBLE_UNITS) {
      expect(each.size).toBeGreaterThan(0);
      expect(each.name.trim()).not.toBe("");
      expect(each.count(2)).toMatch(/^2 \S/);
      expect(each.count(1)).toMatch(/^1 \S/);
      expect(each.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
    expect(new Set(MODERN_UNITS.map((each) => `${each.kind}:${each.id}`)).size).toBe(MODERN_UNITS.length);
  });

  it("agrees with every Berean note it quotes, within 2 per cent", () => {
    for (const each of BIBLE_UNITS) {
      const note = each.berean;
      if (!note?.size) continue;
      near(each.size * note.amount, note.size);
    }
  });

  it("takes money's sizes from the Berean's own wording", () => {
    expect(unit("money", "denarius").berean?.text).toMatch(/a day’s wage for a laborer/);
    expect(1 / unit("money", "lepton").size).toBe(128);
    expect(unit("money", "lepton").berean?.text).toMatch(/1\/128 of a denarius/);
    expect(1 / unit("money", "kodrantes").size).toBe(64);
    expect(unit("money", "kodrantes").berean?.text).toMatch(/1\/64 of a denarius/);
    expect(1 / unit("money", "assarion").size).toBe(16);
    expect(unit("money", "assarion").berean?.text).toMatch(/1\/16 of a denarius/);
    expect(unit("money", "mina-coin").size).toBe(100);
    expect(unit("money", "mina-coin").berean?.text).toMatch(/a hundred days’ wages/);
    // "About twenty years' wages": 6,000 days at 300 working days a year.
    expect(unit("money", "talent-coin").size / 300).toBe(20);
    expect(unit("money", "talent-coin").confidence).toBe("estimate");
  });

  it("keeps the ratios Scripture gives", () => {
    near(convert(20, unit("weight", "gerah"), unit("weight", "shekel")), 1, 0.001); // Exodus 30:13
    near(convert(2, unit("weight", "beka"), unit("weight", "shekel")), 1, 0.001); // Exodus 38:26
    // Exodus 38:25–26: 603,550 men at half a shekel are 100 talents and 1,775 shekels, so a talent is 3,000 shekels.
    expect((603_550 / 2 - 1775) / 100).toBe(3000);
    near(convert(1, unit("weight", "talent"), unit("weight", "shekel")), 3000, 0.001);
    near(convert(1, unit("weight", "mina"), unit("weight", "shekel")), 50, 0.001);
    near(convert(10, unit("dry", "omer"), unit("dry", "ephah")), 1, 0.001); // Exodus 16:36
    near(convert(10, unit("dry", "ephah"), unit("dry", "homer")), 1, 0.001); // Ezekiel 45:11
    expect(unit("liquid", "bath").size).toBe(unit("dry", "ephah").size); // Ezekiel 45:11
    near(convert(6, unit("length", "long-cubit"), unit("length", "reed")), 1, 0.01); // Ezekiel 40:5
    near(unit("length", "long-cubit").size, unit("length", "cubit").size + unit("length", "handbreadth").size, 0.02);
    near(convert(2000, unit("length", "cubit"), unit("length", "sabbath-journey")), 1, 0.001);
    expect(convert(2, unit("money", "lepton"), unit("money", "kodrantes"))).toBe(1); // Mark 12:42
  });

  it("marks the sizes the Berean's notes disagree on, or that rest on tradition or assumption, as estimates", () => {
    for (const [kind, id] of [["liquid", "bath"], ["dry", "cor"], ["length", "sabbath-journey"], ["weight", "pim"], ["money", "silver-shekel"], ["money", "piece-of-silver"]] as const) {
      const each = unit(kind, id);
      expect(each.confidence, `${kind} ${id}`).toBe("estimate");
      expect(each.caution, `${kind} ${id}`).toBeTruthy();
    }
  });

  it("matches the project's own copy of the Berean's notes, where that copy is present", () => {
    const folder = resolve(__dirname, "../../../../sources/ebible/engbsb");
    if (!existsSync(folder)) return; // Not in git; checked on the computer that holds it.
    const all = readdirSync(folder).filter((name) => name.endsWith(".usfm")).map((name) => readFileSync(resolve(folder, name), "utf8")).join("\n");
    const plain = all.replace(/\\w ([^|\\]*)\|[^\\]*\\w\*/g, "$1").replace(/\\[a-z0-9]+\*?/g, " ").replace(/\s+/g, " ");
    for (const each of BIBLE_UNITS) if (each.berean) expect(plain, `${each.kind} ${each.id}`).toContain(each.berean.text);
  });

  it("names a real unit in every example, and verses in one book", () => {
    expect(new Set(EXAMPLES.map((example) => example.id)).size).toBe(EXAMPLES.length);
    for (const example of EXAMPLES) {
      for (const part of example.parts) expect(findUnit(part.kind, part.unit), `${example.id}: ${part.unit}`).toBeDefined();
      if (example.to) expect(Math.floor(example.to / 1_000_000)).toBe(Math.floor(example.from / 1_000_000));
    }
    for (const item of NO_FIXED_SIZE) expect(item.verse).toBeGreaterThan(1_000_000);
  });

  it("answers the famous ones as the Berean does", () => {
    const ark = convert(300, unit("length", "cubit"), { size: 0.3048 });
    expect(Math.round(ark)).toBe(450); // Genesis 6:15: about 450 feet
    expect(writeToday("length", 300 * unit("length", "cubit").size, DEFAULT_WAGE)).toEqual(["137 m", "450 ft"]);
    expect(writeToday("weight", 5000 * unit("weight", "shekel").size, DEFAULT_WAGE)[0]).toBe("57 kg"); // 1 Samuel 17:5
    expect(writeToday("liquid", 2000 * unit("liquid", "bath").size, DEFAULT_WAGE)).toEqual(["44,000 L", "11,600 gal"]); // 1 Kings 7:26
  });
});

describe("converter numbers", () => {
  it("writes about three significant figures, compact from a million", () => {
    expect(formatAmount(137.16)).toBe("137");
    expect(formatAmount(0.0078125)).toBe("0.00781");
    expect(formatAmount(6.5)).toBe("6.5");
    expect(formatAmount(60_000_000)).toBe("60 million");
  });

  it("shows a coin's worth as the work it stood for, and in dollars at the reader's wage", () => {
    expect(writeWorkTime(1 / 128)).toBe("3.8 minutes");
    expect(writeWorkTime(1 / 16)).toBe("30 minutes");
    expect(writeWorkTime(0.25)).toBe("2 hours");
    expect(writeWorkTime(1)).toBe("1 day");
    expect(writeWorkTime(300)).toBe("300 days");
    expect(writeWorkTime(6000)).toBe("20 years");
    expect(writeDollars(1, 120)).toBe("$120");
    expect(writeDollars(6000 * 10_000, 120)).toBe("$7.2B");
  });

  it("accepts only plain amounts", () => {
    expect(parseAmount("300")).toBe(300);
    expect(parseAmount(" 6.5 ")).toBe(6.5);
    expect(parseAmount("6,5")).toBe(6.5);
    expect(parseAmount("12,000")).toBe(12_000);
    expect(parseAmount("1,234.5")).toBe(1234.5);
    for (const bad of ["", "-1", "1e5", "0x10", "Infinity", "NaN", "1/2", "1,2,3", "9999999999999", "abc"]) expect(parseAmount(bad), bad).toBeNull();
  });

  it("reads the address safely, falling back to the defaults", () => {
    const read = (search: string) => readChoice(new URLSearchParams(search));
    expect(read("kind=money&unit=talent-coin&amount=10000")).toMatchObject({ kind: "money", amount: 10_000, unit: { bible: { id: "talent-coin" } } });
    expect(read("kind=weight&unit=talent")).toMatchObject({ kind: "weight", amount: 1, unit: { bible: { id: "talent", kind: "weight" } } });
    expect(read("kind=length&unit=ft&amount=450")).toMatchObject({ unit: { modern: { id: "ft" } } });
    expect(read("")).toMatchObject({ kind: "length", amount: 1, unit: { bible: { id: "cubit" } } });
    expect(read("kind=__proto__&unit=constructor&amount=1e308")).toMatchObject({ kind: "length", amount: 1, unit: { bible: { id: "cubit" } } });
    expect(read("kind=money&unit=cubit")).toMatchObject({ kind: "money", unit: { bible: { id: "denarius" } } });
    expect(isKind("toString")).toBe(false);
  });
});
