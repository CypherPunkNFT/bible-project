import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NO_FILTERS, NO_PROFILE, UNRECORDED, matches, options, order, preacherFacts, shelfRows, stats } from "./acquired-facets";
import { UNRECORDED_ORIGIN } from "../preachers/directory/regions";
import type { AcquiredCatalogue, AcquiredContributor } from "./acquired";
import type { PeopleData } from "@/data/teachers/pages-types";

const people: PeopleData = JSON.parse(readFileSync("src/data/teachers/people.json", "utf8"));
const facts = preacherFacts(people.people);

const contributor = (over: Partial<AcquiredContributor> & Pick<AcquiredContributor, "id" | "name">): AcquiredContributor =>
  ({ side: "preachers", traditions: [], profileId: null, roles: ["author"], records: 0, readable: 0, ...over });

// Two profiled shelves and one that has none: the third is the case the upgrade exists to make visible.
const spurgeon = contributor({ id: "c-spurgeon", name: "Charles Haddon Spurgeon", profileId: "author-charles-spurgeon", records: 4506, readable: 0, traditions: ["baptist"] });
const calvin = contributor({ id: "c-calvin", name: "John Calvin", profileId: "author-john-calvin", records: 337, readable: 49, traditions: ["reformed"] });
// Synthetic: a shelf the acquisition built before anyone wrote the person up. Sorts last by year, never drops out.
const unwritten = contributor({ id: "c-unwritten", name: "Unwritten Baptist Shelf", records: 609, readable: 0, traditions: ["baptist"], roles: ["author", "editor"] });
const all = [spurgeon, calvin, unwritten];
const catalogue: AcquiredCatalogue = { schemaVersion: 1, updatedAt: "2026-11-25T00:00:00Z", heldTextRecords: 5452, onSiteTexts: 49, contributors: all, unknownAuthorRecords: 12, workRecordCount: 4800 };

describe("shelf rows join contributors to the profiles that exist", () => {
  const rows = shelfRows(all, facts);
  it("takes place of origin, century and life from the documented profile", () => {
    const row = rows.find(r => r.contributor.id === "c-calvin")!;
    expect(row.origin).toBe("France");
    expect(row.century).toBe("1500");
    expect(row.life).toBe("1509–1564");
    expect(row.profiled).toBe(true);
  });
  it("keeps an unprofiled shelf, marks it, and still labels its recorded tradition", () => {
    const row = rows.find(r => r.contributor.id === "c-unwritten")!;
    expect(row.profiled).toBe(false);
    expect(row.shelf).toBe(NO_PROFILE);
    expect(row.origin).toBe(UNRECORDED_ORIGIN);
    expect(row.century).toBe(UNRECORDED);
    expect(row.traditionLabel).toBe("Baptists");
    expect(row.born).toBeNull();
  });
  it("separates a readable shelf from a catalogue-only one", () => {
    expect(rows.find(r => r.contributor.id === "c-calvin")!.shelf).toBe("readable");
    expect(rows.find(r => r.contributor.id === "c-spurgeon")!.shelf).toBe("catalogue");
  });
});

describe("filtering and ordering", () => {
  const rows = shelfRows(all, facts);
  const ids = (list: typeof rows) => list.map(r => r.contributor.id);
  it("matches on the search words, the role and each facet", () => {
    expect(ids(rows.filter(r => matches(r, ["calvin"], NO_FILTERS, "")))).toEqual(["c-calvin"]);
    expect(ids(rows.filter(r => matches(r, [], NO_FILTERS, "editor")))).toEqual(["c-unwritten"]);
    expect(ids(rows.filter(r => matches(r, [], { ...NO_FILTERS, origin: ["France"] }, "")))).toEqual(["c-calvin"]);
    expect(ids(rows.filter(r => matches(r, [], { ...NO_FILTERS, shelf: [NO_PROFILE] }, "")))).toEqual(["c-unwritten"]);
  });
  it("ignores one facet so that facet's own counts stay live", () => {
    const filters = { ...NO_FILTERS, origin: ["France"] };
    expect(rows.filter(r => matches(r, [], filters, "")).length).toBe(1);
    expect(rows.filter(r => matches(r, [], filters, "", "origin")).length).toBe(3);
  });
  it("sorts by held, readable, name and birth year, with unprofiled shelves last by year", () => {
    expect(ids(order(rows, "held"))).toEqual(["c-spurgeon", "c-unwritten", "c-calvin"]);
    expect(ids(order(rows, "readable"))).toEqual(["c-calvin", "c-spurgeon", "c-unwritten"]);
    expect(ids(order(rows, "az"))).toEqual(["c-spurgeon", "c-calvin", "c-unwritten"]);
    expect(ids(order(rows, "year"))).toEqual(["c-calvin", "c-spurgeon", "c-unwritten"]);
  });
});

describe("facet options and header figures", () => {
  const rows = shelfRows(all, facts);
  it("puts 'not recorded' last however many shelves it holds", () => {
    const values = options(rows, "origin").map(o => o.value);
    expect(values[values.length - 1]).toBe(UNRECORDED_ORIGIN);
  });
  it("labels centuries as a span and colours the tradition options", () => {
    expect(options(rows, "century").find(o => o.value === "1500")?.label).toBe("1500–1599");
    expect(options(rows, "tradition").every(o => o.tone?.startsWith("var("))).toBe(true);
  });
  it("counts the shelves without a profile and spreads held texts by tradition and place", () => {
    const figures = stats(rows, catalogue);
    expect(figures.contributors).toBe(3);
    expect(figures.profiled).toBe(2);
    expect(figures.unprofiled).toBe(1);
    expect(figures.largest[0]).toEqual({ label: "Charles Haddon Spurgeon", count: 4506 });
    // The spreads total held records, not shelves, so one large shelf dominates its tradition.
    expect(figures.traditions.find(t => t.label === "Baptists")?.count).toBe(4506 + 609);
    expect(figures.origins.find(o => o.label === UNRECORDED_ORIGIN)?.count).toBe(609);
  });
});
