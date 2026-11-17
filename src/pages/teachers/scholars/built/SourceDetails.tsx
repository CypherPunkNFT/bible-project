import {useEffect,useMemo,useRef} from 'react';
import {ArrowUpRight,X} from 'lucide-react';
import {WindowedRows} from '@/components/WindowedRows';
export interface SourceInspection {
 name:string;
 records:{title:string;year:string|number;url:string;kind:string;uses:{page:string;address:string;locator:string;consultation?:string}[]}[];
}
type SourceRecord=SourceInspection['records'][number];
// Each record, then each place it is connected, as one list of rows drawn a window at a time as the panel scrolls:
// no "Show more" (owner's scroll rule, 2026-11-17).
type Row={key:string;record:SourceRecord;use?:undefined}|{key:string;use:SourceRecord['uses'][number];last:boolean};
const rowKey=(row:Row)=>row.key;
export function SourceDetails({selection,onClose}:{selection:SourceInspection;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const rows=useMemo(()=>selection.records.flatMap((record,i):Row[]=>[{key:`r${i}`,record},...record.uses.map((use,j)=>({key:`r${i}u${j}`,use,last:j===record.uses.length-1}))]),[selection]);
 useEffect(()=>{const panel=dialog.current;panel?.showModal();return()=>panel?.close();},[]);
 return <dialog ref={dialog} className="blt-source-panel" aria-labelledby="blt-source-title" onCancel={onClose} onClose={onClose} onClick={event=>{if(event.target===event.currentTarget&&event.clientX<event.currentTarget.getBoundingClientRect().left)onClose();}}>
  <header><span className="kicker">Follow the source</span><button type="button" onClick={onClose} aria-label="Close source details"><X size={18}/></button></header>
  <h2 id="blt-source-title">{selection.name}</h2>
  <p className="blt-source-intro">The recorded source connections behind the site’s studies. Named credits and institutional source providers are preserved as recorded.</p>
  <WindowedRows className="blt-source-list" items={rows} itemKey={rowKey} estimate={64} renderItem={(row,r)=>row.use===undefined?<article key={row.key} data-row={r}>
   <span className="blt-source-kind">{row.record.kind==='data'?'Feature data input':row.record.kind==='bibliography'?'Listed bibliography':'Page source / citation'}</span>
   <h3>{row.record.title}</h3>{row.record.year&&<p>{row.record.year}</p>}
   <a href={row.record.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={14}/></a>
   <h4>Where it is connected</h4>
  </article>:<div key={row.key} data-row={r} className={row.last?'blt-source-use is-last':'blt-source-use'}><a href={row.use.address}>{row.use.page}<ArrowUpRight size={12}/></a>{row.use.locator&&<p>{row.use.locator}</p>}{row.use.consultation&&row.use.consultation!==row.use.locator&&<p>{row.use.consultation}</p>}</div>}/>
 </dialog>;
}
