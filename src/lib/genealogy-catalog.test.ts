import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { familyBranch, familyEdges, type FamilyPerson } from "./genealogy";
import { FAMILY_STARTS, JESUS, MATTHEW_LINE, LUKE_LINE, fullFamilyDepth, gospelPeople } from "./genealogy-catalog";
const people:FamilyPerson[]=JSON.parse(readFileSync("public/content/study/genealogy.json","utf8")).people;

describe("recorded family coverage",()=>{
  it("offers 24 distinct existing families, Jesus first",()=>{
    expect(FAMILY_STARTS).toHaveLength(24);
    expect(FAMILY_STARTS[0][1]).toBe(JESUS);
    expect(new Set(FAMILY_STARTS.map(([,id])=>id)).size).toBe(24);
    for(const [,id] of FAMILY_STARTS) expect(people.some(p=>p.id===id)).toBe(true);
  });
  it.each(["matthew","luke"] as const)("renders the complete %s account without synthetic ancestors",account=>{
    const source=structuredClone(people),projection=gospelPeople(people,account);
    const depth=fullFamilyDepth(projection,JESUS,"ancestors");
    const branch=familyBranch(projection,familyEdges(projection),JESUS,depth,"ancestors",false,false,people.length,true);
    const line=account==="matthew" ? MATTHEW_LINE : LUKE_LINE;
    const visible=new Set(branch.positions.map(p=>p.person.id));
    expect(line).toHaveLength(account==="matthew" ? 41 : 76);
    expect(depth).toBe(line.length-1);
    for(const id of line) expect(visible.has(id),id).toBe(true);
    expect(branch.positions).toHaveLength(account==="matthew" ? 46 : 76);
    expect(branch.omitted).toBe(false);
    expect(branch.positions.some(p=>p.person.id.startsWith("unnamed"))).toBe(false);
    expect(projection.find(p=>p.id==="joseph-mat-1-16")!.pa).toEqual([account==="matthew" ? "jacob-mat-1-15" : "heli-luk-3-23"]);
    expect(projection.find(p=>p.id==="mary-mat-1-16")!.pa).toEqual([]);
    expect(people).toEqual(source);
  });
  it.each(FAMILY_STARTS.slice(1))("includes every reachable recorded descendant of %s",(_name,root)=>{
    const edges=familyEdges(people),depth=fullFamilyDepth(people,root,"descendants");
    const reachable=new Set<string>([root]),queue:string[]=[root];
    for(let i=0;i<queue.length;i++) for(const e of edges) if(e.kind==="parent" && e.from===queue[i] && !reachable.has(e.to)) {reachable.add(e.to);queue.push(e.to);}
    const branch=familyBranch(people,edges,root,depth,"descendants",false,false,people.length,true);
    expect(branch.omitted).toBe(false);
    expect(new Set(branch.positions.map(p=>p.person.id))).toEqual(reachable);
    for(const p of branch.positions) expect(Number.isFinite(p.x)&&Number.isFinite(p.y)).toBe(true);
  });
});
