// 02 · Built on their work (approved mock-up: design/scholars-directions/scholars/built.js). Ribbons run from each part
// of this site to the book it draws on and on to the scholar who wrote it: solid for live features, dashed for books
// held in the library. Hovering lights a path; clicking a feature pins it. The ribbons
// sweep in once, the first time the card comes into view. On a phone the same links stack as one list per feature.
// Every book, name and ribbon opens the shared profile.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject, type SyntheticEvent } from "react";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { reducedMotion } from "./marks/dom";
import { buildModel, layoutFor, litBy, modelForArea, SOURCE_AREAS, type SourceArea, type Focus } from "./built/model";
import { Stack } from "./built/Stack";
import { Stage } from "./built/Stage";
import { useScholars } from "./context";
import "./Built.css";
import { Link } from "react-router-dom";
import { Named } from "./Named";
import { SourceDetails, type SourceInspection } from './built/SourceDetails';
import {sourceIndexCsv} from './built/export';

const keyOf = (f: string | undefined, s: string | undefined) => `${f ?? ""}|${s ?? ""}`;

/** Sweeps in once on first view (or at once with reduced motion); "settled" drops the staggered delays afterwards. */
function useSweepIn(target: RefObject<HTMLElement>) {
  const [stage, setStage] = useState<"hidden" | "in" | "settled">("hidden");
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) { setStage("settled"); return; }
    let timer = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      setStage("in");
      timer = window.setTimeout(() => setStage("settled"), 2200);
      io.disconnect();
    }, { threshold: .2 });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, [target]);
  return stage;
}

/** The stage's width while it is shown (the phone layout hides it), re-read on resize in the next frame. */
function useStageWidth(card: RefObject<HTMLElement>, stage: RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    let frame = 0;
    const measure = () => { const s = stage.current; if (s?.offsetParent) setWidth(s.clientWidth); };
    const ro = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); });
    ro.observe(el);
    measure();
    return () => { ro.disconnect(); cancelAnimationFrame(frame); };
  }, [card, stage]);
  return width;
}

