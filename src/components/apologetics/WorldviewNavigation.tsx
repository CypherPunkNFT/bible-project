import {useEffect, useRef} from 'react';
import type {MouseEvent, ReactNode} from 'react';
import {flushSync} from 'react-dom';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {Compass, Globe2, CircleHelp, MessagesSquare, LibraryBig} from 'lucide-react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {MosqueIcon} from './MosqueIcon';
import {worlds, islamPages, secondary, currentIslam} from '@/lib/apologetics-navigation';

const base='/apologetics', root=base+'/worldviews';
type SectionTransition={finished:Promise<void>;skipTransition:()=>void};
type TransitionDocument=Document&{startViewTransition?:(update:()=>void)=>SectionTransition};
function clearSectionTransition(){
 delete document.documentElement.dataset.apSectionSlide;
 document.documentElement.style.removeProperty('--ap-old-shift');
}
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
 const path=location.pathname,active=world.to===root+'/islam'?currentIslam(path,location.search).to:path+location.hash;
 return <nav className="sm-study-links" aria-label={world.label+' subpages'}>{pagesFor(world).map(p=><Link key={p.label} to={p.to} onFocus={reveal} aria-current={path.startsWith(world.to)&&p.to===active?'page':undefined}>{p.label}</Link>)}</nav>;
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
export function WorldviewNavigation({leading,trailing}:{leading:ReactNode;trailing:ReactNode}){
 const location=useLocation(),path=location.pathname;
 const navigate=useNavigate();
 const group=path.startsWith(root)?'Worldviews':path.startsWith(base+'/debates')?'Debates':path.startsWith(base+'/topics/')||path.startsWith(base+'/questions')||path.startsWith(base+'/study/')||path.startsWith(base+'/practice')?'Questions':path.startsWith(base+'/sources')||path.startsWith(base+'/source-records')||path.startsWith(base+'/texts')?'Sources':'Explore';
 const singleRow=group==='Explore'||group==='Debates';
 const sections=[{label:'Explore',to:base,icon:Compass},{label:'Worldviews',to:root,icon:Globe2},{label:'Questions',to:base+'/questions',icon:CircleHelp},{label:'Debates',to:base+'/debates',icon:MessagesSquare},{label:'Sources',to:base+'/sources',icon:LibraryBig}];
 const mainRef=useRef<HTMLElement|null>(null);
 const run=useRef(0),active=useRef<{transition:SectionTransition;pathname:string;run:number}|null>(null);
 useEffect(()=>{
  const main=mainRef.current,selected=main?.querySelector<HTMLElement>('[data-current="true"]');
  if(!main||!selected||main.scrollWidth<=main.clientWidth)return;
  const row=main.getBoundingClientRect(),tab=selected.getBoundingClientRect();
  main.scrollLeft+=tab.left-row.left-(main.clientWidth-tab.width)/2;
 },[path]);
 useEffect(()=>{
  if(active.current&&active.current.pathname!==path){run.current++;active.current.transition.skipTransition();active.current=null;clearSectionTransition();}
 },[path]);
 useEffect(()=>()=>{run.current++;active.current?.transition.skipTransition();clearSectionTransition();},[]);
 function openSection(event:MouseEvent<HTMLDivElement>){
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const target=event.target;
  if(!(target instanceof Element))return;
  const anchor=target.closest('a[href]');
  if(!anchor||!event.currentTarget.contains(anchor)||anchor.hasAttribute('download')||anchor.getAttribute('target'))return;
  const destination=new URL(anchor.getAttribute('href')!,window.location.href);
  if(destination.origin!==window.location.origin||!destination.pathname.startsWith(base))return;
  const to=destination.pathname+destination.search+destination.hash;
  if(to===location.pathname+location.search+location.hash)return;
  if(destination.pathname===path&&destination.search===location.search&&destination.hash)return;
  event.preventDefault();
  const update=()=>flushSync(()=>navigate(to));
  const doc=document as TransitionDocument;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!doc.startViewTransition){update();return;}
  const generation=++run.current;
  active.current?.transition.skipTransition();
  const oldTop=document.querySelector('.ap-route-content')?.getBoundingClientRect().top;
  document.documentElement.dataset.apSectionSlide='3';
  const transition=doc.startViewTransition(()=>{
   if(generation!==run.current)return;
   update();
   const newTop=document.querySelector('.ap-route-content')?.getBoundingClientRect().top;
   if(oldTop!==undefined&&newTop!==undefined)document.documentElement.style.setProperty('--ap-old-shift',`${oldTop-newTop}px`);
  });
  active.current={transition,pathname:destination.pathname,run:generation};
  void transition.finished.catch(()=>undefined).then(()=>{if(generation!==run.current)return;active.current=null;clearSectionTransition();});
 }
 return <div className="sm-container" data-single-row={singleRow} onClickCapture={openSection}><div className="sm-topbar">{leading}<nav ref={mainRef} className="sm-main" aria-label="Apologetics sections">{sections.map(d=>{const Icon=d.icon;return <div key={d.to} data-current={group===d.label}><Link to={d.to} onFocus={reveal} aria-current={group===d.label?'page':undefined}><Icon size={17} strokeWidth={1.7} aria-hidden="true"/><span>{d.label}</span></Link></div>;})}</nav>{trailing}</div>
 {!singleRow&&<div id="sm-panel" className="sm-panel">{group==='Worldviews'?<WorldviewSubmenu/>:<nav className="sm-other-sections" aria-label={group+' destinations'}>{(group==='Sources'?[{label:'The source room',to:base+'/sources'},{label:'Historic Christian works',to:base+'/texts'}]:secondary(group)).map(d=><Link key={d.to} to={d.to} onFocus={reveal} aria-current={path===d.to?'page':undefined}>{d.label}</Link>)}</nav>}</div>}
 </div>;
}
