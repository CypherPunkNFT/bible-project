import { useSearchParams } from 'react-router-dom';
import dossier from '../../../../content/academic-research/04-how-the-canon-took-shape.json';
import { CanonCitations } from './CanonInvestigations';
import './registers.css';

const { boundaries } = dossier.investigations;
const findings = [
  'Wisdom and Sirach enter Augustine’s canon. Athanasius recommends them for instruction outside his canon; Jerome distinguishes their edifying use from doctrinal authority.',
  'Esther is canonical in Augustine’s enumeration and instructional in Athanasius’s letter. Jerome’s selected prologue does not discuss it: silence here cannot establish exclusion.',
  'Hermas is recommended outside Athanasius’s canon. It is not enumerated by Augustine and not addressed in Jerome’s selected prologue. Those last two claims are not interchangeable.'
];
const statusClass = (label: string) => label === 'Canonical' ? 'canon' : /^(Instruction|Edifying)/.test(label) ? 'instruction' : 'silence';
const valid = (value: string | null) => value !== null && /^[0-2]$/.test(value);

export default function CanonRegisters() {
  const [params, setParams] = useSearchParams();
  const writing = valid(params.get('writing')) ? Number(params.get('writing')) : 0;
  const witness = valid(params.get('witness')) ? Number(params.get('witness')) : null;
  const choose = (book: number, person: number | null) => {
    const next = new URLSearchParams(params);
    next.set('writing', String(book));
    if (person === null) next.delete('witness'); else next.set('witness', String(person));
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const close = () => {
    choose(writing, null);
    requestAnimationFrame(() => {
      const origin = document.getElementById(`cn-entry-${witness}-${writing}`);
      origin?.focus({ preventScroll: true });
      const box = origin?.getBoundingClientRect();
      if (box && (box.bottom < 80 || box.top > window.innerHeight)) origin?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  };
  const w = witness === null ? null : boundaries.witnesses[witness];
  const record = witness === null ? null : dossier.records.find(r => r.id === ['athanasius', 'augustine', 'jerome'][witness]);
  return <section id="canon-reception" className="cn-reception" aria-labelledby="cn-reception-title">
    <div className="cn-r-heading"><div><p className="cn-kicker">Begin with a comparison · AD 367–c. 400</p><h2 id="cn-reception-title">The same writings. <em>Different boundaries.</em></h2></div><p>Three selected passages.<br/>No universal baseline.</p></div>
    <div className="cn-r-workspace">
      <div className="cn-r-controls"><div><span className="cn-kicker">Follow a writing</span><div role="group" aria-label="Compare ancient judgments">{boundaries.books.map((book, i) => <button key={book} aria-pressed={writing === i} onClick={() => choose(i, witness)}>{book}</button>)}</div></div><button className="cn-r-reset" onClick={() => choose(0, null)}>Reset view ↺</button></div>
      <div className="cn-r-legend" aria-label="Diagram key"><span><i className="cn-r-key canon" aria-hidden="true"/>Canonical</span><span><i className="cn-r-key instruction" aria-hidden="true"/>Instruction / edifying reading</span><span><i className="cn-r-key silence" aria-hidden="true"/>Not enumerated / not addressed</span></div>
      <p className="cn-r-phone">One writing across three witnesses. Change the writing above to compare another.</p>
      <div className="cn-r-folios">{boundaries.witnesses.map((person, i) => <article className="cn-r-folio" key={person.name}>
        <header><p className="cn-r-number"><span>Selected witness</span><span>{['A', 'B', 'C'][i]}</span></p><h3>{person.name}</h3><p className="cn-r-date">{person.date}</p></header>
        <div className="cn-r-entries">{person.states.map((state, j) => <button id={`cn-entry-${i}-${j}`} key={j} className={`cn-r-entry ${j === writing ? 'match' : ''}`} aria-controls="cn-r-inspection" aria-expanded={witness === i && writing === j} aria-label={`${person.name}: ${boundaries.books[j]}. ${state.label}. Inspect passage`} onClick={() => choose(j, i)}><span className={`cn-r-mark ${statusClass(state.label)}`} aria-hidden="true"/><span><strong>{boundaries.books[j]}</strong><small>{state.label}</small></span><span className="cn-r-down" aria-hidden="true">↓</span></button>)}</div>
        <footer>{person.passage}</footer>
      </article>)}</div>
      <div className="cn-r-caption"><span>Schematic registers · not manuscript facsimiles or complete book lists.</span><span>Each mark represents one writing or named pair in a selected passage.</span></div>
      <div className="cn-r-finding"><span className="cn-kicker">Read across</span><p aria-live="polite">{findings[writing]}</p></div>
      <div id="cn-r-inspection" hidden={!w} className="cn-r-inspection" onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); close(); } }}>
        {w && <><header><div><p className="cn-kicker">{w.date} · {w.passage}</p><h3>{w.name} / {boundaries.books[writing]}</h3></div><button aria-label="Close source inspection" onClick={close}>×</button></header>
          <div className="cn-r-inspection-grid"><div><p className="cn-kicker">What this passage establishes</p><p>{w.states[writing].text}</p><blockquote>“{w.excerpt}”</blockquote><small>{w.translation} · excerpt from this passage’s general criterion</small></div><div><p className="cn-kicker">Read within its limits</p><p>{w.principle} {record?.limit}</p><CanonCitations ids={w.sourceIds}/></div></div></>}
      </div>
    </div>
    <CanonCitations ids={['athanasius', 'augustine', 'jerome-solomon']}/>
    <p className="cn-r-bridge">{boundaries.insight}</p>
  </section>;
}
