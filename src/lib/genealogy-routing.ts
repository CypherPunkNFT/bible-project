import type { familyBranch, FamilyCluster } from "./genealogy";
import { usesTreeMarkers } from "./genealogy-tree-alignment";

type Branch = ReturnType<typeof familyBranch>;
export type Point = [number, number];
export interface FamilyRoute { key: string; kind: string; points: Point[]; ids: string[]; title: string; family: string; source: string; smoothPath?: string; corners?: Corner[] }
type Corner = { x: number; y: number; width: number; height: number };
type Segment = { a: Point; b: Point; family: string; source: string };
/** One straight stem per exact sibling group, with shared co-parent joins. */
export function routeSiblingGroups(branch:Branch) {
  const nodes=new Map(branch.positions.map(n=>[n.person.id,n]));
  const parents=new Map<string,string[]>();
  for(const edge of branch.edges) if(edge.kind==="parent" && nodes.has(edge.from) && nodes.has(edge.to)) {
    const ids=parents.get(edge.to) ?? [];if(!ids.includes(edge.from)) ids.push(edge.from);parents.set(edge.to,ids);
  }
  const groups=new Map<string,typeof branch.positions>();
  for(const child of branch.positions) {
    const ids=parents.get(child.person.id);if(!ids?.length) continue;
    const key=JSON.stringify([ids.sort(),child.generation,child.y]);
    groups.set(key,[...(groups.get(key) ?? []),child]);
  }
  const routes:FamilyRoute[]=[],unresolved:FamilyRoute[]=[];
  const clip=(a:Point,b:Point):Point=>{const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);return distance ? [a[0]+(b[0]-a[0])*52/distance,a[1]+(b[1]-a[1])*52/distance] : a;};
  for(const [family,children] of groups) {
    const parentNodes=parents.get(children[0].person.id)!.map(id=>nodes.get(id)!).sort((a,b)=>b.generation-a.generation || Number(b.person.s==="M")-Number(a.person.s==="M"));
    const primary=parentNodes[0],ids=[...parentNodes.map(n=>n.person.id),...children.map(n=>n.person.id)];
    const source:Point=[primary.x+76,primary.y+52];
    const left=Math.min(...children.map(n=>n.x+76)),right=Math.max(...children.map(n=>n.x+76)),y=children[0].y+52;
    const destination:Point=[Math.max(left,Math.min(right,source[0])),y];
    const end=children.length===1 ? clip(destination,source) : destination;
    const start=clip(source,end),join:Point=[(start[0]+end[0])/2,(start[1]+end[1])/2];
    const title=`${parentNodes.map(n=>n.person.n).join(" and ")}: recorded children ${children.map(n=>n.person.n).join(", ")}`;
    const add=(key:string,kind:string,points:Point[])=>routes.push({key:`${family}:${key}`,kind,points,ids,title,family,source:primary.person.id});
    if(children.length>1) add("siblings","sibling-band",[[left,y],[right,y]]);
    add("stem","parent",[start,end]);
    for(const parent of parentNodes.slice(1)) {
      const center:Point=[parent.x+76,parent.y+52];
      if(usesTreeMarkers(parent.person.id,primary.person.id)) unresolved.push({key:`${family}:cross-family`,kind:"parent-join",points:[[primary.x+76,primary.y+112],[parent.x+76,parent.y+112]],ids,title,family,source:primary.person.id});
      else add(parent.person.id,"parent-join",[clip(center,join),join]);
    }
  }
  // Optional spouse/sibling links remain direct and do not multiply parent stems.
  for(const edge of branch.edges) if(edge.kind!=="parent") {
    if(edge.kind==="spouse" && usesTreeMarkers(edge.from,edge.to) && unresolved.some(r=>r.ids.includes(edge.from) && r.ids.includes(edge.to))) continue;
    const a=nodes.get(edge.from),b=nodes.get(edge.to);if(!a || !b) continue;
    const start:Point=[a.x+76,a.y+52],end:Point=[b.x+76,b.y+52];
    routes.push({key:`${edge.kind}:${edge.from}:${edge.to}`,kind:edge.kind,points:[clip(start,end),clip(end,start)],ids:[edge.from,edge.to],title:`${a.person.n}: ${edge.kind} of ${b.person.n}`,family:"pair",source:edge.from});
  }
  return {routes,unresolved};
}
const same = (a: number, b: number) => Math.abs(a - b) < .01;
export function segmentsCross(a: Point, b: Point, c: Point, d: Point) {
  if (Math.max(a[0], b[0]) < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) < Math.min(a[0], b[0]) || Math.max(a[1], b[1]) < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) < Math.min(a[1], b[1])) return false;
  const cross = (p: Point, q: Point, r: Point) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
  if ([abC, abD, cdA, cdB].every(v => Math.abs(v) < .001)) {
    const axis = Math.abs(a[0] - b[0]) > Math.abs(a[1] - b[1]) ? 0 : 1;
    return Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis])) < Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis])) - .001;
  }
  return abC * abD <= 0 && cdA * cdB <= 0;
}
export function entersBox(a: Point, b: Point, box: Pick<FamilyCluster, "x" | "y" | "width" | "height">) {
  let low = 0, high = 1;
  for (const axis of [0, 1]) {
    const min = (axis ? box.y : box.x) + .001, max = min + (axis ? box.height : box.width) - .002;
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < .00001) { if (a[axis] <= min || a[axis] >= max) return false; }
    else { const t1 = (min - a[axis]) / delta, t2 = (max - a[axis]) / delta; low = Math.max(low, Math.min(t1, t2)); high = Math.min(high, Math.max(t1, t2)); }
  }
  return low < high;
}
const simplify = (points: Point[]) => points.filter((p, i) => !i || i === points.length - 1 || !((same(points[i - 1][0], p[0]) && same(p[0], points[i + 1][0])) || (same(points[i - 1][1], p[1]) && same(p[1], points[i + 1][1]))));

