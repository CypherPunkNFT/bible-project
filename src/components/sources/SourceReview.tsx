import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Copy, FileQuestion, FileText, Fingerprint, FolderOpen, Link2, ListChecks, ScanText, SearchCheck, ShieldQuestion, Users } from 'lucide-react';
import { missingIdentity, needsReview, type ReviewFilter } from './dashboard-model';
import { snapshotDate } from './LibraryOverview';
import type { Directory, SourceEntry } from './types';
const n=(value:number|undefined)=>value===undefined?'—':value.toLocaleString();
const assessments=[
 {title:'Text integrity',icon:ScanText,detail:'Compare the extraction with the original; inspect missing pages, broken text and OCR.'},
 {title:'Work & edition',icon:Fingerprint,detail:'Identify the author, translator, editor, edition and acquisition evidence.'},
 {title:'Context & relevance',icon:BookOpen,detail:'Read the complete unit; distinguish the author’s argument from quotations and notes.'},
 {title:'Independent evidence',icon:Users,detail:'Keep alternate editions and repeated quotations distinct from independent witnesses.'},
 {title:'Reader & permissions',icon:SearchCheck,detail:'Check the actual reading copy, exact location and source-specific use terms.'},
 {title:'Use decision',icon:ListChecks,detail:'Record suitable uses, limitations or an exclusion with its reason. Retain the original.'},
];
export function SourceReview({directory,entries,openCatalogue,reports,repo,showReports}:{directory:Directory;entries:SourceEntry[]|null;openCatalogue:(category?:string,review?:ReviewFilter)=>void;reports:string[][];repo:string;showReports:boolean}) {
 const [view,setView]=useState(showReports?'reports':'gaps');
 useEffect(()=>{if(showReports)setView('reports');},[showReports]);
 const c=directory.corpus,intake=directory.intakeSnapshot;
 const queues=[
 {title:'Missing attribution',icon:Fingerprint,count:entries?entries.filter(e=>e.held&&missingIdentity(e)).length:c.incompleteIdentity,detail:'Acquired records with a missing title or author.',category:'all',review:'identity' as ReviewFilter,action:'Inspect acquired records'},
 {title:'Missing source link',icon:Link2,count:entries?.filter(e=>needsReview(e,'source')).length,detail:'Records without an HTTP source destination.',category:'all',review:'source' as ReviewFilter,action:'Inspect source records'},
 {title:'Collection unassigned',icon:FolderOpen,count:entries?.filter(e=>e.categories.includes('research')).length??directory.split?.collections.research?.records,detail:'Works awaiting subject and collection placement.',category:'research',review:'all' as ReviewFilter,action:'Review collection placement'},
 ];
 return <section id="quality" className="source-board"><header className="source-board-heading source-board-heading-controls"><div className="source-board-intro"><h2>Review & gaps</h2><p>Find what needs attention and inspect the evidence behind it.</p></div>
 <div className="source-board-tabs source-review-tabs" role="group" aria-label="Review view">{[['gaps','Recorded gaps'],['assessment','Assessment criteria'],['reports','Collection reports'],['processing','Processing receipts']].map(([id,label])=><button key={id} type="button" aria-pressed={view===id} onClick={()=>setView(id)}>{label}{id==='reports'&&<small>{reports.length}</small>}</button>)}</div></header>
 {view==='gaps'&&<div><div className="source-review-section"><h3>Catalogue review queues</h3><span>Open a queue to inspect its records</span></div><div className="source-review-grid">{queues.map(q=><button type="button" className="source-board-card source-review-card" key={q.title} onClick={()=>openCatalogue(q.category,q.review)}><q.icon className="source-board-watermark" aria-hidden strokeWidth={1}/><div className="source-board-card-top"><span className="source-board-icon"><q.icon size={22}/></span><span className="source-board-kicker">Catalogue queue</span></div><h3>{q.title}</h3><p>{q.detail}</p><div className="source-board-counts"><span><strong>{n(q.count)}</strong><small>records</small></span></div><span className="source-board-action">{q.action}<ArrowRight size={15}/></span></button>)}</div>
 <div className="source-review-section"><h3>Text preparation</h3><span>{intake?'Snapshot · '+snapshotDate(intake.measuredAt):'Snapshot not recorded'}</span></div><div className="source-review-grid">{[
 {title:'Awaiting text intake',icon:FileText,count:intake?.pendingText,detail:'Later text candidates awaiting extraction and corpus intake.'},
 {title:'Recorded text gaps',icon:FileQuestion,count:intake?.textGaps,detail:'Gaps recorded by the existing text audit.'},
 {title:'Duplicate representations',icon:Copy,count:intake?.duplicates,detail:'Repeated representations; alternate editions can still be useful.'},
 ].map(q=><article className="source-board-card source-review-card" style={{'--board-tone':'#83aed5'} as CSSProperties} key={q.title}><q.icon className="source-board-watermark" aria-hidden strokeWidth={1}/><div className="source-board-card-top"><span className="source-board-icon"><q.icon size={22}/></span><span className="source-board-kicker">Snapshot total</span></div><h3>{q.title}</h3><div className="source-board-counts"><span><strong>{n(q.count)}</strong></span></div><p>{q.detail}</p></article>)}</div><p className="source-review-note">Text preparation totals are not yet linked to individual catalogue records.</p></div>}
 {view==='assessment'&&<><div className="source-review-section"><h3>Evidence needed before using a source</h3><span>Not yet linked per record</span></div><div className="source-review-grid">{assessments.map(a=><article className="source-board-card source-assessment-card" key={a.title}><a.icon className="source-board-watermark" aria-hidden strokeWidth={1}/><div className="source-board-card-top"><span className="source-board-icon"><a.icon size={22}/></span><span className="source-board-kicker">Review dimension</span></div><h3>{a.title}</h3><p>{a.detail}</p></article>)}</div></>}
 {view==='reports'&&<div id="research"><div className="source-review-section"><h3>Existing collection research</h3><a className="source-review-backlog" href={repo+'content/library/BACKLOG.md'}>Collection backlog <ArrowUpRight size={13}/></a></div><div className="source-board-stage source-report-stage"><div className="source-board-scroll" role="region" aria-label="Collection report cards" tabIndex={0}><div className="source-board-grid">{reports.map(([label,folder])=><a key={folder} className="source-board-card source-report-card" href={repo+'content/library/reports/'+folder+'/REPORT.md'}><FileText className="source-board-watermark" aria-hidden strokeWidth={1}/><h3>{label}</h3><span className="source-board-action">Read report<ArrowUpRight size={14}/></span></a>)}</div></div></div></div>}
 {view==='processing'&&<><div className="source-review-grid source-processing-cards">{[
 ['Searchable passages',n(c.coverage.counts.chunks),'Search snapshot · '+snapshotDate(c.coverage.built_at),ScanText],
 ['Worker-reported vectors',n(c.embedding.indexed),n(c.embedding.total)+' total · '+snapshotDate(c.embedding.updated_at),SearchCheck],
 ['Worker state',c.embedding.state.replace(/_/g,' '),'Reported · '+snapshotDate(c.embedding.updated_at),ShieldQuestion],
 ].map(([title,value,detail,Icon])=>{const Mark=Icon as typeof ScanText;return <article className="source-board-card" key={String(title)}><Mark className="source-board-watermark" aria-hidden strokeWidth={1}/><div className="source-board-card-top"><span className="source-board-icon"><Mark size={22}/></span><span className="source-board-kicker">Dated receipt</span></div><h3>{String(title)}</h3><div className="source-board-counts"><span><strong>{String(value)}</strong></span></div><p>{String(detail)}</p></article>;})}</div><p className="source-review-note">This worker report does not confirm current source reconciliation, index readiness or source quality. Later acquisitions and unresolved checks remain separate.</p></>}
 </section>;
}
