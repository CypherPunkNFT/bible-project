import { describe, expect, it } from "vitest";
import authoring from "../../../content/research/phase-2.json";
import { filterSources, isLocalResearchHost, sourceUses, type ResearchBundle } from "./model";

// The methods under test read authoring metadata, not generated citation projections.
const data = authoring as unknown as ResearchBundle;
describe("research reader relationships", () => {
  it("finds editions by contributor, language and multiple terms", () => {
    expect(filterSources(data.sources, "novotny", data.contributors).map(s => s.id)).toEqual(["sennacherib-022"]);
    expect(filterSources(data.sources, "Greek Mark", data.contributors).map(s => s.id)).toEqual(["sinaiticus-mark"]);
    expect(filterSources(data.sources, "nonexistent", data.contributors)).toEqual([]);
  });
  it("links only real uses of the named source", () => {
    expect(sourceUses(data, "sennacherib-022").map(r => r.to)).toEqual(["cases/hezekiah-assyria", "study/prayer-under-pressure"]);
    expect(sourceUses(data, "sinaiticus-mark").map(r => r.to)).toEqual(["cases/sinaiticus-mark-ending"]);
    expect(sourceUses(data, "missing")).toEqual([]);
  });
  it("limits draft loading to loopback hosts", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) expect(isLocalResearchHost(host)).toBe(true);
    for (const host of ["example.org", "localhost.example.org", "192.168.1.1", "127.0.0.1.example.org"]) expect(isLocalResearchHost(host)).toBe(false);
  });
});