/** Orthogonal routing treats unrelated family boxes and existing wires as obstacles. */
export function routeFamilies(branch: Branch) {
  const nodes = new Map(branch.positions.map(p => [p.person.id, p]));
  const families = new Map(branch.clusters.flatMap(c => c.members.map(id => [id, c] as const)));
  const routes: FamilyRoute[] = [], pending: FamilyRoute[] = [], reserved: Segment[] = [];
  const add = (route: FamilyRoute) => {
    routes.push(route);
    for (let i = 1; i < route.points.length; i++) reserved.push({ a: route.points[i - 1], b: route.points[i], family: route.family, source: route.source });
  };
  for (const edge of branch.edges) {
    const a = nodes.get(edge.from)!, b = nodes.get(edge.to)!;
    const forward = edge.kind === "parent" && a.generation < b.generation;
    pending.push({ key: `${edge.kind}:${edge.from}:${edge.to}`, kind: edge.kind, family: edge.kind === "parent" ? families.get(edge.to)!.id : `pair:${edge.from}:${edge.to}`, source: edge.from,
      ids: [edge.from, edge.to], title: `${a.person.n}: recorded ${edge.kind} connection with ${b.person.n}`,
      points: [[a.x + 76, a.y + 104], [a.x + 76, families.get(edge.from)!.y + 168],
        [b.x + 76, forward ? families.get(edge.to)!.y - 32 : families.get(edge.to)!.y + 168], [b.x + 76, forward ? b.y : b.y + 104]] });
  }
  // Reserve every endpoint escape before routing: an early wire must not block
  // another person's only way out of their family box.
  for (const route of pending) {
    reserved.push({ a: route.points[0], b: route.points[1], family: route.family, source: route.source });
    if (route.points.length === 4) reserved.push({ a: route.points[2], b: route.points[3], family: route.family, source: route.ids[1] });
  }
  const xs = [...new Set([230, branch.width + 80, ...branch.clusters.flatMap(c => [c.x - 24, c.x + c.width + 24]), ...pending.flatMap(r => r.points.map(p => p[0]))])].sort((a, b) => a - b);
  const ys = [...new Set([0, branch.height + 80, ...branch.clusters.flatMap(c => [c.y - 56, c.y - 32, c.y + c.height + 32, c.y + c.height + 56]), ...pending.flatMap(r => r.points.map(p => p[1]))])].sort((a, b) => a - b);
  const xIndex = new Map(xs.map((x, i) => [x, i])), yIndex = new Map(ys.map((y, i) => [y, i]));
  const blockedBoxes = new Map<string, boolean>();
  const unresolved: FamilyRoute[] = [];
  const primary = new Map(branch.clusters.map(c => [c.id, c.parents.map(id => nodes.get(id))
    .filter(n => n && n.generation < c.generation).sort((a, b) => b!.generation - a!.generation || Number(b!.person.s === "M") - Number(a!.person.s === "M") || a!.x - b!.x)[0]?.person.id]));
  const priority = (r: FamilyRoute) => r.kind !== "parent" ? 2 : primary.get(r.family) === r.source ? 0 : 1;
  pending.sort((a, b) => priority(a) - priority(b) || a.points[1][1] - b.points[1][1]);
  for (const route of pending) {
    // Each curve joins two actual people; there are no synthetic family junctions.
    const a = route.points[0], b = route.points[3];
    let direct = false;
    if (route.kind === "parent" && b[1] > a[1]) for (const tension of [.5, .3, .7]) {
      const dy = b[1] - a[1], c: Point = [a[0], a[1] + dy * tension], d: Point = [b[0], b[1] - dy * tension];
      const samples: Point[] = Array.from({ length: 97 }, (_, i) => {
        const t = i / 96, u = 1 - t;
        return [u*u*u*a[0] + 3*u*u*t*c[0] + 3*u*t*t*d[0] + t*t*t*b[0], u*u*u*a[1] + 3*u*u*t*c[1] + 3*u*t*t*d[1] + t*t*t*b[1]];
      });
      const blocked = samples.some((end, i) => i > 0 && (
        branch.clusters.some(box => box.id !== route.family && !box.members.includes(route.source) && entersBox(samples[i-1], end, box)) ||
        reserved.some(s => s.family !== route.family && s.source !== route.source && segmentsCross(samples[i-1], end, s.a, s.b))));
      if (!blocked) { add({ ...route, points: samples, smoothPath: `M${a.join(",")} C${c.join(",")} ${d.join(",")} ${b.join(",")}` }); direct = true; break; }
    }
    if (direct) continue;
    if (route.kind === "parent") { unresolved.push(route); continue; }
    const blockedWires = new Map<string, boolean>();
    const obstacles = reserved.filter(s => s.family !== route.family && s.source !== route.source && !(route.kind !== "parent" && route.ids.includes(s.source)));
    const start = route.points[1], end = route.points[2];
    const startIndex = yIndex.get(start[1])! * xs.length + xIndex.get(start[0])!;
    const endIndex = yIndex.get(end[1])! * xs.length + xIndex.get(end[0])!;
    const queue: { id: number; score: number }[] = [];
    const push = (id: number, score: number) => {
      let i = queue.length; queue.push({ id, score });
      while (i) { const parent = (i - 1) >> 1; if (queue[parent].score <= score) break; queue[i] = queue[parent]; i = parent; } queue[i] = { id, score };
    };
    const pop = () => {
      const first = queue[0], last = queue.pop()!;
      if (queue.length) { let i = 0; while (i * 2 + 1 < queue.length) { let child = i * 2 + 1; if (child + 1 < queue.length && queue[child + 1].score < queue[child].score) child++; if (queue[child].score >= last.score) break; queue[i] = queue[child]; i = child; } queue[i] = last; }
      return first.id;
    };
    const point = (id: number): Point => [xs[id % xs.length], ys[Math.floor(id / xs.length)]];
    const startState = startIndex * 3 + 2;
    let endState: number | undefined;
    const cost = new Map<number, number>([[startState, 0]]), previous = new Map<number, number>(), done = new Set<number>();
    push(startState, 0);
    while (queue.length) {
      const state = pop(); if (done.has(state)) continue;
      const id = Math.floor(state / 3), direction = state % 3;
      if (id === endIndex) { endState = state; break; } done.add(state);
      const x = id % xs.length, y = Math.floor(id / xs.length), a = point(id);
      const neighbors = [x ? id - 1 : -1, x + 1 < xs.length ? id + 1 : -1, y ? id - xs.length : -1, y + 1 < ys.length ? id + xs.length : -1];
      for (const next of neighbors) {
        if (next < 0) continue;
        const nextDirection = Math.abs(next - id) === 1 ? 1 : 2, nextState = next * 3 + nextDirection;
        if (done.has(nextState)) continue;
        const b = point(next), key = `${Math.min(id, next)}:${Math.max(id, next)}`;
        if (!blockedBoxes.has(key)) blockedBoxes.set(key, branch.clusters.some(box => entersBox(a, b, box)));
        if (blockedBoxes.get(key)) continue;
        if (!blockedWires.has(key)) blockedWires.set(key, obstacles.some(s => segmentsCross(a, b, s.a, s.b)));
        if (blockedWires.get(key)) continue;
        const distance = cost.get(state)! + Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + (direction === nextDirection ? 0 : 180);
        if (distance >= (cost.get(nextState) ?? Infinity)) continue;
        cost.set(nextState, distance); previous.set(nextState, state);
        push(nextState, distance + Math.abs(b[0] - end[0]) + Math.abs(b[1] - end[1]));
      }
    }
    if (endState === undefined) { unresolved.push(route); continue; }
    const middle: Point[] = []; let state = endState;
    while (state !== startState) { middle.push(point(Math.floor(state / 3))); state = previous.get(state)!; } middle.push(start); middle.reverse();
    add({ ...route, points: simplify([route.points[0], ...middle, ...(route.points.length === 4 ? [route.points[3]] : [])]) });
  }
  roundRoutes(routes, branch.clusters);
  return { routes, unresolved };
}

