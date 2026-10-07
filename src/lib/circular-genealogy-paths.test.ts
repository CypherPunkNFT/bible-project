import { describe, it, expect } from "vitest";
import { ringRoute, siblingBands, staggeredBranches, familyBandAnchor, familyBandRoute, polarPoint, joinedParentPaths, shouldUseMaternalStem } from "./circular-genealogy-paths";
describe("annular genealogy paths", () => {
  it("keeps large angular detours in their ring corridor", () => {
    for(const [from,to] of [[600,950],[950,600]]) {
      const route=ringRoute(from,0,to,Math.PI*.95);
      for(const [x,y] of route.points) { expect(Math.hypot(x,y)).toBeGreaterThanOrEqual(599.999); expect(Math.hypot(x,y)).toBeLessThanOrEqual(950.001); }
      for(let i=1;i<route.points.length;i++) {
        const [x,y]=route.points[i-1], [xx,yy]=route.points[i];
        expect(Math.hypot((x+xx)/2,(y+yy)/2)).toBeGreaterThan(599.9);
      }
    }
  });
  it("takes the short route around the angular seam", () => {
    const route=ringRoute(600,Math.PI*1.95,900,Math.PI*.05);
    expect(route.points.every(([x])=>x>590)).toBe(true);
  });
  it("breaks a sibling band where another family intervenes", () => {
    expect(siblingBands(["a","b"],[{id:"a",angle:0},{id:"unrelated",angle:.2},{id:"b",angle:.4}],500)).toHaveLength(0);
    expect(siblingBands(["a","b"],[{id:"a",angle:0},{id:"b",angle:.4}],500)).toHaveLength(1);
  });
});

