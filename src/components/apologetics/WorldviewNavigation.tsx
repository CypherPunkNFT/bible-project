import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ChevronDown} from 'lucide-react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {MosqueIcon} from './MosqueIcon';
import {main, worlds, islamPages, groupFor, secondary, currentIslam} from '@/lib/apologetics-navigation';

const root='/apologetics/worldviews';
type World=(typeof worlds)[number];
function reveal(e:React.FocusEvent<HTMLElement>){e.currentTarget.scrollIntoView({block:'nearest',inline:'nearest'});}
function Glyph({world}:{world:World}){
 const id=world.to.split('/').pop();

 if(id==='islam')return <MosqueIcon/>;
 return <svg className="sm-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{id==='secular'?<>
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
 return <nav className="sm-study-links" aria-label={world.label+' subpages'}>{pagesFor(world).map(p=><Link key={p.label} to={p.to} onFocus={reveal} aria-current={location.pathname.startsWith(world.to)&&p.to===active?'page':undefined}>{p.label}</Link>)}</nav>;
}
function WorldChoices(){
 const location=useLocation();
 return <nav className="sm-world-choices" aria-label="Worldview collections">{worlds.map(w=><Link key={w.to} to={w.to} onFocus={reveal} title={w.label} aria-label={w.label} aria-current={location.pathname.startsWith(w.to)?'page':undefined} style={{'--wv-accent':w.accent} as React.CSSProperties}><Glyph world={w}/><span className="sm-world-label" aria-hidden="true"><span className="sm-world-name">{w.label}</span></span><span className="sm-tooltip" aria-hidden="true">{w.label}</span></Link>)}</nav>;
}
function WorldviewSubmenu(){
 const location=useLocation();
 const reduced=useReducedMotion();
 const world=worlds.find(w=>location.pathname.startsWith(w.to));
 return <div className={'sm-dock-row'+(!world?' sm-world-index':'')} style={{'--sm-tone':world?.accent??'var(--poetry)'} as React.CSSProperties}>
  <WorldChoices/><div className="sm-world-detail-slot"><AnimatePresence initial={false}>{world&&<motion.div key="details" className="sm-world-detail" initial={{opacity:0}} animate={{opacity:1,transition:{duration:reduced?0:.18,delay:reduced?0:.4}}} exit={{opacity:0,transition:{duration:reduced?0:.12}}}>
   <span className="sm-current"><span className="sm-current-sizing" aria-hidden="true">{worlds.map(w=><span key={w.to}>{w.label}</span>)}</span><AnimatePresence mode="wait" initial={false}><motion.span key={world.to} className="sm-current-label" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.13}} style={{color:world.accent}}>{world.label}</motion.span></AnimatePresence></span>
   <div className="sm-study-slot"><StudyLinks world={world}/></div>
  </motion.div>}</AnimatePresence></div>
 </div>;
}
export function WorldviewNavigation({savedCount=0}:{savedCount?:number}){
 const location=useLocation(),group=groupFor(location.pathname);
 const reduced=useReducedMotion();
 const [opened,setOpened]=useState<string|null>(group==='Worldviews'?'Worldviews':null);
 const trigger=useRef<HTMLButtonElement|null>(null),previous=useRef(location.pathname);
 useEffect(()=>{if(previous.current!==location.pathname)setOpened(group==='Worldviews'?'Worldviews':null);previous.current=location.pathname;},[location.pathname,group]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&opened&&!document.querySelector('dialog[open]')){setOpened(null);trigger.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[opened]);
 return <div className="sm-container"><nav className="sm-main" aria-label="Apologetics sections">{main.map(d=><div key={d.to} data-current={group===d.label}><Link to={d.to} onFocus={reveal} aria-current={group===d.label?'page':undefined}>{d.label}{d.label==="My study"&&savedCount>0&&<span className="sm-saved-count">{savedCount}</span>}</Link><button ref={d.label===group?el=>{if(!trigger.current)trigger.current=el;}:undefined} aria-label={(opened===d.label?'Collapse ':'Browse ')+d.label} aria-expanded={opened===d.label} aria-controls="sm-panel" onClick={e=>{trigger.current=e.currentTarget;setOpened(opened===d.label?null:d.label);}}><ChevronDown size={12}/></button></div>)}</nav>
 <AnimatePresence initial={false}>{opened&&<motion.div id="sm-panel" className="sm-panel" key="submenu" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1,transitionEnd:{overflow:'visible'}}} exit={{height:0,opacity:0,overflow:'hidden'}} style={{overflow:'hidden'}} transition={{duration:reduced?0:.26,ease:[.22,1,.36,1]}}><motion.div initial={{y:reduced?0:-10}} animate={{y:0}} transition={{duration:reduced?0:.26,ease:[.22,1,.36,1]}}>{opened==='Worldviews'?<WorldviewSubmenu/>:<nav className="sm-other-sections" aria-label={opened+' destinations'}>{secondary(opened).map(d=><Link key={d.to} to={d.to} onFocus={reveal} onClick={()=>setOpened(null)}>{d.label}</Link>)}</nav>}</motion.div></motion.div>}</AnimatePresence>
 </div>;
}
