import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Person } from '@/data/teachers/pages-types';
import { ContributorWorks } from '../../shared/AcquiredCatalogue';
import { getProfileShelf, languageCodes, languageLabel, type LanguageField } from '../../shared/acquired';

export interface ProfileWork { id: string; workId?: string | null; title: string; genre?: string; reference?: string; readable?: boolean; sourceUrl?: string | null; edition?: boolean; localReadable?: boolean; language?: LanguageField; format?: string; sharedCollection?: boolean }
export type OpenWork = (work: ProfileWork, origin?: HTMLElement) => void;

export function ProfileWorks({ person, onOpen }: { person: Person; onOpen: OpenWork }) {
  const [rows,setRows]=useState<ProfileWork[]>([]),[query,setQuery]=useState(''),[page,setPage]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [view,setView]=useState<'readable'|'all'>('readable');
  useEffect(()=>{
    const abort=new AbortController();
    setRows([]);setLoading(true);setError('');setPage(0);setQuery('');
    getProfileShelf<ProfileWork[]>(person.id,abort.signal)
      .then(data=>{if(!abort.signal.aborted)setRows(data);})
      .catch(e=>{if(!abort.signal.aborted)setError(e.message);})
      .finally(()=>{if(!abort.signal.aborted)setLoading(false);});
    return()=>abort.abort();
  },[person.id]);
  const readable=rows.filter(w=>w.readable).length;
  const found=useMemo(()=>rows.filter(w=>(view==='all'||w.readable)&&`${w.title} ${w.reference??''} ${w.genre??''}`.toLowerCase().includes(query.trim().toLowerCase())),[rows,query,view]);
  return <section className="drw-shelf" aria-label={`${person.short}'s works`}>
    <h3>Works in the library</h3>
    <p className="drw-note">Open a reading copy beside this profile. Shared collections include contributions by this person; formats and editions can overlap.</p>
    <div className="drw-shelf-views" role="group" aria-label="Works to show"><button type="button" aria-pressed={view==='readable'} onClick={()=>{setView('readable');setPage(0);}}>Readable texts{!loading?` · ${readable.toLocaleString()}`:''}</button><button type="button" aria-pressed={view==='all'} onClick={()=>{setView('all');setPage(0);}}>All records</button></div>
    <label className="drw-work-search">Find a work<input type="search" value={query} placeholder="Title or Bible reference" onChange={e=>{setQuery(e.target.value);setPage(0);}} /></label>
    {loading&&<p role="status" className="drw-note">Loading works…</p>}
    {error&&<p role="alert" className="drw-note">{error}</p>}
    {!loading&&!error&&<p className="drw-note">{found.length.toLocaleString()} {view==='readable'?'readable copies':'work and edition records'}{query?' match':''}. {view==='readable'?'This counts available copies, not this person’s complete works.':'Editions can overlap.'}</p>}
    <ul className="drw-worklist">{found.slice(page*20,(page+1)*20).map(w=><li key={w.id}><button type="button" aria-label={`${w.readable?'Read':'View catalogue record for'} ${w.title}`} onClick={e=>onOpen(w,e.currentTarget)}><span>{w.title}</span><small>{w.reference?`${w.reference} · `:''}{w.sharedCollection?'Shared collection':(w.genre??'work').replace(/-/g,' ')}{languageCodes(w.language).length?` · ${languageLabel(w.language)}`:''}{w.format?` · ${w.format.toUpperCase()}`:''} · <em className={w.readable?'drw-work-readable':'drw-work-catalogue'}>{w.localReadable?'Read local copy':w.readable?'Read text':'Catalogue only · no held reading copy'}</em></small>{w.readable&&<ArrowLeft size={15} aria-hidden />}</button></li>)}</ul>
    {!loading&&!error&&!found.length&&<p className="drw-empty">{query?'No works match this search.':view==='readable'?'No readable copies are available here yet. Choose All records to see the catalogue entries.':'No catalogue works recorded yet.'}</p>}
    {found.length>20&&<nav className="drw-work-pages" aria-label="Profile work pages"><button disabled={!page} onClick={()=>setPage(p=>p-1)}><ArrowLeft size={14} aria-hidden />Previous</button><span>{page+1} / {Math.ceil(found.length/20)}</span><button disabled={(page+1)*20>=found.length} onClick={()=>setPage(p=>p+1)}>Next<ArrowRight size={14} aria-hidden /></button></nav>}
    {person.acquiredId&&<details className="drw-editions"><summary>Source editions and formats</summary><p className="drw-note">These overlap the reading copies above; they are not additional works.</p><ContributorWorks contributor={{id:person.acquiredId}} onOpenWork={(w,origin)=>onOpen(w,origin)} /></details>}
  </section>;
}
