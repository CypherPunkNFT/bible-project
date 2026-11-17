import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPopulationShelf, readingLink, type PopulationRecord, type PopulationWork } from '../population';
import type { LibraryPerson } from './library';
import { languageCodes } from '../../shared/acquired';
import { formatNumber } from "@/lib/site-format";
import { WindowedRows } from '@/components/WindowedRows';

// A contributor's works, and each work's records, are drawn a window of rows at a time as the list box scrolls: no
// "Show more" (owner's scroll rule, 2026-11-17).
const recordKey = (r: PopulationRecord) => r.id;
const workKey = (w: PopulationWork) => w.id;

export function PopulationRecordRow({ record: r, row }: { record: PopulationRecord; row?: number }) {
  const link=readingLink(r);
  return <li className="pop-record" data-row={row}>
    <div><strong>{r.title}</strong> <span>{r.origin} · {languageCodes(r.language).join(', ') || 'und'} · {r.availability}</span></div>
    <code>{r.id}</code>
    <p>Work ID: <code>{r.workId ?? 'unrecorded'}</code> · Edition ID: <code>{r.editionId ?? 'unrecorded'}</code></p>
    {r.intakeWorkIds?.length ? <p>{`Additional intake work IDs (not substituted): ${r.intakeWorkIds.join(', ')}`}</p> : null}
    {r.intakeEditionIds?.length ? <p>{`Additional intake edition IDs (not substituted): ${r.intakeEditionIds.join(', ')}`}</p> : null}
    {r.credits?.map((c,i)=><p key={i}>{c.role} · {c.basis}</p>)}
    {r.reviewWarning && <p className="pop-review">{r.reviewWarning}</p>}
    <p>Provenance: {r.source} · {r.provenance.join(' · ')}{r.intakeStatus && ` · Intake: ${r.intakeStatus}`}</p>
    <div className="pop-links">{link && <Link to={link.url}>{link.label}</Link>}{r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noreferrer">Original source</a>}{!link && <span>Reading copy not linked</span>}</div>
  </li>;
}

function WorkGroup({work:w,row}:{work:PopulationWork;row:number}) {
  return <details className="pop-work" data-row={row}>
    <summary><strong>{w.title}</strong><span>{w.canonical?'Canonical work':'Work identity unestablished'}{' · '}{`${formatNumber(w.records.length)} record representations`}{' · '}{`${formatNumber(w.editionIds.length)} edition IDs`}</span><code>{w.workId ?? w.id}</code></summary>
    {w.credits.map((c,i)=><p key={i}>{c.role} · {c.basis}</p>)}
    {w.provenance.length>0 && <p>Provenance: {w.provenance.join(' · ')}</p>}
    {w.editionIds.length>0 && <p>{`Edition IDs: ${w.editionIds.join(' · ')}`}</p>}
    {w.editions.map(e=><details key={e.id}><summary>{e.label || e.id} · {e.languages.join(', ')}</summary><code>{e.id}</code>{e.dates.length>0 && <pre>{JSON.stringify(e.dates,null,2)}</pre>}{e.evidence.map((v,i)=><p key={i}><a href={v.url} target="_blank" rel="noreferrer">{v.locator || 'Edition source'}</a></p>)}</details>)}
    <WindowedRows as="ul" items={w.records} itemKey={recordKey} estimate={130} renderItem={(r,row)=><PopulationRecordRow key={r.id} record={r} row={row}/>}/>
    {!w.records.length && <p>Catalogue metadata only; no reading record is linked.</p>}
  </details>;
}

export function PopulationWorks({person:p}:{person:LibraryPerson}) {
  const [works,setWorks]=useState<PopulationWork[]|null>(null),[error,setError]=useState('');
  const [query,setQuery]=useState('');
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
    <label>Find an associated work, edition or record<input type="search" value={query} onChange={e=>setQuery(e.target.value)} /></label>
    {!works&&!error&&<p role="status">Loading complete work associations…</p>}{error&&<p role="alert">{error}</p>}
    {works&&<p>{`${formatNumber(found.length)} work / record groups · ${formatNumber(works.filter(w=>w.canonical).length)} canonical work IDs. Records without a work ID remain separate. Expand a title for editions, reading links and credit evidence.`}</p>}
    <div className="pop-work-list slim-scroll"><WindowedRows items={found} itemKey={workKey} estimate={70} renderItem={(w,row)=><WorkGroup key={w.id} work={w} row={row}/>}/></div>
    {works&&!works.length&&<p>No held or canonical work is linked to this entry. A profile’s selected bibliography does not imply a held copy.</p>}
    {p.scholar&&<details><summary>{`Selected profile bibliography (${formatNumber(p.scholar.works.length)})`}</summary><ul>{p.scholar.works.map(([title,year],i)=><li key={i}>{`${title} · ${year} · selected bibliography; holdings above establish reading availability`}</li>)}</ul></details>}
  </div>;
}
