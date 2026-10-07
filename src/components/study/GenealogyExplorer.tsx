import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { ArrowRight, LocateFixed, ChevronDown, ChevronUp, GitBranch, Maximize, Minimize2, Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { familyBranch, familyEdges, type FamilyPerson } from "@/lib/genealogy";
import { alignTreeFamilies } from "@/lib/genealogy-tree-alignment";
import { genealogyFit,genealogyPan } from "@/lib/genealogy-camera";
import { routeSiblingGroups, routeFamilies, routePath } from "@/lib/genealogy-routing";
import { useAsync } from "@/lib/useAsync";
import { RefLink } from "./StudyParts";
import "./genealogy.css";
import { ExpandedGenealogy } from "./ExpandedGenealogy";
import { FAMILY_STARTS, JESUS, gospelPeople, fullFamilyDepth, GOSPEL_NOTES, type GospelAccount } from "@/lib/genealogy-catalog";
import { FamilyStartingPoints } from "./FamilyStartingPoints";
export type GenealogyView={root:string;depth:number;account?:GospelAccount;direction:"both"|"ancestors"|"descendants"};

const STARTS = FAMILY_STARTS;
const ERA_COLORS: Record<string, string> = {
  "Before the Flood": "#9c8cdb", "Patriarchs": "#d5a44b", "Egypt and Wilderness": "#cc7853",
  "Conquest": "#82a95e", "Judges": "#4fa99a", "United Monarchy": "#579cce",
  "Divided Monarchy": "#817ad1", "Exile and Return": "#c577ae", "New Testament": "#d87887",
};
const eraColor = (era: string) => ERA_COLORS[era] ?? "var(--muted)";
let data: Promise<FamilyPerson[]> | undefined;
const load = () => data ??= fetch("/content/study/genealogy.json").then(async response => {
  if (!response.ok) throw new Error("Family records unavailable");
  return (await response.json() as { people: FamilyPerson[] }).people.map(p => ({
    ...p, n: p.id === "israel-gen-25-26" ? "Jacob / Israel" : /^Unnamed\d*$/i.test(p.n) ? "Unnamed person" : p.n.replace(/_/g, " "),
  }));
}).catch(error => { data = undefined; throw error; });

export function GenealogyExplorer() {
  const result = useAsync(load, "genealogy");
  const [expanded,setExpanded]=useState<{view:GenealogyView;rect:DOMRect}|null>(null);
  const [returned,setReturned]=useState<GenealogyView|undefined>();
  if (result.status === "loading") return <p role="status" className="py-12 text-muted">Opening the families of Scripture…</p>;
  if (result.status === "error") return <p role="alert" className="py-12 text-muted">The family records could not load. Reload to try again; the people directory remains available below.</p>;
  return <><GenealogyTree people={result.value} modern view={returned} initialRoot={JESUS} initialDepth={40} initialDirection="ancestors" onExpand={(view,rect)=>setExpanded({view,rect})} />{expanded && <ExpandedGenealogy view={expanded.view} rect={expanded.rect} onMinimize={view=>{setReturned(view);setExpanded(null);}} />}</>;
}

export function GenealogyTree({people:records,initialAccount="matthew",initialRoot=STARTS[0][1],initialDepth=5,initialDirection="both",fullscreen=false,modern=fullscreen,onExpand,onMinimize,onViewChange,view}: {people:FamilyPerson[];initialAccount?:GospelAccount;initialRoot?:string;initialDepth?:number;initialDirection?:"both"|"ancestors"|"descendants";fullscreen?:boolean;modern?:boolean;onExpand?:(view:GenealogyView,rect:DOMRect)=>void;onMinimize?:()=>void;onViewChange?:(view:GenealogyView)=>void;view?:GenealogyView}) {
  const [account,setAccount]=useState<GospelAccount>(initialAccount);
  const [root, setRoot] = useState(initialRoot);
  const [selected, setSelected] = useState(root);
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [query, setQuery] = useState("");
  const [activeConnection, setActiveConnection] = useState<string | null>(null);
  const [hoverPerson, setHoverPerson] = useState<string | null>(null);
  const [hoverGeneration, setHoverGeneration] = useState<number | null>(null);
  const [pinnedGeneration, setPinnedGeneration] = useState<number | null>(null);
  const [depth, setDepth] = useState(initialDepth);
  const [direction, setDirection] = useState<"both" | "ancestors" | "descendants">(initialDirection);
  const people=useMemo(()=>root===JESUS ? gospelPeople(records,account) : records,[records,root,account]);
  const maxDepth=useMemo(()=>fullFamilyDepth(people,root,direction),[people,root,direction]);
  const [spouses, setSpouses] = useState(!modern), [siblings, setSiblings] = useState(false);
  useEffect(()=>{if(view) {setRoot(view.root);setSelected(view.root);setDepth(view.depth);setDirection(view.direction);setAccount(view.account ?? "matthew");}},[view]);
  useEffect(()=>{onViewChange?.({root,depth,direction,account});},[root,depth,direction,account,onViewChange]);
  const allEdges = useMemo(() => familyEdges(people), [people]);
  const branch = useMemo(() => {const value=familyBranch(people, allEdges, root, depth, direction, spouses, siblings,people.length,modern);return modern ? alignTreeFamilies(value) : value;}, [people, allEdges, root, depth, direction, spouses, siblings,modern]);
  const routing=useMemo(()=>modern ? routeSiblingGroups(branch) : routeFamilies(branch),[branch,modern]);
  const byId = useMemo(() => new Map(people.map(p => [p.id, p])), [people]);
  const person = byId.get(selected) ?? byId.get(root)!;
  const matches = query.trim() ? people.filter(p => `${p.n} ${p.o.join(" ")} ${p.b}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => b.c - a.c).slice(0, 12) : [];
  const viewport = useRef<SVGSVGElement>(null), layer = useRef<SVGGElement>(null);
  const percent = useRef<HTMLOutputElement>(null);
  const behaviour = useRef<ZoomBehavior<SVGSVGElement, unknown>>();
  const fit = useRef(() => {});
  const dragging = useRef(false);
  const choose = (id: string) => { const nextDirection=id===JESUS ? "ancestors" : "descendants";setDirection(nextDirection);setDepth(fullFamilyDepth(id===JESUS ? gospelPeople(records,account) : records,id,nextDirection));setRoot(id); setSelected(id); setQuery(""); setHoverPerson(null); setHoverGeneration(null); setPinnedGeneration(null); setActiveConnection(null); };

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const selection = select(element);
    const zoomer = zoom<SVGSVGElement, unknown>().clickDistance(6).duration(0)
      .filter(event => event.type !== "dblclick" && (!event.button || event.button===2))
      .constrain(transform=>{
        const w=element.clientWidth,h=element.clientHeight,k=transform.k;
        const {x,y}=genealogyPan(transform.x,transform.y,k,w,h,branch.width,branch.height);
        return zoomIdentity.translate(x,y).scale(k);
      })
      .on("start", () => { dragging.current = true; setHoverPerson(null); setHoverGeneration(null); })
      .on("end", () => { dragging.current = false; })
      .on("zoom", ({ transform }: { transform: ZoomTransform }) => {
        layer.current?.setAttribute("transform", transform.toString());
        layer.current?.querySelectorAll<SVGRectElement>(".genealogy-band-background").forEach(band=> {
          band.setAttribute("x",String(-transform.x/transform.k-2));
          band.setAttribute("width",String(element.clientWidth/transform.k+4));
        });
        if (percent.current) percent.current.value = `${Math.round(transform.k * 100)}%`;
      });
    behaviour.current = zoomer;
    selection.call(zoomer);
    const preventScroll = (event: WheelEvent) => event.preventDefault();
    element.addEventListener("wheel", preventScroll, { passive: false });
    fit.current = () => {
      const w = element.clientWidth, h = element.clientHeight;
      const scale = genealogyFit(w,h,branch.width,branch.height);
      zoomer.scaleExtent([Math.min(scale,.02), 4]);
      selection.call(zoomer.transform, zoomIdentity.translate((w - branch.width * scale) / 2, (h - branch.height * scale) / 2).scale(scale));
    };
    fit.current();
    const observer = new ResizeObserver(() => fit.current()); observer.observe(element);
    return () => { observer.disconnect(); selection.on(".zoom", null); element.removeEventListener("wheel", preventScroll); behaviour.current = undefined; };
  }, [branch.width, branch.height, root, depth, direction, spouses, siblings]);

  const zoomBy = (factor: number) => { if (viewport.current && behaviour.current) select(viewport.current).call(behaviour.current.scaleBy, factor); };
  const keyboard = (event: KeyboardEvent<SVGSVGElement>) => {
    const element = viewport.current, zoomer = behaviour.current;
    if (!element || !zoomer) return;
    if (event.key === "Escape") { setDetailsOpen(false); setPinnedGeneration(null); setHoverGeneration(null); setHoverPerson(null); setActiveConnection(null); return; }
    const moves: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
    if (moves[event.key]) { event.preventDefault(); const [x, y] = moves[event.key], k = zoomTransform(element).k; select(element).call(zoomer.translateBy, x / k, y / k); }
    else if (["+", "=", "-", "Home", "0"].includes(event.key)) { event.preventDefault(); if (["Home", "0"].includes(event.key)) fit.current(); else zoomBy(event.key === "-" ? 1 / 1.3 : 1.3); }
  };
  const positions = new Map(branch.positions.map(p => [p.person.id, p]));
  const activeGeneration = hoverGeneration ?? (branch.bands.some(b => b.generation === pinnedGeneration) ? pinnedGeneration : null);
  const highlighted = new Set<string>();
  if (hoverPerson) {
    highlighted.add(hoverPerson);
    const parentIds = new Set(branch.edges.filter(e => e.kind === "parent" && e.to === hoverPerson).map(e => e.from));
    for (const edge of branch.edges) {
      if (edge.from === hoverPerson) highlighted.add(edge.to);
      if (edge.to === hoverPerson) highlighted.add(edge.from);
      if (edge.kind === "parent" && parentIds.has(edge.from)) highlighted.add(edge.to);
    }
  }
  const connection = routing.unresolved.find(r => r.key === activeConnection);
  const bright = (id: string) => connection ? connection.ids.includes(id) : hoverPerson ? highlighted.has(id) : activeGeneration === null || positions.get(id)?.generation === activeGeneration;
  const paths = useMemo(()=>routing.routes.map(route => ({ ...route, d: modern ? `M${route.points.map(p=>p.join(",")).join(" L")}` : routePath(route) })),[routing,modern]);
  const markerSlots = new Map<string, number>();
  const markers = routing.unresolved.flatMap((route, index) => {
    const label = `C${index + 1}`;
    return [0, route.points.length - 1].map((endpoint, side) => {
      const [x, y] = route.points[endpoint];
      const anchor = `${x}:${y}`, slot = markerSlots.get(anchor) ?? 0;
      markerSlots.set(anchor, slot + 1);
      return { route, label, side, x: x - 20, y: y + (side && route.points.length === 3 ? -24 - slot * 24 : 8 + slot * 24) };
    });
  });
  const eras = [...new Set(branch.positions.map(p => p.person.e))].sort((a, b) => Object.keys(ERA_COLORS).indexOf(a) - Object.keys(ERA_COLORS).indexOf(b));
  const filterPanel=(<div className="genealogy-filters">
      <div className="genealogy-search"><label><Search size={17} aria-hidden /><span className="sr-only">Find a genealogy person</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a person or another name…" /></label>{query && <div className="genealogy-results" role="region" aria-label="Matching people">{matches.length ? matches.map(p => <button key={p.id} onClick={() => choose(p.id)}><strong>{p.n}</strong><span>{p.b}</span></button>) : <p>No matching people. Try another name.</p>}</div>}</div>
      <div className="genealogy-generation-field"><label htmlFor="genealogy-generations">Generations</label><div className="genealogy-stepper"><input id="genealogy-generations" type="number" min={1} max={maxDepth} step={1} value={depth} onChange={e => { const value = e.currentTarget.valueAsNumber; if (Number.isFinite(value)) setDepth(Math.max(1, Math.min(maxDepth, Math.round(value)))); }} /><div className="genealogy-stepper-arrows"><button type="button" aria-label="Increase generations" disabled={depth >= maxDepth} onClick={() => setDepth(value => Math.min(maxDepth, value + 1))}><ChevronUp size={14} aria-hidden="true" /></button><button type="button" aria-label="Decrease generations" disabled={depth <= 1} onClick={() => setDepth(value => Math.max(1, value - 1))}><ChevronDown size={14} aria-hidden="true" /></button></div></div></div>
      <fieldset className="genealogy-direction"><legend>Direction</legend><div>{(["ancestors", "descendants", "both"] as const).map(value => <button key={value} type="button" aria-pressed={direction === value} onClick={() => setDirection(value)}>{value === "ancestors" ? "Ancestors" : value === "descendants" ? "Descendants" : "Both"}</button>)}</div></fieldset>
      <div className="genealogy-checks"><label><input type="checkbox" checked={spouses} onChange={e => setSpouses(e.target.checked)} />Spouses</label><label><input type="checkbox" checked={siblings} onChange={e => setSiblings(e.target.checked)} />Siblings</label></div>
    </div>);
  const connectionPanel=(routing.unresolved.length > 0 && <div className="genealogy-connections"><details><summary>Cross-family connections ({routing.unresolved.length})</summary><p>Matching C markers connect families across the chart. Select a connection to highlight both ends.</p><ul>{routing.unresolved.map((route, i) => <li key={route.key}><button type="button" aria-pressed={activeConnection === route.key} onClick={() => setActiveConnection(value => value === route.key ? null : route.key)}>C{i + 1} <span>{route.title}</span></button></li>)}</ul></details>{connection && <p role="status">{connection.title}<button type="button" onClick={() => setActiveConnection(null)}>Clear highlight</button></p>}</div>);
  const personPanel=fullscreen ? (<aside className="genealogy-person-drawer" aria-labelledby="genealogy-person-title" key={person.id} onKeyDown={e=>{if(e.key==="Escape") {e.stopPropagation();setDetailsOpen(false);}}}>
      <header><div><span className="genealogy-panel-eyebrow">Selected life</span><h3 id="genealogy-person-title">{person.n}</h3><span className="genealogy-era-pill">{person.e || "Era not recorded"}</span></div><button type="button" aria-label="Close person details" onClick={()=>setDetailsOpen(false)}><X size={18} aria-hidden="true" /></button></header>
      <div className="genealogy-person-body"><p>{person.b}</p>{person.f ? <div className="genealogy-person-reference"><span className="genealogy-panel-eyebrow">First recorded reference</span><RefLink span={[person.f,person.f]} /></div> : null}</div>
      <footer className="genealogy-person-actions"><button onClick={()=>choose(person.id)} disabled={person.id===root}>Explore their family<GitBranch size={15} /></button><Link to={`/study/people/${person.id}#people-directory`}>Read their story<ArrowRight size={15} /></Link></footer>
    </aside>) : (<article className="genealogy-person" aria-live="polite"><div><p className="text-xs text-accent">Selected life</p><h3 className="mt-1 font-serif text-2xl">{person.n}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{person.b}</p><p className="mt-2 text-xs text-muted">{person.e}{person.f ? <> · First recorded reference: <RefLink span={[person.f, person.f]} /></> : null}</p></div><div className="genealogy-person-actions"><button onClick={() => choose(person.id)} disabled={person.id === root}>Explore their family<GitBranch size={15} /></button><Link to={`/study/people/${person.id}#people-directory`}>Read their story<ArrowRight size={15} /></Link></div></article>);
  const zoomControls=(<div className="genealogy-controls" role="group" aria-label="Genealogy zoom">{onExpand && <button aria-label="Expand genealogy" onClick={()=>{if(viewport.current) onExpand({root,depth,direction,account},viewport.current.getBoundingClientRect());}}><Maximize size={16} />Expand</button>}<button aria-label="Zoom out genealogy" onClick={() => zoomBy(1 / 1.3)}><Minus size={17} /></button><output ref={percent} aria-label="Genealogy zoom level">100%</output><button aria-label="Zoom in genealogy" onClick={() => zoomBy(1.3)}><Plus size={17} /></button><button onClick={() => fit.current()}><Maximize size={16} />Fit</button><button aria-label="Center root person" title={`Center ${byId.get(root)?.n ?? "root person"}`} onClick={()=>{const node=positions.get(root);if(node && viewport.current && behaviour.current) {const element=viewport.current,k=Math.max(.5,zoomTransform(element).k);select(element).call(behaviour.current.transform,zoomIdentity.translate(element.clientWidth/2-(node.x+76)*k,element.clientHeight/2-(node.y+52)*k).scale(k));}}}><LocateFixed size={16} /></button></div>);
  return <section className={`genealogy-explorer${modern ? " genealogy-modern" : ""}${fullscreen ? " genealogy-fullscreen" : ""}`} aria-labelledby="genealogy-title">
    {fullscreen && zoomControls}
    <header className="genealogy-heading"><div><p className="text-xs uppercase tracking-[.2em] text-accent">{fullscreen ? "People / Genealogy" : "Lives connected across Scripture"}</p><h2 id="genealogy-title" className="mt-2 font-serif text-3xl sm:text-4xl">The families of the Bible.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Follow a family branch. Discover the people around a name. Select a person to explore their story and the passages that name them.</p></div><GitBranch size={32} strokeWidth={1.2} className="text-accent" aria-hidden /></header>
    {fullscreen ? <><div className="circle-options genealogy-compact-toolbar" role="region" aria-label="Family tree controls">
      <div className="circle-search"><input aria-label="Find a genealogy person" placeholder="Find a person" value={query} onChange={e=>setQuery(e.target.value)} />{query && <div className="circle-results">{matches.length ? matches.map(p=><button key={p.id} onClick={()=>choose(p.id)}>{p.n}</button>) : <span>No matching people</span>}</div>}</div>
      <button onClick={()=>setDirection(direction==="descendants" ? "ancestors" : "descendants")}>{direction==="ancestors" ? "Ancestors" : "Descendants"} {"\u2194"}</button>
      <label>Generations <input aria-label="Generations" type="number" min={1} max={maxDepth} value={depth} onChange={e=>setDepth(Math.max(1,Math.min(maxDepth,Number(e.target.value)||1)))} /></label>
      {onMinimize ? <button className="genealogy-minimize" aria-label="Minimize" title="Minimize" onClick={onMinimize}><Minimize2 size={16} strokeWidth={1.5} aria-hidden="true" /></button> : <Link to="/study/people">Close {"\u00d7"}</Link>}
    </div><div className="genealogy-right-rail">{detailsOpen && personPanel}{connectionPanel}</div></> : filterPanel}
    <div className="genealogy-starts" role="group" aria-label="Family starting points"><span>Begin with</span><FamilyStartingPoints root={root} onChoose={choose} account={account} onAccount={value=>{setAccount(value);setDirection("ancestors");setDepth(fullFamilyDepth(gospelPeople(records,value),JESUS,"ancestors"));}} onFull={()=>setDepth(maxDepth)} complete={depth>=maxDepth} /></div>
    {!fullscreen && root===JESUS && <p className="genealogy-account-note">{GOSPEL_NOTES[account]}</p>}
    <p id="genealogy-help" className="sr-only">Drag to move. Pinch or wheel to zoom. Arrow keys to pan. Home to fit. Select a person to explore their family.</p>
    <div className="genealogy-stage"><svg ref={viewport} onContextMenu={e=>e.preventDefault()} role="region" aria-label="Interactive biblical genealogy" aria-describedby="genealogy-help" tabIndex={0} onKeyDown={keyboard}>
      <g ref={layer}>
        {branch.bands.map(band => <g key={band.generation} className={`genealogy-band${activeGeneration === band.generation ? " genealogy-band-active" : ""}`}>
          {!band.compact && <rect x="0" y={band.y} width={branch.width} height={band.height} className="genealogy-band-background" />}
          <g role="button" tabIndex={0} aria-label={`Highlight ${band.label}`} aria-pressed={pinnedGeneration === band.generation} className="genealogy-band-label" transform={`translate(${band.labelX ?? 30},${band.y + (band.compact ? 38 : 22)})`} onMouseEnter={() => setHoverGeneration(band.generation)} onMouseLeave={() => setHoverGeneration(null)} onFocus={() => setHoverGeneration(band.generation)} onBlur={() => setHoverGeneration(null)} onClick={() => setPinnedGeneration(value => value === band.generation ? null : band.generation)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPinnedGeneration(value => value === band.generation ? null : band.generation); } }}>
            <rect width="195" height="100" rx="14" /><text x="14" y="37" className="genealogy-generation-numeral">{band.generation < 0 ? "\u2191 " : band.generation > 0 ? "\u2193 " : ""}{band.numeral}</text><text x="14" y="66" className="genealogy-generation-caption">{band.generation === 0 ? "Selected generation" : band.label.length > 23 ? `${band.generation < 0 ? "Ancestors" : "Descendants"} \u00b7 ${Math.abs(band.generation)}` : band.label}</text>
          </g>
        </g>)}
        {branch.clusters.filter(cluster => cluster.members.length > 1).map(cluster => <g key={cluster.id} className="genealogy-family-cluster" opacity={cluster.members.some(bright) ? 1 : .18}>
          <rect x={cluster.x} y={cluster.y} width={cluster.width} height={cluster.height} rx="22" /><title>{cluster.parents.length ? `Recorded children of ${cluster.parents.map(id => byId.get(id)?.n ?? "an unshown parent").join(" and ")}` : "Family"}</title>
        </g>)}
        {paths.map(path => <path key={path.key} className={`genealogy-edge genealogy-edge-${path.kind}${(connection || hoverPerson || activeGeneration !== null) && !path.ids.every(bright) ? " genealogy-edge-muted" : ""}`} d={path.d}><title>{path.title}</title></path>)}
        {branch.positions.map(p => <g key={p.person.id} transform={`translate(${p.x},${p.y})`} role="button" tabIndex={0} aria-label={`Select ${p.person.n}: ${p.person.e || "Era not recorded"}. ${p.person.b}`} style={{ "--genealogy-era": eraColor(p.person.e) } as CSSProperties} aria-pressed={person.id === p.person.id} onMouseEnter={() => { if (!dragging.current) setHoverPerson(p.person.id); }} onMouseLeave={() => setHoverPerson(null)} opacity={bright(p.person.id) ? 1 : .16} className={`genealogy-node${root === p.person.id ? " genealogy-root" : ""}${person.id === p.person.id ? " genealogy-selected" : ""}`} onClick={() => {setSelected(p.person.id);setDetailsOpen(true);}} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(p.person.id);setDetailsOpen(true); } }} onBlur={() => setHoverPerson(null)} onFocus={e => { setHoverPerson(p.person.id); if (e.currentTarget.matches(":focus-visible") && viewport.current && behaviour.current) select(viewport.current).call(behaviour.current.translateTo, p.x + 76, p.y + 52); }}>
        <circle className="genealogy-node-halo" cx="76" cy="52" r="58" /><circle className="genealogy-node-disc" cx="76" cy="52" r="52" /><text x="76" y="52" dy=".35em" textAnchor="middle" className="genealogy-node-name" fontSize={p.person.n.length > 12 ? 12 : 15} textLength={p.person.n.length > 13 ? 90 : undefined} lengthAdjust="spacingAndGlyphs">{p.person.n}</text><title>{p.person.n}: {p.person.e || "Era not recorded"}. {p.person.b}</title>
      </g>)}
        {markers.map(marker => <g key={`${marker.route.key}:${marker.side}`} transform={`translate(${marker.x},${marker.y})`} className="genealogy-continuation" role="button" tabIndex={0} aria-label={`${marker.label}: ${marker.route.title}`} aria-pressed={activeConnection === marker.route.key} onClick={() => setActiveConnection(value => value === marker.route.key ? null : marker.route.key)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveConnection(value => value === marker.route.key ? null : marker.route.key); } }}><rect width="40" height="20" rx="5" /><text x="20" y="14" textAnchor="middle">{marker.label}</text><title>{marker.route.title}. Matching markers connect these families without crossing other lines.</title></g>)}
      </g>
    </svg>{!fullscreen && zoomControls}</div>
    {!fullscreen && <>{connectionPanel}{personPanel}</>}
    <div className="genealogy-era-legend" role="group" aria-label="Circle outline colors by era"><span className="genealogy-era-legend-title">Circle outlines: era</span>{eras.map(era => <span key={era || "unknown"} style={{ "--genealogy-era": eraColor(era) } as CSSProperties}><i aria-hidden="true" />{era || "Era not recorded"}</span>)}</div>
    <p className="mt-4 text-xs leading-relaxed text-muted">{root===JESUS ? GOSPEL_NOTES[account] : "Recorded people and family groups from STEP Bible's TIPNR (CC BY 4.0). Links retain the source's identifications; biological, legal and adoptive relationships are not always distinguished."} {branch.positions.length} entries · {branch.truncated || branch.omitted ? "More recorded family remains outside this view; choose Full branch." : "Full recorded branch in the selected direction."}</p>
  </section>;
}
