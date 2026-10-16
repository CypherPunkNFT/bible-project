import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react';
import research from '../../../../content/academic-research/07-empires-close-studies.json';
import { sourceById, sources } from './evidence';
import './close-studies.css';
import { Artifact, ArchiveScene, LandscapeArt, AuthorityArt } from './EmpireArt';

export const expandedSources = research.sources;
export function useEmpireSelection(key:string,initial:number,max:number) {
  const [value,setValue]=useState(()=>{try{const raw=sessionStorage.getItem('empire-'+key);const n=raw===null?initial:Number(raw);return Number.isInteger(n)&&n>=0&&n<=max?n:initial;}catch{return initial;}});
  useEffect(()=>{try{sessionStorage.setItem('empire-'+key,String(value));}catch{/* Storage can be disabled. */}},[key,value]);
  return [value,setValue] as const;
}
export function EvidenceLinks({ ids }: { ids: string[] }) {
  return <div className="ie-citations">{ids.map(id => {
    const s = expandedSources.find(s => s.id === id) ?? sourceById(id);
    return <a key={id} href={s.url}>{s.title}<ArrowUpRight size={12} aria-hidden="true"/></a>;
  })}</div>;
}
function Passage({ query, children }: { query: string; children: React.ReactNode }) {
  return <a className="ie-close-passage" href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(query)}&version=NRSVUE`}><BookOpen size={15} aria-hidden="true"/>{children}<ArrowUpRight size={12} aria-hidden="true"/></a>;
}

export function PowerRelationships({onSelect}:{onSelect:(id:string)=>void}) {
  const [selected,setSelected]=useEmpireSelection('power',0,2);
  const r=research.relationships[selected];
  return <section className="ie-power" aria-labelledby="ie-power-title">
    <div><p className="ie-eyebrow">Before the dates</p><h2 id="ie-power-title">What does it mean<br/>to <em>live under empire?</em></h2><p>Follow who exercises authority. These are different political arrangements, not three inevitable stages for every society.</p></div>
    <div><div className="ie-close-choices" role="group" aria-label="Political arrangements">{research.relationships.map((item,i)=><button type="button" aria-pressed={selected===i} aria-controls="ie-power-evidence" key={item.term} onClick={()=>setSelected(i)}>{item.term}</button>)}</div>
      <div id="ie-power-evidence"><p className="sr-only" role="status">Selected arrangement: {r.term}</p><AuthorityArt selected={selected} labels={r.chain}/><p>{r.explanation}</p><p className="ie-concrete">{r.example}</p><EvidenceLinks ids={r.sources}/><button type="button" className="ie-examine" onClick={()=>onSelect(r.period)}>See this relationship in the atlas <ArrowDown size={15} aria-hidden="true"/></button></div>
    </div>
  </section>;
}

export function DateDesk() {
  const [selected,setSelected]=useEmpireSelection('date',1,2);
  const d=research.dates[selected];
  return <section className="ie-date-desk" id="empire-dates" aria-labelledby="ie-date-title">
    <header className="ie-section-head"><div><p className="ie-eyebrow">02 / Build a chronology</p><h2 id="ie-date-title">A date is a conclusion.<br/><em>Inspect its foundations.</em></h2></div><p>Three anchors. Three different<br/>relationships between record and event.</p></header>
    <div className="ie-date-layout"><div className="ie-date-selector" role="group" aria-label="Chronological case">{research.dates.map((item,i)=><button type="button" key={item.id} aria-pressed={selected===i} aria-controls="ie-date-evidence" onClick={()=>setSelected(i)}><span>{item.place}</span><strong>{item.label}</strong><small>{item.tag}</small><ArrowRight size={18} aria-hidden="true"/></button>)}</div>
      <article id="ie-date-evidence"><p className="sr-only" role="status">Selected case: {d.place}, {d.label}. {d.question}</p><p className="ie-eyebrow">{d.tag}</p><h3>{d.question}</h3><div className="ie-date-strips">{d.contrast.map((line,i)=><div key={line}><span aria-hidden="true">{i===0?'I':i===1?'II':'III'}</span>{line}</div>)}</div>
        <dl className="ie-evidence-layers"><div><dt>Preserved record</dt><dd>{d.record}</dd></div><div><dt>Historical reconstruction</dt><dd>{d.inference}</dd></div><div><dt>Keep the limit</dt><dd>{d.limit}</dd></div></dl><EvidenceLinks ids={d.sources}/><Passage query={d.query}>{d.passage}</Passage>
      </article>
    </div>
    <details className="ie-counting"><summary>How can the same reign have two year counts?</summary><div><p>An <strong>accession year</strong> is the partial year when a king takes the throne. One system calls the next year “year 1”; another counts the partial year as “year 1.” The start of the calendar year matters too. This illustration explains the mechanism; it does not independently solve Jerusalem’s chronology.</p><table><caption>Illustrative counting systems · no absolute dates assigned</caption><thead><tr><th scope="col">System</th><th scope="col">Partial first year</th><th scope="col">Next year</th><th scope="col">Following year</th></tr></thead><tbody><tr><th scope="row">Accession-year counting</th><td>Accession</td><td>1</td><td>2</td></tr><tr><th scope="row">Non-accession counting</th><td>1</td><td>2</td><td>3</td></tr></tbody></table><EvidenceLinks ids={['chronology-method']}/></div></details>
  </section>;
}

export function SiegeWitnesses() {
  const [selected,setSelected]=useEmpireSelection('witness',0,2);
  const w=research.siege.witnesses[selected];

  return <div className="ie-witness-bench">
    <div className="ie-bench-intro"><span className="ie-eyebrow">Now change the kind of evidence</span><h3>{research.siege.question}</h3><p>{research.siege.intro}</p></div>
    <div className="ev-object-gallery" role="group" aria-label="Choose a kind of evidence">{research.siege.witnesses.map((item,i)=><button key={item.id} type="button" aria-pressed={selected===i} aria-controls="ie-witness-detail" onClick={()=>setSelected(i)}><Artifact kind={(['prism','relief','ramp'] as const)[i]}/><span>0{i+1} / {item.subtitle}</span><strong>{item.name}</strong><small>Examine this witness ↓</small></button>)}</div><p className="ev-caption">Illustrative object and landscape forms, not facsimiles or a measured siege reconstruction. Select an object to inspect what it can establish.</p>
    <details className="ev-matrix-details"><summary>Compare all four evidence questions</summary><div className="ie-matrix-scroll" tabIndex={0} role="region" aria-label="Evidence comparison"><table className="ie-witness-matrix"><caption>Categories, not confidence scores</caption><thead><tr><th scope="col">Question</th>{research.siege.witnesses.map(item=><th scope="col" key={item.id}>{item.name}</th>)}</tr></thead><tbody>{research.siege.claims.map((claim,i)=><tr key={claim}><th scope="row">{claim}</th>{research.siege.witnesses.map(item=><td key={item.id}>{item.cells[i]}</td>)}</tr>)}</tbody></table></div></details>
    <article className="ie-witness-detail" id="ie-witness-detail"><div><p className="sr-only" role="status">Selected witness: {w.name}. {w.title}</p><p className="ie-eyebrow">{w.name}</p><h3>{w.title}</h3><EvidenceLinks ids={w.sources}/></div><dl className="ie-evidence-layers"><div><dt>Evidence</dt><dd>{w.observation}</dd></div><div><dt>Interpretation</dt><dd>{w.inference}</dd></div><div><dt>Limit</dt><dd>{w.limit}</dd></div></dl></article>
    <p className="ie-bench-finding">{research.siege.finding}</p>
  </div>;
}

export function ArchiveLives() {
  const [selected,setSelected]=useEmpireSelection('archive',0,2);
  const [showInference,setShowInference]=useState(false);
  const a=research.archives[selected];
  return <section className="ie-archives" id="empire-lives" aria-labelledby="ie-lives-title">
    <header className="ie-section-head"><div><p className="ie-eyebrow">04 / Change the archive, change the view</p><h2 id="ie-lives-title">Exile is not<br/><em>one kind of life.</em></h2></div><p>A king on a ration list. A family in transactions.<br/>A community seeking permission.</p></header>
    <p className="ie-section-deck">Royal narratives compress people into a defeated population. Administrative records recover some names and activities—but each archive makes particular people visible and leaves others out.</p>
    <div className="ie-archive-selector" role="group" aria-label="Choose an archive">{research.archives.map((item,i)=><button type="button" key={item.id} aria-pressed={selected===i} aria-controls="ie-archive-evidence" onClick={()=>{setSelected(i);setShowInference(false);}}><span>0{i+1} / {item.place}</span><strong>{item.label}</strong><small>{item.date}</small></button>)}</div>
    <ArchiveScene kind={selected}/>
    <div id="ie-archive-evidence" className="ie-archive-evidence"><div className="ie-document-slip"><p className="sr-only" role="status">Selected archive: {a.place}. {a.object}</p><p className="ie-eyebrow">{a.language}</p><h3>{a.object}</h3><p className="ie-record-label">What the record preserves · paraphrase</p><p className="ie-record-text">{a.record}</p><EvidenceLinks ids={a.sources}/></div>
      <div className="ie-archive-reasoning"><p className="ie-eyebrow">From record to interpretation</p><p className="ev-reasoning-line">{a.nodes.join(" → ")}</p><button type="button" className="ie-examine" aria-expanded={showInference} aria-controls="ie-archive-inference" onClick={()=>setShowInference(!showInference)}>{showInference?'Close the interpretation':'What can we infer from this?'} <ArrowDown size={16} aria-hidden="true"/></button><div id="ie-archive-inference" hidden={!showInference}><p>{a.inference}</p></div><div className="ie-archive-limit"><span className="ie-eyebrow">Who remains outside the frame?</span><p>{a.limit}</p></div><Passage query={a.query}>{a.passage}</Passage></div>
    </div>
    <div className="ie-documentary-time"><div><p className="ie-eyebrow">An empire changes inside a family’s documentary horizon</p><h3>561–488 BCE</h3><p>Records concerning Rapā-Yāma, Ahīqam and descendants</p></div><div><div className="ie-family-line" role="img" aria-label="561 to 488 BCE documentary span; the Persian conquest of Babylon in 539 falls within it."><span className="ie-family-start">561</span><span className="ie-family-event" style={{left:`${(561-539)/(561-488)*100}%`}}>539<i/>Babylon falls</span><span className="ie-family-end">488</span></div><p>Proportional time span, not continuous documentation or individual lifespans. Return to Judah and enduring communities in Babylonia belong in the same history.</p><EvidenceLinks ids={['alstola-close']}/></div></div>
  </section>;
}

export function LandDebate() {
  const d=research.debate;
  const [landView,setLandView]=useEmpireSelection('landscape',0,2);
  return <section className="ie-land-debate" aria-labelledby="ie-land-title"><div className="ie-section-head"><div><p className="ie-eyebrow">The people who stayed</p><h2 id="ie-land-title">{d.question}</h2></div></div><p className="ie-section-deck">{d.commonGround}</p><div className="ev-land-explorer"><LandscapeArt mode={landView}/><div className="ev-land-choices" role="group" aria-label="Read the landscape">{['The capital','The countryside','The archaeological sample'].map((label,i)=><button key={label} aria-pressed={landView===i} onClick={()=>setLandView(i)}>{label}</button>)}</div><p className="ev-land-insight" role="status">{[d.commonGround,'Urban collapse can coexist with rural continuity. Continuity does not establish prosperity or tell us how every household lived.',d.method][landView]}</p><p className="ev-caption">Illustrative landscape and sampling grid, not a site map, settlement inventory or population reconstruction.</p></div><div className="ie-debate-arguments">{d.arguments.map(a=><article key={a.name}><p className="ie-eyebrow">{a.name}</p><h3>{a.claim}</h3><p>{a.reason}</p><EvidenceLinks ids={a.sources}/></article>)}</div><div className="ie-debate-method"><div><p className="ie-eyebrow">What makes this a real disagreement?</p><p>{d.method}</p></div><div><p className="ie-eyebrow">A later reassessment · Ramat Raḥel</p><p>{d.later}</p></div></div><EvidenceLinks ids={d.sources}/><Passage query="2 Kings 25:12;2 Kings 25:22-26">{d.passage}</Passage></section>;
}

export function ResearchTrail() {
  const [workIndex,setWorkIndex]=useEmpireSelection('reading',0,research.works.length-1);
  const activeWork=research.works[workIndex];
  return <div className="ie-research-trail"><p className="ie-section-deck">Follow a question into the work that can answer it. Editions establish readings; excavation reports establish contexts; historical arguments connect them. Consultation notes describe what was actually accessed for this study.</p><div className="ev-bookshelf" role="group" aria-label="Choose a research work">{research.works.map((work,i)=><button type="button" key={work.title} aria-pressed={i===workIndex} onClick={()=>setWorkIndex(i)}><span className="ev-book-top"/><span className="ev-book-author">{work.who}</span><strong>{['Royal inscriptions','The land after conquest','Documents of exiles','Judeans in Babylonia','Constructing a siege','Cyrus & restoration','Assyrian provinces'][i]}</strong><span className="ev-book-number">0{i+1}</span></button>)}</div><article className="ev-book-reading"><div><p className="ie-eyebrow">{activeWork.who}</p><h3>{activeWork.title}</h3></div><div><p>{activeWork.contribution}</p><small>{activeWork.status}</small><EvidenceLinks ids={[activeWork.source]}/></div></article><p className="ev-caption">Illustrative book jackets, not original covers. Seven selected routes into the research.</p><details className="ev-all-works"><summary>Read all seven annotations together</summary><ol>{research.works.map((work,i)=>{const s=expandedSources.find(s=>s.id===work.source)??sources.find(s=>s.id===work.source)!;return <li key={work.title}><span className="ie-work-number">0{i+1}</span><div><p className="ie-eyebrow">{work.who}</p><h3><a href={s.url}>{work.title}<ArrowUpRight size={15} aria-hidden="true"/></a></h3></div><div><p>{work.contribution}</p><small>{work.status}</small></div></li>;})}</ol></details><details className="ie-research-gaps"><summary>Research limits and work still to pursue</summary><ul>{research.remainingGaps.map(gap=><li key={gap}>{gap}</li>)}</ul></details></div>;
}
