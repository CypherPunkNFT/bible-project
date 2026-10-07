import { describe, expect, it } from "vitest";
import { layoutStrip, placeUndated } from "@/components/people-pages/strip-layout";
import { accountsHeading, laneOf } from "@/components/people-pages/kinds";
import { ribbonLayout } from "@/components/people-pages/ribbon-layout";
import { ERAS, eraScale, formatYears } from "./eras";
import { loadPeopleGroup, peekPeopleGroup } from "./people-pages";
import { PEOPLE_PAGES, apostleFor, inLineOrder, rulerFor, rulerHref, rulersOfRealm, type RulerSummary } from "./people-pages-index";

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
  const ruler = (id: string, from: number | undefined, to: number | undefined, order: number, years?: number, extra: Partial<RulerSummary> = {}): RulerSummary => ({
    id, group: "test", kind: "king", realm: "judah", name: id, title: "King", tagline: "", order, reignText: "", verdictTone: "none", prophets: [], sex: "M", years,
    ...(from !== undefined && to !== undefined ? { dates: { from, to, label: "test" } } : {}), ...extra,
  });
  it("gives an overlapping reign (a co-regency) its own track", () => {
    const x = (year: number) => 1000 - year;
    const { bars, lanes } = layoutStrip([ruler("a", 900, 880, 1), ruler("b", 885, 860, 2), ruler("c", 860, 850, 3)], laneOf, ["judah"], x);
    expect(bars.find((b) => b.ruler.id === "b")?.track).toBe(1);
    expect(bars.find((b) => b.ruler.id === "c")?.track).toBe(0);
    expect(lanes).toEqual([{ id: "judah", tracks: 2 }]);
  });
  it("places rulers with no years in story order, each as long as the years Scripture gives", () => {
    const placed = placeUndated({ bars: [], lanes: [] }, [ruler("second", undefined, undefined, 2, 30), ruler("first", undefined, undefined, 1, 10)], laneOf, { start: () => 0, end: () => 100, yearWidth: 1, gap: 0, minWidth: 0 });
    expect(placed.bars.map((b) => b.ruler.id)).toEqual(["first", "second"]);
    expect(placed.bars[1].x1 - placed.bars[1].x0).toBeCloseTo(3 * (placed.bars[0].x1 - placed.bars[0].x0));
    expect(placed.bars.every((b) => b.undated)).toBe(true);
  });
  it("places an undated ruler by its order among dated ones in the same line, not after the last dated one", () => {
    const x = (year: number) => 1000 - year;
    const egypt = [ruler("joseph", undefined, undefined, 1, undefined, { kind: "foreign", realm: "egypt" }), ruler("shishak", 943, 923, 5, undefined, { kind: "foreign", realm: "egypt" }),
      ruler("so", undefined, undefined, 6, undefined, { kind: "foreign", realm: "egypt" }), ruler("hophra", 589, 570, 9, undefined, { kind: "foreign", realm: "egypt" })];
    const layout = placeUndated(layoutStrip(egypt, laneOf, ["egypt"], x), egypt, laneOf, { start: () => 0, yearWidth: 1, gap: 1, minWidth: 2 });
    const at = (id: string) => layout.bars.find((b) => b.ruler.id === id)!;
    expect(at("joseph").x1).toBeLessThanOrEqual(at("shishak").x0);
    expect(at("so").x0).toBeGreaterThanOrEqual(at("shishak").x1);
    expect(at("so").x1).toBeLessThanOrEqual(at("hophra").x0);
  });
  it("draws an undated ruler beside the rulers named with them, one after another when they share a neighbour", () => {
    const x = (year: number) => 2000 - year;
    const line = [ruler("oppression", undefined, undefined, 2, undefined, { kind: "foreign", realm: "egypt", near: 1448 }), ruler("exodus", undefined, undefined, 3, undefined, { kind: "foreign", realm: "egypt", near: 1448 })];
    const { bars } = layoutStrip(line, laneOf, ["egypt"], x);
    const [a, b] = ["oppression", "exodus"].map((id) => bars.find((bar) => bar.ruler.id === id)!);
    expect(a.undated && b.undated).toBe(true);
    expect(b.x0).toBeGreaterThanOrEqual(a.x1 - 0.01);
    expect(a.track).toBe(b.track);
  });
});

