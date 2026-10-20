import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowUpRight, Clock, Route } from "lucide-react";
import { IDEA_CHAINS } from "./idea-chains";
import { toneVar } from "../marks/shapes";
import { reducedMotion } from "../marks/dom";
import "./idea-lineage.css";
import { useScholars } from '../context';
import { lineageEntry } from './lineage-population';
import { ScholarTimeline, type ScholarTimelineProps } from "./ScholarTimeline";
import { usePeopleData } from "../../shared/data";
import { layoutLandingArc } from "../../preachers/landing/arc";
import "../../shared/landing-graph.css";
import { reclaimedLandingSpace } from "../../shared/landing-graph";

export function IdeaLineage(props: ScholarTimelineProps & { initialView?: "lineage"|"timeline";onTimeline?:()=>void;sectionMode?:boolean }) {
  const {library,filterCatalogue}=useScholars();
  const {data:preachers}=usePeopleData();
  const frameRef=useRef<HTMLElement>(null);
  const [frameSize,setFrameSize]=useState({width:0,reclaimed:0});
  useLayoutEffect(()=>{
    const frame=frameRef.current;if(!frame)return;
    const measure=()=>setFrameSize(previous=>{
      const next={width:frame.clientWidth,reclaimed:reclaimedLandingSpace(frame)};
      return previous.width===next.width&&previous.reclaimed===next.reclaimed?previous:next;
    });
    measure();const observer=new ResizeObserver(measure);observer.observe(frame);
    return()=>observer.disconnect();
  },[]);
  const frameHeight=useMemo(()=>preachers&&frameSize.width?layoutLandingArc(preachers.people,frameSize.width,frameSize.reclaimed).height:399,[preachers,frameSize.width,frameSize.reclaimed]);
  const [view,setView]=useState<"lineage"|"timeline">(props.initialView??"lineage");
  const [controlsHost,setControlsHost]=useState<HTMLDivElement|null>(null);
  const [active,setActive]=useState(0),[selected,setSelected]=useState<number|null>(null);
  const detailRef=useRef<HTMLDivElement>(null);
  const chain=IDEA_CHAINS[active],node=chain.nodes[selected??0];
  const entry=lineageEntry(node,library??[]);
  const choose=(index:number)=>{if(index!==active){setActive(index);setSelected(previous=>previous===null?null:0);}};
  useLayoutEffect(()=>{
    if(view!=="lineage"||selected===null||!detailRef.current)return;
    const detail=detailRef.current;
    const startY=window.scrollY,start=performance.now();
    let frame=0;
    const center=()=>{
      const rect=detail.getBoundingClientRect();
      return Math.max(0,Math.min(document.documentElement.scrollHeight-window.innerHeight,
        window.scrollY+rect.top+rect.height/2-window.innerHeight/2));
    };
    const tick=(now:number)=>{
      const progress=Math.min(1,(now-start)/520);
      const ease=progress*progress*(3-2*progress);
      window.scrollTo({top:startY+(center()-startY)*ease,behavior:"instant"});
      if(progress<1)frame=requestAnimationFrame(tick);
    };
    const cancel=()=>cancelAnimationFrame(frame);
    // Follow the panel as it opens; one motion, with no second scroll at the end.
    if(reducedMotion())window.scrollTo({top:center(),behavior:"instant"});
    else frame=requestAnimationFrame(tick);
    window.addEventListener("wheel",cancel,{passive:true});
    window.addEventListener("touchstart",cancel,{passive:true});
    window.addEventListener("keydown",cancel);
    return()=>{cancel();window.removeEventListener("wheel",cancel);window.removeEventListener("touchstart",cancel);window.removeEventListener("keydown",cancel);};
  },[active,selected,view]);
  const navigate=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    let next=index;
    if(event.key==="ArrowRight")next=(index+1)%IDEA_CHAINS.length;
    else if(event.key==="ArrowLeft")next=(index+IDEA_CHAINS.length-1)%IDEA_CHAINS.length;
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=IDEA_CHAINS.length-1;
    else return;
    event.preventDefault();choose(next);document.getElementById(`lineage-tab-${next}`)?.focus();
  };
  return <section ref={frameRef} className={`idea-lineage teacher-landing-graph${props.sectionMode?" il-section":""}`} aria-labelledby={props.sectionMode?undefined:"lineage-heading"} aria-label={props.sectionMode?"Connections between works":undefined} style={{"--thread":toneVar(chain.field),"--scholar-panel-height":`${frameHeight}px`} as CSSProperties}>
    <div className="il-frame">
    <header className="il-header">{!props.sectionMode&&(<div className="il-heading"><h2 id="lineage-heading">Knowledge, <em>handed on.</em></h2><div className="il-views" role="group" aria-label="Graph view"><button type="button" aria-label="Connections view" title="Connections" aria-pressed={view==="lineage"} onClick={()=>setView("lineage")}><Route size={16} aria-hidden="true"/></button><button type="button" aria-label="Birth-year timeline view" title="Through time" aria-pressed={view==="timeline"} onClick={()=>props.onTimeline?props.onTimeline():setView("timeline")}><Clock size={16} aria-hidden="true"/></button></div></div>)}{view==="lineage"?<div role="tablist" aria-label="Choose a field">{IDEA_CHAINS.map((item,index)=><button key={item.field} type="button" role="tab" id={`lineage-tab-${index}`} aria-selected={index===active} aria-controls="lineage-panel" tabIndex={index===active?0:-1} onClick={()=>choose(index)} onKeyDown={event=>navigate(event,index)} style={{"--field":toneVar(item.field)} as CSSProperties}>{item.label}</button>)}</div>:<div className="il-timeline-controls" ref={setControlsHost}/>}</header>
    <div className="il-overview">
    {view==="timeline"?<ScholarTimeline {...props} controlsHost={controlsHost}/>:<div id="lineage-panel" role="tabpanel" aria-labelledby={`lineage-tab-${active}`}>
      <ol className="il-timeline" style={{"--steps":chain.nodes.length} as CSSProperties} aria-label={`${chain.label}: works in chronological order`}>
        {chain.nodes.map((step,index)=><li key={`${chain.field}-${index}`} className={index===selected?"il-selected":""}>
          {index<chain.nodes.length-1&&<div className="il-link" aria-hidden="true"><span>{chain.nodes[index+1].link}</span></div>}
          <button type="button" className="il-step" aria-pressed={index===selected} aria-expanded={index===selected} aria-label={`${step.date}: ${step.name}, ${step.work}`} onClick={()=>setSelected(index)} aria-controls="lineage-detail">
            <span className="il-caption"><small>{step.date}</small><strong>{step.name}</strong><em>{step.work}</em></span>
            <span className="il-mark" aria-hidden="true">{step.initials}</span>
          </button>
        </li>)}
      </ol>
    </div>}
    </div>
    </div>
    {view==="lineage"&&<div className={`il-reveal${selected!==null?" is-open":""}`} aria-hidden={selected===null}>
        <div className="il-reveal-inner">
          <div ref={detailRef} className="il-detail" id="lineage-detail" aria-live="polite" aria-atomic="true"><div className="il-detail-label"><small>{String((selected??0)+1).padStart(2,"0")} / {String(chain.nodes.length).padStart(2,"0")}</small><strong>{node.link}</strong><span>{node.name}</span></div><div><p>{node.detail}</p>{entry?<p className="il-population-link"><button type="button" onClick={e=>entry.scholar?props.onOpen(entry.scholar.id,e.currentTarget):filterCatalogue({q:entry.id})}>{entry.scholar?"Open profile":"Explore library works"}</button> <small>{entry.id}</small></p>:<small>Historical milestone · no verified library identity link</small>}</div><a href={node.source} target="_blank" rel="noreferrer" title={node.sourceLabel} tabIndex={selected===null?-1:0}>Read the source <ArrowUpRight size={14} aria-hidden="true"/></a></div>
        </div>
      </div>}
  </section>;
}
