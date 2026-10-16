import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Field, ScholarsData } from '@/data/teachers/pages-types';
import { layoutArc } from '../../preachers/landing/arc';
import { toneVar } from '../marks/shapes';
import { useScholars } from '../context';
import { dateLabel, eligibleBirth } from '../population';
import { hasCatalogueField } from '../catalogue/library';
import type { LibraryPerson } from '../catalogue/library';
import './scholar-timeline.css';

export interface ScholarTimelineProps {
  data: ScholarsData; matches: ReadonlySet<string>; searching: boolean;
  onOpen: (id: string, origin: Element | null) => void;
  controlsHost?: HTMLElement | null;
}
const BATCH=160;
export function ScholarTimeline({data,matches,searching,onOpen,controlsHost}:ScholarTimelineProps) {
  const {library,filterCatalogue}=useScholars();
  const frame=useRef<HTMLDivElement>(null);
  const [width,setWidth]=useState(0),[hot,setHot]=useState<string|null>(null);
  const [page,setPage]=useState(0),[century,setCentury]=useState(''),[field,setField]=useState('');
  const dated=useMemo(()=>(library??[]).filter(p=>eligibleBirth(p)!==null).sort((a,b)=>eligibleBirth(a)!-eligibleBirth(b)!||a.id.localeCompare(b.id)),[library]);
  const filtered=useMemo(()=>dated.filter(p=>(!century||Math.floor(eligibleBirth(p)!/100)*100===Number(century))&&(!field||hasCatalogueField(p,field as Field))&&(!searching||matches.has(p.id)||Boolean(p.scholar&&matches.has(p.scholar.id)))),[dated,century,field,searching,matches]);
  const last=Math.max(0,Math.ceil(filtered.length/BATCH)-1),current=Math.min(page,last);
  const batch=useMemo(()=>filtered.slice(current*BATCH,(current+1)*BATCH),[filtered,current]);
  const centuries=useMemo(()=>[...new Set(dated.map(p=>Math.floor(eligibleBirth(p)!/100)*100))],[dated]);
  useLayoutEffect(()=>{
    const el=frame.current;if(!el)return;
    const observer=new ResizeObserver(()=>setWidth(el.clientWidth));setWidth(el.clientWidth);observer.observe(el);
    return()=>observer.disconnect();
  },[]);
  const layout=useMemo(()=>{
    if(!width||!batch.length)return null;
    const drawWidth=Math.max(900,width),scale=1.5;
    const start=Math.floor(eligibleBirth(dated[0])!/100)*100,end=new Date().getFullYear();
    const fraction=(year:number)=>year<1500?(year-start)/(1500-start)*.25:.25+(year-1500)/(end-1500)*.75;
    const plottedYear=(year:number)=>start+fraction(year)*(end-start);
    const base=layoutArc(batch.map(p=>({id:p.id,born:plottedYear(eligibleBirth(p)!)})),drawWidth*scale,start);
    const left=base.centuries[0].x,right=base.today.x;
    return {...base,width:drawWidth,height:base.height/scale,r:base.r/scale,
      positions:base.positions.map(p=>({...p,x:p.x/scale,y:p.y/scale})),
      centuries:[start,500,1000,1500,1600,1700,1800,1900,2000].filter((year,i,all)=>year>=start&&all.indexOf(year)===i).map(year=>({year,x:(left+fraction(year)*(right-left))/scale})),
      gridTop:base.gridTop/scale,gridBottom:base.gridBottom/scale,today:{x:base.today.x/scale,y:base.today.y/scale},artScale:scale};
  // Rendering is bounded to a chronological batch; every eligible identity is reachable.
  },[batch,dated,width]);
  const positions=new Map(layout?.positions.map(p=>[p.id,p]));
  function mark(p:LibraryPerson) {
    const pos=positions.get(p.id),f=Object.keys(p.fields)[0]as Field|undefined;
    return <button key={p.id} type="button" data-contributor={p.id} className={`st-mark${hot===p.id?' st-hot':''}${p.facts?.dates.approximate?' st-approximate':''}`} style={{'--tone':f?toneVar(f):'var(--muted)',left:pos?.x,top:pos?.y,width:layout?layout.r*2:36,height:layout?layout.r*2:36}as CSSProperties}
      aria-label={`${p.name}, ${dateLabel(p)}. ${p.scholar?'Open profile':'Explore works'}`} title={`${p.name} · ${dateLabel(p)}`} onPointerEnter={()=>setHot(p.id)} onFocus={()=>setHot(p.id)} onBlur={()=>setHot(null)} onClick={e=>p.scholar?onOpen(p.scholar.id,e.currentTarget):filterCatalogue({q:p.id})}>{p.name.split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join('')}</button>;
  }
  const compact=width>0&&width<560;
  const explanation=<div className="st-topline"><ul className="st-legend" aria-label="Contributor subjects">{Object.entries(data.fields).map(([key,label])=><li key={key}><i style={{background:toneVar(key as Field)}}/>{label}</li>)}<li><i className="st-unassigned"/>Unassigned</li></ul></div>;
  const controls=<div className="st-controls"><label>Birth century<select aria-label="Birth century" value={century} onChange={e=>{setCentury(e.target.value);setPage(0);}}><option value="">All birth centuries</option>{centuries.map(c=><option key={c} value={c}>{c}–{c+99}</option>)}</select></label><label>Subject<select aria-label="Timeline subject" value={field} onChange={e=>{setField(e.target.value);setPage(0);}}><option value="">All subjects</option>{Object.entries(data.fields).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><span aria-live="polite">{filtered.length?`${current*BATCH+1}–${Math.min((current+1)*BATCH,filtered.length)}`:'0'} of {filtered.length.toLocaleString()} eligible{searching?' search matches':''}</span><button type="button" disabled={!current} onClick={()=>{setPage(current-1);frame.current?.scrollTo({top:0});}}>Previous</button><label>Batch<select aria-label="Timeline batch" value={current} onChange={e=>{setPage(Number(e.target.value));frame.current?.scrollTo({top:0});}}>{Array.from({length:last+1},(_,i)=><option key={i} value={i}>{i+1} of {last+1}</option>)}</select></label><button type="button" disabled={current>=last} onClick={()=>{setPage(current+1);frame.current?.scrollTo({top:0});}}>Next {BATCH}</button></div>;
  return <div className="scholar-time" data-compact={compact} aria-label="Contributors through time">
    {controlsHost?createPortal(controls,controlsHost):controls}
    {explanation}
    <div ref={frame} className="st-scroll slim-scroll" tabIndex={0} role="region" aria-label="Birth-year circles; scroll to explore"><div className="st-band" style={layout?{height:layout.height,width:layout.width}:undefined} onPointerLeave={()=>setHot(null)}>
      {layout&&<svg className="st-art" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">{layout.centuries.map(c=><g key={c.year} data-year={c.year}><line x1={c.x} x2={c.x} y1={layout.gridTop} y2={layout.gridBottom}/><text x={c.x} y={layout.height-10} textAnchor="middle">{c.year}</text></g>)}<path d={layout.arcPath} transform={`scale(${1/layout.artScale})`}/><circle cx={layout.today.x} cy={layout.today.y} r="3"/></svg>}
      {layout&&batch.map(mark)}{library&&!batch.length&&<p>No supported birth years match this selection.</p>}{!library&&<p role="status">Loading complete contributor population…</p>}
    </div></div>
  </div>;
}
