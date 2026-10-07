import { describe, expect, it } from "vitest";
import { compactFamilyRings, compactRingRadii, lockedPeople, ringOverlap, rotatePeople, siblingArc, tightenSiblings, balanceSiblings, singleTrackOffsets } from "./circular-genealogy-edit";
import type { FamilyEdge } from "./genealogy";
const edges: FamilyEdge[] = [["grandparent", "parent"], ["parent", "child"], ["parent", "sibling"], ["child", "grandchild"]].map(([from, to]) => ({ from, to, kind: "parent" }));
const visible = new Set(edges.flatMap(e => [e.from, e.to]));
describe("circular genealogy editing", () => {
  it("packs crowded sibling groups into nearly touching rings throughout the slider",()=>{
    const original=[0,2000,4000,6000],widths=[80,92,160,180];
    const nodes=Array.from({length:90},(_,i)=>({id:String(i),generation:1+Math.floor(i/30),angle:(i%30)*.04,radius:original[1+Math.floor(i/30)],size:27,trackOffset:0,family:String(Math.floor(i/5))}));
    const snapshot=JSON.stringify(nodes);
    for(const amount of [.25,.5,.75,1]) {
      const result=compactFamilyRings(original,widths,nodes,amount);
      expect(ringOverlap(nodes.map(n=>({...n,angle:result.angles[n.id],radius:result.radii[n.generation]})),{},1)).toBeNull();
      for(let g=1;g<=3;g++) {
        const angles=nodes.filter(n=>n.generation===g).map(n=>result.angles[n.id]);
        expect(angles.every((angle,i)=>i===0 || angle>angles[i-1])).toBe(true);
      }
    }
    const compact=compactFamilyRings(original,widths,nodes,1);
    expect(compact.radii[3]).toBeLessThan(1000);
    expect(compact.radii[3]-compact.radii[2]-90-80).toBeCloseTo(12,6);
    const restored=compactFamilyRings(original,widths,nodes,0);
    expect(restored.radii).toEqual(original);
    nodes.forEach(n=>expect(restored.angles[n.id]).toBe(n.angle));
    expect(JSON.stringify(nodes)).toBe(snapshot);
  });

  it("compresses gaps to 12 units between band edges and returns exactly to original radii",()=>{
    const original=[0,570,1140];
    expect(compactRingRadii(original,[80,92,160],[],1).radii).toEqual([0,98,236]);
    expect(compactRingRadii(original,[80,92,160],[],0).radii).toEqual(original);
    expect(original).toEqual([0,570,1140]);
  });
  it("stops compression before fixed-angle neighbors overlap",()=>{
    const nodes=[{id:"a",generation:1,angle:0,radius:570,size:27,trackOffset:0},{id:"b",generation:1,angle:.2,radius:570,size:27,trackOffset:0}];
    const result=compactRingRadii([0,570],[80,92],nodes,1);
    expect(result.limited).toBe(true);
    expect(result.radii[1]).toBeLessThan(570);
    expect(ringOverlap(nodes.map(n=>({...n,radius:result.radii[1]})),{},1)).toBeNull();
  });
  it("collapses to one track without moving already-clear rings or mutating saved offsets",()=> {
    const nodes=[{id:"a",generation:1,angle:0,radius:1000,size:27},{id:"b",generation:1,angle:.01,radius:1000,size:27},{id:"c",generation:2,angle:1,radius:1600,size:27}];
    const before={a:0,b:0,c:.3};
    const next=singleTrackOffsets(nodes,before)!;
    expect(ringOverlap(nodes,next,1)).toBeNull();
    expect(next.c).toBe(before.c);
    expect(nodes[0].angle+next.a).toBeLessThan(nodes[1].angle+next.b);
    expect(before).toEqual({a:0,b:0,c:.3});
    expect(singleTrackOffsets(nodes,next)).toEqual(next);
  });
  it("rejects an overfull track rather than expanding rings or reordering people",()=> {
    const nodes=Array.from({length:20},(_,i)=>({id:String(i),generation:1,angle:i*.1,radius:100,size:27}));
    expect(singleTrackOffsets(nodes,{})).toBeNull();
  });
  it("locks descendants without including siblings or ancestors", () => {
    expect([...lockedPeople("child", "descendants", edges, visible)].sort()).toEqual(["child", "grandchild"]);
  });
  it("locks both directions without expanding sideways through an ancestor", () => {
    expect([...lockedPeople("child", "both", edges, visible)].sort()).toEqual(["child", "grandchild", "grandparent", "parent"]);
    expect([...lockedPeople("child", "person", edges, visible)]).toEqual(["child"]);
  });
  it("bounds cyclic relationships and excludes hidden people", () => {
    expect(lockedPeople("child", "descendants", [...edges, { from: "grandchild", to: "child", kind: "parent" }], new Set(["child", "grandchild"])).size).toBe(2);
  });
  it("rotates the locked group rigidly without changing other offsets", () => {
    const original = { child: .2, grandchild: .5, sibling: .7 };
    const next = rotatePeople(original, new Set(["child", "grandchild"]), .4);
    expect(next.child).toBeCloseTo(.6); expect(next.grandchild).toBeCloseTo(.9); expect(next.sibling).toBe(.7); expect(original.child).toBe(.2);
  });
  it("rejects overlap across the angular seam", () => {
    const nodes = [{ id: "a", radius: 200, angle: .01, size: 27 }, { id: "b", radius: 200, angle: Math.PI * 2 - .01, size: 27 }];
    expect(ringOverlap(nodes, {}, 1)).toEqual(["b", "a"]);
    expect(ringOverlap(nodes, { b: Math.PI }, 1)).toBeNull();
  });
  it("allows expansion but blocks shrinking past circle clearance", () => {
    const nodes = [{ id: "a", radius: 200, angle: 0, size: 27 }, { id: "b", radius: 200, angle: .2, size: 27 }];
    expect(ringOverlap(nodes, {}, 3)).toBeNull(); expect(ringOverlap(nodes, {}, 1)).not.toBeNull();
  });
  it("checks collisions on different rings as well", () => {
    expect(ringOverlap([{ id: "a", radius: 200, angle: 0, size: 27 }, { id: "b", radius: 250, angle: 0, size: 27 }], {}, 1)).not.toBeNull();
  });
  it("tightens siblings across the angular seam toward their actual midpoint", () => {
    const nodes = [{ id: "a", angle: 350*Math.PI/180, radius: 300, size: 27 }, { id: "b", angle: 10*Math.PI/180, radius: 300, size: 27 }];
    const { middle } = siblingArc(nodes.map(n => n.angle));
    expect(middle).toBeCloseTo(Math.PI*2);
    const next = tightenSiblings(nodes, { other: .7 }, new Set(["a","b"]), .5);
    expect(((nodes[0].angle+next.a)+(nodes[1].angle+next.b))/2).toBeCloseTo(Math.PI*2);
    expect(ringOverlap(nodes,next,1)).toBeNull();
    expect((nodes[1].angle+next.b)-(nodes[0].angle+next.a)).toBeLessThan(20*Math.PI/180);
    expect(next.other).toBe(.7);
  });
  it("can restore sibling spacing with the reciprocal spread factor", () => {
    const nodes = [{ id: "a", angle: 1, radius: 400, size: 27 }, { id: "b", angle: 2, radius: 400, size: 27 }], ids = new Set(["a","b"]);
    const next = tightenSiblings(nodes, {}, ids, .85);
    const restored = tightenSiblings(nodes, next, ids, 1/.85);
    expect(restored.a).toBeCloseTo(0); expect(restored.b).toBeCloseTo(0);
  });

});

