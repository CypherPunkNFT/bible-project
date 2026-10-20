import { StudyTrail } from "@/components/study/StudyTrail";
import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Fingerprint, Layers3, MapPin, ScanLine, X } from 'lucide-react';
import { glossary, questions, witnesses, type Witness } from './witnesses';
import { loadManuscripts } from '@/lib/data';
import { useAsync } from '@/lib/useAsync';
import { buildIndex } from '../manuscripts/model';
import { MsPane } from '../manuscripts/parts';
import { HowClose, HowMuchSurvives, OpenCollection, recordHref, WhereKept, WitnessPhoto } from './Evidence';
import './surviving-witnesses.css';

// Drawings describe formats only. They do not reproduce a manuscript's text or damage.
function Folio({ kind = 'columns', hero = false }: { kind?: Witness['kind']; hero?: boolean }) {
  const id = useId().replace(/:/g, '');
  const fragment = kind === 'fragment', facing = kind === 'facing';
  const shape = fragment ? 'M105 78 L180 63 211 90 200 124 224 153 202 213 162 232 130 205 98 212 83 157 105 132Z' : kind === 'leaf' ? 'M63 34 L240 39 239 243 216 253 195 238 175 255 147 243 119 261 88 244 64 251Z' : 'M62 35 Q150 24 242 37 L242 261 Q151 248 62 261Z';
  return <svg viewBox="0 0 310 300" className={`sw-folio ${hero ? 'sw-folio-hero' : ''}`} aria-hidden="true">
    <defs><linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".28"/><stop offset="1" stopColor="currentColor" stopOpacity=".06"/></linearGradient><clipPath id={`${id}-clip`}><path d={shape}/></clipPath></defs>
    <g className="sw-sheet-shadow" transform="translate(9 9)"><path d={shape} fill="none" stroke="currentColor" opacity=".16"/></g>
    <rect x="44" y="19" width="216" height="260" rx="3" fill="none" stroke="currentColor" strokeDasharray="2 7" opacity=".16"/>
    {facing ? <g><path d="M35 52 Q91 34 151 52 L151 255 Q93 237 35 255Z M157 52 Q220 34 275 52 L275 255 Q220 237 157 255Z" fill={`url(#${id}-paper)`} stroke="currentColor" strokeOpacity=".65"/>{[0, 1].map(c => Array.from({ length: 21 }, (_, r) => <path key={`${c}-${r}`} d={`M${49 + c * 122} ${73 + r * 7.6} h${64 + ((r * 13) % 24)}`} stroke="currentColor" strokeWidth={1.3} opacity={.3 + (r % 4) * .13}/>))}<path d="M154 55V254" stroke="currentColor" opacity=".5"/></g> : <g><path d={shape} fill={`url(#${id}-paper)`} stroke="currentColor" strokeOpacity=".65"/><g clipPath={`url(#${id}-clip)`}>{Array.from({ length: 27 }, (_, r) => Array.from({ length: kind === 'columns' ? 4 : kind === 'hebrew' ? 3 : 2 }, (_, c) => {
      const cols = kind === 'columns' ? 4 : kind === 'hebrew' ? 3 : 2, width = 154 / cols;
      return <path key={`${c}-${r}`} d={`M${76 + c * width} ${57 + r * 7} h${width - 8 - (r * 7 + c * 3) % 9}`} stroke="currentColor" strokeWidth={kind === 'hebrew' ? 2 : 1.4} strokeDasharray={kind === 'hebrew' ? '5 2 3 2' : '7 2 4 1'} opacity={.36 + (r % 4) * .12}/>;
    }))}</g></g>}
    <path d="M27 35h10m-5-5v10M273 263h10m-5-5v10" stroke="currentColor" opacity=".5"/>
  </svg>;
}

function SectionTitle({ number, title, text }: { number: string; title: string; text?: string }) {
  return <div className="sw-section-title"><span className="sw-section-number">{number}</span><div><h2>{title}</h2>{text && <p>{text}</p>}</div></div>;
}

