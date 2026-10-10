import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, ChevronDown, ChevronRight, Compass, Globe2, Grid2X2, HeartHandshake, Menu, MessageCircle, Route as RouteIcon, ScrollText, Search, ShieldCheck, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { CatalogProvider } from '@/lib/catalog-context';
import { DEBATES, PATHS, PRACTICE, STUDIES, TOPICS, WORLDVIEWS } from '@/data/apologetics-library';
import ApologeticsPage from '@/pages/ApologeticsPage';
import { CollectionArt } from '@/pages/WorldviewsPage';
import { Hub as IslamHub, Understanding, Ministry, Library, Article } from '../christianity-islam/preview';
import './preview.css';
import './variants.css';

const designs = [
  {id:'a',name:'Two rows',description:'Sections above, worldviews below, local study menu beside the page.'},
  {id:'b',name:'Mega-menu',description:'Open a section to see its collections; keep the reading page full width.'},
  {id:'c',name:'Library tree',description:'A persistent navigation tree keeps every level together at the side.'},
  {id:'d',name:'Context bar',description:'Choose a section, collection and study from compact cascading selectors.'},
  {id:'e',name:'Column browser',description:'Explore the library from left to right, then open your destination.'},
  {id:'f',name:'B + E',description:'Visible section links above the contained three-column browser.'},
];
const DesignContext=createContext('a');
const useDesign=()=>useContext(DesignContext);
const readDesign=()=>{const id=new URLSearchParams(window.location.search).get('d')?.toLowerCase();return designs.some(d=>d.id===id)?id!:'a';};

const base = '/apologetics';
const islam = base + '/worldviews/islam';
const guide = islam + '/guide';
type Destination = { label: string; to: string; detail?: string; accent?: string };
const main: Destination[] = [
  {label:'Explore',to:base}, {label:'Questions',to:base+'/questions'},
  {label:'Reformed theology',to:base+'/topics/reformed'}, {label:'Historic texts',to:base+'/texts'},
  {label:'Learning paths',to:base+'/paths'}, {label:'Worldviews',to:base+'/worldviews'},
  {label:'Debates',to:base+'/debates'}, {label:'Practice',to:base+'/practice'}, {label:'My study',to:base+'/saved'},
];
const worldviewNames: Record<string,string> = {islam:'Islam',secular:'Secular thought',buddhism:'Buddhism',hinduism:'Hinduism'};
const accents: Record<string,string> = {islam:'var(--poetry)',secular:'var(--epistles)',buddhism:'var(--accent)',hinduism:'var(--history)'};
const worlds: Destination[] = WORLDVIEWS.map(w => ({label:worldviewNames[w.id],to:base+'/worldviews/'+w.id,accent:accents[w.id],detail:w.description}));
const islamPages: Destination[] = [
  {label:'Overview',to:guide,detail:'A place to begin'},
  {label:'Understanding Islam',to:guide+'/understanding',detail:'Beliefs, texts & daily life'},
  {label:'Ministry',to:guide+'/ministry',detail:'Friendship & conversation'},
  {label:'Texts & studies',to:guide+'/library',detail:'Read in context'},
  {label:'Christianity & Islam',to:islam,detail:'Examine the claims'},
];
const browseGroups = [
  {label:'Explore the faith',links:main.slice(0,4)},
  {label:'Across beliefs',links:worlds},
  {label:'Put it into practice',links:main.slice(4).filter(x=>x.label!=='Worldviews'&&x.label!=='My study')},
  {label:'Keep studying',links:[main[8],{label:'The source room',to:base+'/sources'},...islamPages.slice(1,3).map(x=>({...x,label:x.label==='Ministry'?'Ministry with Muslim friends':x.label}))]},
];
const destinations: Destination[] = [
  ...main,...worlds,...islamPages,
  {label:'The source room',to:base+'/sources',detail:'Primary texts and study sources'},
  ...TOPICS.map(t=>({label:t.title,to:base+'/topics/'+t.id,detail:'Question topic'})),
  ...PATHS.map(p=>({label:p.title,to:base+'/paths/'+p.id,detail:'Learning path'})),
  ...DEBATES.map(d=>({label:d.title,to:base+'/debates/'+d.id,detail:'Debate study'})),
  ...STUDIES.map(s=>({label:s.title,to:base+'/study/'+s.id,detail:'Study · '+s.summary})),
];
function groupFor(path:string) {
  if(path.startsWith(base+'/topics/reformed')) return 'Reformed theology';
  if(path.startsWith(base+'/topics/')||path.startsWith(base+'/study/')) return 'Questions';
  return [...main].reverse().find(x=>x.to!==base&&path.startsWith(x.to))?.label ?? (path.startsWith(base+'/sources')?'Sources':'Explore');
}
function secondary(group:string): Destination[] {
  if(group==='Worldviews') return [{label:'All worldviews',to:base+'/worldviews'},...worlds];
  if(group==='Questions') return [{label:'All questions',to:base+'/questions'},...TOPICS.map(t=>({label:t.title,to:base+'/topics/'+t.id}))];
  if(group==='Learning paths') return [{label:'All paths',to:base+'/paths'},...PATHS.map(p=>({label:p.title,to:base+'/paths/'+p.id}))];
  if(group==='Practice') return PRACTICE.map(p=>({label:p.label,to:base+'/practice?scenario='+p.id}));
  if(group==='Reformed theology'||group==='Historic texts') return [{label:'Reformed questions',to:base+'/topics/reformed'},{label:'Confessions & historic texts',to:base+'/texts'},{label:'The source room',to:base+'/sources'}];
  if(group==='Debates') return [{label:'All exchanges',to:base+'/debates'},{label:'The source room',to:base+'/sources'},{label:'Conversation practice',to:base+'/practice'}];
  if(group==='My study'||group==='Sources') return [{label:'My study',to:base+'/saved'},{label:'The source room',to:base+'/sources'},{label:'Find a question',to:base+'/questions'}];
  return [{label:'Start here',to:base+'/paths/begin'},{label:'Explore the questions',to:base+'/questions'},{label:'Across beliefs',to:base+'/worldviews'},{label:'The source room',to:base+'/sources'}];
}

