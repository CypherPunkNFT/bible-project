import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { Link } from "react-router-dom";
import { familyBranch, familyEdges, type FamilyPerson } from "@/lib/genealogy";
import { lockedPeople, ringOverlap, rotatePeople, siblingArc, tightenSiblings, balanceSiblings, type MoveScope } from "@/lib/circular-genealogy-edit";
import { compareArrangement, type StudyNode } from "@/lib/circular-layout-study";
import { staggeredBranches, siblingBands, ringArc } from "@/lib/circular-genealogy-paths";
import { useAsync } from "@/lib/useAsync";
import "./circular-genealogy.css";

const starts = [["Abraham", "abraham-gen-11-26"], ["Jacob", "israel-gen-25-26"], ["Adam", "adam-gen-2-19"], ["David", "david-rut-4-17"], ["Jesus", "jesus-isa-7-14"]];
const curveCenter = 36000;
const curveStart = Math.PI/2-.21, curveEnd = Math.PI/2+.21;
const colors = ["#e3b65c", "#8ec8ad", "#81adc9", "#b29bcf", "#ce909f", "#cca678"];
const load = async (): Promise<FamilyPerson[]> => {
  const response = await fetch("/content/study/genealogy.json");
  if (!response.ok) throw new Error("Family records unavailable");
  return (await response.json()).people.filter((p: FamilyPerson) => p.s !== "G").map((p: FamilyPerson) => ({ ...p, n: p.id === "israel-gen-25-26" ? "Jacob / Israel" : p.n.replace(/_/g, " ") }));
};
export default function CurvedGenealogyPage() {
  const result = useAsync(load, "circular-genealogy");
  return <main className="circle-mock">{result.status === "ready" ? <Graph people={result.value} /> : <p role="status">{result.status === "error" ? "Family records unavailable. Reload to try again." : "Opening the family circles..."}</p>}</main>;
}
type Baseline = { algorithm: string; capturedAt: string; nodes: StudyNode[]; edges: ReturnType<typeof familyEdges> };
type StudyEvent = { at: string; view: string; action: string; selected: string; scope: MoveScope; affected: string[]; before: Arrangement; after: Arrangement; accepted: boolean };
type StudyLog = { baselines: Record<string, Baseline>; events: StudyEvent[]; notes: string; discardedEvents: number };
const studyStorageKey = "bible-curved-layout-study-v1";
function readStudy(): StudyLog {
  try { const value = JSON.parse(localStorage.getItem(studyStorageKey) ?? "null"); if (value && Array.isArray(value.events) && value.baselines && typeof value.notes === "string") return value; } catch { /* Start a fresh capture if storage is unreadable. */ }
  return { baselines: {}, events: [], notes: "", discardedEvents: 0 };
}
type Arrangement = { offsets: Record<string, number>; scale: number; ringScales?: Record<number, number>; ringWidths?: Record<number, number>; ringTracks?: Record<number, number>; personTracks?: Record<string, number> };
const storageKey = "bible-curved-arrangements-v1";
function readArrangements(): Record<string, Arrangement> {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => {
      const v = value as Arrangement;
      return v && Number.isFinite(v.scale) && v.scale >= 1 && v.scale <= 6 && (!v.ringScales || Object.values(v.ringScales).every(n => Number.isFinite(n) && n >= 1 && n <= 6)) && (!v.ringWidths || Object.values(v.ringWidths).every(n => Number.isFinite(n) && n >= 80 && n <= 600)) && (!v.ringTracks || Object.values(v.ringTracks).every(n => Number.isInteger(n) && n >= 1 && n <= 6)) && (!v.personTracks || Object.values(v.personTracks).every(n => Number.isInteger(n) && n >= 0 && n < 6)) && v.offsets && Object.values(v.offsets).every(n => typeof n === "number" && Number.isFinite(n));
    })) as Record<string, Arrangement>;
  } catch { return {}; }
}
function Graph({ people }: { people: FamilyPerson[] }) {
  const [root, setRoot] = useState(starts[0][1]);
  const [depth, setDepth] = useState(4);
  const [direction, setDirection] = useState<"ancestors" | "descendants">("descendants");
  const [selected, setSelected] = useState(root);
  const [siblingParent, setSiblingParent] = useState<string | null>(null);
  const [pinnedPerson, setPinnedPerson] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [ring, setRing] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [spacingTarget, setSpacingTarget] = useState<"siblings" | "children">("siblings");
  const [scope, setScope] = useState<MoveScope>("person");
  const [arrangements, setArrangements] = useState(readArrangements);
  const [study, setStudy] = useState<StudyLog>(readStudy);
  const [previewTracks, setPreviewTracks] = useState<Record<string,number> | null>(null);
  const [preview, setPreview] = useState<Record<string, number> | null>(null);
  const [notice, setNotice] = useState("Drag a person around their ring. Their locked relatives follow.");
  const history = useRef<{ key: string; value: Arrangement }[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const viewKey = `${root}:${direction}:${depth}`;
  const arrangement = arrangements[viewKey] ?? { offsets: {}, scale: 3 };
  const drag = useRef<{ pointer: number; x: number; y: number; start: number; ids: Set<string>; base: Arrangement; key: string; candidate: Record<string, number>; person: string; trackIds: Set<string>; candidateTracks: Record<string,number>; invalid: boolean; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const svg = useRef<SVGSVGElement>(null), layer = useRef<SVGGElement>(null);
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown>>();
  const fit = useRef(() => {});
  const edges = useMemo(() => familyEdges(people), [people]);
  const branch = useMemo(() => familyBranch(people, edges, root, depth, direction, false, false, 180), [people, edges, root, depth, direction]);
  const baseRadial = useMemo(() => {
    const groups = Array.from({ length: depth + 1 }, (_, g) => branch.positions.filter(n => Math.abs(n.generation) === g).sort((a, b) => a.x - b.x));
    const radii = [0];
    for (let g = 1; g <= depth; g++) radii[g] = Math.max(radii[g - 1] + 240, groups[g].length * 82 / (Math.PI * 1.85));
    // Retain family ordering from the shared layout. Angular projection uses the
    // same horizontal domain at every depth, keeping branches in their sectors.
    const min = Math.min(...branch.positions.map(n => n.x)), max = Math.max(...branch.positions.map(n => n.x));
    const tracks = new Map<string, number>();
    for (let g=1; g<=depth; g++) {
      const count=arrangement.ringTracks?.[g] ?? 6, families=new Map<string,number>();
      for (const n of groups[g]) {
        const parent=branch.edges.find(e=>e.kind==="parent" && e.to===n.person.id)?.from ?? n.person.id;
        if (!families.has(parent)) families.set(parent,families.size%count);
        tracks.set(n.person.id,families.get(parent)!);
      }
    }
    const nodes = branch.positions.map(n => {
      const generation = Math.abs(n.generation), radius = radii[generation];
      const angle = generation===0 ? Math.PI/2 : Math.PI/2+((n.x-min+80)/(max-min+160)-.5)*.3866666667;
      return { ...n, generation, angle, radius, trackIndex: tracks.get(n.person.id) ?? 0, trackOffset: 0, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
    // Enforce room for names on each ring while preserving angular order.
    for (let g = 1; g <= depth; g++) {
      const row = nodes.filter(n => n.generation === g).sort((a, b) => a.angle - b.angle);
      const step = 76 / (curveCenter+radii[g]*3);
      for (let i = 1; i < row.length; i++) row[i].angle = Math.max(row[i].angle, row[i-1].angle + step);
      if (row.length) {
        const excess = Math.max(0, row[row.length-1].angle - curveEnd);
        row.forEach(n => { n.angle -= excess / 2; n.x = Math.cos(n.angle) * n.radius; n.y = Math.sin(n.angle) * n.radius; });
      }
    }
    return { nodes, radii, extent: radii[depth] + 95 };
  }, [branch, depth, arrangement.ringTracks]);
  const widthOf = (g: number, value=arrangement) => value.ringWidths?.[g] ?? 600;
  const tracksOf = (g: number, value=arrangement) => value.ringTracks?.[g] ?? 6;
  const trackOffsetOf = (g:number,index:number,value=arrangement) => {
    const count=tracksOf(g,value);
    return count===1 ? 0 : (index/(count-1)-.5)*(widthOf(g,value)-64);
  };
  const radiusOf = (n: typeof baseRadial.nodes[number],value=arrangement) => curveCenter+n.radius*(value.ringScales?.[n.generation] ?? value.scale)+trackOffsetOf(n.generation,Math.min(tracksOf(n.generation,value)-1,value.personTracks?.[n.person.id] ?? n.trackIndex),value);
  const editNodes = baseRadial.nodes.map(n => ({ id: n.person.id, angle: n.angle, radius: radiusOf(n), size: n.generation ? 27 : 40 }));
  const offsets = preview ?? arrangement.offsets;
  const radial = { radii: baseRadial.radii.map((r, g) => curveCenter+r * (arrangement.ringScales?.[g] ?? arrangement.scale)), extent: Math.max(...baseRadial.radii.map((r, g) => curveCenter+r * (arrangement.ringScales?.[g] ?? arrangement.scale))) + 200,
    nodes: baseRadial.nodes.map(n => { const angle = n.angle + (offsets[n.person.id] ?? 0), value={...arrangement,personTracks:previewTracks ?? arrangement.personTracks}, radius = radiusOf(n,value); return { ...n, trackOffset:radius-curveCenter-n.radius*(arrangement.ringScales?.[n.generation] ?? arrangement.scale), angle, radius, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; }) };
  const locked = lockedPeople(selected, scope, branch.edges, new Set(editNodes.map(n => n.id)));
  const baseline: Baseline = { algorithm: "curved-family-tracks-v1", capturedAt: new Date().toISOString(), nodes: baseRadial.nodes.map(n => ({ id: n.person.id, name: n.person.n, generation: n.generation, angle: n.angle, radius: radiusOf(n)/(arrangement.ringScales?.[n.generation] ?? arrangement.scale), size: n.generation ? 27 : 40 })), edges: branch.edges };
  const record = (action: string, before: Arrangement, after: Arrangement, affected: string[], accepted = true, key = viewKey) => {
    setStudy(previous => ({ ...previous, baselines: { ...previous.baselines, [viewKey]: previous.baselines[viewKey] ?? baseline },
      events: [...previous.events, { at: new Date().toISOString(), view: key, action, selected, scope, affected, before, after, accepted }].slice(-200),
      discardedEvents: (previous.discardedEvents ?? 0) + (previous.events.length >= 200 ? 1 : 0) }));
  };
  useEffect(() => { try { localStorage.setItem(studyStorageKey, JSON.stringify(study)); } catch { setNotice("Edit history could not save. Export layout study to keep a copy."); } }, [study]);
  const exportStudy = () => {
    const baselines = { ...study.baselines, [viewKey]: study.baselines[viewKey] ?? baseline };
    const saved = { ...arrangements, [viewKey]: arrangement };
    const report = { format: "bible-circular-layout-study", schemaVersion: 1, exportedAt: new Date().toISOString(), activeView: viewKey, notes: study.notes,
      history: { events: study.events, discardedEvents: study.discardedEvents, note: "Events begin when recording was installed; earlier moves cannot be reconstructed. Last 200 events retained." },
      views: Object.entries(baselines).map(([key, original]) => ({ key, baseline: original, arrangement: saved[key] ?? { offsets: {}, scale: 3 }, comparison: compareArrangement(original.nodes, original.edges, saved[key] ?? { offsets: {}, scale: 3 }) })),
      savedArrangements: saved, limitations: ["Metrics describe geometry, not the reason for a preference.", "No automatic rule learning or rollout. Compare examples and validate candidate rules on other trees.", "Source relationships are unchanged; this export contains presentation edits only."] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `genealogy-layout-study-${new Date().toISOString().replace(/[:.]/g, "-")}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000); setNotice("Layout study exported: original, edited, move history and notes.");
  };
  const commit = (value: Arrangement, action = "edit", affected = [...locked]) => {
    record(action, arrangement, value, affected);
    history.current.push({ key: viewKey, value: arrangement }); setUndoCount(history.current.length);
    setArrangements(all => ({ ...all, [viewKey]: value }));
  };
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(arrangements)); } catch { setNotice("Browser storage unavailable. Keep this tab open to retain your arrangement."); } }, [arrangements]);
  const resizeRings = (scale: number) => {
    if (ring === null || ring > depth) return;
    const next = { ...arrangement, ringScales: { ...arrangement.ringScales, [ring]: scale } };
    const radii = baseRadial.radii.map((r, g) => r * (next.ringScales[g] ?? next.scale));
    const affected = baseRadial.nodes.filter(n => n.generation === ring).map(n => n.person.id);
    const candidateNodes = baseRadial.nodes.map(n => ({ id: n.person.id, angle: n.angle, radius: radiusOf(n,next), size: n.generation ? 27 : 40 }));
    if (radii.some((r, g) => g > 0 && r - radii[g - 1] < 90) || ringOverlap(candidateNodes, arrangement.offsets, 1)) {
      record("blocked-ring-resize", arrangement, next, affected, false);
      setNotice("That size would crowd another ring or overlap people. Adjust the neighboring ring first."); return;
    }
    commit(next, `resize-ring-${ring}`, affected); setNotice(`Generation ${ring} resized. Other rings stay in place.`);
  };
  const changeRingGeometry = (width:number,count:number) => {
    if(ring===null) return;
    const next={...arrangement,ringWidths:{...arrangement.ringWidths,[ring]:width},ringTracks:{...arrangement.ringTracks,[ring]:count}};
    const families=new Map<string,number>();
    const assigned=new Map<string,number>();
    for(const n of baseRadial.nodes.filter(n=>n.generation===ring).sort((a,b)=>a.angle-b.angle)) {
      const parent=branch.edges.find(e=>e.kind==="parent" && e.to===n.person.id)?.from ?? n.person.id;
      if(!families.has(parent)) families.set(parent,families.size%count);
      assigned.set(n.person.id,families.get(parent)!);
    }
    const candidates=baseRadial.nodes.map(n=>({id:n.person.id,angle:n.angle,radius:radiusOf({...n,trackIndex:assigned.get(n.person.id) ?? n.trackIndex},next),size:n.generation ? 27 : 40}));
    if(ringOverlap(candidates,arrangement.offsets,1,new Set(assigned.keys()))) { setNotice("That width or track count would overlap people. Original geometry kept."); return; }
    commit(next,"ring-tracks-width",[...assigned.keys()]);
    setNotice("Tracks evenly distributed across the ring width.");
  };
  const turn = (delta: number) => {
    const candidate = rotatePeople(arrangement.offsets, locked, delta);
    if (ringOverlap(editNodes, candidate, 1, locked)) { record("blocked-rotation", arrangement, { ...arrangement, offsets: candidate }, [...locked], false); setNotice("Move blocked: people would overlap. Original positions kept."); return; }
    commit({ ...arrangement, offsets: candidate }, "rotate-button"); setNotice("Locked group rotated together on its rings.");
  };
  const spacingIds = new Set<string>();
  if (spacingTarget === "children") branch.edges.filter(e => e.kind === "parent" && e.from === selected).forEach(e => spacingIds.add(e.to));
  else {
    const parents = new Set(branch.edges.filter(e => e.kind === "parent" && e.to === selected).map(e => e.from));
    const generation = baseRadial.nodes.find(n => n.person.id === selected)?.generation;
    branch.edges.filter(e => e.kind === "parent" && parents.has(e.from)).forEach(e => { if (baseRadial.nodes.find(n => n.person.id === e.to)?.generation === generation) spacingIds.add(e.to); });
  }
  const spaceFamily = (factor: number) => {
    // Work independently on each ring; never change anyone's generation.
    let candidate = arrangement.offsets;
    for (const generation of new Set(baseRadial.nodes.filter(n => spacingIds.has(n.person.id)).map(n => n.generation))) {
      const group = new Set(baseRadial.nodes.filter(n => n.generation === generation && spacingIds.has(n.person.id)).map(n => n.person.id));
      candidate = tightenSiblings(editNodes, candidate, group, factor);
    }
    const next = { ...arrangement, offsets: candidate };
    if (ringOverlap(editNodes, candidate, 1, spacingIds)) { record("blocked-family-spacing", arrangement, next, [...spacingIds], false); setNotice("This spacing would collide with another person. Positions kept."); return; }
    commit(next, factor < 1 ? "tighten-siblings" : "spread-siblings", [...spacingIds]);
    setNotice(`${spacingIds.size} people spaced around their group's midpoint on their own ring.`);
  };
  const balanceFamily = () => {
    const groups: { ids:Set<string>; parentId?:string }[]=[];
    if(ring!==null) {
      const families=new Map<string,{ids:Set<string>;parentId?:string}>();
      for(const node of editNodes.filter(n=>nodes.get(n.id)?.generation===ring)) {
        const parentId=branch.edges.find(e=>e.kind==="parent" && e.to===node.id)?.from;
        const key=`${parentId ?? node.id}:${node.radius}`;
        if(!families.has(key)) families.set(key,{ids:new Set(),parentId});
        families.get(key)!.ids.add(node.id);
      }
      groups.push(...families.values());
    } else {
      const parentId=spacingTarget === "children" ? selected : branch.edges.find(e=>e.kind==="parent" && e.to===selected)?.from;
      for(const radius of new Set(editNodes.filter(n=>spacingIds.has(n.id)).map(n=>n.radius))) {
        groups.push({ids:new Set(editNodes.filter(n=>spacingIds.has(n.id) && n.radius===radius).map(n=>n.id)),parentId});
      }
    }
    let candidate=arrangement.offsets;
    const affected=new Set<string>();
    for(const group of groups) {
      candidate=balanceSiblings(editNodes,candidate,group.ids);
      group.ids.forEach(id=>affected.add(id));
    }
    const next={...arrangement,offsets:candidate}, action=ring!==null ? "balance-ring-families" : "balance-family";
    if(ringOverlap(editNodes,candidate,1,affected)) {
      record(`blocked-${action}`,arrangement,next,[...affected],false);
      setNotice("Balancing would overlap another person. Original positions kept."); return;
    }
    commit(next,action,[...affected]);
    setNotice(ring!==null ? `All ${groups.length} family groups on ring ${ring} balanced. Undo restores your arrangement.` : "Siblings packed closely around their midpoint. Only these people moved; lines follow automatically.");
  };
  const straightenSiblinghood = () => {
    const parentId=spacingTarget === "children" ? selected : branch.edges.find(e=>e.kind==="parent" && e.to===selected)?.from;
    if(!parentId) return;
    let candidate=arrangement.offsets;
    const affected=new Set<string>(), visited=new Set<string>(), queue=[parentId];
    for(let i=0;i<queue.length;i++) {
      const id=queue[i];
      if(visited.has(id)) continue;
      visited.add(id);
      const children=branch.edges.filter(e=>e.kind==="parent" && e.from===id).map(e=>e.to).filter(child=>nodes.has(child));
      children.forEach(child=> { affected.add(child); queue.push(child); });
      const parent=editNodes.find(n=>n.id===id);
      const angle=parent && parent.radius ? parent.angle+(candidate[id] ?? 0) : undefined;
      for(const radius of new Set(editNodes.filter(n=>children.includes(n.id)).map(n=>n.radius))) {
        const group=new Set(editNodes.filter(n=>children.includes(n.id) && n.radius===radius).map(n=>n.id));
        candidate=balanceSiblings(editNodes,candidate,group,angle);
      }
    }
    const next={...arrangement,offsets:candidate};
    if(ringOverlap(editNodes,candidate,1,affected)) {
      record("blocked-straighten-siblinghood",arrangement,next,[...affected],false);
      setNotice("Straightening would overlap people. Original positions kept."); return;
    }
    commit(next,"straighten-siblinghood",[...affected]);
    setNotice("Siblinghood and descendants packed evenly toward their parents. Undo restores your arrangement.");
  };
  const pointerAngle = (event: ReactPointerEvent<SVGElement>) => {
    const matrix = layer.current?.getScreenCTM();
    if (!matrix) return 0;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return Math.atan2(p.y+curveCenter, p.x);
  };
  const beginDrag = (event: ReactPointerEvent<SVGElement>, id: string) => {
    if (event.button !== 0) return;
    event.stopPropagation(); setSiblingParent(null); setSelected(id); setPinnedPerson(id); setHover(null); setRing(null);
    const ids = lockedPeople(id, scope, branch.edges, new Set(editNodes.map(n => n.id)));
    if (id === root) { setNotice("The center stays fixed. Use Rotate left/right to turn its locked relatives."); return; }
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, start: pointerAngle(event), ids, base: arrangement, key: viewKey, candidate: arrangement.offsets, person:id, trackIds:new Set([id]), candidateTracks:arrangement.personTracks ?? {}, invalid: false, moved: false };
  };
  const beginSiblingDrag = (event:ReactPointerEvent<SVGElement>,parentId:string,generation:number) => {
    if(event.button!==0) return;
    event.stopPropagation();
    const ids=new Set(branch.edges.filter(e=>e.kind==="parent" && e.from===parentId && nodes.get(e.to)?.generation===generation).map(e=>e.to));
    const person=[...ids][0];
    if(!person || !svg.current) return;
    setSiblingParent(parentId); setSelected(parentId); setSpacingTarget("children"); setPinnedPerson(parentId); setHover(null); setRing(null);
    svg.current.setPointerCapture(event.pointerId);
    drag.current={pointer:event.pointerId,x:event.clientX,y:event.clientY,start:pointerAngle(event),ids,base:arrangement,key:viewKey,candidate:arrangement.offsets,person,trackIds:ids,candidateTracks:arrangement.personTracks ?? {},invalid:false,moved:false};
    setNotice("Whole siblinghood selected. Drag around the ring or onto another track.");
  };
  const moveDrag = (event: ReactPointerEvent<SVGElement>) => {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    event.stopPropagation();
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 4) return;
    current.moved = true;
    const delta = pointerAngle(event) - current.start;
    current.candidate = rotatePeople(current.base.offsets, current.ids, delta);
    const matrix=layer.current?.getScreenCTM();
    const node=baseRadial.nodes.find(n=>n.person.id===current.person)!;
    if(matrix) {
      const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
      const radius=Math.hypot(point.x,point.y+curveCenter), center=curveCenter+node.radius*(current.base.ringScales?.[node.generation] ?? current.base.scale);
      const count=tracksOf(node.generation,current.base);
      let nearest=0, distance=Infinity;
      for(let track=0;track<count;track++) {
        const gap=Math.abs(radius-center-trackOffsetOf(node.generation,track,current.base));
        if(gap<distance) { distance=gap; nearest=track; }
      }
      current.candidateTracks={...current.base.personTracks};
      current.trackIds.forEach(id=> { current.candidateTracks[id]=nearest; });
    }
    const candidateNodes=baseRadial.nodes.map(n=>({id:n.person.id,angle:n.angle,radius:radiusOf(n,{...current.base,personTracks:current.candidateTracks}),size:n.generation ? 27 : 40}));
    current.invalid = !!ringOverlap(candidateNodes, current.candidate, 1, current.ids);
    setPreviewTracks(current.candidateTracks);
    setPreview(current.candidate);
    setNotice(current.invalid ? "Overlapping: keep dragging to a clear spot, or release to snap back." : `Moving ${current.ids.size} locked ${current.ids.size === 1 ? "person" : "people"} together.`);
  };
  const endDrag = (event: ReactPointerEvent<SVGElement>, cancel = false) => {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null; setPreview(null); setPreviewTracks(null); suppressClick.current = current.moved;
    if (svg.current?.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancel && current.moved && !current.invalid && current.key === viewKey) { commit({ ...current.base, offsets: current.candidate, personTracks:current.candidateTracks }, "drag", [...current.ids]); setNotice("Arrangement saved in this browser."); }
    else if (current.moved) { record(cancel ? "cancel-drag" : "blocked-drag", current.base, { ...current.base, offsets: current.candidate, personTracks:current.candidateTracks }, [...current.ids], false); setNotice("Move cancelled; original positions restored."); }
  };
  const nodes = new Map(radial.nodes.map(n => [n.person.id, n]));
  const person = people.find(p => p.id === selected) ?? people.find(p => p.id === root)!;
  const choose = (id: string) => { setSiblingParent(null); setRoot(id); setSelected(id); setQuery(""); setHover(null); setPinnedPerson(null); setRing(null); setPreview(null); setPreviewTracks(null); drag.current = null; };
  const matches = query.trim() ? people.filter(p => p.n.toLowerCase().includes(query.toLowerCase())).slice(0, 8) : [];
  const active = hover ?? pinnedPerson;
  const relatives = new Set<string | null>([active, ...branch.edges.filter(e => e.from === active || e.to === active).flatMap(e => [e.from, e.to])]);
  if (active) lockedPeople(active, "both", branch.edges, new Set(nodes.keys())).forEach(id => relatives.add(id));

  const geometry = useRef(radial.nodes); geometry.current=radial.nodes;
  useEffect(() => {
    const element = svg.current!;
    const controller = zoom<SVGSVGElement, unknown>().scaleExtent([.04, 4]).clickDistance(5).filter(e => e.type !== "dblclick" && !e.button && (e.type === "wheel" || !(e.target instanceof Element && e.target.closest(".circle-person, .circle-ring, .circle-sibling-band")))).on("zoom", ({ transform }) => layer.current?.setAttribute("transform", transform.toString()));
    behavior.current = controller;
    select(element).call(controller);
    fit.current = () => { const bounds=geometry.current; const left=Math.min(...bounds.map(n=>n.x))-100,right=Math.max(...bounds.map(n=>n.x))+100,top=Math.min(...bounds.map(n=>n.y-curveCenter))-150,bottom=Math.max(...bounds.map(n=>n.y-curveCenter))+150; const scale=Math.min((element.clientWidth-100)/(right-left),(element.clientHeight-260)/(bottom-top)); select(element).call(controller.transform,zoomIdentity.translate(element.clientWidth/2-(left+right)/2*scale,160-top*scale).scale(Math.max(.04,scale))); };
    fit.current();
    const observer = new ResizeObserver(() => fit.current()); observer.observe(element);
    return () => { observer.disconnect(); select(element).on(".zoom", null); };
  }, [root, direction, depth]);
  const zoomBy = (factor: number) => { if (svg.current && behavior.current) select(svg.current).call(behavior.current.scaleBy, factor); };
  return <>
    <div className="circle-toolbar"><div className="circle-title"><span>GENEALOGY / CURVED STUDY</span><strong>Every generation, a wider horizon.</strong></div><div className="circle-options">
      <div className="circle-search"><input aria-label="Find a person" placeholder="Find a person" value={query} onChange={e => setQuery(e.target.value)} />{query && <div className="circle-results">{matches.length ? matches.map(p => <button key={p.id} onClick={() => choose(p.id)}>{p.n}</button>) : <span>No matching people</span>}</div>}</div>
      <button onClick={() => setDirection(direction === "descendants" ? "ancestors" : "descendants")}>{direction === "descendants" ? "Descendants" : "Ancestors"} {"\u2194"}</button>
      <label>Rings <input aria-label="Generations" type="number" min={1} max={5} value={depth} onChange={e => setDepth(Math.max(1, Math.min(5, Number(e.target.value) || 1)))} /></label>
      <Link to="/study/people">Close {"\u00d7"}</Link></div>
      <div className="circle-editbar"><label className={ring === null || ring > depth ? "circle-size-disabled" : ""}>{ring === null || ring > depth ? "Select a ring" : `Ring ${ring} size`} <input aria-label="Ring size" disabled={ring === null || ring > depth} type="range" min="1" max="6" step="0.05" value={ring === null ? arrangement.scale : arrangement.ringScales?.[ring] ?? arrangement.scale} onChange={e => resizeRings(Number(e.target.value))} /><output>{ring === null || ring > depth ? "--" : `${Math.round((arrangement.ringScales?.[ring] ?? arrangement.scale) * 100)}%`}</output></label>
        <label>Lock &amp; move <select aria-label="Locked movement" value={scope} onChange={e => setScope(e.target.value as MoveScope)}><option value="person">This person only</option><option value="descendants">Person + descendants</option><option value="ancestors">Person + ancestors</option><option value="both">Person + both</option></select></label>
        <button onClick={() => turn(-Math.PI / 90)}>Rotate left</button><button onClick={() => turn(Math.PI / 90)}>Rotate right</button>
        <button disabled={!undoCount} onClick={() => { const previous = history.current.pop(); if (previous) { record("undo", arrangements[previous.key] ?? { offsets: {}, scale: 3 }, previous.value, [], true, previous.key); setArrangements(all => ({ ...all, [previous.key]: previous.value })); setUndoCount(history.current.length); setNotice("Previous change restored."); } }}>Undo</button>
        <button onClick={() => { commit({ offsets: {}, scale: 3 }, "reset-view", editNodes.map(n => n.id)); setNotice("This view reset. Undo restores your arrangement."); }}>Reset view</button>
        <label className={ring===null ? "circle-size-disabled" : ""}>Ring width<input aria-label="Ring width" type="range" min="80" max="600" step="10" disabled={ring===null} value={widthOf(ring ?? 1)} onChange={e=>changeRingGeometry(Number(e.target.value),tracksOf(ring ?? 1))}/><output>{ring===null ? "--" : widthOf(ring)}</output></label>
        <label className={ring===null ? "circle-size-disabled" : ""}>Tracks<input aria-label="Ring tracks" type="number" min="1" max="6" disabled={ring===null} value={tracksOf(ring ?? 1)} onChange={e=> { const count=Number(e.target.value); if(Number.isInteger(count) && count>=1 && count<=6) changeRingGeometry(widthOf(ring ?? 1),count); }}/></label>
        <label>Family spacing<select aria-label="Family spacing group" value={spacingTarget} onChange={e => setSpacingTarget(e.target.value as "siblings" | "children")}><option value="siblings">Selected person's siblings</option><option value="children">Selected person's children</option></select></label>
        <button disabled={ring===null && spacingIds.size < 2} onClick={balanceFamily} style={{gridColumn:"1 / -1"}}>Balance family</button>
        <button disabled={spacingIds.size < 2} onClick={straightenSiblinghood} style={{gridColumn:"1 / -1"}}>Straighten siblinghood</button>
        <button disabled={spacingIds.size < 2} onClick={() => spaceFamily(.85)}>Tighten siblings</button><button disabled={spacingIds.size < 2} onClick={() => spaceFamily(1/.85)}>Spread siblings</button>
        <span>{locked.size} locked</span>
        <details className="circle-study-notes"><summary>Explain your choices</summary><textarea aria-label="Layout study notes" placeholder="What were you trying to improve? e.g. Keep Benjamin's family together with more space from Gad." value={study.notes} onChange={e => setStudy(previous => ({ ...previous, notes: e.target.value }))} /></details>
        <button className="circle-export-study" onClick={exportStudy}>Export layout study</button>
      </div>
      <nav aria-label="Family starting points">{starts.map(([name, id]) => <button key={id} aria-pressed={root === id} onClick={() => choose(id)}>{name}</button>)}</nav>
    </div>
    <svg ref={svg} onPointerMove={moveDrag} onPointerUp={e=>endDrag(e)} onPointerCancel={e=>endDrag(e,true)} onClick={e => { if (!(e.target instanceof Element) || !e.target.closest(".circle-person, .circle-ring, .circle-sibling-band")) { setSiblingParent(null); setRing(null); setHover(null); setPinnedPerson(null); } }} className="circle-canvas" aria-label="Interactive curved genealogy" tabIndex={0} onKeyDown={e => { if (e.key === "Escape") { setSiblingParent(null); setRing(null); setHover(null); setPinnedPerson(null); } if (e.key === "Home") { e.preventDefault(); fit.current(); } if (["+", "=", "-"].includes(e.key)) { e.preventDefault(); zoomBy(e.key === "-" ? .8 : 1.25); } }}>
      <g ref={layer}><g transform={`translate(0,${-curveCenter})`}>
        {radial.radii.slice(1).map((radius, i) => <g key={i} className="circle-ring" opacity={ring === null || ring === i + 1 ? 1 : .3}>
          <path d={ringArc(radius,curveStart,curveEnd)} fill="none" stroke={colors[i % colors.length]} strokeWidth={widthOf(i+1)} strokeOpacity={ring === i + 1 ? .14 : .045} className="circle-ring-hit" onClick={() => setRing(ring === i + 1 ? null : i + 1)} />
          {Array.from({length:tracksOf(i+1)},(_,track)=>track).map(track => <path key={track} d={ringArc(radius+trackOffsetOf(i+1,track),curveStart,curveEnd)} fill="none" stroke={colors[i % colors.length]} strokeOpacity={.22} strokeDasharray="3 8" />)}
          <g role="button" tabIndex={0} aria-label={`Highlight generation ${i+1}`} aria-pressed={ring === i+1} transform={`translate(${Math.cos(curveStart)*radius},${Math.sin(curveStart)*radius})`} onClick={() => setRing(ring === i+1 ? null : i+1)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRing(ring === i+1 ? null : i+1); } }}><rect x={-56} y={-18} width={112} height={36} rx={18} /><text textAnchor="middle" y={5}>GENERATION {["I", "II", "III", "IV", "V"][i]}</text></g>
        </g>)}
        {[...branch.edges.filter(e => e.kind === "parent").reduce((groups, e) => {
          const key = `${e.from}:${nodes.get(e.to)!.generation}:${nodes.get(e.to)!.trackOffset}`;
          groups.set(key, [...(groups.get(key) ?? []), e]); return groups;
        }, new Map<string, typeof branch.edges>())].map(([key, family]) => {
          const a = nodes.get(family[0].from)!, children = family.map(e => nodes.get(e.to)!);
          const middleAngle = siblingArc(children.map(n => n.angle)).middle;
          const targetRadius = children[0].radius, sign = targetRadius >= a.radius ? 1 : -1;
          const startRadius = a.radius + sign*(a.generation ? 27 : 40), endRadius = targetRadius-sign*27;
          const routes = staggeredBranches(startRadius, a.radius ? a.angle : middleAngle, endRadius, middleAngle, children.map(child => child.angle));
          const bands = siblingBands(children.map(n => n.person.id), radial.nodes.filter(n => n.generation === children[0].generation && n.trackOffset === children[0].trackOffset).map(n=>({ id:n.person.id, angle:n.angle })), targetRadius);
          const color = colors[Math.max(a.generation,children[0].generation)-1] ?? colors[0];
          const opacity = ring !== null ? (a.generation === ring || children[0].generation === ring ? .7 : .05) : active ? (relatives.has(a.person.id) && children.some(n => relatives.has(n.person.id)) ? .9 : .06) : .42;
          return <g key={key} className="circle-family-links" fill="none" stroke={color} opacity={opacity} strokeWidth={active && relatives.has(a.person.id) ? 2.8 : 1.5} pointerEvents="none">
            {bands.map((d,i) => <path key={`band:${i}`} className={`circle-sibling-band${siblingParent===a.person.id ? " circle-sibling-selected" : ""}`} onPointerDown={e=>beginSiblingDrag(e,a.person.id,children[0].generation)} role="button" tabIndex={0} aria-label={`Select ${a.person.n}'s siblinghood`} d={d} strokeWidth={54} stroke="color-mix(in srgb, currentColor 45%, white)" style={{color}} strokeOpacity={siblingParent===a.person.id ? .5 : .28} aria-pressed={siblingParent===a.person.id} onClick={e=> { e.stopPropagation(); if(suppressClick.current) { suppressClick.current=false; return; } setSiblingParent(a.person.id); setSelected(a.person.id); setSpacingTarget("children"); setPinnedPerson(a.person.id); setHover(null); setRing(null); setNotice("Siblinghood selected. Straighten siblinghood aligns this family and its descendants."); }} onKeyDown={e=> { if(e.key==="Enter" || e.key===" ") { e.preventDefault(); e.stopPropagation(); setSiblingParent(a.person.id); setSelected(a.person.id); setSpacingTarget("children"); setPinnedPerson(a.person.id); setHover(null); setRing(null); } }} />)}
            {a.generation !== 0 && children[0].generation !== 0 && <path d={routes.trunk}><title>{a.person.n}: shared connection to {children.length} recorded children</title></path>}
            {children.map((child, index) => {
              const central = a.generation === 0 || child.generation === 0;
              const distance = Math.hypot(child.x-a.x, child.y-a.y);
              const ux = (child.x-a.x)/distance, uy = (child.y-a.y)/distance;
              const sourceSize = a.generation === 0 ? 40 : 27, targetSize = child.generation === 0 ? 40 : 27;
              const path = central
                ? `M${a.x+ux*sourceSize},${a.y+uy*sourceSize} L${child.x-ux*targetSize},${child.y-uy*targetSize}`
                : routes.branches[index].path;
              return <path key={child.person.id} opacity={active && (!relatives.has(a.person.id) || !relatives.has(child.person.id)) ? .08 : 1} d={path}><title>{a.person.n} {"\u2192"} {child.person.n}</title></path>;
            })}
          </g>;
        })}
        {radial.nodes.map(n => <g key={n.person.id} role="button" tabIndex={0} aria-label={`Select ${n.person.n}`} aria-pressed={selected === n.person.id} transform={`translate(${n.x},${n.y})`} className={`circle-person${locked.has(n.person.id) ? " circle-locked" : ""}`} onPointerDown={e => beginDrag(e, n.person.id)} onPointerMove={moveDrag} onPointerUp={e => endDrag(e)} onPointerCancel={e => endDrag(e, true)} onLostPointerCapture={e => { if (drag.current) endDrag(e, true); }} opacity={ring !== null ? (n.generation === ring ? 1 : .2) : active && !relatives.has(n.person.id) ? .15 : 1} onMouseEnter={() => setHover(n.person.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.person.id)} onBlur={() => setHover(null)} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } setSelected(n.person.id); setPinnedPerson(n.person.id); setRing(null); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(n.person.id); setPinnedPerson(n.person.id); setRing(null); } }}>
          <circle r={n.generation ? 27 : 40} stroke={colors[Math.max(0,n.generation-1)]} strokeWidth={selected === n.person.id ? 3 : 1.5} />
          <text textAnchor="middle" dy=".35em" fontSize={n.generation ? 10 : 13} textLength={n.person.n.length > 11 ? 47 : undefined} lengthAdjust="spacingAndGlyphs">{n.person.n}</text>
        </g>)}
      </g></g>
    </svg>
    <div className="circle-bottom"><div className="circle-zoom"><button aria-label="Zoom out" onClick={() => zoomBy(.8)}>{"\u2212"}</button><button onClick={() => fit.current()}>Fit curves</button><button aria-label="Zoom in" onClick={() => zoomBy(1.25)}>+</button></div><div className="circle-selection"><strong>{person.n}</strong><span>{person.b}</span><span className="circle-edit-status" role="status">{notice}</span>{selected !== root && <button onClick={() => choose(selected)}>Center this life {"\u2197"}</button>}</div><small>Mock study / STEP Bible family records{branch.omitted ? " / Branch limited to 180 people" : ""}</small></div>
  </>;
}
