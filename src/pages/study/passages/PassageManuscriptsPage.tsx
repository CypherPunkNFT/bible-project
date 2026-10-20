import { StudyTrail } from "@/components/study/StudyTrail";
import { Fragment, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, Plus } from 'lucide-react';
import { cases, readings, reasoning, sources, type CaseId, type SourceId } from './evidence';
import './passage-manuscripts.css';
import { CloseReading, UnfinishedWitness, FieldJourney } from './CloseReadings';

function Cite({ ids }: { ids: SourceId[] }) {
  return <div className="pm-cites">{ids.map(id => <a key={id} href={sources[id].url} target="_blank" rel="noopener noreferrer">{sources[id].label}<ArrowUpRight size={12} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></a>)}</div>;
}

function CopyingModel() {
  const [trace, setTrace] = useState(false);
  return <section className="pm-copying" aria-labelledby="pm-count-title">
    <div><p className="pm-kicker">A model of dependence</p><h2 id="pm-count-title">Eight copies.<br/><em>How many beginnings?</em></h2><p>A manuscript count tells you how many copies survived. It does not tell you how independently their readings arose.</p><button className="pm-action" type="button" onClick={() => setTrace(!trace)} aria-pressed={trace} aria-controls="pm-copy-model">{trace ? 'Hide the copying paths' : 'Trace the copying paths'}<ArrowRight size={16} aria-hidden="true"/></button><Cite ids={['genealogy']}/></div>
    <div className="pm-model" id="pm-copy-model">
      <p className="pm-kicker">Invented example · not a manuscript genealogy</p>
      <svg viewBox="0 0 560 235" role="img" aria-label={trace ? 'Schematic: eight surviving copies with reading A descend from one intermediate source; two copies with reading B descend from another. The earlier text is unknown.' : 'Schematic: eight surviving copies with reading A and two with reading B. Their copying relationships are hidden.'}>
        <g className={trace ? 'pm-paths visible' : 'pm-paths'} aria-hidden="true">
          <path d="M280 30L188 87M280 30L455 87" stroke="currentColor" strokeDasharray="4 5" fill="none"/>
          {[38, 81, 124, 167, 210, 253, 296, 339].map(x => <path key={x} d={`M188 100L${x} 172`} fill="none" className="pm-a-path"/>)}
          {[430, 484].map(x => <path key={x} d={`M455 100L${x} 172`} fill="none" className="pm-b-path"/>)}
          <circle cx="280" cy="28" r="17"/><text x="280" y="34">?</text>
          <circle cx="188" cy="93" r="19"/><text x="188" y="99">A</text><circle cx="455" cy="93" r="19"/><text x="455" y="99">B</text>
        </g>
        {[38, 81, 124, 167, 210, 253, 296, 339, 430, 484].map((x, i) => <g key={x} className={i < 8 ? 'pm-copy-a' : 'pm-copy-b'}><rect x={x - 15} y="172" width="30" height="40" rx="2"/><text x={x} y="198">{i < 8 ? 'A' : 'B'}</text></g>)}
      </svg>
      <div className="pm-model-result" role="status">{trace ? <><strong>Two intermediate sources. An earlier text still unknown.</strong><p>In this model, eight copies repeat one inherited reading. That does not prove B correct: the source of A could preserve the better reading. Real transmission can also mix sources.</p></> : <><strong>8 with A · 2 with B</strong><p>A leads by number. Reveal the paths to see what that count leaves out.</p></>}</div>
    </div>
  </section>;
}