function isCurrent(d:Destination,pathname:string,search='') {
  const [path,query]=d.to.split('?');
  return query?pathname===path&&search==='?'+query:pathname===path||Boolean(d.accent&&pathname.startsWith(path+'/'));
}
const sectionIcons=[Compass,Search,ShieldCheck,ScrollText,RouteIcon,Globe2,MessageCircle,HeartHandshake,Bookmark];
function currentIslam(path:string,search:string) {
  if(path.endsWith('/article'))return islamPages[['friendship','journeys','gospel','debates'].includes(new URLSearchParams(search).get('article')??'')?2:1];
  return islamPages.find(d=>d.to===path)??islamPages[0];
}
function CloseOnEscape({close}:{close:()=>void}) {
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[close]);return null;
}
function WorldLinks({onNavigate}:{onNavigate?:()=>void}) {
  const location=useLocation();
  return <div className="av-world-cards">{worlds.map(d=><Link key={d.to} to={d.to} onClick={onNavigate} aria-current={isCurrent(d,location.pathname)?'page':undefined} style={{'--wv-accent':d.accent} as React.CSSProperties}><CollectionArt id={d.to.split('/').pop()!}/><span><strong>{d.label}</strong><small>{d.detail}</small></span><ArrowUpRight size={16}/></Link>)}</div>;
}
function InlineIslam() {
  const location=useLocation();if(!location.pathname.startsWith(islam))return null;
  const active=currentIslam(location.pathname,location.search);
  return <nav className="av-islam-tabs" aria-label="Islam study sections"><span><Globe2 size={15}/> Islam</span>{islamPages.map(d=><Link key={d.to} to={d.to} aria-current={d.to===active.to?'page':undefined}>{d.label}</Link>)}</nav>;
}

