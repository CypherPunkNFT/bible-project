const tau = Math.PI * 2;
/** Use the nearer mother's stem when a paternal stem would skip her generation. */
export function shouldUseMaternalStem(father:{generation:number;sex?:string},mother:{generation:number;sex?:string},childGeneration:number) {
  return father.sex==="M" && mother.sex==="F" && father.generation<mother.generation && mother.generation<childGeneration;
}
/** The union is fixed halfway across the clear radial gap between generation bands. */
export function joinedParentPaths(father:{x:number;y:number;size:number},mother:{x:number;y:number;size:number},target:{x:number;y:number},gap:{parentEdge:number;childEdge:number}) {
  const length=Math.max(.001,Math.hypot(target.x-father.x,target.y-father.y));
  const ux=(target.x-father.x)/length,uy=(target.y-father.y)/length;
  const start={x:father.x+ux*father.size,y:father.y+uy*father.size};
  const joinRadius=(gap.parentEdge+gap.childEdge)/2;
  // Intersect the straight father stem with the middle-of-gap circle.
  const projection=father.x*ux+father.y*uy;
  const discriminant=Math.max(0,projection*projection-(father.x*father.x+father.y*father.y-joinRadius*joinRadius));
  const candidates=[-projection+Math.sqrt(discriminant),-projection-Math.sqrt(discriminant)];
  const distance=candidates.find(t=>t>=0 && t<=length) ?? Math.max(0,Math.min(length,candidates[0]));
  const join={x:father.x+ux*distance,y:father.y+uy*distance};
  const along=(join.x-mother.x)*ux+(join.y-mother.y)*uy;
  const corner={x:mother.x+ux*along,y:mother.y+uy*along};
  const points=[{x:mother.x,y:mother.y},corner,join];
  return {union:points.map((p,i)=>`${i ? "L" : "M"}${p.x},${p.y}`).join(" "),
    stem:`M${start.x},${start.y} L${target.x},${target.y}`,points,join,start};
}
export const polarPoint = (radius: number, angle: number) => [Math.cos(angle)*radius, Math.sin(angle)*radius] as const;
/** Polar interpolation keeps the entire route in its radial corridor. */
export function ringRoute(fromRadius: number, fromAngle: number, toRadius: number, toAngle: number) {
  const delta = Math.atan2(Math.sin(toAngle-fromAngle), Math.cos(toAngle-fromAngle));
  const steps = Math.max(24, Math.ceil(Math.abs(delta)*90));
  const points = Array.from({length:steps+1}, (_,i) => {
    const t=i/steps, ease=t*t*(3-2*t);
    return polarPoint(fromRadius+(toRadius-fromRadius)*t, fromAngle+delta*ease);
  });
  return { points, path: points.map((p,i)=>`${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ") };
}
export function ringArc(radius: number, start: number, end: number) {
  const a=polarPoint(radius,start), b=polarPoint(radius,end), span=end-start;
  return `M${a[0]},${a[1]} A${radius},${radius} 0 ${span > Math.PI ? 1 : 0} 1 ${b[0]},${b[1]}`;
}
/** Leave a break wherever an unrelated person lies between siblings. */
function siblingBandArcs(members: string[], ring: { id: string; angle: number }[]) {
  if (members.length < 2) return [];
  const ids=new Set(members), ordered=[...ring].sort((a,b)=> ((a.angle%tau+tau)%tau)-((b.angle%tau+tau)%tau));
  return ordered.flatMap((a,i)=> {
    const b=ordered[(i+1)%ordered.length];
    if (!ids.has(a.id) || !ids.has(b.id)) return [];
    const start=(a.angle%tau+tau)%tau, end=(b.angle%tau+tau)%tau+(i===ordered.length-1 ? tau : 0);
    // Never connect across the empty back of a sparse family.
    if (end-start > Math.PI) return [];
    return [{ start, end }];
  });
}
export function siblingBands(members: string[], ring: { id: string; angle: number }[], radius: number) {
  return siblingBandArcs(members,ring).map(({start,end})=>ringArc(radius,start,end));
}

/** Attach between people on an actual band, never to its middle person's circle. */
export function familyBandAnchor(members: string[], ring: { id: string; angle: number }[], preferredAngle: number, radius?:number,personRadius=27) {
  const distance=(angle:number)=>Math.abs(Math.atan2(Math.sin(angle-preferredAngle),Math.cos(angle-preferredAngle)));
  const candidates=siblingBandArcs(members,ring).map(({start,end})=> {
    if(!radius) return (start+end)/2;
    // Any clear point on the band is valid. Do not force a slant by always
    // choosing the midpoint between two siblings when a radial landing is clear.
    const clearance=Math.asin(Math.min(1,(personRadius+3)/radius));
    const low=start+clearance,high=end-clearance;
    if(low>high) return (start+end)/2;
    const preferred=(start+end)/2+Math.atan2(Math.sin(preferredAngle-(start+end)/2),Math.cos(preferredAngle-(start+end)/2));
    return Math.max(low,Math.min(high,preferred));
  });
  if(!candidates.length) candidates.push(...ring.filter(n=>members.includes(n.id)).map(n=>n.angle));
  return candidates.sort((a,b)=>distance(a)-distance(b))[0] ?? preferredAngle;
}

/** Same-generation parents approach the band through the inner corridor. */
export function familyBandRoute(fromRadius:number,fromAngle:number,toRadius:number,toAngle:number,sameGeneration:boolean) {
  if(!sameGeneration) return ringRoute(fromRadius,fromAngle,toRadius,toAngle);
  const delta=Math.atan2(Math.sin(toAngle-fromAngle),Math.cos(toAngle-fromAngle));
  const radius=Math.min(fromRadius,toRadius);
  const detour=Math.min(radius*.35,Math.max(90,Math.abs(delta)*radius*.12));
  const steps=Math.max(32,Math.ceil(Math.abs(delta)*90));
  const points=Array.from({length:steps+1},(_,i)=> {
    const t=i/steps,ease=t*t*(3-2*t);
    return polarPoint(fromRadius+(toRadius-fromRadius)*t-detour*Math.sin(Math.PI*t),fromAngle+delta*ease);
  });
  return {points,path:points.map((p,i)=>`${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ")};
}

/** Edge children peel away early; central children follow the trunk longer. */
export function staggeredBranches(startRadius: number, startAngle: number, endRadius: number, middleAngle: number, childAngles: number[]) {
  const deviations = childAngles.map(angle => Math.abs(Math.atan2(Math.sin(angle-middleAngle), Math.cos(angle-middleAngle))));
  const spread = Math.max(...deviations, 0);
  const trunkEnd = .82;
  const fractions = deviations.map(deviation => trunkEnd-.47*(spread > 1e-9 ? deviation/spread : 0));
  const lastSplit = Math.max(...fractions, 0);
  const turn = Math.atan2(Math.sin(middleAngle-startAngle), Math.cos(middleAngle-startAngle));
  return {
    trunk: Array.from({length:97}, (_,i) => {
      const fraction=lastSplit*i/96, t=fraction/trunkEnd, ease=t*t*(3-2*t);
      const [x,y]=polarPoint(startRadius+(endRadius-startRadius)*fraction,startAngle+turn*ease);
      return `${i ? "L" : "M"}${x},${y}`;
    }).join(" "),
    branches: childAngles.map((angle,i) => {
      const fraction = fractions[i];
      const t = fraction/trunkEnd, ease = t*t*(3-2*t);
      const radius = startRadius+(endRadius-startRadius)*fraction;
      const splitAngle = startAngle+turn*ease;
      return { fraction, path: ringRoute(radius,splitAngle,endRadius,angle).path };
    }),
  };
}