export default function PassageManuscriptsPage() {
  const [params, setParams] = useSearchParams();
  const selected = cases.find(c => c.id === params.get('passage')) ?? cases[0];
  const [order, setOrder] = useState(false);
  const [corrected, setCorrected] = useState(false);
  const [highlight, setHighlight] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const rows = readings(selected.id, order, corrected);
  const argument = reasoning[selected.id];
  useEffect(() => { const previous = document.title; document.title = 'A passage through the manuscripts · Bible Project'; return () => { document.title = previous; }; }, []);
  function select(id: CaseId) {
    const next = new URLSearchParams(params); next.set('passage', id);
    setParams(next, { replace: true, preventScrollReset: true }); setExpanded([]);
  }
  function toggle(id: string) { setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  return <article className="pm-study study-frame">
    <header className="pm-hero">
      <div><StudyTrail area="texts" n="02"/><p className="pm-kicker">A reader’s introduction to textual criticism</p><h1>A passage through<br/><em>the manuscripts.</em></h1><p className="pm-lead">One passage. Several witnesses.<br/>Learn to see what changed.</p><a className="pm-action" href="#comparison-desk">Take a place at the desk <ArrowDown size={17} aria-hidden="true"/></a></div>
      <div className="pm-hero-proof" aria-label="Romans 5:1: omicron in echomen, we have; omega in echomen, let us have. Typographic comparison, not a manuscript facsimile.">
        <span className="pm-proof-label">Romans 5:1 / one letter in focus</span>
        <div className="pm-proof-line"><span lang="grc">ἔχ<span className="pm-proof-letter">ο</span>μεν</span><small>we have</small></div>
        <div className="pm-proof-line pm-proof-alt"><span lang="grc">ἔχ<span className="pm-proof-letter">ω</span>μεν</span><small>let us have</small></div>
        <div className="pm-proof-caption"><span>ο / ω</span><p>A small mark can carry<br/>a real difference in meaning.</p></div>
        <small className="pm-art-note">Typeset comparison · not a facsimile</small><Cite ids={['net']}/>
      </div>
    </header>
    <nav className="pm-study-route" aria-label="In this study"><a href="#comparison-desk">Compare the readings <span>01</span></a><a href="#unfinished-witness">Investigate an ending <span>02</span></a><a href="#editing-history">Understand the editions <span>03</span></a><a href="#passage-sources">Read further <span>04</span></a></nav>

    <section className="pm-introduction" aria-labelledby="pm-start-title"><div><p className="pm-kicker">01 / Before comparing</p><h2 id="pm-start-title">Keep the layers apart.</h2><p>Textual criticism compares surviving witnesses to investigate a text’s transmission and earlier wording. These three Greek New Testament cases range from spelling to a substantial disputed passage. No Greek is required: each extract has an English gloss.</p></div><ol className="pm-layers"><li><span>01</span><div><h3>The object</h3><p>Ink, a correction, an intact ending or a broken edge.</p></div></li><li><span>02</span><div><h3>The transcription</h3><p>A scholar’s record of the marks, with conventions for loss and uncertainty.</p></div></li><li><span>03</span><div><h3>The edition</h3><p>An editor’s chosen text, with an apparatus recording alternatives.</p></div></li></ol></section>

    <section id="comparison-desk" className={`pm-desk ${highlight ? 'pm-highlight' : ''}`} aria-labelledby="pm-desk-title">
      <div className="pm-desk-heading"><div><p className="pm-kicker">02 / The comparison desk</p><h2 id="pm-desk-title">Read across. <em>Then look beneath.</em></h2></div><span>Three cases · selected evidence</span></div>
      <div className="pm-case-menu" role="group" aria-label="Choose a passage">{cases.map((c, i) => <button type="button" key={c.id} aria-pressed={selected.id === c.id} aria-controls="pm-comparison" onClick={() => select(c.id)}><span>0{i + 1}</span><div><strong>{c.passage}</strong><small>{c.title}</small></div><ArrowDown size={15} aria-hidden="true"/></button>)}</div>
      <div id="pm-comparison">
        <div className="pm-case-intro"><div><p className="pm-kicker">{selected.passage}</p><h3>{selected.subtitle}</h3><p>{selected.context}</p></div><div className="pm-controls">
          {selected.id === 'galatians' && <fieldset><legend>Compare a difference</legend><div className="pm-segment"><button type="button" aria-pressed={!order} onClick={() => setOrder(false)}>Spelling</button><button type="button" aria-pressed={order} onClick={() => setOrder(true)}>Word order</button></div></fieldset>}
          {selected.id === 'romans' && <fieldset><legend>Inspect the manuscript hands</legend><div className="pm-segment"><button type="button" aria-pressed={!corrected} onClick={() => setCorrected(false)}>First hand</button><button type="button" aria-pressed={corrected} onClick={() => setCorrected(true)}>Corrected</button></div></fieldset>}
          {selected.id === 'mark' && <p className="pm-controls-note">Presence, absence and loss<br/>are different kinds of evidence.</p>}
          <label className="pm-highlight-toggle"><input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)}/> Highlight the focus</label>
        </div></div>
        <p className="pm-live sr-only" role="status">{selected.passage}. {selected.id === 'galatians' ? order ? 'Comparing word order.' : 'Comparing spelling.' : selected.id === 'romans' ? corrected ? 'Showing corrected hands: we have peace.' : 'Showing first hands: let us have peace.' : 'Comparing surviving endings and a missing portion.'}</p>
        <div className="pm-table-wrap"><table className="pm-table"><caption>{selected.id === 'mark' ? 'Selected conclusions and coverage; not a full collation of the endings.' : 'Selected Greek extracts, normalized for comparison; not manuscript facsimiles. English glosses are explanatory.'}</caption><thead><tr><th scope="col">Witness / edition</th><th scope="col">{selected.id === 'mark' ? 'What is preserved or printed' : 'Aligned reading'}</th><th scope="col">Meaning / extent</th></tr></thead><tbody>{rows.map(row => <Fragment key={row.id}><tr className={row.layer === 'Critical edition' ? 'pm-edition-row' : row.layer === 'No surviving text' ? 'pm-lost-row' : ''}>
          <th scope="row"><button type="button" className="pm-evidence-toggle" aria-expanded={expanded.includes(row.id)} aria-controls={`pm-evidence-${row.id}`} onClick={() => toggle(row.id)}><span className="pm-siglum">{row.siglum}</span><span><strong>{row.name}</strong><small>{row.layer}</small></span><Plus size={15} aria-hidden="true"/></button></th>
          <td className="pm-reading" lang={selected.id === 'mark' ? undefined : 'grc'}><span>{row.before}</span><mark>{row.difference}</mark><span>{row.after}</span></td><td className="pm-gloss">{row.gloss}</td>
        </tr><tr id={`pm-evidence-${row.id}`} hidden={!expanded.includes(row.id)} className="pm-evidence-row"><td colSpan={3}><div><p className="pm-kicker">{row.date}</p><p>{row.evidence}</p><Cite ids={row.links}/></div></td></tr></Fragment>)}</tbody></table></div>
        <div className="pm-desk-key"><span><i className="pm-key-ink"/> Manuscript evidence</span><span><i className="pm-key-edition"/> Editor’s text</span>{selected.id === 'mark' && <span><i className="pm-key-loss"/> Not extant ≠ omitted</span>}<span>+ Open a row for evidence &amp; sources</span></div>
        <Cite ids={selected.id === 'galatians' ? ['transcription', 'gal', 'galApp'] : selected.id === 'romans' ? ['net', 'rom'] : ['sinMark', 'p45', 'mark']}/>
        <div className="pm-reasoning" key={selected.id}><div><p className="pm-kicker">What the comparison reveals</p><p>{argument.observation}</p></div><div className="pm-editor-verdict"><h3>How an editor reasons</h3><p>{argument.judgment}</p><Cite ids={argument.links}/><details><summary>How certain is this? <ChevronDown size={16} aria-hidden="true"/></summary><div><p className="pm-limit">{argument.limit}</p><Cite ids={argument.links}/></div></details></div></div>
        <CloseReading key={`close-${selected.id}`} id={selected.id}/>
      </div>
    </section>

    <section className="pm-damage" aria-labelledby="pm-damage-title"><div><p className="pm-kicker">03 / At the broken edge</p><h2 id="pm-damage-title">A word can be restored.<br/><em>The ink is still missing.</em></h2><p>In Galatians 1:4, Michigan’s diplomatic transcription marks lost letters in the word for “will”. Turn on the restoration and watch the boundary between evidence and reconstruction.</p><Cite ids={['transcription']}/></div><div className="pm-restoration"><p className="pm-kicker">P46 · Galatians 1:4 · line 8</p><div className="pm-damaged-word" lang="grc" aria-label={restored ? 'theta epsilon lambda survive; eta mu alpha are supplied in brackets' : 'theta epsilon lambda survive; the rest is a gap'}><span>θελ</span><span className={`pm-supplied ${restored ? 'is-restored' : ''}`}>{restored ? '[ημα]' : '[ … ]'}</span></div><label><input type="checkbox" checked={restored} onChange={e => setRestored(e.target.checked)}/> Show supplied letters</label><div role="status"><p>{restored ? 'θέλημα · “will”. The letters ημα complete the word, but they are supplied, not surviving ink.' : 'Three letters are recorded here. A gap is not evidence that the scribe meant to leave a shorter word.'}</p></div><small>Typographic close-up, not a tracing. Michigan writes θελ[ημα at the line’s end; we close the bracket for this isolated excerpt.</small></div></section>

    <UnfinishedWitness/>
    <details className="pm-dependence"><summary>Why counting manuscripts alone cannot decide a reading <ChevronDown size={16} aria-hidden="true"/></summary><CopyingModel/></details>

    <section className="pm-check" aria-labelledby="pm-check-title"><div><p className="pm-kicker">05 / Try the distinction</p><h2 id="pm-check-title">“P45 leaves out<br/>the ending of Mark.”</h2><p>The surviving inventory has no Mark 16. What can you conclude?</p></div><div><div className="pm-answer-options" role="group" aria-label="What does P45 establish?">{['It supports an ending at 16:8.', 'It supports the Longer Ending.', 'It cannot witness this location.'].map((text, i) => <button key={text} type="button" aria-pressed={answer === i} onClick={() => setAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{text}</button>)}</div><div className="pm-answer" role="status">{answer !== null && <><strong>{answer === 2 ? 'Yes. Missing material is not an omitted reading.' : 'Look again at what survives.'}</strong><p>P45 has a gap in coverage here. By contrast, Sinaiticus preserves an actual conclusion at 16:8. “Not extant” and “absent from surviving text” must remain separate.</p><Cite ids={['p45', 'sinMark']}/></>}</div></div></section>

    <FieldJourney/>
    <section className="pm-reading-room" id="passage-sources" aria-labelledby="pm-reading-title"><p className="pm-kicker">Keep investigating</p><h2 id="pm-reading-title">Follow the evidence further.</h2><div className="pm-reading-paths"><a href={sources.transcription.url} target="_blank" rel="noopener noreferrer"><span>01 / Transcribe</span><h3>Read a papyrus line by line</h3><p>Michigan places P46’s diplomatic and normalized texts beside its reading guide.</p><b>University of Michigan <ArrowUpRight size={15}/><span className="sr-only"> (opens in a new tab)</span></b></a><a href={sources.kelhoffer.url} target="_blank" rel="noopener noreferrer"><span>02 / Read the ancient argument</span><h3>Eusebius and his interpreters</h3><p>James Kelhoffer’s 2001 article supplies a Greek text, translation and analysis of the debate over Mark. Relevant sections consulted; the whole paper is available here.</p><b>Uppsala repository · original research <ArrowUpRight size={15}/><span className="sr-only"> (opens in a new tab)</span></b></a><a href={sources.houghton.url} target="_blank" rel="noopener noreferrer"><span>03 / Reassess a witness</span><h3>Unfinished Business</h3><p>Houghton’s 2023 article tests GA 239 and 304 through their physical and commentary contexts. It challenges an evidential claim without reversing the broad editorial conclusion.</p><b>Cambridge · open-access research <ArrowUpRight size={15}/><span className="sr-only"> (opens in a new tab)</span></b></a></div>
      <p className="pm-scope-note"><strong>What remains to be checked.</strong> Romans’s correction labels follow a published apparatus; the hands have not been freshly collated here. The GA 304 investigation follows Houghton’s published analysis. Full ECM volumes, the complete translated-witness evidence and Monier’s inaccessible 2019 paper remain research gaps.</p><details className="pm-source-register"><summary>Source register &amp; reading conventions <ChevronDown size={17} aria-hidden="true"/></summary><div className="pm-source-content"><p>This desk is a curated introduction, not a new manuscript collation. P46 extracts follow Michigan’s published transcription; Romans hand assignments follow NET’s textual note. Manuscript viewers provide object locators. Modern edition comparisons follow SBLGNT’s text and apparatus. No complete reading of the editions’ underlying scholarly literature is claimed.</p><p><strong>Reading the labels:</strong> * means first hand; superscripts identify corrected states in the cited apparatus. “Not extant” means the relevant material does not survive. A transcription records a witness; a restoration supplies lost text; a critical edition selects readings. Always read an edition’s own key: brackets do not have one universal meaning.</p><Cite ids={Object.keys(sources) as SourceId[]}/><p>Short Greek excerpts from <cite>The Greek New Testament: SBL Edition</cite>, edited by Michael W. Holmes, © 2010 Society of Biblical Literature and Logos Bible Software, used under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0 (opens in a new tab)</a>. Selection, spacing, highlighting and explanatory English glosses adapted for this study. No manuscript images are reproduced. Diagram counts are explicitly hypothetical.</p></div></details>
    </section>
    <footer className="pm-end"><p>Before choosing a reading,<br/><em>ask what kind of evidence you have.</em></p><Link to="/study/academic?area=texts">Return to Academic studies <ArrowRight size={17} aria-hidden="true"/></Link></footer>
  </article>;
}