it("tightens wide sibling gaps while preserving an already close pair", () => {
  const nodes=[{id:"a",angle:0,radius:600,size:27},{id:"b",angle:.11,radius:600,size:27},{id:"c",angle:.7,radius:600,size:27}];
  const next=tightenSiblings(nodes,{},new Set(["a","b","c"]),.85);
  expect(ringOverlap(nodes,next,1)).toBeNull();
  expect((nodes[2].angle+next.c)-(nodes[0].angle+next.a)).toBeLessThan(.7);
});

it("balances siblings symmetrically around their parent without overlap", () => {
  const nodes=[{id:"a",angle:1,radius:600,size:27},{id:"b",angle:1.4,radius:600,size:27},{id:"c",angle:1.8,radius:600,size:27}];
  const next=balanceSiblings(nodes,{},new Set(["a","b","c"]),.8);
  const angles=nodes.map(n=>n.angle+next[n.id]);
  expect(angles[1]).toBeCloseTo(.8);
  expect(angles[1]-angles[0]).toBeCloseTo(angles[2]-angles[1]);
  expect(ringOverlap(nodes,next,1)).toBeNull();
});

it("packs only selected siblings around their existing midpoint", () => {
  const nodes=[{id:"parent",angle:0,radius:300,size:27},{id:"a",angle:1,radius:600,size:27},{id:"b",angle:1.8,radius:600,size:27},{id:"other",angle:3,radius:600,size:27}];
  const next=balanceSiblings(nodes,{parent:.2,other:.1},new Set(["a","b"]));
  expect(((1+next.a)+(1.8+next.b))/2).toBeCloseTo(1.4);
  expect(next.parent).toBe(.2); expect(next.other).toBe(.1);
  expect(ringOverlap(nodes,next,1)).toBeNull();
  expect(2*600*Math.sin(((1.8+next.b)-(1+next.a))/2)).toBeCloseTo(64.001);
});
