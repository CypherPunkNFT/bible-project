import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,X} from 'lucide-react';
export interface SourceInspection {
 name:string;
 records:{title:string;year:string|number;url:string;kind:string;uses:{page:string;address:string;locator:string;consultation?:string}[]}[];
}
export function SourceDetails({selection,onClose}:{selection:SourceInspection;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [limit,setLimit]=useState(12);
 useEffect(()=>{const panel=dialog.current;panel?.showModal();return()=>panel?.close();},[]);
 return <dialog ref={dialog} className="blt-source-panel" aria-labelledby="blt-source-title" onCancel={onClose} onClose={onClose} onClick={event=>{if(event.target===event.currentTarget&&event.clientX<event.currentTarget.getBoundingClientRect().left)onClose();}}>
  <header><span className="kicker">Follow the source</span><button type="button" onClick={onClose} aria-label="Close source details"><X size={18}/></button></header>
  <h2 id="blt-source-title">{selection.name}</h2>
  <p className="blt-source-intro">The recorded source connections behind the site’s studies. Named credits and institutional source providers are preserved as recorded.</p>
  {selection.records.slice(0,limit).map((record,i)=><article key={`${record.url}-${i}`}>
   <span className="blt-source-kind">{record.kind==='data'?'Feature data input':record.kind==='bibliography'?'Listed bibliography':'Page source / citation'}</span>
   <h3>{record.title}</h3>{record.year&&<p>{record.year}</p>}
   <a href={record.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={14}/></a>
   <h4>Where it is connected</h4><ul>{record.uses.slice(0,limit).map((use,j)=><li key={`${use.address}-${j}`}><a href={use.address}>{use.page}<ArrowUpRight size={12}/></a>{use.locator&&<p>{use.locator}</p>}{use.consultation&&use.consultation!==use.locator&&<p>{use.consultation}</p>}</li>)}</ul>
  </article>)}
  {(selection.records.length>limit||selection.records.some(r=>r.uses.length>limit))&&<button className="blt-source-more" type="button" onClick={()=>setLimit(n=>n+24)}>Show more source connections</button>}
 </dialog>;
}
