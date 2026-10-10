import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ChevronDown} from 'lucide-react';
import {MosqueIcon,useMosque} from './mosque-icons';
import {main, worlds, islamPages, groupFor, secondary, currentIslam, useDesign} from './preview';

const root='/apologetics/worldviews';
type World=(typeof worlds)[number];
function reveal(e:React.FocusEvent<HTMLElement>){e.currentTarget.scrollIntoView({block:'nearest',inline:'nearest'});}
function Glyph({world,variant}:{world:World;variant?:number}){
 const id=world.to.split('/').pop();
 const mosque=useMosque();
 if(id==='islam')return <MosqueIcon variant={variant??mosque}/>;
 return <svg className="sm-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{id==='islam'?<>
  <path d="M2 36h36M10 35V23h20v12M11 22c0-6 6-8 9-12 3 4 9 6 9 12H11ZM20 10V7M22 2a3 3 0 1 0 2 5 3 3 0 0 1-2-5ZM17 35v-6a3 3 0 0 1 6 0v6M3 35V16h5v19M32 35V16h5v19M2 16h7L5.5 9 2 16ZM31 16h7l-3.5-7-3.5 7ZM5.5 9V6M34.5 9V6M3 21h5M32 21h5"/>
 </>:id==='secular'?<>
  <circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/>
  <ellipse cx="20" cy="20" rx="17" ry="6.5"/>
  <ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(60 20 20)"/>
  <ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(120 20 20)"/>
 </>:id==='buddhism'?<><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="5"/><path d="M20 6v9m0 10v9M6 20h9m10 0h9M10 10l6.5 6.5m7 7L30 30M10 30l6.5-6.5m7-7L30 10"/></>:<><path d="M20 31C9 27 9 13 20 5c11 8 11 22 0 26ZM20 31C8 32 3 23 3 14c8 1 14 5 17 17Zm0 0c12 1 17-8 17-17-8 1-14 5-17 17ZM6 35h28"/></>}</svg>;
}
function pagesFor(world:World){
 if(world.to===root+'/islam')return islamPages;
 return [{label:'Overview',to:world.to},{label:'Examine the claims',to:world.to+'#comparison'},{label:'Read the source texts',to:world.to+'#wv-context-heading'},{label:'Connected studies',to:world.to+'#conversation-studies'}];
}
function StudyLinks({world}:{world:World}){
 const location=useLocation();
 const active=world.to===root+'/islam'?currentIslam(location.pathname,location.search).to:location.pathname+location.hash;
 return <nav className="sm-study-links" aria-label={world.label+' subpages'}>{pagesFor(world).map(p=><Link key={p.to} to={p.to} onFocus={reveal} aria-current={location.pathname.startsWith(world.to)&&p.to===active?'page':undefined}>{p.label}</Link>)}</nav>;
}
function WorldChoices({variant}:{variant?:number}){
 const location=useLocation();
 return <nav className="sm-world-choices" aria-label="Worldview collections">{worlds.map(w=><Link key={w.to} to={w.to} onFocus={reveal} title={w.label} aria-label={w.label} aria-current={location.pathname.startsWith(w.to)?'page':undefined} style={{'--wv-accent':w.accent} as React.CSSProperties}><Glyph world={w} variant={variant}/><span className="sm-world-name">{w.label}</span><span className="sm-tooltip" aria-hidden="true">{w.label}</span></Link>)}</nav>;
}
function WorldviewSubmenu({variant}:{variant?:number}){
 const location=useLocation();
 const world=worlds.find(w=>location.pathname.startsWith(w.to));
 return <div className={'sm-dock-row'+(!world?' sm-world-index':'')} style={{'--sm-tone':world?.accent??'var(--poetry)'} as React.CSSProperties}>
  <WorldChoices variant={variant}/>{world&&<><span className="sm-current">{world.label}</span><StudyLinks world={world}/></>}
 </div>;
}
export function WorldviewNavigation(){
 const location=useLocation(),design=useDesign(),group=groupFor(location.pathname);
 const [opened,setOpened]=useState<string|null>(group==='Worldviews'?'Worldviews':null);
 const trigger=useRef<HTMLButtonElement|null>(null),previous=useRef(location.pathname);
 useEffect(()=>{if(previous.current!==location.pathname)setOpened(group==='Worldviews'?'Worldviews':null);previous.current=location.pathname;},[location.pathname]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&opened){setOpened(null);trigger.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[opened]);
 return <div className="sm-container"><nav className="sm-main" aria-label="Apologetics sections">{main.map(d=><div key={d.to} data-current={group===d.label}><Link to={d.to} onFocus={reveal} aria-current={group===d.label?'page':undefined}>{d.label}</Link><button ref={d.label===group?el=>{if(!trigger.current)trigger.current=el;}:undefined} aria-label={(opened===d.label?'Collapse ':'Browse ')+d.label} aria-expanded={opened===d.label} aria-controls="sm-panel" onClick={e=>{trigger.current=e.currentTarget;setOpened(opened===d.label?null:d.label);}}><ChevronDown size={12}/></button></div>)}</nav>
 {opened&&<div id="sm-panel" className="sm-panel">{opened==='Worldviews'?(new URLSearchParams(window.location.search).get('icons')==='rows'?<div className="mi-row-stack">{[1,2,4].map(n=><div className="mi-row-option" key={n} data-option={n}><span className="mi-row-number">{n}</span><WorldviewSubmenu variant={n}/></div>)}</div>:<WorldviewSubmenu key={design}/>):<nav className="sm-other-sections" aria-label={opened+' destinations'}>{secondary(opened).map(d=><Link key={d.to} to={d.to} onFocus={reveal} onClick={()=>setOpened(null)}>{d.label}</Link>)}</nav>}</div>}
 </div>;
}
