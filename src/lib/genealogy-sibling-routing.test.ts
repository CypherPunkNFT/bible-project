import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { familyBranch,familyEdges,type FamilyPerson } from "./genealogy";
import { alignTreeFamilies } from "./genealogy-tree-alignment";
import { routeSiblingGroups } from "./genealogy-routing";

const people=JSON.parse(readFileSync("public/content/study/genealogy.json","utf8")).people as FamilyPerson[];
it("groups the full tree into straight stems without inventing shared parents",()=>{
  const branch=familyBranch(people,familyEdges(people),"abraham-gen-11-26",9,"descendants",false,false,600,true);
  const before=JSON.stringify(branch);
  const result=routeSiblingGroups(branch);
  const stems=result.routes.filter(r=>r.kind==="parent");
  expect(stems.length).toBeLessThan(branch.edges.filter(e=>e.kind==="parent").length);
  expect(new Set(stems.map(r=>r.family)).size).toBe(stems.length);
  for(const route of result.routes) {
    expect(route.points).toHaveLength(2);
    expect(route.points.flat().every(Number.isFinite)).toBe(true);
    const [parents]=JSON.parse(route.family) as [string[],number,number];
    for(const child of route.ids.filter(id=>!parents.includes(id))) {
      expect(branch.edges.filter(e=>e.kind==="parent" && e.to===child).map(e=>e.from).sort()).toEqual(parents);
    }
  }
  for(const edge of branch.edges.filter(e=>e.kind==="parent")) expect(stems.some(r=>r.ids.includes(edge.from) && r.ids.includes(edge.to))).toBe(true);
  expect(result.unresolved).toHaveLength(2);
  expect(JSON.stringify(branch)).toBe(before);
});

it("aligns local co-parents and uses markers for the two distant unions",()=>{
  const input=familyBranch(people,familyEdges(people),"abraham-gen-11-26",9,"descendants",false,false,600,true);
  const snapshot=JSON.stringify(input),branch=alignTreeFamilies(input);
  const before=new Map(input.positions.map(n=>[n.person.id,n])),after=new Map(branch.positions.map(n=>[n.person.id,n]));
  for(const [a,b] of [["mahalath-gen-28-9","esau-gen-25-25"],["amram-exo-6-18","jochebed-exo-6-20"]]) {
    expect(Math.abs(after.get(a)!.x-after.get(b)!.x)).toBeLessThan(Math.abs(before.get(a)!.x-before.get(b)!.x));
  }
  expect(Math.abs(after.get("amram-exo-6-18")!.x-after.get("jochebed-exo-6-20")!.x)).toBe(132);
  const mahalath=after.get("mahalath-gen-28-9")!,esau=after.get("esau-gen-25-25")!;
  expect(branch.positions.filter(n=>n.y===mahalath.y && n.x>Math.min(mahalath.x,esau.x) && n.x<Math.max(mahalath.x,esau.x)).map(n=>({name:n.person.n,x:n.x}))).toEqual([]);
  for(let i=0;i<branch.positions.length;i++) for(let j=0;j<i;j++) {
    const a=branch.positions[i],b=branch.positions[j];expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeGreaterThanOrEqual(116);
  }
  const result=routeSiblingGroups(branch);
  for(const pair of [["hezron-gen-46-12","daughter-of-machir-1ch-2-21"],["aaron-exo-4-14","elisheba-exo-6-23"]]) {
    expect(result.unresolved.some(r=>pair.every(id=>r.ids.includes(id)))).toBe(true);
    expect(result.routes.some(r=>r.kind==="parent-join" && pair.every(id=>r.ids.includes(id)))).toBe(false);
  }
  expect(JSON.stringify(input)).toBe(snapshot);
});