export const routePath = (route: FamilyRoute) => route.smoothPath ?? route.points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");


const related = (a: FamilyRoute, b: FamilyRoute) => a.family === b.family || a.source === b.source || (a.kind !== "parent" && a.ids.includes(b.source)) || (b.kind !== "parent" && b.ids.includes(a.source));
export const boxesOverlap = (a: Corner, b: Corner) => a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
export const segmentTouchesBox = (a: Point, b: Point, box: Corner) => boxesOverlap({ x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), width: Math.abs(a[0] - b[0]), height: Math.abs(a[1] - b[1]) }, box);

/** Round only inside clear envelopes. Every quadratic stays inside its envelope,
 * which avoids both original wires and all previously rounded envelopes. */
function roundRoutes(routes: FamilyRoute[], clusters: FamilyCluster[]) {
  for (const route of routes) {
    if (route.smoothPath) continue;
    route.corners = [];
    const points = route.points;
    const commands = [`M${points[0].join(",")}`];
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i - 1], p = points[i], b = points[i + 1];
      const before = Math.hypot(p[0] - a[0], p[1] - a[1]), after = Math.hypot(b[0] - p[0], b[1] - p[1]);
      let radius = Math.min(140, before / 2, after / 2);
      let rounded = false;
      while (radius >= 2) {
        const enter: Point = [p[0] + (a[0] - p[0]) * radius / before, p[1] + (a[1] - p[1]) * radius / before];
        const leave: Point = [p[0] + (b[0] - p[0]) * radius / after, p[1] + (b[1] - p[1]) * radius / after];
        const box = { x: Math.min(enter[0], p[0], leave[0]), y: Math.min(enter[1], p[1], leave[1]), width: Math.abs(enter[0] - leave[0]), height: Math.abs(enter[1] - leave[1]) };
        const blocked = clusters.some(c => boxesOverlap(box, c)) || routes.some(other => !related(route, other) && (other.points.some((end, j) => j > 0 && segmentTouchesBox(other.points[j - 1], end, box)) || other.corners?.some(c => boxesOverlap(box, c))));
        if (!blocked) {
          commands.push(`L${enter.join(",")} Q${p.join(",")} ${leave.join(",")}`);
          route.corners.push(box); rounded = true; break;
        }
        radius /= 2;
      }
      if (!rounded) commands.push(`L${p.join(",")}`);
    }
    commands.push(`L${points[points.length - 1].join(",")}`);
    route.smoothPath = commands.join(" ");
  }
}