describe("family-band connections",()=> {
  it("lands radially anywhere within a clear sibling-band gap",()=> {
    const ring=[{id:"a",angle:-.3},{id:"b",angle:.3}];
    const angle=familyBandAnchor(["a","b"],ring,.12,1000);
    expect(Math.atan2(Math.sin(angle-.12),Math.cos(angle-.12))).toBeCloseTo(0);
    const [ax,ay]=polarPoint(600,.12),[bx,by]=polarPoint(1000,angle);
    expect(ax*(by-ay)-ay*(bx-ax)).toBeCloseTo(0,8);
  });
  it("keeps radial landings clear of a middle sibling and handles the angular seam",()=> {
    const ring=[{id:"a",angle:-.2},{id:"b",angle:0},{id:"c",angle:.2}];
    const angle=familyBandAnchor(["a","b","c"],ring,0,1000);
    expect(Math.abs(Math.sin(angle))*1000).toBeCloseTo(30);
    const seam=familyBandAnchor(["a","b"],[{id:"a",angle:6.1},{id:"b",angle:.2}],-.04,1000);
    expect(Math.atan2(Math.sin(seam+.04),Math.cos(seam+.04))).toBeCloseTo(0);
  });
  it("uses the mother alone when the father is on an earlier ring, preserving other unions",()=> {
    expect(shouldUseMaternalStem({generation:5,sex:"M"},{generation:6,sex:"F"},7)).toBe(true);
    expect(shouldUseMaternalStem({generation:5,sex:"M"},{generation:3,sex:"F"},6)).toBe(false);
    expect(shouldUseMaternalStem({generation:5,sex:"M"},{generation:5,sex:"F"},6)).toBe(false);
  });
  it("places the union halfway between band edges regardless of person track or mother position",()=> {
    const gap={parentEdge:700,childEdge:1300};
    for(const fatherRadius of [350,550,650]) for(const mother of [{x:600,y:100,size:27},{x:800,y:-100,size:27}]) {
      const {join,points,stem}=joinedParentPaths({x:fatherRadius,y:0,size:27},mother,{x:1500,y:0},gap);
      expect(join.x).toBeCloseTo(1000);
      expect(join.y).toBeCloseTo(0);
      expect(points[1].x).toBeGreaterThan(points[0].x);
      expect(stem.match(/L/g)).toHaveLength(1);
    }
  });
  it("uses the radial gap midpoint with angled stems and either generation direction",()=> {
    for(const inward of [false,true]) {
      const father={x:inward ? 1600 : 400,y:100,size:27};
      const target={x:inward ? 400 : 1600,y:300};
      const mother={x:inward ? 1500 : 550,y:-200,size:27};
      const {join,points,start}=joinedParentPaths(father,mother,target,{parentEdge:inward ? 1400 : 700,childEdge:inward ? 600 : 1300});
      expect(Math.hypot(join.x,join.y)).toBeCloseTo(1000);
      const u={x:target.x-start.x,y:target.y-start.y};
      const last={x:join.x-points[1].x,y:join.y-points[1].y};
      expect(u.x*last.x+u.y*last.y).toBeCloseTo(0);
      const first={x:points[1].x-mother.x,y:points[1].y-mother.y};
      expect(first.x*last.x+first.y*last.y).toBeCloseTo(0);
    }
  });
  it("attaches an odd sibling group between people instead of to the middle person",()=> {
    const ring=[{id:"a",angle:-.2},{id:"b",angle:0},{id:"c",angle:.2}];
    const angle=familyBandAnchor(["a","b","c"],ring,0);
    expect(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))).toBeCloseTo(.1);
  });
  it("uses an existing band instead of crossing a break occupied by another family",()=> {
    const ring=[{id:"a",angle:0},{id:"b",angle:.2},{id:"other",angle:.4},{id:"c",angle:.6}];
    expect(familyBandAnchor(["a","b","c"],ring,.3)).toBeCloseTo(.1);
    expect(familyBandAnchor(["c"],ring,.3)).toBeCloseTo(.6);
  });
  it("routes Amram to his children's band without passing through Aaron, Moses or Miriam",()=> {
    const radius=4434.051674931202;
    const ring=[
      {id:"amram",angle:-2.678333652228252},
      {id:"aaron",angle:-2.4463644054287923},
      {id:"moses",angle:-2.3555054736332006},
      {id:"miriam",angle:-2.395917814379275},
    ];
    const angle=familyBandAnchor(["aaron","moses","miriam"],ring,-2.4009349395309965);
    const route=familyBandRoute(radius-27,ring[0].angle,radius-27,angle,true);
    for(const person of ring) {
      const [x,y]=polarPoint(radius,person.angle);
      for(let i=1;i<route.points.length;i++) {
        const [ax,ay]=route.points[i-1],[bx,by]=route.points[i];
        const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
        expect(Math.hypot(x-ax-t*dx,y-ay-t*dy)).toBeGreaterThanOrEqual(26.999);
      }
    }
    const [x,y]=route.points.at(-1)!;
    expect(Math.hypot(x,y)).toBeCloseTo(radius-27);
    expect(Math.atan2(y,x)).toBeCloseTo(Math.atan2(Math.sin(angle),Math.cos(angle)));
  });
});

describe("staggered family splits", () => {
  it("splits outer children earlier, symmetrically, in either radial direction", () => {
    for (const [start,end] of [[600,950],[950,600]]) {
      const routes=staggeredBranches(start,.2,end,0,[-.6,-.3,0,.3,.6]);
      routes.branches.forEach((b,i)=>expect(b.fraction).toBeCloseTo([.35,.585,.82,.585,.35][i]));
    }
  });
  it("handles a single child and the angular seam", () => {
    expect(staggeredBranches(600,0,950,0,[0]).branches[0].fraction).toBe(.82);
    const routes=staggeredBranches(600,0,950,Math.PI*2,[Math.PI*2-.4,.4]);
    expect(routes.branches[0].fraction).toBeCloseTo(routes.branches[1].fraction);
  });
});

it("ends the trunk at the last actual split for an even sibling group", () => {
  const routes=staggeredBranches(600,.7,950,0,[-.4,.4]);
  const endpoint=routes.trunk.split(" L").at(-1)!.split(",").map(Number);
  const branchStart=routes.branches[0].path.split(" ")[0].slice(1).split(",").map(Number);
  expect(endpoint[0]).toBeCloseTo(branchStart[0]);
  expect(endpoint[1]).toBeCloseTo(branchStart[1]);
  expect(Math.hypot(...endpoint)).toBeCloseTo(722.5);
});
