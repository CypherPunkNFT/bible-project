import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import type { Directory, SourceEntry } from './types';
import type { ReviewFilter } from './dashboard-model';
import { RecordDetails } from './SourceCatalogue';
import { CollectionArt, collectionTones } from './CollectionArt';
import { collectionPreviews } from './collection-previews';
export function SourceCollections({directory,entries,failed,openCatalogue}:{directory:Directory;entries:SourceEntry[]|null;failed?:boolean;openCatalogue:(category?:string,review?:ReviewFilter)=>void}) {
 const [query,setQuery]=useState(''),[group,setGroup]=useState('all');
 const [expanded,setExpanded]=useState<string[]>([]),[selected,setSelected]=useState<SourceEntry|null>(null);
 const byId=useMemo(()=>new Map(entries?.map(e=>[e.id,e])),[entries]);
 const organization=(id:string)=>id==='research'||id==='cited';
 const matches=directory.collections.filter(c=>(group==='all'||organization(c.id)===(group==='organization')) && query.toLowerCase().trim().split(/\s+/).every(term=>(c.label+' '+c.definition).toLowerCase().includes(term)));
 return <section id="collections" className="source-board"><div className="source-collection-layout">
 <header className="source-board-heading source-board-heading-controls"><div className="source-board-intro"><h2>Collections</h2><p>Explore a subject. Look inside, then follow a work to its source.</p></div>
 <div className="source-board-tools"><label className="source-board-search"><Search size={16} aria-hidden/><input type="search" aria-label="Find a collection" placeholder="Find a collection…" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="source-board-tabs" role="group" aria-label="Collection group">{[['all','All'],['subjects','Subjects'],['organization','Library organization']].map(([id,label])=><button key={id} type="button" aria-pressed={group===id} onClick={()=>setGroup(id)}>{label}<small>{directory.collections.filter(c=>id==='all'||organization(c.id)===(id==='organization')).length}</small></button>)}</div></div></header>
 <span role="status" className="sr-only">{matches.length} collections</span>
 <div role="region" aria-label="Collection shelves"><div className="source-collection-shelves">{matches.map(c=>{
 const index=directory.collections.findIndex(item=>item.id===c.id),open=expanded.includes(c.id);
 const records=entries?.filter(e=>e.categories.includes(c.id));
 const count=records?.length??directory.split?.collections[c.id]?.records;
 const authors=records?new Set(records.map(e=>e.author)).size:directory.split?.collections[c.id]?.authors;
 const examples=(collectionPreviews[c.id]??[]).map(id=>byId.get(id)).filter((e):e is SourceEntry=>!!e&&e.categories.includes(c.id));
 return <article key={c.id} className="source-collection-shelf" style={{'--board-tone':collectionTones[c.id]??'#9badaf'} as CSSProperties}>
 <div className="source-collection-row"><div className="source-collection-art"><CollectionArt id={c.id}/></div>
 <div className="source-collection-copy"><span className="source-board-kicker">{organization(c.id)?'Library organization':String(index+1).padStart(2,'0')+' / Subject collection'}</span><h3>{c.label}</h3><p>{c.definition}</p></div>
 <div className="source-collection-size"><strong>{count?.toLocaleString()??'—'}</strong><span>records</span><small>{authors?.toLocaleString()??'—'} author groups</small></div>
 <div className="source-collection-actions"><button type="button" className="source-collection-browse" onClick={()=>openCatalogue(c.id)} aria-label={'Browse collection: '+c.label}>Browse collection <ArrowRight size={14}/></button><button type="button" aria-expanded={open} aria-controls={'preview-'+c.id} aria-label={(open?'Hide':'Preview')+' works: '+c.label} onClick={()=>setExpanded(open?expanded.filter(id=>id!==c.id):[...expanded,c.id])}>{open?'Close preview':'Preview works'}<ChevronDown size={14}/></button></div></div>
 <div id={'preview-'+c.id} hidden={!open} className="source-collection-preview"><p className="source-board-kicker">Selected records in this collection</p>{!entries?<p role="status">{failed?'Source records could not load. Reload to try again.':'Loading source records…'}</p>:examples.length?<div className="source-collection-examples">{examples.map(e=><button key={e.id} type="button" onClick={()=>setSelected(e)} aria-label={'Open source details: '+e.title+' — '+e.author}><span className="source-example-kind">{e.kind}</span><strong>{e.title}</strong><span>{e.author}</span><small>Source & edition <ArrowRight size={12}/></small></button>)}</div>:<p>No preview records are available in this snapshot. Browse the collection to see its records.</p>}</div>
 </article>;
 })}</div>{!matches.length&&<div className="source-board-empty"><p>No collections match.</p><button onClick={()=>{setQuery('');setGroup('all');}}>Clear filters</button></div>}</div></div><RecordDetails entry={selected} directory={directory} onClose={()=>setSelected(null)}/></section>;
}
