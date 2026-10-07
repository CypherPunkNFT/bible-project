import { describe, expect, it } from "vitest";
import { compareArrangement, type StudyNode } from "./circular-layout-study";
const nodes: StudyNode[] = [{ id: "a", name: "Parent", generation: 1, angle: 0, radius: 100, size: 27 }, { id: "b", name: "Child", generation: 2, angle: .5, radius: 200, size: 27 }];
const edges = [{ from: "a", to: "b", kind: "parent" as const }];
describe("layout study comparisons", () => {
  it("captures exact original and edited positions with no source mutations", () => {
    const report = compareArrangement(nodes, edges, { scale: 4, offsets: { a: .5 } });
    expect(report.people[0]).toMatchObject({ originalAngle: 0, finalAngle: .5, originalRadius: 300, finalRadius: 400 });
    expect(report.movedPeople[0].visibleDescendantCount).toBe(1);
    expect(report.edited.meanParentChildAngularSeparationDegrees).toBe(0);
    expect(nodes[0].angle).toBe(0);
  });
  it("separates radius changes from angular improvements", () => {
    const report = compareArrangement(nodes, edges, { scale: 4, offsets: {} });
    expect(report.baselineAtEditedSize).toEqual(report.edited);
    expect(report.baselineAtDefaultSize.minimumDiscClearance).not.toBe(report.edited.minimumDiscClearance);
    expect(report.movedPeople).toEqual([]);
  });
  it("normalizes full rotations and bounds cyclic descendant counting", () => {
    const report = compareArrangement(nodes, [...edges, { from: "b", to: "a", kind: "parent" }], { scale: 3, offsets: { a: Math.PI * 2, b: .2 } });
    expect(report.movedPeople.map(p => p.id)).toEqual(["b"]);
    expect(report.movedPeople[0].visibleDescendantCount).toBe(1);
  });
  it("preserves independent ring radii in exported comparisons", () => {
    const report = compareArrangement(nodes, edges, { scale: 3, ringScales: { 1: 4 }, offsets: {} });
    expect(report.people.map(p => p.finalRadius)).toEqual([400, 600]);
    expect(report.edited).toEqual(report.baselineAtEditedSize);
    expect(report.people.map(p => p.originalRadius)).toEqual([300, 600]);
  });

});
