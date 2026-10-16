import { useState } from 'react';
import { Link } from 'react-router-dom';
import dossier from '../../../../content/academic-research/04-how-the-canon-took-shape.json';

export function CanonCitations({ ids }: { ids: string[] }) {
  return <div className="cn-citations">{ids.map(id => {
    const source = dossier.sources.find(s => s.id === id)!;
    return <a key={id} href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗<span className="sr-only"> (opens in a new tab)</span></a>;
  })}</div>;
}

export default function CanonInvestigations() {
  const [hypothesis, setHypothesis] = useState(0);
  const [clauses, setClauses] = useState(false);
  const [segment, setSegment] = useState(0);
  const [inventory, setInventory] = useState(false);
  const { jewish, boundaries, codex } = dossier.investigations;
  const reading = jewish.hypotheses[hypothesis];
  const piece = codex.segments[segment];
  return <section id="canon-close" className="cn-section cn-investigations" aria-labelledby="cn-close-title">
    <div className="cn-investigation-title"><p className="cn-kicker">The evidence room · three close investigations</p><h2 id="cn-close-title">Where the boundaries<br/><em>become visible.</em></h2><p>A list can look decisive until you ask what its categories mean. A manuscript can look complete until you inspect its ending. Slow down at these three points.</p></div>
    <article className="cn-case" aria-labelledby="cn-case-one">
      <div className="cn-case-header"><span className="cn-case-letter" aria-hidden="true">A</span><div><p className="cn-kicker">Jewish collections · authority and arrangement</p><h3 id="cn-case-one">{jewish.title}</h3></div></div>
      <div className="cn-observation-pair">{jewish.observations.map(o => <div key={o.label}><h4>{o.label}</h4><small>{o.date}</small><p>{o.text}</p><CanonCitations ids={o.sourceIds}/></div>)}</div>
      <div className="cn-hypothesis">
        <div><p className="cn-kicker">Change the explanation</p><h4>What kind of collection is 11Q5?</h4><p>The object does not change. The inference does. Compare the assumptions each reading needs.</p><div role="group" aria-label="Interpret the Psalms scroll">{jewish.hypotheses.map((h,i) => <button key={h.name} aria-pressed={hypothesis===i} aria-controls="cn-hypothesis-result" onClick={()=>setHypothesis(i)}>{h.name}<span aria-hidden="true"> →</span></button>)}</div></div>
        <div id="cn-hypothesis-result" aria-live="polite"><span className="cn-tag">Interpretation · not a recovered label</span><h4>{reading.claim}</h4><p><strong>It needs:</strong> {reading.requires}</p><p className="cn-inference"><strong>What follows:</strong> {reading.result}</p><p className="cn-caption">Neither option is proved merely by comparing this scroll with a modern Psalter.</p></div>
      </div>
      <div className="cn-argument"><p>{jewish.debate}</p><p>{jewish.correction}</p><CanonCitations ids={['loc-psalms','lim-writings','mroczek']}/></div>
      <div className="cn-rabbinic"><h4>And what about a council at Jamnia?</h4><div><p>{jewish.rabbinic}</p><p>{jewish.yavneh}</p><CanonCitations ids={['mishnah','lim-writings']}/><Link className="cn-inline-link" to="/study/dead-sea-scrolls">Explore the Dead Sea Scrolls study →</Link></div></div>
    </article>

    <article className="cn-case" aria-labelledby="cn-case-two">
      <div className="cn-case-header"><span className="cn-case-letter" aria-hidden="true">B</span><div><p className="cn-kicker">Eusebius · a conditional classification</p><h3 id="cn-case-two">When a writing appears in two categories.</h3></div></div>
      <div className="cn-double-entry"><div><p className="cn-kicker">A source that resists one box</p><h4>Revelation appears twice.</h4><p>{boundaries.eusebius.intro}</p><button aria-expanded={clauses} aria-controls="cn-eusebius-pair" onClick={()=>setClauses(!clauses)}>{clauses?'Return to the first clause':'Read the second clause too'} <span aria-hidden="true">→</span></button></div><div id="cn-eusebius-pair" aria-live="polite"><div className="cn-clause"><small>{boundaries.eusebius.clauses[0].label}</small><blockquote>“{boundaries.eusebius.clauses[0].excerpt}”</blockquote><p>{boundaries.eusebius.clauses[0].text}</p></div><div className={`cn-clause ${clauses?'':'cn-clause-unread'}`}><small>{clauses?boundaries.eusebius.clauses[1].label:'Read on before assigning a status'}</small><blockquote>{clauses?`“${boundaries.eusebius.clauses[1].excerpt}”`:null}</blockquote><p>{clauses?boundaries.eusebius.clauses[1].text:'A conditional placement is not an unqualified verdict.'}</p></div></div></div>
      {clauses && <div className="cn-eusebius-note"><p>{boundaries.eusebius.explanation}</p><CanonCitations ids={boundaries.eusebius.sourceIds}/></div>}
      {!clauses && <CanonCitations ids={boundaries.eusebius.sourceIds}/>}
    </article>

    <article className="cn-case" aria-labelledby="cn-case-three">
      <div className="cn-case-header"><span className="cn-case-letter" aria-hidden="true">C</span><div><p className="cn-kicker">The material witness · survival and reconstruction</p><h3 id="cn-case-three">{codex.title}</h3></div></div>
      <p className="cn-case-intro">{codex.shelfmark}. Inspect the final surviving works, then add what the contents list names. A dashed boundary marks a different kind of evidence—not a lower level of religious value.</p>
      <label className="cn-inventory-switch"><input type="checkbox" checked={inventory} onChange={e=>{setInventory(e.target.checked);if(!e.target.checked&&segment===3)setSegment(0);}}/> Include the contents-list evidence</label>
      <div className="cn-codex-strip" role="group" aria-label="Inspect the end of Alexandrinus">{codex.segments.map((s,i)=>(inventory||i<3)&&<button key={s.id} className={`cn-leaf cn-leaf-${s.style}`} aria-pressed={segment===i} aria-controls="cn-leaf-note" onClick={()=>setSegment(i)}><small>{s.location}</small><strong>{s.name}</strong><span>{s.state}</span></button>)}</div>
      <div className="cn-leaf-note" id="cn-leaf-note" aria-live="polite"><strong>{piece.name}</strong><p>{piece.note}</p></div>
      <p className="cn-caption">{codex.limits}</p><CanonCitations ids={codex.sourceIds}/>
      <div className="cn-syriac"><div><p className="cn-kicker">Another language, another collection</p><h4>The Peshitta’s twenty-two</h4><p>The Syriac Peshitta became the standard version around 400. Its New Testament collection does not contain the five writings shown here. This is a version’s contents, not a statement that every later Syriac church has the same boundaries.</p><CanonCitations ids={['peshitta','syriac-mss']}/></div><div><p className="cn-caption">Not represented in the twenty-two-book version</p><ul>{['2 Peter','2 John','3 John','Jude','Revelation'].map(b=><li key={b}>{b}</li>)}</ul><p>Compare this with Athanasius’s twenty-seven, not with an assumed universal starting point. A translation’s history and a council’s jurisdiction answer different questions.</p></div></div>
    </article>
  </section>;
}

export function CanonScholarship() {
  return <div className="cn-scholarship"><h3>Follow the arguments, not just the bibliography.</h3>{dossier.scholarshipGuide.map(w=><div className="cn-scholarship-row" key={w.question}><h4>{w.question}</h4><div><strong>{w.work}</strong><p>{w.contribution}</p><small>{w.access}</small><CanonCitations ids={w.sourceIds}/></div></div>)}<div className="cn-research-limits"><h4>What remains open</h4><p>{dossier.investigations.jewish.limits}</p><p>{dossier.expansionLimits.join(' ')}</p></div></div>;
}
