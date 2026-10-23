// The study "From manuscript to printed Bible" (/study/from-manuscript-to-printed-bible). The opening and timeline lead into
// six chapters; chapters 04 and 06 hold several views behind a switch. Content comes from the study's dossier
// (content/academic-research/05-from-manuscript-to-printed-bible.json); overhaul.css carries the page's 2026-10 look.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Check, Layers3, Printer, RotateCcw } from 'lucide-react';
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';
import { Cites, SectionHeading } from './PrintRoomShared';
import { CopyHistory, ErasmusEvidence, CriticalDesk } from './PrintRoomInvestigations';
import { ProofSheet } from './ProofSheet';
import { Architecture } from './Architecture';
import { ChapterRow, Opening } from './Opening';
import { PrintTimeline } from './PrintTimeline';
import { TranslationDesk } from './TranslationDesk';
import './print-room.css';
import './proof-sheet.css';
import './overhaul.css';

const { editions, sources } = dossier;

function PressExercise() {
  const [corrected,setCorrected] = useState(false);
  const [sheets,setSheets] = useState<boolean[]>([]);
  return <div className="pr-press-exercise">
    <div className="pr-type-case"><span className="pr-kicker">The setting · reversed for printing</span><div className="pr-type-line" aria-label={corrected ? 'Type set to PRINT' : 'Type set to PRNIT, a deliberate error'} aria-live="polite">{(corrected ? 'PRINT' : 'PRNIT').split('').map((c,i)=><span key={i}>{c}</span>)}</div><small>Invented exercise word, not a biblical variant</small></div>
    <div className="pr-press-actions"><button onClick={()=>setSheets(s=>[...s,corrected].slice(-6))}><Printer size={16}/> Pull a sheet</button><button aria-pressed={corrected} onClick={()=>setCorrected(c=>!c)}>{corrected ? <Check size={15}/> : <Layers3 size={15}/>} {corrected ? 'Corrected setting' : 'Correct the setting'}</button><button aria-label="Reset printing exercise" className="pr-reset" onClick={()=>{setSheets([]);setCorrected(false);}}><RotateCcw size={15}/></button></div>
    <div className="pr-output" role="status" aria-live="polite">{sheets.length ? <><div className="pr-proof-sheets">{sheets.map((ok,i)=><span key={i}><small>Sheet {i+1}</small><strong>{ok ? 'PRINT' : 'PRNIT'}</strong><em>{ok ? 'corrected' : 'uncorrected'}</em></span>)}</div><p>Changing the type changes subsequent impressions. Sheets already printed retain their earlier state. Showing the last six pulls.</p></> : <p>Pull a sheet, correct the setting, then pull another. What happens to the sheet already printed?</p>}</div>
  </div>;
}

export default function PrintRoomPage() {
  const [params,setParams] = useSearchParams();
  const edition = editions.find(e=>e.id===params.get('edition')) ?? editions[0];
  useEffect(()=>{const previous=document.title;document.title='From manuscript to printed Bible · Bible Guide';return()=>{document.title=previous;};},[]);
  const choose=(id:string)=>{const next=new URLSearchParams(params);next.set('edition',id);setParams(next,{replace:true,preventScrollReset:true});};
  return <div className="pr-study study-frame">
    <Opening/>
    <PrintTimeline onEdition={choose}/>
    <ChapterRow/>
    <ProofSheet/>
    <ErasmusEvidence/>

    <section id="bookmaking" className="pr-making"><SectionHeading n="03" kicker="Make a book" title={<>From a hand to <em>a repeatable impression</em></>} text="Copying, selecting a reading, and reproducing a page are separate acts. A new technology changes their scale without making them the same task."/>
      <div className="pr-making-grid"><div className="pr-making-copy"><h3>Before the press</h3><p>A parchment book began with prepared skins, ruled lines and gatherings. A scribe copied; corrections, decorated initials and binding involved further work. This is a European parchment workflow, not a recipe for every manuscript tradition.</p><Cites ids={['getty']}/><h3>Inside the print shop</h3><p>At Plantin’s workshop, compositors assembled cast metal letters into lines and pages; press workers inked the setting and pulled impressions. Correctors checked proofs. One setting can repeat a mistake as readily as a correct reading.</p><p className="pr-note">The exercise models this mechanism, not an event in a particular Bible. Movable type in Asia predates Gutenberg’s European workshop.</p><Cites ids={['workshop','asia']}/><details className="pr-tool-note"><summary>Who made the letters?</summary><p>Punchcutters shaped letters in reverse. A punch formed a matrix used to cast reusable metal type. Plantin worked with specialists including Claude Garamond, Guillaume Le Bé and Robert Granjon. Their craft helped make multilingual printing possible.</p><Cites ids={['materials']}/></details></div><PressExercise/></div>
      <CopyHistory/>
    </section>

    <Architecture edition={edition} choose={choose}/>

    <TranslationDesk/>

    <CriticalDesk/>

    <section id="print-room-sources" className="pr-sources"><div><p className="pr-kicker">Return to the evidence</p><h2>Follow the sources.</h2><p>Nearby citations lead to the evidence. The dossier preserves six close investigations, claim-level references, image rights and the limits of what was inspected.</p><a href="/research/05-from-manuscript-to-printed-bible.json" download>Download the research dossier <ArrowDown size={14}/></a></div><div><h3>Deeper reading</h3>{dossier.deeperReading.map(r=>{const s=sources.find(s=>s.id===r.sourceId)!;return <div className="pr-reading" key={r.sourceId}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={13}/><span className="sr-only"> (opens in a new tab)</span></a><p>{r.purpose}</p><small>{r.readStatus}</small></div>;})}</div><details className="pr-source-register"><summary>Source register & access notes · {sources.length} records</summary><ol>{sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<span className="sr-only"> (opens in a new tab)</span></a><p>{s.type}. {s.access}</p><small>Checked {s.checked}</small></li>)}</ol></details><details className="pr-source-register"><summary>What remains unverified or incomplete?</summary><div className="pr-research-gaps">{dossier.researchGaps.map(g=><article key={g.topic}><h3>{g.topic}</h3><p>{g.gap}</p><p><strong>Next evidence needed:</strong> {g.nextStep}</p></article>)}</div></details></section>
    <footer className="pr-end"><span>What is this edition asking its main text to represent?</span><Link to="/study/academic?area=texts">Return to Academic studies <ArrowUpRight size={15}/></Link></footer>
  </div>;
}
