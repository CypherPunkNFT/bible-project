import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUpRight, Check, Layers3, Printer, RotateCcw } from 'lucide-react';
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';
import { Cites, SectionHeading } from './PrintRoomShared';
import { CopyHistory, ErasmusEvidence, TranslationContext, CriticalDesk, PolyglotContext } from './PrintRoomInvestigations';
import { ProofSheet, HebrewLineage } from './ProofSheet';
import { usePrintState } from './usePrintState';
import './print-room.css';
import './proof-sheet.css';

const { editions, networks, translations, sources } = dossier;
type Edition = typeof editions[number];
// Functional diagrams only. Lines indicate text blocks, never transcribed readings.
function PageModel({ edition, visible, hero = false }: { edition: Edition; visible: boolean[]; hero?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const lines = (x: number, y: number, w: number, count: number, gap = 7, heavy = false) => Array.from({ length: count }, (_, i) => <path key={`${x}-${y}-${i}`} d={`M${x} ${y + i * gap}h${w - (i % 5 === 4 ? w * .17 : 0)}`} stroke="currentColor" strokeWidth={heavy ? 2.2 : 1.25} opacity={heavy ? .75 : .5}/>);
  const part = (i: number, children: ReactNode) => <g className="pr-page-layer" data-layer={i} opacity={visible[i] ? 1 : 0}>{children}</g>;
  return <svg viewBox="0 0 360 450" role="img" aria-label={`${edition.name}: schematic page; ${edition.layers.filter((_,i)=>visible[i]).map(l=>l.label).join(', ') || 'all layers hidden'}.`} className={`pr-page-model ${hero ? 'pr-page-hero' : ''}`}>
    <defs><pattern id={uid} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".45" fill="#705f4220"/></pattern></defs>
    <path d="M23 13H337V433H23Z" fill="#eee4cc" stroke="#a58e66"/>
    <path d="M29 20H332V428H29Z" fill={`url(#${uid})`}/>
    <g fill="none" stroke="#9c8d7155"><path d="M15 35H345M15 410H345M43 5V441M317 5V441" strokeDasharray="2 5"/></g>
    <g color="#403b32">
    {edition.kind === 'gutenberg' && <>
      {part(0,<>{lines(55,76,114,40,7.6,true)}{lines(191,76,114,40,7.6,true)}</>)}
      {part(1,<g fill="#a33d32" color="#a33d32"><rect x="51" y="67" width="37" height="42" fill="#eee4cc"/><text x="54" y="102" fontSize="44" fontFamily="Georgia">I</text><path d="M47 111V60h45M48 61l-5-7m5 15l-8-2" fill="none" stroke="currentColor"/><text x="187" y="185" fontSize="26" fontFamily="Georgia">¶</text></g>)}
      {part(2,<g color="#a33d32"><text x="180" y="49" textAnchor="middle" fontSize="10" letterSpacing="3">LIBER</text><path d="M56 61h75m60 0h67" stroke="currentColor" strokeWidth="2"/></g>)}
    </>}
    {edition.kind === 'bomberg' && <>
      {part(0,<g>{lines(119,117,123,17,8,true)}<text x="180" y="103" textAnchor="middle" fontSize="13">Hebrew text</text></g>)}
      {part(1,<g color="#946325">{lines(121,75,116,4,6)}{lines(100,126,8,20,6)}{lines(252,126,8,20,6)}{lines(119,272,123,5,5)}</g>)}
      {part(2,<g color="#41646a">{lines(53,115,38,37,7)}{lines(272,115,33,37,7)}{lines(109,321,145,9,7)}<text x="180" y="400" textAnchor="middle" fontSize="10">Targum · commentary</text></g>)}
    </>}
    {edition.kind === 'polyglot' && <>
      {part(0,<>{lines(51,96,75,24,8,true)}{lines(237,96,73,24,8,true)}<text x="87" y="72" textAnchor="middle" fontSize="11">Greek</text><text x="273" y="72" textAnchor="middle" fontSize="11">Hebrew</text></>)}
      {part(1,<g color="#a33d32">{lines(145,96,70,24,8)}{lines(51,92,75,24,8)}<text x="179" y="72" textAnchor="middle" fontSize="11">Vulgate</text><text x="87" y="58" textAnchor="middle" fontSize="9">Latin aid</text></g>)}
      {part(2,<g color="#41646a"><path d="M51 304H310" stroke="currentColor"/><text x="109" y="325" textAnchor="middle" fontSize="11">Aramaic</text><text x="246" y="325" textAnchor="middle" fontSize="11">Latin aid</text>{lines(51,341,115,8,7)}{lines(188,341,122,8,7)}</g>)}
    </>}
    {edition.kind === 'erasmus' && <>
      {part(0,<><text x="108" y="67" textAnchor="middle" fontSize="14">Greek</text>{lines(53,89,112,30,7.5,true)}</>)}
      {part(1,<g color="#a33d32"><text x="248" y="67" textAnchor="middle" fontSize="14">Latin</text>{lines(192,89,112,30,7.5)}</g>)}
      {part(2,<g color="#41646a"><path d="M51 336H307" stroke="currentColor" strokeDasharray="4 4"/><text x="180" y="358" textAnchor="middle" fontSize="10">SEPARATE ANNOTATIONES</text>{lines(60,375,240,4,6)}</g>)}
    </>}
    {(edition.kind === 'bhq' || edition.kind === 'na28') && <>
      {part(0,<><text x="180" y="74" textAnchor="middle" fontSize="14">{edition.kind === 'bhq' ? 'Hebrew base text' : 'Edited Greek text'}</text>{lines(80,103,196,23,7.5,true)}</>)}
      {part(1,<g color="#946325">{lines(292,105,16,25,6)}{edition.kind === 'bhq' && <>{lines(78,49,199,3,6)}{lines(79,286,198,3,6)}</>}</g>)}
      {part(2,<g color="#41646a"><path d="M55 321H308" stroke="currentColor"/><text x="180" y="341" textAnchor="middle" fontSize="11">Critical apparatus</text>{lines(55,358,250,8,6)}</g>)}
    </>}
    </g>
    <text x="180" y="423" textAnchor="middle" fill="#76674e" fontSize="7" letterSpacing="2">SCHEMATIC · NOT A FACSIMILE</text>
  </svg>;
}

function PressExercise() {
  const [corrected,setCorrected] = useState(false);
  const [sheets,setSheets] = useState<boolean[]>([]);
  return <div className="pr-press-exercise">
    <div className="pr-type-case"><span className="pr-kicker">The setting · reversed for printing</span><div className="pr-type-line" aria-label={corrected ? 'Type set to PRINT' : 'Type set to PRNIT, a deliberate error'} aria-live="polite">{(corrected ? 'PRINT' : 'PRNIT').split('').map((c,i)=><span key={i}>{c}</span>)}</div><small>Invented exercise word, not a biblical variant</small></div>
    <div className="pr-press-actions"><button onClick={()=>setSheets(s=>[...s,corrected].slice(-6))}><Printer size={16}/> Pull a sheet</button><button aria-pressed={corrected} onClick={()=>setCorrected(c=>!c)}>{corrected ? <Check size={15}/> : <Layers3 size={15}/>} {corrected ? 'Corrected setting' : 'Correct the setting'}</button><button aria-label="Reset printing exercise" className="pr-reset" onClick={()=>{setSheets([]);setCorrected(false);}}><RotateCcw size={15}/></button></div>
    <div className="pr-output" role="status" aria-live="polite">{sheets.length ? <><div className="pr-proof-sheets">{sheets.map((ok,i)=><span key={i}><small>Sheet {i+1}</small><strong>{ok ? 'PRINT' : 'PRNIT'}</strong><em>{ok ? 'corrected' : 'uncorrected'}</em></span>)}</div><p>Changing the type changes subsequent impressions. Sheets already printed retain their earlier state. Showing the last six pulls.</p></> : <p>Pull a sheet, correct the setting, then pull another. What happens to the sheet already printed?</p>}</div>
  </div>;
}

function EditionNetwork() {
  const [family,setFamily] = usePrintState("family",0);
  const [selected,setSelected] = usePrintState("network-node",networks[0].defaultNode);
  const network = networks[family];
  const selectedNode = (network.nodes.find(n=>n.id===selected) ?? network.nodes[0]);
  const edges = network.edges.filter(e=>e.from===selected || e.to===selected);
  const uid = useId().replace(/:/g,'');
  return <section id="edition-network" className="pr-network-section">
    <SectionHeading n="05" title="A family tree with more than one root." text="An edition can inherit a printed text, consult manuscripts, and belong to a revised series. Those are three different connections."/>
    <div className="pr-switches" role="group" aria-label="Choose an edition network">{networks.map((g,i)=><button key={g.id} aria-pressed={family===i} onClick={()=>{setFamily(i);setSelected(g.defaultNode);}}>{g.title}</button>)}</div>
    <p className="pr-network-intro">{network.intro}</p>
    {family===0 ? <HebrewLineage/> : <><div className="pr-graph" role="group" aria-label={`${network.title}: select an edition or witness`}>
      <svg viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true"><defs><marker id={uid} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8" fill="none" stroke="currentColor"/></marker></defs>{network.edges.map((e,i)=>{
        const a=network.nodes.find(n=>n.id===e.from)!, b=network.nodes.find(n=>n.id===e.to)!;
        const sameRow=a.y===b.y;
        const ax=a.x*10+(sameRow?85:0), ay=a.y*4.6+(sameRow?0:30), bx=b.x*10-(sameRow?85:0), by=b.y*4.6-(sameRow?0:31);
        const d=sameRow ? `M${ax} ${ay} C${ax+20} ${ay-(b.x-a.x>45?100:0)},${bx-20} ${by-(b.x-a.x>45?100:0)},${bx} ${by}` : `M${ax} ${ay} C${ax} ${(ay+by)/2},${bx} ${(ay+by)/2},${bx} ${by}`;
        return <path key={i} d={d} className={`pr-edge pr-edge-${e.type} ${e.from===selected || e.to===selected ? 'pr-edge-selected' : ''}`} markerEnd={`url(#${uid})`}/>;
      })}</svg>
      {network.nodes.map(n=><button key={n.id} style={{left:`${n.x}%`,top:`${n.y}%`}} aria-pressed={selected===n.id} aria-controls="pr-edge-record" onClick={()=>setSelected(n.id)}><small>{n.date}</small><strong>{n.label}</strong></button>)}
    </div>
    <div className="pr-network-key"><span><i/> Textual basis / influence</span><span><i className="pr-key-collation"/> Collation evidence</span><span><i className="pr-key-series"/> Editorial succession</span></div>
    <div className="pr-edge-record" id="pr-edge-record" aria-live="polite"><div><p className="pr-kicker">Selected record</p><h3>{selectedNode.label}</h3><p>{selectedNode.note}</p></div><ul>{edges.map((e,i)=><li key={i}><span>{network.nodes.find(n=>n.id===e.from)!.label} <b aria-label="to">→</b> {network.nodes.find(n=>n.id===e.to)!.label}</span><strong>{e.label}</strong><Cites ids={e.sourceIds}/></li>)}</ul></div>
    </>}<p className="pr-note">{network.limit} Positions are schematic; spacing does not measure time.</p>
  </section>;
}

export default function PrintRoomPage() {
  const [params,setParams] = useSearchParams();
  const edition = editions.find(e=>e.id===params.get('edition')) ?? editions[0];
  const [visible,setVisible] = useState([true,true,true]);
  const [activeLayer,setActiveLayer] = useState(0);
  const [translation,setTranslation] = usePrintState("translation",0);
  const t=translations[translation];
  useEffect(()=>{const previous=document.title;document.title='From manuscript to printed Bible · Bible Project';return()=>{document.title=previous;};},[]);
  const choose=(id:string)=>{const next=new URLSearchParams(params);next.set('edition',id);setParams(next,{replace:true,preventScrollReset:true});setVisible([true,true,true]);setActiveLayer(0);};
  return <div className="pr-study">
    <nav className="pr-breadcrumb" aria-label="Study navigation"><Link to="/study/academic?area=texts"><ArrowLeft size={14}/> Academic studies</Link><span>The Bible: formation & transmission <b>05</b></span></nav>
    <header className="pr-opening"><div><p className="pr-kicker">The print room · An interactive study</p><h1>From manuscript<br/>to <em>printed Bible.</em></h1></div><div><p className="pr-deck">The press repeats the page.<br/>People decide what goes on it.</p><p className="pr-hero-copy">Start with one surviving sheet. Separate the work of an editor, a translator and a printer—then follow the choices behind later editions.</p><a href="#proof-sheet" className="pr-enter">Examine the 1516 page <ArrowDown size={16}/></a></div></header>
    <ProofSheet/>
    <nav className="pr-chapters" aria-label="In this study">{[['01','Inspect a page','#proof-sheet'],['02','Watch a revision','#revision'],['03','Make a book','#bookmaking'],['04','Read the architecture','#page-inspection'],['05','Trace an edition','#edition-network'],['06','Translate','#translation-desk'],['07','Read the apparatus','#critical-desk']].map(([n,title,href])=><a key={n} href={href}><span>{n}</span>{title}</a>)}</nav>
    <ErasmusEvidence/>

    <section id="bookmaking" className="pr-making"><SectionHeading n="03" title="From a hand to a repeatable impression." text="Copying, selecting a reading, and reproducing a page are separate acts. A new technology changes their scale without making them the same task."/>
      <div className="pr-making-grid"><div className="pr-making-copy"><h3>Before the press</h3><p>A parchment book began with prepared skins, ruled lines and gatherings. A scribe copied; corrections, decorated initials and binding involved further work. This is a European parchment workflow, not a recipe for every manuscript tradition.</p><Cites ids={['getty']}/><h3>Inside the print shop</h3><p>At Plantin’s workshop, compositors assembled cast metal letters into lines and pages; press workers inked the setting and pulled impressions. Correctors checked proofs. One setting can repeat a mistake as readily as a correct reading.</p><p className="pr-note">The exercise models this mechanism, not an event in a particular Bible. Movable type in Asia predates Gutenberg’s European workshop.</p><Cites ids={['workshop','asia']}/><details className="pr-tool-note"><summary>Who made the letters?</summary><p>Punchcutters shaped letters in reverse. A punch formed a matrix used to cast reusable metal type. Plantin worked with specialists including Claude Garamond, Guillaume Le Bé and Robert Granjon. Their craft helped make multilingual printing possible.</p><Cites ids={['materials']}/></details></div><PressExercise/></div>
      <CopyHistory/>
    </section>

    <section id="page-inspection" className="pr-inspection"><SectionHeading n="04" title="A page is more than its main text." text="Choose a book. Switch its layers off and on. The marks can look equally authoritative while doing very different jobs."/>
      <div className="pr-architecture-guide"><div><PageModel edition={editions.find(e=>e.kind==='bomberg')!} visible={[true,true,true]}/><h3>Text with a reading tradition</h3><p>Masorah, targum and commentary surround the Hebrew text.</p></div><div><PageModel edition={editions.find(e=>e.kind==='polyglot')!} visible={[true,true,true]}/><h3>Languages alongside languages</h3><p>A polyglot makes comparison visible; columns have different functions.</p></div><div><PageModel edition={editions.find(e=>e.kind==='bhq')!} visible={[true,true,true]}/><h3>Evidence beneath the text</h3><p>An apparatus records alternatives without necessarily changing the main text.</p></div></div>
      <div className="pr-edition-select"><label htmlFor="pr-edition">Inspect a printed edition</label><select id="pr-edition" value={edition.id} onChange={e=>choose(e.target.value)}>{editions.map(e=><option key={e.id} value={e.id}>{e.date} · {e.name}</option>)}</select></div>
      <div id="pr-inspection-panel" className="pr-inspection-panel"><div className="pr-specimen"><div className="pr-specimen-label"><span>{edition.place}</span><span>{edition.language}</span></div><PageModel edition={edition} visible={visible}/><p>Functional diagram · no source image reproduced</p></div>
      <div className="pr-inspection-copy"><p className="pr-kicker">{edition.date} / {edition.place}</p><h3>{edition.name}</h3><p className="pr-claim">{edition.claim}</p><p className="pr-people">{edition.people}</p><div className="pr-layer-controls" role="group" aria-label="Show or hide page layers">{edition.layers.map((l,i)=><button key={l.label} aria-pressed={visible[i]} aria-controls="pr-layer-explanation" onClick={()=>{setActiveLayer(i);setVisible(v=>v.map((on,j)=>j===i?!on:on));}}><span className={`pr-layer-square pr-layer-${i}`}>{visible[i] && <Check size={12}/>}</span>{l.label}<small>{visible[i] ? 'visible' : 'hidden'}</small></button>)}</div><div className="pr-layer-explanation" id="pr-layer-explanation" aria-live="polite"><span className="pr-kicker">Layer {activeLayer+1} · {visible[activeLayer] ? 'visible' : 'hidden'}</span><h4>{edition.layers[activeLayer].title}</h4><p>{edition.layers[activeLayer].text}</p><Cites ids={edition.layers[activeLayer].sourceIds}/></div><p className="pr-note">{edition.limit}</p><Cites ids={edition.sourceIds}/></div></div>
      <details className="pr-date-note"><summary>Printed first? Published first? Why two dates matter.</summary><div><p>The Complutensian New Testament colophon dates printing to <strong>10 January 1514</strong>. Its Old Testament followed in 1517; papal authorization is dated 1520, and circulation is usually placed around 1522. Erasmus’s edition was available in 1516. “First printed” and “first published” therefore identify different achievements.</p><Cites ids={['complutensian','eton','cambridge']}/></div></details>
    </section>

    <PolyglotContext/>
    <EditionNetwork/>

    <section id="translation-desk" className="pr-translations"><SectionHeading n="06" title="At another desk, a different decision." text="A translation renders a text into another language. Its source choices, wording and printing history must be investigated separately."/>
      <div className="pr-translation-workbench"><div className="pr-translation-selector"><label htmlFor="pr-translation">Choose a translation project</label><select id="pr-translation" value={translation} onChange={e=>setTranslation(Number(e.target.value))}>{translations.map((t,i)=><option value={i} key={t.id}>{t.date} · {t.name}</option>)}</select><p>A selected European sequence, not a census of Bible translation. Jewish, Catholic and Protestant editing histories also overlap without becoming one chain.</p></div><div className="pr-translation-record" aria-live="polite"><p className="pr-kicker">{t.date}</p><h3>{t.name}</h3><dl><div><dt>Source / revision base</dt><dd>{t.source}</dd></div><div><dt>Translation decision</dt><dd>{t.decision}</dd></div><div><dt>Physical publication</dt><dd>{t.production}</dd></div></dl><p>{t.text}</p><Cites ids={t.sourceIds}/></div></div>
    </section>

    <TranslationContext/>
    <CriticalDesk/>

    <section id="print-room-sources" className="pr-sources"><div><p className="pr-kicker">Return to the evidence</p><h2>Follow the sources.</h2><p>Nearby citations lead to the evidence. The dossier preserves six close investigations, claim-level references, image rights and the limits of what was inspected.</p><a href="/research/05-from-manuscript-to-printed-bible.json" download>Download the research dossier <ArrowDown size={14}/></a></div><div><h3>Deeper reading</h3>{dossier.deeperReading.map(r=>{const s=sources.find(s=>s.id===r.sourceId)!;return <div className="pr-reading" key={r.sourceId}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={13}/><span className="sr-only"> (opens in a new tab)</span></a><p>{r.purpose}</p><small>{r.readStatus}</small></div>;})}</div><details className="pr-source-register"><summary>Source register & access notes · {sources.length} records</summary><ol>{sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<span className="sr-only"> (opens in a new tab)</span></a><p>{s.type}. {s.access}</p><small>Checked {s.checked}</small></li>)}</ol></details><details className="pr-source-register"><summary>What remains unverified or incomplete?</summary><div className="pr-research-gaps">{dossier.researchGaps.map(g=><article key={g.topic}><h3>{g.topic}</h3><p>{g.gap}</p><p><strong>Next evidence needed:</strong> {g.nextStep}</p></article>)}</div></details></section>
    <footer className="pr-end"><span>What is this edition asking its main text to represent?</span><Link to="/study/academic?area=texts">Return to Academic studies <ArrowUpRight size={15}/></Link></footer>
  </div>;
}