export default function SurvivingWitnessesPage() {
  const [params, setParams] = useSearchParams();
  const witness = witnesses.find(item => item.id === params.get('witness')) ?? witnesses[2];
  const [lens, setLens] = useState<'object' | 'text' | 'journey'>('object');
  const [leaves, setLeaves] = useState<'all' | 'dublin' | 'michigan' | 'missing'>('all');
  const [answer, setAnswer] = useState<number | null>(null);
  const reduced = useReducedMotion();
  // The open manuscript collection supplies the photographs, counts, dates and libraries; the page stands without it.
  const collection = useAsync(loadManuscripts, 'manuscripts/collection');
  const index = useMemo(() => (collection.status === 'ready' ? buildIndex(collection.value) : null), [collection]);
  const image = index?.data.images[witness.qid];
  const record = index?.byId.get(witness.qid);
  useEffect(() => { const previous = document.title; document.title = 'The surviving witnesses · Bible Project'; return () => { document.title = previous; }; }, []);
  const select = (id: string) => { const next = new URLSearchParams(params); next.set('witness', id); setParams(next, { replace: true, preventScrollReset: true }); };
  const transition = { duration: reduced ? 0 : .25, ease: 'easeOut' as const };
  return <div className="sw-study study-frame">
    <header className="sw-hero">
      <div className="sw-hero-copy"><StudyTrail area="texts" n="01"/><p className="sw-eyebrow">Ink. Hands. Centuries.</p><h1>The surviving<br/><em>witnesses.</em></h1><p className="sw-hero-lead">The words reached us.<br/>The pages did not all survive.</p><p className="sw-hero-description">Meet the physical manuscripts behind the printed Bible. Examine what remains, follow where it travelled, and learn to see the difference between evidence and inference.</p><a className="sw-start" href="#witness-desk">Open the archive <ArrowDown size={17}/></a></div>
      <div className="sw-hero-art"><div className="sw-orbit sw-orbit-one"/><div className="sw-orbit sw-orbit-two"/><span className="sw-art-label sw-art-label-top">THE PHYSICAL TRACE</span><div className="sw-hero-sheet sw-hero-sheet-back"><Folio kind="columns" hero/></div><div className="sw-hero-sheet sw-hero-sheet-front"><Folio kind="fragment" hero/></div><span className="sw-art-note"><i/> A surviving part.<br/><span>A larger story.</span></span><small>Illustrative forms · not manuscript facsimiles</small></div>
    </header>
    <div className="sw-orientation"><span><Fingerprint size={18}/> Examine the object</span><span><Layers3 size={18}/> Understand the survival</span><span><ScanLine size={18}/> Test the conclusion</span><a href="#witness-sources">Follow the sources <ArrowUpRight size={14}/></a></div>

    <section id="witness-desk" className="sw-desk" aria-labelledby="sw-desk-title" style={{ '--witness': witness.colour } as CSSProperties}>
      <div className="sw-desk-heading"><div><p className="sw-eyebrow">01 / The inspection desk</p><h2 id="sw-desk-title">Six witnesses. <em>Six ways to look.</em></h2></div><p>Select a manuscript to examine it.<br/>This is a selection, not a census.</p></div>
      <div className="sw-witness-menu" role="group" aria-label="Choose a manuscript">{witnesses.map(w => <button type="button" key={w.id} aria-pressed={w.id === witness.id} aria-controls="sw-inspection" onClick={() => select(w.id)} style={{ '--item-colour': w.colour } as CSSProperties}><span className="sw-manuscript-mark">{w.mark}</span><span><strong>{w.short}</strong><small>{w.language}</small></span><ArrowDown className="sw-select-arrow" size={16}/></button>)}</div>
      <div className="sw-inspection" id="sw-inspection">
        <div className="sw-specimen"><AnimatePresence mode="wait"><motion.div key={witness.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={transition}>{image ? <WitnessPhoto image={image} name={witness.name}/> : <Folio kind={witness.kind}/>}</motion.div></AnimatePresence><span>{witness.form}</span>{!image && <small>Schematic · open the source to see the object</small>}</div>
        <div className="sw-inspection-copy"><AnimatePresence mode="wait"><motion.div key={witness.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}><p className="sw-eyebrow">{witness.name}</p><h3>{witness.title}</h3><p className="sw-introduction">{witness.introduction}</p></motion.div></AnimatePresence>
          <div className="sw-lenses" role="group" aria-label="Ways to examine the manuscript">{([['object', Fingerprint, 'The object'], ['text', BookOpen, 'The text'], ['journey', MapPin, 'Its journey']] as const).map(([id, Icon, label]) => <button type="button" key={id} aria-pressed={lens === id} onClick={() => setLens(id)}><Icon size={14}/>{label}</button>)}</div>
          <div className="sw-lens-copy" aria-live="polite"><AnimatePresence mode="wait"><motion.p key={witness.id + lens} initial={{ opacity: 0, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={transition}>{witness[lens]}</motion.p></AnimatePresence></div>
        </div>
        <aside className="sw-record"><span className="sw-eyebrow">The record</span><dl><div><dt>Copy date</dt><dd>{witness.date}</dd></div><div><dt>Language</dt><dd>{witness.language}</dd></div>{record?.g && <div><dt>Catalogue number</dt><dd>{record.g}</dd></div>}<div className="sw-held"><dt>Kept today at</dt><dd>{witness.held.map(h => <span key={h}>{h}</span>)}</dd></div></dl><div className="sw-caution"><ScanLine size={18}/><p>{witness.caution}</p></div><div className="sw-record-links">{record && <Link to={recordHref(record.i)} className="sw-record-open">Its record in the collection<ArrowRight size={13}/></Link>}{witness.sources.map(s => <a href={s.url} key={s.url} target="_blank" rel="noopener noreferrer">{s.label}<ArrowUpRight size={13}/><span className="sr-only"> (opens in a new tab)</span></a>)}</div></aside>
      </div>
    </section>

    {index && <MsPane name="How much survives"><HowMuchSurvives index={index}/></MsPane>}
    {index && <MsPane name="How close to the writing"><HowClose index={index}/></MsPane>}

    <section className="sw-survival" aria-labelledby="sw-survival-title">
      <div className="sw-survival-intro"><p className="sw-eyebrow">04 / A book, scattered</p><h2 id="sw-survival-title">Count what remains.<br/><em>Notice what is missing.</em></h2><p>P46 makes survival tangible. Each small leaf here stands for one leaf in Michigan’s account of the codex.</p><div className="sw-leaf-tally" role="status" aria-live="polite"><strong>{leaves === 'dublin' ? '56' : leaves === 'michigan' ? '30' : leaves === 'missing' ? '18' : '86'}</strong><span>{leaves === 'all' ? <>leaves survive<br/><small>of 104 reconstructed</small></> : leaves === 'missing' ? <>leaves missing<br/><small>from the reconstructed total</small></> : <>leaves held in<br/><small>{leaves === 'dublin' ? 'Dublin · Chester Beatty' : 'Ann Arbor · Michigan'}</small></>}</span></div><p className="sw-survival-note">A surviving leaf need not be intact. Lost lines within these leaves mean that a leaf count is not a percentage of readable text.</p><a className="sw-text-link" href="https://apps.lib.umich.edu/files/collections/papyrus/k12/reading/Paul/state.html" target="_blank" rel="noopener noreferrer">Read Michigan’s account <ArrowUpRight size={14}/></a></div>
      <div className="sw-leaves-panel"><div className="sw-leaf-controls" role="group" aria-label="Highlight surviving and missing leaves">{([['all', 'All leaves'], ['dublin', 'Dublin · 56'], ['michigan', 'Michigan · 30'], ['missing', 'Missing · 18']] as const).map(([id, label]) => <button type="button" key={id} onClick={() => setLeaves(id)} aria-pressed={leaves === id}>{label}</button>)}</div><div className="sw-leaf-grid" role="img" aria-label="104 leaves represented: 56 at Chester Beatty, 30 at Michigan and 18 missing from the reconstructed total.">{Array.from({ length: 104 }, (_, i) => { const group = i < 56 ? 'dublin' : i < 86 ? 'michigan' : 'missing'; return <span key={i} className={`sw-leaf sw-leaf-${group} ${leaves !== 'all' && leaves !== group ? 'sw-leaf-dim' : ''}`} aria-hidden="true"><i/><i/><i/><i/></span>; })}</div><div className="sw-leaf-key"><span><i className="sw-dot-dublin"/> Chester Beatty</span><span><i className="sw-dot-michigan"/> Michigan</span><span><i className="sw-dot-missing"/> Missing</span></div><p className="sw-caption">One symbol = one leaf, with two sides. Grouped by present custody; this is not the original leaf order. The 104-leaf total is a reconstruction reported by Michigan.</p><a href="https://apps.lib.umich.edu/files/collections/papyrus/exhibits/reading/Paul/discovery.html" target="_blank" rel="noopener noreferrer" className="sw-text-link">How one codex entered two collections <ArrowUpRight size={14}/></a></div>
    </section>

    {index && <MsPane name="Where they are kept now"><WhereKept index={index}/></MsPane>}

    <section className="sw-questions"><SectionTitle number="06" title="What can the evidence actually say?" text="Make the distinction before making the claim."/><div className="sw-question-grid">{questions.map((q, i) => <article key={q.title} className={answer === i ? 'sw-question-open' : ''}><span className="sw-question-index">0{i + 1}</span><h3>{q.title}</h3><button type="button" className="sw-reveal" aria-expanded={answer === i} aria-controls={`sw-answer-${i}`} onClick={() => setAnswer(answer === i ? null : i)}>{answer === i ? 'Close the explanation' : 'Examine the evidence'}{answer === i ? <X size={16}/> : <ChevronDown size={16}/>}</button><div id={`sw-answer-${i}`} className="sw-answer" aria-hidden={answer !== i} ref={node => { node?.toggleAttribute('inert', answer !== i); }}><div><strong><Check size={16}/>{q.answer}</strong><p>{q.detail}</p><a className="sw-text-link" href={witnesses.find(w => w.id === q.witness)!.sources[q.witness === 'p52' ? 1 : 0].url} target="_blank" rel="noopener noreferrer">Follow the source <ArrowUpRight size={13}/></a></div></div></article>)}</div></section>

    <section className="sw-vocabulary"><div><p className="sw-eyebrow">Learn to read the record</p><h2>A few words.<br/><em>A sharper eye.</em></h2><p>The catalogue becomes more useful when its language becomes familiar.</p></div><div className="sw-glossary">{glossary.map(([term, meaning]) => <details key={term}><summary>{term}<span>+</span></summary><p>{meaning}</p></details>)}</div></section>

    <section className="sw-sources" id="witness-sources"><SectionTitle number="07" title="Keep the evidence within reach." text="Go from this study to the people who preserve, catalogue and interpret the objects."/><div className="sw-reading-grid"><a href="https://codexsinaiticus.org/en/" target="_blank" rel="noopener noreferrer"><span className="sw-eyebrow">Examine</span><BookOpen size={28}/><h3>The manuscript itself</h3><p>Open Sinaiticus’s digital pages and compare the object with its transcription.</p><span>Codex Sinaiticus project <ArrowUpRight size={15}/></span></a><a href="https://www.cambridge.org/core/books/an-introduction-to-the-new-testament-manuscripts-and-their-texts/C9A0AF6DD351B4A6C492DE5D8ED6BFCC" target="_blank" rel="noopener noreferrer"><span className="sw-eyebrow">Learn the method</span><Layers3 size={28}/><h3>Manuscripts and their texts</h3><p>D. C. Parker’s introduction to New Testament manuscripts and the work of studying them.</p><span>Cambridge · book record <ArrowUpRight size={15}/></span></a><a href="https://brentnongbri.com/2018/07/31/gods-library/" target="_blank" rel="noopener noreferrer"><span className="sw-eyebrow">Ask about the history</span><MapPin size={28}/><h3>God’s Library</h3><p>Brent Nongbri examines the archaeology and modern histories of early Christian manuscripts.</p><span>Author · book introduction <ArrowUpRight size={15}/></span></a></div><details className="sw-source-directory"><summary>Sources behind the six witnesses <ChevronDown size={16}/></summary><div>{witnesses.map(w => <article key={w.id}><h3>{w.name}</h3>{w.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<ArrowUpRight size={13}/></a>)}</article>)}</div></details><p className="sw-editorial-note">A selected introduction to manuscript evidence. Dates are attributed to the linked records; debated dates remain debated. Photographs come from Wikimedia Commons, credited under each; the drawn forms are explanatory diagrams, not facsimiles. Further-reading links identify works to explore.</p></section>
    <OpenCollection index={index}/>
    <footer className="sw-end"><div><p className="sw-eyebrow">The question to carry with you</p><p>What survives — <em>and what am I inferring?</em></p></div><Link to="/study/academic?area=texts">Return to Academic studies <ArrowRight size={19}/></Link></footer>
  </div>;
}
