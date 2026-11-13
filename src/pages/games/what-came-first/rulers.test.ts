// What came first?: Who ruled first's known hard cases (design §4.3, §11). Each pair named here is one where the dating
// systems disagree, a co-regency hides the order, or two reigns begin within the build's one-year widening.
import { readFileSync } from "node:fs";
import ruledFile from "@/data/what-came-first/ruled.json";
import { expandBeforeSaul, type BeforeSaul } from "./categories/ruled";
import { RULES, buildIndex, orderOf, type Fact, type Item } from "./order";

const ruled = ruledFile as unknown as { items: Item[]; facts: Fact[]; blocked: [string, string][]; beforeSaul: BeforeSaul };
const expanded = expandBeforeSaul(ruled.items, ruled.facts, ruled.beforeSaul);
const index = buildIndex([...ruled.facts, ...expanded], ruled.blocked);
const items = new Map(ruled.items.map((i) => [i.id, i]));
const asked = (a: string, b: string) => orderOf(items.get(a)!, items.get(b)!, index, RULES.ruled);
const BC = (year: number) => -year;

describe("Who ruled first", () => {
  it.each([
    ["Ahab", "ahab-1ki-16-28", "jehoshaphat-1ki-15-24"], ["Pekahiah", "pekahiah-2ki-15-22", "pekah-2ki-15-25"],
    ["Rehoboam", "rehoboam-1ki-11-43", "jeroboam-1ki-11-26"], ["Ish-bosheth", "ish-bosheth-2sa-2-8", "david-rut-4-17"],
    ["Herod the Great", "herod-mat-2-1", "augustus-luk-2-1"], ["Sargon", "sargon-isa-20-1", "merodach-baladan-2ki-20-12"],
  ])("never asks %s against the other, whose order is not certain", (_, a, b) => {
    expect(items.has(a) && items.has(b), `${a} / ${b} are both in the pool`).toBe(true);
    expect(asked(a, b)).toBeNull();
  });

  it("asks Joash of Israel before Amaziah of Judah", () => {
    expect(asked("amaziah-2ki-12-21", "joash-2ki-13-9")?.first.id).toBe("joash-2ki-13-9");
  });

  it("widens Jehoram of Judah's window to his co-regency start (Thiele, 854 BC), and turns BC and AD into signed years", () => {
    const jehoram = items.get("jehoram-1ki-22-50")!;
    expect(jehoram.lo!).toBeLessThanOrEqual(BC(854));
    expect(jehoram.hi!).toBeGreaterThanOrEqual(BC(848));
    const augustus = items.get("augustus-luk-2-1")!;
    expect(augustus.lo! <= BC(27) && BC(27) <= augustus.hi!).toBe(true);
    const tiberius = items.get("tiberius-mat-22-17")!;
    expect(tiberius.lo! <= 14 && 14 <= tiberius.hi!).toBe(true);
  });

  it("leaves out the rulers dated on one system only (Hazael, Hiram, Rezin), and the pharaohs with no years", () => {
    for (const item of ruled.items) expect(item.id, item.id).not.toMatch(/^(hazael|hiram|rezin|pharaoh)-/);
  });

  it("puts every judge before Saul and before Pilate, never orders two judges by that rule, and never reaches a ruler with no years", () => {
    const judges = new Set(ruled.beforeSaul.ids);
    for (const judge of judges) {
      expect(asked(judge, ruled.beforeSaul.saul)?.first.id, judge).toBe(judge);
      expect(asked(judge, "pilate-mat-27-2")?.first.id, judge).toBe(judge);
    }
    for (const fact of expanded) {
      expect(judges.has(fact.second), `${fact.first} > ${fact.second}`).toBe(false);
      expect(items.get(fact.second)!.lo, fact.second).not.toBeNull();
    }
  });

  it("quotes Acts 13:19–21 for the judges' rule, from the site's Berean", () => {
    const acts = JSON.parse(readFileSync("data/plain/bsb/ACT.json", "utf8")) as Record<string, string>;
    expect(ruled.beforeSaul.refs).toEqual([[44_013_019, 44_013_021]]);
    expect(acts["13:20"]).toMatch(/judges/i);
    expect(acts["13:21"]).toMatch(/Saul/);
  });
});