function MegaNavigation() {
  const location=useLocation(), group=groupFor(location.pathname);
  const [opened,setOpened]=useState<string|null>(location.pathname===base+'/worldviews'?'Worldviews':null);
  const ref=useRef<HTMLDivElement>(null),toggle=useRef<HTMLButtonElement|null>(null);
  const previous=useRef(location.pathname+location.search);
  useEffect(()=>{const next=location.pathname+location.search;if(previous.current!==next)setOpened(null);previous.current=next;},[location.pathname,location.search]);
  useEffect(()=>{const outside=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpened(null);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
  const entry=main.find(d=>d.label===opened);
  return <div className="av-mega av-columns" ref={ref}>
    <nav className="av-mega-primary" aria-label="Apologetics sections">{main.map(d=><div key={d.to} data-current={group===d.label||undefined}><Link to={d.to} aria-current={group===d.label?'page':undefined}>{d.label}</Link><button onClick={e=>{toggle.current=e.currentTarget;setOpened(opened===d.label?null:d.label);}} aria-expanded={opened===d.label} aria-controls="av-mega-panel" aria-label={'Browse '+d.label}><ChevronDown size={12}/></button></div>)}</nav>
    {opened&&<div className="av-mega-panel" id="av-mega-panel"><CloseOnEscape close={()=>{setOpened(null);toggle.current?.focus();}}/><header><div><span className="ap-eyebrow">{opened==='Worldviews'?'Across beliefs':'Explore the library'}</span><h2>{opened==='Worldviews'?<>Four starting points.<br/><em>One thoughtful conversation.</em></>:opened}</h2></div><Link to={entry?.to??base+'/sources'} onClick={()=>setOpened(null)}>Explore {opened.toLowerCase()} <ArrowRight size={16}/></Link></header>{opened==='Worldviews'?<WorldLinks onNavigate={()=>setOpened(null)}/>:<nav className="av-mega-links" aria-label={'Browse '+opened}>{secondary(opened).map(d=><Link key={d.to} to={d.to} onClick={()=>setOpened(null)}>{d.label}<ArrowRight size={15}/></Link>)}</nav>}<button className="av-panel-close" onClick={()=>setOpened(null)} aria-label="Close section menu"><X size={18}/></button></div>}
    <InlineIslam/>
  </div>;
}

function TreeNavigation() {
  const location=useLocation(),group=groupFor(location.pathname);
  const [mobile,setMobile]=useState(false),[expanded,setExpanded]=useState('Worldviews');
  useEffect(()=>{setMobile(false);setExpanded(group);},[location.pathname]);
  const active=currentIslam(location.pathname,location.search);
  return <aside className="av-tree"><div className="av-tree-sticky"><button className="av-tree-mobile" aria-expanded={mobile} aria-controls="av-tree-links" onClick={()=>setMobile(!mobile)}><Menu size={17}/><span>Explore the library</span><strong>{group}</strong><ChevronDown size={15}/></button><div className={'av-tree-body'+(mobile?' is-open':'')} id="av-tree-links"><div className="av-tree-title"><BookOpen size={20}/><div><span className="ap-eyebrow">The library</span><p>Follow the connections.</p></div></div><nav aria-label="Apologetics library tree">{main.map((d,i)=>{const Icon=sectionIcons[i];return <div className="av-tree-group" key={d.to}><div className="av-tree-parent"><Link to={d.to} aria-current={group===d.label?'page':undefined}><Icon size={16}/>{d.label}</Link><button aria-label={'Expand '+d.label} aria-expanded={expanded===d.label} aria-controls={'tree-'+i} onClick={()=>setExpanded(expanded===d.label?'':d.label)}><ChevronRight size={13}/></button></div>{expanded===d.label&&<div className="av-tree-children" id={'tree-'+i}>{(d.label==='Worldviews'?worlds:secondary(d.label)).map(child=><div key={child.to}><Link to={child.to} aria-current={isCurrent(child,location.pathname,location.search)?'page':undefined}>{child.accent&&<i style={{background:child.accent}}/>}{child.label}</Link>{child.to===islam&&location.pathname.startsWith(islam)&&<nav aria-label="Islam study sections" className="av-tree-islam">{islamPages.map(p=><Link key={p.to} to={p.to} aria-current={p.to===active.to?'page':undefined}>{p.label}</Link>)}</nav>}</div>)}</div>}</div>;})}</nav><Link className="av-tree-source" to={base+'/sources'}><ScrollText size={15}/>The source room<ArrowUpRight size={13}/></Link></div></div></aside>;
}

function ContextNavigation() {
  const location=useLocation(),group=groupFor(location.pathname),world=worlds.find(d=>location.pathname.startsWith(d.to));
  const [open,setOpen]=useState<number|null>(null);const ref=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>setOpen(null),[location.pathname,location.search]);
  useEffect(()=>{const outside=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(null);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
  const inIslam=location.pathname.startsWith(islam);
  const levels=[{label:'Apologetics',value:group,icon:ShieldCheck,links:main}, {label:group==='Worldviews'?'Across beliefs':'In this section',value:group==='Worldviews'?world?.label??'All worldviews':'Explore '+group.toLowerCase(),icon:Globe2,links:secondary(group)}, {label:inIslam?'Islam study guide':'Continue studying',value:inIslam?currentIslam(location.pathname,location.search).label:'Find your next question',icon:BookOpen,links:inIslam?islamPages:[{label:'Question library',to:base+'/questions'},{label:'Learning paths',to:base+'/paths'},{label:'The source room',to:base+'/sources'}]}];
  return <div className="av-context" ref={ref}>{levels.map((level,i)=>{const Icon=level.icon;return <div className="av-context-level" key={i}><button aria-expanded={open===i} aria-controls={'av-context-'+i} onClick={e=>{trigger.current=e.currentTarget;setOpen(open===i?null:i);}}><Icon size={20}/><span><small>{level.label}</small><strong>{level.value}</strong></span><ChevronDown size={16}/></button>{open===i&&<nav id={'av-context-'+i} className="av-context-popover" aria-label={i===0?'Apologetics sections':i===1&&group==='Worldviews'?'Worldviews':i===2&&inIslam?'Islam study sections':level.label}><CloseOnEscape close={()=>{setOpen(null);trigger.current?.focus();}}/><p>{level.label}</p>{level.links.map(d=><Link key={d.to} to={d.to} onClick={()=>setOpen(null)} aria-current={isCurrent(d,location.pathname,location.search)?'page':undefined}>{d.accent&&<span className="am-world-dot" style={{background:d.accent}}/>}<span>{d.label}{d.detail&&<small>{d.detail}</small>}</span><ArrowRight size={14}/></Link>)}</nav>}</div>;})}</div>;
}

function ColumnNavigation() {
  const location=useLocation();const group=groupFor(location.pathname),merged=useDesign()==='f';
  const [opened,setOpened]=useState(location.pathname===base+'/worldviews');
  const toggle=useRef<HTMLButtonElement>(null);
  const [selected,setSelected]=useState(group),[world,setWorld]=useState(worlds.find(d=>location.pathname.startsWith(d.to))?.to??islam);
  const previous=useRef(location.pathname);
  useEffect(()=>{if(previous.current!==location.pathname)setOpened(false);previous.current=location.pathname;setSelected(group);setWorld(worlds.find(d=>location.pathname.startsWith(d.to))?.to??islam);},[location.pathname]);
  const picked=main.find(d=>d.label===selected)??main[0];
  const worldEntry=worlds.find(d=>d.to===world)??worlds[0];
  const last=selected==='Worldviews'?(world===islam?islamPages:[{label:worldEntry.label+' collection',to:world},{label:'Examine the claims',to:world+'#comparison'},{label:'Texts behind the conversation',to:world+'#wv-context-heading'},{label:'Connected studies',to:world+'#conversation-studies'}]):[{label:'Open '+selected.toLowerCase(),to:picked.to},...secondary(selected)];
  const activeWorld=worlds.find(d=>location.pathname.startsWith(d.to));
  return <div className={'av-columns'+(merged?' av-merged':'')}>
    {merged&&<nav className="av-mega-primary av-merged-primary" aria-label="Apologetics sections">{main.map(d=><div key={d.to} data-current={group===d.label||undefined} data-open={opened&&selected===d.label||undefined}><Link to={d.to} aria-current={group===d.label?'page':undefined}>{d.label}</Link><button onClick={e=>{toggle.current=e.currentTarget;setSelected(d.label);setOpened(!(opened&&selected===d.label));}} aria-expanded={opened&&selected===d.label} aria-controls="av-column-browser" aria-label={'Browse '+d.label}><ChevronDown size={12}/></button></div>)}</nav>}
    <div className="av-columns-toolbar">
      <button ref={toggle} aria-expanded={opened} aria-controls="av-column-browser" onClick={e=>{toggle.current=e.currentTarget;setOpened(!opened);}}><Grid2X2 size={18}/><span>{merged?'Browse Apologetics':'Explore the library'}</span><ChevronDown size={15}/></button>
      <div><span>{group}</span>{group==='Worldviews'&&(!merged||activeWorld)&&<><ChevronRight size={12}/><strong>{activeWorld?.label??'All worldviews'}</strong></>}</div>
      {!merged&&<Link to={base+'/worldviews'}>All worldviews <ArrowUpRight size={14}/></Link>}
    </div>
    {opened&&<div className="av-column-browser" id="av-column-browser">
      <CloseOnEscape close={()=>{setOpened(false);toggle.current?.focus();}}/>
      <section><header><span>01</span><h2>A field to explore</h2></header><div className="av-column-choices" role="group" aria-label="Choose an Apologetics section">{main.map((d,i)=>{const Icon=sectionIcons[i];return <button key={d.to} aria-pressed={selected===d.label} onClick={()=>setSelected(d.label)}><Icon size={15}/>{d.label}<ChevronRight size={13}/></button>;})}</div><Link className="av-column-footer" to={picked.to} onClick={()=>setOpened(false)}>Open {selected.toLowerCase()}<ArrowUpRight size={13}/></Link></section>
      <section><header><span>02</span><h2>{selected==='Worldviews'?'A worldview to understand':'Follow a thread'}</h2></header><div className="av-column-choices">{selected==='Worldviews'?worlds.map(d=><button className="av-column-world" key={d.to} aria-pressed={world===d.to} onClick={()=>setWorld(d.to)} style={{'--wv-accent':d.accent} as React.CSSProperties}><CollectionArt id={d.to.split('/').pop()!}/><span>{d.label}</span><ChevronRight size={14}/></button>):secondary(selected).map(d=><Link key={d.to} to={d.to} onClick={()=>setOpened(false)}>{d.label}<ArrowRight size={14}/></Link>)}</div></section>
      <section className="av-column-destination"><header><span>03</span><h2>A place to begin</h2></header><p className="av-column-intro">{selected==='Worldviews'?worldEntry.label:selected}</p><nav aria-label="Choose a study destination">{last.map((d,i)=><Link key={d.to+i} to={d.to} onClick={()=>setOpened(false)}><span>{d.label}{d.detail&&<small>{d.detail}</small>}</span><ArrowUpRight size={15}/></Link>)}</nav></section>
    </div>}
    <InlineIslam/>
  </div>;
}

export function NavigationHeader() {
  const location=useLocation(), group=groupFor(location.pathname), design=useDesign();
  const [query,setQuery]=useState('');
  const dialog=useRef<HTMLDialogElement>(null), trigger=useRef<HTMLButtonElement>(null), input=useRef<HTMLInputElement>(null);
  const links=secondary(group);
  function open(){setQuery('');dialog.current?.showModal();requestAnimationFrame(()=>input.current?.focus());}
  function close(){dialog.current?.close();}
  useEffect(()=>{close();},[location.pathname,location.search]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.current?.open)close();else open();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  const seen=new Set<string>();
  const results=destinations.filter(d=>{const matches=(d.label+' '+(d.detail??'')).toLowerCase().includes(query.trim().toLowerCase());if(!matches||seen.has(d.to))return false;seen.add(d.to);return true;});
  return <>
    <div className="am-masthead"><Link to={base} className="am-brand"><ShieldCheck size={18}/><strong>Apologetics</strong><span>Reason · Faith · Witness</span></Link><div><Link to={base+'/sources'} className="am-source">The source room <ArrowUpRight size={13}/></Link><button ref={trigger} onClick={open} className="am-browse">{design==='f'?<Search size={15}/>:<Grid2X2 size={15}/>}<span>{design==='f'?'Search Apologetics':'Browse library'}</span><kbd>Ctrl K</kbd></button></div></div>
    {design==='a'?<div className="am-navigation">
      <nav aria-label="Apologetics sections" className="am-primary">{main.map(d=><Link key={d.to} to={d.to} aria-current={group===d.label?'page':undefined}>{d.label}</Link>)}</nav>
      <nav aria-label={group==='Worldviews'?'Worldviews':'Explore '+group.toLowerCase()} className={'am-secondary'+(group==='Worldviews'?' am-worldviews':'')}>
        <span className="am-row-label">{group==='Worldviews'?<Globe2 size={14}/>:<Compass size={14}/>}<span>{group==='Worldviews'?'Across beliefs':group}</span></span>
        <div>{links.map(d=>{const [path,search]=d.to.split('?');const active=search?location.pathname===path&&location.search==='?'+search:location.pathname===path||(d.accent&&location.pathname.startsWith(path+'/'));return <Link key={d.to} to={d.to} style={{'--am-tone':d.accent??'var(--accent)'} as React.CSSProperties} aria-current={active?'page':undefined}>{d.accent&&<span className="am-world-dot"/>}{d.label}{active&&<span className="am-active-mark"/>}</Link>;})}</div>
      </nav>
    </div>:design==='b'?<MegaNavigation key={design}/>:design==='d'?<ContextNavigation key={design}/>:design==='e'||design==='f'?<ColumnNavigation key={design}/>:null}
    <dialog className="am-dialog" ref={dialog} onClose={()=>trigger.current?.focus()} onClick={e=>{if(e.target===dialog.current)close();}} aria-labelledby="am-dialog-title">
      <div className="am-dialog-inner"><header><div><span className="ap-eyebrow">The Apologetics library</span><h2 id="am-dialog-title">Follow a <em>question.</em></h2></div><button className="am-close" onClick={close} aria-label="Close library menu"><X size={21}/></button></header>
        <label className="am-search"><Search size={20}/><input ref={input} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a worldview, study, text or learning path" aria-label="Search library navigation"/><kbd>Esc</kbd></label>
        {query.trim()?<div className="am-results"><p role="status">{results.length} {results.length===1?'destination':'destinations'}</p>{results.length?results.map(d=><Link key={d.to} to={d.to} onClick={close}><span><strong>{d.label}</strong><small>{d.detail}</small></span><ArrowRight size={16}/></Link>):<p>No matching studies. Try a different word, or <button onClick={()=>setQuery('')}>browse the library</button>.</p>}</div>:<><div className="am-menu-grid">{browseGroups.map(g=><section key={g.label}><h3>{g.label}</h3>{g.links.map(d=><Link key={d.to} to={d.to} onClick={close}>{d.label}<ArrowRight size={13}/></Link>)}</section>)}</div><div className="am-dialog-foot"><BookOpen size={18}/><p>Scripture first. Sources you can examine.</p><Link to={base+'/worldviews'} onClick={close}>Explore all worldviews <ArrowRight size={15}/></Link></div></>}
      </div>
    </dialog>
  </>;
}

export function IslamSideNav() {
  const location=useLocation(), [expanded,setExpanded]=useState(false), design=useDesign();
  useEffect(()=>setExpanded(false),[location.pathname]);
  if(design==='c')return <TreeNavigation/>;
  if(design!=='a'||!location.pathname.startsWith(islam))return null;
  const active=islamPages.find(d=>d.to===location.pathname)??islamPages.find(d=>d.to===guide+'/understanding')!;
  return <aside className="am-islam-nav"><div className="am-side-sticky"><button className="am-mobile-sections" aria-expanded={expanded} aria-controls="am-islam-links" onClick={()=>setExpanded(!expanded)}><span><Globe2 size={16}/>Islam <span className="am-mobile-current">/ {active.label}</span></span><ChevronDown size={16}/></button><div className="am-side-heading"><span className="ap-eyebrow">Worldviews / Islam</span><p>Understand.<br/><em>Witness clearly.</em></p></div><nav id="am-islam-links" aria-label="Islam study sections" className={expanded?'is-open':''}>{islamPages.map((d,i)=><Link key={d.to} to={d.to} aria-current={d.to===active.to?'page':undefined}><span className="am-side-number">0{i+1}</span><span>{d.label}<small>{d.detail}</small></span>{d.to===active.to&&<ArrowRight size={13}/>}</Link>)}</nav><div className="am-side-note"><BookOpen size={16}/><p>Open texts.<br/>Honest questions.</p></div></div></aside>;
}

export function IslamGuide() {
  return <div className="concept-content am-guide"><Routes><Route index element={<IslamHub/>}/><Route path="understanding" element={<Understanding/>}/><Route path="ministry" element={<Ministry/>}/><Route path="library" element={<Library/>}/><Route path="article" element={<Article/>}/><Route path="*" element={<Navigate to={guide} replace/>}/></Routes></div>;
}

function App() {
  const location=useLocation(), navigate=useNavigate();
  const [design,setDesign]=useState(readDesign);
  useEffect(()=>{const sync=()=>setDesign(readDesign());window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  function changeDesign(id:string){const url=new URL(window.location.href);url.searchParams.set('d',id);window.history.replaceState(window.history.state,'',url);setDesign(id);}
  useEffect(()=>{const id=location.hash.slice(1);if(id)requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView());},[location.pathname,location.hash]);
  function capture(e:React.MouseEvent){const a=(e.target as HTMLElement).closest('a');if(!a||a.target==='_blank'||a.hasAttribute('download')||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const raw=a.getAttribute('href')??'';
    if(raw.startsWith('#/')&&!raw.startsWith('#/apologetics')){e.preventDefault();window.location.assign(raw.slice(1));return;}
    if(raw.startsWith('#')&&!raw.startsWith('#/')){const element=document.getElementById(raw.slice(1));if(element){e.preventDefault();element.scrollIntoView({behavior:'smooth'});}return;}
    if(raw.startsWith('/')&&!raw.startsWith('/mockups/')){e.preventDefault();window.location.assign(raw);}
  }
  function submit(e:React.FormEvent){const form=e.target as HTMLFormElement;if(form.getAttribute('action')?.startsWith(base)){e.preventDefault();const query=new URLSearchParams(new FormData(form) as unknown as Record<string,string>);navigate(form.getAttribute('action')+'?'+query.toString());}}
  return <DesignContext.Provider value={design}><div data-design={design} onClickCapture={capture} onSubmitCapture={submit}><Layout><Routes><Route path="/apologetics/*" element={<ApologeticsPage/>}/><Route path="*" element={<Navigate to={base+'/worldviews'} replace/>}/></Routes></Layout><aside className="av-design-switcher" aria-label="Navigation design directions"><div role="group" aria-label="Choose a navigation design">{designs.map(d=><button key={d.id} aria-pressed={design===d.id} title={d.name+' — '+d.description} onClick={()=>changeDesign(d.id)}>{d.id.toUpperCase()}</button>)}</div><span aria-live="polite">{designs.find(d=>d.id===design)!.name}</span></aside></div></DesignContext.Provider>;
}

if (!window.location.hash.startsWith('#/')) window.history.replaceState(null,'',window.location.pathname+window.location.search+'#/apologetics/worldviews');
createRoot(document.getElementById('root')!).render(<HashRouter><CatalogProvider><App/></CatalogProvider></HashRouter>);
