import { describe,it,expect } from "vitest";
import { readFileSync,writeFileSync,mkdirSync } from "node:fs";
import { arrangeCircularFamilies, type AutoCircleNode } from "./circular-genealogy-auto";
import { familyBranch,familyEdges,type FamilyPerson } from "./genealogy";
import { ringOverlap, singleTrackOffsets } from "./circular-genealogy-edit";
import { familyBandAnchor } from "./circular-genealogy-paths";
const people=JSON.parse(readFileSync("public/content/study/genealogy.json","utf8")).people.filter((p:FamilyPerson)=>p.s!=="G") as FamilyPerson[];
const edges=familyEdges(people);
const roots=["abraham-gen-11-26","israel-gen-25-26","adam-gen-2-19","david-rut-4-17","jesus-isa-7-14"];
const rows:unknown[]=[];
describe("automatic circular family rules",()=> {
  it("packs childless siblings between the growing branches without name-specific rules",()=> {
    const ids=["root","big","small","leaf-a","leaf-b","leaf-c",...Array.from({length:6},(_,i)=>`child-${i}`),"only-child"];
    const input=ids.map((id,i)=>({id,generation:i===0 ? 0 : i<6 ? 1 : 2,baseRadius:i===0 ? 0 : i<6 ? 190 : 380,baseAngle:0}));
    const familyEdges=ids.slice(1,6).map(to=>({from:"root",to,kind:"parent" as const})).concat(ids.slice(6,12).map(to=>({from:"big",to,kind:"parent" as const})),[{from:"small",to:"only-child",kind:"parent" as const}]);
    const result=arrangeCircularFamilies(input,familyEdges,"root");
    const order=ids.slice(1,6).sort((a,b)=>result.offsets[a]-result.offsets[b]);
    expect(new Set([order[0],order.at(-1)])).toEqual(new Set(["big","small"]));
    expect(order.slice(1,-1).every(id=>id.startsWith("leaf-"))).toBe(true);
    expect(result.offsets["leaf-b"]-result.offsets["leaf-a"]).toBeCloseTo(result.offsets["leaf-c"]-result.offsets["leaf-b"]);
  });
  for(const depth of [4,5,6,7,8,9]) for(const direction of ["descendants","ancestors"] as const) for(const root of roots) it(`${root} ${direction} ${depth} generations: no overlap, stable and preserves people`,()=> {
    const branch=familyBranch(people,edges,root,depth,direction,false,false,600,true);
    const radii=[0];for(let g=1;g<=depth;g++) radii[g]=Math.max(radii[g-1]+190,branch.positions.filter(n=>Math.abs(n.generation)===g).length*82/(Math.PI*1.85));
    const input:AutoCircleNode[]=branch.positions.map(n=>({id:n.person.id,generation:Math.abs(n.generation),baseRadius:radii[Math.abs(n.generation)],baseAngle:0,sex:n.person.s}));
    const levels=new Map(branch.positions.map(n=>[n.person.id,n.generation]));
    for(const e of branch.edges.filter(e=>e.kind==="parent")) expect(levels.get(e.to)!).toBeGreaterThan(levels.get(e.from)!);
    const result=arrangeCircularFamilies(input,branch.edges,root);
    const single=arrangeCircularFamilies(input,branch.edges,root,{singleTrack:true});
    expect(Object.values(single.ringTracks).every(n=>n===1)).toBe(true);
    expect(Object.values(single.personTracks).every(n=>n===0)).toBe(true);
    const singleNodes=input.map(n=>({...n,angle:0,radius:n.baseRadius*(single.ringScales[n.generation] ?? single.scale),size:n.generation ? 27 : 40}));
    expect(ringOverlap(singleNodes,single.offsets,1)).toBeNull();
    const enlarged=singleNodes.map(n=>({...n,size:n.generation ? 54 : 80}));
    const spaced=singleTrackOffsets(enlarged,single.offsets);
    if(spaced) expect(ringOverlap(enlarged,spaced,1)).toBeNull();
    else {
      const lacksCapacity=[...new Set(enlarged.map(n=>n.generation))].filter(g=>g>0).some(g=> {
        const ring=enlarged.filter(n=>n.generation===g);
        return ring.length*2*Math.asin(Math.min(1,118.001/(2*ring[0].radius)))>Math.PI*2;
      });
      expect(lacksCapacity).toBe(true);
    }
    if(root===roots[0] && direction==="descendants" && depth===9) expect(spaced).not.toBeNull();
    const collapsedNodes=input.map(n=>({...n,angle:0,radius:n.baseRadius*(result.ringScales[n.generation] ?? result.scale),size:n.generation ? 27 : 40}));
    const collapsed=singleTrackOffsets(collapsedNodes,result.offsets);
    expect(collapsed).not.toBeNull();
    expect(ringOverlap(collapsedNodes,collapsed!,1)).toBeNull();
    const unaligned=arrangeCircularFamilies(input,branch.edges,root,{alignChains:false});
    for(let generation=1;generation<=depth;generation++) {
      const ids=input.filter(n=>n.generation===generation).map(n=>n.id);
      expect([...ids].sort((a,b)=>result.offsets[a]-result.offsets[b])).toEqual([...ids].sort((a,b)=>unaligned.offsets[a]-unaligned.offsets[b]));
    }
    const plotted=input.map(n=> { const count=result.ringTracks[n.generation] ?? 1, radius=n.baseRadius*(result.ringScales[n.generation] ?? 3)+(count===1 ? 0 : (result.personTracks[n.id]/(count-1)-.5)*(result.ringWidths[n.generation]-64));return {...n,angle:0,radius,size:n.generation ? 27 : 40}; });
    expect(Object.keys(result.offsets).sort()).toEqual(input.map(n=>n.id).sort());
    expect(ringOverlap(plotted,result.offsets,1)).toBeNull();
    expect(arrangeCircularFamilies(input,branch.edges,root)).toEqual(result);
    expect(Object.values(result.ringScales).every(s=>s>=1 && s<=(depth>=8 ? 16 : depth>=6 ? 12 : 6)),JSON.stringify(result.ringScales)).toBe(true);
    if(root===roots[0] && direction==="descendants") {
      const ben=branch.edges.filter(e=>e.kind==="parent" && e.from==="benjamin-gen-35-18").map(e=>e.to);
      for(const id of ben) expect(result.personTracks[id]).toBe(2);
      if(depth>=6) {
        expect(levels.get("amram-exo-6-18")).toBe(5);
        for(const id of ["aaron-exo-4-14","moses-exo-2-10","miriam-exo-15-20"]) expect(levels.get(id)).toBe(6);
        const siblings=branch.edges.filter(e=>e.kind==="parent" && e.from==="ishmael-gen-16-11").map(e=>e.to).sort((a,b)=>result.offsets[a]-result.offsets[b]);
        const mother="mahalath-gen-28-9", child="reuel-gen-36-4";
        expect([siblings[0],siblings.at(-1)]).toContain(mother);
        expect(Math.abs(result.offsets[mother]-result.offsets[child])).toBeLessThan(.3);
      }
      if(depth===7) {
        expect(levels.get("daughter-of-machir-1ch-2-21")).toBe(6);
        expect(levels.get("segub-1ch-2-21")).toBe(7);
      }
      if(depth===9) for(const id of ["isaac-gen-17-19","perez-gen-38-29"]) {
        const childAngles=branch.edges.filter(e=>e.kind==="parent" && e.from===id).map(e=>result.offsets[e.to]);
        expect(result.offsets[id]).toBeCloseTo((Math.min(...childAngles)+Math.max(...childAngles))/2,8);
      }
      if(depth===9) {
        const point=(id:string)=>{const n=plotted.find(n=>n.id===id)!;return {x:Math.cos(result.offsets[id])*n.radius,y:Math.sin(result.offsets[id])*n.radius,size:27};};
        const mother="daughter-of-machir-1ch-2-21",father="hezron-gen-46-12",child="segub-1ch-2-21";
        const points=[point(mother),point(child)];
        expect(result.offsets[mother]).toBeCloseTo(result.offsets[child],8);
        // The maternal approach stays outside her own ring and moves toward the join.
        const startRadius=Math.hypot(points[0].x,points[0].y);
        for(let segment=1;segment<points.length;segment++) for(let i=0;i<=20;i++) {
          const a=points[segment-1],b=points[segment],t=i/20;
          expect(Math.hypot(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)).toBeGreaterThanOrEqual(startRadius-1e-6);
        }
        const siblings=branch.edges.filter(e=>e.kind==="parent" && e.from==="machir-gen-50-23").map(e=>e.to);
        const ring=plotted.filter(n=>n.generation===6 && result.personTracks[n.id]===result.personTracks[mother]).map(n=>({id:n.id,angle:result.offsets[n.id]}));
        const bandAngle=familyBandAnchor(siblings,ring,result.offsets["machir-gen-50-23"],plotted.find(n=>n.id===mother)!.radius);
        const bandRadius=plotted.find(n=>n.id===mother)!.radius-27;
        const band={x:Math.cos(bandAngle)*bandRadius,y:Math.sin(bandAngle)*bandRadius};
        const machir=point("machir-gen-50-23");
        const cross=(a:{x:number;y:number},b:{x:number;y:number},c:{x:number;y:number})=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
        for(let i=1;i<points.length;i++) {
          const a=points[i-1],b=points[i];
          expect(cross(a,b,machir)*cross(a,b,band)<0 && cross(machir,band,a)*cross(machir,band,b)<0).toBe(false);
        }
        // The simplified maternal connection must clear surrounding family stems.
        const groups=new Map<string,string[]>();
        for(const e of branch.edges.filter(e=>e.kind==="parent")) {
          const n=plotted.find(n=>n.id===e.to)!;
          const key=[e.from,n.generation,result.personTracks[e.to]].join("|");
          groups.set(key,[...(groups.get(key) ?? []),e.to]);
        }
        const joinedSegments=[[points[0],points[1]]];
        const crossings:string[]=[];
        for(const [key,ids] of groups) {
          const source=key.split("|")[0];
          if(source===father || source===mother || source===child) continue;
          const first=plotted.find(n=>n.id===ids[0])!;
          const peers=plotted.filter(n=>n.generation===first.generation && result.personTracks[n.id]===result.personTracks[first.id]).map(n=>({id:n.id,angle:result.offsets[n.id]}));
          const preferred=result.offsets[source];
          const angle=familyBandAnchor(ids,peers,preferred,first.radius);
          const radius=first.radius-(ids.length>1 ? 27 : 0);
          const a=point(source),b={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
          for(const [c,d] of joinedSegments) if(cross(a,b,c)*cross(a,b,d)<-1e-6 && cross(c,d,a)*cross(c,d,b)<-1e-6) crossings.push(source);
        }
        expect(crossings).toEqual([]);
      }

    }
    rows.push({root,direction,depth,omitted:branch.omitted,people:input.length,result,positions:plotted.map(n=>({...n,angle:result.offsets[n.id]}))});
    mkdirSync(".local",{recursive:true});writeFileSync(".local/genealogy-auto-evaluation.json",JSON.stringify(rows,null,2));
  });
});
