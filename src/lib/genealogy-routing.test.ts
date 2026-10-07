import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { familyBranch, familyEdges, type FamilyPerson } from "./genealogy";
import { boxesOverlap, segmentTouchesBox, entersBox, routeFamilies, segmentsCross } from "./genealogy-routing";

const people = JSON.parse(readFileSync("public/content/study/genealogy.json", "utf8")).people as FamilyPerson[];
const edges = familyEdges(people);
describe("family corridor routing", () => {
  for (const root of ["abraham-gen-11-26", "israel-gen-25-26", "adam-gen-2-19", "jesus-isa-7-14", "david-rut-4-17", "noah-gen-5-29"]) {
    it(`preserves every connection without unrelated wire or family-box crossings: ${root}`, () => {
      const branch = familyBranch(people, edges, root, 5, "both", true, false);
      const { routes, unresolved } = routeFamilies(branch);
      expect(routes.filter(r => r.kind === "parent").every(r => r.ids.length === 2 && r.smoothPath?.includes(" C"))).toBe(true);
      if (root === "abraham-gen-11-26") expect(unresolved).toHaveLength(0);
      for (const edge of branch.edges) {
        expect([...routes, ...unresolved].some(route => route.kind === edge.kind && route.source === edge.from && route.ids.includes(edge.to))).toBe(true);
      }
      for (const route of routes) {
        for (const corner of route.corners ?? []) for (const box of branch.clusters) expect(boxesOverlap(corner, box)).toBe(false);
        for (let i = 1; i < route.points.length; i++) {
          for (const box of branch.clusters) {
            if (box.id === route.family || box.members.includes(route.source) || (route.kind !== "parent" && box.members.some(id => route.ids.includes(id)))) continue;
            expect(entersBox(route.points[i - 1], route.points[i], box), `${route.title} enters ${box.id}`).toBe(false);
          }
        }
      }
      for (let i = 0; i < routes.length; i++) for (let j = 0; j < i; j++) {
        const a = routes[i], b = routes[j];
        // A shared parent trunk/family junction is an intentional connection.
        if (a.family === b.family || a.source === b.source || (a.kind !== "parent" && a.ids.includes(b.source)) || (b.kind !== "parent" && b.ids.includes(a.source))) continue;
        for (const [rounded, other] of [[a, b], [b, a]]) for (const corner of rounded.corners ?? []) {
          for (let k = 1; k < other.points.length; k++) expect(segmentTouchesBox(other.points[k - 1], other.points[k], corner)).toBe(false);
          for (const otherCorner of other.corners ?? []) expect(boxesOverlap(corner, otherCorner)).toBe(false);
        }
        const crosses = a.points.some((end, k) => k > 0 && b.points.some((otherEnd, l) => l > 0 && segmentsCross(a.points[k - 1], end, b.points[l - 1], otherEnd)));
        expect(crosses, `${a.title} crosses ${b.title}`).toBe(false);
      }
    }, 20000);
  }
});
