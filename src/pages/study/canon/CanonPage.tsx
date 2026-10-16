import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown } from 'lucide-react';
import dossier from '../../../../content/academic-research/04-how-the-canon-took-shape.json';
import CanonInvestigations, { CanonScholarship } from './CanonInvestigations';
import './canon.css';
import CanonRegisters from './CanonRegisters';

type RecordEntry = typeof dossier.records[number];
type TracedBook = 'Hermas' | 'Esther' | 'Revelation';
const sources = new Map(dossier.sources.map(s => [s.id, s]));
const names: Record<string, string> = { irenaeus: 'Irenaeus', jerome: 'Jerome', peshitta: 'Peshitta', alexandrinus: 'Codex Alexandrinus', sirach: 'Sirach’s prologue', qumran: 'Qumran collections', jude: 'Jude', justin: 'Justin', muratorian: 'Muratorian fragment', mishnah: 'Mishnah Yadayim', eusebius: 'Eusebius', sinaiticus: 'Codex Sinaiticus', athanasius: 'Athanasius', augustine: 'Augustine', carthage: 'African Code', bava: 'Bava Batra', trent: 'Council of Trent', westminster: 'Westminster Confession' };
function Citations({ ids }: { ids: string[] }) {
  return <div className="cn-citations">{ids.map(id => { const source = sources.get(id)!; return <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={13} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></a>; })}</div>;
}
function Heading({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return <div className="cn-heading"><span>{n}</span><div><h2>{title}</h2><p>{children}</p></div></div>;
}
function statusFor(record: RecordEntry, book: TracedBook) { return record.books?.[book]; }
const trailNotes: Record<TracedBook, string> = {
  Hermas: 'The same work can be copied, read and recommended without being placed in a writer’s canon. These are different witnesses, not stages every community passed through.',
  Esther: 'No identified copy at Qumran; an instructional book for Athanasius; canonical in other lists. Missing evidence and explicit exclusion are different claims.',
  Revelation: 'Eusebius preserves contrasting judgments. Later explicit lists show recognition in particular settings, not that every earlier community had agreed.'
};

export default function CanonPage() {
  const [params, setParams] = useSearchParams();
  const selected = dossier.records.find(r => r.id === params.get('record')) ?? dossier.records.find(r => r.id === 'eusebius')!;
  const [kind, setKind] = useState(0);
  const [book, setBook] = useState<TracedBook>('Hermas');
  const [left, setLeft] = useState('catholic');
  const [right, setRight] = useState('reformed');
  const [answer, setAnswer] = useState<number | null>(null);
  const [question, setQuestion] = useState(0);
  const recordHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { const old = document.title; document.title = 'How the canon took shape · Bible Project'; return () => { document.title = old; }; }, []);
  const selectRecord = (id: string, focus = false) => {
    const next = new URLSearchParams(params); next.set('record', id); setParams(next, { replace: true, preventScrollReset: true });
    if (focus) requestAnimationFrame(() => { recordHeading.current?.focus({ preventScroll: true }); document.getElementById('canon-register')?.scrollIntoView({ block: 'start' }); });
  };
  const index = dossier.records.indexOf(selected);
  const a = dossier.traditions.find(t => t.id === left)!;
  const b = dossier.traditions.find(t => t.id === right)!;
  const questions = [
    { prompt: 'Hermas appears in a biblical codex. What has that established?', answers: ['Every church recognized it as canonical.', 'This manuscript transmitted it beside other writings.', 'It was forbidden to read it publicly.'], correct: 1, why: 'Physical inclusion establishes transmission in this object. A claim about canonical status needs further evidence about the people and setting.', ids: ['sinaiticus', 'smithsonian'] },
    { prompt: 'No copy of Esther has been identified at Qumran. Which conclusion is warranted?', answers: ['Esther was rejected by everyone there.', 'Esther had not yet been written.', 'The surviving finds do not attest a copy.'], correct: 2, why: 'This is a statement about survival and identification. It does not, on its own, tell us why a work is absent.', ids: ['iaa'] },
    { prompt: 'Athanasius recommends a book for instruction. Does that place it in his canon?', answers: ['No: his letter explicitly distinguishes the two categories.', 'Yes: recommendation always means canonical.', 'Only if it appears in a later printed Bible.'], correct: 0, why: 'The source supplies its own distinction. Follow that distinction before applying the categories of another place or period.', ids: ['athanasius'] }
  ];
  const q = questions[question];
  return <div className="cn-study">
    <nav className="cn-breadcrumb" aria-label="Study navigation"><Link to="/study/academic?area=texts"><ArrowLeft size={14} aria-hidden="true"/> Academic studies</Link><span>The Bible: formation & transmission</span></nav>
    <header className="cn-hero">
      <div><p className="cn-kicker">Collections · communities · centuries</p><h1>How the canon<br/><em>took shape.</em></h1></div>
      <div><p className="cn-lead">The writing stays the same.<br/>The claim changes.</p><p className="cn-intro">Before there was a table of contents, there were communities of readers. Follow how writings were gathered, used and recognized as Scripture. Each list belongs to a place, a time and a conversation.</p><a href="#canon-reception" className="cn-start">Compare the evidence <ArrowDown size={16} aria-hidden="true"/></a></div>
    </header>
    <CanonRegisters/>
    <nav className="cn-chapters" aria-label="On this page"><a href="#canon-evidence">01 <span>Read the evidence</span></a><a href="#canon-register">02 <span>Enter the timeline</span></a><a href="#canon-close">03 <span>Examine the boundaries</span></a><a href="#canon-compare">04 <span>Compare traditions</span></a></nav>

    <section id="canon-evidence" className="cn-section">
      <Heading n="01" title="Five claims that are not interchangeable.">Here, canon means a recognized collection of scriptural books. Select a kind of evidence to see what it can establish.</Heading>
      <div className="cn-evidence"><div className="cn-kind-menu" role="group" aria-label="Kinds of evidence">{dossier.evidenceKinds.map((item, i) => <button key={item.id} type="button" aria-pressed={kind === i} aria-controls="cn-kind-explanation" onClick={() => setKind(i)}><span>0{i + 1}</span>{item.id}<ArrowRight size={15} aria-hidden="true"/></button>)}</div><div id="cn-kind-explanation" className="cn-kind-explanation" aria-live="polite"><p className="cn-kicker">What does this establish?</p><h3>{dossier.evidenceKinds[kind].example}</h3><p>{dossier.evidenceKinds[kind].meaning}</p><Citations ids={dossier.evidenceKinds[kind].sourceIds}/><small>These are kinds of evidence, not a five-step ladder every book climbed.</small></div></div>
    </section>

    <section id="canon-register" className="cn-section">
      <Heading n="02" title="Put each witness back in its own time.">Explore eighteen records. Dates refer to the text, object or decision described; later copies and compilations are identified where relevant.</Heading>
      <div className="cn-era-menu" role="group" aria-label="Timeline periods">{dossier.eras.map((era, i) => <button key={era} aria-pressed={selected.era === i} onClick={() => selectRecord(dossier.records.find(r => r.era === i)!.id)}><span>{['Before & around the turn of the era','2nd–3rd centuries','4th century','Late antiquity–Reformation'][i]}</span><strong>{era}</strong></button>)}</div>
      <p className="cn-caption">Chronological register · equal spacing is schematic, not elapsed time. Overlapping and disputed dates remain visible.</p>
      <div className="cn-register"><div className="cn-record-menu" role="group" aria-label="Choose a historical record">{dossier.records.filter(r => r.era === selected.era).map(r => <button key={r.id} type="button" aria-pressed={r.id === selected.id} aria-controls="cn-record" onClick={() => selectRecord(r.id)}><i aria-hidden="true"/><span><small>{r.date}</small><strong>{names[r.id]}</strong></span><ArrowRight size={14} aria-hidden="true"/></button>)}</div>
        <article id="cn-record" className="cn-record" aria-labelledby="cn-record-heading"><div className="cn-record-top"><span className="cn-tag">{selected.kind}</span><span>{String(index + 1).padStart(2, '0')} / {dossier.records.length}</span></div><div key={selected.id} className="cn-record-body"><p className="cn-date">{selected.date}</p><p className="cn-place">{selected.place}</p><h3 id="cn-record-heading" ref={recordHeading} tabIndex={-1}>{selected.title}</h3><dl><div><dt>Evidence</dt><dd>{selected.evidence}</dd></div><div><dt>Interpretation</dt><dd>{selected.interpretation}</dd></div><div className="cn-limit"><dt>The limit</dt><dd>{selected.limit}</dd></div></dl><details className="cn-contents"><summary>Inspect the collection or passage <ChevronDown size={15} aria-hidden="true"/></summary><p className="cn-caption">Selected observations · not a complete transcription of the source.</p><ul>{selected.contents.map(item => <li key={item}>{item}</li>)}</ul></details><Citations ids={selected.sourceIds}/></div><div className="cn-record-paging"><button type="button" disabled={index === 0} onClick={() => selectRecord(dossier.records[index - 1].id)}><ArrowLeft size={15} aria-hidden="true"/> Earlier record</button><button type="button" disabled={index === dossier.records.length - 1} onClick={() => selectRecord(dossier.records[index + 1].id)}>Later record <ArrowRight size={15} aria-hidden="true"/></button></div><span className="sr-only" role="status">Selected {names[selected.id]}, {selected.date}</span></article>
      </div>
      <aside className="cn-bridge"><span className="cn-kicker">What changed over time?</span><p>Use, copying and explicit boundaries overlapped. A council could regulate an inherited collection; a bishop could distinguish books for instruction from books in his canon. <strong>No single meeting in this record selected a Bible for every tradition.</strong></p><p className="cn-caption">Compare Athanasius, the African Code and Trent above. Greek biblical collections also require attention to the particular manuscript: “the Septuagint” should not be treated as one surviving ancient volume with a universal contents page.</p><Citations ids={['carthage','sinaiticus']}/></aside>
    </section>

    <CanonInvestigations/>

    <section id="canon-trail" className="cn-section cn-trail-section"><Heading n="↳" title="Follow a writing. Watch the claim change.">The writing stays the same; the kind and reach of the evidence change. Open any stop to inspect its full record.</Heading><div className="cn-trail-controls" role="group" aria-label="Follow a writing">{(['Hermas','Esther','Revelation'] as const).map(name => <button key={name} type="button" aria-pressed={book === name} onClick={() => setBook(name)}>{name === 'Hermas' ? 'Shepherd of Hermas' : name}</button>)}</div><p className="cn-trail-note" aria-live="polite">{trailNotes[book]}</p><ol className="cn-trail">{dossier.records.filter(r => statusFor(r, book)).map(r => <li key={r.id}><button type="button" onClick={() => selectRecord(r.id, true)}><span><small>{r.date}</small><strong>{names[r.id]}</strong></span><p>{statusFor(r, book)}</p><ArrowUpRight size={17} aria-hidden="true"/><span className="sr-only">Inspect record and sources</span></button></li>)}</ol><p className="cn-caption">Only records relevant to this trail are shown. Silence in another selected record is not counted as rejection.</p></section>

    <section id="canon-compare" className="cn-section"><Heading n="04" title="Compare collections without a default Bible.">Choose two named sources. These are selected writings, not exhaustive inventories. Read each source’s scope before comparing its entries.</Heading><div className="cn-comparison-pickers">{([['left','First collection',a,setLeft],['right','Second collection',b,setRight]] as const).map(([id,label,t,set]) => <div key={id}><label htmlFor={`cn-${id}`}>{label}</label><select id={`cn-${id}`} value={t.id} onChange={e => set(e.target.value)}>{dossier.traditions.map(tradition => <option key={tradition.id} value={tradition.id}>{tradition.name}</option>)}</select><p className="cn-context">{t.context}</p><p>{t.scope}</p><details><summary>Scope & naming <ChevronDown size={14} aria-hidden="true"/></summary><p>{t.note}</p></details><Citations ids={t.sourceIds}/></div>)}</div>
      {a.id === b.id && <p className="cn-same" role="status">You are viewing the same source on both sides. Choose a different source to compare.</p>}
      <p className="cn-mobile-hint">Scroll horizontally to compare. Writing names stay in view.</p><div className="cn-table-wrap" tabIndex={0} role="region" aria-label="Selected writings comparison; scroll horizontally on small screens"><table><caption>Selected writings · {a.name} and {b.name}</caption><thead><tr><th scope="col">Writing / collection</th><th scope="col">{a.name}</th><th scope="col">{b.name}</th></tr></thead><tbody>{dossier.comparisonRows.map((row,i) => <tr key={row}><th scope="row">{row}</th><td>{a.states[i]}</td><td>{b.states[i]}</td></tr>)}</tbody></table></div><p className="cn-caption">“Not specified” and “not individually named” describe this source’s limits, not a church’s rejection. “Greek portions” refers to material in Greek forms of Esther and Daniel beyond their Hebrew/Aramaic forms. No color marks one collection as correct.</p>
      <details className="cn-counts"><summary><span>Why 24 and 39 can describe the same set of writings</span><ChevronDown size={18} aria-hidden="true"/></summary><p>Jewish and many Protestant editions group these writings differently. This arithmetic explains the count; it does not erase differences of order, interpretation or textual tradition.</p><div className="cn-count-grid"><span>Samuel, Kings, Chronicles, Ezra–Nehemiah</span><strong>4 → 8</strong><span>The Twelve Prophets</span><strong>1 → 12</strong><span>Other books</span><strong>19 → 19</strong><span>Total in these counting conventions</span><strong>24 → 39</strong></div><Citations ids={['jewish','westminster']}/></details>
    </section>

    <section className="cn-section cn-test"><div><p className="cn-kicker">05 / Try the historical reasoning</p><h2>How far can<br/><em>this evidence take you?</em></h2><p>Choose the conclusion the source supports.</p></div><div className="cn-question"><p className="cn-kicker">Question {question + 1} of {questions.length}</p><h3>{q.prompt}</h3><div role="group" aria-label="Choose a conclusion">{q.answers.map((text,i) => <button key={text} type="button" aria-pressed={answer === i} onClick={() => setAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{text}{answer === i && <Check size={17} aria-hidden="true"/>}</button>)}</div><div className="cn-feedback" aria-live="polite">{answer !== null && <><strong>{answer === q.correct ? 'That is the supported conclusion.' : 'That goes beyond what this evidence establishes.'}</strong><p>{q.why}</p><Citations ids={q.ids}/><button type="button" className="cn-next" onClick={() => { setQuestion((question + 1) % questions.length); setAnswer(null); }}>{question === questions.length - 1 ? 'Try the first question again' : 'Next question'} <ArrowRight size={15} aria-hidden="true"/></button></>}</div></div></section>

    <section id="canon-sources" className="cn-section cn-reading"><Heading n="06" title="Keep the sources in the conversation.">The links beside each record lead to the evidence. This directory records what was actually consulted.</Heading><details><summary><span><BookOpen size={18} aria-hidden="true"/> Sources & access notes · {dossier.sources.length} records</span><ChevronDown size={18} aria-hidden="true"/></summary><div className="cn-source-list">{dossier.sources.map(s => <div key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<ArrowUpRight size={13} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></a><p>{s.access}.</p></div>)}</div></details><CanonScholarship/><p className="cn-caption">Original schematic diagrams; no manuscript images reproduced. Expanded research checked 14 October 2026.</p></section>
    <footer className="cn-end"><p>Ask of every list:<br/><em>Whose collection? When? For what use?</em></p><Link to="/study/academic?area=texts">Return to Academic studies <ArrowRight size={17} aria-hidden="true"/></Link></footer>
  </div>;
}
