import { Layout } from '@/components/Layout';
import { DEBATES, PATHS, STUDIES, TOPICS } from '@/data/apologetics-library';
import { CatalogProvider } from '@/lib/catalog-context';
import ApologeticsPage from '@/pages/ApologeticsPage';
import { ArrowRight, ArrowUpRight, BookOpen, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Article, Hub as IslamHub, Library, Ministry, Understanding } from '../christianity-islam/preview';
import './preview.css';
import { DesignContext, Destination, base, guide, islamPages, main, useDesign, worlds } from "./preview.shared";
import './variants.css';
import { WorldviewNavigation } from './worldview-menus';

const designs = [
 {id:'a',name:'Replace in place',description:'The cleaned-up B: switch between worldview choices and the current collection subpages.'},
 {id:'b',name:'Side by side',description:'Worldviews alongside collapsible subpages.'},
 {id:'c',name:'Worldview tabs',description:'All worldviews stay visible above collapsible subpages.'},
 {id:'d',name:'Expandable cards',description:'Each worldview expands its own subpages.'},
];
const readDesign=()=>{const id=new URLSearchParams(window.location.search).get('d')?.toLowerCase();return designs.some(d=>d.id===id)?id!:'a';};
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
export function NavigationHeader() {
  const location=useLocation(), design=useDesign();
  const [query,setQuery]=useState('');
  const dialog=useRef<HTMLDialogElement>(null), trigger=useRef<HTMLButtonElement>(null), input=useRef<HTMLInputElement>(null);
  function open(){setQuery('');dialog.current?.showModal();requestAnimationFrame(()=>input.current?.focus());}
  function close(){dialog.current?.close();}
  useEffect(()=>{close();},[location.pathname,location.search]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.current?.open)close();else open();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  const seen=new Set<string>();
  const results=destinations.filter(d=>{const matches=(d.label+' '+(d.detail??'')).toLowerCase().includes(query.trim().toLowerCase());if(!matches||seen.has(d.to))return false;seen.add(d.to);return true;});
  return <>
    <div className="am-masthead"><Link to={base} className="am-brand"><ShieldCheck size={18}/><strong>Apologetics</strong><span>Reason · Faith · Witness</span></Link><div><Link to={base+'/sources'} className="am-source">The source room <ArrowUpRight size={13}/></Link><button ref={trigger} onClick={open} className="am-browse"><Search size={15}/><span>Search Apologetics</span><kbd>Ctrl K</kbd></button></div></div>
    <WorldviewNavigation key={design}/>
    <dialog className="am-dialog" ref={dialog} onClose={()=>trigger.current?.focus()} onClick={e=>{if(e.target===dialog.current)close();}} aria-labelledby="am-dialog-title">
      <div className="am-dialog-inner"><header><div><span className="ap-eyebrow">The Apologetics library</span><h2 id="am-dialog-title">Follow a <em>question.</em></h2></div><button className="am-close" onClick={close} aria-label="Close library menu"><X size={21}/></button></header>
        <label className="am-search"><Search size={20}/><input ref={input} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a worldview, study, text or learning path" aria-label="Search library navigation"/><kbd>Esc</kbd></label>
        {query.trim()?<div className="am-results"><p role="status">{results.length} {results.length===1?'destination':'destinations'}</p>{results.length?results.map(d=><Link key={d.to} to={d.to} onClick={close}><span><strong>{d.label}</strong><small>{d.detail}</small></span><ArrowRight size={16}/></Link>):<p>No matching studies. Try a different word, or <button onClick={()=>setQuery('')}>browse the library</button>.</p>}</div>:<><div className="am-menu-grid">{browseGroups.map(g=><section key={g.label}><h3>{g.label}</h3>{g.links.map(d=><Link key={d.to} to={d.to} onClick={close}>{d.label}<ArrowRight size={13}/></Link>)}</section>)}</div><div className="am-dialog-foot"><BookOpen size={18}/><p>Scripture first. Sources you can examine.</p><Link to={base+'/worldviews'} onClick={close}>Worldviews <ArrowRight size={15}/></Link></div></>}
      </div>
    </dialog>
  </>;
}

export function IslamSideNav(){return null;}

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


