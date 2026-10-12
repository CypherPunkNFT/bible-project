import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Expand, Minus, Plus, RotateCcw, X } from "lucide-react";
import type { Field, ScholarsData } from "@/data/teachers/pages-types";
import { useMediaQuery } from "../marks/dom";
import { MarkInner } from "../marks/Mark";
import { toneVar } from "../marks/shapes";
import { useScholars } from "../context";
import { buildSky, type SkyPerson } from "./layout";
import "./explorer.css";
interface SkyProps { data: ScholarsData; matches: ReadonlySet<string>; searching: boolean; onOpen: (id: string, origin: Element | null) => void }
interface View { x:number; y:number; w:number; h:number }
const FIELDS:Field[] = ["history","texts","places","reference","theology"];
export function Constellation(props: SkyProps) {
  const { library, filterCatalogue } = useScholars();
  const extras = useMemo(() => {
    const ids = ["field-5904385354bfce0cf96a", "field-20c4bf2eb957d5ad0c6b", "field-d3b4db3da2e5b0c107c2", "field-3911a076637923d533bf", "field-65dc74ebf80d23232d90", "field-f47918059287d0be5da0", "field-976ca3a901922198bda8"];
    return ids.flatMap((id, i) => {
      const p = library?.find(p => p.id === id);
      if (!p) return [];
      const field = i < 3 ? "theology" as const : i < 5 ? "history" as const : "places" as const;
      return [{ id:p.id, name:p.name, field, born:p.facts?.dates.born, site:null, records:p.records, work:p.fields[field]?.example?.title }];
    });
  }, [library]);

  const narrow = useMediaQuery("(max-width: 760px)");
  const sky = useMemo(()=>buildSky({...props.data,scholars:[...props.data.scholars,...extras]},"band"),[props.data,extras]);
  const [active,setActive] = useState<Field|"">("");
  const selected = active || (narrow ? "history" : "");
  const home = useMemo<View>(()=>{
    if (!selected) return {x:0,y:0,w:sky.w,h:sky.h};
    const nodes=sky.nodes.filter(n=>n.s.field===selected), pad=60;
    const x=Math.min(...nodes.map(n=>n.x))-pad,y=Math.min(...nodes.map(n=>n.y))-pad;
    return {x,y,w:Math.max(...nodes.map(n=>n.x))-x+pad,h:Math.max(...nodes.map(n=>n.y))-y+pad+40};
  },[sky,selected]);
  const [view,setView]=useState<View>(home), [expanded,setExpanded]=useState(false), [hover,setHover]=useState<SkyPerson|null>(null);
  const frame=useRef<HTMLDivElement>(null), canvas=useRef<SVGSVGElement>(null), expandButton=useRef<HTMLButtonElement>(null);
  const drag=useRef<{x:number;y:number;view:View;id?:string;origin:Element|null;moved:boolean}|null>(null);
  useEffect(()=>{setView(home);setHover(null);},[home]);
  useEffect(()=>{
    if(!expanded)return;
    const returnFocus=expandButton.current;
    const previous=document.documentElement.style.overflow;document.documentElement.style.overflow="hidden";
    frame.current?.querySelector<HTMLButtonElement>('[aria-label="Close explorer"]')?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==="Escape"){e.preventDefault();setExpanded(false);}
      if(e.key==="Tab"){
        const all=[...(frame.current?.querySelectorAll<HTMLElement>('button,[tabindex="0"]')??[])];
        const first=all[0],last=all.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown",key);
    return()=>{document.documentElement.style.overflow=previous;document.removeEventListener("keydown",key);returnFocus?.focus();};
  },[expanded]);
  const zoom=(factor:number)=>setView(v=>{const w=Math.max(home.w*.35,Math.min(sky.w*1.5,v.w*factor)),h=v.h*w/v.w;return {x:v.x+(v.w-w)/2,y:v.y+(v.h-h)/2,w,h};});
  const open=(id:string,origin:Element|null)=>{setExpanded(false);const entry=extras.find(p=>p.id===id);if(entry)filterCatalogue({q:entry.name.toLocaleLowerCase()});else props.onOpen(id,origin);};
  const down=(e:PointerEvent<SVGSVGElement>)=>{
    if(e.button!==0)return;const node=(e.target as Element).closest<SVGGElement>('[data-id]');
    drag.current={x:e.clientX,y:e.clientY,view,id:node?.dataset.id,origin:node,moved:false};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move=(e:PointerEvent<SVGSVGElement>)=>{
    const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(Math.hypot(dx,dy)>5)d.moved=true;
    if(d.moved){setHover(null);const rect=e.currentTarget.getBoundingClientRect(),scale=Math.min(rect.width/d.view.w,rect.height/d.view.h);setView({...d.view,x:d.view.x-dx/scale,y:d.view.y-dy/scale});}
  };
  const up=(e:PointerEvent<SVGSVGElement>)=>{const d=drag.current;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(d&&!d.moved&&d.id)open(d.id,d.origin);};
  const title=selected?props.data.fields[selected]:"Five fields of study";
  return <div className={`cg${expanded?" cg-expanded":""}`} ref={frame} role={expanded?"dialog":"region"} aria-modal={expanded?true:undefined} aria-label="Explore scholars by subject">
    <div className="cg-toolbar"><span>{title}</span><div>
      <button type="button" aria-label="Zoom out" onClick={()=>zoom(1.25)}><Minus size={16}/></button>
      <button type="button" aria-label="Zoom in" onClick={()=>zoom(.8)}><Plus size={16}/></button>
      <button type="button" aria-label="Reset graph" onClick={()=>{setActive("");setView(home);}}><RotateCcw size={15}/></button>
      <button type="button" ref={expandButton} aria-label={expanded?"Close explorer":"Expand explorer"} onClick={()=>setExpanded(v=>!v)}>{expanded?<X size={17}/>:<Expand size={17}/>}</button>
    </div></div>
    <div className="cg-fields" role="group" aria-label="Select a subject">{FIELDS.map(field=><button type="button" key={field} aria-pressed={selected===field} onClick={()=>setActive(selected===field&&!narrow?"":field)} style={{color:toneVar(field)}}>{props.data.fields[field]}<small>{sky.nodes.filter(n=>n.s.field===field).length}</small></button>)}</div>
    <div className="cg-canvas">
      <svg ref={canvas} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} aria-label="Scholar subject spirals" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null;}} onPointerLeave={()=>{if(!drag.current)setHover(null);}}>
        {sky.fields.map(f=><g key={f.field} opacity={selected&&selected!==f.field? .23:1}>
          <polyline points={f.own.map(n=>`${n.x},${n.y}`).join(' ')} fill="none" stroke={toneVar(f.field)} strokeWidth="1.3" opacity=".45"/>
          {f.own.map(n=><g className={`lnd-node${props.matches.has(n.s.id)?" lnd-match":""}`} key={n.s.id} data-id={n.s.id} data-field={n.s.field} transform={`translate(${n.x-22},${n.y-22})`} opacity={props.searching&&!props.matches.has(n.s.id)? .22:1} tabIndex={selected&&selected!==n.s.field?-1:0} role="button" aria-label={`${n.s.name}. ${extras.some(p=>p.id===n.s.id)?"Explore catalogue works":"Open the profile"}`} onMouseEnter={()=>{if(!drag.current)setHover(n.s);}} onFocus={()=>setHover(n.s)} onBlur={()=>setHover(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(n.s.id,e.currentTarget);}}}>
            <g transform="scale(.9167)"><MarkInner scholar={n.s}/></g>
            {n.s.site?.status==='in-use'&&<circle className="lnd-used-dot" cx="41" cy="1" r="3" fill="var(--accent)"/>}
          </g>)}
        </g>)}
      </svg>
      {hover&&<div className="cg-tip" role="status"><b>{hover.name}</b><span>{hover.work??props.data.scholars.find(p=>p.id===hover.id)?.works[0]?.[0]??props.data.fields[hover.field]}</span></div>}
    </div>
    <div className="cg-footer"><span>Choose a subject to focus · Drag to explore</span><span>{selected?`${sky.nodes.filter(n=>n.s.field===selected).length} selected contributors`:`${sky.nodes.length} selected contributors`}</span></div>
  </div>;
}
