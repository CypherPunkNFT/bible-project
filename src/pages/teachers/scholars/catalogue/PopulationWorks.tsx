import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPopulationShelf, readingLink, type PopulationRecord, type PopulationWork } from '../population';
import type { LibraryPerson } from './library';
import { languageCodes } from '../../shared/acquired';

export function PopulationRecordRow({ record: r }: { record: PopulationRecord }) {
  const link=readingLink(r);
  return <li className="pop-record">
    <div><strong>{r.title}</strong> <span>{r.origin} · {languageCodes(r.language).join(', ') || 'und'} · {r.availability}</span></div>
    <code>{r.id}</code>
    <p>Work ID: <code>{r.workId ?? 'unrecorded'}</code> · Edition ID: <code>{r.editionId ?? 'unrecorded'}</code></p>
    {r.intakeWorkIds?.length ? <p>Additional intake work IDs (not substituted): {r.intakeWorkIds.join(', ')}</p> : null}
    {r.intakeEditionIds?.length ? <p>Additional intake edition IDs (not substituted): {r.intakeEditionIds.join(', ')}</p> : null}
    {r.credits?.map((c,i)=><p key={i}>{c.role} · {c.basis}</p>)}
    {r.reviewWarning && <p className="pop-review">{r.reviewWarning}</p>}
    <p>Provenance: {r.source} · {r.provenance.join(' · ')}{r.intakeStatus && ` · Intake: ${r.intakeStatus}`}</p>
    <div className="pop-links">{link && <Link to={link.url}>{link.label}</Link>}{r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noreferrer">Original source</a>}{!link && <span>Reading copy not linked</span>}</div>
  </li>;
}

function WorkGroup({work:w}:{work:PopulationWork}) {
  const [limit,setLimit]=useState(12);
  return <details className="pop-work">
    <summary><strong>{w.title}</strong><span>{w.canonical?'Canonical work':'Work identity unestablished'} · {w.records.length} record representations · {w.editionIds.length} edition IDs</span><code>{w.workId ?? w.id}</code></summary>
    {w.credits.map((c,i)=><p key={i}>{c.role} · {c.basis}</p>)}
    {w.provenance.length>0 && <p>Provenance: {w.provenance.join(' · ')}</p>}
    {w.editionIds.length>0 && <p>Edition IDs: {w.editionIds.join(' · ')}</p>}
    {w.editions.map(e=><details key={e.id}><summary>{e.label || e.id} · {e.languages.join(', ')}</summary><code>{e.id}</code>{e.dates.length>0 && <pre>{JSON.stringify(e.dates,null,2)}</pre>}{e.evidence.map((v,i)=><p key={i}><a href={v.url} target="_blank" rel="noreferrer">{v.locator || 'Edition source'}</a></p>)}</details>)}
    <ul>{w.records.slice(0,limit).map(r=><PopulationRecordRow key={r.id} record={r}/>)}</ul>
    {limit<w.records.length && <button type="button" onClick={()=>setLimit(n=>n+24)}>Show more records ({limit} of {w.records.length})</button>}
    {!w.records.length && <p>Catalogue metadata only; no reading record is linked.</p>}
  </details>;
}

export function PopulationWorks({person:p}:{person:LibraryPerson}) {
  const [works,setWorks]=useState<PopulationWork[]|null>(null),[error,setError]=useState('');
  const [query,setQuery]=useState(''),[limit,setLimit]=useState(20);
  useEffect(()=>{
    let live=true;setWorks(null);setError('');
    getPopulationShelf(p.id).then(value=>{if(live)setWorks(value);}).catch(e=>{if(live)setError(e.message);});
    return()=>{live=false;};
  },[p.id]);
  const found=useMemo(()=>{
    const words=query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return works?.filter(w=>words.every(word=>[w.title,w.id,...w.editionIds,...w.records.map(r=>`${r.id} ${r.title} ${r.source}`)].join(' ').toLocaleLowerCase().includes(word)))??[];
  },[works,query]);
  return <div className="pop-works">
    <label>Find an associated work, edition or record<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(20);}} /></label>
    {!works&&!error&&<p role="status">Loading complete work associations…</p>}{error&&<p role="alert">{error}</p>}
    {works&&<p>{found.length.toLocaleString()} work / record groups · {works.filter(w=>w.canonical).length.toLocaleString()} canonical work IDs. Records without a work ID remain separate. Expand a title for editions, reading links and credit evidence.</p>}
    <div className="pop-work-list slim-scroll">{found.slice(0,limit).map(w=><WorkGroup key={w.id} work={w}/>)}</div>
    {limit<found.length&&<button type="button" onClick={()=>setLimit(n=>n+40)}>Show more works ({limit} of {found.length.toLocaleString()})</button>}
    {works&&!works.length&&<p>No held or canonical work is linked to this entry. A profile’s selected bibliography does not imply a held copy.</p>}
    {p.scholar&&<details><summary>Selected profile bibliography ({p.scholar.works.length})</summary><ul>{p.scholar.works.map(([title,year],i)=><li key={i}>{title} · {year} · selected bibliography; holdings above establish reading availability</li>)}</ul></details>}
  </div>;
}
