import type { FamilyEdge } from "./genealogy";
export type MoveScope = "person" | "ancestors" | "descendants" | "both";
export interface RingNode { id: string; angle: number; radius: number; size: number }
/** Fixed-angle compression, bounded by band edges and actual person clearance. */
export function compactRingRadii(original:number[], widths:number[], nodes:(RingNode & {generation:number;trackOffset:number})[], amount:number) {
  const target=[0];
  let capacityLimited=false;
  for(let g=1;g<original.length;g++) {
    target[g]=Math.min(original[g],target[g-1]+widths[g-1]/2+widths[g]/2+12);
    const ring=nodes.filter(n=>n.generation===g);
    const clearRing=(radius:number)=>!ringOverlap(ring.map(n=>({...n,radius:radius+n.trackOffset})),{},1);
    if(!clearRing(target[g])) {
      capacityLimited=true;
      let low=target[g],high=original[g];
      for(let i=0;i<30;i++) {const middle=(low+high)/2;if(clearRing(middle)) high=middle;else low=middle;}
      target[g]=high;
    }
  }
  const at=(fraction:number)=>original.map((r,g)=>r+(target[g]-r)*fraction);
  const clear=(radii:number[])=>!ringOverlap(nodes.map(n=>({...n,radius:radii[n.generation]+n.trackOffset})),{},1);
  const requested=Math.max(0,Math.min(1,amount));
  if(clear(at(requested))) return {radii:at(requested),limited:requested>0 && capacityLimited};
  let low=0,high=requested;
  for(let i=0;i<30;i++) {const middle=(low+high)/2;if(clear(at(middle))) low=middle;else high=middle;}
  return {radii:at(low),limited:true};
}
/** Collapse tracks at unchanged ring radii; preserve order and spread only crowded rings. */
export function singleTrackOffsets(nodes:(RingNode & {generation:number})[],offsets:Record<string,number>) {
  let next={...offsets};
  for(const generation of new Set(nodes.map(n=>n.generation))) {
    if(!generation) continue;
    const ring=nodes.filter(n=>n.generation===generation);
    if(!ringOverlap(ring,next,1)) continue;
    next=tightenSiblings(ring,next,new Set(ring.map(n=>n.id)),1);
    if(ringOverlap(ring,next,1)) {
      // When expansion reaches the seam, borrow room from the large empty gaps.
      // Preserve cyclic order and fixed radii; reject truly insufficient capacity.
      const tau=2*Math.PI;
      const start=siblingArc(ring.map(n=>n.angle+(offsets[n.id] ?? 0))).start;
      const ordered=ring.map(n=>({node:n,angle:start+((n.angle+(offsets[n.id] ?? 0)-start)%tau+tau)%tau})).sort((a,b)=>a.angle-b.angle);
      const minimum=ordered.map(({node:a},i)=> {
        const b=ordered[(i+1)%ordered.length].node,distance=a.size+b.size+10.001;
        return Math.acos(Math.max(-1,Math.min(1,(a.radius*a.radius+b.radius*b.radius-distance*distance)/(2*a.radius*b.radius))));
      });
      const required=minimum.reduce((sum,n)=>sum+n,0);
      if(required>tau) return null;
      const spare=ordered.map((a,i)=>Math.max(0,ordered[(i+1)%ordered.length].angle+(i===ordered.length-1 ? tau : 0)-a.angle-minimum[i]));
      const totalSpare=spare.reduce((sum,n)=>sum+n,0);
      let angle=ordered[0].angle;
      const proposed=ordered.map((_,i)=>{const value=angle;angle+=minimum[i]+(tau-required)*(totalSpare ? spare[i]/totalSpare : 1/ordered.length);return value;});
      const shift=ordered.reduce((sum,item,i)=>sum+item.angle-proposed[i],0)/ordered.length;
      ordered.forEach(({node},i)=>{next[node.id]=proposed[i]+shift-node.angle;});
    }
  }
  return ringOverlap(nodes,next,1) ? null : next;
}
export function lockedPeople(id: string, scope: MoveScope, edges: FamilyEdge[], visible: Set<string>) {
  const result = new Set([id]);
  const walk = (up: boolean) => {
    const queue = [id], visited = new Set(queue);
    for (let i = 0; i < queue.length; i++) for (const edge of edges) {
      if (edge.kind !== "parent" || (up ? edge.to : edge.from) !== queue[i]) continue;
      const next = up ? edge.from : edge.to;
      if (!visible.has(next) || visited.has(next)) continue;
      visited.add(next); result.add(next); queue.push(next);
    }
  };
  if (scope === "ancestors" || scope === "both") walk(true);
  if (scope === "descendants" || scope === "both") walk(false);
  return result;
}
export function ringOverlap(nodes: RingNode[], offsets: Record<string, number>, scale: number, affected?: Set<string>) {
  const points = nodes.map(n => ({ ...n, x: Math.cos(n.angle + (offsets[n.id] ?? 0)) * n.radius * scale, y: Math.sin(n.angle + (offsets[n.id] ?? 0)) * n.radius * scale }));
  for (let i = 0; i < points.length; i++) for (let j = 0; j < i; j++) {
    const a = points[i], b = points[j];
    if (affected && !affected.has(a.id) && !affected.has(b.id)) continue;
    if (Math.hypot(a.x - b.x, a.y - b.y) < a.size + b.size + 10) return [a.id, b.id];
  }
  return null;
}
export function rotatePeople(offsets: Record<string, number>, ids: Set<string>, delta: number) {
  const next = { ...offsets };
  ids.forEach(id => { next[id] = ((offsets[id] ?? 0) + delta) % (Math.PI * 2); });
  return next;
}

