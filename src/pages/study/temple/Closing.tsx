// 07 Claims: four things often said, each tested from the sources, with a test the reader answers. 08 Where it stops: the words
// easily confused, how far the page reaches, its neighbours (linked where their page exists), the reading trail with what was read,
// the pictures not shown, the closing question, and the way back to Academic studies.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { D, linkFor, type Claim } from "./model";
import { Cite, Head, Prose, Refs, ThreeParts } from "./parts";

function Test({ claim }: { claim: Claim }) {
  const [picked, setPicked] = useState<number | null>(null);
  const option = picked === null ? null : claim.test.options[picked];
  return <div className="tw-test">
    <p className="tw-test-q"><Prose text={claim.test.question} /></p>
    <div className="tw-test-options" role="group" aria-label="Choose an answer">
      {claim.test.options.map((o, i) => <button key={plainText(o.text)} type="button" aria-pressed={picked === i} onClick={() => setPicked(i)}><Checked text={o.text} /></button>)}
    </div>
    <p className="tw-test-why" aria-live="polite">{option && <><b>{option.right ? "The evidence supports this." : "The evidence does not support this."}</b> <Prose text={option.why} /></>}</p>
  </div>;
}

export function Claims() {
  return <>
    <Head num="07" kicker="Claims" title="Four things often said." turn="One test each." />
    <ol className="tw-claims">
      {D.claims.map((c, i) => <li key={c.id}>
        <p className="tw-claim"><b>{String(i + 1).padStart(2, "0")}</b><Checked text={c.claim} /></p>
        <h3><Checked text={c.head} /></h3>
        <ThreeParts evidence={c.evidence} inference={c.inference} limit={c.limit} />
        <Refs labels={c.verses} />
        <Cite ids={c.sources} />
        <Test claim={c} />
      </li>)}
    </ol>
  </>;
}

/** A neighbouring study's name, linked where its page exists. */
function Neighbour({ name }: { name: string }) {
  const to = linkFor(name);
  return to ? <Link className="tw-link" to={to}>{name}</Link> : <span>{name}</span>;
}

export function Closing() {
  return <>
    <Head num="08" kicker="Where it stops" title="A selection, stated." turn="The room is empty now." />
    <div className="tw-words">
      <p className="tw-kicker">Words to keep apart</p>
      <dl>{D.confusedWords.map((w) => <div key={plainText(w.word)}><dt><Checked text={w.word} /></dt><dd><Prose text={w.note} /></dd></div>)}</dl>
    </div>
    <div className="tw-reach">
      <div>
        <p className="tw-kicker">How far this page reaches</p>
        <ul>{D.reach.map((r) => <li key={plainText(r)}><Prose text={r} /></li>)}</ul>
        <p className="tw-kicker tw-gap">What it covers</p>
        <p className="tw-para"><Prose text={D.boundaries.in} /></p>
      </div>
      <div>
        <p className="tw-kicker">What belongs to other studies</p>
        <ul>{D.boundaries.out.map((o) => <li key={plainText(o)}><Prose text={o} /></li>)}</ul>
        <p className="tw-kicker tw-gap">Neighbours</p>
        <p className="tw-neighbours">{[...D.links.academic, ...D.links.theology].map((n) => <Neighbour key={n} name={n} />)}</p>
        <p className="tw-caption">A name without a link is a study whose page is not built yet.</p>
      </div>
    </div>
    <div className="tw-trail">
      <p className="tw-kicker">The reading trail, and what was read</p>
      <ul>{D.sources.map((s) => <li key={s.id}>
        <p className="tw-src"><Checked text={s.title} /></p>
        <p className="tw-src-q"><Checked text={s.answers} /></p>
        <p className="tw-src-read"><small>{plainText(s.kind)}</small> · <Checked text={s.read} /></p>
      </li>)}</ul>
      <p className="tw-caption">The sources are named, not linked: this page makes no link outside the site.</p>
    </div>
    <div className="tw-pictures">
      <p className="tw-kicker">Pictures not shown</p>
      <ul>{D.pictures.map((p) => <li key={p.id}><Checked text={p.subject} /> <small>· not shown until its licence is confirmed: <Checked text={p.note} /></small></li>)}</ul>
    </div>
    <div className="tw-closing">
      <p>Which witness told me this, and how near was it to the temple?</p>
      <Link to="/study/academic">Back to Academic studies <span aria-hidden="true">→</span></Link>
    </div>
  </>;
}