describe("the order of a line", () => {
  it("sorts a shared realm by dates, so two groups never interleave by their own numbering", () => {
    const rome = rulersOfRealm("rome").map((r) => r.id);
    expect(rome.indexOf("herod-mat-2-1"), "Herod the Great before Augustus's officials").toBeLessThan(rome.indexOf("quirinius-luk-2-2"));
    expect(rome.indexOf("pilate-mat-27-2"), "Lysanias, undated, follows Pilate in his own group's order").toBeLessThan(rome.indexOf("lysanias-luk-3-1"));
    const babylon = rulersOfRealm("babylon").map((r) => r.id);
    const gedaliah = babylon.indexOf("gedaliah-2ki-25-22");
    expect(gedaliah).toBeGreaterThan(babylon.indexOf("nebuchadnezzar-2ki-24-1"));
    expect(gedaliah).toBeLessThan(babylon.indexOf("evil-merodach-2ki-25-27"));
  });
  it("keeps Joseph's Pharaoh first in Egypt's line, and falls back to story order within a group", () => {
    expect(rulersOfRealm("egypt")[0]?.id).toBe("pharaoh-gen-37-36");
    const two = (id: string, order: number, group: string): RulerSummary => ({ id, group, kind: "foreign", realm: "other", name: id, title: "", tagline: "", order, reignText: "", verdictTone: "none", prophets: [], sex: "M" });
    expect(inLineOrder([two("b", 2, "g"), two("a", 1, "g")]).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("lanes and wording by kind", () => {
  it("puts a queen in her realm's lane: Esther in Persia's, Athaliah in Judah's", () => {
    expect(laneOf({ kind: "queen", realm: "persia" })).toBe("persia");
    expect(laneOf({ kind: "queen", realm: "judah" })).toBe("judah");
    expect(laneOf({ kind: "queen", realm: "other" })).toBe("other");
    expect(laneOf({ kind: "governor", realm: "babylon" })).toBe("governors");
    expect(laneOf({ kind: "herod", realm: "rome" })).toBe("rome");
    expect(laneOf({ kind: "foreign", realm: "assyria" })).toBe("assyria");
    expect(laneOf({ kind: "judge", realm: "tribes" })).toBe("tribes");
  });
  it("words the two-accounts card by kind of ruler", () => {
    expect(accountsHeading({ kind: "king", realm: "judah" }).title).toBe("Where Kings and Chronicles differ");
    expect(accountsHeading({ kind: "king", realm: "united" }).title).toBe("Where Samuel–Kings and Chronicles differ");
    expect(accountsHeading({ kind: "roman", realm: "rome" }).lead).toMatch(/Gospels, Acts and Josephus/);
    expect(accountsHeading({ kind: "foreign", realm: "babylon" }).lead).toMatch(/outside/);
  });
  it("draws every ruler on the guide, Egypt's Pharaohs in story order", () => {
    const { layout } = ribbonLayout(PEOPLE_PAGES.rulers, 1000);
    expect(layout.bars.length).toBe(PEOPLE_PAGES.rulers.length);
    const egypt = layout.bars.filter((b) => b.lane === "egypt").sort((a, b) => a.x0 - b.x0).map((b) => b.ruler.id);
    expect(egypt[0]).toBe("pharaoh-gen-37-36");
    expect(egypt.indexOf("pharaoh-exo-1-11")).toBeLessThan(egypt.indexOf("pharaoh-exo-3-10"));
    expect(egypt[egypt.length - 1]).toBe("hophra-jer-37-5");
  });
});