/** Midpoint of the shortest arc containing the group, including across 0/360. */
export function siblingArc(angles: number[]) {
  const tau = Math.PI * 2;
  const sorted = angles.map(a => (a % tau + tau) % tau).sort((a,b) => a-b);
  if (!sorted.length) return { start: 0, middle: 0 };
  let gap = -1, start = sorted[0];
  sorted.forEach((a,i) => { const next = sorted[(i+1)%sorted.length] + (i === sorted.length-1 ? tau : 0); if (next-a > gap) { gap = next-a; start = next % tau; } });
  return { start, middle: start + (tau-gap)/2 };
}
export function tightenSiblings(nodes: RingNode[], offsets: Record<string, number>, ids: Set<string>, factor: number) {
  const group = nodes.filter(n => ids.has(n.id));
  const { start, middle } = siblingArc(group.map(n => n.angle + (offsets[n.id] ?? 0)));
  const result = { ...offsets }, tau = Math.PI*2;
  const ordered = group.map(n => {
    const current=n.angle+(offsets[n.id] ?? 0), wrapped=((current-start)%tau+tau)%tau;
    return { node:n, angle:start+(Math.abs(wrapped-tau)<1e-9 ? 0 : wrapped) };
  }).sort((a,b)=>a.angle-b.angle);
  const gaps=ordered.slice(1).map((item,i)=> {
    const previous=ordered[i], a=previous.node, b=item.node;
    const clearance=a.size+b.size+10+.001;
    const cosine=(a.radius*a.radius+b.radius*b.radius-clearance*clearance)/(2*a.radius*b.radius);
    const minimum=Math.acos(Math.max(-1,Math.min(1,cosine)));
    return Math.max(minimum,(item.angle-previous.angle)*factor);
  });
  let angle=middle-gaps.reduce((sum,gap)=>sum+gap,0)/2;
  ordered.forEach(({node},i)=> { if(i) angle+=gaps[i-1]; result[node.id]=angle-node.angle; });
  return result;
}

/** Compact, evenly spaced siblings centered on a parent's radial direction. */
export function balanceSiblings(nodes: RingNode[], offsets: Record<string,number>, ids: Set<string>, parentAngle?: number) {
  const group=nodes.filter(n=>ids.has(n.id));
  const {start,middle}=siblingArc(group.map(n=>n.angle+(offsets[n.id] ?? 0)));
  const tau=Math.PI*2, result={...offsets};
  const ordered=[...group].sort((a,b)=> ((a.angle+(offsets[a.id] ?? 0)-start)%tau+tau)%tau-((b.angle+(offsets[b.id] ?? 0)-start)%tau+tau)%tau);
  let step=0;
  for(let i=1;i<ordered.length;i++) {
    const a=ordered[i-1], b=ordered[i], clearance=a.size+b.size+10+.001;
    step=Math.max(step,Math.acos(Math.max(-1,Math.min(1,(a.radius*a.radius+b.radius*b.radius-clearance*clearance)/(2*a.radius*b.radius)))));
  }
  const center=parentAngle === undefined ? middle : middle+Math.atan2(Math.sin(parentAngle-middle),Math.cos(parentAngle-middle));
  ordered.forEach((n,i)=> { result[n.id]=center+(i-(ordered.length-1)/2)*step-n.angle; });
  return result;
}
