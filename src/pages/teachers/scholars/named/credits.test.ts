import { describe, expect, it } from "vitest";
import usage from "../../../../../content/teachers/feature-usage.json";
import { groupUses, buildCredits, selectCredits, type SourceFeature } from "./credits";
const features = usage.features as SourceFeature[];

describe("recorded author credits", () => {
  it("groups repeated page destinations while preserving distinct source locators", () => {
    const use = { page: "A page", address: "/study/letters", evidence: "page.json", locator: "p. 1" };
    const grouped = groupUses([use, use, { ...use, locator: "p. 2" }]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].locator).toBe("p. 1; p. 2");
  });
  it("retains every evidence record and author label beyond the profile list", () => {
    const credits = buildCredits(features);
    expect(credits.length).toBeGreaterThan(36);
    expect(credits.reduce((n, c) => n + c.records.length, 0)).toBe(features.reduce((n, f) => n + f.sources.length, 0));
    expect(new Set(credits.map(c => c.name))).toEqual(new Set(features.flatMap(f => f.sources.map(s => s.author))));
  });
  it("counts content pages once despite multiple references or works", () => {
    for (const c of buildCredits(features)) {
      expect(c.pages).toBe(new Set(c.records.flatMap(r => r.uses.map(u => u.evidence))).size);
      expect(c.areas).toBe(new Set(c.records.map(r => r.featureId)).size);
    }
  });
  it("filters records and counts together without merging initial or joint credits", () => {
    const all = buildCredits(features);
    for (const f of features) for (const c of selectCredits(features, "", f.id, "pages")) {
      expect(c.records.every(r => r.featureId === f.id)).toBe(true);
      expect(c.areas).toBe(1);
      expect(c.pages).toBeLessThanOrEqual(all.find(a => a.name === c.name)!.pages);
    }
  });
  it("finds names and works, sorts deterministically and handles no results", () => {
    const names = selectCredits(features, "Westcott", "letters", "name");
    expect(names.some(c => c.records.some(r => r.title.includes("Hebrews")))).toBe(true);
    expect(selectCredits(features, "zzzz-nonexistent-name", "", "pages")).toEqual([]);
    const pages = selectCredits(features, "", "", "pages");
    expect(pages.map(c => c.pages)).toEqual(pages.map(c => c.pages).sort((a,b) => b-a));
    const az = selectCredits(features, "", "", "name");
    expect(az.map(c => c.name)).toEqual(az.map(c => c.name).sort((a,b) => a.localeCompare(b)));
  });
});
