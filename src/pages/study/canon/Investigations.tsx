// "Where the boundaries become visible." (approved mock-up D: js/investigations.js): three close investigations, every
// line of the earlier page kept. A: the Psalms scroll and two explanations of it, then the Jamnia question. B: Eusebius
// placing Revelation twice. C: the end of Codex Alexandrinus as a strip of leaves, beside a real photograph of one page.
import { useState } from "react";
import { Link } from "react-router-dom";
import { SectionHead } from "@/pages/study/manuscripts/parts";
import { D, pictureFor, pictureWhat } from "./model";
import { Cite, Credit, PictureImg } from "./parts";

const { jewish, boundaries, codex } = D.investigations;
const E = boundaries.eusebius;

function CaseHead({ letter, kicker, title }: { letter: string; kicker: string; title: string }) {
  return <div className="ci-head"><span className="ci-letter" aria-hidden="true">{letter}</span><div><p className="kicker">{kicker}</p><h3>{title}</h3></div></div>;
}

function CaseA() {
  const [h, setH] = useState(0);
  const r = jewish.hypotheses[h];
  return <article className="ci-case" data-case="a"><CaseHead letter="A" kicker="Jewish collections · authority and arrangement" title={jewish.title} />
    <div className="ci-pair">{jewish.observations.map((o) => <div key={o.label}><h4>{o.label}</h4><small>{o.date}</small><p>{o.text}</p><Cite ids={o.sourceIds} /></div>)}</div>
    <div className="ci-hyp"><div><p className="kicker">Change the explanation</p><h4>What kind of collection is 11Q5?</h4><p>The object does not change. The inference does. Compare the assumptions each reading needs.</p>
      <div className="ct-sort" role="radiogroup" aria-label="Interpret the Psalms scroll">{jewish.hypotheses.map((x, i) =>
        <button key={x.name} type="button" role="radio" aria-checked={i === h} onClick={() => setH(i)}>{x.name}</button>)}</div></div>
      <div className="ci-hyp-out" aria-live="polite"><span className="cn-tag">Interpretation · not a recovered label</span><h4>{r.claim}</h4><p><strong>It needs:</strong> {r.requires}</p>
        <p className="ci-follows"><strong>What follows:</strong> {r.result}</p><p className="cn-caption">Neither option is proved merely by comparing this scroll with a modern Psalter.</p></div></div>
    <div className="ci-argument"><p>{jewish.debate}</p><p>{jewish.correction}</p><Cite ids={["loc-psalms", "lim-writings", "mroczek"]} /></div>
    <div className="ci-rabbinic"><h4>And what about a council at Jamnia?</h4><div><p>{jewish.rabbinic}</p><p>{jewish.yavneh}</p><Cite ids={["mishnah", "lim-writings"]} />
      <Link className="cn-link" to="/study/dead-sea-scrolls">Explore the Dead Sea Scrolls study →</Link></div></div>
  </article>;
}

function CaseB() {
  const [open, setOpen] = useState(false);
  const [one, two] = E.clauses;
  return <article className="ci-case" data-case="b"><CaseHead letter="B" kicker="Eusebius · a conditional classification" title="When a writing appears in two categories." />
    <div className="ci-double"><div><p className="kicker">A source that resists one box</p><h4>Revelation appears twice.</h4><p>{E.intro}</p>
      <button type="button" className="cn-link ci-clauses" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Return to the first clause →" : "Read the second clause too →"}</button></div>
      <div className="ci-clause-pair" aria-live="polite"><div className="ci-clause"><small>{one.label}</small><blockquote>“{one.excerpt}”</blockquote><p>{one.text}</p></div>
        <div className={`ci-clause${open ? "" : " ci-unread"}`}><small>{open ? two.label : "Read on before assigning a status"}</small>{open && <blockquote>“{two.excerpt}”</blockquote>}
          <p>{open ? two.text : "A conditional placement is not an unqualified verdict."}</p></div></div></div>
    <div className="ci-eusebius">{open && <p>{E.explanation}</p>}<Cite ids={E.sourceIds} /></div>
  </article>;
}

function CaseC() {
  const [segment, setSegment] = useState(0);
  const [listed, setListed] = useState(false);
  const p = pictureFor.get("alexandrinus"), s = codex.segments[segment];
  return <article className="ci-case" data-case="c"><CaseHead letter="C" kicker="The material witness · survival and reconstruction" title={codex.title} />
    <p className="ci-intro">{codex.shelfmark}. Inspect the final surviving works, then add what the contents list names. A dashed boundary marks a different kind of evidence—not a lower level of religious value.</p>
    <div className="ci-codex">{p && <figure className="ci-photo"><button type="button" data-open="alexandrinus" aria-label="Open the Codex Alexandrinus record"><PictureImg p={p} /></button>
      <figcaption>A surviving page of the codex ({pictureWhat(p).replace(/^Codex Alexandrinus\s*/, "")}, from Mark), not one of the leaves below. <Credit p={p} /></figcaption></figure>}
      <div className="ci-codex-work"><label className="ci-switch"><input type="checkbox" className="ci-inventory" checked={listed}
        onChange={(e) => { setListed(e.target.checked); if (!e.target.checked && segment === 3) setSegment(0); }} /> Include the contents-list evidence</label>
        <div className="ci-strip" role="group" aria-label="Inspect the end of Alexandrinus">{codex.segments.map((x, i) =>
          <button key={x.name} type="button" className={`ci-leaf ci-leaf-${x.style}`} data-s={i} hidden={i === 3 && !listed} aria-pressed={i === segment} onClick={() => setSegment(i)}>
            <small>{x.location}</small><b>{x.name}</b><span>{x.state}</span></button>)}</div>
        <div className="ci-leaf-note" aria-live="polite"><strong>{s.name}</strong><p>{s.note}</p></div>
        <p className="cn-caption">{codex.limits}</p><Cite ids={codex.sourceIds} /></div></div>
    <div className="ci-syriac"><div><p className="kicker">Another language, another collection</p><h4>The Peshitta’s twenty-two</h4><p>The Syriac Peshitta became the standard version around 400. Its New Testament collection does not contain the five writings shown here. This is a version’s contents, not a statement that every later Syriac church has the same boundaries.</p><Cite ids={["peshitta", "syriac-mss"]} /></div>
      <div><p className="cn-caption">Not represented in the twenty-two-book version</p><ul>{["2 Peter", "2 John", "3 John", "Jude", "Revelation"].map((b) => <li key={b}>{b}</li>)}</ul>
        <p>Compare this with Athanasius’s twenty-seven, not with an assumed universal starting point. A translation’s history and a council’s jurisdiction answer different questions.</p></div></div>
  </article>;
}

export function Investigations({ num }: { num: string }) {
  return <>
    <SectionHead num={num} kicker="The evidence room · three close investigations" title={<>Where the boundaries <em>become visible</em></>}
      lead="A list can look decisive until you ask what its categories mean. A manuscript can look complete until you inspect its ending. Slow down at these three points." />
    <CaseA /><CaseB /><CaseC />
  </>;
}
