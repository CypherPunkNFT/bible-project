import { ArrowRight, ArrowUpRight, Database, Library, Search, Wrench, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Directory, SourceProfile } from './types';
import { snapshotDate } from './LibraryOverview';
const categories=[['all','All providers'],['library','Libraries & ministries'],['data','Scripture, study & atlas'],['software','Search tools']] as const;
const tones={library:'#69c7bb',data:'#83aed5',software:'#a99bd6'};
const n=(value:number|undefined)=>value===undefined?'—':value.toLocaleString();
const hostname=(url?:string)=>{try{return new URL(url??'').hostname.replace(/^www\./,'');}catch{return '';}};
function ProviderDetails({source,date,onClose}:{source:SourceProfile|null;date?:string;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;if(!source||!element)return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';element.showModal();return()=>{element.close();document.body.style.overflow=overflow;};},[source]);
 return <dialog ref={dialog} className="source-detail-dialog source-provider-drawer" aria-labelledby="provider-detail-title" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>{source&&<div className="source-detail-content">
 <header><span className="source-eyebrow">Provider details</span><button type="button" aria-label="Close provider details" onClick={onClose}><X size={20}/></button></header>
 <p className="source-detail-status">{categories.find(([id])=>id===source.category)?.[1]}</p><h2 id="provider-detail-title">{source.name}</h2>
 {source.url&&<section><a href={source.url} target="_blank" rel="noopener noreferrer">Visit {hostname(source.url)} <ArrowUpRight size={14} className="inline"/></a></section>}
 <section><h3>Recorded holdings{date?' · '+snapshotDate(date):''}</h3><dl className="source-facts"><div><dt>Held files</dt><dd>{n(source.files)}</dd></div><div><dt>Searchable texts</dt><dd>{n(source.textReady)}</dd></div><div><dt>Awaiting intake</dt><dd>{n(source.pending)}</dd></div>{source.bytes!==undefined&&<div><dt>Storage</dt><dd>{(source.bytes/1e6).toLocaleString(undefined,{maximumFractionDigits:1})} MB</dd></div>}</dl><p>Held files include metadata and supporting files. Unrecorded measurements are shown as a dash.</p></section>
 <section><h3>Formats</h3><p>{source.formats.map(f=>f.replace(/^\./,'')).join(' · ')||'Not recorded'}</p></section>
 <section><h3>Terms & credits</h3><p>{source.terms}</p></section>{source.channel&&<section><h3>Edition & acquisition notes</h3><p>{source.channel}</p></section>}
 </div>}</dialog>;
}
export function SourceProviders({directory}:{directory:Directory}) {
 const [category,setCategory]=useState('library'),[query,setQuery]=useState(''),[selected,setSelected]=useState<SourceProfile|null>(null);
 const profiles:SourceProfile[]=directory.sourceProfiles??directory.sources.map(source=>({id:source.id,name:source.name,url:source.url,category:'library',formats:[],terms:'Consult the original edition for its author, contributor credits and terms.',channel:source.role.replace(/-/g,' ')}));
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 const searched=profiles.filter(s=>terms.every(term=>[s.name,...s.formats,s.channel,s.terms].join(' ').toLowerCase().includes(term)));
 const matches=searched.filter(s=>category==='all'||s.category===category).sort((a,b)=>(b.files??0)-(a.files??0)||a.name.localeCompare(b.name));
 const hosts=new Set(profiles.map(s=>hostname(s.url)).filter(Boolean)),aliases=new Set(['github.com','wp.me','tabletalkmagazine.com']);
 const discovery=directory.sources.filter(s=>!hosts.has(hostname(s.url))&&!aliases.has(hostname(s.url)));
 return <section id="repositories" className="source-board"><div className="source-provider-layout"><header className="source-board-heading source-board-heading-controls"><div className="source-board-intro"><h2>Providers</h2><p>Libraries, archives and tools behind the collection.</p></div><div className="source-board-tools"><label className="source-board-search"><Search size={16} aria-hidden/><input type="search" aria-label="Search source providers" value={query} onChange={e=>{setQuery(e.target.value);}} placeholder="Name, format or terms…"/></label><div className="source-board-tabs" role="group" aria-label="Source type">{categories.map(([id,label])=><button type="button" key={id} aria-pressed={category===id} onClick={()=>{setCategory(id);}}>{label}<small>{searched.filter(s=>id==='all'||s.category===id).length}</small></button>)}</div></div></header>
 <div className="source-card-toolbar"><p role="status"><strong>{matches.length}</strong> providers</p></div>
 <div role="region" aria-label="Provider cards"><div className="source-board-grid">{matches.map(source=>{const Icon=source.category==='library'?Library:source.category==='data'?Database:Wrench;return <article className="source-board-card source-provider-card" key={source.id} style={{'--board-tone':tones[source.category]} as CSSProperties}>
 <Icon className="source-board-watermark" aria-hidden strokeWidth={1}/><div className="source-board-card-top"><span className="source-board-icon"><Icon size={22}/></span><span className="source-provider-kind">{source.category==='library'?'Library':source.category==='data'?'Data source':'Search tool'}</span></div><h3>{source.name}</h3><div className="source-provider-formats">{source.formats.map(f=>f.replace(/^\./,'')).join(' · ')||'Formats unrecorded'}</div>
 <div className="source-board-counts"><span><strong>{n(source.files)}</strong><small>Held files</small></span><span><strong>{n(source.textReady)}</strong><small>Searchable</small></span><span><strong>{n(source.pending)}</strong><small>Awaiting intake</small></span></div><span className="source-board-action">Details & credits <ArrowRight size={15}/></span><button className="source-provider-hit" type="button" aria-label={'Open provider details: '+source.name} onClick={()=>setSelected(source)}/></article>;})}</div>
 {!matches.length&&<div className="source-board-empty"><p>No providers match these filters.</p><button onClick={()=>{setCategory('all');setQuery('');}}>Clear filters</button></div>}</div></div>
 {!!discovery.length&&<details className="source-panel source-board-discovery"><summary>Discovery & publisher links · {discovery.length}</summary><nav aria-label="Discovery and publisher links">{discovery.map(s=><a href={s.url} key={s.id} target="_blank" rel="noopener noreferrer">{s.name}<ArrowUpRight size={14}/></a>)}</nav></details>}
 <ProviderDetails source={selected} date={directory.sourceProfilesMeasuredAt} onClose={()=>setSelected(null)}/></section>;
}
