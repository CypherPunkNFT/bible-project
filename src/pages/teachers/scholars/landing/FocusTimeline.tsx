import {useState,useMemo,useLayoutEffect,useRef,useCallback,useId,type CSSProperties} from 'react';
import {ArrowUpRight,ChevronDown} from 'lucide-react';
import {useScholars} from '../context';
import {eligibleBirth,dateLabel} from '../population';
import {toneVar,initials} from '../marks/shapes';
import type {Field} from '@/data/teachers/pages-types';
import type {LibraryPerson} from '../catalogue/library';
import {ContributorDetails} from '../catalogue/ContributorDetails';
import {focusLayout,focusName} from './focus-timeline';
import type {ScholarTimelineProps} from './ScholarTimeline';
import './focus-timeline.css';

export function FocusTimeline({data,matches,searching,onOpen}:ScholarTimelineProps){
 const {library,libraryError}=useScholars(),id=useId();
 const frame=useRef<HTMLDivElement>(null),periodPanel=useRef<HTMLDivElement>(null),nameButton=useRef<HTMLButtonElement>(null);
 const [width,setWidth]=useState(0),[selected,setSelected]=useState<string|null>(null),[expanded,setExpanded]=useState<number|null>(null),[query,setQuery]=useState(''),[details,setDetails]=useState<LibraryPerson|null>(null);
 useLayoutEffect(()=>{const el=frame.current;if(!el)return;const measure=()=>setWidth(el.clientWidth);measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[]);
 const people=useMemo(()=>(library??[]).filter(p=>eligibleBirth(p)!==null&&(!searching||matches.has(p.id)||Boolean(p.scholar&&matches.has(p.scholar.id)))),[library,searching,matches]);
 const layout=useMemo(()=>focusLayout(people.map(p=>({id:p.id,name:p.name,born:eligibleBirth(p)!})),width),[people,width]);
 const byId=useMemo(()=>new Map(people.map(p=>[p.id,p])),[people]);
 const person=selected?byId.get(selected):undefined,group=expanded===null?null:layout.groups[expanded];
 const shown=useMemo(()=>{const words=query.toLocaleLowerCase().split(/\s+/).filter(Boolean);return group?.people.filter(p=>words.every(w=>p.name.toLocaleLowerCase().includes(w)))??[];},[group,query]);
 const closeDetails=useCallback(()=>setDetails(null),[]);
 const closePeriod=()=>{const old=expanded;setExpanded(null);if(old!==null)frame.current?.querySelector<HTMLButtonElement>(`[data-period="${old}"]`)?.focus({preventScroll:true});};
 useLayoutEffect(()=>{if(expanded!==null)periodPanel.current?.querySelector<HTMLButtonElement>('.ft-collapse')?.focus({preventScroll:true});},[expanded]);
 const tone=(p:LibraryPerson)=>{const field=p.scholar?.field??Object.keys(p.fields)[0] as Field|undefined;return field?toneVar(field):'var(--muted)';};
 const mark=(p:LibraryPerson,placed=false)=>{const position=layout.positions.get(p.id);return <button type="button" key={p.id} data-contributor={p.id} className={`ft-circle${placed?' ft-placed':''}${selected===p.id?' ft-selected':''}`} aria-label={`${focusName(p.name)}, ${dateLabel(p)}`} aria-pressed={selected===p.id} style={{'--tone':tone(p),...(placed?{left:position?.x,top:position?.y}:{})} as CSSProperties} onClick={()=>setSelected(p.id)}>{initials({name:focusName(p.name)})}</button>;};
 return <><div className="focus-timeline teacher-landing-graph" aria-label="Contributors through time" style={{'--ft-r':`${layout.radius}px`} as CSSProperties}>
  <div className="ft-heading"><p className="ft-caption"><i/>Each circle is one teacher, placed by the year they were born.</p><ul className="ft-legend" aria-label="Contributor subjects">{Object.entries(data.fields).map(([field,label])=><li key={field}><i style={{background:toneVar(field as Field)}}/>{label}</li>)}<li><i style={{background:'var(--muted)'}}/>Unassigned</li></ul>{person&&<button ref={nameButton} type="button" className="ft-name" style={{'--tone':tone(person)} as CSSProperties} onClick={event=>person.scholar?onOpen(person.scholar.id,event.currentTarget):setDetails(person)}><strong>{focusName(person.name)}</strong><span>{person.facts?.dates.approximate?'c. ':''}{eligibleBirth(person)}–{person.facts?.dates.died??''}</span><ArrowUpRight size={12}/></button>}</div>
  <div className="ft-scroll" ref={frame}><div className="ft-band" style={{width:layout.width,height:layout.height}}>
   <svg className="ft-art" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">{layout.groups.map(g=><line key={g.start} x1={g.x} x2={g.x} y1="48" y2="384"/>)}<line x1={layout.year2000} x2={layout.year2000} y1="48" y2="384"/><path d={layout.path}/><circle cx={layout.today.x} cy={layout.today.y} r="3"/></svg>
   {layout.groups.map((g,i)=><div key={g.start}><span className="ft-year" style={{left:g.x}} aria-hidden="true">{g.start}</span><button type="button" className="ft-period" data-period={i} style={{left:g.x,width:Math.max(22,g.right-g.x)}} disabled={!g.people.length} aria-label={`Expand ${g.start} to ${g.end}, ${g.people.length} contributors${g.hidden?`, ${g.hidden} more`:''}`} aria-expanded={expanded===i} aria-controls={`${id}-period`} onClick={()=>{setQuery('');setExpanded(i);}}>{g.hidden>0?`+${g.hidden.toLocaleString()}`:''}</button></div>)}
   <span className="ft-year ft-year-2000" style={{left:layout.year2000}} aria-hidden="true">2000</span><span className="ft-year ft-today" style={{left:layout.today.x}}>Today</span>
   {people.filter(p=>layout.positions.has(p.id)).map(p=>mark(p,true))}
  </div></div>
  {!library&&<p className="ft-status" role="status">{libraryError||'Loading contributors…'}</p>}{library&&people.length===0&&<p className="ft-status">No supported birth years match this search.</p>}
  {group&&<div ref={periodPanel} id={`${id}-period`} className="ft-expansion" role="region" aria-label={`${group.start} to ${group.end} contributors`} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();closePeriod();}}}><div className="ft-expansion-bar"><span>{group.start}–{group.end} · {group.people.length.toLocaleString()}</span><input type="search" aria-label="Find a contributor in this period" placeholder="Find a contributor" value={query} onChange={event=>setQuery(event.target.value)}/><button type="button" className="ft-collapse" aria-label="Close expanded period" onClick={closePeriod}><ChevronDown size={17}/></button></div><div className="ft-dots">{shown.map(p=>mark(byId.get(p.id)!))}{!shown.length&&<p>No contributors match this search.</p>}</div></div>}
 </div>{details&&<ContributorDetails person={details} origin={nameButton.current} onClose={closeDetails}/>}</>;
}
