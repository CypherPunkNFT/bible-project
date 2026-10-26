import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, ChevronDown, FileText, FolderOpen, Search, X } from 'lucide-react';
import { AcquisitionLinks } from './CorpusDashboard';
import { matchesCatalogue, missingIdentity, facetValues, selectedValues, toggleFacet, eraLabels, traditionLabel, type FacetKey, type CatalogueFilters, type ReviewFilter } from './dashboard-model';
import type { Directory, SourceEntry } from './types';
import './source-catalogue.css';

const tones = ['#69c7bb', '#d69c79', '#a99bd6', '#d48faf', '#96b784', '#d7b569', '#83aed5', '#cf9191'];
const holdingsOptions = [['all', 'All records'], ['held', 'Acquired files'], ['catalog', 'Catalogue & citations']];
const reviewOptions: [ReviewFilter, string][] = [['all', 'Any review state'], ['identity', 'Missing title / author'], ['source', 'Missing source link'], ['unassigned', 'Collection unassigned']];
export const SOURCE_PAGE_SIZE = 24;
const number = (value: number) => value.toLocaleString();

interface Props {
  directory: Directory; entries: SourceEntry[] | null; matches: SourceEntry[]; failed: boolean;
  filters: CatalogueFilters; onFilters: (next: CatalogueFilters) => void;
  facetState?: 'loading' | 'ready' | 'unavailable' | 'stale';
  page: number; onPage: (page: number) => void;
}

export function RecordDetails({ entry, directory, onClose }: { entry: SourceEntry | null; directory: Directory; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!entry || !element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!element.open) element.showModal();
    return () => { if (element.open) element.close(); document.body.style.overflow = overflow; };
  }, [entry]);
  return <dialog ref={dialog} className="source-detail-dialog" aria-labelledby="source-detail-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    {entry && <div className="source-detail-content">
      <header><span className="source-eyebrow">Source record</span><button type="button" aria-label="Close source details" onClick={onClose}><X size={20}/></button></header>
      <p className="source-detail-status">{entry.status} · {entry.kind}</p>
      <h2 id="source-detail-title">{entry.title}</h2><p className="source-detail-author">{entry.author || 'Author not recorded'}</p>
      {missingIdentity(entry) && <p className="source-review-badge">Attribution needs review</p>}
      <section><h3>Identity & collection</h3><dl><dt>Record ID</dt><dd><code>{entry.id}</code></dd><dt>Collections</dt><dd>{entry.categories.map(id => directory.collections.find(c => c.id === id)?.label ?? id).join(' · ') || 'Not recorded'}</dd><dt>Recorded role</dt><dd>{entry.role || 'Not recorded'}</dd></dl></section>
      <section><h3>Author tradition & era</h3><p>These labels describe recorded authors, not the date or doctrinal reliability of this edition.</p>
      {entry.metadata?.authors.length ? entry.metadata.authors.map(author=><div className="source-author-facts" key={author.id}><strong>{author.name}</strong><dl><dt>Recorded traditions</dt><dd>{author.traditions.map(traditionLabel).join(' · ')||'Unrecorded'}</dd><dt>Author period</dt><dd>{eraLabels[author.era??'unrecorded']}{author.born!==null && ' · '+(author.approximate?'c. ':'')+author.born+(author.died?'–'+author.died:'')}</dd><dt>Date basis</dt><dd>{author.dateStatus.replace(/-/g,' ')}{author.dateBasis&&' · '+author.dateBasis}{author.sourceConflict&&' · conflicting source labels retained'}</dd><dt>Linked author ID</dt><dd><code>{author.id}</code></dd></dl>{author.evidence.map((url,index)=><a key={url} href={url}>Recorded evidence {index+1} ↗</a>)}</div>) : <p>No eligible author metadata is linked to this exact catalogue record yet. It remains in Unrecorded / unresolved.</p>}
      </section>
      {entry.metadata?.basis && <p className="source-card-note">Metadata link: {entry.metadata.basis}.</p>}
      {entry.metadata?.caution && <section><h3>Source-specific reading caution</h3><p>{entry.metadata.caution}</p></section>}
      <section><h3>Original sources & editions</h3><AcquisitionLinks entry={entry}/></section>
      {entry.basis && <section><h3>Recorded use basis</h3><p>{entry.basis}</p></section>}
      {!!entry.citedOn?.length && <section><h3>Cited on this site</h3>{entry.citedOn.map(c => <Link key={c.feature + c.page} to={c.address} onClick={onClose}>{c.feature} → {c.page}</Link>)}</section>}
      <section><h3>Review limits</h3><p>Acquired means a file was verified on disk at the catalogue date. Text integrity, complete context, source independence and suitability for a claim have not been assessed in this catalogue. Edition-specific permissions and source notices still apply.</p></section>
    </div>}
  </dialog>;
}

