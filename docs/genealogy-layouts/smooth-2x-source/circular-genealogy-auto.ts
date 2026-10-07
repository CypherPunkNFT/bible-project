import type { FamilyEdge } from "./genealogy";
import { ringOverlap } from "./circular-genealogy-edit";
import { joinedParentPaths, shouldUseMaternalStem, familyBandAnchor } from "./circular-genealogy-paths";

export interface AutoCircleNode { id: string; generation: number; baseRadius: number; baseAngle: number; sex?: string }
export interface AutoCircleResult {
  trackLayout?:"single-v1";
  offsets: Record<string, number>; scale: number; ringScales: Record<number, number>;
  ringWidths: Record<number, number>; ringTracks: Record<number, number>;
  personTracks: Record<string, number>; connectionStyles: Record<string, "staggered">;
  junctions: Record<string, never>;
}

/** Allocate disjoint family sectors from the leaves inward, then place people outward.
 * Names and saved manual coordinates never participate in the layout. */
export function arrangeCircularFamilies(input: AutoCircleNode[], edges: FamilyEdge[], root: string, options:{alignChains?:boolean;centerParents?:boolean;singleTrack?:boolean}={}): AutoCircleResult {
  const personRadius=27;
  const trackPadding=64;
  const sweep=Math.PI*1.8;
  const nodes = new Map(input.map(n => [n.id, n]));
  const children = new Map<string, string[]>(input.map(n => [n.id, []]));
  const candidates = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.kind !== "parent") continue;
    const a=nodes.get(edge.from), b=nodes.get(edge.to);
    if (!a || !b || Math.abs(a.generation-b.generation)!==1) continue;
    const inner=a.generation<b.generation ? a : b, outer=inner===a ? b : a;
    candidates.set(outer.id,[...(candidates.get(outer.id) ?? []),inner.id]);
  }
  // A shared child has one placement parent; all recorded edges remain in the renderer.
  const fanout = new Map<string,number>();
  const placementParent=new Map<string,string>();
  for(const parents of candidates.values()) for(const id of new Set(parents)) fanout.set(id,(fanout.get(id) ?? 0)+1);
  for(const n of input.filter(n=>n.id!==root)) {
    const parent=[...new Set(candidates.get(n.id) ?? [])].sort((a,b)=>(fanout.get(b) ?? 0)-(fanout.get(a) ?? 0) || a.localeCompare(b))[0] ?? root;
    children.get(parent)?.push(n.id);
    placementParent.set(n.id,parent);
  }
  const depth=Math.max(...input.map(n=>n.generation));
  const widths:Record<number,number>={}, tracks:Record<number,number>={}, radii:Record<number,number>={0:0};
  for(let g=1;g<=depth;g++) {
    widths[g]=g===1 ? 92 : g<4 ? 300 : 600;
    tracks[g]=options.singleTrack || g<3 ? 1 : 3;
    radii[g]=g===1 ? 300 : radii[g-1]+Math.max(250+(g-2)*200,(widths[g-1]+widths[g])/2+70);
  }
  const personTracks:Record<string,number>={[root]:0};
  for(const ids of children.values()) {
    for(const id of ids) {
      const g=nodes.get(id)!.generation;
      // Larger siblinghoods use the longer outer lanes. Tiny groups stay inside.
      personTracks[id]=tracks[g]===1 ? 0 : ids.length>=5 ? 2 : ids.length>=3 ? 1 : 0;
    }
  }
  const mass=new Map<string,number>();
  const weigh=(id:string):number => { const value=1+(children.get(id) ?? []).reduce((s,c)=>s+weigh(c),0); mass.set(id,value); return value; };
  weigh(root);
  const ordered=new Map<string,string[]>();
  for(const [id,ids] of children) {
    const leaves=ids.filter(c=>!children.get(c)?.length).sort();
    const growing=ids.filter(c=>children.get(c)?.length).sort((a,b)=>mass.get(b)!-mass.get(a)! || a.localeCompare(b));
    const left:string[]=[],right:string[]=[];
    growing.forEach((child,i)=>(i%2 ? right : left).push(child));
    ordered.set(id,[...left,...leaves,...right.reverse()]);
  }
  let spans=new Map<string,number>();
  const actualRadius=(id:string) => {
    const g=nodes.get(id)!.generation, count=tracks[g] ?? 1;
    return radii[g]+(count===1 ? 0 : (personTracks[id]/(count-1)-.5)*Math.max(0,widths[g]-trackPadding));
  };
  const gap=(a:string,b:string) => children.get(a)?.length || children.get(b)?.length ? .022 : 0;
  const measure=(id:string):number => {
    const own=id===root ? 0 : 2*Math.asin(Math.min(.99,(personRadius*2+12)/(2*actualRadius(id))));
    const ids=ordered.get(id) ?? [];
    const required=ids.reduce((sum,c)=>sum+measure(c),0)+ids.slice(1).reduce((sum,c,i)=>sum+gap(ids[i],c),0);
    const span=Math.max(own,required); spans.set(id,span); return span;
  };
  for(let attempt=0;attempt<20;attempt++) {
    spans=new Map(); if(measure(root)<=sweep) break;
    for(let g=1;g<=depth;g++) radii[g]*=1.12;
  }
  const angles:Record<string,number>={[root]:0};
  const place=(id:string,center:number) => {
    angles[id]=center;
    const ids=ordered.get(id) ?? [];
    const spread=1;
    const total=(ids.reduce((s,c)=>s+spans.get(c)!,0)+ids.slice(1).reduce((sum,c,i)=>sum+gap(ids[i],c),0))*spread;
    let cursor=center-total/2;
    ids.forEach((child,i)=> { const width=spans.get(child)!*spread; place(child,cursor+width/2); cursor+=width+(ids[i+1] ? gap(child,ids[i+1])*spread : 0); });
  };
  place(root,0);
  // Improve secondary-parent connections by moving whole family sectors and
  // putting the connected person on the facing end of their sibling group.
  // Only groups on a cross-family path participate; unrelated ordering stays put.
  const secondary=edges.filter(e=>e.kind==="parent" && nodes.has(e.from) && nodes.has(e.to)
    && placementParent.get(e.to)!==e.from && placementParent.get(e.from)!==e.to);
  const partners=new Map<string,[string,string]>();
  const recordedParents=new Map<string,string[]>();
  for(const e of edges) if(e.kind==="parent" && nodes.has(e.from) && nodes.has(e.to))
    recordedParents.set(e.to,[...(recordedParents.get(e.to) ?? []),e.from]);
  for(const ids of recordedParents.values()) for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) {
    const pair=[ids[i],ids[j]].sort() as [string,string]; partners.set(pair.join("|"),pair);
  }
  const links:[string,string,number][]=[...secondary.map(e=>[e.from,e.to,Math.abs(nodes.get(e.from)!.generation-nodes.get(e.to)!.generation)>1 ? 20 : 1] as [string,string,number]),
    ...[...partners.values()].map(([a,b])=>[a,b,.6] as [string,string,number])];
  const movable=new Map<string,Set<string>>();
  for(const [a,b] of links) {
    const path=(id:string)=> {const result=[id];while(placementParent.has(id)){id=placementParent.get(id)!;result.push(id);}return result;};
    const aa=path(a),bb=path(b), common=aa.find(id=>bb.includes(id));
    for(const chain of [aa,bb]) for(let i=0;i<chain.length-1 && chain[i]!==common;i++) {
      const parent=chain[i+1]; if(!movable.has(parent)) movable.set(parent,new Set()); movable.get(parent)!.add(chain[i]);
    }
  }
  const score=()=> {
    const xy=new Map(input.map(n=>[n.id,{x:Math.cos(angles[n.id])*actualRadius(n.id),y:Math.sin(angles[n.id])*actualRadius(n.id)}]));
    const cross=(a:{x:number;y:number},b:{x:number;y:number},c:{x:number;y:number})=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    let crossings=0;
    for(const link of secondary) {
      const a=xy.get(link.from)!,b=xy.get(link.to)!;
      for(const edge of edges) {
        if(edge.kind!=="parent" || !xy.has(edge.from) || !xy.has(edge.to) || [edge.from,edge.to].some(id=>id===link.from || id===link.to)) continue;
        const c=xy.get(edge.from)!,d=xy.get(edge.to)!;
        if(cross(a,b,c)*cross(a,b,d)<-1e-6 && cross(c,d,a)*cross(c,d,b)<-1e-6) crossings++;
      }
    }
    return crossings*100+links.reduce((sum,[a,b,weight])=>sum+weight*Math.abs(angles[a]-angles[b]),0);
  };
  const repack=()=> {spans=new Map();const span=measure(root);place(root,0);return span;};
  let bestScore=score();
  for(let pass=0;pass<4;pass++) {
    let changed=false;
    for(const [parent,members] of movable) for(const member of members) {
      const current=ordered.get(parent)!; if(current.length<2) continue;
      let best=current;
      for(let index=0;index<current.length;index++) {
        const candidate=current.filter(id=>id!==member); candidate.splice(index,0,member);
        ordered.set(parent,candidate); const span=repack(),cost=score();
        if(span<=sweep && cost<bestScore-1e-8) {bestScore=cost;best=candidate;changed=true;}
      }
      ordered.set(parent,best);repack();
    }
    if(!changed) break;
  }
  // Continue a single-child chain along its incoming paternal line. This also
  // handles a father on an earlier ring than the mother, without bending at the child.
  const collisionNodes=input.map(n=>({id:n.id,angle:0,radius:actualRadius(n.id),size:n.generation ? personRadius : Math.max(40,personRadius)}));
  const position=(id:string)=>({x:Math.cos(angles[id])*actualRadius(id),y:Math.sin(angles[id])*actualRadius(id)});
  for(const pivot of (options.alignChains===false ? [] : [...input]).sort((a,b)=>a.generation-b.generation)) {
    const descendants=[...new Set(edges.filter(e=>e.kind==="parent" && e.from===pivot.id && nodes.has(e.to) && nodes.get(e.to)!.generation>pivot.generation).map(e=>e.to))];
    if(descendants.length!==1) continue;
    if((recordedParents.get(descendants[0]) ?? []).length>1) continue;
    const parentIds=(recordedParents.get(pivot.id) ?? []).filter(id=>nodes.get(id)!.generation<pivot.generation)
      .sort((a,b)=>Number(nodes.get(b)!.sex==="M")-Number(nodes.get(a)!.sex==="M") || a.localeCompare(b));
    if(!parentIds.length) continue;
    const a=position(parentIds[0]),b=position(pivot.id),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    if(length<1e-6) continue;
    const ux=dx/length,uy=dy/length,child=descendants[0],radius=actualRadius(child),dot=b.x*ux+b.y*uy;
    const discriminant=dot*dot+radius*radius-b.x*b.x-b.y*b.y;
    if(discriminant<0) continue;
    const distance=-dot+Math.sqrt(discriminant);
    if(distance<=0) continue;
    const targetAngle=Math.atan2(b.y+uy*distance,b.x+ux*distance);
    const delta=Math.atan2(Math.sin(targetAngle-angles[child]),Math.cos(targetAngle-angles[child]));
    const moving=new Set<string>();
    const collect=(id:string)=> {moving.add(id);for(const c of children.get(id) ?? []) collect(c);};
    collect(child);
    const candidate={...angles}; for(const id of moving) candidate[id]+=delta;
    // A clear landing circle is not enough: never leap past another family,
    // and carry the entire descendant sector instead of stranding its children.
    let reordered=false;
    for(const id of moving) for(const other of input) {
      if(moving.has(other.id) || other.generation!==nodes.get(id)!.generation) continue;
      if((angles[id]-angles[other.id])*(candidate[id]-candidate[other.id])<0) {reordered=true;break;}
    }
    if(!reordered && !ringOverlap(collisionNodes,candidate,1,moving)) for(const id of moving) angles[id]=candidate[id];
  }
  const moveParent=(parent:AutoCircleNode,desired:number)=> {
    const current=angles[parent.id];
    const neighbors=input.filter(n=>n.generation===parent.generation && n.id!==parent.id);
    const lower=Math.max(-Infinity,...neighbors.filter(n=>angles[n.id]<current).map(n=>angles[n.id]+1e-8));
    const upper=Math.min(Infinity,...neighbors.filter(n=>angles[n.id]>current).map(n=>angles[n.id]-1e-8));
    const target=Math.max(lower,Math.min(upper,desired));
    const safe=(fraction:number)=>!ringOverlap(collisionNodes,{...angles,[parent.id]:current+(target-current)*fraction},1,new Set([parent.id]));
    let fraction=1;
    if(!safe(1)) {
      let low=0,high=1;
      for(let attempt=0;attempt<22;attempt++) {const middle=(low+high)/2;if(safe(middle)) low=middle;else high=middle;}
      fraction=low;
    }
    angles[parent.id]=current+(target-current)*fraction;
  };
  // Place parents over the actual visible child band, rather than over the
  // space reserved for all later descendants. Work inward after child positions settle.
  for(const parent of (options.centerParents===false ? [] : [...input]).sort((a,b)=>b.generation-a.generation)) {
    if(parent.id===root) continue;
    const ids=[...new Set(edges.filter(e=>e.kind==="parent" && e.from===parent.id && nodes.has(e.to) && nodes.get(e.to)!.generation>parent.generation).map(e=>e.to))];
    if(!ids.length) continue;
    const childAngles=ids.map(id=>angles[id]);
    let desired=(Math.min(...childAngles)+Math.max(...childAngles))/2;
    const first=nodes.get(ids[0])!;
    if(ids.every(id=>nodes.get(id)!.generation===first.generation && personTracks[id]===personTracks[first.id]) && ids.every(id=>(recordedParents.get(id)?.length ?? 0)===1)) {
      const peers=input.filter(n=>n.generation===first.generation && personTracks[n.id]===personTracks[first.id]).map(n=>({id:n.id,angle:angles[n.id]}));
      const anchor=familyBandAnchor(ids,peers,desired,actualRadius(first.id),personRadius);
      desired+=Math.atan2(Math.sin(anchor-desired),Math.cos(anchor-desired));
    }
    moveParent(parent,desired);
  }
  // A mother joining a shared stem faces its junction, not the child at its end.
  // Run after fathers settle; a distant father can make these directions differ.
  const shiftedAncestors=new Set<string>();
  for(const mother of options.centerParents===false ? [] : input) {
    if(mother.sex!=="F" || mother.id===root) continue;
    const ids=[...new Set(edges.filter(e=>e.kind==="parent" && e.from===mother.id && nodes.has(e.to)).map(e=>e.to))];
    if(ids.length!==1) continue;
    const child=nodes.get(ids[0])!;
    const parents=recordedParents.get(child.id) ?? [];
    if(parents.length!==2 || child.generation<=mother.generation) continue;
    const father=nodes.get(parents.find(id=>id!==mother.id)!)!;
    if(father.sex!=="M" || father.generation>=child.generation) continue;
    if(shouldUseMaternalStem(father,mother,child.generation)) continue;
    const parentEdge=Math.max(radii[father.generation]+widths[father.generation]/2,radii[mother.generation]+widths[mother.generation]/2);
    const childEdge=radii[child.generation]-widths[child.generation]/2;
    const {join}=joinedParentPaths({...position(father.id),size:personRadius},{...position(mother.id),size:personRadius},position(child.id),{parentEdge,childEdge});
    const desired=angles[mother.id]+Math.atan2(Math.sin(Math.atan2(join.y,join.x)-angles[mother.id]),Math.cos(Math.atan2(join.y,join.x)-angles[mother.id]));
    const delta=desired-angles[mother.id];
    const motherParents=new Set(recordedParents.get(mother.id) ?? []);
    const moving=new Set(input.filter(n=>n.generation===mother.generation && (n.id===mother.id || (recordedParents.get(n.id) ?? []).some(id=>motherParents.has(id)))).map(n=>n.id));
    const candidate={...angles};
    // Make room by carrying obstructing ring neighbors, never passing them.
    for(let attempt=0;attempt<input.length;attempt++) {
      for(const id of moving) candidate[id]=angles[id]+delta;
      const crossed=input.find(n=>n.generation===mother.generation && !moving.has(n.id) && [...moving].some(id=>(angles[id]-angles[n.id])*(candidate[id]-candidate[n.id])<=0));
      if(crossed) {moving.add(crossed.id);continue;}
      const overlap=ringOverlap(collisionNodes,candidate,1,moving);
      const blocked=overlap?.find(id=>!moving.has(id) && nodes.get(id)!.generation===mother.generation);
      if(blocked) {moving.add(blocked);continue;}
      break;
    }
    const reordered=[...moving].some(id=>input.some(n=>n.generation===mother.generation && !moving.has(n.id) && (angles[id]-angles[n.id])*(candidate[id]-candidate[n.id])<=0));
    if(!reordered && !ringOverlap(collisionNodes,candidate,1,moving)) {
      for(const id of moving) angles[id]=candidate[id];
      for(const id of moving) for(const parent of recordedParents.get(id) ?? []) if(!moving.has(parent)) shiftedAncestors.add(parent);
      continue;
    }
    moveParent(mother,desired);
  }
  // Moving a sibling group to make a union corridor also changes its own
  // incoming stem. Recenter unpaired ancestors after those adjustments.
  for(const parent of (options.centerParents===false ? [] : [...input]).sort((a,b)=>b.generation-a.generation)) {
    if(parent.id===root || !shiftedAncestors.has(parent.id)) continue;
    const ids=[...new Set(edges.filter(e=>e.kind==="parent" && e.from===parent.id && nodes.has(e.to) && nodes.get(e.to)!.generation>parent.generation).map(e=>e.to))];
    if(!ids.length || ids.some(id=>(recordedParents.get(id)?.length ?? 0)>1)) continue;
    let desired=(Math.min(...ids.map(id=>angles[id]))+Math.max(...ids.map(id=>angles[id])))/2;
    const first=nodes.get(ids[0])!;
    if(ids.every(id=>nodes.get(id)!.generation===first.generation && personTracks[id]===personTracks[first.id])) {
      const peers=input.filter(n=>n.generation===first.generation && personTracks[n.id]===personTracks[first.id]).map(n=>({id:n.id,angle:angles[n.id]}));
      const anchor=familyBandAnchor(ids,peers,desired,actualRadius(first.id),personRadius);
      desired+=Math.atan2(Math.sin(anchor-desired),Math.cos(anchor-desired));
    }
    moveParent(parent,desired);
  }
  const ringScales:Record<number,number>={};
  for(const n of input) if(n.generation) ringScales[n.generation]=radii[n.generation]/n.baseRadius;
  return {...(options.singleTrack ? {trackLayout:"single-v1" as const} : {}),scale:3, offsets:Object.fromEntries(input.map(n=>[n.id,angles[n.id]-n.baseAngle])),ringScales,
    ringWidths:widths,ringTracks:tracks,personTracks,connectionStyles:{},junctions:{}};
}
