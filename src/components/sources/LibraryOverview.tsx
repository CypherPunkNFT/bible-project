import { ArrowRight, BookOpen, Files, Fingerprint, FolderOpen, Library, ScanText, ShieldQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import type { Directory, SourceEntry } from './types';
import { missingIdentity, type ReviewFilter } from './dashboard-model';
import { CollectionArt, collectionTones } from './CollectionArt';
import './source-overview.css';
const n = (value: number) => value.toLocaleString();
export const snapshotDate = (value: string) => new Date(value).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
type Props = { directory: Directory; entries: SourceEntry[] | null; openCatalogue: (category?: string, review?: ReviewFilter) => void };
const tone=(color:string)=>({'--overview-tone':color} as CSSProperties);
export function CollectionGrid({ directory, entries, openCatalogue }: Props) {
 return <div className="source-overview-collections">{directory.collections.map(c => {
 const count = entries ? entries.filter(e => e.categories.includes(c.id)).length : directory.split?.collections[c.id]?.records;
 return <button type="button" key={c.id} className="source-overview-collection" style={tone(collectionTones[c.id]??'#9badaf')} onClick={() => openCatalogue(c.id)} aria-label={'Browse collection: '+c.label}>
 <span className="source-overview-art"><CollectionArt id={c.id}/></span><span className="source-overview-collection-copy"><strong>{c.label}</strong><small>{count === undefined ? '—' : n(count)} records</small><span className="sr-only">{c.definition}</span></span><ArrowRight className="source-overview-go" size={14} aria-hidden/>
 </button>;
 })}</div>;
}
export function LibraryOverview({ directory, entries, scriptureCount, openCatalogue }: Props & { scriptureCount: number }) {
 const c = directory.corpus;
 const metrics=[
 {value:n(scriptureCount),label:'Bible editions',note:'Read or download',href:'#scriptures',icon:BookOpen,color:'#d7b569'},
 {value:n(entries?.length ?? directory.split?.records ?? 0),label:'Catalogue records',note:'Works, editions & citations',href:'#bibliography',icon:Library,color:'#69c7bb'},
 {value:n(c.files),label:'Held files',note:'Includes supporting files',href:'#quality',icon:Files,color:'#a99bd6'},
 {value:directory.intakeSnapshot ? n(directory.intakeSnapshot.textReady) : '—',label:'Extracted texts',note:'Extraction is not quality approval',href:'#quality',icon:ScanText,color:'#83aed5'},
 ];
 const attention=[
 {title:'Missing title or author',detail:'Acquired records · dated audit',value:n(entries?entries.filter(e=>e.held&&missingIdentity(e)).length:c.incompleteIdentity),icon:Fingerprint,color:'#d7b569',category:'all',review:'identity' as ReviewFilter},
 {title:'Collection unassigned',detail:'Review placement and relevance',value:n(entries?.filter(e=>e.categories.includes('research')).length??directory.split?.collections.research?.records??0),icon:FolderOpen,color:'#9badaf',category:'research',review:'all' as ReviewFilter},
 ];
 return <section id="overview" className="source-overview" aria-label="Library overview">
 <div className="source-overview-metrics">{metrics.map(m=><Link key={m.label} to={m.href} style={tone(m.color)}><m.icon className="source-overview-watermark" aria-hidden strokeWidth={1}/><span className="source-overview-metric-label"><m.icon size={15} aria-hidden/>{m.label}</span><strong>{m.value}</strong><small>{m.note}<ArrowRight size={14} aria-hidden/></small></Link>)}</div>
 <div className="source-overview-layout"><section className="source-overview-library"><header className="source-overview-heading"><div><h2>Browse the library</h2><p>Follow a collection into its works and editions.</p></div><Link to="#collections">Explore collections <ArrowRight size={14} aria-hidden/></Link></header><CollectionGrid directory={directory} entries={entries} openCatalogue={openCatalogue}/>

 </section>
 <aside className="source-overview-attention"><header className="source-overview-heading"><div><h2>Needs attention</h2><p>Inspect the gaps and the evidence behind them.</p></div><Link to="#quality" aria-label="Open Review & gaps"><ShieldQuestion size={19} aria-hidden/></Link></header>
 <div className="source-overview-attention-list">{attention.map(a=><button type="button" className="source-overview-issue" style={tone(a.color)} key={a.title} onClick={()=>openCatalogue(a.category,a.review)}><a.icon className="source-overview-watermark" aria-hidden strokeWidth={1}/><span className="source-overview-issue-label"><a.icon size={17} aria-hidden/>{a.title}</span><strong>{a.value}<small>records</small></strong><span className="source-overview-issue-detail">{a.detail}<ArrowRight size={14} aria-hidden/></span></button>)}
 <Link className="source-overview-issue source-overview-readiness" style={tone('#83aed5')} to="#quality"><ScanText className="source-overview-watermark" aria-hidden strokeWidth={1}/><span className="source-overview-issue-label"><ScanText size={17} aria-hidden/>Text & context quality</span><p>Readiness is not yet measured across the library.</p><span className="source-overview-issue-detail">Review evidence & gaps <ArrowRight size={14} aria-hidden/></span></Link></div>
 </aside>
 <div className="source-overview-follow"><BookOpen size={22} aria-hidden/><div><h3>Follow a source</h3><p>Find the edition, inspect its origin, then read it in context.</p></div><nav aria-label="Source starting points"><button type="button" onClick={()=>openCatalogue()}>Catalogue <ArrowRight size={12} aria-hidden/></button><Link to="#scriptures">Bible editions <ArrowRight size={12} aria-hidden/></Link><Link to="#foundations">Credits & permissions <ArrowRight size={12} aria-hidden/></Link></nav></div>
 </div>
 <p className="source-snapshot">Holdings: {snapshotDate(c.measured_at)} · Catalogue: {snapshotDate(c.bibliographyUpdatedAt)}. Dated snapshots with different scopes; file and catalogue totals are not interchangeable.</p>
 </section>;
}