export function SourceCatalogue({ directory, entries, matches, failed, facetState, filters, onFilters, page, onPage }: Props) {
  const [selected, setSelected] = useState<SourceEntry | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string[]>(['category']);
  const [providerQuery, setProviderQuery] = useState('');
  useEffect(() => { scroll.current?.scrollTo({top:0}); }, [page, filters]);
  const clear = () => { setProviderQuery(''); onFilters({category:'all', holdings:'all', review:'all', query:'', facets:{}}); };
  const shown = matches.slice(page * SOURCE_PAGE_SIZE, (page + 1) * SOURCE_PAGE_SIZE);
  // Phones list the cards in the page itself (no inner scroll box), so the pager repeats under the last card and turning
  // a page from there goes back up to the first card.
  const turn = (next: number, fromBottom: boolean) => { onPage(next); if (fromBottom) stage.current?.scrollIntoView({block:'start'}); };
  const pager = (fromBottom = false) => <nav className={fromBottom ? 'source-card-pagination source-card-pagination-bottom' : 'source-card-pagination'} aria-label={fromBottom ? 'Catalogue pages, end of list' : 'Catalogue pages'}><button type="button" disabled={page === 0} onClick={() => turn(page - 1, fromBottom)}>Previous</button><span>{matches.length ? page * SOURCE_PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * SOURCE_PAGE_SIZE, matches.length)} of {number(matches.length)}</span><button type="button" disabled={(page + 1) * SOURCE_PAGE_SIZE >= matches.length} onClick={() => turn(page + 1, fromBottom)}>Next</button></nav>;
  const groups = useMemo((): {key:FacetKey; name:string; note?:string; options:string[][]}[] => {
    const values = (key:FacetKey) => [...new Set((entries ?? []).flatMap(e=>facetValues(e,key)))].sort();
    return [
      {key:'category',name:'Collection',options:[['all','All collections'],...directory.collections.map(c=>[c.id,c.label])]},
      {key:'tradition',name:'Tradition',note:'Recorded author tradition. Labels can overlap; they do not endorse or classify every claim in a work.',options:[['all','Any tradition'],...values('tradition').filter(v=>v!=='unrecorded').map(v=>[v,traditionLabel(v)]),['unrecorded','Unrecorded / unresolved']]},
      {key:'era',name:'Author era',note:'Four broad periods by recorded birth year, not publication date. Unresolved or missing dates stay separate.',options:[['all','Any era'],...Object.entries(eraLabels)]},
      {key:'holdings',name:'Holdings',options:holdingsOptions},
      {key:'format',name:'Source format',note:'Formats recorded on source links; a listed format is not a text-quality assessment.',options:[['all','Any format'],...values('format').map(v=>[v,v==='unrecorded'?'Unrecorded':v==='text'?'Plain text':v==='source link'?'Source link':v.toUpperCase()])]},
      {key:'provider',name:'Source host',note:'Hostnames of recorded links. Multiple hosts can refer to the same underlying source.',options:[['all','Any source host'],...values('provider').map(v=>[v,v==='unrecorded'?'Unrecorded':v])]},
      {key:'use',name:'Use on this site',options:[['all','Any site use'],['cited','Cited on our pages'],['not-cited','No recorded site citation']]},
      {key:'review',name:'Review queue',options:reviewOptions},
    ];
  }, [entries, directory.collections]);
  const counts = useMemo(() => Object.fromEntries(groups.map(group=>{
    const scope=(entries ?? []).filter(e=>matchesCatalogue(e,filters,group.key));
    const totals:Record<string,number>={all:scope.length};
    for(const entry of scope) for(const value of facetValues(entry,group.key)) totals[value]=(totals[value]??0)+1;
    return [group.key,totals];
  })), [entries, groups, filters]);
  const active=groups.flatMap(group=>selectedValues(filters,group.key).map(value=>({key:group.key,value,label:group.options.find(([id])=>id===value)?.[1] ?? value})));
  const facet = (group:typeof groups[number]) => {
    const selected=selectedValues(filters,group.key), open=expanded.includes(group.key);
    const metadataGroup=group.key==='tradition'||group.key==='era';
    const available=!metadataGroup||facetState==='ready';
    const options=group.key==='provider' && providerQuery.trim() ? group.options.filter(([id,label])=>id==='all'||selected.includes(id)||label.includes(providerQuery.toLowerCase().trim())) : group.options;
    return <details key={group.key} className="source-facet" open={open}>
      <summary onClick={event=>{event.preventDefault();setExpanded(open?expanded.filter(key=>key!==group.key):[...expanded,group.key]);}}><span>{group.name}</span>{selected.length>0 && <b>{selected.length}</b>}<ChevronDown size={14} aria-hidden/></summary>
      {!open && selected.length>0 && <span className="sr-only">{selected.join(', ')}</span>}
      <div className="source-facet-body">
      {group.note && <p className="source-facet-note">{group.note}</p>}
      {group.key==='provider' && <input className="source-host-search" type="search" aria-label="Find a source host" placeholder="Find a host…" value={providerQuery} onChange={event=>setProviderQuery(event.target.value)}/>}
      {!available && <p className="source-facet-note" role="status">{facetState==='loading'?'Loading author metadata…':facetState==='stale'?'Author metadata needs a snapshot refresh. Other filters remain available.':'Author metadata could not load. Reload to retry.'}</p>}
      <div className="source-facet-options">{options.map(([id,label])=>{
        const chosen=id==='all'?!selected.length:selected.includes(id);
        return <button key={id} type="button" disabled={!available} aria-pressed={chosen} onClick={()=>onFilters(toggleFacet(filters,group.key,id))} className={!counts[group.key][id]?'source-facet-zero':undefined}><span className="source-facet-check" aria-hidden>{chosen&&<Check size={11}/>}</span><span>{label}</span><small>{entries&&available?number(counts[group.key][id]??0):'…'}</small></button>;
      })}</div>
      </div>
    </details>;
  };
  return <section id="bibliography" className="source-catalogue">
    <div className="source-catalogue-heading"><h2>Catalogue</h2><p>Browse works, editions and citations. Open a card for its source links, credits and review limits.</p></div>
    <div className="source-catalogue-layout">
      <aside className="source-facets" aria-label="Filter the source catalogue">
        <div className="source-facets-heading"><strong>Filter</strong><button type="button" onClick={clear}>Clear all</button></div>
        <label className="source-facet-search"><Search size={16} aria-hidden/><input type="search" aria-label="Filter catalogue by title, author or source" value={filters.query} placeholder="Title, author or source" onChange={e => onFilters({...filters, query:e.target.value})}/></label>
        <div className="source-facet-controls"><span>Refine your view</span><button type="button" onClick={()=>setExpanded(expanded.length?[]:groups.map(g=>g.key))}>{expanded.length?'Collapse all':'Expand all'}</button></div>
        {groups.map(facet)}
      </aside>
      <div className="source-card-results">
        <div ref={stage} className="source-card-stage">
        <div className="source-card-toolbar"><p role="status"><strong>{entries ? number(matches.length) : '…'}</strong> of {entries ? number(entries.length) : '…'} records</p>{active.length > 0 && <div className="source-active-filters" aria-label="Active catalogue filters">{active.map(item=><button type="button" key={item.key+item.value} aria-label={'Remove filter: '+item.label} onClick={()=>onFilters(toggleFacet(filters,item.key,item.value))}>{item.label}<X size={11} aria-hidden/></button>)}</div>}{pager()}</div>
        <div ref={scroll} className="source-card-scroll" role="region" aria-label="Source catalogue cards" tabIndex={0}>
          <div className="source-card-grid">{shown.map(entry => {
            const index = directory.collections.findIndex(c => entry.categories.includes(c.id));
            const tone = tones[index] ?? 'var(--muted)';
            const collection = directory.collections.find(c => entry.categories.includes(c.id));
            const formats = [...new Set(entry.links.map(link => link.format).filter(Boolean))].join(' · ');
            const providers = [...new Set(entry.links.map(link => link.name || (() => {try {return new URL(link.url).hostname.replace(/^www\./,'');} catch {return 'Source link';}})()))];
            return <article className="source-work-card" key={entry.id} style={{'--source-tone':tone} as CSSProperties}>
              <div className="source-work-top"><span className="source-work-mark" aria-hidden>{entry.held ? <BookOpen size={23}/> : <FileText size={23}/>}</span><span className="source-work-badge">{entry.held ? 'Acquired file' : entry.citedOn?.length ? 'Cited on site' : 'Catalogue record'}</span></div>
              <h3>{entry.title}</h3><p className="source-work-author">{entry.author || 'Author not recorded'}</p>
              <p className="source-work-collection"><FolderOpen size={12} aria-hidden/>{collection?.label ?? 'Collection unassigned'}</p>
              {missingIdentity(entry) && <span className="source-work-warning">Attribution needs review</span>}
              <div className="source-work-origin"><span>{formats || entry.kind}</span><p>{providers.length ? providers.slice(0,2).join(' · ') + (providers.length > 2 ? ' +' + (providers.length - 2) : '') : 'Source not recorded'}</p></div>
              <span className="source-work-action">Source & details <ArrowRight size={14}/></span>
              <button type="button" className="source-work-hit" aria-label={'Open source details: ' + entry.title + ' — ' + (entry.author || 'Author not recorded')} onClick={() => setSelected(entry)}/>
            </article>;
          })}</div>
          {!entries && <p role="status" className="source-card-empty">{failed ? 'The catalogue could not load. Reload to try again.' : 'Opening the catalogue…'}</p>}
          {entries && !shown.length && <div className="source-card-empty"><p>No records match these filters.</p><button type="button" onClick={clear}>Clear all filters</button></div>}
          {shown.length > 0 && pager(true)}
        </div>

        </div>

      </div>
    </div>
    <RecordDetails entry={selected} directory={directory} onClose={() => setSelected(null)}/>
  </section>;
}
