import { describe, expect, it } from "vitest";
import { layoutStrip, placeUndated } from "@/components/people-pages/strip-layout";
import { laneOf } from "@/components/people-pages/kinds";
import { ERAS, eraScale, formatYears } from "./eras";
import { loadPeopleGroup, peekPeopleGroup } from "./people-pages";
import { PEOPLE_PAGES, apostleFor, rulerFor, rulerHref, type RulerSummary } from "./people-pages-index";

const TONES = ["right", "evil", "mixed", "none"];

describe("people pages index (scripts/build-people-pages-index.py)", () => {
  it("summarises every ruler and apostle with the fields the guides and entry cards use", () => {
    for (const r of PEOPLE_PAGES.rulers) {
      expect(r.id, "ruler id").toMatch(/^[a-z0-9-]+$/);
      expect(typeof r.name).toBe("string");
      expect(typeof r.group).toBe("string");
      expect(r.order).toBeGreaterThan(0);
      expect(TONES).toContain(r.verdictTone);
      if (r.dates) expect(r.dates.from, `${r.id} dates run forwards in time`).toBeGreaterThanOrEqual(r.dates.to);
    }
    for (const a of PEOPLE_PAGES.apostles) {
      expect(a.id).toMatch(/^[a-z0-9-]+$/);
      expect(Array.isArray(a.otherNames)).toBe(true);
    }
    const ids = [...PEOPLE_PAGES.rulers, ...PEOPLE_PAGES.apostles].map((x) => x.id);
    expect(new Set(ids).size, "one page per person").toBe(ids.length);
  });

  it("points every predecessor and successor at a ruler in the index", () => {
    const ids = new Set(PEOPLE_PAGES.rulers.map((r) => r.id));
    for (const r of PEOPLE_PAGES.rulers) for (const next of [r.predecessor, r.successor]) if (next && !ids.has(next)) expect(rulerHref(next)).toBe(`/people/${next}`);
  });

  it("finds a page by any record of the person, and links rulers to their reign", () => {
    const first = PEOPLE_PAGES.rulers[0];
    if (!first) return;
    expect(rulerFor(first.id)?.id).toBe(first.id);
    expect(rulerHref(first.id)).toBe(`/people/${first.id}/rule`);
    expect(rulerHref("abel-gen-4-2")).toBe("/people/abel-gen-4-2");
    expect(apostleFor("abel-gen-4-2")).toBeUndefined();
  });

  it("loads a ruler's group file only when asked, then keeps it", async () => {
    const first = PEOPLE_PAGES.rulers[0] ?? PEOPLE_PAGES.apostles[0];
    if (!first) return;
    const group = await loadPeopleGroup(first.group);
    expect(group?.id ?? first.group).toBeTruthy();
    expect([...(group?.rulers ?? []), ...(group?.apostles ?? [])].some((x) => x.id === first.id)).toBe(true);
    expect(peekPeopleGroup(first.group)).toBe(group);
    expect(await loadPeopleGroup("no-such-file")).toBeUndefined();
  });
});

describe("shared eras and time scale", () => {
  it("keeps the prophets' era names and adds touching year bands", () => {
    expect(ERAS.map((e) => e.id)).toContain("Divided Monarchy");
    for (let i = 1; i < ERAS.length; i++) expect(ERAS[i].from).toBe(ERAS[i - 1].to);
  });

  it("maps later years further right, and compresses the centuries between the Testaments", () => {
    const scale = eraScale(1000);
    expect(scale.x(931)).toBeLessThan(scale.x(586));
    expect(scale.x(1500)).toBe(0);
    expect(scale.x(-500)).toBe(1000);
    const between = scale.bands.find((b) => b.compressed)!;
    const divided = scale.bands.find((b) => b.id === "Divided Monarchy")!;
    expect(between.x1 - between.x0).toBeLessThan(divided.x1 - divided.x0);
  });

  it("writes years BC and AD", () => {
    expect(formatYears(911, 870, true)).toBe("c. 911–870 BC");
    expect(formatYears(-26, -36)).toBe("AD 26–36");
    expect(formatYears(37, -4)).toBe("37 BC – AD 4");
  });
});

describe("reign strips", () => {
  const ruler = (id: string, from: number | undefined, to: number | undefined, order: number, years?: number): RulerSummary => ({
    id, group: "test", kind: "king", realm: "judah", name: id, title: "King", tagline: "", order, reignText: "", verdictTone: "none", prophets: [], sex: "M", years,
    ...(from !== undefined && to !== undefined ? { dates: { from, to, label: "test" } } : {}),
  });
  it("gives an overlapping reign (a co-regency) its own track", () => {
    const x = (year: number) => 1000 - year;
    const { bars, lanes } = layoutStrip([ruler("a", 900, 880, 1), ruler("b", 885, 860, 2), ruler("c", 860, 850, 3)], laneOf, ["judah"], x);
    expect(bars.find((b) => b.ruler.id === "b")?.track).toBe(1);
    expect(bars.find((b) => b.ruler.id === "c")?.track).toBe(0);
    expect(lanes).toEqual([{ id: "judah", tracks: 2 }]);
  });
  it("places rulers with no years in story order, each as long as the years Scripture gives", () => {
    const placed = placeUndated({ bars: [], lanes: [] }, [ruler("second", undefined, undefined, 2, 30), ruler("first", undefined, undefined, 1, 10)], laneOf, () => 0, 100, 12, 0);
    expect(placed.bars.map((b) => b.ruler.id)).toEqual(["first", "second"]);
    expect(placed.bars[1].x1 - placed.bars[1].x0).toBeCloseTo(3 * (placed.bars[0].x1 - placed.bars[0].x0));
    expect(placed.bars.every((b) => b.undated)).toBe(true);
  });
});