export function Built() {
  const { data, library, openProfile } = useScholars();
  const scholars=useMemo(()=>(library??[]).flatMap(p=>p.scholar?[p.scholar]:[]),[library]);
  const overviewModel = useMemo(() => buildModel(scholars), [scholars]);
  const [query,setQuery]=useState(''),[limit,setLimit]=useState(8);
  const [inspection,setInspection]=useState<SourceInspection|null>(null);
  const allModel=useMemo(()=>buildModel(scholars,limit,query),[scholars,limit,query]);
  const [area, setArea] = useState<SourceArea>('all');
  const model = useMemo(() => modelForArea(allModel, area), [allModel, area]);
  const cardRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const width = useStageWidth(cardRef, stageRef);
  const layout = useMemo(() => (width ? layoutFor(model, width) : null), [model, width]);
  const openingHeight = useMemo(() => width ? layoutFor(overviewModel, width).openingHeight : 715, [overviewModel, width]);
  const sweep = useSweepIn(cardRef);
  const [pinned, setPinned] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const chooseArea = (next: SourceArea) => {
    setArea(next); setPinned(null); setFocus(null);setLimit(8);
    cardRef.current?.querySelectorAll('.blt-scroll,.blt-stack').forEach(el => el.scrollTo({top:0}));
  };

  // One Focus object per node, so hovering the same thing twice changes nothing.
  const focusFor = useMemo(() => {
    const cache = new Map<string, Focus>();
    return (f: string | undefined, s: string | undefined) => {
      const key = keyOf(f, s);
      if (!cache.has(key)) cache.set(key, { f: model.features.find((x) => x.id === f) ?? null, s: s ? model.rows.find((x) => x.s.id === s)?.s ?? null : null });
      return cache.get(key) as Focus;
    };
  }, [model]);
  const pinnedFocus = pinned ? focusFor(pinned, undefined) : null;
  const nodeFocus = useCallback((target: EventTarget) => {
    const node = (target as Element).closest<HTMLElement>("[data-f], [data-s]");
    return node ? focusFor(node.dataset.f, node.dataset.s) : null;
  }, [focusFor]);
  const lit = useMemo(() => (focus ? litBy(model, focus) : null), [model, focus]);

  const onStageClick = (event: SyntheticEvent) => {
    const feat = (event.target as Element).closest<HTMLElement>(".blt-feat");
    if (!feat?.dataset.f) return;
    const next = pinned === feat.dataset.f ? null : feat.dataset.f;
    setPinned(next);
    setFocus(focusFor(feat.dataset.f, undefined));
  };
  const onCardClick = (event: SyntheticEvent) => {
    const hit = (event.target as Element).closest<HTMLElement>("[data-scholar],[data-source]");
    const id = hit?.dataset.source??hit?.dataset.scholar;
    if (!hit || !id) return;
    const origin = hit.matches(".blt-rib") ? stageRef.current?.querySelector(`.blt-work[data-s="${id}"]`) ?? hit : hit;
    const row=model.rows.find(r=>r.s.id===id);
    if(row?.s.profileId&&!hit.dataset.source)openProfile(row.s.profileId,origin);
    else if(row)setInspection({name:row.s.creditLabel??row.s.name,records:[{title:row.s.works[0][0],year:row.s.works[0][1],url:row.s.sourceUrl,kind:row.s.kind,uses:row.s.uses}]});
  };
  const downloadIndex = () => {
    const complete=modelForArea(buildModel(scholars,Infinity,query),area);
    const url=URL.createObjectURL(new Blob([sourceIndexCsv(complete)],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`site-sources-${area}.csv`;link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  return <>
    <SectionHead section="built" kicker="On this site" title={<>Sources <em>in use</em></>}
      line={<>Follow the work behind the site: {overviewModel.features.length} features and {overviewModel.totalCount.toLocaleString()} documented source records. Choose an area, search the full index, or open a source to trace its page connections.</>} />
    <div ref={cardRef} className={`blt-card${sweep !== "hidden" ? " blt-in" : ""}${sweep === "settled" ? " blt-settled" : ""}`}
      style={{'--blt-window-height':`${openingHeight}px`} as CSSProperties}
      onClick={onCardClick}>
      <div className="blt-controls"><p><b>{model.rows.length}</b> of {model.matchedCount.toLocaleString()} sources shown · {model.features.length} {model.features.length===1?'feature':'features'}</p><label><span className="sr-only">Search all site sources</span><input type="search" placeholder="Find a work, contributor or page" value={query} onChange={event=>{setQuery(event.target.value);setLimit(8);setFocus(null);setPinned(null);cardRef.current?.querySelectorAll('.blt-scroll,.blt-stack').forEach(el=>el.scrollTo({top:0}));}}/></label><button type="button" className="blt-more" onClick={downloadIndex}>Download index</button>{model.rows.length<model.matchedCount&&<button type="button" className="blt-more" onClick={()=>setLimit(n=>n+8)}>More connections +</button>}</div>
      <div className="blt-tabs" role="tablist" aria-label="Source study area" onKeyDown={event => {
        const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]'));
        const current=tabs.indexOf(event.target as HTMLButtonElement);
        const next=event.key==='ArrowRight'?(current+1)%tabs.length:event.key==='ArrowLeft'?(current+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
        if(next<0)return;event.preventDefault();chooseArea(SOURCE_AREAS[next].id);tabs[next].focus();
      }}>{SOURCE_AREAS.map(tab=><button type="button" key={tab.id} id={`source-tab-${tab.id}`} role="tab" aria-selected={area===tab.id} aria-controls="source-area-panel" tabIndex={area===tab.id?0:-1} onClick={()=>chooseArea(tab.id)}>{tab.label}<small>{modelForArea(allModel,tab.id).features.length}</small></button>)}</div>
      <div id="source-area-panel" role="tabpanel" aria-labelledby={`source-tab-${area}`}>
      <div className="blt-scroll slim-scroll"><div ref={stageRef} className={`blt-stage${focus ? " blt-dim" : ""}`} style={layout ? { height: layout.height } : undefined}
        onPointerOver={(e) => setFocus(nodeFocus(e.target) ?? pinnedFocus)} onPointerLeave={() => setFocus(pinnedFocus)}
        onFocus={(e) => { const f = nodeFocus(e.target); if (f) setFocus(f); }} onBlur={() => setFocus(pinnedFocus)} onClick={onStageClick}>
        <Stage data={data} model={model} layout={layout} lit={lit} pinned={pinned} />
        {!model.rows.length&&<p className="blt-empty">No source connections match this search in this area.</p>}
      </div>
      </div><Stack data={data} model={model} />
      </div>
    </div>
    <p className="blt-caption">Solid ribbons: cited sources and data inputs. Dashed ribbons: listed bibliographies. <Link to="/study/circles?study=letters">Explore circles of study →</Link></p>
    <Named onInspect={setInspection}/>
    {inspection&&<SourceDetails key={JSON.stringify([inspection.name,inspection.records.map(r=>r.url)])} selection={inspection} onClose={()=>setInspection(null)}/>}
  </>;
}
