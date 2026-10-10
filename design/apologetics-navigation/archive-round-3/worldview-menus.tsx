import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ArrowRight, ChevronDown, Globe2} from 'lucide-react';
import {main, worlds, islamPages, groupFor, secondary, currentIslam, useDesign} from './preview';

const root='/apologetics/worldviews';
type World=(typeof worlds)[number];
function Glyph({world}:{world:World}){
 const id=world.to.split('/').pop();
 return <svg className="sm-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">{id==='islam'?<><path d="M9 34V19C9 10 15 7 20 3c5 4 11 7 11 16v15M5 35h30M14 33V21c3-2 6-2 6 0 0-2 3-2 6 0v12c-3-2-6-2-6 0-3-2-4-2-6 0ZM20 21v12"/></>:id==='secular'?<><circle cx="20" cy="20" r="13"/><ellipse cx="20" cy="20" rx="6" ry="13"/><path d="M7 20h26M10 12h20M10 28h20M3 20H0M40 20h-3"/></>:id==='buddhism'?<><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="5"/><path d="M20 6v9m0 10v9M6 20h9m10 0h9M10 10l6.5 6.5m7 7L30 30M10 30l6.5-6.5m7-7L30 10"/></>:<><path d="M20 31C9 27 9 13 20 5c11 8 11 22 0 26ZM20 31C8 32 3 23 3 14c8 1 14 5 17 17Zm0 0c12 1 17-8 17-17-8 1-14 5-17 17ZM6 35h28"/></>}</svg>;
}
function pagesFor(world:World){
 if(world.to===root+'/islam')return islamPages;
 return [{label:'Overview',to:world.to},{label:'Examine the claims',to:world.to+'#comparison'},{label:'Read the source texts',to:world.to+'#wv-context-heading'},{label:'Connected studies',to:world.to+'#conversation-studies'}];
}
function StudyLinks({world}:{world:World}){
 const location=useLocation();
 const active=world.to===root+'/islam'?currentIslam(location.pathname,location.search).to:location.pathname+location.hash;
 return <nav className="sm-study-links" aria-label={world.label+' subpages'}>{pagesFor(world).map(p=><Link key={p.to} to={p.to} onFocus={e=>e.currentTarget.scrollIntoView({block:"nearest",inline:"nearest"})} aria-current={location.pathname.startsWith(world.to)&&p.to===active?'page':undefined}>{p.label}<ArrowRight size={13}/></Link>)}</nav>;
}
function WorldChoices({icons=false,onChoose}:{icons?:boolean;onChoose?:()=>void}){
 const location=useLocation();
 return <nav className={'sm-world-choices'+(icons?' sm-icon-choices':'')} aria-label="Worldview collections">{worlds.map(w=><Link key={w.to} to={w.to} onClick={onChoose} aria-label={w.label} aria-current={location.pathname.startsWith(w.to)?'page':undefined} style={{'--wv-accent':w.accent} as React.CSSProperties}><Glyph world={w}/><span>{w.label}</span></Link>)}</nav>;
}
function WorldviewSubmenu(){
 const design=useDesign(),location=useLocation();
 const active=worlds.find(w=>location.pathname.startsWith(w.to));
 const world=active??worlds[0];
 const [choices,setChoices]=useState(!active);
 const selector=useRef<HTMLButtonElement>(null),popup=useRef<HTMLDivElement>(null);
 useEffect(()=>{setChoices(!active);},[location.pathname]);
 useEffect(()=>{if(design!=='c'||!choices)return;const outside=(e:PointerEvent)=>{if(!popup.current?.contains(e.target as Node))setChoices(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[design,choices]);
 function dismiss(){setChoices(false);selector.current?.focus();}
 function key(e:React.KeyboardEvent){if(e.key==='Escape'&&choices&&active){e.stopPropagation();e.nativeEvent.stopImmediatePropagation();dismiss();}}
 const title=<span className="sm-current sm-label"><Globe2 size={17}/><span>{world.label}</span></span>;
 const choose=<button ref={selector} className="sm-current" aria-label={choices?'Show '+world.label+' subpages':'Choose another worldview'} aria-expanded={choices} aria-controls="sm-world-picker" onClick={()=>setChoices(!choices)}><Globe2 size={17}/><span>{active?world.label:'Worldviews'}</span><ChevronDown size={15}/></button>;
 if(design==='a')return <div className="sm-swap" onKeyDown={key}>{choose}<div className="sm-fade-stage">
  <div className={'sm-fade-layer'+(!choices?' is-visible':'')} inert={choices?true:undefined} aria-hidden={choices}><StudyLinks world={world}/></div>
  <div id="sm-world-picker" className={'sm-fade-layer'+(choices?' is-visible':'')} inert={!choices?true:undefined} aria-hidden={!choices}><WorldChoices onChoose={dismiss}/></div>
 </div></div>;
 if(design==='b')return <div className="sm-rail-layout"><div className="sm-rail"><WorldChoices icons/></div><div className="sm-subpage-row" key={world.to}>{title}<StudyLinks world={world}/></div></div>;
 if(design==='c')return <div className="sm-popover-row" onKeyDown={key}><div ref={popup} className="sm-picker-anchor">{choose}{choices&&<div id="sm-world-picker" className="sm-popover"><WorldChoices onChoose={dismiss}/></div>}</div><StudyLinks world={world}/></div>;
 return <div className="sm-dock-row"><WorldChoices icons/><div className="sm-subpage-row" key={world.to}>{title}<StudyLinks world={world}/></div></div>;
}
export function WorldviewNavigation(){
 const location=useLocation(),design=useDesign(),group=groupFor(location.pathname);
 const [opened,setOpened]=useState<string|null>(group==='Worldviews'?'Worldviews':null);
 const trigger=useRef<HTMLButtonElement|null>(null),previous=useRef(location.pathname);
 useEffect(()=>{if(previous.current!==location.pathname)setOpened(group==='Worldviews'?'Worldviews':null);previous.current=location.pathname;},[location.pathname]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&opened){setOpened(null);trigger.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[opened]);
 return <div className="sm-container"><nav className="sm-main" aria-label="Apologetics sections">{main.map(d=><div key={d.to} data-current={group===d.label}><Link to={d.to} aria-current={group===d.label?'page':undefined}>{d.label}</Link><button ref={d.label===group?el=>{if(!trigger.current)trigger.current=el;}:undefined} aria-label={(opened===d.label?'Collapse ':'Browse ')+d.label} aria-expanded={opened===d.label} aria-controls="sm-panel" onClick={e=>{trigger.current=e.currentTarget;setOpened(opened===d.label?null:d.label);}}><ChevronDown size={12}/></button></div>)}</nav>
 {opened&&<div id="sm-panel" className="sm-panel">{opened==='Worldviews'?<WorldviewSubmenu key={design}/>:<nav className="sm-other-sections" aria-label={opened+' destinations'}>{secondary(opened).map(d=><Link key={d.to} to={d.to} onClick={()=>setOpened(null)}>{d.label}<ArrowRight size={14}/></Link>)}</nav>}</div>}
 </div>;
}
