import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ArrowRight, ChevronDown, ChevronLeft, Globe2} from 'lucide-react';
import {CollectionArt} from '@/pages/WorldviewsPage';
import {main, worlds, islamPages, groupFor, secondary, currentIslam, useDesign} from './preview';

const root='/apologetics/worldviews';
type World=(typeof worlds)[number];
function pagesFor(world:World){
  if(world.to===root+'/islam')return islamPages;
  return [
    {label:'Overview',to:world.to},
    {label:'Examine the claims',to:world.to+'#comparison'},
    {label:'Read the source texts',to:world.to+'#wv-context-heading'},
    {label:'Connected studies',to:world.to+'#conversation-studies'},
  ];
}
function StudyLinks({world}:{world:World}){
  const location=useLocation();
  const active=world.to===root+'/islam'?currentIslam(location.pathname,location.search).to:location.pathname+location.hash;
  return <nav className="sm-study-links" aria-label={world.label+' subpages'}>{pagesFor(world).map(p=><Link key={p.to} to={p.to} aria-current={location.pathname.startsWith(world.to)&&p.to===active?'page':undefined}>{p.label}<ArrowRight size={13}/></Link>)}</nav>;
}
function WorldChoices(){
  const location=useLocation();
  return <nav className="sm-world-choices" aria-label="Worldview collections">{worlds.map(w=><Link key={w.to} to={w.to} aria-current={location.pathname.startsWith(w.to)?'page':undefined} style={{'--wv-accent':w.accent} as React.CSSProperties}><CollectionArt id={w.to.split('/').pop()!}/><span>{w.label}</span><ArrowRight size={14}/></Link>)}</nav>;
}
function WorldviewSubmenu(){
  const design=useDesign(),location=useLocation();
  const active=worlds.find(w=>location.pathname.startsWith(w.to));
  const [expanded,setExpanded]=useState(true),[choices,setChoices]=useState(!active),[card,setCard]=useState(active?.to??'');
  const previous=useRef(location.pathname);
  useEffect(()=>{if(previous.current!==location.pathname){setExpanded(true);setChoices(!active);setCard(active?.to??'');}previous.current=location.pathname;},[location.pathname]);
  const world=active??worlds[0];
  if(design==='a')return <div className="sm-swap">
    {active&&<button className="sm-current" aria-expanded={!choices} aria-controls="sm-current-pages" onClick={()=>setChoices(!choices)} aria-label={choices?'Show '+active.label+' subpages':'Collapse '+active.label+' subpages and choose another worldview'}><Globe2 size={17}/><span>{active.label}</span>{choices?<ChevronLeft size={15}/>:<ChevronDown size={15}/>}</button>}
    {choices||!active?<WorldChoices/>:<div id="sm-current-pages"><StudyLinks world={active}/></div>}
  </div>;
  if(design==='b')return <div className="sm-split"><WorldChoices/><div className="sm-split-pages"><button className="sm-current" aria-expanded={expanded} aria-controls="sm-current-pages" onClick={()=>setExpanded(!expanded)} aria-label={(expanded?'Collapse ':'Expand ')+world.label+' subpages'}><span>{world.label}</span><ChevronDown size={15}/></button>{expanded&&<div id="sm-current-pages"><StudyLinks world={world}/></div>}</div></div>;
  if(design==='c')return <div className="sm-tabs"><div className="sm-peer-row"><nav aria-label="Worldview collections">{worlds.map(w=><Link key={w.to} to={w.to} aria-current={active?.to===w.to?'page':undefined} style={{'--sm-accent':w.accent} as React.CSSProperties}><span/>{w.label}</Link>)}</nav>{active&&<button className="sm-collapse" aria-label={(expanded?'Collapse ':'Expand ')+active.label+' subpages'} aria-expanded={expanded} aria-controls="sm-current-pages" onClick={()=>setExpanded(!expanded)}><ChevronDown size={16}/></button>}</div>{active&&expanded&&<div id="sm-current-pages"><StudyLinks world={active}/></div>}</div>;
  return <div className="sm-accordion" aria-label="Worldview collections">{worlds.map(w=><section key={w.to} className={card===w.to?'is-expanded':''} style={{'--wv-accent':w.accent} as React.CSSProperties}><div className="sm-card-heading"><Link to={w.to} aria-current={active?.to===w.to?'page':undefined}><CollectionArt id={w.to.split('/').pop()!}/><span>{w.label}</span></Link><button aria-label={(card===w.to?'Collapse ':'Expand ')+w.label+' subpages'} aria-expanded={card===w.to} aria-controls={'sm-card-'+w.to.split('/').pop()} onClick={()=>setCard(card===w.to?'':w.to)}><ChevronDown size={16}/></button></div>{card===w.to&&<div id={'sm-card-'+w.to.split('/').pop()}><StudyLinks world={w}/></div>}</section>)}</div>;
}

export function WorldviewNavigation(){
  const location=useLocation(),design=useDesign(),group=groupFor(location.pathname);
  const [opened,setOpened]=useState<string|null>(group==='Worldviews'?'Worldviews':null);
  const trigger=useRef<HTMLButtonElement|null>(null);
  const previous=useRef(location.pathname);
  useEffect(()=>{if(previous.current!==location.pathname)setOpened(group==='Worldviews'?'Worldviews':null);previous.current=location.pathname;},[location.pathname]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&opened){setOpened(null);trigger.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[opened]);
  return <div className="sm-container"><nav className="sm-main" aria-label="Apologetics sections">{main.map(d=><div key={d.to}><Link to={d.to} aria-current={group===d.label?'page':undefined}>{d.label}</Link><button ref={d.label===group?el=>{if(!trigger.current)trigger.current=el;}:undefined} aria-label={(opened===d.label?'Collapse ':'Browse ')+d.label} aria-expanded={opened===d.label} aria-controls="sm-panel" onClick={e=>{trigger.current=e.currentTarget;setOpened(opened===d.label?null:d.label);}}><ChevronDown size={12}/></button></div>)}</nav>
    {opened&&<div id="sm-panel" className="sm-panel">{opened==='Worldviews'?<WorldviewSubmenu key={design}/>:<nav className="sm-other-sections" aria-label={opened+' destinations'}>{secondary(opened).map(d=><Link key={d.to} to={d.to} onClick={()=>setOpened(null)}>{d.label}<ArrowRight size={14}/></Link>)}</nav>}</div>}
  </div>;
}
