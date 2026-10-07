import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { familyBranch, familyEdges, type FamilyPerson } from "./genealogy";

const person = (id: string, links: Partial<FamilyPerson> = {}): FamilyPerson => ({
  id, n: id, o: [], b: "", c: 0, s: "", e: "", f: 0,
  pa: [], ch: [], sp: [], si: [], ...links,
});
describe("recorded family branches", () => {
  const people = [person("grandparent", { ch: ["parent"] }),
    person("parent", { pa: ["grandparent"], ch: ["root"] }),
    person("root", { pa: ["parent"], ch: ["child"], sp: ["partner"], si: ["sibling"] }),
    person("child"), person("partner", { sp: ["root"], pa: ["other"] }), person("sibling"), person("other")];
  const edges = familyEdges(people);
  const ids = (direction: "both" | "ancestors" | "descendants", spouses = false, siblings = false) =>
    familyBranch(people, edges, "root", 2, direction, spouses, siblings).positions.map(p => p.person.id).sort();
  it("deduplicates reciprocal records and ignores missing identities", () => {
    expect(edges.filter(e => e.from === "grandparent" && e.to === "parent")).toHaveLength(1);
    expect(edges.filter(e => e.kind === "spouse")).toHaveLength(1);
    expect(familyEdges([person("a", { pa: ["missing"], ch: ["a"] })])).toEqual([]);
  });
  it("keeps ancestor and descendant directions distinct", () => {
    expect(ids("ancestors")).toEqual(["grandparent", "parent", "root"]);
    expect(ids("descendants")).toEqual(["child", "root"]);
  });
  it("adds relatives without importing their unrelated ancestors", () => {
    expect(ids("both", true, true)).toEqual(["child", "grandparent", "parent", "partner", "root", "sibling"]);
  });
  it("bounds cyclic or large branches", () => {
    const cyclic = [person("a", { ch: ["b"] }), person("b", { ch: ["a", "c"] }), person("c")];
    const branch = familyBranch(cyclic, familyEdges(cyclic), "a", 4, "descendants", false, false, 2);
    expect(branch.positions).toHaveLength(2);
    expect(branch.omitted).toBe(true);
  });
  it("keeps independent family lines aligned instead of alphabetically crossing", () => {
    const family = [person("root", { ch: ["Irad", "Kenan"] }), person("Irad", { ch: ["Mehujael"] }),
      person("Kenan", { ch: ["Mahalalel"] }), person("Mehujael"), person("Mahalalel")];
    const branch = familyBranch(family, familyEdges(family), "root", 3, "descendants", false, false);
    const x = (id: string) => branch.positions.find(p => p.person.id === id)!.x;
    expect(x("Irad")).toBe(x("Mehujael"));
    expect(x("Kenan")).toBe(x("Mahalalel"));
    expect((x("Irad") - x("Kenan")) * (x("Mehujael") - x("Mahalalel"))).toBeGreaterThan(0);
  });
  it("retains collective family identities so their recorded branches stay connected", () => {
    const family = [person("person", { ch: ["nation"] }), person("nation", { s: "G" })];
    expect(familyBranch(family, familyEdges(family), "person", 2, "both", true, true).positions.map(p => p.person.id)).toEqual(["person", "nation"]);
  });
  it("centers the real Abraham branch without overlaps or long sideways fans", () => {
    const corpus = JSON.parse(readFileSync("public/content/study/genealogy.json", "utf8")).people as FamilyPerson[];
    const branch = familyBranch(corpus, familyEdges(corpus), "abraham-gen-11-26", 5, "both", true, false);
    expect(new Set(branch.positions.filter(p => p.generation === 2).map(p => p.y)).size).toBe(1);
    expect(new Set(branch.positions.filter(p => p.generation === 4).map(p => p.y)).size).toBeLessThanOrEqual(2);
    const nodes = new Map(branch.positions.map(p => [p.person.id, p]));
    const parentEdges = branch.edges.filter(e => e.kind === "parent");
    const horizontalSpan = parentEdges.reduce((sum, edge) => sum + Math.abs(nodes.get(edge.from)!.x - nodes.get(edge.to)!.x), 0);
    // Previous one-sided placement measured 285,236 SVG units for this same branch.
    expect(horizontalSpan).toBeLessThan(150000);
    for (const tier of new Set(branch.positions.map(p => p.y))) {
      const row = branch.positions.filter(p => p.y === tier).sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i++) expect(row[i].x - row[i - 1].x).toBeGreaterThanOrEqual(143.99);
    }
    for (const node of branch.positions) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + 128).toBeLessThan(branch.width);
    }
    expect(familyBranch(corpus, familyEdges(corpus), "abraham-gen-11-26", 5, "both", true, false).positions).toEqual(branch.positions);
  });
  it("keeps even large sibling groups on one level inside the generation band", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `child-${i}`);
    const family = [person("parent", { ch: ids }), ...ids.map(id => person(id))];
    const branch = familyBranch(family, familyEdges(family), "parent", 1, "descendants", false, false);
    const children = branch.positions.filter(p => p.person.id !== "parent");
    expect(new Set(children.map(p => p.generation))).toEqual(new Set([1]));
    expect(new Set(children.map(p => p.y)).size).toBe(1);
    expect(branch.clusters.find(c => c.generation === 1)?.members).toHaveLength(20);
    const band = branch.bands.find(b => b.generation === 1)!;
    expect(band.label).toBe("Children");
    expect(band.numeral).toBe("I");
    for (const child of children) {
      expect(child.y).toBeGreaterThan(band.y);
      expect(child.y + 104).toBeLessThan(band.y + band.height);
    }
  });
  it("keeps differing parent sets in separate sibling clusters", () => {
    const family = [person("parent", { ch: ["a", "b", "c"] }), person("a", { pa: ["other"] }),
      person("b", { pa: ["other"] }), person("c"), person("other")];
    const branch = familyBranch(family, familyEdges(family), "parent", 1, "descendants", false, false);
    const cluster = branch.clusters.find(c => c.members.includes("a"))!;
    expect(cluster.members).toEqual(["a", "b"]);
    expect(cluster.parents).toEqual(["other", "parent"]);
    expect(branch.clusters.find(c => c.members.includes("c"))?.id).not.toBe(cluster.id);
  });
  it("staggers descendants of siblings while keeping each siblinghood level", () => {
    const left = Array.from({ length: 10 }, (_, i) => `left-${i}`);
    const right = Array.from({ length: 10 }, (_, i) => `right-${i}`);
    const family = [person("root", { ch: ["a", "b"] }), person("a", { ch: left }), person("b", { ch: right }),
      ...left.map(id => person(id)), ...right.map(id => person(id))];
    const branch = familyBranch(family, familyEdges(family), "root", 2, "descendants", false, false);
    const y = (id: string) => branch.positions.find(p => p.person.id === id)!.y;
    expect(y("a")).toBe(y("b"));
    expect(new Set(left.map(y)).size).toBe(1);
    expect(new Set(right.map(y)).size).toBe(1);
    expect(y(left[0])).not.toBe(y(right[0]));
    expect(new Set(branch.positions.filter(p => [...left, ...right].includes(p.person.id)).map(p => p.generation))).toEqual(new Set([2]));
  });
  it("keeps half-siblings aligned even in a crowded generation", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `child-${i}`);
    const family = [person("root", { ch: ids }), person("other"), ...ids.map((id, i) => person(id, { pa: i % 2 ? ["other"] : [] }))];
    const branch = familyBranch(family, familyEdges(family), "root", 1, "descendants", false, false);
    expect(new Set(branch.positions.filter(p => ids.includes(p.person.id)).map(p => p.y)).size).toBe(1);
  });

  it("packs a short branch beside the narrow contour of a deep branch", () => {
    const children = Array.from({ length: 20 }, (_, i) => `grandchild-${i}`);
    const family = [person("root", { ch: ["large", "short"] }), person("large", { ch: children }), person("short"), ...children.map(id => person(id))];
    const branch = familyBranch(family, familyEdges(family), "root", 2, "descendants", false, false);
    const large = branch.positions.find(p => p.person.id === "large")!, short = branch.positions.find(p => p.person.id === "short")!;
    expect(Math.abs(large.x - short.x)).toBeLessThan(300);
    expect(large.y).toBe(short.y);
    expect(branch.clusters.find(c => c.members.includes("large"))!.width).toBeLessThan(500);
  });

  it("compacts single-file ancestry with nearby generation labels", () => {
    const family = [person("a", { ch: ["b"] }), person("b", { ch: ["c"] }), person("c")];
    const branch = familyBranch(family, familyEdges(family), "c", 3, "ancestors", false, false);
    expect(branch.bands.every(b => b.compact)).toBe(true);
    for (const band of branch.bands) {
      const node = branch.positions.find(n => n.generation === band.generation)!;
      expect(node.x - band.labelX!).toBe(220);
      expect(band.height).toBe(180);
    }
    const ys = branch.positions.map(n => n.y).sort((a, b) => a - b);
    expect(ys[1] - ys[0]).toBe(280);
  });

});
