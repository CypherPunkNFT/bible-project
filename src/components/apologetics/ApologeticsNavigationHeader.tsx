import {useEffect,useRef,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {ArrowRight,BookOpen,Search,ShieldCheck,X} from 'lucide-react';
import {browseGroups,destinations} from '@/lib/apologetics-navigation';
import {WorldviewNavigation} from './WorldviewNavigation';
import {MeaningPrompt} from '@/components/search/MeaningPrompt';
import {studyById} from '@/data/apologetics-library';
import {preferMeaning} from '@/lib/meaning/store';
import {useMeaningResults} from '@/lib/meaning/useMeaningResults';
import { plural } from "@/lib/site-format";
const base='/apologetics';
export function ApologeticsNavigationHeader() {
  const location=useLocation();
  const [query,setQuery]=useState('');
  const dialog=useRef<HTMLDialogElement>(null), trigger=useRef<HTMLButtonElement>(null), input=useRef<HTMLInputElement>(null), floating=useRef<HTMLButtonElement>(null);
  // When the bar scrolls up to its landing gap under the site header, a copy of its search button stays there.
  useEffect(()=>{
    let frame=0;
    const place=()=>{frame=0;const button=trigger.current,copy=floating.current,bar=button?.closest('.sm-container'),header=document.querySelector('[data-site-header]');if(!button||!copy||!bar||!header)return;
      const top=header.getBoundingClientRect().bottom+24,box=bar.getBoundingClientRect(),own=button.getBoundingClientRect();
      copy.hidden=box.top>=top;button.style.visibility=copy.hidden?'':'hidden';copy.style.top=top+'px';copy.style.left=own.left+'px';copy.style.width=box.right-own.left+'px';copy.style.height=own.height+2+'px';};
    const queue=()=>{if(!frame)frame=requestAnimationFrame(place);};
    place();window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);
    return()=>{cancelAnimationFrame(frame);if(trigger.current)trigger.current.style.visibility='';window.removeEventListener('scroll',queue);window.removeEventListener('resize',queue);};
  },[location.pathname]);
  function open(){setQuery('');dialog.current?.showModal();requestAnimationFrame(()=>input.current?.focus());}
  function close(){dialog.current?.close();}
  useEffect(()=>{close();},[location.pathname,location.search]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.current?.open)close();else open();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  // A whole question (three words or more) is also asked by meaning once the reader has switched it on; it waits for a pause in typing.
  const [asked,setAsked]=useState('');
  useEffect(()=>{const pause=setTimeout(()=>setAsked(preferMeaning(query)?query.trim():''),350);return()=>clearTimeout(pause);},[query]);
  const meaning=useMeaningResults(asked);
  const closest=meaning.status==='done'&&meaning.results?meaning.results.studies.flatMap(s=>{const study=studyById(s.id);return study?[study]:[];}).slice(0,5):[];
  const seen=new Set<string>(closest.map(s=>base+'/study/'+s.id));
  const results=destinations.filter(d=>{const matches=(d.label+' '+(d.detail??'')).toLowerCase().includes(query.trim().toLowerCase());if(!matches||seen.has(d.to))return false;seen.add(d.to);return true;});
  return <>
    <WorldviewNavigation
      leading={<Link to={base} className="sm-leading-brand" aria-label="Apologetics home"><ShieldCheck size={18}/><strong>Apologetics</strong></Link>}
      trailing={<button ref={trigger} onClick={open} className="sm-trailing-search" type="button" aria-label="Search Apologetics"><Search size={16}/><span>Search Apologetics</span><kbd>Ctrl K</kbd></button>}/>
    <button ref={floating} hidden onClick={open} className="sm-trailing-search sm-floating-search" type="button" aria-label="Search Apologetics"><Search size={16}/><span>Search Apologetics</span><kbd>Ctrl K</kbd></button>
    <dialog onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}}} className="am-dialog" ref={dialog} onClose={()=>(floating.current&&!floating.current.hidden?floating.current:trigger.current)?.focus({preventScroll:true})} onClick={e=>{if(e.target===dialog.current)close();}} aria-labelledby="am-dialog-title">
      <div className="am-dialog-inner"><header><div><span className="ap-eyebrow">The Apologetics library</span><h2 id="am-dialog-title">Follow a <em>question.</em></h2></div><button className="am-close" onClick={close} aria-label="Close library menu"><X size={21}/></button></header>
        <label className="am-search"><Search size={20}/><input ref={input} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a worldview, study, text or learning path" aria-label="Search library navigation"/><kbd>Esc</kbd></label>
        <MeaningPrompt query={query} className="am-meaning" active={<span>Meaning search is on: ask a whole question and the closest studies come first.</span>}/>
        {query.trim()?<div className="am-results">{closest.length>0&&<><p>Closest in meaning</p>{closest.map(s=><Link key={s.id} to={base+'/study/'+s.id} onClick={close}><span><strong>{s.title}</strong><small>{s.summary}</small></span><ArrowRight size={16}/></Link>)}</>}{(results.length>0||closest.length===0)&&<p role="status">{plural(results.length, "{n} destination", "{n} destinations")}</p>}{results.length?results.map(d=><Link key={d.to} to={d.to} onClick={close}><span><strong>{d.label}</strong><small>{d.detail}</small></span><ArrowRight size={16}/></Link>):closest.length===0&&<p>No matching studies. Try a different word, or <button onClick={()=>setQuery('')}>browse the library</button>.</p>}<Link to={base+'/questions?q='+encodeURIComponent(query.trim())} onClick={close}><span><strong>{`Search every question for “${query.trim()}”`}</strong><small>The question library</small></span><ArrowRight size={16}/></Link></div>:<><div className="am-menu-grid">{browseGroups.map(g=><section key={g.label}><h3>{g.label}</h3>{g.links.map(d=><Link key={d.to} to={d.to} onClick={close}>{d.label}<ArrowRight size={13}/></Link>)}</section>)}</div><div className="am-dialog-foot"><BookOpen size={18}/><p>Scripture first. Sources you can examine.</p><Link to={base+'/worldviews'} onClick={close}>Worldviews <ArrowRight size={15}/></Link></div></>}
      </div>
    </dialog>
  </>;
}

