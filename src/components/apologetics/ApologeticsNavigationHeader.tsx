import {useEffect,useRef,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,BookOpen,Search,ShieldCheck,X} from 'lucide-react';
import {browseGroups,destinations} from '@/lib/apologetics-navigation';
import {WorldviewNavigation} from './WorldviewNavigation';
const base='/apologetics';
export function ApologeticsNavigationHeader({savedCount=0}:{savedCount?:number}) {
  const location=useLocation();
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
    <WorldviewNavigation savedCount={savedCount}/>
    <dialog onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();}}} className="am-dialog" ref={dialog} onClose={()=>trigger.current?.focus()} onClick={e=>{if(e.target===dialog.current)close();}} aria-labelledby="am-dialog-title">
      <div className="am-dialog-inner"><header><div><span className="ap-eyebrow">The Apologetics library</span><h2 id="am-dialog-title">Follow a <em>question.</em></h2></div><button className="am-close" onClick={close} aria-label="Close library menu"><X size={21}/></button></header>
        <label className="am-search"><Search size={20}/><input ref={input} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a worldview, study, text or learning path" aria-label="Search library navigation"/><kbd>Esc</kbd></label>
        {query.trim()?<div className="am-results"><p role="status">{results.length} {results.length===1?'destination':'destinations'}</p>{results.length?results.map(d=><Link key={d.to} to={d.to} onClick={close}><span><strong>{d.label}</strong><small>{d.detail}</small></span><ArrowRight size={16}/></Link>):<p>No matching studies. Try a different word, or <button onClick={()=>setQuery('')}>browse the library</button>.</p>}</div>:<><div className="am-menu-grid">{browseGroups.map(g=><section key={g.label}><h3>{g.label}</h3>{g.links.map(d=><Link key={d.to} to={d.to} onClick={close}>{d.label}<ArrowRight size={13}/></Link>)}</section>)}</div><div className="am-dialog-foot"><BookOpen size={18}/><p>Scripture first. Sources you can examine.</p><Link to={base+'/worldviews'} onClick={close}>Worldviews <ArrowRight size={15}/></Link></div></>}
      </div>
    </dialog>
  </>;
}

